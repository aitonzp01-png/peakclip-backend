'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '../../lib/supabase';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import './dashboard.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(3);
  const [plan, setPlan] = useState('free');
  const [clips, setClips] = useState([]);
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState('generate');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  // Settings states
  const [displayName, setDisplayName] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');

  // Main processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tools modal state
  const [activeModalTool, setActiveModalTool] = useState(null);
  const [modalUrl, setModalUrl] = useState('');
  const [selectedSubStyle, setSelectedSubStyle] = useState('viral');

  // Kebab menu dropdown active clip ID
  const [activeDropdownClipId, setActiveDropdownClipId] = useState(null);
  const dropdownRef = useRef(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownClipId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch session, user settings and clips
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);
      setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || '');
      
      // Fetch plan & credits
      const { data } = await getSupabaseClient().from('users').select('*').eq('id', user.id).single();
      if (data) {
        setCredits(data.credits);
        setPlan(data.plan);
      }
      loadClips(user.id);
    };

    getUser();

    // Reload clips when window gets focus
    const onFocus = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (user) {
        loadClips(user.id);
        const { data } = await getSupabaseClient().from('users').select('*').eq('id', user.id).single();
        if (data) {
          setCredits(data.credits);
          setPlan(data.plan);
        }
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const loadClips = async (userId) => {
    const { data } = await getSupabaseClient()
      .from('clips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setClips(data);
  };

  // Polling clip status
  useEffect(() => {
    if (!jobId) return;
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
        const res = await fetch(`${BACKEND_URL}/status/${jobId}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        // Map status messages to steps 0-5
        if (data.message?.toLowerCase().includes('download')) setStep(0);
        else if (data.message?.toLowerCase().includes('transcrib') || data.message?.toLowerCase().includes('audio')) setStep(1);
        else if (data.message?.toLowerCase().includes('analyz') || data.message?.toLowerCase().includes('gpt') || data.message?.toLowerCase().includes('moment')) setStep(2);
        else if (data.message?.toLowerCase().includes('generat') || data.message?.toLowerCase().includes('clip') || data.message?.toLowerCase().includes('cut')) setStep(3);
        else if (data.message?.toLowerCase().includes('subtitle')) setStep(4);
        else if (data.message?.toLowerCase().includes('upload') || data.message?.toLowerCase().includes('final')) setStep(5);

        if (data.status === 'done') {
          clearInterval(interval);
          setIsProcessing(false);
          setJobId(null);
          const clipId = data.clips?.[0]?.id || data.clip_id || '';
          if (clipId) {
            window.location.href = `/editor?id=${clipId}`;
          } else {
            setActiveTab('clips');
            if (user) loadClips(user.id);
          }
        } else if (data.status === 'error') {
          clearInterval(interval);
          setIsProcessing(false);
          setJobId(null);
          setToast({ type: 'error', text: data.message || 'Error al procesar el video' });
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId]);

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut();
    window.location.href = '/login';
  };

  const validateUrl = (input) => {
    return input && (
      input.includes('youtube.com') || input.includes('youtu.be') ||
      input.includes('tiktok.com') || input.includes('twitch.tv') ||
      input.includes('vimeo.com') || input.includes('dailymotion.com') ||
      input.includes('.mp4') || input.includes('.webm') ||
      input.includes('.mov') || input.startsWith('http')
    );
  };

  const handleSubmit = async () => {
    if (!url?.trim()) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 2000);
      return;
    }
    
    if (credits <= 0 && plan !== 'pro') {
      setToast({ type: 'error', text: 'No te quedan créditos. Mejora tu plan.' });
      return;
    }

    const trimmedUrl = url.trim();
    if (!validateUrl(trimmedUrl)) {
      setToast({ type: 'error', text: 'Introduce un enlace de video válido' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      const response = await fetch(`${BACKEND_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'processing') {
          setJobId(data.job_id);
          setIsProcessing(true);
          setStep(0);
        } else {
          // If already completed in one-shot
          const { data: newClips } = await getSupabaseClient()
            .from('clips')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (newClips?.length > 0) {
            window.location.href = `/editor?id=${newClips[0].id}`;
          } else {
            setActiveTab('clips');
            loadClips(user.id);
          }
        }
      } else {
        const err = await response.text();
        setToast({ type: 'error', text: `Error: ${err.slice(0, 100)}` });
      }
    } catch (err) {
      setToast({ type: 'error', text: `Error de conexión: ${err.message}` });
    }
    setUrl('');
    setLoading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;
    if (credits <= 0 && plan !== 'pro') {
      setToast({ type: 'error', text: 'No te quedan créditos. Mejora tu plan.' });
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('url', '');

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.job_id) {
          setJobId(data.job_id);
          setIsProcessing(true);
          setStep(0);
          setSelectedFile(null);
        }
      } else {
        const err = await response.text();
        setToast({ type: 'error', text: `Error al subir: ${err.slice(0, 100)}` });
      }
    } catch (err) {
      setToast({ type: 'error', text: `La subida falló: ${err.message}` });
    }
    setUploading(false);
  };

  const handleCheckout = async (priceId) => {
    if (!user) return;
    setCheckoutLoading(true);
    const { data: { session } } = await getSupabaseClient().auth.getSession();
    try {
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          price_id: priceId,
          return_url: window.location.origin + '/dashboard'
        })
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        setToast({ type: 'error', text: 'Error al abrir pasarela de pago.' });
      }
    } catch {
      setToast({ type: 'error', text: 'No se pudo conectar a la pasarela.' });
    }
    setCheckoutLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setSettingsStatus('El nombre no puede estar vacío');
      return;
    }
    setSaving(true);
    setSettingsStatus('');
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        data: { name: displayName.trim() }
      });
      if (error) throw error;
      setSettingsStatus('success: Perfil actualizado correctamente');
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      setSettingsStatus(`error: ${err.message || 'La actualización falló'}`);
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordNew) {
      setSettingsStatus('error: La nueva contraseña es obligatoria');
      return;
    }
    if (passwordNew.length < 6) {
      setSettingsStatus('error: Debe tener al menos 6 caracteres');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setSettingsStatus('error: Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    setSettingsStatus('');
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password: passwordNew });
      if (error) throw error;
      setSettingsStatus('success: Contraseña actualizada correctamente');
      setPasswordNew('');
      setPasswordConfirm('');
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      setSettingsStatus(`error: ${err.message || 'Fallo de actualización'}`);
    }
    setSaving(false);
  };

  const handleDownload = async (clip) => {
    const filename = `${clip.title?.slice(0, 40) || 'clip'}.mp4`;
    try {
      const response = await fetch(`${clip.video_url}?download=${encodeURIComponent(filename)}`, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      const a = document.createElement('a');
      a.href = `${clip.video_url}?download=${encodeURIComponent(filename)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  const handleRenameClip = async (clipId, currentTitle) => {
    const newTitle = prompt('Nuevo título para el clip:', currentTitle);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
      setToast({ type: 'error', text: 'El título no puede estar vacío' });
      return;
    }
    try {
      const { error } = await getSupabaseClient()
        .from('clips')
        .update({ title: newTitle.trim() })
        .eq('id', clipId);
      if (error) throw error;
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, title: newTitle.trim() } : c));
      setToast({ type: 'success', text: 'Clip renombrado correctamente' });
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Error al renombrar' });
    }
  };

  const handleDeleteClip = async (clipId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este clip?')) return;
    try {
      const { error } = await getSupabaseClient()
        .from('clips')
        .delete()
        .eq('id', clipId);
      if (error) throw error;
      setClips(prev => prev.filter(c => c.id !== clipId));
      setToast({ type: 'success', text: 'Clip eliminado correctamente' });
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Error al eliminar' });
    }
  };

  const handleModalSubmit = (toolName) => {
    // Process tool action
    if (!modalUrl.trim()) {
      setToast({ type: 'error', text: 'Pega un enlace antes de procesar' });
      return;
    }
    setToast({ type: 'success', text: `Procesando con ${toolName}...` });
    setActiveModalTool(null);
    setModalUrl('');
  };

  // Static Tools Definition
  const tools = [
    {
      id: 'clips',
      name: 'Clips automáticos',
      badge: '',
      desc: 'Genera clips virales automáticamente de tu video con IA.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
          <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
        </svg>
      )
    },
    {
      id: 'subtitles',
      name: 'Subtítulos IA',
      badge: 'Nuevo',
      desc: 'Añade subtítulos elegantes o traduce tu contenido con un clic.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h4M7 11h10" />
        </svg>
      )
    },
    {
      id: 'editor',
      name: 'Editor de video',
      badge: '',
      desc: 'Edita tus clips directamente en el navegador.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      )
    },
    {
      id: 'voice',
      name: 'Mejorar voz',
      badge: 'Nuevo',
      desc: 'Mejora la calidad de voz de tu video automáticamente.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )
    },
    {
      id: 'reframe',
      name: 'Reencuadre IA',
      badge: '',
      desc: 'Reencuadre tu video verticalmente con seguimiento de cara.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )
    },
    {
      id: 'schedule',
      name: 'Programar',
      badge: 'Próx.',
      desc: 'Programa la publicación automática en tus redes sociales.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'analytics_tool',
      name: 'Analíticas',
      badge: 'Próx.',
      desc: 'Analiza el rendimiento de tus clips en todas las plataformas.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    {
      id: 'export',
      name: 'Exportar',
      badge: '',
      desc: 'Exporta tus clips en el formato y resolución que necesites.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )
    }
  ];

  // Helper for processing step SVGs
  const getStepIcon = (index) => {
    switch (index) {
      case 0:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        );
      case 1:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        );
      case 2:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 3:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
          </svg>
        );
      case 4:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h4M7 11h10" />
          </svg>
        );
      case 5:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const stepsDetails = [
    { label: 'Descargando video...' },
    { label: 'Transcribiendo audio con IA...' },
    { label: 'Analizando momentos virales...' },
    { label: 'Generando clips...' },
    { label: 'Añadiendo subtítulos...' },
    { label: 'Finalizando exportación...' }
  ];

  // Pricing Plans
  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      clips: '3 clips/month',
      features: ['3 créditos', 'Formato vertical 9:16', 'Subtítulos básicos'],
      cta: 'Plan actual',
      disabled: true
    },
    {
      name: 'Creator',
      price: '$26.99',
      period: '/month',
      clips: '200 clips/month',
      features: ['200 créditos', 'Subtítulos animados', 'Plantillas de gameplay', 'Exportación HD'],
      cta: 'Empezar con Creator',
      price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR || 'price_creator',
      popular: true
    },
    {
      name: 'Pro',
      price: '$69.99',
      period: '/month',
      clips: 'Ilimitados',
      features: ['Créditos ilimitados', 'Editor avanzado', 'Auto-publicar en redes', 'Puntuación viral IA', 'Soporte prioritario'],
      cta: 'Empezar con Pro',
      price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro'
    }
  ];

  return (
    <div className="db-layout">
      {/* SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        plan={plan}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* TOPBAR */}
      <Topbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        plan={plan}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT CONTAINER */}
      <main className="db-content">
        {/* PROCESSING WINDOW OVERLAY VIEW */}
        {isProcessing ? (
          <div className="db-processing-view">
            <div className="db-processing-spinner-container">
              <div className="db-spinner-bg" />
              <div className="db-spinner-fg" />
              <div className="db-spinner-icon">
                {getStepIcon(step)}
              </div>
            </div>
            
            <h2 className="db-step-title">{stepsDetails[step]?.label}</h2>
            <p className="db-step-subtitle">Esto puede tomar unos minutos...</p>

            {/* Progress bar */}
            <div className="db-progress-container">
              <div className="db-progress-text-row">
                <span className="db-progress-step">Paso {step + 1} de 6</span>
                <span className="db-progress-percent">{Math.round(((step + 1) / 6) * 100)}%</span>
              </div>
              <div className="db-progress-track">
                <div className="db-progress-fill" style={{ width: `${((step + 1) / 6) * 100}%` }} />
              </div>
            </div>

            {/* List of 6 steps */}
            <div className="db-steps-list">
              {stepsDetails.map((s, index) => (
                <div
                  key={index}
                  className={`db-step-item ${
                    index < step ? 'completed' : index === step ? 'current' : 'pending'
                  }`}
                >
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                    {index < step ? '✓' : index === step ? '▶' : '○'}
                  </span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* VIEW: GENERATE / INICIO */}
            {activeTab === 'generate' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Primary Card */}
                <div className="db-input-card">
                  <h1 className="db-input-card-title">Convierte tu próximo video en clips virales</h1>
                  <p className="db-input-card-subtitle">Pega un link o sube tu archivo</p>

                  <div className={`db-url-container ${shakeInput ? 'shake' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9aa3" strokeWidth="2" strokeLinecap="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Pega un enlace de YouTube, Twitch..."
                      className="db-url-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="db-secondary-row">
                    <input
                      type="file"
                      accept="video/*"
                      id="video-file-picker"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    
                    <button
                      onClick={() => document.getElementById('video-file-picker').click()}
                      className="db-secondary-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Subir archivo
                    </button>

                    <button
                      onClick={() => setToast({ type: 'success', text: 'Conectando con Google Drive...' })}
                      className="db-secondary-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path d="M6.5 20L1 11l4-7h14l4 7-9 9z" fill="none"/>
                        <path d="M1 11l5.5 9h11L23 11H1z" fill="#4285F4" opacity="0.8"/>
                        <path d="M9 4L1 11h6l5-7H9z" fill="#34A853" opacity="0.9"/>
                        <path d="M15 4l-5 7h7l5-7h-7z" fill="#FBBC05" opacity="0.9"/>
                        <path d="M8 11l-2 9 6-9H8z" fill="#1A73E8"/>
                        <path d="M16 11h-4l-6 9h5l5-9z" fill="#EA4335" opacity="0.8"/>
                      </svg>
                      Google Drive
                    </button>

                    {selectedFile && (
                      <span style={{ fontSize: '12px', color: '#6b6b72', display: 'flex', alignItems: 'center' }}>
                        Seleccionado: {selectedFile.name}
                      </span>
                    )}
                  </div>

                  {selectedFile ? (
                    <button
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="db-primary-btn"
                    >
                      {uploading ? (
                        <>
                          <svg className="db-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#f5f5f0" stroke-width="3" stroke-linecap="round" />
                          </svg>
                          Subiendo archivo de video...
                        </>
                      ) : (
                        'Subir y Procesar Video'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="db-primary-btn"
                    >
                      {loading ? (
                        <>
                          <svg className="db-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#f5f5f0" stroke-width="3" stroke-linecap="round" />
                          </svg>
                          Procesando tu video...
                        </>
                      ) : (
                        'Obtener clips en 1 clic'
                      )}
                    </button>
                  )}
                </div>

                {/* HORIZONTAL TOOLS CAROUSEL */}
                <div className="db-tools-section">
                  <span className="db-section-label" style={{ paddingLeft: '0', display: 'block', marginBottom: '14px', textAlign: 'center' }}>
                    Herramientas
                  </span>
                  
                  <div className="db-tools-grid">
                    {tools.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setActiveModalTool(t)}
                        className="db-tool-wrapper"
                      >
                        <div className="db-tool-icon-box">
                          {t.icon}
                          {t.badge && <span className="db-tool-badge">{t.badge}</span>}
                        </div>
                        <span className="db-tool-label">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECENT PROJECTS / CLIPS (Shows top 3) */}
                <div className="db-projects-section">
                  <div className="db-projects-header">
                    <span className="db-section-label" style={{ paddingLeft: '0', margin: '0' }}>Clips Recientes</span>
                    <button onClick={() => setActiveTab('clips')} className="db-footer-link" style={{ fontSize: '13px', fontWeight: '600' }}>
                      Ver todos →
                    </button>
                  </div>
                  
                  {clips.length === 0 ? (
                    <div className="db-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e0e0da" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="4" />
                        <polygon points="10 8 16 12 10 16 10 8" fill="#e0e0da" stroke="none" />
                      </svg>
                      <h3 className="db-empty-title">Aún no tienes clips</h3>
                      <p className="db-empty-subtitle">Pega un link arriba para generar tu primer clip viral.</p>
                    </div>
                  ) : (
                    <div className="db-clips-grid">
                      {clips.slice(0, 4).map((clip) => (
                        <div
                          key={clip.id}
                          className="db-clip-card"
                          onClick={() => window.location.href = `/editor?id=${clip.id}`}
                        >
                          <div className="db-clip-thumbnail">
                            {clip.thumbnail_url ? (
                              <Image
                                src={clip.thumbnail_url}
                                alt={clip.title || 'Miniatura del clip'}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="db-clip-img"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="db-clip-thumb-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                                </svg>
                                <span style={{ fontSize: '11px', marginTop: '4px' }}>
                                  {clip.status === 'processing' ? 'Procesando...' : 'Sin vista previa'}
                                </span>
                              </div>
                            )}
                            
                            {/* NEW badge if created in last 24h */}
                            {new Date() - new Date(clip.created_at) < 24 * 60 * 60 * 1000 && (
                              <span className="db-clip-new-badge">Nuevo</span>
                            )}
                          </div>
                          
                          <div className="db-clip-info">
                            <span className="db-clip-title">{clip.title || 'Clip sin título'}</span>
                            <span className="db-clip-platform">{clip.platform || 'YouTube'}</span>
                            
                            <div className="db-clip-footer">
                              <span className="db-clip-date">
                                {new Date(clip.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                              </span>
                              
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownClipId(activeDropdownClipId === clip.id ? null : clip.id);
                                  }}
                                  className="db-clip-menu-btn"
                                >
                                  ···
                                </button>

                                {activeDropdownClipId === clip.id && (
                                  <div className="db-dropdown" ref={dropdownRef}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownClipId(null);
                                        handleRenameClip(clip.id, clip.title);
                                      }}
                                      className="db-dropdown-item"
                                    >
                                      Renombrar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownClipId(null);
                                        handleDownload(clip);
                                      }}
                                      className="db-dropdown-item"
                                    >
                                      Descargar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownClipId(null);
                                        handleDeleteClip(clip.id);
                                      }}
                                      className="db-dropdown-item delete"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW: NEW CAMPAIGN */}
            {activeTab === 'new_campaign' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="db-input-card"
                style={{ textAlign: 'center', padding: '60px 40px' }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <h2 className="db-empty-title">Crear Nueva Campaña</h2>
                <p className="db-empty-subtitle" style={{ maxWidth: '400px', margin: '6px auto 20px' }}>
                  Agrupa tus videos y clips bajo una misma campaña para organizar tu contenido de forma más inteligente.
                </p>
                <button
                  onClick={() => {
                    const name = prompt('Nombre de la campaña:');
                    if (name) {
                      setToast({ type: 'success', text: `Campaña "${name}" creada correctamente` });
                      setActiveTab('generate');
                    }
                  }}
                  className="db-empty-action-btn"
                >
                  Empezar campaña
                </button>
              </motion.div>
            )}

            {/* VIEW: CLIPS */}
            {activeTab === 'clips' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="db-projects-section"
                style={{ marginTop: 0 }}
              >
                <div className="db-projects-header">
                  <div className="db-tabs-container">
                    <button className="db-tab-btn active">
                      Todos los proyectos ({clips.length})
                    </button>
                    <button
                      onClick={() => setToast({ type: 'success', text: 'Mostrando guardados (0)' })}
                      className="db-tab-btn inactive"
                    >
                      Guardados (0)
                    </button>
                  </div>
                  <span className="db-storage-info">0 GB / 10 GB</span>
                </div>

                {clips.length === 0 ? (
                  <div className="db-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e0e0da" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="#e0e0da" stroke="none" />
                    </svg>
                    <h3 className="db-empty-title">Aún no tienes clips</h3>
                    <p className="db-empty-subtitle">Pega un link en el inicio para generar tu primer clip viral.</p>
                    <button onClick={() => setActiveTab('generate')} className="db-empty-action-btn">
                      Crear primer clip
                    </button>
                  </div>
                ) : (
                  <div className="db-clips-grid">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="db-clip-card"
                        onClick={() => window.location.href = `/editor?id=${clip.id}`}
                      >
                        <div className="db-clip-thumbnail">
                          {clip.thumbnail_url ? (
                            <Image
                              src={clip.thumbnail_url}
                              alt={clip.title || 'Miniatura del clip'}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="db-clip-img"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="db-clip-thumb-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                              </svg>
                              <span style={{ fontSize: '11px', marginTop: '4px' }}>
                                {clip.status === 'processing' ? 'Procesando...' : 'Sin vista previa'}
                              </span>
                            </div>
                          )}
                          
                          {new Date() - new Date(clip.created_at) < 24 * 60 * 60 * 1000 && (
                            <span className="db-clip-new-badge">Nuevo</span>
                          )}
                        </div>
                        
                        <div className="db-clip-info">
                          <span className="db-clip-title">{clip.title || 'Clip sin título'}</span>
                          <span className="db-clip-platform">{clip.platform || 'YouTube'}</span>
                          
                          <div className="db-clip-footer">
                            <span className="db-clip-date">
                              {new Date(clip.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                            </span>
                            
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownClipId(activeDropdownClipId === clip.id ? null : clip.id);
                                }}
                                className="db-clip-menu-btn"
                              >
                                ···
                              </button>

                              {activeDropdownClipId === clip.id && (
                                <div className="db-dropdown" ref={dropdownRef}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownClipId(null);
                                      handleRenameClip(clip.id, clip.title);
                                    }}
                                    className="db-dropdown-item"
                                  >
                                    Renombrar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownClipId(null);
                                      handleDownload(clip);
                                    }}
                                    className="db-dropdown-item"
                                  >
                                    Descargar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownClipId(null);
                                      handleDeleteClip(clip.id);
                                    }}
                                    className="db-dropdown-item delete"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW: CALENDAR */}
            {activeTab === 'calendar' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="db-input-card"
                style={{ textAlign: 'center', padding: '60px 40px' }}
              >
                <h2 className="db-empty-title">Calendario de Publicaciones</h2>
                <p className="db-empty-subtitle" style={{ maxWidth: '320px', margin: '6px auto 20px' }}>
                  Programa y organiza tus publicaciones automáticas en tus redes sociales.
                </p>
                <span className="db-nav-badge" style={{ fontSize: '12px', padding: '6px 12px' }}>Próximamente</span>
              </motion.div>
            )}

            {/* VIEW: ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="db-input-card"
                style={{ textAlign: 'center', padding: '60px 40px' }}
              >
                <h2 className="db-empty-title">Analíticas y Métricas</h2>
                <p className="db-empty-subtitle" style={{ maxWidth: '320px', margin: '6px auto 20px' }}>
                  Descubre qué clips están rindiendo mejor y el alcance total de tus contenidos.
                </p>
                <span className="db-nav-badge" style={{ fontSize: '12px', padding: '6px 12px' }}>Próximamente</span>
              </motion.div>
            )}

            {/* VIEW: SOCIAL */}
            {activeTab === 'social' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="db-input-card"
                style={{ textAlign: 'center', padding: '60px 40px' }}
              >
                <h2 className="db-empty-title">Redes Sociales Vinculadas</h2>
                <p className="db-empty-subtitle" style={{ maxWidth: '320px', margin: '6px auto 20px' }}>
                  Conecta tus cuentas de TikTok, Instagram, YouTube Shorts y Facebook Reels.
                </p>
                <button
                  onClick={() => setToast({ type: 'success', text: 'Redes vinculadas (demo)' })}
                  className="db-empty-action-btn"
                >
                  Vincular canal
                </button>
              </motion.div>
            )}

            {/* VIEW: UPGRADE */}
            {activeTab === 'upgrade' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="db-pricing-grid">
                  {pricingPlans.map((p, idx) => (
                    <div
                      key={idx}
                      className="db-input-card"
                      style={{
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: p.popular ? '2px solid #0f0f0f' : '1px solid #e8e8e2',
                        position: 'relative'
                      }}
                    >
                      {p.popular && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#0f0f0f',
                            color: '#c4ff3d',
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '4px 12px',
                            borderRadius: '100px',
                            textTransform: 'uppercase'
                          }}
                        >
                          Popular
                        </div>
                      )}
                      
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {p.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '900' }}>{p.price}</span>
                          <span style={{ fontSize: '12px', color: '#6b6b72' }}>{p.period}</span>
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#6b6b72' }}>
                          {p.clips}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                          {p.features.map((f, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                              <span style={{ color: '#22c55e' }}>✓</span>
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => !p.disabled && handleCheckout(p.price_id)}
                        disabled={p.disabled || checkoutLoading}
                        className={p.popular ? 'db-primary-btn' : 'db-secondary-btn'}
                        style={{
                          width: '100%',
                          marginTop: 0,
                          backgroundColor: p.disabled ? '#f0f0ea' : p.popular ? '#0f0f0f' : 'transparent',
                          color: p.disabled ? '#9a9aa3' : p.popular ? '#f5f5f0' : '#0f0f0f',
                          justifyContent: 'center'
                        }}
                      >
                        {checkoutLoading ? 'Redireccionando...' : p.cta}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* VIEW: SETTINGS */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px', margin: '0 auto' }}>
                  {/* Profile Card */}
                  <div className="db-input-card" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Mi Perfil
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#6b6b72', marginBottom: '4px', fontWeight: '600' }}>
                          Nombre a mostrar
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="db-modal-input"
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#6b6b72', marginBottom: '4px', fontWeight: '600' }}>
                          Correo electrónico
                        </label>
                        <input
                          type="text"
                          value={user?.email || ''}
                          disabled
                          className="db-modal-input"
                          style={{ marginBottom: 0, opacity: 0.6, cursor: 'not-allowed' }}
                        />
                      </div>

                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="db-primary-btn"
                        style={{ marginTop: '12px', padding: '12px' }}
                      >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>

                  {/* Password Card */}
                  <div className="db-input-card" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Cambiar contraseña
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#6b6b72', marginBottom: '4px', fontWeight: '600' }}>
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          value={passwordNew}
                          onChange={(e) => setPasswordNew(e.target.value)}
                          className="db-modal-input"
                          style={{ marginBottom: 0 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#6b6b72', marginBottom: '4px', fontWeight: '600' }}>
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          className="db-modal-input"
                          style={{ marginBottom: 0 }}
                        />
                      </div>

                      <button
                        onClick={handleUpdatePassword}
                        disabled={saving}
                        className="db-primary-btn"
                        style={{ marginTop: '12px', padding: '12px' }}
                      >
                        {saving ? 'Actualizando...' : 'Actualizar contraseña'}
                      </button>
                    </div>
                  </div>

                  {/* Settings Status Banner */}
                  {settingsStatus && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: settingsStatus.startsWith('success') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${settingsStatus.startsWith('success') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: settingsStatus.startsWith('success') ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {settingsStatus.replace('success: ', '').replace('error: ', '')}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* HORIZONTAL TOOLS POPUP DIALOGS */}
      <AnimatePresence>
        {activeModalTool && (
          <div className="db-modal-overlay" onClick={() => setActiveModalTool(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="db-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModalTool(null)}
                className="db-modal-close"
                aria-label="Cerrar modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h2 className="db-modal-title">{activeModalTool.name}</h2>
              <p className="db-modal-desc">{activeModalTool.desc}</p>

              {/* Subtítulos IA styles grid */}
              {activeModalTool.id === 'subtitles' && (
                <div className="db-caption-grid">
                  <div
                    onClick={() => setSelectedSubStyle('viral')}
                    className={`db-caption-style-card ${selectedSubStyle === 'viral' ? 'active' : ''}`}
                  >
                    <div className="db-caption-style-text" style={{ backgroundColor: '#0f0f0f', color: '#c4ff3d' }}>
                      VIRAL
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedSubStyle('minimal')}
                    className={`db-caption-style-card ${selectedSubStyle === 'minimal' ? 'active' : ''}`}
                  >
                    <div className="db-caption-style-text" style={{ backgroundColor: '#ffffff', color: '#0f0f0f', border: '1px solid #e0e0da' }}>
                      Minimal
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedSubStyle('bold')}
                    className={`db-caption-style-card ${selectedSubStyle === 'bold' ? 'active' : ''}`}
                  >
                    <div className="db-caption-style-text" style={{ backgroundColor: '#ff4500', color: '#ffffff' }}>
                      BOLD
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedSubStyle('neon')}
                    className={`db-caption-style-card ${selectedSubStyle === 'neon' ? 'active' : ''}`}
                  >
                    <div className="db-caption-style-text" style={{ backgroundColor: '#0f0f0f', color: '#39ff14', textShadow: '0 0 5px #39ff14' }}>
                      NEON
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Modal Inputs */}
              <input
                type="text"
                value={modalUrl}
                onChange={(e) => setModalUrl(e.target.value)}
                placeholder="Pega un enlace de YouTube..."
                className="db-modal-input"
              />

              <div className="db-modal-links-row">
                <button
                  onClick={() => setToast({ type: 'success', text: 'Subiendo archivo local...' })}
                  className="db-modal-link-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Subir archivo
                </button>
                
                <button
                  onClick={() => setToast({ type: 'success', text: 'Conectando con Google Drive...' })}
                  className="db-modal-link-btn"
                >
                  Google Drive
                </button>
              </div>

              <button
                onClick={() => handleModalSubmit(activeModalTool.name)}
                className="db-modal-action-btn"
              >
                Procesar con {activeModalTool.name}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST POPUP BANNER */}
      {toast && (
        <div className={`db-toast ${toast.type}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
