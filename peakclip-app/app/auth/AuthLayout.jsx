import React, { useEffect } from 'react';
import './auth.css';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../lib/supabase';

export default function AuthLayout({ children, skipRedirect = false }) {
  const router = useRouter();

  // If user already authenticated, redirect to dashboard
  useEffect(() => {
    (async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (user && !skipRedirect) router.replace('/dashboard');
    })();
  }, [router]);

  return (
    <div className="auth-wrapper">
      {/* Animated blob */}
      <svg width={820} height={820} className="auth-blob">
        <defs>
          <radialGradient id="blobGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4ff3d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="410" cy="410" r="410" fill="url(#blobGrad)" />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-52% 0; -48% 28px; -52% 0"
          dur="14s"
          repeatCount="indefinite"
          keyTimes="0;0.5;1"
          calcMode="linear"
        />
      </svg>

      {/* Logo */}
      <a href="/landing" className="auth-logo">
        PEAK<span style={{ position: 'relative' }}>CLIP
          <span style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -2,
            height: 2,
            background: '#c4ff3d',
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.6s ease 0.4s',
          }} className="logo-underline" />
        </span>
      </a>

      {children}
    </div>
  );
}
