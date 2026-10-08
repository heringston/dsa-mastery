import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ContestCreate = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [numProblems, setNumProblems] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/problems/meta/topics');
        setTopics(res.data.topics);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load topics');
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  const handleTopicToggle = (id) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter(t => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic.');
      return;
    }
    
    setError('');
    try {
      const res = await api.post('/contests', {
        topics: selectedTopics,
        difficulty,
        numProblems: parseInt(numProblems),
        durationMinutes: parseInt(durationMinutes)
      });
      // Redirect to contest page
      navigate(`/contests/${res.data.contest.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest');
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2.5rem' }}>Loading...</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Create Custom Set</h1>
      
      {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{error}</div>}
      
      <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>1. Select Topics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              {topics.map(topic => (
                <label key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedTopics.includes(topic.id)}
                    onChange={() => handleTopicToggle(topic.id)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>{topic.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Problem Count (1-10)</label>
              <input 
                type="number" 
                min="1" max="10" 
                value={numProblems} 
                onChange={(e) => setNumProblems(e.target.value)} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Duration (Minutes)</label>
              <input 
                type="number" 
                min="5" max="300" step="5"
                value={durationMinutes} 
                onChange={(e) => setDurationMinutes(e.target.value)} 
              />
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary">
              Generate Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContestCreate;
