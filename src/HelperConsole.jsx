import React, { useState, useEffect, useCallback } from 'react';
import { supabase, GAME_ROW_ID } from './supabaseClient.js';
import { TEAMS, GOODS, WEAPONS, TERRITORY_TIERS, getTeamById } from './gameConfig.js';
import { TERRITORY_MAP } from './territoryMap.js';
import { T, REASON_TAGS_AR, TEAM_NAMES_AR, GOOD_NAMES_AR, WEAPON_NAMES_AR, TIER_NAMES_AR } from './translations.js';

const TABS = [
  { key: 'Units', label: T.tabUnits },
  { key: 'Inventory', label: T.tabInventory },
  { key: 'Trade', label: T.tabTrade },
  { key: 'Attack', label: T.tabAttack },
];

export default function HelperConsole({ onLogout }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Units');
  const [toast, setToast] = useState(null);

  const loadState = useCallback(async () => {
    const { data, error } = await supabase.from('game_state').select('data').eq('id', GAME_ROW_ID).single();
    if (!error && data) setState(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
    const channel = supabase
      .channel('helper_game_state')
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

  function addLog(s, text) {
    return { ...s, log: [{ text, time: Date.now() }, ...s.log].slice(0, 60) };
  }

  if (loading || !state) {
    return <div dir="rtl" style={loadingStyle}>...جارٍ التحميل</div>;
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0806', color: '#e8e3d8', fontFamily: "'Segoe UI', Tahoma, sans-serif", paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #2a2420' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#e8a23c' }}>🛠️ {T.helperConsole}</div>
        <button onClick={onLogout} style={logoutBtnStyle}>{T.logout}</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #2a2420', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>{t.label}</button>
        ))}
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
        {tab === 'Units' && <UnitsTab state={state} save={save} addLog={addLog} showToast={showToast} />}
        {tab === 'Inventory' && <InventoryTab state={state} save={save} addLog={addLog} showToast={showToast} />}
        {tab === 'Trade' && <TradeTab state={state} save={save} addLog={addLog} showToast={showToast} />}
        {tab === 'Attack' && <AttackTab state={state} save={save} addLog={addLog} showToast={showToast} />}
      </div>
    </div>
  );
}

