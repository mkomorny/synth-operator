/**
 * synthSchemas.js
 * Parameter schemas for all supported source synths.
 * Each schema is used to:
 *  1. Render the manual-entry form (ManualForm.jsx)
 *  2. Identify VSTs by filename in the VST scanner
 *  3. Provide normalized param mappings for the translation engine
 */

// ─── Utility ────────────────────────────────────────────────────────────────

/** Waveform options common to most subtractive synths */
const COMMON_WAVEFORMS = ['Sine', 'Triangle', 'Sawtooth', 'Square', 'Pulse', 'Noise', 'S&H'];
const FILTER_TYPES = ['LP 12', 'LP 24', 'HP 12', 'HP 24', 'BP 12', 'BP 24', 'Notch', 'Comb', 'Formant'];
const LFO_WAVES = ['Sine', 'Triangle', 'Sawtooth', 'Square', 'S&H', 'Noise'];

/** Standard ADSR section, reusable across schemas */
const adsrSection = (id, label) => ({
  id,
  label,
  fields: [
    { id: `${id}_attack`, label: 'Attack', type: 'slider', min: 0, max: 4000, default: 5, unit: 'ms' },
    { id: `${id}_decay`, label: 'Decay', type: 'slider', min: 0, max: 4000, default: 500, unit: 'ms' },
    { id: `${id}_sustain`, label: 'Sustain', type: 'slider', min: 0, max: 100, default: 70, unit: '%' },
    { id: `${id}_release`, label: 'Release', type: 'slider', min: 0, max: 8000, default: 300, unit: 'ms' },
  ],
});

// ─── Synth Schemas ───────────────────────────────────────────────────────────

