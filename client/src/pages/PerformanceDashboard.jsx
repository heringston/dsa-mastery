import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PerformanceDashboard = () => {
  const [analysis, setAnalysis] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommending, setRecommending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const [analysisRes, recRes] = await Promise.all([
          api.get('/performance/analysis'),
          api.get('/performance/recommendation')
        ]);
        
        setAnalysis(analysisRes.data);
        setRecommendation(recRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load performance data');
        setLoading(false);
      }
    };
    fetchPerformanceData();
  }, []);

  const handleStartRecommendation = async () => {
    if (!recommendation?.contestConfig) return;
    
    setRecommending(true);
    try {
      const res = await api.post('/contests/recommended', recommendation.contestConfig);
      navigate(`/contests/${res.data.contest.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start recommended contest');
      setRecommending(false);
    }
  };

  const handleStartSystemContest = async () => {
    setRecommending(true);
    try {
      const res = await api.post('/contests/generate', { numProblems: 5, durationMinutes: 60 });
      navigate(`/contests/${res.data.contest.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate contest');
      setRecommending(false);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (error) return <div className="container" style={{ marginTop: '2rem', color: 'var(--error)' }}>{error}</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Analytics</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Based on {analysis.overall.totalSubmissions} submissions
        </div>
      </div>

      {/* OVERALL STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Accuracy</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {analysis.overall.accuracy}%
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Problems Solved</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {analysis.overall.totalSolved} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ {analysis.overall.totalAttempted}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN */}
        <div>
          {/* RECOMMENDATION ENGINE */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recommended Practice</h2>
              <span style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, background: 'var(--bg-tertiary)' }}>
                {recommendation.type === 'WEAKNESS_TARGETED' ? 'Targeted' : 'Balanced'}
              </span>
            </div>
            
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>{recommendation.message}</p>
            
            {recommendation.reasons && recommendation.reasons.length > 0 && (
              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Focus Areas:</strong>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, color: 'var(--text-secondary)' }}>
                  {recommendation.reasons.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>—</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {recommendation.contestConfig ? (
              <button className="btn-primary" onClick={handleStartRecommendation} disabled={recommending} style={{ width: '100%' }}>
                {recommending ? 'Generating...' : 'Start Recommended Set'}
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleStartSystemContest} disabled={recommending} style={{ width: '100%' }}>
                {recommending ? 'Generating...' : 'Start Balanced Set'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Weak Patterns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {analysis.weakPatterns.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No specific weaknesses identified yet.</p>
            ) : (
              analysis.weakPatterns.map((w, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{w.pattern}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{w.accuracy}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w.accuracy}%`, background: 'var(--text-muted)' }}></div>
                  </div>
                </div>
              ))
            )}
            {analysis.weakTopics.map((w, i) => (
                <div key={'t'+i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{w.topic} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Topic)</span></span>
                    <span style={{ color: 'var(--text-secondary)' }}>{w.accuracy}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w.accuracy}%`, background: 'var(--text-muted)' }}></div>
                  </div>
                </div>
              ))}
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Strong Patterns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analysis.strongPatterns.length === 0 && analysis.strongTopics.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Keep practicing to build your strengths!</p>
            ) : (
              analysis.strongPatterns.map((w, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{w.pattern}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{w.accuracy}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w.accuracy}%`, background: 'var(--text-primary)' }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceDashboard;
