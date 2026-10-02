/**
 * rules.js
 * Core rule-based translation engine: Source Synth params → Ableton Operator settings.
 *
 * Output format is an OperatorPatch object which includes:
 *   - Algorithm selection
 *   - 4 Operator configs (A, B, C, D)
 *   - Filter settings
 *   - LFO settings
 *   - Pitch Envelope
 *   - A list of human-readable step instructions
 */

// ─── Operator Algorithm Descriptions ────────────────────────────────────────

export const ALGORITHMS = [
  { number: 1,  label: 'Alg 1',  description: 'D→C→B→A (chain: 3 mods feeding one carrier)', carriers: ['A'], modulators: ['B','C','D'] },
  { number: 2,  label: 'Alg 2',  description: 'D→C→B→A + D→B (D modulates both B and C)', carriers: ['A'], modulators: ['B','C','D'] },
  { number: 3,  label: 'Alg 3',  description: '(D+C)→B→A (D and C both modulate B)', carriers: ['A'], modulators: ['B','C','D'] },
  { number: 4,  label: 'Alg 4',  description: 'D→C→A + B→A (two mod paths to carrier A)', carriers: ['A'], modulators: ['B','C','D'] },
  { number: 5,  label: 'Alg 5',  description: '(D→C) + (D→B) + A (D mods C and B; A is free carrier)', carriers: ['A','B','C'], modulators: ['D'] },
  { number: 6,  label: 'Alg 6',  description: 'D→(A+B+C) (one mod feeding three carriers — additive)', carriers: ['A','B','C'], modulators: ['D'] },
  { number: 7,  label: 'Alg 7',  description: 'A+B+C+D (all carriers, pure additive — no FM)', carriers: ['A','B','C','D'], modulators: [] },
  { number: 8,  label: 'Alg 8',  description: '(C→B→A) + D (simple FM chain + extra carrier)', carriers: ['A','D'], modulators: ['B','C'] },
];

// ─── Waveform Mapping ────────────────────────────────────────────────────────

/**
 * Maps source synth waveform names to Operator carrier settings.
 * Returns: { waveform, feedback, notes }
 */
function mapWaveform(waveformName) {
  const w = (waveformName || '').toLowerCase();

  if (w.includes('sin')) return { waveform: 'Sine', feedback: 0, notes: 'Pure sine wave — set feedback to 0.' };
  if (w.includes('saw') || w.includes('sawtooth')) return {
    waveform: 'Sine', feedback: 55,
    notes: 'Use Sine wave with Feedback ~55% to approximate a sawtooth. The more feedback, the brighter/richer the tone.',
  };
  if (w.includes('square') || w.includes('pulse')) return {
    waveform: 'Sine', feedback: 35,
    notes: 'Use Sine with Feedback ~35% to approximate a square. Alternatively, use Algorithm 3 with two carriers tuned an octave apart.',
  };
  if (w.includes('tri')) return {
    waveform: 'Sine', feedback: 12,
    notes: 'Use Sine with low Feedback (~12%) to approximate a triangle — soft, mellow tone.',
  };
  if (w.includes('noise') || w.includes('s&h') || w.includes('random')) return {
    waveform: 'Sine', feedback: 90,
    notes: 'Very high feedback (90%+) creates a noise-like tone in Operator. For true noise, add an Ableton Redux device or use the Noise wavetable from Operator\'s Wave Editor.',
  };
  if (w.includes('off') || w === '') return { waveform: 'Sine', feedback: 0, notes: 'Oscillator is off.' };

  // Wavetable/unknown: best approximation
  return {
    waveform: 'Sine', feedback: 30,
    notes: `"${waveformName}" is a wavetable/custom waveform. Use the Operator Wave Editor to sketch in harmonics, or start with Sine + Feedback ~30% as a starting point.`,
  };
}

// ─── ADSR Normalization ──────────────────────────────────────────────────────

/**
 * Clamp value to [min, max].
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Normalize ADSR values to Operator's expected ranges.
 * Operator: Attack 0–60s, Decay 0–60s, Sustain 0–100%, Release 0–60s
 * Input is already in ms (from our schemas), output in ms clamped.
 */
function normalizeADSR({ attack, decay, sustain, release }) {
  return {
    attack:  clamp(attack  ?? 5,   0, 60000),
    decay:   clamp(decay   ?? 500, 0, 60000),
    sustain: clamp(sustain ?? 70,  0, 100),
    release: clamp(release ?? 300, 0, 60000),
  };
}

/**
 * Format ms value for display: shows in seconds if > 1000ms.
 */
