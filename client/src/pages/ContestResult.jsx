import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ContestResult = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/contests/${id}/result`);
        setResult(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load contest results');
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (error) return <div className="container" style={{ marginTop: '2rem', color: 'var(--error)' }}>{error}</div>;

  const { contest, summary, problemResults } = result;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{contest.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Completed on {new Date(contest.endedAt || contest.createdAt).toLocaleString()}</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Accuracy</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: summary.accuracy >= 70 ? 'var(--success)' : summary.accuracy >= 40 ? 'var(--warning)' : 'var(--error)' }}>
            {summary.accuracy}%
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Problems Solved</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {summary.solved} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ {summary.totalProblems}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Time Taken</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {contest.totalTimeMinutes ? `${contest.totalTimeMinutes}m` : '-'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Problem Breakdown</h2>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Problem</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Topic</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Difficulty</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {problemResults.map((pr, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{pr.title}</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{pr.topic}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ 
                    color: pr.difficulty === 'EASY' ? 'var(--success)' : pr.difficulty === 'MEDIUM' ? 'var(--warning)' : 'var(--error)',
                    fontSize: '0.875rem'
                  }}>
                    {pr.difficulty}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {pr.status === 'ACCEPTED' ? (
                    <span style={{ color: 'var(--success)', fontWeight: 500 }}>Accepted</span>
                  ) : (
                    <span style={{ color: 'var(--error)' }}>{pr.status ? pr.status.replace(/_/g, ' ') : 'Not Attempted'}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{pr.attempts || 0}</td>
              </tr>
            ))}
            {/* Show unattempted problems if any */}
            {result.contest.Problems?.filter(p => !problemResults.find(pr => pr.problemId === p.id)).map((p, idx) => (
               <tr key={'un_'+idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
               <td style={{ padding: '0.75rem 1rem' }}>{p.title}</td>
               <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{p.Topic.name}</td>
               <td style={{ padding: '0.75rem 1rem' }}>
                 <span style={{ 
                   color: p.difficulty === 'EASY' ? 'var(--success)' : p.difficulty === 'MEDIUM' ? 'var(--warning)' : 'var(--error)',
                   fontSize: '0.875rem'
                 }}>
                   {p.difficulty}
                 </span>
               </td>
               <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--text-muted)' }}>Not Attempted</span></td>
               <td style={{ padding: '0.75rem 1rem' }}>0</td>
             </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ContestResult;
