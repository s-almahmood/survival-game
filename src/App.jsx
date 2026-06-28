import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import HelperConsole from './HelperConsole.jsx';
import TeamView from './TeamView.jsx';
import { checkLogin } from './auth.js';
import { T } from './translations.js';

const SESSION_KEY = 'territory-war-session';

export default function App() {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoaded(true);
  }, []);

  function handleLogin(username, password) {
    const account = checkLogin(username, password);
    if (!account) return false;
    setSession(account);
    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    return true;
  }

  function handleLogout() {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }

  if (!loaded) return null; // avoid flash of login screen while checking storage

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="*" element={<RoleRouter session={session} onLogout={handleLogout} />} />
    </Routes>
  );
}

function RoleRouter({ session, onLogout }) {
  if (session.role === 'admin') {
    return <AdminDashboard onLogout={onLogout} />;
  }
  if (session.role === 'helper') {
    return <HelperConsole onLogout={onLogout} />;
  }
  if (session.role === 'team') {
    return <TeamView session={session} onLogout={onLogout} />;
  }
  return <Navigate to="/" />;
}
