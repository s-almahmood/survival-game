import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewdaiyarupacqdokdsxt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BnX9CKUjfZK0A2Ev5QJk8Q_y6k9rxow';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// We use a single fixed row (id = 1) to hold the entire game state as one JSON blob.
export const GAME_ROW_ID = 1;
