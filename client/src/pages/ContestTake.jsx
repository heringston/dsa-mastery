import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';

// Default fallback templates when problem has no codeConfiguration
const DEFAULT_TEMPLATES = {
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Read input and write your solution here\n        \n    }\n}`,
  python: `# Read input and write your solution here\nimport sys\n\ndef solve():\n    pass\n\nsolve()`,
  javascript: `// Read input and write your solution here\nconst input = require('fs').readFileSync('/dev/stdin', 'utf8');\nconst lines = input.split('\\n');\n`,
  cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Read input and write your solution here\n    \n    return 0;\n}`
};

/**
 * Get the starter template for a problem+language.
 * If the problem has codeConfiguration for this language, use its template.
 * Otherwise, fall back to a raw stdin/stdout template.
 */
function getTemplate(problem, language) {
  if (problem.codeConfiguration && problem.codeConfiguration[language]) {
    return problem.codeConfiguration[language].template;
  }
  return DEFAULT_TEMPLATES[language] || '';
}

const ContestTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [codes, setCodes] = useState({});
  const [language, setLanguage] = useState('java');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await api.get(`/contests/${id}`);
        setContest(res.data.contest);
        
        // Initialize codes with problem-specific templates for all languages
        const initialCodes = {};
        res.data.contest.Problems.forEach(p => {
          initialCodes[p.id] = {
            java: getTemplate(p, 'java'),
            python: getTemplate(p, 'python'),
            javascript: getTemplate(p, 'javascript'),
            cpp: getTemplate(p, 'cpp'),
          };
        });
        setCodes(initialCodes);
        
        if (res.data.contest.status === 'IN_PROGRESS') {
          calculateTimeLeft(res.data.contest.startedAt, res.data.contest.durationMinutes);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load contest');
        setLoading(false);
      }
    };
    fetchContest();
  }, [id]);

  useEffect(() => {
    if (contest && contest.status === 'IN_PROGRESS' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (contest && contest.status === 'IN_PROGRESS' && timeLeft <= 0 && !loading) {
      handleEndContest();
    }
  }, [timeLeft, contest, loading]);

  const calculateTimeLeft = (startedAt, durationMinutes) => {
    const endTime = new Date(startedAt).getTime() + durationMinutes * 60000;
    const remaining = Math.floor((endTime - Date.now()) / 1000);
    setTimeLeft(remaining > 0 ? remaining : 0);
  };

  const handleStart = async () => {
    try {
      const res = await api.post(`/contests/${id}/start`);
      setContest(res.data.contest);
      calculateTimeLeft(res.data.contest.startedAt, res.data.contest.durationMinutes);
    } catch (err) {
      setError('Failed to start contest');
    }
  };

  const handleEndContest = async () => {
    try {
      await api.post(`/contests/${id}/end`);
      navigate(`/contests/${id}/result`);
    } catch (err) {
      setError('Failed to end contest');
    }
  };

  const handleCodeChange = (value) => {
    const currProb = contest.Problems[currentProblemIdx];
    setCodes({ 
      ...codes, 
      [currProb.id]: {
        ...codes[currProb.id],
        [language]: value
      } 
    });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
  };

  const handleProblemSwitch = (idx) => {
    setCurrentProblemIdx(idx);
    setSubmissionResult(null);
    setSubmitStatus(null);
  };

  const handleSubmitCode = async () => {
    const currProb = contest.Problems[currentProblemIdx];
    console.log('[Submit] Starting submit for problem:', currProb.id, 'language:', language);
    console.log('[Submit] Source code length:', codes[currProb.id]?.[language]?.length);
    setSubmitStatus('submitting');
    setSubmissionResult(null);
    
    try {
      console.log('[Submit] Sending POST /submissions...');
      const res = await api.post('/submissions', {
        contestId: contest.id,
        problemId: currProb.id,
        language,
        sourceCode: codes[currProb.id][language]
      });
      console.log('[Submit] Got response:', res.data);
      setSubmissionResult(res.data.submission);
      setSubmitStatus('success');
    } catch (err) {
      console.error('[Submit] Error:', err);
      console.error('[Submit] Response:', err.response?.data);
      setSubmissionResult({ 
        status: 'INTERNAL_ERROR', 
        errorMessage: err.response?.data?.error || err.message,
        passedTestCases: 0,
        totalTestCases: 0
      });
      setSubmitStatus('error');
    }
  };

  const handleRunCode = async () => {
    const currProb = contest.Problems[currentProblemIdx];
    console.log('[Run] Starting run for problem:', currProb.id, 'language:', language);
    console.log('[Run] Source code length:', codes[currProb.id]?.[language]?.length);
    setSubmitStatus('running');
    setSubmissionResult(null);
    
    try {
      console.log('[Run] Sending POST /submissions/run...');
      const res = await api.post('/submissions/run', {
        problemId: currProb.id,
        language,
        sourceCode: codes[currProb.id][language]
      });
      
      console.log('[Run] Got response:', res.data);
      const results = res.data.results;
      const passedCount = results.filter(r => r.passed).length;
      
      const hasCompileError = results.some(r => r.status === 'COMPILATION_ERROR');
      const hasRuntimeError = results.some(r => r.status === 'RUNTIME_ERROR');
      const hasTLE = results.some(r => r.status === 'TIME_LIMIT_EXCEEDED');
      
      let overallStatus = 'ACCEPTED';
      let errorMessage = '';
      
      if (hasCompileError) {
        overallStatus = 'COMPILATION_ERROR';
        errorMessage = results.find(r => r.status === 'COMPILATION_ERROR')?.compileOutput || '';
      } else if (passedCount !== results.length) {
        overallStatus = 'WRONG_ANSWER';
        const firstFail = results.find(r => !r.passed);
        if (firstFail) {
          errorMessage = `Expected: ${firstFail.expectedOutput}\nGot: ${firstFail.stdout}`;
        }
      } else if (hasTLE) {
        overallStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (hasRuntimeError) {
        overallStatus = 'RUNTIME_ERROR';
        errorMessage = results.find(r => r.status === 'RUNTIME_ERROR')?.stderr || '';
      }
      
      console.log('[Run] Setting result:', overallStatus, passedCount, '/', results.length);
      setSubmissionResult({
        status: overallStatus,
        passedTestCases: passedCount,
        totalTestCases: results.length,
        errorMessage,
        executionTime: results[0]?.time,
        memoryUsage: results[0]?.memory,
        isRun: true,
        results: results
      });
      setSubmitStatus('success');
    } catch (err) {
      console.error('[Run] Error:', err);
      console.error('[Run] Response:', err.response?.data);
      setSubmissionResult({ 
        status: 'INTERNAL_ERROR', 
        errorMessage: err.response?.data?.error || err.message,
        passedTestCases: 0,
        totalTestCases: 0,
        isRun: true
      });
      setSubmitStatus('error');
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (error) return <div className="container" style={{ marginTop: '2rem', color: 'var(--error)' }}>{error}</div>;

  if (contest.status === 'COMPLETED') {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <h2>This contest has already ended.</h2>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate(`/contests/${id}/result`)}>
          View Results
        </button>
      </div>
    );
  }

  if (contest.status === 'PENDING') {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', background: 'var(--bg-primary)' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>{contest.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
            Duration: {contest.durationMinutes} Minutes <br />
            Problems: {contest.Problems.length}
          </p>
          <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', fontSize: '0.875rem', background: 'var(--bg-tertiary)' }}>
            The timer cannot be paused once started.
          </div>
          <button className="btn-primary" onClick={handleStart} style={{ width: '100%' }}>
            Start Session
          </button>
        </div>
      </div>
    );
  }

  const currProb = contest.Problems[currentProblemIdx];
  const hasConfig = currProb.codeConfiguration && currProb.codeConfiguration[language];

  const getStatusColor = (status) => {
    if (status === 'ACCEPTED') return 'var(--success)';
    if (status === 'PENDING') return 'var(--warning)';
    return 'var(--error)';
  };

  // Determine Monaco language id
  const monacoLang = language === 'cpp' ? 'cpp' : language;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {contest.Problems.map((p, idx) => (
            <button 
              key={p.id}
              onClick={() => handleProblemSwitch(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: currentProblemIdx === idx ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentProblemIdx === idx ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: timeLeft < 300 ? 'var(--error)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
            {formatTime(timeLeft)}
          </div>
          <button className="btn-secondary" onClick={handleEndContest} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>End Session</button>
        </div>
      </div>

      {/* Main Content Split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Problem Description */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{currentProblemIdx + 1}. {currProb.title}</h2>
            <span style={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              color: currProb.difficulty === 'EASY' ? 'var(--success)' : currProb.difficulty === 'MEDIUM' ? 'var(--warning)' : 'var(--error)'
            }}>
              {currProb.difficulty}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <span style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{currProb.Topic?.name}</span>
            {currProb.Patterns?.map(p => (
              <span key={p.id} style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{p.name}</span>
            ))}
            {hasConfig && (
              <span style={{ border: '1px solid var(--success)', color: 'var(--success)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Function Mode</span>
            )}
            {!hasConfig && (
              <span style={{ border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>IO Mode</span>
            )}
          </div>
          
          <div style={{ whiteSpace: 'pre-wrap', marginBottom: '2.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {currProb.description}
          </div>
          
          {currProb.constraints && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Constraints</h3>
              <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                {currProb.constraints}
              </pre>
            </div>
          )}
          
          {(currProb.sampleInput || currProb.sampleOutput) && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sample Data</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input</strong>
                  <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    {currProb.sampleInput}
                  </pre>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Output</strong>
                  <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    {currProb.sampleOutput}
                  </pre>
                </div>
              </div>
              {currProb.explanation && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Explanation:</strong> {currProb.explanation}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Side: Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          
          {/* Editor Header */}
          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              style={{ width: 'auto', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
            </select>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                onClick={handleRunCode}
                disabled={submitStatus === 'submitting' || submitStatus === 'running'}
              >
                {submitStatus === 'running' ? 'Running...' : 'Run Code'}
              </button>
              
              <button 
                className="btn-primary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                onClick={handleSubmitCode}
                disabled={submitStatus === 'submitting' || submitStatus === 'running'}
              >
                {submitStatus === 'submitting' ? 'Judging...' : 'Submit Code'}
              </button>
            </div>
          </div>
          
          {/* Monaco Editor */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={codes[currProb.id]?.[language] || ''}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 }
              }}
            />
          </div>
          
          {/* Submission Result Area */}
          {submissionResult && (
            <div style={{ 
              maxHeight: '300px',
              minHeight: '150px',
              flexShrink: 0,
              background: 'var(--bg-primary)', 
              borderTop: '1px solid var(--border-color)',
              padding: '1rem 1.5rem',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: getStatusColor(submissionResult.status), marginBottom: '0.5rem' }}>
                {submissionResult.isRun ? 'Run Result: ' : 'Submission: '} 
                {submissionResult.status?.replace(/_/g, ' ') || 'Unknown'}
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <span>Test Cases: {submissionResult.passedTestCases ?? 0} / {submissionResult.totalTestCases ?? 0}</span>
                {submissionResult.executionTime && <span>Time: {submissionResult.executionTime}s</span>}
                {submissionResult.memoryUsage && <span>Memory: {Math.round(submissionResult.memoryUsage)}KB</span>}
              </div>
              
              {/* Show generic error message for Submits OR if it's a Run but there are no granular results (like Network Error, Internal Error, Compilation Error) */}
              {submissionResult.errorMessage && (!submissionResult.isRun || !submissionResult.results || submissionResult.status === 'COMPILATION_ERROR') && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                    {submissionResult.status === 'COMPILATION_ERROR' ? 'Compilation Error:' : 'Details:'}
                  </strong>
                  <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem', color: 'var(--error)', overflowX: 'auto', fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'Geist Mono, monospace' }}>
                    {submissionResult.errorMessage}
                  </pre>
                </div>
              )}

              {/* Show detailed per-test-case results if available (for Run Code only) */}
              {submissionResult.isRun && submissionResult.results && submissionResult.status !== 'COMPILATION_ERROR' && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {submissionResult.results.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Test Case {i + 1}</strong>
                        <span style={{ color: r.passed ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <strong>Your Output:</strong>
                          <pre style={{ margin: 0, marginTop: '0.3rem', padding: '0.5rem', background: '#1e1e1e', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {r.stdout || '(no output)'}
                          </pre>
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong>Expected:</strong>
                          <pre style={{ margin: 0, marginTop: '0.3rem', padding: '0.5rem', background: '#1e1e1e', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {r.expectedOutput || '(none)'}
                          </pre>
                        </div>
                      </div>
                      {r.stderr && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong style={{ color: 'var(--error)' }}>Error:</strong>
                          <pre style={{ margin: 0, marginTop: '0.3rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ff8a8a', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {r.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ContestTake;
