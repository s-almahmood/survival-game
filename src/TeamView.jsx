import React, { useState, useEffect, useCallback } from 'react';
import { supabase, GAME_ROW_ID } from './supabaseClient.js';
import { TEAMS, ZONES, GOODS, TERRITORY_TIERS, goodsByZone } from './gameConfig.js';
import { TERRITORY_MAP } from './territoryMap.js';
import { T, TEAM_NAMES_AR, ZONE_NAMES_AR, GOOD_NAMES_AR } from './translations.js';

const TABS = [
  { key: 'map', label: T.map, icon: '🗺️' },
  { key: 'inventory', label: T.inventory, icon: '📦' },
  { key: 'prices', label: T.prices, icon: '💰' },
];

export default function TeamView({ session, onLogout }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('map');
  const teamId = session.teamId;
  const team = TEAMS.find(t => t.id === teamId);

  const loadState = useCallback(async () => {
    const { data, error } = await supabase.from('game_state').select('data').eq('id', GAME_ROW_ID).single();
    if (!error && data) setState(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
    const channel = supabase
      .channel('team_game_state_' + teamId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `id=eq.${GAME_ROW_ID}` },
        (payload) => setState(payload.new.data))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadState, teamId]);

  if (loading || !state) {
    return <div dir="rtl" style={loadingStyle}>...جارٍ التحميل</div>;
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0806', color: '#e8e3d8', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `1px solid ${team.color}44` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: team.color }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#e8a23c' }}>{TEAM_NAMES_AR[teamId]}</span>
        </div>
        <button onClick={onLogout} style={logoutBtnStyle}>{T.logout}</button>
      </div>

      <div style={{ padding: '1.25rem', paddingBottom: '5.5rem', maxWidth: '600px', margin: '0 auto' }}>
        {tab === 'map' && <MapTab state={state} teamId={teamId} team={team} />}
        {tab === 'inventory' && <InventoryTab state={state} teamId={teamId} />}
        {tab === 'prices' && <PricesTab />}
      </div>

      {/* Bottom tab bar */}
      <div style={bottomBarStyle}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={bottomTabStyle(tab === t.key)}>
            <div style={{ fontSize: '20px' }}>{t.icon}</div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MapTab({ state, teamId, team }) {
  const myTerritories = TERRITORY_MAP.territories.filter(t => state.territoryOwners[t.id] === teamId);
  const myTerritoryIds = new Set(myTerritories.map(t => t.id));

  return (
    <div>
      <div style={{ background: '#15110d', borderRadius: '12px', padding: '0.75rem', border: '1px solid #2a2420', marginBottom: '1.25rem' }}>
        <svg viewBox={`0 0 ${TERRITORY_MAP.viewBoxW} ${TERRITORY_MAP.viewBoxH}`} style={{ width: '100%', display: 'block' }}>
          {TERRITORY_MAP.territories.map(t => {
            const owner = state.territoryOwners[t.id];
            const ownerTeam = TEAMS.find(team => team.id === owner);
            const isMine = myTerritoryIds.has(t.id);
            const tierInfo = TERRITORY_TIERS[t.tier];
            const hp = state.territoryHP[t.id] ?? tierInfo.hp;
            const zone = ZONES.find(z => z.id === t.zone);
            return (
              <g key={t.id}>
                <polygon
                  points={t.points}
                  fill={ownerTeam ? ownerTeam.color + '66' : zone.color + '33'}
                  stroke={isMine ? '#e8a23c' : '#2a2420'}
                  strokeWidth={isMine ? 2.5 : 1}
                />
                <text x={t.cx} y={t.cy - 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700" stroke="#000" strokeWidth="2" paintOrder="stroke">
                  {t.id}
                </text>
                {isMine && (
                  <text x={t.cx} y={t.cy + 12} textAnchor="middle" fontSize="9" fill="#e8a23c" fontWeight="600" stroke="#000" strokeWidth="2" paintOrder="stroke">
                    {hp}/{tierInfo.hp}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={sectionLabel}>{T.yourUnits}</div>
      <div style={{ background: '#15110d', border: `1px solid ${team.color}55`, borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '30px', fontWeight: 700, color: '#e8a23c' }}>{state.teams[teamId].units}</div>
      </div>

      <div style={sectionLabel}>{T.territories} ({myTerritories.length})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {myTerritories.map(t => (
          <div key={t.id} style={{ background: '#15110d', border: '1px solid #2a2420', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}>
            {t.id} · {ZONE_NAMES_AR[t.zone]}
          </div>
        ))}
        {myTerritories.length === 0 && <div style={{ fontSize: '13px', color: '#5a5550' }}>{T.unclaimed}</div>}
      </div>
    </div>
  );
}

function InventoryTab({ state, teamId }) {
  const inv = state.teams[teamId].inventory || {};

  return (
    <div>
      <div style={sectionLabel}>{T.yourInventory}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {GOODS.map(g => {
          const qty = inv[g.id] || 0;
          return (
            <div key={g.id} style={{
              background: '#15110d', border: '1px solid #2a2420', borderRadius: '12px',
              padding: '1rem 0.5rem', textAlign: 'center', opacity: qty === 0 ? 0.4 : 1
            }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{g.icon}</div>
              <div style={{ fontSize: '11px', color: '#8a8378', marginBottom: '4px' }}>{GOOD_NAMES_AR[g.id]}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: qty > 0 ? '#e8a23c' : '#5a5550' }}>{qty}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricesTab() {
  return (
    <div>
      {ZONES.map(zone => (
        <div key={zone.id} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: zone.color, marginBottom: '8px' }}>
            {zone.icon} {ZONE_NAMES_AR[zone.id]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {goodsByZone(zone.id).map(g => (
              <div key={g.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#15110d', border: '1px solid #2a2420', borderRadius: '8px', padding: '10px 14px'
              }}>
                <span style={{ fontSize: '14px' }}>{g.icon} {GOOD_NAMES_AR[g.id]}</span>
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                  <span style={{ color: '#5C8A3A' }}>{T.homeZone}: {g.homePrice}</span>
                  <span style={{ color: '#e8a23c' }}>{T.away}: {g.awayPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const loadingStyle = { minHeight: '100vh', background: '#0a0806', color: '#8a8378', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', Tahoma, sans-serif" };
const sectionLabel = { fontSize: '12px', color: '#8a8378', marginBottom: '10px' };
const logoutBtnStyle = { padding: '8px 14px', background: '#1a1410', color: '#8a8378', border: '1px solid #2a2420', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' };

const bottomBarStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
  background: '#15110d', borderTop: '1px solid #2a2420', paddingBottom: 'env(safe-area-inset-bottom, 0)'
};

function bottomTabStyle(active) {
  return {
    flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
    color: active ? '#e8a23c' : '#8a8378', cursor: 'pointer'
  };
}
