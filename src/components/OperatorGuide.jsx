'use client';
import { useState, useRef } from 'react';

const CONFIDENCE_CONFIG = {
  high:   { label: 'High Confidence',   color: '#4ade80', bar: 90, icon: '🟢' },
  medium: { label: 'Medium Confidence', color: '#fbbf24', bar: 60, icon: '🟡' },
  low:    { label: 'Low Confidence',    color: '#f87171', bar: 30, icon: '🔴' },
};

const ALG_DIAGRAMS = {
  1: 'D → C → B → A ►',
  2: 'D → C → B → A ►\n D ────────→ B',
  3: 'D ─┐\n C ─┤→ B → A ►',
  4: 'D → C → A ►\n B ───────→ A',
  5: 'D → C ►\n D → B ►\n     A ►',
  6: 'D → A ►\n D → B ►\n D → C ►',
  7: 'A ► B ► C ► D ►',
  8: 'C → B → A ►\n         D ►',
};

export default function OperatorGuide({ patch, effects, aiTips, synthName, onAITips, aiLoading }) {
  const [copiedStep, setCopiedStep] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const outputRef = useRef(null);

  if (!patch) return null;

  const conf = CONFIDENCE_CONFIG[patch.confidence] || CONFIDENCE_CONFIG.medium;

  function copyStep(text, idx) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStep(idx);
      setTimeout(() => setCopiedStep(null), 1500);
    });
  }

  function copyAll() {
    const text = buildPlaintext(patch, effects);
    navigator.clipboard.writeText(text);
  }

  function buildPlaintext(p, fx) {
    let out = `=== Operator Translation: ${synthName} ===\n\n`;
    out += `Algorithm: ${p.algorithm?.number} — ${p.algorithm?.description}\n\n`;
    p.steps?.forEach((s, i) => {
      out += `[${i + 1}] ${s.section}\n${s.instruction.replace(/\*\*/g, '')}\n\n`;
    });
    if (fx?.length) {
      out += `--- Recommended Effects ---\n`;
      fx.forEach(e => {
        out += `• ${e.effect.name} (${e.effect.category})\n  ${e.reason}\n  Settings: ${e.settings}\n\n`;
      });
    }
    return out;
  }

  const groupedSteps = {};
  (patch.steps || []).forEach((step, i) => {
    if (!groupedSteps[step.section]) groupedSteps[step.section] = [];
    groupedSteps[step.section].push({ ...step, idx: i });
  });

  // Operator visual summary data
  const oscs = patch.oscillators || {};
  const oscKeys = ['A', 'B', 'C', 'D'];

  return (
    <div className="operator-guide" ref={outputRef}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="guide-header">
        <div className="guide-title-row">
          <h2 className="guide-title">🎛️ Operator Translation</h2>
          <div className="guide-actions">
            {onAITips && (
              <button
                className={`btn-secondary btn-sm ${aiLoading ? 'btn-loading' : ''}`}
                onClick={onAITips}
                disabled={aiLoading}
                title="Get AI-powered expert tips for this translation"
              >
                {aiLoading ? <><span className="btn-spinner" /> Loading...</> : '💡 AI Tips'}
              </button>
            )}
            <button className="btn-secondary btn-sm" onClick={copyAll} title="Copy all steps to clipboard">
              📋 Copy All
            </button>
          </div>
        </div>
        <p className="guide-subtitle">
          Translating <strong>{synthName}</strong> → Ableton Operator
        </p>

        {/* Confidence Bar */}
        <div className="confidence-row">
          <span className="confidence-icon">{conf.icon}</span>
          <div className="confidence-bar-wrap">
            <div className="confidence-bar-track">
              <div className="confidence-bar-fill" style={{ width: `${conf.bar}%`, background: conf.color }} />
            </div>
          </div>
          <span className="confidence-label" style={{ color: conf.color }}>{conf.label}</span>
        </div>
      </div>

      {/* ── AI Tips ───────────────────────────────────────────── */}
      {aiTips && (
        <div className="ai-tips-panel">
          <div className="ai-tips-header">
            <span>✨ AI Expert Tips</span>
            <span className="ai-badge">Gemini</span>
          </div>
          <div className="ai-tips-body" dangerouslySetInnerHTML={{ __html: markdownToHTML(aiTips) }} />
        </div>
      )}

      {/* ── Algorithm Visual ──────────────────────────────────── */}
      <div className="guide-section">
        <h3 className="guide-section-title">⚙️ Algorithm</h3>
        <div className="algo-card">
          <div className="algo-number">Algorithm {patch.algorithm?.number}</div>
          <div className="algo-description">{patch.algorithm?.description}</div>
          <pre className="algo-diagram">{ALG_DIAGRAMS[patch.algorithm?.number] || ''}</pre>
        </div>
      </div>

      {/* ── Oscillator Visual Summary ─────────────────────────── */}
      <div className="guide-section">
        <h3 className="guide-section-title">🎹 Oscillator Summary</h3>
        <div className="osc-grid">
          {oscKeys.map(key => {
            const osc = oscs[key] || { on: false };
            return (
              <div key={key} className={`osc-card ${!osc.on ? 'osc-card-off' : `osc-card-${osc.role}`}`}>
                <div className="osc-card-label">
                  <span className="osc-letter">{key}</span>
                  <span className={`osc-role-badge osc-role-${osc.role || 'off'}`}>
                    {osc.on ? (osc.role === 'carrier' ? '▶ Carrier' : '~ Modulator') : 'OFF'}
                  </span>
                </div>
                {osc.on && (
                  <div className="osc-params">
                    <div className="osc-param"><span>Wave</span><strong>{osc.waveform}</strong></div>
                    <div className="osc-param"><span>Level</span><strong>{osc.level}</strong></div>
                    <div className="osc-param"><span>Feedback</span><strong>{osc.feedback}%</strong></div>
                    <div className="osc-param"><span>Coarse</span><strong>{osc.coarse}</strong></div>
                    <div className="osc-param"><span>Fine</span><strong>{osc.fine}¢</strong></div>
                    {osc.envelope && (
                      <div className="osc-env-mini">
                        <span>Env</span>
                        <span>A:{formatMs(osc.envelope.attack)} D:{formatMs(osc.envelope.decay)} S:{osc.envelope.sustain}% R:{formatMs(osc.envelope.release)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter Summary ────────────────────────────────────── */}
      {patch.filter?.on && (
        <div className="guide-section">
          <h3 className="guide-section-title">🎚️ Filter</h3>
          <div className="filter-summary-card">
            <div className="filter-grid">
              <div className="filter-param"><span>Type</span><strong>{patch.filter.type}</strong></div>
              <div className="filter-param"><span>Frequency</span><strong>{patch.filter.frequency} Hz</strong></div>
              <div className="filter-param"><span>Resonance</span><strong>{patch.filter.resonance}%</strong></div>
              <div className="filter-param"><span>ENV Amount</span><strong>{patch.filter.envAmount}%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step-by-Step Instructions ─────────────────────────── */}
      <div className="guide-section">
        <h3 className="guide-section-title">📋 Step-by-Step Instructions</h3>
        <div className="steps-list">
          {Object.entries(groupedSteps).map(([section, steps]) => (
            <div key={section} className="step-group">
              <div className="step-group-header">{section}</div>
              {steps.map((step) => (
                <div
                  key={step.idx}
                  className={`step-item ${step.isWarning ? 'step-warning' : ''} ${expandedStep === step.idx ? 'step-expanded' : ''}`}
                  onClick={() => setExpandedStep(expandedStep === step.idx ? null : step.idx)}
                >
                  <div className="step-top">
                    <span className="step-num">{step.idx + 1}</span>
                    <div className="step-content">
                      <div
                        className="step-instruction"
                        dangerouslySetInnerHTML={{ __html: formatInstruction(step.instruction) }}
                      />
                      {step.value && (
                        <span className="step-value-chip">{step.value}</span>
                      )}
                    </div>
                    <button
                      className={`step-copy ${copiedStep === step.idx ? 'step-copy-done' : ''}`}
                      onClick={e => { e.stopPropagation(); copyStep(`${step.section}: ${step.instruction}`, step.idx); }}
                      title="Copy this step"
                      aria-label="Copy step"
                    >
                      {copiedStep === step.idx ? '✓' : '📋'}
                    </button>
                  </div>

                  {step.isADSR && step.adsr && (
                    <ADSRVisual adsr={step.adsr} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommended Effects ───────────────────────────────── */}
      {effects && effects.length > 0 && (
        <div className="guide-section">
          <h3 className="guide-section-title">✨ Recommended Ableton Effects</h3>
          <p className="effects-intro">
            Add these devices after Operator in your Ableton instrument chain to better match the source sound:
          </p>
          <div className="effects-list">
            {effects.map((rec, i) => (
              <div key={i} className={`effect-card effect-priority-${rec.priority}`}>
                <div className="effect-top">
                  <span className="effect-icon">{rec.effect.icon}</span>
                  <div className="effect-info">
                    <span className="effect-name">{rec.effect.name}</span>
                    <span className={`effect-priority-badge priority-${rec.priority}`}>
                      {rec.priority === 'high' ? '⚡ Important' : rec.priority === 'medium' ? '💡 Suggested' : '✨ Optional'}
                    </span>
                  </div>
                  <span className="effect-category">{rec.effect.category}</span>
                </div>
                <div className="effect-path">{rec.effect.path}</div>
                <p className="effect-reason">{rec.reason}</p>
                <div className="effect-settings">
                  <span className="effect-settings-label">Suggested settings:</span>
                  <span className="effect-settings-value">{rec.settings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMs(ms) {
  if (ms === undefined || ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

/** Bold **text**, preserve newlines */
function formatInstruction(text) {
  return (text || '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

/** Very basic markdown → HTML for AI tips */
function markdownToHTML(md) {
  return md
    .replace(/##\s(.+)/g, '<h4>$1</h4>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

/** Mini ADSR envelope visualizer */
function ADSRVisual({ adsr }) {
  const { attack = 5, decay = 500, sustain = 70, release = 300 } = adsr;
  const total = Math.max(attack + decay + 200 + release, 100);
  const scale = (v) => (v / total) * 100;

  const aW = scale(attack);
  const dW = scale(decay);
  const sW = 20; // fixed sustain section width
  const rW = scale(release);
  const sH = sustain;

  const points = [
    `0,100`,
    `${aW},0`,
    `${aW + dW},${100 - sH}`,
    `${aW + dW + sW},${100 - sH}`,
    `${aW + dW + sW + rW},100`,
  ].join(' ');

  return (
    <div className="adsr-visual">
      <svg viewBox={`0 0 ${aW + dW + sW + rW + 5} 100`} className="adsr-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="adsrGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} ${aW + dW + sW + rW + 5},100`}
          fill="url(#adsrGrad)"
        />
        <polyline points={points} stroke="#ff6b35" strokeWidth="2" fill="none" />
      </svg>
      <div className="adsr-labels">
        <span>A</span><span>D</span><span>S</span><span>R</span>
      </div>
    </div>
  );
}
