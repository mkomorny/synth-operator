'use client';
import { useState } from 'react';
import { getSchema } from '@/lib/engine/synthSchemas';

export default function ManualForm({ schemaKey, onSubmit }) {
  const schema = getSchema(schemaKey);
  const [values, setValues] = useState(() => buildDefaults(schema));
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(schema.sections.map(s => [s.id, true]))
  );

  function buildDefaults(s) {
    const defaults = {};
    s.sections.forEach(section => {
      section.fields.forEach(f => { defaults[f.id] = f.default ?? ''; });
    });
    return defaults;
  }

  function handleChange(fieldId, value) {
    setValues(v => ({ ...v, [fieldId]: value }));
  }

  function toggleSection(id) {
    setOpenSections(s => ({ ...s, [id]: !s[id] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  function renderField(field) {
    const val = values[field.id];
    switch (field.type) {
      case 'slider':
        return (
          <div className="field-slider-wrap" key={field.id}>
            <label className="field-label">
              {field.label}
              <span className="field-value-badge">{val}{field.unit ? ` ${field.unit}` : ''}</span>
            </label>
            <div className="slider-row">
              <span className="slider-min">{field.min ?? 0}</span>
              <input
                id={`field-${field.id}`}
                type="range"
                className="field-slider"
                min={field.min ?? 0}
                max={field.max ?? 100}
                step={field.max > 1000 ? 10 : field.max > 100 ? 1 : 0.5}
                value={val}
                onChange={e => handleChange(field.id, field.max > 100 ? Number(e.target.value) : parseFloat(e.target.value))}
              />
              <span className="slider-max">{field.max ?? 100}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="field-wrap" key={field.id}>
            <label className="field-label" htmlFor={`field-${field.id}`}>{field.label}</label>
            <select
              id={`field-${field.id}`}
              className="field-select"
              value={val}
              onChange={e => handleChange(field.id, e.target.value)}
            >
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'toggle':
        return (
          <div className="field-toggle-wrap" key={field.id}>
            <label className="field-label">{field.label}</label>
            <button
              id={`field-${field.id}`}
              type="button"
              className={`toggle-btn ${val ? 'toggle-on' : 'toggle-off'}`}
              onClick={() => handleChange(field.id, !val)}
              aria-pressed={!!val}
            >
              <span className="toggle-knob" />
              <span className="toggle-label">{val ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        );

      case 'number':
        return (
          <div className="field-wrap" key={field.id}>
            <label className="field-label" htmlFor={`field-${field.id}`}>{field.label}</label>
            <div className="number-input-row">
              <button type="button" className="number-btn" onClick={() => handleChange(field.id, Math.max(field.min ?? -Infinity, Number(val) - 1))}>−</button>
              <input
                id={`field-${field.id}`}
                type="number"
                className="field-number"
                min={field.min}
                max={field.max}
                value={val}
                onChange={e => handleChange(field.id, Number(e.target.value))}
              />
              <button type="button" className="number-btn" onClick={() => handleChange(field.id, Math.min(field.max ?? Infinity, Number(val) + 1))}>+</button>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="field-wrap" key={field.id}>
            <label className="field-label" htmlFor={`field-${field.id}`}>{field.label}</label>
            <input
              id={`field-${field.id}`}
              type="text"
              className="field-text"
              value={val}
              placeholder={field.placeholder || ''}
              onChange={e => handleChange(field.id, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <form className="manual-form" onSubmit={handleSubmit}>
      <div className="form-synth-header">
        <h3 className="form-synth-name">{schema.name}</h3>
        <span className="form-synth-vendor">{schema.vendor}</span>
      </div>

      {schema.sections.map(section => (
        <div className="form-section" key={section.id}>
          <button
            type="button"
            className="form-section-header"
            onClick={() => toggleSection(section.id)}
          >
            <span className="section-icon">{section.icon || '🎛️'}</span>
            <span className="section-label">{section.label}</span>
            <span className={`section-chevron ${openSections[section.id] ? 'open' : ''}`}>▼</span>
          </button>
          {openSections[section.id] && (
            <div className="form-section-body">
              <div className="fields-grid">
                {section.fields.map(f => renderField(f))}
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-large">
          🎛️ Translate to Operator →
        </button>
      </div>
    </form>
  );
}
