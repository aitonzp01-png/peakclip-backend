import React from 'react';
import './auth.css';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrapper">
      {/* Subtle red blob */}
      <svg width={820} height={820} className="auth-blob">
        <defs>
          <radialGradient id="blobGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff1f1f" stopOpacity="0.18" />
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
          <span className="logo-underline" />
        </span>
      </a>

      {children}
    </div>
  );
}
