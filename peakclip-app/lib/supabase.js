import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabaseClient() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjuiourlpbwivjzyewav.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyMTcsImV4cCI6MjA5NjE4NDIxN30.T3ajCu0Ne0YtTBhr6oqb9zCQ9MUBFOSKcV81Yp5MitE'
    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}
