import React, { useState, useEffect, useCallback } from 'react';
import { supabase, GAME_ROW_ID } from './supabaseClient.js';
import { TEAMS, TERRITORY_TIERS } from './gameConfig.js';
import { TERRITORY_MAP } from './territoryMap.js';
import { T, TEAM_NAMES_AR } from './translations.js';

export default function AdminDashboard({ onLogout }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  const loadState = useCallback(async () => {
    const { data, error } = await supabase.from('game_state').select('data').eq('id', GAME_ROW_ID).single();
    if (!error && data) setState(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
    const channel = supabase
      .channel('admin_game_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `id=eq.${GAME_ROW_ID}` },
        (payload) => setState(payload.new.data))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadState]);

  async function save(newState) {
    setState(newState);
    await supabase.from('game_state').update({ data: newState }).eq('id', GAME_ROW_ID);
  }

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  }

  function territoryCountFor(teamId) {
    if (!state) return 0;
    return Object.values(state.territoryOwners).filter(o => o === teamId).length;
  }

  function totalGoodsFor(teamId) {
    if (!state) return 0;
    const inv = state.teams[teamId]?.inventory || {};
    return Object.values(inv).reduce((sum, qty) => sum + qty, 0);
  }

  if (loading || !state) {
    return <div dir="rtl" style={loadingStyle}>...جارٍ التحميل</div>;
  }

  const sortedTeams = [...TEAMS].sort((a, b) => territoryCountFor(b.id) - territoryCountFor(a.id));

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0806', color: '#e8e3d8', fontFamily: "'Segoe UI', Tahoma, sans-serif", paddingBottom: '3rem' }}>
      <Header onLogout={onLogout} />

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

        <button onClick={() => setShowReleaseModal(true)} style={releaseButtonStyle}>
          ⚡ {T.releaseResources}
        </button>
        <div style={{ fontSize: '12px', color: '#8a8378', textAlign: 'center', marginTop: '8px', marginBottom: '2rem' }}>
          {T.releaseResourcesDesc}
        </div>

        <div style={sectionLabel}>{T.standings}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2rem' }}>
          {sortedTeams.map((team, idx) => (
            <div key={team.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: '#15110d', borderRadius: '10px',
              border: `1px solid ${team.color}44`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#5a5550', minWidth: '16px' }}>{idx + 1}</span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: team.color }} />
                <span style={{ fontWeight: 500, fontSize: '15px' }}>{TEAM_NAMES_AR[team.id]}</span>
              </div>
              <div style={{ display: 'flex', gap: '18px', fontSize: '13px', color: '#8a8378' }}>
                <span>🗺️ {territoryCountFor(team.id)}</span>
                <span style={{ color: '#e8a23c' }}>💰 {state.teams[team.id]?.units ?? 0}</span>
                <span>📦 {totalGoodsFor(team.id)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={sectionLabel}>{T.recentActivity}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          {state.log.slice(0, 15).map((entry, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#8a8378', padding: '6px 0', borderBottom: '1px solid #1a1410' }}>
              {entry.text}
            </div>
          ))}
          {state.log.length === 0 && <div style={{ fontSize: '13px', color: '#5a5550' }}>{T.noActivity}</div>}
        </div>
      </div>

      {showReleaseModal && (
        <ReleaseResourcesModal
          onClose={() => setShowReleaseModal(false)}
          onConfirm={async () => {
            const newTeams = { ...state.teams };
            let logEntries = [];

            TEAMS.forEach(team => {
              const owned = TERRITORY_MAP.territories.filter(t => state.territoryOwners[t.id] === team.id);
              let unitsDelta = 0;
              owned.forEach(t => {
                const tier = TERRITORY_TIERS[t.tier];
                if (newTeams[team.id].units + unitsDelta >= tier.upkeep) {
                  unitsDelta -= tier.upkeep;
                }
              });
              newTeams[team.id] = { ...newTeams[team.id], units: Math.max(0, newTeams[team.id].units + unitsDelta) };
              if (owned.length > 0) {
                logEntries.push({ text: `${TEAM_NAMES_AR[team.id]}: ${T.releaseResources} (${owned.length})`, time: Date.now() });
              }
            });

            const ns = { ...state, teams: newTeams, log: [...logEntries, ...state.log].slice(0, 60) };
            await save(ns);
            setShowReleaseModal(false);
            showToast(T.releaseResources);
          }}
        />
      )}
    </div>
  );
}

function Header({ onLogout }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #2a2420' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#e8a23c' }}>⚔️ {T.adminDashboard}</div>
      <button onClick={onLogout} style={logoutBtnStyle}>{T.logout}</button>
    </div>
  );
}

function ReleaseResourcesModal({ onClose, onConfirm }) {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '10px', color: '#e8a23c' }}>
          ⚡ {T.releaseResourcesConfirmTitle}
        </div>
        <div style={{ fontSize: '13px', color: '#8a8378', marginBottom: '20px', lineHeight: 1.6 }}>
          {T.releaseResourcesConfirmDesc}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={modalCancelStyle}>{T.cancel}</button>
          <button onClick={() => onConfirm()} style={modalConfirmStyle}>{T.confirmRelease}</button>
        </div>
      </div>
    </div>
  );
}

const loadingStyle = { minHeight: '100vh', background: '#0a0806', color: '#8a8378', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', Tahoma, sans-serif" };
const toastStyle = { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#1a1410', border: '1px solid #e8a23c', color: '#e8a23c', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 };
const sectionLabel = { fontSize: '12px', color: '#8a8378', marginBottom: '10px' };
const logoutBtnStyle = { padding: '8px 14px', background: '#1a1410', color: '#8a8378', border: '1px solid #2a2420', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' };

const releaseButtonStyle = {
  width: '100%', padding: '20px', background: 'linear-gradient(135deg, #e8a23c, #d68a28)',
  color: '#0a0806', border: 'none', borderRadius: '14px', fontSize: '19px', fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 4px 20px rgba(232,162,60,0.3)'
};

const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' };
const modalStyle = { background: '#15110d', border: '1px solid #2a2420', borderRadius: '14px', padding: '1.75rem', maxWidth: '380px', width: '100%' };
const modalCancelStyle = { flex: 1, padding: '12px', background: '#1a1410', color: '#8a8378', border: '1px solid #2a2420', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' };
const modalConfirmStyle = { flex: 1, padding: '12px', background: '#e8a23c', color: '#0a0806', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 };
