'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Bot,
  Search,
  Zap,
  BarChart3,
  Clapperboard,
  Medal,
  Check,
  Star,
  Sparkles,
  ArrowLeft,
  Play,
  Youtube,
  Globe,
  Music,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import '../dashboard.css';

const SOURCES = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, enabled: true },
  { id: 'tiktok', label: 'TikTok', icon: Music, enabled: false },
  { id: 'reddit', label: 'Reddit', icon: MessageCircle, enabled: false },
  { id: 'mixed', label: 'Mixed Sources', icon: Globe, enabled: false },
];

const RANKING_SIZES = [
  { value: 3, label: 'Top 3' },
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
];

const VIDEO_LENGTHS = [30, 45, 60];

const LANGUAGES = ['English', 'Spanish', 'Portuguese'];

const SIMULATION_STEPS = [
  {
    icon: Bot,
    label: 'AI Research Agent',
    subtitle: 'Searching YouTube...',
    checkText: '245 videos found',
  },
  {
    icon: Search,
    label: 'Analyzing content',
    subtitle: 'Evaluating engagement metrics...',
    checkText: 'Content analyzed',
  },
  {
    icon: Zap,
    label: 'Detecting viral moments',
    subtitle: 'Scanning for peak retention...',
    checkText: 'Viral moments detected',
  },
  {
    icon: BarChart3,
    label: 'Ranking clips',
    subtitle: 'Sorting by viral potential...',
    checkText: 'Ranking complete',
  },
  {
    icon: Clapperboard,
    label: 'Preparing final ranking',
    subtitle: 'Generating previews...',
    checkText: 'Ready',
  },
];

const STEP_SUBTITLES = [
  'Searching YouTube for relevant videos...',
  'Analyzing engagement and view metrics...',
  'Detecting viral moments in each video...',
  'Ranking clips by viral potential score...',
  'Preparing your final ranking preview...',
];

const MOCK_RESULTS = [
  { rank: 1, title: 'Epic Parkour Fail', score: 98, duration: 5.4 },
  { rank: 2, title: 'Unbelievable Skateboard Trick', score: 94, duration: 7.2 },
  { rank: 3, title: 'Cat vs. Cucumber Compilation', score: 89, duration: 6.8 },
  { rank: 4, title: 'Funny Baby Moments 2026', score: 85, duration: 8.1 },
  { rank: 5, title: 'Incredible Street Dance Battle', score: 82, duration: 4.9 },
];

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

function ProgressBar({ progress }) {
  return (
    <div className="ar-progress-track">
      <motion.div
        className="ar-progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  );
}

function SimulationStep({ step, progress, isActive, isComplete, stepIndex }) {
  const IconComponent = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stepIndex * 0.1 }}
      className={`ar-sim-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
    >
      <div className="ar-sim-step-content">
        <div className={`ar-sim-step-icon-wrap ${isActive ? 'pulse' : ''} ${isComplete ? 'done' : ''}`}>
          {isComplete ? (
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="ar-sim-step-check-icon"
            >
              <Check size={16} strokeWidth={3} />
            </motion.span>
          ) : (
            <IconComponent size={18} strokeWidth={1.5} />
          )}
        </div>
        <div className="ar-sim-step-body">
          <div className="ar-sim-step-label-row">
            <span className="ar-sim-step-label">{step.label}</span>
            {isComplete && <span className="ar-sim-step-check-text">{step.checkText}</span>}
            {isActive && (
              <span className="ar-sim-step-dots">
                <span className="ar-dot-pulse" />
              </span>
            )}
          </div>
          <span className="ar-sim-step-subtitle">
            {isComplete ? step.checkText : isActive ? step.subtitle : ''}
          </span>
          {isActive && (
            <div className="ar-sim-progress-row">
              <ProgressBar progress={progress} />
              <span className="ar-sim-step-pct">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({ item, index }) {
  const IconComponent = index < 3 ? Medal : 'span';
  const medalProps = index < 3 ? { size: 22, strokeWidth: 1.5, color: MEDAL_COLORS[index] } : {};
  const rankLabel = index >= 3 ? `#${item.rank}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
      className="ar-result-card"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="ar-result-rank">
        {index < 3 ? (
          <IconComponent {...medalProps} />
        ) : (
          <span className="ar-result-rank-num">{rankLabel}</span>
        )}
      </div>
      <div className="ar-result-thumb">
        <div className="ar-result-thumb-bg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </div>
        <span className="ar-result-duration">{item.duration}s</span>
      </div>
      <div className="ar-result-info">
        <span className="ar-result-title">{item.title}</span>
        <div className="ar-result-score-row">
          <Star size={12} strokeWidth={1.5} className="ar-result-score-star" />
          <span className="ar-result-score-text">Score {item.score}/100</span>
        </div>
      </div>
      <button onClick={(e) => e.stopPropagation()} className="ar-result-preview-btn">
        <Play size={12} strokeWidth={2.5} />
        Preview
      </button>
    </motion.div>
  );
}

