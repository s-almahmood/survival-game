// ============================================================
// CORE GAME CONFIG — all the numbers we locked in during design
// Admin can tweak these later; this is the starting baseline.
// ============================================================

export const STARTING_UNITS = 30;

export const TEAMS = [
  { id: 't1', name: 'Team 1', color: '#D85A30' },
  { id: 't2', name: 'Team 2', color: '#378ADD' },
  { id: 't3', name: 'Team 3', color: '#5C8A3A' },
  { id: 't4', name: 'Team 4', color: '#BA7517' },
  { id: 't5', name: 'Team 5', color: '#7F77DD' },
  { id: 't6', name: 'Team 6', color: '#D6499A' },
];

export const ZONES = [
  { id: 'cold', name: 'Cold', color: '#7FA8C9', icon: '❄️' },
  { id: 'temperate', name: 'Temperate', color: '#7CA85C', icon: '🌾' },
  { id: 'coastal', name: 'Coastal', color: '#4FA6A8', icon: '🌊' },
  { id: 'desert', name: 'Desert', color: '#C9A05C', icon: '🏜️' },
];

export const TERRITORY_TIERS = {
  1: { cost: 20, production: 2, upkeep: 1, hp: 40, label: 'Tier 1' },
  2: { cost: 30, production: 4, upkeep: 2, hp: 60, label: 'Tier 2' },
  3: { cost: 40, production: 6, upkeep: 3, hp: 80, label: 'Tier 3' },
};

export const WEAPONS = [
  { id: 'sling', name: 'Sling', cost: 5, damage: 10, icon: '🪨' },
  { id: 'spear', name: 'Spear', cost: 10, damage: 20, icon: '🔱' },
  { id: 'bow', name: 'Bow', cost: 15, damage: 30, icon: '🏹' },
];

// Goods: each has a home zone, a "kind" (raw or crafted), an icon,
// home price (cheap, since it's abundant there) and away price (expensive elsewhere).
// Crafted goods are made from their paired raw good via a mini-challenge.
export const GOODS = [
  // Cold
  { id: 'timber', name: 'Timber', zone: 'cold', kind: 'raw', icon: '🪵', homePrice: 3, awayPrice: 5 },
  { id: 'pelts', name: 'Pelts', zone: 'cold', kind: 'raw', icon: '🐺', homePrice: 4, awayPrice: 7 },
  { id: 'firewood', name: 'Firewood Bundles', zone: 'cold', kind: 'crafted', icon: '🔥', homePrice: 7, awayPrice: 10, craftedFrom: 'timber' },
  { id: 'furcoats', name: 'Fur Coats', zone: 'cold', kind: 'crafted', icon: '🧥', homePrice: 9, awayPrice: 13, craftedFrom: 'pelts' },

  // Temperate
  { id: 'grain', name: 'Grain', zone: 'temperate', kind: 'raw', icon: '🌾', homePrice: 3, awayPrice: 5 },
  { id: 'livestock', name: 'Livestock', zone: 'temperate', kind: 'raw', icon: '🐄', homePrice: 4, awayPrice: 7 },
  { id: 'bread', name: 'Bread', zone: 'temperate', kind: 'crafted', icon: '🍞', homePrice: 7, awayPrice: 10, craftedFrom: 'grain' },
  { id: 'curedmeat', name: 'Cured Meat', zone: 'temperate', kind: 'crafted', icon: '🥩', homePrice: 9, awayPrice: 13, craftedFrom: 'livestock' },

  // Coastal
  { id: 'fish', name: 'Fish', zone: 'coastal', kind: 'raw', icon: '🐟', homePrice: 3, awayPrice: 5 },
  { id: 'shells', name: 'Shells', zone: 'coastal', kind: 'raw', icon: '🐚', homePrice: 4, awayPrice: 7 },
  { id: 'smokedfish', name: 'Smoked Fish', zone: 'coastal', kind: 'crafted', icon: '🍲', homePrice: 7, awayPrice: 10, craftedFrom: 'fish' },
  { id: 'pearls', name: 'Pearls', zone: 'coastal', kind: 'crafted', icon: '💎', homePrice: 10, awayPrice: 14, craftedFrom: 'shells' },

  // Desert
  { id: 'ore', name: 'Ore', zone: 'desert', kind: 'raw', icon: '⛏️', homePrice: 4, awayPrice: 6 },
  { id: 'herbs', name: 'Rare Herbs', zone: 'desert', kind: 'raw', icon: '🌿', homePrice: 5, awayPrice: 8 },
  { id: 'tools', name: 'Tools & Weapons', zone: 'desert', kind: 'crafted', icon: '⚔️', homePrice: 9, awayPrice: 13, craftedFrom: 'ore' },
  { id: 'medicine', name: 'Medicine', zone: 'desert', kind: 'crafted', icon: '🧪', homePrice: 10, awayPrice: 14, craftedFrom: 'herbs' },
];

export const REASON_TAGS = [
  'Challenge win',
  'Bazaar sale',
  'Crafting',
  'Trade',
  'Upkeep',
  'Production',
  'Territory purchase',
  'Weapon purchase',
  'Attack',
  'Other',
];

export function getGoodById(id) {
  return GOODS.find(g => g.id === id);
}
export function getZoneById(id) {
  return ZONES.find(z => z.id === id);
}
export function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}
export function goodsByZone(zoneId) {
  return GOODS.filter(g => g.zone === zoneId);
}
