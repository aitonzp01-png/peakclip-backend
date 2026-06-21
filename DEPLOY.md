# Deploy PeakClip

## 1. Vercel (Frontend)

1. Ir a https://vercel.com/new
2. Importar repo: `peakclipnuevo/peakclipnuevo`
3. Root Directory: `peakclip-app`
4. Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tjuiourlpbwivjzyewav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyMTcsImV4cCI6MjA5NjE4NDIxN30.T3ajCu0Ne0YtTBhr6oqb9zCQ9MUBFOSKcV81Yp5MitE
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwODIxNywiZXhwOjIwOTYxODQyMTd9.XcxhPAO1Ikl6wl6ydA_YnNiYLX2rMF3iMp8wBxFQadA
```

5. Click "Deploy"
6. Copiar URL (ej: https://peakclip-app.vercel.app)

## 2. Render (Backend)

1. Ir a https://dashboard.render.com/blueprints
2. Conectar el mismo repo de GitHub
3. Render detecta `render.yaml` automaticamente
4. Agregar Environment Variables secretas:

```
OPENAI_API_KEY=sk-tu-key
SUPABASE_URL=https://tjuiourlpbwivjzyewav.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwODIxNywiZXhwOjIwOTYxODQyMTd9.XcxhPAO1Ikl6wl6ydA_YnNiYLX2rMF3iMp8wBxFQadA
STRIPE_SECRET_KEY=sk_live_tu-key
STRIPE_WEBHOOK_SECRET=whsec_tu-key
```

5. Deploy
6. Copiar URL (ej: https://peakclip-backend.onrender.com)

## 3. Conectar Frontend con Backend

1. Ir a https://vercel.com -> Dashboard -> peakclip-app -> Settings -> Environment Variables
2. Cambiar `NEXT_PUBLIC_BACKEND_URL` a la URL de Render (ej: https://peakclip-backend.onrender.com)
3. Ir a Deployments -> redeploy
