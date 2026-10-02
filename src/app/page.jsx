'use client';
import { useState, useEffect } from 'react';
import SettingsModal from '@/components/SettingsModal';
import SynthSelector from '@/components/SynthSelector';
import InputMethodSelector from '@/components/InputMethodSelector';
import ManualForm from '@/components/ManualForm';
import ScreenshotUploader from '@/components/ScreenshotUploader';
import PresetUploader from '@/components/PresetUploader';
import OperatorGuide from '@/components/OperatorGuide';
import { translateToOperator } from '@/lib/engine/rules';
import { recommendEffects, recommendMIDIEffects } from '@/lib/engine/effects';

const STEPS = [
  { id: 'select',  label: 'Step 1', name: 'Select Synth'  },
  { id: 'method',  label: 'Step 2', name: 'Input Method'  },
  { id: 'input',   label: 'Step 3', name: 'Enter Params'  },
  { id: 'result',  label: 'Step 4', name: 'Operator Guide' },
];

export default function HomePage() {
  const [step, setStep]           = useState(0); // 0–3
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [inputMethod, setInputMethod] = useState('manual');
  const [patch, setPatch]         = useState(null);
  const [effects, setEffects]     = useState(null);
  const [aiTips, setAiTips]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]         = useState(null);

  // Check API key on mount and when settings close
  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key') || '';
    setHasApiKey(key.length > 10);
  }, [showSettings]);

  // ── Handlers ─────────────────────────────────────────────────────
  function handleSynthSelect(plugin) {
    setSelectedPlugin(plugin);
  }

  function goToStep(n) {
    if (n < step || (n === 1 && selectedPlugin) || (n === 2 && selectedPlugin) || (n === 3 && patch)) {
      setStep(n);
    }
  }

  function handleNextFromSelect() {
    if (!selectedPlugin) { setError('Please select a plugin first.'); return; }
    setError(null);
    setStep(1);
  }

  function handleNextFromMethod() {
    setError(null);
    setStep(2);
  }

  function handleParamsSubmit(params) {
    setError(null);
    const schemaKey = selectedPlugin?.schemaKey || 'generic_subtractive';
    const category  = selectedPlugin?.category  || 'subtractive';
    const name      = selectedPlugin?.name      || 'Unknown Synth';

    try {
      const result = translateToOperator(params, name, category);
      result.confidence = estimateConfidence(params, inputMethod);
      const fx = [
        ...recommendEffects(params),
        ...recommendMIDIEffects(params),
      ];
      setPatch(result);
      setEffects(fx);
      setAiTips(null);
      setStep(3);
    } catch (err) {
      setError('Translation failed: ' + err.message);
    }
  }

  async function handleAITips() {
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    if (!apiKey) { setError('Add a Gemini API key in Settings to use AI Tips.'); return; }

    setAiLoading(true);
    setError(null);
    try {
      // Reconstruct a simple param summary from the patch for the AI
      const params = patchToParams(patch);
      let data;
      if (typeof window !== 'undefined' && window.electronAPI) {
        data = await window.electronAPI.aiTips({
          synthName: selectedPlugin?.name || 'Unknown Synth',
          params,
          apiKey,
        });
      } else {
        throw new Error('Electron API not available');
      }

      if (data.error) throw new Error(data.error);
      setAiTips(data.tips);
    } catch (err) {
      setError('AI Tips error: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function handleReset() {
    setStep(0);
    setSelectedPlugin(null);
    setInputMethod('manual');
    setPatch(null);
    setEffects(null);
    setAiTips(null);
    setError(null);
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* ── Top Nav ── */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="nav-logo">🎛️</div>
          <div>
            <div className="nav-title">Synth → Operator</div>
            <div className="nav-subtitle">Ableton Translation Tool</div>
          </div>
        </div>
        <div className="nav-actions">
          {patch && (
            <button className="btn-secondary btn-sm" onClick={handleReset}>
              ↺ New Translation
            </button>
          )}
          <button
            className="nav-settings-btn"
            onClick={() => setShowSettings(true)}
            id="settings-btn"
          >
            <span className={`api-key-dot ${hasApiKey ? '' : 'missing'}`} />
            ⚙️ Settings
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Wizard Progress */}
        <div className="wizard-progress">
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                className={`wizard-step ${i === step ? 'active' : i < step ? 'completed' : 'locked'}`}
                onClick={() => goToStep(i)}
                role="button"
                tabIndex={i <= step ? 0 : -1}
              >
                <div className="step-bubble">
                  {i < step ? '✓' : i + 1}
                </div>
                <div className="step-info">
                  <div className="step-label">{s.label}</div>
                  <div className="step-name">{s.name}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="wizard-divider" />}
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="status-banner status-error" style={{ marginBottom: 16 }}>
            ⚠️ {error}
            <button
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.85rem' }}
              onClick={() => setError(null)}
            >✕</button>
          </div>
        )}

        {/* ── Step 0: Select Synth ── */}
        {step === 0 && (
          <div className="panel" id="step-select-synth">
            <div className="panel-header">
              <h1 className="panel-title">🔍 Select Your Source Synth</h1>
              <p className="panel-subtitle">
                Scanning your VST folders — select the synth you want to translate into Operator.
              </p>
            </div>
            <div className="panel-body">
              <SynthSelector onSelect={handleSynthSelect} />
              <div className="wizard-nav">
                <div />
                <button className="btn-primary" onClick={handleNextFromSelect} id="btn-next-select">
                  Next: Choose Input Method →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Input Method ── */}
        {step === 1 && (
          <div className="panel" id="step-input-method">
            <div className="panel-header">
              <h2 className="panel-title">
                📥 How Would You Like to Enter Parameters?
              </h2>
              <p className="panel-subtitle">
                Translating: <strong>{selectedPlugin?.name}</strong> by {selectedPlugin?.vendor}
              </p>
            </div>
            <div className="panel-body">
              <InputMethodSelector
                onSelect={setInputMethod}
                selectedMethod={inputMethod}
                hasApiKey={hasApiKey}
              />
              <div className="wizard-nav">
                <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
                <button className="btn-primary" onClick={handleNextFromMethod} id="btn-next-method">
                  Next: Enter Parameters →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Enter Parameters ── */}
        {step === 2 && (
          <div className="panel" id="step-enter-params">
            <div className="panel-header">
              <h2 className="panel-title">
                {inputMethod === 'manual'     ? '⌨️ Enter Parameters Manually' :
                 inputMethod === 'screenshot' ? '📸 Upload a Screenshot' :
                 '📁 Upload a Preset File'}
              </h2>
              <p className="panel-subtitle">
                Source: <strong>{selectedPlugin?.name}</strong> → Ableton Operator
              </p>
            </div>
            <div className="panel-body">
              {inputMethod === 'manual' && (
                <ManualForm
                  schemaKey={selectedPlugin?.schemaKey || 'generic_subtractive'}
                  onSubmit={handleParamsSubmit}
                />
              )}
              {inputMethod === 'screenshot' && (
                <>
                  <ScreenshotUploader
                    synthName={selectedPlugin?.name}
                    onSubmit={handleParamsSubmit}
                    onError={setError}
                  />
                  <div className="wizard-nav" style={{ marginTop: 0 }}>
                    <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  </div>
                </>
              )}
              {inputMethod === 'preset' && (
                <>
                  <PresetUploader
                    onSubmit={handleParamsSubmit}
                    onError={setError}
                  />
                  <div className="wizard-nav" style={{ marginTop: 0 }}>
                    <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  </div>
                </>
              )}
              {inputMethod === 'manual' && (
                <div className="wizard-nav" style={{ marginTop: 0 }}>
                  <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Operator Guide ── */}
        {step === 3 && patch && (
          <div className="panel" id="step-result">
            <div className="panel-body" style={{ paddingTop: 32 }}>
              <OperatorGuide
                patch={patch}
                effects={effects}
                aiTips={aiTips}
                synthName={selectedPlugin?.name || 'Your Synth'}
                onAITips={hasApiKey ? handleAITips : null}
                aiLoading={aiLoading}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Settings Modal ── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function estimateConfidence(params, method) {
  if (method === 'screenshot') return 'medium';
  if (method === 'preset') {
    const count = Object.keys(params).length;
    if (count > 20) return 'high';
    if (count > 8)  return 'medium';
    return 'low';
  }
  // Manual: always high confidence since user entered values directly
  return 'high';
}

function patchToParams(patch) {
  if (!patch) return {};
  const p = {};
  const oscs = patch.oscillators || {};
  ['A','B','C','D'].forEach(k => {
    const o = oscs[k];
    if (o?.on) {
      p[`osc_${k.toLowerCase()}_waveform`] = o.waveform;
      p[`osc_${k.toLowerCase()}_level`]    = o.level;
      p[`osc_${k.toLowerCase()}_feedback`] = o.feedback;
    }
  });
  if (patch.filter?.on) {
    p['filter_type']    = patch.filter.type;
    p['filter_cutoff']  = patch.filter.frequency;
    p['filter_res']     = patch.filter.resonance;
    p['filter_env_amt'] = patch.filter.envAmount;
  }
  return p;
}
