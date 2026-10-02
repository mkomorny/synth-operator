/**
 * presetParsers.js
 * Parses VST preset files into a normalized flat parameter object
 * that can be fed to the translation engine.
 *
 * Supported formats:
 *  - .vital  (JSON, Matt Tytel Vital)
 *  - .fxp    (VST2 — tries XML parsing first, then binary text extraction)
 *  - .fxb    (VST2 bank — reads first preset)
 *  - .surge  (Surge XT JSON)
 *  - Generic (plain JSON or XML as key-value fallback)
 */

// ─── Vital (.vital) ──────────────────────────────────────────────────────────

/**
 * Parse Vital preset JSON into normalized params.
 * Vital stores everything in a JSON object with sections like
 * "oscillators", "filter_1", "envelope_1", "lfo_1", etc.
 */
function parseVital(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid Vital preset: not valid JSON.');
  }

  const params = {};
  const settings = data.settings || data;

  // Oscillators
  ['1', '2'].forEach((n, i) => {
    const osc = settings[`oscillator_${n}`] || {};
    const pfx = `osc${n}`;
    params[`${pfx}_waveform`] = osc.wave_frame !== undefined ? 'Custom Wavetable' : 'Sine';
    params[`${pfx}_level`]    = Math.round((osc.level ?? 1.0) * 100);
    params[`${pfx}_semi`]     = Math.round(osc.transpose ?? 0);
    params[`${pfx}_fine`]     = Math.round((osc.tune ?? 0) * 100);
    params[`${pfx}_unison`]   = Math.round(osc.unison_voices ?? 1);
    params[`${pfx}_detune`]   = Math.round((osc.unison_detune ?? 0) * 100);
  });

  // Filter
  const f1 = settings['filter_1'] || {};
  params['filter_on']     = (f1.on ?? 1) === 1;
  params['filter_type']   = vitalFilterType(f1.model ?? 0, f1.style ?? 0);
  params['filter_cutoff'] = vitalCutoffToHz(f1.cutoff ?? 96);
  params['filter_res']    = Math.round((f1.resonance ?? 0) * 100);

  // Envelopes
  ['1', '2'].forEach((n) => {
    const env = settings[`envelope_${n}`] || {};
    const pfx = n === '1' ? 'env1' : 'env2';
    params[`${pfx}_attack`]  = Math.round((env.attack  ?? 0.005) * 1000);
    params[`${pfx}_decay`]   = Math.round((env.decay   ?? 0.5)   * 1000);
    params[`${pfx}_sustain`] = Math.round((env.sustain ?? 0.7)   * 100);
    params[`${pfx}_release`] = Math.round((env.release ?? 0.3)   * 1000);
  });

  // LFO 1
  const lfo1 = settings['lfo_1'] || {};
  params['lfo1_waveform'] = vitalLFOShape(lfo1.wave ?? 0);
  params['lfo1_rate']     = Number((lfo1.frequency ?? 1).toFixed(2));
  params['lfo1_sync']     = (lfo1.sync ?? 0) === 1;

  // FX
  const chorus = settings['chorus'] || {};
  const reverb = settings['reverb'] || {};
  const delay  = settings['delay']  || {};
  const dist   = settings['distortion'] || {};

  params['fx_chorus']       = (chorus.on ?? 0) === 1;
  params['fx_chorus_rate']  = Number((chorus.frequency ?? 0.5).toFixed(2));
  params['fx_chorus_depth'] = Math.round((chorus.depth ?? 0) * 100);

  params['fx_reverb']     = (reverb.on ?? 0) === 1;
  params['fx_reverb_mix'] = Math.round((reverb.dry_wet ?? 0) * 100);
  params['fx_reverb_size'] = Math.round((reverb.size ?? 0.5) * 100);

  params['fx_delay']     = (delay.on ?? 0) === 1;
  params['fx_delay_time'] = Math.round((delay.frequency ?? 0.25) * 4000);
  params['fx_delay_mix']  = Math.round((delay.dry_wet ?? 0) * 100);

  params['fx_dist']       = (dist.on ?? 0) === 1;
  params['fx_dist_drive'] = Math.round((dist.drive ?? 0) * 100);

  return { params, confidence: 'high', format: 'Vital JSON' };
}

function vitalFilterType(model, style) {
  const modelMap = ['LP 12', 'LP 24', 'HP 12', 'HP 24', 'BP 12', 'BP 24', 'Notch', 'Comb'];
  return modelMap[model] || 'LP 24';
}
function vitalCutoffToHz(cutoff) {
  // Vital cutoff is in MIDI note space (0–128)
  return Math.round(440 * Math.pow(2, (cutoff - 69) / 12));
}
function vitalLFOShape(wave) {
  const shapes = ['Sine', 'Triangle', 'Sawtooth', 'Square', 'S&H', 'Noise'];
  return shapes[wave] || 'Sine';
}

// ─── Surge XT (.surge / .fxp JSON) ───────────────────────────────────────────

