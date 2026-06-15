import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjuiourlpbwivjzyewav.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwODIxNywiZXhwIjoyMDk2MTg0MjE3fQ.XcxhPAO1Ikl6wl6ydA_YnNiYLX2rMF3iMp8wBxFQadA'
    )

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