const schemas = {

  // ─── SERUM (Xfer Records) ─────────────────────────────────────────────────
  serum: {
    name: 'Serum',
    vendor: 'Xfer Records',
    category: 'wavetable',
    filenamePatterns: ['serum', 'xfer serum'],
    sections: [
      {
        id: 'osc_a', label: 'Oscillator A', icon: '🔴',
        fields: [
          { id: 'osc_a_waveform', label: 'Waveform', type: 'select', options: ['Saw', 'Square', 'Sine', 'Triangle', 'Noise', 'Custom Wavetable'], default: 'Saw' },
          { id: 'osc_a_octave', label: 'Octave', type: 'number', min: -4, max: 4, default: 0 },
          { id: 'osc_a_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc_a_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc_a_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc_a_unison', label: 'Unison Voices', type: 'number', min: 1, max: 16, default: 1 },
          { id: 'osc_a_detune', label: 'Unison Detune', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc_a_wtpos', label: 'Wavetable Position', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'osc_b', label: 'Oscillator B', icon: '🔵',
        fields: [
          { id: 'osc_b_waveform', label: 'Waveform', type: 'select', options: ['Off', 'Saw', 'Square', 'Sine', 'Triangle', 'Noise', 'Custom Wavetable'], default: 'Off' },
          { id: 'osc_b_octave', label: 'Octave', type: 'number', min: -4, max: 4, default: 0 },
          { id: 'osc_b_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc_b_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc_b_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc_b_unison', label: 'Unison Voices', type: 'number', min: 1, max: 16, default: 1 },
          { id: 'osc_b_detune', label: 'Unison Detune', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_on', label: 'Filter On', type: 'toggle', default: true },
          { id: 'filter_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 12' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'filter_drive', label: 'Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('env1', 'Amp Envelope (ENV 1)'),
      adsrSection('env2', 'Filter Envelope (ENV 2)'),
      {
        id: 'env2_mod', label: 'Filter Envelope Amount', icon: '🎛️',
        fields: [
          { id: 'env2_amount', label: 'ENV → Filter Cutoff', type: 'slider', min: -100, max: 100, default: 40, unit: '%' },
        ],
      },
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_waveform', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_destination', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'OSC A Pitch', 'OSC B Pitch', 'Level', 'Wavetable Position'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Effects', icon: '✨',
        fields: [
          { id: 'fx_chorus', label: 'Chorus On', type: 'toggle', default: false },
          { id: 'fx_chorus_rate', label: 'Chorus Rate', type: 'slider', min: 0, max: 10, default: 0.5, unit: 'Hz' },
          { id: 'fx_chorus_amount', label: 'Chorus Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_size', label: 'Reverb Size', type: 'slider', min: 0, max: 100, default: 50, unit: '%' },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_delay', label: 'Delay On', type: 'toggle', default: false },
          { id: 'fx_delay_time', label: 'Delay Time', type: 'slider', min: 0, max: 1000, default: 250, unit: 'ms' },
          { id: 'fx_delay_mix', label: 'Delay Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_drive', label: 'Distortion Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── MASSIVE (Native Instruments) ────────────────────────────────────────
  massive: {
    name: 'Massive',
    vendor: 'Native Instruments',
    category: 'wavetable',
    filenamePatterns: ['massive.dll', 'massive.vst3', 'ni massive'],
    sections: [
      {
        id: 'osc1', label: 'OSC 1', icon: '🔴',
        fields: [
          { id: 'osc1_waveform', label: 'Wavetable Name', type: 'text', placeholder: 'e.g., Brute Brass, PWM Rough', default: '' },
          { id: 'osc1_wavetable_pos', label: 'Wavetable Position', type: 'slider', min: 0, max: 100, default: 50, unit: '%' },
          { id: 'osc1_pitch', label: 'Pitch Offset (semitones)', type: 'number', min: -48, max: 48, default: 0 },
          { id: 'osc1_level', label: 'Amplitude', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_unison', label: 'Unison Voices', type: 'number', min: 1, max: 8, default: 1 },
          { id: 'osc1_detune', label: 'Unison Width', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'osc2', label: 'OSC 2', icon: '🟢',
        fields: [
          { id: 'osc2_waveform', label: 'Wavetable Name', type: 'text', placeholder: 'e.g., Square-Saw Szer', default: '' },
          { id: 'osc2_wavetable_pos', label: 'Wavetable Position', type: 'slider', min: 0, max: 100, default: 50, unit: '%' },
          { id: 'osc2_pitch', label: 'Pitch Offset (semitones)', type: 'number', min: -48, max: 48, default: 0 },
          { id: 'osc2_level', label: 'Amplitude', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'osc3', label: 'OSC 3', icon: '🔵',
        fields: [
          { id: 'osc3_waveform', label: 'Wavetable Name', type: 'text', default: '' },
          { id: 'osc3_pitch', label: 'Pitch Offset (semitones)', type: 'number', min: -48, max: 48, default: 0 },
          { id: 'osc3_level', label: 'Amplitude', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'filter1', label: 'Filter 1', icon: '🎚️',
        fields: [
          { id: 'filter1_type', label: 'Type', type: 'select', options: ['Lowpass 4', 'Lowpass 2', 'Bandpass', 'Highpass 2', 'Highpass 4', 'Comb+', 'Comb-', 'Scream', 'Bite', 'Daft'], default: 'Lowpass 4' },
          { id: 'filter1_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter1_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('env4', 'Amp Envelope (ENV 4)'),
      adsrSection('env1', 'Mod Envelope 1 (ENV 1)'),
      {
        id: 'env1_mod', label: 'ENV 1 Modulation', icon: '🎛️',
        fields: [
          { id: 'env1_dest', label: 'ENV 1 Destination', type: 'select', options: ['None', 'Filter 1 Cutoff', 'OSC 1 Pitch', 'OSC 2 Pitch', 'OSC 3 Pitch', 'Level'], default: 'Filter 1 Cutoff' },
          { id: 'env1_amount', label: 'ENV 1 Amount', type: 'slider', min: -100, max: 100, default: 50, unit: '%' },
        ],
      },
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_waveform', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter 1 Cutoff', 'OSC 1 Pitch', 'OSC 2 Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Insert Effects', icon: '✨',
        fields: [
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_type', label: 'Distortion Type', type: 'select', options: ['Off', 'Soft', 'Hard', 'Sine Shaper', 'Rectifier'], default: 'Off' },
          { id: 'fx_dist_drive', label: 'Distortion Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_chorus', label: 'Chorus On', type: 'toggle', default: false },
          { id: 'fx_chorus_rate', label: 'Chorus Rate', type: 'slider', min: 0, max: 10, default: 0.5, unit: 'Hz' },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── SYLENTH1 (LennarDigital) ─────────────────────────────────────────────
  sylenth1: {
    name: 'Sylenth1',
    vendor: 'LennarDigital',
    category: 'subtractive',
    filenamePatterns: ['sylenth1', 'sylenth'],
    sections: [
      {
        id: 'osc_a', label: 'OSC A (Parts 1+2)', icon: '🎵',
        fields: [
          { id: 'osc_a_wave', label: 'Waveform', type: 'select', options: ['Saw', 'Square', 'Sine', 'Triangle', 'Moog Saw', 'Moog Square', 'PWM Saw', 'PWM Square'], default: 'Saw' },
          { id: 'osc_a_octave', label: 'Octave', type: 'number', min: -4, max: 4, default: 0 },
          { id: 'osc_a_semi', label: 'Semitone', type: 'number', min: -12, max: 12, default: 0 },
          { id: 'osc_a_detune', label: 'Detune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc_a_voices', label: 'Voices', type: 'number', min: 1, max: 4, default: 1 },
          { id: 'osc_a_stereo', label: 'Stereo Width', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc_a_volume', label: 'Volume', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
        ],
      },
      {
        id: 'osc_b', label: 'OSC B (Parts 3+4)', icon: '🎵',
        fields: [
          { id: 'osc_b_wave', label: 'Waveform', type: 'select', options: ['Off', 'Saw', 'Square', 'Sine', 'Triangle', 'Moog Saw', 'Moog Square'], default: 'Off' },
          { id: 'osc_b_octave', label: 'Octave', type: 'number', min: -4, max: 4, default: 0 },
          { id: 'osc_b_semi', label: 'Semitone', type: 'number', min: -12, max: 12, default: 0 },
          { id: 'osc_b_detune', label: 'Detune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc_b_volume', label: 'Volume', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'filter1', label: 'Filter A', icon: '🎚️',
        fields: [
          { id: 'flt1_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 24' },
          { id: 'flt1_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'flt1_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'flt1_env_amount', label: 'ENV Amount', type: 'slider', min: -100, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('amp_env', 'Amp Envelope'),
      adsrSection('flt_env', 'Filter Envelope'),
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Volume', 'Filter Cutoff', 'OSC A Pitch', 'OSC B Pitch'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Effects', icon: '✨',
        fields: [
          { id: 'fx_phaser', label: 'Phaser On', type: 'toggle', default: false },
          { id: 'fx_chorus', label: 'Chorus/Flanger On', type: 'toggle', default: false },
          { id: 'fx_chorus_rate', label: 'Chorus Rate', type: 'slider', min: 0, max: 10, default: 0.5, unit: 'Hz' },
          { id: 'fx_chorus_depth', label: 'Chorus Depth', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_drive', label: 'Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_delay', label: 'Delay On', type: 'toggle', default: false },
          { id: 'fx_delay_mix', label: 'Delay Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── VITAL (Matt Tytel) ───────────────────────────────────────────────────
  vital: {
    name: 'Vital',
    vendor: 'Matt Tytel',
    category: 'wavetable',
    filenamePatterns: ['vital'],
    sections: [
      {
        id: 'osc1', label: 'OSC 1', icon: '🔴',
        fields: [
          { id: 'osc1_waveform', label: 'Waveform', type: 'select', options: ['Saw', 'Square', 'Sine', 'Triangle', 'Noise', 'Custom Wavetable'], default: 'Saw' },
          { id: 'osc1_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc1_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc1_unison', label: 'Unison Voices', type: 'number', min: 1, max: 16, default: 1 },
          { id: 'osc1_detune', label: 'Unison Detune', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc1_spectral', label: 'Spectral Morph', type: 'select', options: ['None', 'Vocode', 'FormScale', 'HalfSin', 'EvenOdd', 'ClearHarmonics', 'Squeeze'], default: 'None' },
        ],
      },
      {
        id: 'osc2', label: 'OSC 2', icon: '🟢',
        fields: [
          { id: 'osc2_waveform', label: 'Waveform', type: 'select', options: ['Off', 'Saw', 'Square', 'Sine', 'Triangle', 'Noise', 'Custom Wavetable'], default: 'Off' },
          { id: 'osc2_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc2_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc2_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
          { id: 'osc2_unison', label: 'Unison Voices', type: 'number', min: 1, max: 16, default: 1 },
          { id: 'osc2_detune', label: 'Unison Detune', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'filter', label: 'Filter 1', icon: '🎚️',
        fields: [
          { id: 'filter_on', label: 'Filter On', type: 'toggle', default: true },
          { id: 'filter_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 12' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'filter_blend', label: 'Filter Blend', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('env1', 'Amp Envelope (ENV 1)'),
      adsrSection('env2', 'Filter Envelope (ENV 2)'),
      {
        id: 'env2_mod', label: 'Filter ENV Amount', icon: '🎛️',
        fields: [
          { id: 'env2_amount', label: 'ENV → Filter', type: 'slider', min: -100, max: 100, default: 40, unit: '%' },
        ],
      },
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_waveform', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_destination', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'OSC 1 Pitch', 'OSC 2 Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Effects', icon: '✨',
        fields: [
          { id: 'fx_chorus', label: 'Chorus On', type: 'toggle', default: false },
          { id: 'fx_chorus_voices', label: 'Chorus Voices', type: 'number', min: 1, max: 8, default: 2 },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_delay', label: 'Delay On', type: 'toggle', default: false },
          { id: 'fx_delay_mix', label: 'Delay Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_drive', label: 'Distortion Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── SURGE XT ─────────────────────────────────────────────────────────────
  surge: {
    name: 'Surge XT',
    vendor: 'Surge Synth Team',
    category: 'subtractive',
    filenamePatterns: ['surge xt', 'surgext', 'surge_xt'],
    sections: [
      {
        id: 'osc1', label: 'OSC 1', icon: '🔴',
        fields: [
          { id: 'osc1_type', label: 'Oscillator Type', type: 'select', options: ['Classic', 'Modern', 'Wavetable', 'Window', 'Sine', 'FM2', 'FM3', 'String', 'Alias', 'S&H Noise'], default: 'Classic' },
          { id: 'osc1_waveform', label: 'Shape', type: 'select', options: COMMON_WAVEFORMS, default: 'Sawtooth' },
          { id: 'osc1_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_octave', label: 'Octave', type: 'number', min: -3, max: 3, default: 0 },
          { id: 'osc1_semi', label: 'Semitone', type: 'number', min: -12, max: 12, default: 0 },
        ],
      },
      {
        id: 'osc2', label: 'OSC 2', icon: '🟢',
        fields: [
          { id: 'osc2_type', label: 'Oscillator Type', type: 'select', options: ['Off', 'Classic', 'Wavetable', 'Sine', 'FM2'], default: 'Off' },
          { id: 'osc2_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc2_semi', label: 'Semitone', type: 'number', min: -12, max: 12, default: 0 },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 24' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'filter_env_amount', label: 'ENV Amount', type: 'slider', min: -100, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('amp_env', 'Amp Envelope'),
      adsrSection('flt_env', 'Filter Envelope'),
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Effects', icon: '✨',
        fields: [
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_drive', label: 'Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_chorus', label: 'Chorus On', type: 'toggle', default: false },
          { id: 'fx_chorus_rate', label: 'Chorus Rate', type: 'slider', min: 0, max: 10, default: 1, unit: 'Hz' },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_delay', label: 'Delay On', type: 'toggle', default: false },
          { id: 'fx_delay_mix', label: 'Delay Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── PHASE PLANT (Kilohearts) ─────────────────────────────────────────────
  phase_plant: {
    name: 'Phase Plant',
    vendor: 'Kilohearts',
    category: 'semi-modular',
    filenamePatterns: ['phase plant', 'phaseplant'],
    sections: [
      {
        id: 'gen1', label: 'Generator 1', icon: '🔴',
        fields: [
          { id: 'gen1_type', label: 'Type', type: 'select', options: ['Analog', 'Wavetable', 'Granular', 'Sampler', 'Distortion', 'Group'], default: 'Analog' },
          { id: 'gen1_waveform', label: 'Waveform', type: 'select', options: COMMON_WAVEFORMS, default: 'Sawtooth' },
          { id: 'gen1_level', label: 'Gain', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'gen1_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'gen1_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
        ],
      },
      {
        id: 'gen2', label: 'Generator 2', icon: '🟢',
        fields: [
          { id: 'gen2_type', label: 'Type', type: 'select', options: ['Off', 'Analog', 'Wavetable', 'Granular', 'Sampler'], default: 'Off' },
          { id: 'gen2_waveform', label: 'Waveform', type: 'select', options: COMMON_WAVEFORMS, default: 'Sawtooth' },
          { id: 'gen2_level', label: 'Gain', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'gen2_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_on', label: 'Filter On', type: 'toggle', default: true },
          { id: 'filter_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 24' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('env1', 'ENV 1 (usually Amp)'),
      adsrSection('env2', 'ENV 2 (usually Filter)'),
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── MASSIVE X (Native Instruments) ──────────────────────────────────────
  massive_x: {
    name: 'Massive X',
    vendor: 'Native Instruments',
    category: 'wavetable',
    filenamePatterns: ['massive x', 'massive_x', 'massivex'],
    sections: [
      {
        id: 'osc1', label: 'OSC I', icon: '🔴',
        fields: [
          { id: 'osc1_waveform', label: 'Wavetable Name', type: 'text', default: '' },
          { id: 'osc1_pitch', label: 'Pitch Offset', type: 'number', min: -48, max: 48, default: 0 },
          { id: 'osc1_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_unison', label: 'Unison (Count)', type: 'number', min: 1, max: 9, default: 1 },
          { id: 'osc1_detune', label: 'Unison Detune', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'osc2', label: 'OSC II', icon: '🟢',
        fields: [
          { id: 'osc2_waveform', label: 'Wavetable Name', type: 'text', default: '' },
          { id: 'osc2_pitch', label: 'Pitch Offset', type: 'number', min: -48, max: 48, default: 0 },
          { id: 'osc2_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_type', label: 'Type', type: 'select', options: ['Lowpass', 'Highpass', 'Bandpass', 'Notch', 'All Pass', 'Comb'], default: 'Lowpass' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('amp_env', 'Amp Envelope'),
      adsrSection('mod_env', 'Mod Envelope'),
      {
        id: 'lfo1', label: 'LFO 1', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── U-HE DIVA ────────────────────────────────────────────────────────────
  diva: {
    name: 'Diva',
    vendor: 'u-he',
    category: 'subtractive',
    filenamePatterns: ['diva'],
    sections: [
      {
        id: 'osc1', label: 'Oscillator 1', icon: '🔴',
        fields: [
          { id: 'osc1_type', label: 'OSC Module', type: 'select', options: ['DP Osc', 'Dual VCO', 'Juno 6 DCO', 'Minimoog VCO', 'Triple VCO'], default: 'Dual VCO' },
          { id: 'osc1_waveform', label: 'Waveform', type: 'select', options: COMMON_WAVEFORMS, default: 'Sawtooth' },
          { id: 'osc1_octave', label: 'Octave', type: 'number', min: -2, max: 2, default: 0 },
          { id: 'osc1_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_tune', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_type', label: 'Filter Module', type: 'select', options: ['Cascade (Moog)', 'Multimode (Oberheim)', 'Bite (Buchla)', 'Ladder'], default: 'Cascade (Moog)' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('amp_env', 'Amp Envelope'),
      adsrSection('filter_env', 'Filter Envelope'),
      {
        id: 'filter_env_mod', label: 'Filter ENV Amount', icon: '🎛️',
        fields: [
          { id: 'filter_env_amount', label: 'ENV → Cutoff', type: 'slider', min: -100, max: 100, default: 40, unit: '%' },
        ],
      },
      {
        id: 'lfo1', label: 'LFO', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'Pitch', 'Level', 'Pulse Width'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },

  // ─── GENERIC SUBTRACTIVE ──────────────────────────────────────────────────
  generic_subtractive: {
    name: 'Generic Subtractive',
    vendor: 'Unknown',
    category: 'subtractive',
    filenamePatterns: [],
    sections: [
      {
        id: 'osc1', label: 'Oscillator 1', icon: '🔴',
        fields: [
          { id: 'osc1_waveform', label: 'Waveform', type: 'select', options: COMMON_WAVEFORMS, default: 'Sawtooth' },
          { id: 'osc1_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 100, unit: '%' },
          { id: 'osc1_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc1_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
        ],
      },
      {
        id: 'osc2', label: 'Oscillator 2', icon: '🟢',
        fields: [
          { id: 'osc2_waveform', label: 'Waveform', type: 'select', options: ['Off', ...COMMON_WAVEFORMS], default: 'Off' },
          { id: 'osc2_level', label: 'Level', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'osc2_semi', label: 'Semitone', type: 'number', min: -24, max: 24, default: 0 },
          { id: 'osc2_fine', label: 'Fine Tune', type: 'slider', min: -100, max: 100, default: 0, unit: 'cents' },
        ],
      },
      {
        id: 'filter', label: 'Filter', icon: '🎚️',
        fields: [
          { id: 'filter_on', label: 'Filter On', type: 'toggle', default: true },
          { id: 'filter_type', label: 'Type', type: 'select', options: FILTER_TYPES, default: 'LP 24' },
          { id: 'filter_cutoff', label: 'Cutoff', type: 'slider', min: 20, max: 20000, default: 8000, unit: 'Hz', scale: 'log' },
          { id: 'filter_res', label: 'Resonance', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'filter_env_amount', label: 'ENV Amount', type: 'slider', min: -100, max: 100, default: 0, unit: '%' },
        ],
      },
      adsrSection('amp_env', 'Amp Envelope'),
      adsrSection('filter_env', 'Filter Envelope'),
      {
        id: 'lfo1', label: 'LFO', icon: '〰️',
        fields: [
          { id: 'lfo1_wave', label: 'Shape', type: 'select', options: LFO_WAVES, default: 'Sine' },
          { id: 'lfo1_rate', label: 'Rate', type: 'slider', min: 0.01, max: 20, default: 1, unit: 'Hz' },
          { id: 'lfo1_sync', label: 'Sync to Tempo', type: 'toggle', default: false },
          { id: 'lfo1_dest', label: 'Destination', type: 'select', options: ['None', 'Filter Cutoff', 'Pitch', 'Level'], default: 'None' },
          { id: 'lfo1_amount', label: 'Amount', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
      {
        id: 'fx', label: 'Effects', icon: '✨',
        fields: [
          { id: 'fx_chorus', label: 'Chorus On', type: 'toggle', default: false },
          { id: 'fx_chorus_rate', label: 'Chorus Rate', type: 'slider', min: 0, max: 10, default: 0.5, unit: 'Hz' },
          { id: 'fx_chorus_depth', label: 'Chorus Depth', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_dist', label: 'Distortion On', type: 'toggle', default: false },
          { id: 'fx_dist_drive', label: 'Drive', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_reverb', label: 'Reverb On', type: 'toggle', default: false },
          { id: 'fx_reverb_mix', label: 'Reverb Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
          { id: 'fx_delay', label: 'Delay On', type: 'toggle', default: false },
          { id: 'fx_delay_mix', label: 'Delay Mix', type: 'slider', min: 0, max: 100, default: 0, unit: '%' },
        ],
      },
    ],
  },
};

// ─── VST Filename → Schema Matcher ──────────────────────────────────────────

/**
 * Given a VST filename, find the best matching schema.
 * Falls back to generic_subtractive if no match found.
 */
export function matchSchemaToVST(filename) {
  const lower = filename.toLowerCase().replace(/\.(dll|vst3|so)$/, '').trim();

  for (const [key, schema] of Object.entries(schemas)) {
    if (schema.filenamePatterns.some(p => lower.includes(p))) {
      return { key, schema };
    }
  }

  // Fallback: return generic
  return { key: 'generic_subtractive', schema: schemas.generic_subtractive };
}

/**
 * Get a schema by key.
 */
export function getSchema(key) {
  return schemas[key] || schemas.generic_subtractive;
}

/**
 * Get all schema keys and names (for the synth selector UI for custom/manual selection).
 */
export function getAllSchemas() {
  return Object.entries(schemas).map(([key, s]) => ({
    key,
    name: s.name,
    vendor: s.vendor,
    category: s.category,
  }));
}

export default schemas;
