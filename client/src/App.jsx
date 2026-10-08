import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ContestCreate from './pages/ContestCreate';
import ContestTake from './pages/ContestTake';
import ContestResult from './pages/ContestResult';
import PerformanceDashboard from './pages/PerformanceDashboard';

// Clean, Developer-focused Landing
const Home = () => (
  <div className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.04em' }}>
      Master DSA.
    </h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
      Targeted practice platform for Data Structures and Algorithms. Identify your weaknesses, track your performance, and improve your skills.
    </p>
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Link to="/register" className="btn-primary">Get Started</Link>
      <Link to="/login" className="btn-secondary">Login</Link>
    </div>
  </div>
);

// Clean, Data-Driven Dashboard
const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Welcome back, {user?.name}</p>
        </div>
        <button className="btn-secondary" onClick={logout} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>Logout</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Custom Contest</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Select specific topics and difficulties to practice.</p>
          <Link to="/contests/create" className="btn-primary">Create Contest</Link>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Recommended Practice</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Practice problems generated based on your weaknesses.</p>
          <Link to="/performance" className="btn-primary">Start Recommended</Link>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>View your topic-wise accuracy and statistics.</p>
          <Link to="/performance" className="btn-secondary">View Stats</Link>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="container flex-center" style={{ minHeight: '80vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Clean Navigation
const Navbar = () => {
  const { user } = useAuth();
  return (
    <nav style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>DSA Mastery</Link>
          {user && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dashboard</Link>
              <Link to="/performance" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Analytics</Link>
            </div>
          )}
        </div>
        <div>
          {user ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.name}</span>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Login</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contests/create" 
              element={
                <ProtectedRoute>
                  <ContestCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contests/:id" 
              element={
                <ProtectedRoute>
                  <ContestTake />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contests/:id/result" 
              element={
                <ProtectedRoute>
                  <ContestResult />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/performance" 
              element={
                <ProtectedRoute>
                  <PerformanceDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