export default function AIRankings({ setToast }) {
  const [topic, setTopic] = useState('');
  const [sources, setSources] = useState(['youtube']);
  const [rankingSize, setRankingSize] = useState(5);
  const [videoLength, setVideoLength] = useState(30);
  const [language, setLanguage] = useState('English');
  const [phase, setPhase] = useState('form');
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleSource = (id) => {
    if (id !== 'youtube') {
      setToast({ type: 'info', text: `${SOURCES.find((s) => s.id === id).label} coming soon` });
      return;
    }
    setSources((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const startSimulation = useCallback(() => {
    if (!topic.trim()) {
      setToast({ type: 'error', text: 'Please enter a ranking topic' });
      return;
    }
    setPhase('simulating');
    setCurrentStep(0);
    setStepProgress(0);
  }, [topic, setToast]);

  const resetForm = useCallback(() => {
    setPhase('form');
    setCurrentStep(0);
    setStepProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleGenerateVideo = () => {
    setToast({
      type: 'info',
      text: 'Coming Soon — AI Ranking video generation will be available in a future update',
    });
  };

  useEffect(() => {
    if (phase !== 'simulating') return;
    let progress = 0;
    const STEP_DURATION_MS = 2000;
    const INTERVAL_MS = 50;
    timerRef.current = setInterval(() => {
      progress += 100 / (STEP_DURATION_MS / INTERVAL_MS);
      if (progress >= 100) {
        progress = 0;
        const nextStep = currentStep + 1;
        if (nextStep >= SIMULATION_STEPS.length) {
          clearInterval(timerRef.current);
          setPhase('results');
          return;
        }
        setCurrentStep(nextStep);
      }
      setStepProgress(Math.min(progress, 100));
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [phase, currentStep]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {phase === 'form' && (
        <div className="db-input-card" style={{ maxWidth: '720px' }}>
          <div className="ar-hero">
            <motion.div
              className="ar-hero-icon-wrap"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            >
              <Trophy size={36} strokeWidth={1.5} className="ar-hero-icon-svg" />
            </motion.div>
            <h1 className="db-input-card-title">AI Rankings</h1>
            <p className="db-input-card-subtitle">
              Create viral Top 5 and Top 10 videos automatically using AI.
            </p>
            <p className="ar-hero-hint">
              Describe the ranking you want. Our AI will research videos, select
              the best moments and prepare a complete ranking ready to generate.
            </p>
          </div>

          <div className="ar-form">
            <div className="ar-field">
              <label className="ar-field-label">Ranking Topic</label>
              <span className="ar-field-hint">What ranking do you want?</span>
              <div className="ar-input-container">
                <Search size={16} strokeWidth={1.5} className="ar-input-icon" />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Top 10 Football Goals, Top 5 Parkour Fails..."
                  className="ar-input"
                />
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-field-label">Source</label>
              <div className="ar-checkbox-grid">
                {SOURCES.map((src) => {
                  const SrcIcon = src.icon;
                  return (
                    <label
                      key={src.id}
                      className={`ar-checkbox-label ${!src.enabled ? 'disabled' : ''} ${sources.includes(src.id) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={sources.includes(src.id)}
                        onChange={() => toggleSource(src.id)}
                        disabled={!src.enabled}
                        className="ar-checkbox-input"
                      />
                      <span className="ar-checkbox-custom">
                        {sources.includes(src.id) && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          >
                            <Check size={10} strokeWidth={4} color="white" />
                          </motion.span>
                        )}
                      </span>
                      <SrcIcon size={16} strokeWidth={1.5} />
                      <span className="ar-checkbox-text">{src.label}</span>
                      {!src.enabled && <span className="ar-coming-soon-tag">Coming Soon</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-field-label">Ranking Size</label>
              <div className="ar-radio-group">
                {RANKING_SIZES.map((size) => (
                  <label
                    key={size.value}
                    className={`ar-radio-label ${rankingSize === size.value ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="ranking-size"
                      value={size.value}
                      checked={rankingSize === size.value}
                      onChange={() => setRankingSize(size.value)}
                      className="ar-radio-input"
                    />
                    <span className="ar-radio-custom">
                      {rankingSize === size.value && (
                        <motion.span
                          layoutId="ranking-dot"
                          className="ar-radio-dot"
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        />
                      )}
                    </span>
                    <span className="ar-radio-text">{size.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="ar-field-row">
              <div className="ar-field">
                <label className="ar-field-label">Video Length</label>
                <div className="ar-radio-group">
                  {VIDEO_LENGTHS.map((len) => (
                    <label
                      key={len}
                      className={`ar-radio-label ${videoLength === len ? 'checked' : ''}`}
                    >
                      <input
                        type="radio"
                        name="video-length"
                        value={len}
                        checked={videoLength === len}
                        onChange={() => setVideoLength(len)}
                        className="ar-radio-input"
                      />
                      <span className="ar-radio-custom">
                        {videoLength === len && (
                          <motion.span
                            layoutId="length-dot"
                            className="ar-radio-dot"
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          />
                        )}
                      </span>
                      <span className="ar-radio-text">{len} sec</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="ar-field">
                <label className="ar-field-label">Language</label>
                <div className="ar-radio-group">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      className={`ar-radio-label ${language === lang ? 'checked' : ''}`}
                    >
                      <input
                        type="radio"
                        name="language"
                        value={lang}
                        checked={language === lang}
                        onChange={() => setLanguage(lang)}
                        className="ar-radio-input"
                      />
                      <span className="ar-radio-custom">
                        {language === lang && (
                          <motion.span
                            layoutId="lang-dot"
                            className="ar-radio-dot"
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          />
                        )}
                      </span>
                      <span className="ar-radio-text">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              onClick={startSimulation}
              className="db-primary-btn ar-generate-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={18} strokeWidth={1.5} />
              Generate AI Ranking
            </motion.button>
          </div>
        </div>
      )}

      {phase === 'simulating' && (
        <div className="db-input-card ar-sim-card" style={{ maxWidth: '560px' }}>
          <motion.div
            className="ar-sim-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="ar-sim-title"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Bot size={28} strokeWidth={1.5} className="ar-sim-title-icon" />
              AI is working on your ranking
            </motion.span>
            <p className="ar-sim-subtitle">
              Researching &ldquo;{topic}&rdquo; — this will just take a moment
            </p>
            <p className="ar-sim-status">{STEP_SUBTITLES[currentStep]}</p>
          </motion.div>
          <div className="ar-sim-steps">
            {SIMULATION_STEPS.map((step, idx) => (
              <SimulationStep
                key={idx}
                step={step}
                stepIndex={idx}
                progress={idx === currentStep ? stepProgress : idx < currentStep ? 100 : 0}
                isActive={idx === currentStep}
                isComplete={idx < currentStep}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="db-input-card ar-results-card" style={{ maxWidth: '720px' }}>
          <motion.div
            className="ar-results-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="ar-results-icon-wrap"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Trophy size={32} strokeWidth={1.5} className="ar-results-icon-svg" />
            </motion.div>
            <h2 className="ar-results-title">Top {rankingSize} Found</h2>
            <p className="ar-results-subtitle">
              Based on AI analysis of &ldquo;{topic}&rdquo;
            </p>
          </motion.div>

          <div className="ar-results-list">
            {MOCK_RESULTS.slice(0, rankingSize).map((item, idx) => (
              <ResultCard key={idx} item={item} index={idx} />
            ))}
          </div>

          <motion.button
            onClick={handleGenerateVideo}
            className="db-primary-btn ar-generate-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clapperboard size={18} strokeWidth={1.5} />
            Generate Ranking Video
          </motion.button>

          <button onClick={resetForm} className="ar-back-btn">
            <ArrowLeft size={14} strokeWidth={2} />
            Create another ranking
          </button>
        </div>
      )}
    </motion.div>
  );
}
