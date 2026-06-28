import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TERRITORY_DATA } from './territoryData.js';
import { supabase, GAME_ROW_ID } from './supabaseClient.js';

const GUILDS = [
  { id: 'g1', name: 'Guild 1', color: '#D85A30' },
  { id: 'g2', name: 'Guild 2', color: '#378ADD' },
  { id: 'g3', name: 'Guild 3', color: '#5C8A3A' },
  { id: 'g4', name: 'Guild 4', color: '#BA7517' },
  { id: 'g5', name: 'Guild 5', color: '#7F77DD' },
  { id: 'g6', name: 'Guild 6', color: '#D6499A' },
];

const TERRITORIES = TERRITORY_DATA.territories;
const VB_W = TERRITORY_DATA.viewBoxW;
const VB_H = TERRITORY_DATA.viewBoxH;

const NEIGHBOR_MAP = {};
TERRITORIES.forEach(t => { NEIGHBOR_MAP[t.id] = t.neighbors; });

const MAX_HP = 100;
const STARTING_GOLD = 50;

function defaultState() {
  const territoryOwners = {};
  const territoryHP = {};
  TERRITORIES.forEach(t => { territoryOwners[t.id] = null; territoryHP[t.id] = MAX_HP; });
  const guildGold = {};
  GUILDS.forEach(g => { guildGold[g.id] = STARTING_GOLD; });
  return { territoryOwners, territoryHP, guildGold, log: [], phase: 'settle' };
}

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [view, setView] = useState('map');
  const [selectedGuild, setSelectedGuild] = useState(GUILDS[0].id);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [toast, setToast] = useState(null);

  const guildById = useMemo(() => {
    const m = {};
    GUILDS.forEach(g => { m[g.id] = g; });
    return m;
  }, []);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  }

  function addLog(s, text) {
    return { ...s, log: [{ text, time: Date.now() }, ...s.log].slice(0, 40) };
  }

  // Load initial state from Supabase
  const loadState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_state')
        .select('data')
        .eq('id', GAME_ROW_ID)
        .single();
      if (error) throw error;
      setState(data.data);
      setLoadError(null);
    } catch (e) {
      console.error('load error', e);
      setLoadError(e.message || 'Could not load game state.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Subscribe to live changes from other devices
  useEffect(() => {
    const channel = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `id=eq.${GAME_ROW_ID}` },
        (payload) => {
          setState(payload.new.data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save state to Supabase (this also triggers the realtime update for other devices)
  async function save(newState) {
    setState(newState); // optimistic local update
    try {
      const { error } = await supabase
        .from('game_state')
        .update({ data: newState })
        .eq('id', GAME_ROW_ID);
      if (error) throw error;
    } catch (e) {
      console.error('save error', e);
      showToast('⚠ Could not sync — check connection');
    }
  }

  function territoryCountFor(guildId) {
    return Object.values(state.territoryOwners).filter(o => o === guildId).length;
  }

  function claimTerritory(territoryId, guildId) {
    if (!state) return;
    const cost = 10;
    if (state.guildGold[guildId] < cost) return showToast('Not enough gold to claim');
    if (state.territoryOwners[territoryId]) return showToast('Territory already owned');
    let ns = {
      ...state,
      guildGold: { ...state.guildGold, [guildId]: state.guildGold[guildId] - cost },
      territoryOwners: { ...state.territoryOwners, [territoryId]: guildId },
    };
    ns = addLog(ns, `${guildById[guildId].name} claimed ${territoryId}`);
    save(ns);
    showToast('Claimed');
  }

  function adjustGold(guildId, amount) {
    if (!state) return;
    let ns = { ...state, guildGold: { ...state.guildGold, [guildId]: Math.max(0, state.guildGold[guildId] + amount) } };
    ns = addLog(ns, `${guildById[guildId].name} ${amount > 0 ? 'earned' : 'spent'} ${Math.abs(amount)} gold`);
    save(ns);
  }

  function buildStructure(territoryId, guildId) {
    if (!state) return;
    const cost = 15;
    if (state.territoryOwners[territoryId] !== guildId) return showToast('You do not own this territory');
    if (state.guildGold[guildId] < cost) return showToast('Not enough gold');
    let ns = {
      ...state,
      guildGold: { ...state.guildGold, [guildId]: state.guildGold[guildId] - cost },
      territoryHP: { ...state.territoryHP, [territoryId]: Math.min(MAX_HP + 50, state.territoryHP[territoryId] + 25) },
    };
    ns = addLog(ns, `${guildById[guildId].name} fortified ${territoryId} (+25 HP)`);
    save(ns);
    showToast('Structure built — +25 HP');
  }

  function attackTerritory(territoryId, attackerGuildId, damage) {
    if (!state) return;
    const neighbors = NEIGHBOR_MAP[territoryId] || [];
    const adjacent = neighbors.some(n => state.territoryOwners[n] === attackerGuildId);
    if (!adjacent) return showToast('Not adjacent — cannot attack');
    const cost = 15;
    if (state.guildGold[attackerGuildId] < cost) return showToast('Not enough gold to attack');

    const defenderGuildId = state.territoryOwners[territoryId];
    const newGold = { ...state.guildGold, [attackerGuildId]: state.guildGold[attackerGuildId] - cost };
    const currentHP = state.territoryHP[territoryId];
    const newHPVal = Math.max(0, currentHP - damage);
    let ns = { ...state, guildGold: newGold, territoryHP: { ...state.territoryHP, [territoryId]: newHPVal } };

    if (newHPVal <= 0) {
      ns = {
        ...ns,
        territoryOwners: { ...state.territoryOwners, [territoryId]: attackerGuildId },
        territoryHP: { ...ns.territoryHP, [territoryId]: MAX_HP },
      };
      ns = addLog(ns, `⚔ ${guildById[attackerGuildId].name} CAPTURED ${territoryId}!`);
    } else {
      ns = addLog(ns, `${guildById[attackerGuildId].name} struck ${territoryId} (${newHPVal}/${MAX_HP} HP left)`);
    }
    save(ns);
    showToast('Attack resolved');
  }

  function setPhase(phase) {
    if (!state) return;
    const ns = addLog({ ...state, phase }, `— Phase changed to ${phase.toUpperCase()} —`);
    save(ns);
  }

  function resetAll() {
    save(defaultState());
    showToast('World reset');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0806', color: '#8a8378', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        Loading the map...
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0806', color: '#D85A30', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div>Couldn't load the world. {loadError || ''}</div>
        <button onClick={loadState} style={{ padding: '10px 20px', background: '#1a1410', color: '#e8a23c', border: '1px solid #e8a23c', borderRadius: '8px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const sortedGuilds = [...GUILDS].sort((a, b) => {
    const scoreA = territoryCountFor(a.id) * 10 + state.guildGold[a.id];
    const scoreB = territoryCountFor(b.id) * 10 + state.guildGold[b.id];
    return scoreB - scoreA;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0806', fontFamily: 'system-ui, sans-serif', color: '#e8e3d8', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2420', position: 'sticky', top: 0, background: '#0a0806', zIndex: 20 }}>
        <button onClick={() => setView('map')} style={tabStyle(view === 'map')}>Map & Leaderboard</button>
        <button onClick={() => setView('control')} style={tabStyle(view === 'control')}>Helper Control</button>
      </div>

      <div style={{
        textAlign: 'center', padding: '10px', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase',
        background: state.phase === 'war' ? '#3a1408' : '#10140a', color: state.phase === 'war' ? '#ff8c42' : '#7fa860',
        borderBottom: '1px solid #2a2420'
      }}>
        Phase: {state.phase === 'settle' ? 'Settle & Build' : state.phase === 'war' ? '⚔ War' : 'Ended'}
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      {view === 'map' ? (
        <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={sectionLabel}>Leaderboard</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedGuilds.map((g, idx) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#15110d', borderRadius: '8px', border: `1px solid ${g.color}44` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#5a5550', minWidth: '18px' }}>{idx + 1}</span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: g.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{g.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8a8378' }}>
                    <span>{territoryCountFor(g.id)} territories</span>
                    <span style={{ color: '#e8a23c' }}>{state.guildGold[g.id]} gold</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionLabel}>The Map</div>
          <ImageMap state={state} guildById={guildById} onSelect={setSelectedTerritory} selected={selectedTerritory} />

          {selectedTerritory && (
            <TerritoryDetail territoryId={selectedTerritory} state={state} guildById={guildById} onClose={() => setSelectedTerritory(null)} />
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <div style={sectionLabel}>Recent events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {state.log.slice(0, 12).map((entry, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#8a8378', padding: '6px 0', borderBottom: '1px solid #1a1410' }}>{entry.text}</div>
              ))}
              {state.log.length === 0 && <div style={{ fontSize: '13px', color: '#5a5550' }}>Nothing has happened yet.</div>}
            </div>
          </div>
        </div>
      ) : (
        <ControlPanel
          state={state} guildById={guildById} selectedGuild={selectedGuild} setSelectedGuild={setSelectedGuild}
          adjustGold={adjustGold} claimTerritory={claimTerritory} buildStructure={buildStructure}
          attackTerritory={attackTerritory} setPhase={setPhase} resetAll={resetAll}
        />
      )}
    </div>
  );
}

const toastStyle = { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#1a1410', border: '1px solid #e8a23c', color: '#e8a23c', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 };
const sectionLabel = { fontSize: '11px', color: '#8a8378', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' };

function tabStyle(active) {
  return { flex: 1, padding: '14px', background: active ? '#1a1410' : 'transparent', color: active ? '#e8a23c' : '#8a8378', border: 'none', borderBottom: active ? '2px solid #e8a23c' : '2px solid transparent', fontSize: '13px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' };
}

function ImageMap({ state, guildById, onSelect, selected }) {
  return (
    <div style={{ background: '#0d0a07', borderRadius: '12px', padding: '0.75rem', border: '1px solid #2a2420' }}>
      <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', display: 'block' }}>
          <image href={TERRITORY_DATA.mapImage} x="0" y="0" width={VB_W} height={VB_H} preserveAspectRatio="xMidYMid slice" />
          {TERRITORIES.map(t => {
            const owner = state.territoryOwners[t.id];
            const guild = guildById[owner];
            const isSelected = selected === t.id;
            return (
              <polygon
                key={t.id}
                points={t.points}
                fill={guild ? guild.color + '55' : isSelected ? '#e8a23c33' : 'transparent'}
                stroke={isSelected ? '#e8a23c' : guild ? guild.color : 'rgba(255,255,255,0.5)'}
                strokeWidth={isSelected ? 3 : 1.3}
                onClick={() => onSelect(t.id)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
          {TERRITORIES.map(t => {
            const owner = state.territoryOwners[t.id];
            const guild = guildById[owner];
            const hp = state.territoryHP[t.id];
            const barW = 34;
            return (
              <g key={t.id + '-label'} style={{ pointerEvents: 'none' }}>
                <text x={t.cx} y={t.cy - 6} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700" stroke="#000" strokeWidth="2.5" paintOrder="stroke">{t.id}</text>
                {guild && (
                  <>
                    <rect x={t.cx - barW/2} y={t.cy + 2} width={barW} height={5} fill="#000" opacity="0.5" rx="2" />
                    <rect x={t.cx - barW/2} y={t.cy + 2} width={barW * (hp/MAX_HP)} height={5} fill={guild.color} rx="2" />
                    <text x={t.cx} y={t.cy + 16} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600" stroke="#000" strokeWidth="2" paintOrder="stroke">{hp} HP</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ fontSize: '11px', color: '#5a5550', textAlign: 'center', marginTop: '8px' }}>
        Tap a territory to view details — HP bar shown under owned territories
      </div>
    </div>
  );
}

function TerritoryDetail({ territoryId, state, guildById, onClose }) {
  const owner = state.territoryOwners[territoryId];
  const guild = guildById[owner];
  const hp = state.territoryHP[territoryId];
  const neighbors = NEIGHBOR_MAP[territoryId] || [];

  return (
    <div style={{ marginTop: '1rem', background: '#15110d', border: '1px solid #2a2420', borderRadius: '10px', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>{territoryId}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8a8378', cursor: 'pointer', fontSize: '13px' }}>Close</button>
      </div>
      <div style={{ fontSize: '13px', color: '#8a8378', marginBottom: '6px' }}>
        Owner: <span style={{ color: guild ? guild.color : '#8a8378', fontWeight: 500 }}>{guild ? guild.name : 'Unclaimed'}</span>
      </div>
      {guild && (
        <div style={{ height: '8px', background: '#0a0806', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ height: '100%', width: `${hp}%`, background: guild.color }} />
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#5a5550' }}>Neighbors: {neighbors.length > 0 ? neighbors.join(', ') : 'None (isolated)'}</div>
    </div>
  );
}

function ControlPanel({ state, guildById, selectedGuild, setSelectedGuild, adjustGold, claimTerritory, buildStructure, attackTerritory, setPhase, resetAll }) {
  const [targetTerritory, setTargetTerritory] = useState(TERRITORIES[0].id);
  const guild = guildById[selectedGuild];
  const ownedTerritories = TERRITORIES.filter(t => state.territoryOwners[t.id] === selectedGuild);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={sectionLabel}>Select guild</div>
      <select value={selectedGuild} onChange={e => setSelectedGuild(e.target.value)} style={selectStyle}>
        {GUILDS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      <div style={{ background: '#1a1410', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', border: `1px solid ${guild.color}55` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Gold</span>
          <span style={{ color: '#e8a23c', fontWeight: 500 }}>{state.guildGold[selectedGuild]}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[-20, -5, 5, 20].map(amt => (
            <button key={amt} onClick={() => adjustGold(selectedGuild, amt)} style={btnStyle(amt > 0 ? '#639922' : '#D85A30')}>
              {amt > 0 ? '+' : ''}{amt}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionLabel}>Target territory</div>
      <select value={targetTerritory} onChange={e => setTargetTerritory(e.target.value)} style={selectStyle}>
        {TERRITORIES.map(t => {
          const owner = state.territoryOwners[t.id];
          const ownerName = owner ? guildById[owner].name : 'Unclaimed';
          return <option key={t.id} value={t.id}>{t.id} — {ownerName} ({state.territoryHP[t.id]} HP)</option>;
        })}
      </select>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
        <button onClick={() => claimTerritory(targetTerritory, selectedGuild)} style={actionBtnStyle('#378ADD')}>Claim territory (10 gold)</button>
        <button onClick={() => buildStructure(targetTerritory, selectedGuild)} style={actionBtnStyle('#5C8A3A')}>Build structure +25 HP (15 gold)</button>
        <button onClick={() => attackTerritory(targetTerritory, selectedGuild, 30)} style={actionBtnStyle('#D85A30')}>Attack — land a hit, 30 dmg (15 gold)</button>
      </div>

      <div style={sectionLabel}>Your territories</div>
      <div style={{ fontSize: '13px', color: '#8a8378', marginBottom: '1.5rem' }}>
        {ownedTerritories.length > 0 ? ownedTerritories.map(t => t.id).join(', ') : 'None yet'}
      </div>

      <div style={sectionLabel}>Phase control</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        <button onClick={() => setPhase('settle')} style={actionBtnStyle('#5C8A3A', state.phase === 'settle')}>Settle</button>
        <button onClick={() => setPhase('war')} style={actionBtnStyle('#D85A30', state.phase === 'war')}>War</button>
        <button onClick={() => setPhase('ended')} style={actionBtnStyle('#888780', state.phase === 'ended')}>Ended</button>
      </div>

      <button onClick={resetAll} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#5a5550', border: '1px solid #2a2420', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
        Reset world (start of event only)
      </button>
    </div>
  );
}

const selectStyle = { width: '100%', padding: '10px', background: '#1a1410', color: '#e8e3d8', border: '1px solid #2a2420', borderRadius: '6px', fontSize: '15px', marginBottom: '1.25rem' };

function btnStyle(color) {
  return { padding: '10px 0', background: '#0a0806', color, border: '1px solid #2a2420', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' };
}
function actionBtnStyle(color, active) {
  return { flex: 1, padding: '12px', background: active ? color + '33' : '#15110d', color, border: `1px solid ${active ? color : '#2a2420'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' };
}