function parseSurge(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid Surge preset: not valid JSON.');
  }

  const params = {};
  const osc0 = (data.oscillators || [])[0] || {};
  const osc1 = (data.oscillators || [])[1] || {};

  params['osc1_waveform'] = osc0.type || 'Classic';
  params['osc1_level']    = Math.round((osc0.level ?? 1.0) * 100);
  params['osc1_semi']     = Math.round(osc0.pitch ?? 0);

  if (osc1.type) {
    params['osc2_waveform'] = osc1.type;
    params['osc2_level']    = Math.round((osc1.level ?? 0) * 100);
  }

  // Filter
  const filter = (data.filters || [])[0] || {};
  params['filter_type']   = filter.type || 'LP 24';
  params['filter_cutoff'] = Math.round(filter.cutoff ?? 4000);
  params['filter_res']    = Math.round((filter.resonance ?? 0) * 100);

  // Envelopes
  const ampEnv = data.ampeg || {};
  params['amp_env_attack']  = Math.round((ampEnv.attack  ?? 0.01) * 1000);
  params['amp_env_decay']   = Math.round((ampEnv.decay   ?? 0.5)  * 1000);
  params['amp_env_sustain'] = Math.round((ampEnv.sustain ?? 1.0)  * 100);
  params['amp_env_release'] = Math.round((ampEnv.release ?? 0.3)  * 1000);

  return { params, confidence: 'medium', format: 'Surge JSON' };
}

// ─── Generic XML Parser ───────────────────────────────────────────────────────

function parseXML(xmlText) {
  const params = {};
  // Extract param elements: <param name="..." value="..." />
  const paramRegex = /param[^>]+name=["']([^"']+)["'][^>]+value=["']([^"']+)["']/gi;
  let m;
  while ((m = paramRegex.exec(xmlText)) !== null) {
    const key   = m[1].toLowerCase().replace(/\s+/g, '_');
    const val   = parseFloat(m[2]);
    params[key] = isNaN(val) ? m[2] : val;
  }

  // Also try <PARAM id="..." val="..." />
  const paramRegex2 = /PARAM[^>]+id=["']([^"']+)["'][^>]+val=["']([^"']+)["']/gi;
  while ((m = paramRegex2.exec(xmlText)) !== null) {
    const key   = m[1].toLowerCase().replace(/\s+/g, '_');
    const val   = parseFloat(m[2]);
    params[key] = isNaN(val) ? m[2] : val;
  }

  if (Object.keys(params).length === 0) {
    throw new Error('No parameters found in XML preset.');
  }

  return { params, confidence: 'low', format: 'Generic XML' };
}

// ─── FXP / Binary Extraction ──────────────────────────────────────────────────

/**
 * Try to extract readable text params from binary FXP data.
 * FXP files start with 'CcnK' magic bytes. After the header,
 * some synths embed XML or JSON in the plugin-specific data chunk.
 */
function parseFXP(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'CcnK') {
    throw new Error('Not a valid FXP file (missing CcnK header).');
  }

  // Convert to string, strip nulls, find embedded text
  let text = '';
  for (let i = 60; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c < 127) || c === 9 || c === 10 || c === 13) {
      text += String.fromCharCode(c);
    } else {
      text += ' ';
    }
  }
  text = text.replace(/\s+/g, ' ').trim();

  // Try JSON first
  const jsonStart = text.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const jsonText = text.substring(jsonStart);
      const data = JSON.parse(jsonText);
      return { params: flattenObject(data), confidence: 'medium', format: 'FXP (embedded JSON)' };
    } catch { /* continue */ }
  }

  // Try XML
  const xmlStart = text.indexOf('<?xml');
  const xmlStart2 = text.indexOf('<preset');
  const xmlIdx = Math.min(
    xmlStart  === -1 ? Infinity : xmlStart,
    xmlStart2 === -1 ? Infinity : xmlStart2
  );
  if (xmlIdx !== Infinity) {
    try {
      return parseXML(text.substring(xmlIdx));
    } catch { /* continue */ }
  }

  // Last resort: extract key=value pairs from the readable text
  const params = {};
  const kvRegex = /([a-zA-Z_][a-zA-Z0-9_]{2,})\s*[=:]\s*([0-9.+-]+)/g;
  let m;
  while ((m = kvRegex.exec(text)) !== null) {
    params[m[1].toLowerCase()] = parseFloat(m[2]);
  }

  if (Object.keys(params).length < 3) {
    throw new Error('Could not extract parameters from this FXP file. The preset format may be proprietary/encrypted. Try the Manual Entry or Screenshot method instead.');
  }

  return { params, confidence: 'low', format: 'FXP (binary extraction)' };
}

// ─── Generic JSON ─────────────────────────────────────────────────────────────

function parseGenericJSON(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('Not valid JSON.');
  }
  return { params: flattenObject(data), confidence: 'low', format: 'Generic JSON' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten nested object to dot-notation keys */
function flattenObject(obj, prefix = '', result = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}_${k}`.toLowerCase() : k.toLowerCase();
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, result);
    } else {
      result[key] = v;
    }
  }
  return result;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Parse a preset file (as a File object from browser) and return normalized params.
 * @param {File} file - The uploaded file from an <input type="file">
 * @returns {Promise<{params: object, confidence: string, format: string}>}
 */
export async function parsePresetFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'vital') {
    const text = await file.text();
    return parseVital(text);
  }

  if (ext === 'surge') {
    const text = await file.text();
    return parseSurge(text);
  }

  if (ext === 'fxp' || ext === 'fxb') {
    // Try text first (some fxp files are actually XML)
    const text = await file.text();
    if (text.includes('<?xml') || text.includes('<preset') || text.includes('<state')) {
      try { return parseXML(text); } catch { /* fall through */ }
    }
    if (text.trim().startsWith('{')) {
      try { return parseGenericJSON(text); } catch { /* fall through */ }
    }
    // Binary path
    const buffer = await file.arrayBuffer();
    return parseFXP(buffer);
  }

  if (ext === 'json') {
    const text = await file.text();
    return parseGenericJSON(text);
  }

  if (ext === 'xml') {
    const text = await file.text();
    return parseXML(text);
  }

  throw new Error(`Unsupported file extension ".${ext}". Supported formats: .vital, .fxp, .fxb, .surge, .json, .xml`);
}
