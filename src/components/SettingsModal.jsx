'use client';
import { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setApiKey(stored);
      setSaved(false);
    }
  }, [isOpen]);

  function handleSave() {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  function handleClear() {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSaved(false);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">⚙️</span>
            <h2 className="modal-title">Settings</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="settings-section-title">AI Features (Optional)</h3>
            <p className="settings-description">
              Enter your <strong>Google Gemini API key</strong> to unlock:
            </p>
            <ul className="settings-features">
              <li>📸 <strong>Screenshot OCR</strong> — automatically read synth parameters from a screenshot</li>
              <li>💡 <strong>AI Tips</strong> — expert advice for unusual or complex parameter translations</li>
            </ul>
            <p className="settings-note">
              Your key is stored <em>only on this computer</em> in your browser's local storage and is never sent anywhere except directly to Google's API.
            </p>

            <label className="settings-label" htmlFor="api-key-input">Gemini API Key</label>
            <div className="api-key-row">
              <input
                id="api-key-input"
                type={visible ? 'text' : 'password'}
                className="settings-input"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="btn-icon"
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? 'Hide key' : 'Show key'}
                title={visible ? 'Hide' : 'Show'}
              >
                {visible ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="settings-link-row">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-link"
              >
                🔑 Get a free Gemini API key →
              </a>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">App Info</h3>
            <p className="settings-description">
              <strong>Synth → Operator Translator</strong> v1.0<br />
              Built with Ableton Operator's FM synthesis capabilities in mind.<br />
              All rule-based translations work fully offline.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClear}>Clear Key</button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn-primary ${saved ? 'btn-saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