function fmtMs(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

// ─── Detune / Unison Helpers ─────────────────────────────────────────────────

/**
 * Recommend how to handle unison voices in Operator (which doesn't have native unison).
 */
function unisonAdvice(voices, detuneCents) {
  if (!voices || voices <= 1) return null;
  if (voices <= 2) {
    return `Your source uses ${voices} voice unison with ~${detuneCents} cents detune. In Operator: set Oscillator A Fine to +${Math.round(detuneCents / 2)} and Oscillator B Fine to -${Math.round(detuneCents / 2)}, both as carriers (use Algorithm 8 or 7). This gives a subtle chorus-like detuned effect.`;
  }
  return `Your source uses ${voices}-voice unison (${detuneCents} cents detune). Operator can't fully replicate this natively. Recommendation: ➊ Use 2 detuned carriers in Operator, ➋ Add an Ableton Chorus-Ensemble device after Operator (Rate: 0.3–0.6Hz, Amount: 30–60%), ➌ Use Ableton's Unison in Simpler as an alternative container.`;
}

// ─── Core Translation Functions ──────────────────────────────────────────────

/**
 * Translate a subtractive/wavetable synth's parameters into an Operator patch.
 * @param {object} params - Normalized parameter object from the form/parser
 * @param {string} synthName
 * @returns {OperatorPatch}
 */
export function translateToOperator(params, synthName = 'Unknown', category = 'subtractive') {
  const steps = [];
  let algorithmNumber = 5; // Default: one modulator, one main carrier + two spare carriers

  // ── Gather oscillator data ─────────────────────────────────────────────
  const oscA = extractOscParams(params, 'a') || extractOscParams(params, '1') || extractOscParams(params, 'gen1') || {};
  const oscB = extractOscParams(params, 'b') || extractOscParams(params, '2') || extractOscParams(params, 'gen2') || {};

  const waveA = mapWaveform(oscA.waveform || '');
  const waveB = mapWaveform(oscB.waveform || '');

  // ── Gather envelope data ───────────────────────────────────────────────
  const ampEnv  = normalizeADSR(extractEnv(params, ['amp_env', 'env1', 'env4']));
  const filtEnv = normalizeADSR(extractEnv(params, ['filter_env', 'flt_env', 'env2']));

  // ── Gather filter data ─────────────────────────────────────────────────
  const filter = extractFilter(params);

  // ── Gather LFO data ────────────────────────────────────────────────────
  const lfo = extractLFO(params);

  // ── Determine unison ───────────────────────────────────────────────────
  const unisonVoices  = Number(oscA.unison  || oscA.voices || 1);
  const unisonDetune  = Number(oscA.detune  || 0);
  const unisonHint    = unisonAdvice(unisonVoices, unisonDetune);

  // ── Choose algorithm ───────────────────────────────────────────────────
  const oscBActive = oscB.waveform && oscB.waveform !== 'Off' && Number(oscB.level || 0) > 0;
  const filterOn   = filter.on !== false;

  if (!oscBActive) {
    // Single oscillator source: use algorithm 5 (one modulator shapes timbre, one carrier sounds)
    algorithmNumber = 5;
  } else {
    // Two oscillators: carriers in parallel
    algorithmNumber = 7;
  }
  const algorithm = ALGORITHMS[algorithmNumber - 1];

  // ─────────────────────────────────────────────────────────────────────
  // Build Step Instructions
  // ─────────────────────────────────────────────────────────────────────

  // Step: Algorithm
  steps.push({
    section: '⚙️ Algorithm',
    instruction: `Select **Algorithm ${algorithmNumber}** — "${algorithm.description}". Click the algorithm icon in the top-left corner of Operator.`,
    value: `Alg ${algorithmNumber}`,
  });

  // Step: Carrier A (the audible oscillator)
  steps.push({
    section: '🔴 Oscillator A (Carrier)',
    instruction: `Set Waveform to **${waveA.waveform}**. This is the main audible carrier. ${waveA.notes}`,
    value: waveA.waveform,
  });
  steps.push({
    section: '🔴 Oscillator A (Carrier)',
    instruction: `Set Feedback to **${Math.round(waveA.feedback)}%** — this emulates the harmonic content of a ${oscA.waveform || 'Sawtooth'} wave.`,
    value: `Feedback: ${Math.round(waveA.feedback)}%`,
  });
  steps.push({
    section: '🔴 Oscillator A (Carrier)',
    instruction: `Set Level to **100** (full). Keep Coarse at 0 and Fine at ${oscA.fine || 0} cents.`,
    value: 'Level: 100, Coarse: 0',
  });
  if (oscA.semi && oscA.semi !== 0) {
    steps.push({
      section: '🔴 Oscillator A (Carrier)',
      instruction: `Your source oscillator is transposed by **${oscA.semi} semitones**. Set Osc A Coarse to ${oscA.semi} in Operator.`,
      value: `Coarse: ${oscA.semi}`,
    });
  }

  // Amp Envelope on Carrier A
  steps.push({
    section: '🔴 Oscillator A — Amp Envelope',
    instruction: `Set the Carrier A envelope (this controls the **volume shape**):\n• **Attack:** ${fmtMs(ampEnv.attack)}\n• **Decay:** ${fmtMs(ampEnv.decay)}\n• **Sustain:** ${ampEnv.sustain}%\n• **Release:** ${fmtMs(ampEnv.release)}`,
    value: `A:${fmtMs(ampEnv.attack)} D:${fmtMs(ampEnv.decay)} S:${ampEnv.sustain}% R:${fmtMs(ampEnv.release)}`,
    isADSR: true,
    adsr: ampEnv,
  });

  // Modulator B (shapes timbre over time — acts like a "filter envelope" in FM)
  steps.push({
    section: '🟡 Oscillator B (Modulator)',
    instruction: `Oscillator B acts as the **timbre modulator** (the FM equivalent of your filter). Set:\n• Waveform: **Sine**\n• Ratio (Coarse): **1** (1:1 with carrier — adds brightness/harmonics)\n• Level: **${filterToModLevel(filter.cutoff)}** — this controls how bright the sound is (higher = brighter, like opening a filter).`,
    value: `Level: ${filterToModLevel(filter.cutoff)}`,
  });

  // Modulator B envelope (emulates filter envelope)
  steps.push({
    section: '🟡 Oscillator B — Timbre Envelope',
    instruction: `Set Oscillator B's envelope to match your **filter envelope** — this shapes the brightness over time:\n• **Attack:** ${fmtMs(filtEnv.attack)}\n• **Decay:** ${fmtMs(filtEnv.decay)}\n• **Sustain:** ${filtEnv.sustain}%\n• **Release:** ${fmtMs(filtEnv.release)}\n\n_The Modulator's amplitude envelope controls how much FM modulation occurs over time — higher = brighter._`,
    value: `A:${fmtMs(filtEnv.attack)} D:${fmtMs(filtEnv.decay)} S:${filtEnv.sustain}% R:${fmtMs(filtEnv.release)}`,
    isADSR: true,
    adsr: filtEnv,
  });

  // Second oscillator (OSC B from source)
  if (oscBActive) {
    const waveB2 = mapWaveform(oscB.waveform || '');
    const bLevel = Math.round(Number(oscB.level || 50));
    steps.push({
      section: '🔵 Oscillator C (2nd Carrier)',
      instruction: `Your source has a **second oscillator** (${oscB.waveform}). Map it to Operator's **Oscillator C** as a second carrier:\n• Waveform: **${waveB2.waveform}**\n• Feedback: **${Math.round(waveB2.feedback)}%**\n• Level: **${bLevel}**\n• Coarse: **${oscB.semi || 0}** semitones\n• Fine: **${oscB.fine || 0}** cents`,
      value: `OSC C: ${waveB2.waveform}, Fb:${Math.round(waveB2.feedback)}%, Level:${bLevel}`,
    });
  }

  // Filter section
  if (filterOn) {
    const filterType = mapFilterType(filter.type || 'LP 24');
    const filterFreq = Math.round(filter.cutoff || 4000);
    const filterRes  = Math.round(filter.resonance || 0);
    steps.push({
      section: '🎚️ Filter Section',
      instruction: `Enable the **Filter** in Operator (click the "Filter" button to turn it on):\n• **Type:** ${filterType.label}\n• **Frequency:** ${filterFreq} Hz\n• **Resonance:** ${filterRes}%\n\n_${filterType.note}_`,
      value: `${filterType.label} @ ${filterFreq}Hz, Res: ${filterRes}%`,
    });

    // Filter envelope amount
    const envAmt = filter.envAmount || 0;
    if (Math.abs(envAmt) > 5) {
      steps.push({
        section: '🎚️ Filter Envelope',
        instruction: `Set the **Filter Envelope Amount** to **${Math.round(envAmt)}%** — this controls how much the filter envelope opens/closes the filter over time.`,
        value: `ENV Amt: ${Math.round(envAmt)}%`,
      });
    }
  } else {
    steps.push({
      section: '🎚️ Filter Section',
      instruction: 'Your source patch has the filter **disabled**. Leave the Operator filter **off** (or set Frequency to 20,000 Hz to fully open it).',
      value: 'Filter OFF',
    });
  }

  // LFO
  if (lfo && lfo.amount > 2) {
    const lfoWave = mapLFOShape(lfo.waveform);
    const lfoDest = mapLFODestination(lfo.destination || '');
    steps.push({
      section: '〰️ LFO',
      instruction: `Set the Operator **LFO**:\n• **Waveform:** ${lfoWave}\n• **Rate:** ${lfo.sync ? 'Sync ON — use tempo-synced rate' : `${(lfo.rate || 1).toFixed(2)} Hz`}\n• **Destination:** ${lfoDest.label}\n• **Amount:** ${Math.round(lfo.amount)}%\n\n_${lfoDest.note}_`,
      value: `LFO: ${lfoWave} @ ${lfo.rate}Hz → ${lfoDest.label} (${Math.round(lfo.amount)}%)`,
    });
  } else {
    steps.push({
      section: '〰️ LFO',
      instruction: 'LFO amount is very low or off in your source patch. Leave Operator\'s LFO amount at **0**.',
      value: 'LFO: Off',
    });
  }

  // Oscillator D — turn off if not needed
  if (!oscBActive) {
    steps.push({
      section: '⚫ Oscillator C & D',
      instruction: 'Turn **Oscillator C** and **Oscillator D off** (click their On/Off buttons so they are inactive) — your source only uses one main oscillator.',
      value: 'OSC C/D: Off',
    });
  } else {
    steps.push({
      section: '⚫ Oscillator D',
      instruction: 'Turn **Oscillator D off** — it is not needed for this patch.',
      value: 'OSC D: Off',
    });
  }

  // Unison advice
  if (unisonHint) {
    steps.push({
      section: '🎙️ Unison / Detune',
      instruction: unisonHint,
      value: `Unison: ${unisonVoices} voices, ${unisonDetune} cents`,
      isWarning: true,
    });
  }

  // Global volume
  steps.push({
    section: '🔊 Global Volume',
    instruction: 'Set the Operator global **Volume** to **-12 dB** as a starting point. Adjust to taste after you\'ve matched the other parameters.',
    value: 'Volume: -12 dB',
  });

  // ─── Build final patch summary ─────────────────────────────────────────

  const patch = {
    synthName,
    algorithm: { number: algorithmNumber, description: algorithm.description },
    oscillators: {
      A: { role: 'carrier', waveform: waveA.waveform, coarse: oscA.semi || 0, fine: oscA.fine || 0, level: 100, feedback: Math.round(waveA.feedback), on: true, envelope: ampEnv },
      B: { role: 'modulator', waveform: 'Sine', coarse: 1, fine: 0, level: filterToModLevel(filter.cutoff), feedback: 0, on: true, envelope: filtEnv },
      C: oscBActive
        ? { role: 'carrier', waveform: waveB.waveform, coarse: oscB.semi || 0, fine: oscB.fine || 0, level: Math.round(Number(oscB.level || 50)), feedback: Math.round(waveB.feedback), on: true, envelope: ampEnv }
        : { role: 'off', on: false },
      D: { role: 'off', on: false },
    },
    filter: filterOn ? {
      on: true,
      type: mapFilterType(filter.type || 'LP 24').label,
      frequency: Math.round(filter.cutoff || 4000),
      resonance:  Math.round(filter.resonance || 0),
      envelope: filtEnv,
      envAmount: Math.round(filter.envAmount || 0),
    } : { on: false },
    lfo: lfo ? {
      waveform: mapLFOShape(lfo.waveform),
      rate: lfo.rate || 1,
      syncToTempo: lfo.sync || false,
      destination: mapLFODestination(lfo.destination || '').label,
      amount: Math.round(lfo.amount || 0),
    } : null,
    pitchEnvelope: { attack: 0, decay: 0, sustain: 0, release: 0, amount: 0 },
    steps,
  };

  return patch;
}

// ─── Parameter Extraction Helpers ────────────────────────────────────────────

/** Extract oscillator params from flat params object by trying multiple prefix conventions */
function extractOscParams(params, idSuffix) {
  const prefixes = [
    `osc_${idSuffix}_`, `osc${idSuffix}_`, `gen${idSuffix}_`,
  ];
  for (const prefix of prefixes) {
    const keys = Object.keys(params).filter(k => k.startsWith(prefix));
    if (keys.length > 0) {
      const osc = {};
      keys.forEach(k => { osc[k.replace(prefix, '')] = params[k]; });
      return osc;
    }
  }
  return null;
}

/** Extract ADSR envelope params using candidate section IDs */
function extractEnv(params, candidateIds) {
  for (const id of candidateIds) {
    const a = params[`${id}_attack`];
    if (a !== undefined) {
      return {
        attack:  Number(params[`${id}_attack`]  ?? 5),
        decay:   Number(params[`${id}_decay`]   ?? 500),
        sustain: Number(params[`${id}_sustain`] ?? 70),
        release: Number(params[`${id}_release`] ?? 300),
      };
    }
  }
  return { attack: 5, decay: 500, sustain: 70, release: 300 };
}

/** Extract filter params from flat params object */
function extractFilter(params) {
  return {
    on:        params['filter_on'] !== false,
    type:      params['filter_type'] || params['filter1_type'] || params['flt1_type'] || 'LP 24',
    cutoff:    Number(params['filter_cutoff'] || params['filter1_cutoff'] || params['flt1_cutoff'] || 4000),
    resonance: Number(params['filter_res']    || params['filter1_res']    || params['flt1_res']    || 0),
    envAmount: Number(params['env2_amount']   || params['filter_env_amount'] || params['flt1_env_amount'] || params['filter1_env_amount'] || 0),
  };
}

/** Extract LFO params from flat params */
function extractLFO(params) {
  const dest = params['lfo1_destination'] || params['lfo1_dest'] || '';
  const amount = Number(params['lfo1_amount'] || 0);
  return {
    waveform: params['lfo1_waveform'] || params['lfo1_wave'] || 'Sine',
    rate:     Number(params['lfo1_rate'] || 1),
    sync:     Boolean(params['lfo1_sync']),
    destination: dest,
    amount,
  };
}

// ─── Conversion Helpers ───────────────────────────────────────────────────────

/**
 * Convert filter cutoff frequency to a Modulator level suggestion (0–100).
 * High cutoff = bright = more modulation. Low cutoff = dark = less modulation.
 */
function filterToModLevel(cutoffHz) {
  const hz = Number(cutoffHz || 4000);
  if (hz >= 15000) return 90;
  if (hz >= 8000)  return 70;
  if (hz >= 4000)  return 50;
  if (hz >= 2000)  return 35;
  if (hz >= 800)   return 20;
  return 10;
}

/** Map source filter type to Operator's filter type + a helpful note */
function mapFilterType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('lp') && t.includes('24')) return { label: 'LP (24 dB/oct)', note: 'Classic warm lowpass — great for bass and leads.' };
  if (t.includes('lp') && t.includes('12')) return { label: 'LP (12 dB/oct)', note: 'Gentler lowpass — brighter and more open.' };
  if (t.includes('hp') && t.includes('24')) return { label: 'HP (24 dB/oct)', note: 'Steep highpass — removes bass frequencies.' };
  if (t.includes('hp') && t.includes('12')) return { label: 'HP (12 dB/oct)', note: 'Gentle highpass.' };
  if (t.includes('bp'))                     return { label: 'BP (12 dB/oct)', note: 'Bandpass — allows only mid frequencies through.' };
  if (t.includes('notch'))                  return { label: 'Notch', note: 'Notch removes a narrow frequency band.' };
  return { label: 'LP (24 dB/oct)', note: 'Defaulting to lowpass 24dB — adjust to match your source filter character.' };
}

