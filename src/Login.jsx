import React, { useState } from 'react';
import { T } from './translations.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const success = onLogin(username, password);
    if (!success) {
      setError(T.wrongCredentials);
      setPassword('');
    }
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', background: '#0a0806', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Segoe UI', Tahoma, sans-serif", padding: '1.5rem'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: '360px', background: '#15110d', border: '1px solid #2a2420',
        borderRadius: '14px', padding: '2rem 1.75rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚔️</div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#e8a23c' }}>{T.appName}</div>
        </div>

        <label style={labelStyle}>{T.username}</label>
        <input
          autoFocus
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={inputStyle}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
        />

        <label style={labelStyle}>{T.password}</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
          dir="ltr"
        />

        {error && (
          <div style={{ color: '#D85A30', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button type="submit" style={buttonStyle}>{T.signIn}</button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px', color: '#8a8378',
  marginBottom: '6px', marginTop: '14px'
};

const inputStyle = {
  width: '100%', padding: '12px 14px', background: '#0a0806', border: '1px solid #2a2420',
  borderRadius: '8px', color: '#e8e3d8', fontSize: '15px', boxSizing: 'border-box'
};

const buttonStyle = {
  width: '100%', padding: '13px', background: '#e8a23c', color: '#0a0806', border: 'none',
  borderRadius: '8px', fontSize: '15px', fontWeight: 600, marginTop: '22px', cursor: 'pointer'
};
