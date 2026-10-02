const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#080810',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    // In dev, load Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    // In prod, load the static export
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ──────────────────────────────────────────────────────────

// 1. Scan VSTs
ipcMain.handle('scan-vsts', async () => {
  const VST_DIRS = [
    'C:\\Program Files\\Common Files\\VST2',
    'C:\\Program Files\\Common Files\\VST3',
    'C:\\Program Files (x86)\\Common Files\\VST2',
    'C:\\Program Files (x86)\\Common Files\\VST3',
    'C:\\Program Files\\VSTPlugins',
    'C:\\Program Files (x86)\\VSTPlugins',
  ];

  const KNOWN_SYNTHS = [
    { pattern: /serum/i,        name: 'Serum',        vendor: 'Xfer Records',           schemaKey: 'serum',            category: 'wavetable' },
    { pattern: /massive[_ ]?x/i, name: 'Massive X',   vendor: 'Native Instruments',     schemaKey: 'massive_x',        category: 'wavetable' },
    { pattern: /\bmassive\b/i,  name: 'Massive',       vendor: 'Native Instruments',     schemaKey: 'massive',          category: 'wavetable' },
    { pattern: /sylenth/i,      name: 'Sylenth1',      vendor: 'LennarDigital',          schemaKey: 'sylenth1',         category: 'subtractive' },
    { pattern: /\bvital\b/i,    name: 'Vital',         vendor: 'Matt Tytel',             schemaKey: 'vital',            category: 'wavetable' },
    { pattern: /surge[_ ]?xt/i, name: 'Surge XT',      vendor: 'Surge Synth Team',       schemaKey: 'surge',            category: 'subtractive' },
    { pattern: /phase.?plant/i, name: 'Phase Plant',   vendor: 'Kilohearts',             schemaKey: 'phase_plant',      category: 'semi-modular' },
    { pattern: /\bdiva\b/i,     name: 'Diva',          vendor: 'u-he',                   schemaKey: 'diva',             category: 'subtractive' },
  ];

  function identifySynth(filename) {
    const base = path.basename(filename, path.extname(filename));
    for (const synth of KNOWN_SYNTHS) {
      if (synth.pattern.test(base)) {
        return { ...synth };
      }
    }
    return { pattern: null, name: base, vendor: 'Unknown', schemaKey: 'generic_subtractive', category: 'unknown' };
  }

  function scanDirectory(dir) {
    const results = [];
    try {
      if (!fs.existsSync(dir)) return results;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const ext = path.extname(entry.name).toLowerCase();

        if (entry.isFile() && (ext === '.dll' || ext === '.vst3')) {
          const vstType = ext === '.dll' ? 'VST2' : 'VST3';
          const info = identifySynth(entry.name);
          results.push({
            filename: entry.name, path: fullPath, vstType,
            name: info.name, vendor: info.vendor,
            schemaKey: info.schemaKey, category: info.category,
          });
        } else if (entry.isDirectory() && ext === '.vst3') {
          const info = identifySynth(entry.name);
          results.push({
            filename: entry.name, path: fullPath, vstType: 'VST3',
            name: info.name, vendor: info.vendor,
            schemaKey: info.schemaKey, category: info.category,
          });
        } else if (entry.isDirectory() && ext !== '.vst3') {
          results.push(...scanDirectory(fullPath));
        }
      }
    } catch (err) {
      console.warn(`[VST Scanner] Could not read ${dir}: ${err.message}`);
    }
    return results;
  }

  const all = [];
  const scannedDirs = [];

  for (const dir of VST_DIRS) {
    const results = scanDirectory(dir);
    if (results.length > 0 || fs.existsSync(dir)) {
      scannedDirs.push({ dir, count: results.length });
      all.push(...results);
    }
  }

  const seen = new Set();
  const unique = all.filter(v => {
    const key = `${v.name}|${v.vstType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    if (a.category === 'unknown' && b.category !== 'unknown') return 1;
    if (a.category !== 'unknown' && b.category === 'unknown') return -1;
    return a.name.localeCompare(b.name);
  });

  return { success: true, plugins: unique, scannedDirs, total: unique.length };
});

// 2. AI Vision
ipcMain.handle('ai-vision', async (event, { imageBase64, mimeType, synthName, apiKey }) => {
  try {
    if (!apiKey) return { error: 'No API key provided.' };

    const prompt = `You are an expert synthesizer engineer. Analyze this screenshot of ${synthName} and extract ALL visible parameter values.

Return a JSON object with the following structure (use null for any parameter you cannot read):
{
  "oscillators": [
    {
      "id": "osc1",
      "waveform": "Saw | Square | Sine | Triangle | Noise | [wavetable name]",
      "level": 0-100,
      "semitone": integer,
      "fine_tune": -100 to 100 (cents),
      "unison_voices": integer,
      "unison_detune": 0-100
    }
  ],
  "filter": {
    "on": true/false,
    "type": "LP 24 | LP 12 | HP 24 | HP 12 | BP | Notch | Comb",
    "cutoff_hz": number,
    "resonance": 0-100,
    "env_amount": -100 to 100
  },
  "amp_envelope": { "attack_ms": number, "decay_ms": number, "sustain_pct": number, "release_ms": number },
  "filter_envelope": { "attack_ms": number, "decay_ms": number, "sustain_pct": number, "release_ms": number },
  "lfo": {
    "shape": "Sine | Triangle | Saw | Square | S&H | Noise",
    "rate_hz": number,
    "sync": true/false,
    "destination": "Filter Cutoff | OSC 1 Pitch | Level | None",
    "amount": 0-100
  },
  "effects": {
    "chorus_on": true/false, "chorus_rate_hz": number, "chorus_depth_pct": number,
    "reverb_on": true/false, "reverb_mix_pct": number, "reverb_size_pct": number,
    "delay_on": true/false, "delay_time_ms": number, "delay_mix_pct": number,
    "distortion_on": true/false, "distortion_drive_pct": number,
    "phaser_on": true/false
  }
}

Be precise. If a knob is at 12 o'clock it is typically 50%. If it's fully clockwise it's 100%. Only return the JSON object, no explanation.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    };

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { error: `Gemini API error (${response.status}). Check your API key.`, details: errText };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: 'AI could not extract structured parameters from the image.' };

    const extracted = JSON.parse(jsonMatch[0]);

    // Normalize
    const params = {};
    (extracted.oscillators || []).forEach((osc, i) => {
      const n = i + 1;
      if (osc.waveform)       params[`osc${n}_waveform`] = osc.waveform;
      if (osc.level != null)  params[`osc${n}_level`]    = osc.level;
      if (osc.semitone != null) params[`osc${n}_semi`]   = osc.semitone;
      if (osc.fine_tune != null) params[`osc${n}_fine`]  = osc.fine_tune;
      if (osc.unison_voices != null) params[`osc${n}_unison`] = osc.unison_voices;
      if (osc.unison_detune != null) params[`osc${n}_detune`] = osc.unison_detune;
    });

    const f = extracted.filter || {};
    if (f.on != null)         params['filter_on']       = f.on;
    if (f.type)               params['filter_type']     = f.type;
    if (f.cutoff_hz != null)  params['filter_cutoff']   = f.cutoff_hz;
    if (f.resonance != null)  params['filter_res']      = f.resonance;
    if (f.env_amount != null) params['env2_amount']     = f.env_amount;

    const ae = extracted.amp_envelope || {};
    if (ae.attack_ms   != null) params['amp_env_attack']  = ae.attack_ms;
    if (ae.decay_ms    != null) params['amp_env_decay']   = ae.decay_ms;
    if (ae.sustain_pct != null) params['amp_env_sustain'] = ae.sustain_pct;
    if (ae.release_ms  != null) params['amp_env_release'] = ae.release_ms;

    const fe = extracted.filter_envelope || {};
    if (fe.attack_ms   != null) params['filter_env_attack']  = fe.attack_ms;
    if (fe.decay_ms    != null) params['filter_env_decay']   = fe.decay_ms;
    if (fe.sustain_pct != null) params['filter_env_sustain'] = fe.sustain_pct;
    if (fe.release_ms  != null) params['filter_env_release'] = fe.release_ms;

    const lfo = extracted.lfo || {};
    if (lfo.shape)        params['lfo1_waveform']    = lfo.shape;
    if (lfo.rate_hz)      params['lfo1_rate']        = lfo.rate_hz;
    if (lfo.sync != null) params['lfo1_sync']        = lfo.sync;
    if (lfo.destination)  params['lfo1_destination'] = lfo.destination;
    if (lfo.amount)       params['lfo1_amount']      = lfo.amount;

    const fx = extracted.effects || {};
    if (fx.chorus_on != null)       params['fx_chorus']        = fx.chorus_on;
    if (fx.chorus_rate_hz != null)  params['fx_chorus_rate']   = fx.chorus_rate_hz;
    if (fx.chorus_depth_pct != null) params['fx_chorus_depth'] = fx.chorus_depth_pct;
    if (fx.reverb_on != null)       params['fx_reverb']        = fx.reverb_on;
    if (fx.reverb_mix_pct != null)  params['fx_reverb_mix']    = fx.reverb_mix_pct;
    if (fx.delay_on != null)        params['fx_delay']         = fx.delay_on;
    if (fx.delay_time_ms != null)   params['fx_delay_time']    = fx.delay_time_ms;
    if (fx.delay_mix_pct != null)   params['fx_delay_mix']     = fx.delay_mix_pct;
    if (fx.distortion_on != null)   params['fx_dist']          = fx.distortion_on;
    if (fx.distortion_drive_pct != null) params['fx_dist_drive'] = fx.distortion_drive_pct;
    if (fx.phaser_on != null)       params['fx_phaser']        = fx.phaser_on;

    return { success: true, params, rawExtracted: extracted };

  } catch (err) {
    return { error: 'Internal server error: ' + err.message };
  }
});

// 3. AI Tips
ipcMain.handle('ai-tips', async (event, { synthName, params, apiKey }) => {
  try {
    if (!apiKey) return { error: 'No API key provided.' };

    const paramsSummary = Object.entries(params || {})
      .filter(([k, v]) => v !== null && v !== undefined && v !== '' && v !== false && v !== 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const prompt = `You are an expert sound designer specializing in Ableton Live and FM synthesis.

A user is trying to recreate a ${synthName} sound patch in Ableton Operator.
Here are the source synth's parameters:

${paramsSummary}

Please provide:
1. A brief expert summary of what kind of sound this patch creates (1-2 sentences).
2. The 3 most important things the user should focus on when recreating this in Operator.
3. Any "gotchas" or limitations — things Operator genuinely cannot replicate and how to work around them.
4. One creative tip for making the Operator version sound even better or more unique.

Keep your response concise and practical. Use Ableton-specific terminology. Format with clear headers using ## for each section.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { error: `Gemini API error (${response.status}). Check your API key.`, details: errText };
    }

    const data = await response.json();
    const tipText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No tips available.';

    return { success: true, tips: tipText };

  } catch (err) {
    return { error: 'Internal server error: ' + err.message };
  }
});
