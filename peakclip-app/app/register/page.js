'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AuthLayout from '../auth/AuthLayout';
import { getSupabaseClient } from '../../lib/supabase';
import '../auth/auth.css';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const callbackUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent('/dashboard')}`;
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  const autoConfirmEmail = async (userId, token) => {
    try {
      await fetch('/api/auth/auto-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
    } catch (e) {
      console.error('Auto-confirm failed:', e);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.email || !form.password) {
      setMessage({ type: 'error', text: 'Introduce correo y contraseña.' });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setMessage({ type: 'error', text: signUpError.message });
      setLoading(false);
      return;
    }

    // Sign in to get a session, then auto-confirm email
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setMessage({ type: 'error', text: signInError.message });
      setLoading(false);
      return;
    }

    const user = signInData.user;
    const token = signInData.session?.access_token;
    if (user && token) {
      await autoConfirmEmail(user.id, token);
    }

    router.replace('/dashboard');
    setLoading(false);
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="auth-card"
      >
        <h2 className="auth-title">CREA TU CUENTA</h2>
        <p className="auth-subtitle">Regístrate gratis y empieza a crear clips virales.</p>

        <button onClick={handleGoogleLogin} disabled={loading} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <div className="auth-separator">
          <div className="line" />
          <span className="text">o regístrate con correo</span>
          <div className="line" />
        </div>

        <form onSubmit={handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="email-input"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="email-input"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Repite la contraseña"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="email-input"
          />
          <button type="submit" disabled={loading} className="email-btn active">
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="auth-legal">
          Al continuar, aceptas los <a href="/terms">Términos de servicio</a> y la <a href="/privacy">Política de privacidad</a>.
        </p>

        <p className="auth-switch">
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión →</a>
        </p>

        {message.text && (
          <div
            style={{
              marginTop: '20px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : '#f0f0ea',
              border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.2)' : '#e8e8e2'}`,
              color: message.type === 'error' ? '#ef4444' : '#0f0f0f',
            }}
          >
            {message.text}
          </div>
        )}
      </motion.div>
    </AuthLayout>
  );
}
