'use client';

const METHODS = [
  {
    id: 'manual',
    icon: '⌨️',
    title: 'Manual Entry',
    subtitle: 'Type in the values',
    description: 'A form that mirrors your synth\'s layout. Look at your synth in Ableton and enter each value. Works 100% offline — no AI needed.',
    badge: 'Always works',
    badgeColor: 'green',
  },
  {
    id: 'screenshot',
    icon: '📸',
    title: 'Screenshot',
    subtitle: 'Upload an image',
    description: 'Take a screenshot of your synth in Ableton (Win+Shift+S), upload it here, and AI reads all the parameters automatically.',
    badge: 'Requires AI key',
    badgeColor: 'orange',
  },
  {
    id: 'preset',
    icon: '📁',
    title: 'Preset File',
    subtitle: 'Upload .vital, .fxp, etc.',
    description: 'Load a preset file from your synth directly. Supported: .vital, .fxp, .fxb, .surge, .json. Reads parameters automatically.',
    badge: 'Fastest',
    badgeColor: 'blue',
  },
];

export default function InputMethodSelector({ onSelect, selectedMethod, hasApiKey }) {
  return (
    <div className="method-selector">
      <p className="method-intro">
        How would you like to enter your synth's parameters? You can change this any time.
      </p>
      <div className="method-grid">
        {METHODS.map(method => {
          const needsKey = method.id === 'screenshot';
          const disabled = needsKey && !hasApiKey;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              className={`method-card ${isSelected ? 'method-card-selected' : ''} ${disabled ? 'method-card-disabled' : ''}`}
              onClick={() => !disabled && onSelect(method.id)}
              disabled={disabled}
              title={disabled ? 'Add a Gemini API key in Settings to use this feature' : ''}
            >
              <div className="method-icon">{method.icon}</div>
              <div className="method-content">
                <div className="method-header">
                  <span className="method-title">{method.title}</span>
                  <span className={`method-badge method-badge-${method.badgeColor}`}>
                    {method.badge}
                  </span>
                </div>
                <div className="method-subtitle">{method.subtitle}</div>
                <p className="method-description">{method.description}</p>
                {disabled && (
                  <p className="method-disabled-note">⚙️ Add an API key in Settings to unlock</p>
                )}
              </div>
              {isSelected && <div className="method-selected-check">✓</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
