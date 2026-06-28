import { TEAMS } from './gameConfig.js';

// Simple fixed credentials for a single live event — not meant to be
// secure auth, just a gate so each role/team only sees their own screen.
export const ACCOUNTS = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'helper', password: 'helper', role: 'helper' },
  ...TEAMS.map((t, i) => ({
    username: `team${i + 1}`,
    password: `team${i + 1}`,
    role: 'team',
    teamId: t.id,
  })),
];

export function checkLogin(username, password) {
  const match = ACCOUNTS.find(
    a => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
  );
  return match || null;
}
