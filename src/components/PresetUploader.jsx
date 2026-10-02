'use client';
import { useState, useRef, useCallback } from 'react';
import { parsePresetFile } from '@/lib/engine/presetParsers';

const SUPPORTED_FORMATS = ['.vital', '.fxp', '.fxb', '.surge', '.json', '.xml'];

export default function PresetUploader({ onSubmit, onError }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
      const msg = `Unsupported format "${ext}". Supported: ${SUPPORTED_FORMATS.join(', ')}`;
      setStatus({ type: 'error', message: msg });
      onError?.(msg);
      return;
    }
    setFile(f);
    setStatus(null);
    setConfidence(null);
  }, [onError]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    setStatus({ type: 'loading', message: 'Reading preset file...' });

    try {
      const result = await parsePresetFile(file);
      const paramCount = Object.keys(result.params).length;

      if (paramCount < 3) {
        throw new Error('Too few parameters extracted. This preset may be encrypted or use a proprietary format. Try manual entry or a screenshot instead.');
      }

      setConfidence(result.confidence);
      setStatus({
        type: 'success',
        message: `✓ Parsed ${paramCount} parameters from ${result.format} (Confidence: ${result.confidence})`,
      });
      onSubmit(result.params);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  const confidenceColors = { high: '#4ade80', medium: '#fbbf24', low: '#f87171' };

  return (
    <div className="preset-uploader">
      <div className="upload-tip">
        <span className="tip-icon">💡</span>
        <div>
          <strong>How to find your preset file:</strong>
          <ul className="tip-list">
            <li><strong>Vital:</strong> Right-click preset name → "Show Preset in Explorer" → upload the <code>.vital</code> file</li>
            <li><strong>Serum/Sylenth1/Most VSTs:</strong> Presets are <code>.fxp</code> files — usually in Documents\[SynthName]\Presets</li>
            <li><strong>Surge XT:</strong> File → Export → <code>.fxp</code> or look in AppData for <code>.surge</code> patches</li>
          </ul>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragging ? 'drop-zone-active' : ''} ${file ? 'drop-zone-has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload preset file"
      >
        {!file ? (
          <div className="drop-zone-inner">
            <div className="drop-icon">📁</div>
            <p className="drop-text">Drop preset file here</p>
            <p className="drop-sub">or click to browse</p>
            <p className="drop-formats">{SUPPORTED_FORMATS.join('  •  ')}</p>
          </div>
        ) : (
          <div className="file-info">
            <span className="file-icon">📄</span>
            <div className="file-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              type="button"
              className="btn-icon-sm"
              onClick={e => { e.stopPropagation(); setFile(null); setStatus(null); setConfidence(null); }}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(',')}
        className="file-input-hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Status / Confidence */}
      {status && (
        <div className={`status-banner status-${status.type}`}>
          {status.message}
          {confidence && status.type === 'success' && (
            <span
              className="confidence-badge"
              style={{ color: confidenceColors[confidence] || '#fff' }}
            >
              {confidence === 'high' ? '🟢 High confidence' :
               confidence === 'medium' ? '🟡 Medium confidence — review results' :
               '🔴 Low confidence — verify manually'}
            </span>
          )}
        </div>
      )}

      {file && (
        <button
          className={`btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
          onClick={handleParse}
          disabled={loading}
        >
          {loading ? (
            <><span className="btn-spinner" /> Parsing preset...</>
          ) : (
            '📂 Parse Preset File →'
          )}
        </button>
      )}
    </div>
  );
}
