import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzrvsctocgcnqxvunukh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cnZzY3RvY2djbnF4dnVudWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzY0NjIsImV4cCI6MjA4MTAxMjQ2Mn0.JUB22QIyaNMqise1V8WdHMoWeRLjsTcp7e7ZySdovpk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);