/** Map source LFO shape name to Operator LFO shape */
function mapLFOShape(shape) {
  const s = (shape || '').toLowerCase();
  if (s.includes('sin'))     return 'Sine';
  if (s.includes('tri'))     return 'Triangle';
  if (s.includes('saw'))     return 'Sawtooth';
  if (s.includes('sq') || s.includes('square')) return 'Square';
  if (s.includes('s&h') || s.includes('sample')) return 'S&H';
  if (s.includes('noise'))   return 'Noise';
  return 'Sine';
}

/** Map LFO destination name to Operator's available destinations */
function mapLFODestination(dest) {
  const d = (dest || '').toLowerCase();
  if (d.includes('filter') || d.includes('cutoff')) {
    return { label: 'Filter Frequency', note: 'Modulates the filter cutoff — creates a classic "wah" or "sweep" effect.' };
  }
  if (d.includes('pitch') || d.includes('osc')) {
    return { label: 'Oscillator Frequency (All)', note: 'Modulates pitch of all oscillators — creates vibrato.' };
  }
  if (d.includes('vol') || d.includes('level') || d.includes('amp')) {
    return { label: 'Volume', note: 'Modulates volume — creates tremolo.' };
  }
  if (d.includes('none') || d === '') {
    return { label: 'None (disabled)', note: 'LFO has no destination or is off.' };
  }
  return { label: 'Filter Frequency', note: 'Best general LFO target in Operator.' };
}
