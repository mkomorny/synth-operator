'use client';
import { useState, useEffect, useCallback } from 'react';

const CATEGORY_LABELS = {
  wavetable:      '🌊 Wavetable',
  subtractive:    '🎛️ Subtractive',
  fm:             '📡 FM',
  'semi-modular': '🔌 Semi-Modular',
  modular:        '🧩 Modular',
  rompler:        '🎹 Rompler',
  sampler:        '🎙️ Sampler',
  unknown:        '❓ Unknown',
};

export default function SynthSelector({ onSelect }) {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.scanVSTs();
        if (data.error) throw new Error(data.error);
        setPlugins(data.plugins || []);
      } else {
        throw new Error('Electron API not available');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlugins(); }, [fetchPlugins]);

  // Derive categories present in results
  const categories = ['all', ...Array.from(new Set(plugins.map(p => p.category)))];

  const filtered = plugins.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  function handleSelect(plugin) {
    setSelected(plugin.filename);
    onSelect(plugin);
  }

  return (
    <div className="synth-selector">
      {/* Search + Filter Bar */}
      <div className="selector-controls">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search plugins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <button className="btn-icon-sm" onClick={fetchPlugins} title="Rescan VST folders">
          🔄
        </button>
      </div>

      {/* Category Pills */}
      <div className="category-pills">
        {categories.map(cat => (
          <button
            key={cat}
            className={`pill ${activeCategory === cat ? 'pill-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? '✨ All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Plugin Grid */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Scanning VST folders...</p>
          <span className="loading-sub">C:\Program Files\Common Files\VST2 & VST3</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Could not scan VST folders</strong>
            <p>{error}</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={fetchPlugins}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔎</span>
          <p>{search ? `No plugins matching "${search}"` : 'No plugins found in VST folders.'}</p>
          {!search && <button className="btn-secondary btn-sm" onClick={fetchPlugins}>Rescan</button>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="plugin-grid">
          {filtered.map((plugin, i) => (
            <button
              key={`${plugin.filename}-${i}`}
              className={`plugin-card ${selected === plugin.filename ? 'plugin-card-selected' : ''}`}
              onClick={() => handleSelect(plugin)}
            >
              <div className="plugin-card-top">
                <span className="plugin-category-badge">
                  {CATEGORY_LABELS[plugin.category] || plugin.category}
                </span>
                <span className="plugin-type-badge">{plugin.vstType}</span>
              </div>
              <div className="plugin-name">{plugin.name}</div>
              <div className="plugin-vendor">{plugin.vendor}</div>
              {selected === plugin.filename && (
                <div className="plugin-check">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="results-count">
          {filtered.length} plugin{filtered.length !== 1 ? 's' : ''} found
          {plugins.length !== filtered.length ? ` (${plugins.length} total)` : ''}
        </p>
      )}
    </div>
  );
}
