'use client';
import { useState, useRef, useCallback } from 'react';

export default function ScreenshotUploader({ synthName, onSubmit, onError }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      onError?.('Please upload an image file (PNG, JPG, WebP).');
      return;
    }
    setFile(f);
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, [onError]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  async function handleAnalyze() {
    if (!file) return;
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      onError?.('No API key found. Please add your Gemini API key in Settings.');
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Analyzing screenshot with AI...' });

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise((res, rej) => {
        reader.onload = e => res(e.target.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      let data;
      if (typeof window !== 'undefined' && window.electronAPI) {
        data = await window.electronAPI.aiVision({
          imageBase64: base64,
          mimeType: file.type,
          synthName,
          apiKey,
        });
      } else {
        throw new Error('Electron API not available');
      }

      if (data.error) {
        throw new Error(data.error || 'AI analysis failed');
      }

      setStatus({ type: 'success', message: `✓ Extracted ${Object.keys(data.params).length} parameters from screenshot.` });
      onSubmit(data.params);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screenshot-uploader">
      <div className="upload-tip">
        <span className="tip-icon">💡</span>
        <span>
          <strong>Tip:</strong> Press <kbd>Win + Shift + S</kbd> on Windows to open the snipping tool,
          then capture your synth's UI in Ableton. Upload the image below.
        </span>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragging ? 'drop-zone-active' : ''} ${preview ? 'drop-zone-has-preview' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !preview && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload screenshot"
      >
        {!preview ? (
          <div className="drop-zone-inner">
            <div className="drop-icon">📸</div>
            <p className="drop-text">Drop screenshot here</p>
            <p className="drop-sub">or click to browse</p>
            <p className="drop-formats">PNG, JPG, WebP supported</p>
          </div>
        ) : (
          <div className="preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Synth screenshot preview" className="preview-img" />
            <div className="preview-overlay">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={e => { e.stopPropagation(); setPreview(null); setFile(null); setStatus(null); }}
              >
                Change Image
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Status */}
      {status && (
        <div className={`status-banner status-${status.type}`}>
          {status.message}
        </div>
      )}

      {/* Analyze Button */}
      {file && (
        <button
          className={`btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <><span className="btn-spinner" /> Analyzing with AI...</>
          ) : (
            '🤖 Analyze Screenshot →'
          )}
        </button>
      )}

      <p className="upload-privacy-note">
        🔒 Your screenshot is sent directly to Google's Gemini API and is not stored anywhere.
      </p>
    </div>
  );
}