function TeamSelector({ selected, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
      {TEAMS.map(team => (
        <button
          key={team.id}
          onClick={() => onSelect(team.id)}
          style={{
            padding: '14px 8px', borderRadius: '10px', border: selected === team.id ? `2px solid ${team.color}` : '1px solid #2a2420',
            background: selected === team.id ? team.color + '33' : '#15110d', color: '#e8e3d8',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          {TEAM_NAMES_AR[team.id]}
        </button>
      ))}
    </div>
  );
}

function ReasonSelector({ reason, setReason }) {
  return (
    <select value={reason} onChange={e => setReason(e.target.value)} style={selectStyle}>
      {REASON_TAGS_AR.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

function UnitsTab({ state, save, addLog, showToast }) {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].id);
  const [reason, setReason] = useState(REASON_TAGS_AR[0]);
  const [customAmount, setCustomAmount] = useState('');

  async function adjust(amount) {
    const teamName = TEAM_NAMES_AR[selectedTeam];
    const current = state.teams[selectedTeam].units;
    const newUnits = Math.max(0, current + amount);
    const newTeams = { ...state.teams, [selectedTeam]: { ...state.teams[selectedTeam], units: newUnits } };
    let ns = { ...state, teams: newTeams };
    ns = addLog(ns, `${teamName} ${amount > 0 ? '+' : ''}${amount} ${T.units} (${reason})`);
    await save(ns);
    showToast(`${teamName}: ${amount > 0 ? '+' : ''}${amount} ${T.units}`);
  }

  return (
    <div>
      <div style={sectionLabel}>{T.selectTeam}</div>
      <TeamSelector selected={selectedTeam} onSelect={setSelectedTeam} />

      <div style={{ background: '#15110d', border: `1px solid ${getTeamById(selectedTeam).color}55`, borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#8a8378' }}>{TEAM_NAMES_AR[selectedTeam]} — {T.balance}</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#e8a23c' }}>{state.teams[selectedTeam].units}</div>
      </div>

      <div style={sectionLabel}>{T.reason}</div>
      <ReasonSelector reason={reason} setReason={setReason} />

      <div style={sectionLabel}>{T.quickAdjust}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
        {[-10, -5, 5, 10].map(amt => (
          <button key={amt} onClick={() => adjust(amt)} style={quickBtnStyle(amt > 0 ? '#5C8A3A' : '#D85A30')}>
            {amt > 0 ? '+' : ''}{amt}
          </button>
        ))}
      </div>

      <div style={sectionLabel}>{T.customAmount}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          placeholder="25 أو -25"
          style={{ ...inputStyle, flex: 1 }}
          dir="ltr"
        />
        <button
          onClick={() => { if (customAmount !== '') { adjust(parseInt(customAmount, 10)); setCustomAmount(''); } }}
          style={{ ...quickBtnStyle('#e8a23c'), color: '#0a0806', padding: '12px 20px' }}
        >
          {T.apply}
        </button>
      </div>
    </div>
  );
}

function InventoryTab({ state, save, addLog, showToast }) {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].id);
  const [selectedGood, setSelectedGood] = useState(GOODS[0].id);
  const [reason, setReason] = useState(REASON_TAGS_AR[1]);

  const inv = state.teams[selectedTeam].inventory || {};
  const good = GOODS.find(g => g.id === selectedGood);

  async function adjustGood(amount) {
    const teamName = TEAM_NAMES_AR[selectedTeam];
    const current = inv[selectedGood] || 0;
    const newQty = Math.max(0, current + amount);
    const newInv = { ...inv, [selectedGood]: newQty };
    const newTeams = { ...state.teams, [selectedTeam]: { ...state.teams[selectedTeam], inventory: newInv } };
    let ns = { ...state, teams: newTeams };
    ns = addLog(ns, `${teamName} ${amount > 0 ? '+' : ''}${amount} ${good.icon} ${GOOD_NAMES_AR[good.id]} (${reason})`);
    await save(ns);
    showToast(`${teamName}: ${amount > 0 ? '+' : ''}${amount} ${GOOD_NAMES_AR[good.id]}`);
  }

  return (
    <div>
      <div style={sectionLabel}>{T.selectTeam}</div>
      <TeamSelector selected={selectedTeam} onSelect={setSelectedTeam} />

      <div style={sectionLabel}>{T.selectGood}</div>
      <select value={selectedGood} onChange={e => setSelectedGood(e.target.value)} style={selectStyle}>
        {GOODS.map(g => <option key={g.id} value={g.id}>{g.icon} {GOOD_NAMES_AR[g.id]}</option>)}
      </select>

      <div style={{ background: '#15110d', border: '1px solid #2a2420', borderRadius: '10px', padding: '1rem 1.25rem', margin: '1rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#8a8378' }}>{TEAM_NAMES_AR[selectedTeam]} {T.has}</div>
        <div style={{ fontSize: '28px', fontWeight: 700 }}>{good.icon} {inv[selectedGood] || 0}</div>
      </div>

      <div style={sectionLabel}>{T.reason}</div>
      <ReasonSelector reason={reason} setReason={setReason} />

      <div style={sectionLabel}>{T.adjustQuantity}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[-5, -1, 1, 5].map(amt => (
          <button key={amt} onClick={() => adjustGood(amt)} style={quickBtnStyle(amt > 0 ? '#5C8A3A' : '#D85A30')}>
            {amt > 0 ? '+' : ''}{amt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TradeTab({ state, save, addLog, showToast }) {
  const [fromTeam, setFromTeam] = useState(TEAMS[0].id);
  const [toTeam, setToTeam] = useState(TEAMS[1].id);
  const [transferType, setTransferType] = useState('units');
  const [amount, setAmount] = useState('');

  async function executeTransfer() {
    if (fromTeam === toTeam) return showToast(T.pickTwoTeams);
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) return showToast(T.enterValidAmount);

    const fromName = TEAM_NAMES_AR[fromTeam];
    const toName = TEAM_NAMES_AR[toTeam];
    let newTeams = { ...state.teams };

    if (transferType === 'units') {
      if (newTeams[fromTeam].units < amt) return showToast(`${fromName} ${T.notEnoughUnits}`);
      newTeams[fromTeam] = { ...newTeams[fromTeam], units: newTeams[fromTeam].units - amt };
      newTeams[toTeam] = { ...newTeams[toTeam], units: newTeams[toTeam].units + amt };
    } else {
      const good = GOODS.find(g => g.id === transferType);
      const fromInv = newTeams[fromTeam].inventory || {};
      if ((fromInv[transferType] || 0) < amt) return showToast(`${fromName} ${T.notEnoughGoods}`);
      const toInv = newTeams[toTeam].inventory || {};
      newTeams[fromTeam] = { ...newTeams[fromTeam], inventory: { ...fromInv, [transferType]: fromInv[transferType] - amt } };
      newTeams[toTeam] = { ...newTeams[toTeam], inventory: { ...toInv, [transferType]: (toInv[transferType] || 0) + amt } };
    }

    const itemLabel = transferType === 'units' ? T.units : GOOD_NAMES_AR[transferType];
    let ns = { ...state, teams: newTeams };
    ns = addLog(ns, `🔄 ${fromName} ← ${toName}: ${amt} ${itemLabel} (${T.reasonTrade})`);
    await save(ns);
    showToast(T.transferComplete);
    setAmount('');
  }

  return (
    <div>
      <div style={sectionLabel}>{T.fromTeam}</div>
      <TeamSelector selected={fromTeam} onSelect={setFromTeam} />

      <div style={sectionLabel}>{T.toTeam}</div>
      <TeamSelector selected={toTeam} onSelect={setToTeam} />

      <div style={sectionLabel}>{T.whatTransferred}</div>
      <select value={transferType} onChange={e => setTransferType(e.target.value)} style={selectStyle}>
        <option value="units">💰 {T.units}</option>
        {GOODS.map(g => <option key={g.id} value={g.id}>{g.icon} {GOOD_NAMES_AR[g.id]}</option>)}
      </select>

      <div style={sectionLabel}>{T.amount}</div>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="10"
        style={inputStyle}
        dir="ltr"
      />

      <button onClick={executeTransfer} style={{ ...quickBtnStyle('#378ADD'), width: '100%', marginTop: '1.25rem', padding: '14px' }}>
        {T.executeTransfer}
      </button>
    </div>
  );
}

function AttackTab({ state, save, addLog, showToast }) {
  const [attacker, setAttacker] = useState(TEAMS[0].id);
  const [targetTerritory, setTargetTerritory] = useState(TERRITORY_MAP.territories[0].id);
  const [weapon, setWeapon] = useState(WEAPONS[0].id);

  const target = TERRITORY_MAP.territories.find(t => t.id === targetTerritory);
  const targetOwner = state.territoryOwners[targetTerritory];
  const targetTier = TERRITORY_TIERS[target.tier];
  const currentHP = state.territoryHP[targetTerritory] ?? targetTier.hp;
  const selectedWeapon = WEAPONS.find(w => w.id === weapon);
  const attackerName = TEAM_NAMES_AR[attacker];

  const neighbors = target.neighbors || [];
  const isAdjacent = neighbors.some(n => state.territoryOwners[n] === attacker);
  const isHome = state.teams[attacker]?.homeTerritory === targetTerritory;

  async function resolveAttack(success) {
    if (!success) {
      let ns = addLog(state, `${attackerName} ${T.attackFailed}: ${targetTerritory} (${WEAPON_NAMES_AR[selectedWeapon.id]})`);
      await save(ns);
      showToast(T.attackFailed);
      return;
    }
    if (isHome) return showToast(T.homeTerritoryWarning);
    if (!isAdjacent) return showToast(T.notAdjacentWarning);

    const newHP = Math.max(0, currentHP - selectedWeapon.damage);
    let ns = { ...state, territoryHP: { ...state.territoryHP, [targetTerritory]: newHP } };

    if (newHP <= 0) {
      ns = {
        ...ns,
        territoryOwners: { ...state.territoryOwners, [targetTerritory]: attacker },
        territoryHP: { ...ns.territoryHP, [targetTerritory]: targetTier.hp },
      };
      ns = addLog(ns, `⚔ ${attackerName} ${T.captured} ${targetTerritory} (${WEAPON_NAMES_AR[selectedWeapon.id]})`);
      showToast(`${targetTerritory} ${T.captured}`);
    } else {
      ns = addLog(ns, `${attackerName} ${T.attackSuccessful}: ${targetTerritory} (${newHP}/${targetTier.hp} ${T.hpLeft})`);
      showToast(`${T.hpLeft}: ${newHP}`);
    }
    await save(ns);
  }

  return (
    <div>
      <div style={sectionLabel}>{T.attackingTeam}</div>
      <TeamSelector selected={attacker} onSelect={setAttacker} />

      <div style={sectionLabel}>{T.targetTerritory}</div>
      <select value={targetTerritory} onChange={e => setTargetTerritory(e.target.value)} style={selectStyle}>
        {TERRITORY_MAP.territories.map(t => {
          const owner = state.territoryOwners[t.id];
          const ownerName = owner ? TEAM_NAMES_AR[owner] : T.unclaimed;
          return <option key={t.id} value={t.id}>{t.id} — {ownerName}</option>;
        })}
      </select>

      <div style={{ background: '#15110d', border: '1px solid #2a2420', borderRadius: '10px', padding: '1rem 1.25rem', margin: '1rem 0' }}>
        <div style={{ fontSize: '13px', color: '#8a8378', marginBottom: '6px' }}>
          {T.owner}: {targetOwner ? TEAM_NAMES_AR[targetOwner] : T.unclaimed} · {TIER_NAMES_AR[target.tier]} · {currentHP}/{targetTier.hp} {T.hpLeft}
        </div>
        {!isAdjacent && <div style={{ fontSize: '12px', color: '#D85A30' }}>{T.notAdjacentWarning}</div>}
        {isHome && <div style={{ fontSize: '12px', color: '#D85A30' }}>{T.homeTerritoryWarning}</div>}
      </div>

      <div style={sectionLabel}>{T.weaponUsed}</div>
      <select value={weapon} onChange={e => setWeapon(e.target.value)} style={selectStyle}>
        {WEAPONS.map(w => <option key={w.id} value={w.id}>{w.icon} {WEAPON_NAMES_AR[w.id]} — {w.damage}</option>)}
      </select>

      <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
        <button onClick={() => resolveAttack(false)} style={{ ...quickBtnStyle('#888780'), flex: 1, padding: '14px' }}>
          {T.attackFailed}
        </button>
        <button onClick={() => resolveAttack(true)} style={{ ...quickBtnStyle('#D85A30'), flex: 1, padding: '14px' }}>
          {T.attackSuccessful}
        </button>
      </div>
    </div>
  );
}

const loadingStyle = { minHeight: '100vh', background: '#0a0806', color: '#8a8378', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', Tahoma, sans-serif" };
const toastStyle = { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#1a1410', border: '1px solid #e8a23c', color: '#e8a23c', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 };
const sectionLabel = { fontSize: '12px', color: '#8a8378', marginBottom: '8px', marginTop: '4px' };
const logoutBtnStyle = { padding: '8px 14px', background: '#1a1410', color: '#8a8378', border: '1px solid #2a2420', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' };
const selectStyle = { width: '100%', padding: '12px', background: '#15110d', color: '#e8e3d8', border: '1px solid #2a2420', borderRadius: '8px', fontSize: '14px', marginBottom: '1rem', boxSizing: 'border-box' };
const inputStyle = { padding: '12px', background: '#15110d', color: '#e8e3d8', border: '1px solid #2a2420', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };

function quickBtnStyle(color) {
  return { padding: '14px 0', background: color + '22', color, border: `1px solid ${color}`, borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' };
}
function tabStyle(active) {
  return { flex: 1, padding: '12px 8px', background: active ? '#1a1410' : 'transparent', color: active ? '#e8a23c' : '#8a8378', border: 'none', borderBottom: active ? '2px solid #e8a23c' : '2px solid transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' };
}
