/**
 * effects.js
 * Analyzes source synth parameters and recommends Ableton native audio/MIDI effects
 * to complement the Operator patch for a closer match to the original sound.
 */

// ─── Effect Definitions ───────────────────────────────────────────────────────

const EFFECTS_DB = {
  chorus: {
    name: 'Chorus-Ensemble',
    category: 'Audio Effect',
    icon: '🌊',
    path: 'Audio Effects → Modulation → Chorus-Ensemble',
    description: 'Emulates unison/voices by adding slightly detuned copies of the signal.',
  },
  reverb: {
    name: 'Reverb',
    category: 'Audio Effect',
    icon: '🏛️',
    path: 'Audio Effects → Reverb',
    description: 'Adds spatial depth and room ambience.',
  },
  delay: {
    name: 'Echo',
    category: 'Audio Effect',
    icon: '🔁',
    path: 'Audio Effects → Delay → Echo',
    description: 'Tape-style echo/delay effect.',
  },
  saturator: {
    name: 'Saturator',
    category: 'Audio Effect',
    icon: '🔥',
    path: 'Audio Effects → Distortion → Saturator',
    description: 'Adds analog warmth and harmonic saturation.',
  },
  distortion: {
    name: 'Amp (Amp & Cabinet)',
    category: 'Audio Effect',
    icon: '⚡',
    path: 'Audio Effects → Distortion → Amp',
    description: 'Heavy guitar-style distortion and cabinet simulation.',
  },
  phaser: {
    name: 'Phaser-Flanger',
    category: 'Audio Effect',
    icon: '🌀',
    path: 'Audio Effects → Modulation → Phaser-Flanger',
    description: 'Classic phasing and flanging modulation effect.',
  },
  eq: {
    name: 'EQ Eight',
    category: 'Audio Effect',
    icon: '📊',
    path: 'Audio Effects → EQ Eight',
    description: 'Precise multi-band EQ to sculpt the final tone.',
  },
  compressor: {
    name: 'Compressor',
    category: 'Audio Effect',
    icon: '🎛️',
    path: 'Audio Effects → Dynamics → Compressor',
    description: 'Tightens dynamics and adds punch.',
  },
  redux: {
    name: 'Redux',
    category: 'Audio Effect',
    icon: '💥',
    path: 'Audio Effects → Distortion → Redux',
    description: 'Bit-crushing and sample rate reduction for lo-fi textures.',
  },
  pitch: {
    name: 'Pitch (MIDI Effect)',
    category: 'MIDI Effect',
    icon: '🎹',
    path: 'MIDI Effects → Pitch',
    description: 'Transposes MIDI notes before hitting Operator.',
  },
  arpeggiator: {
    name: 'Arpeggiator (MIDI Effect)',
    category: 'MIDI Effect',
    icon: '🎵',
    path: 'MIDI Effects → Arpeggiator',
    description: 'Adds arpeggio patterns to held chords.',
  },
  chord: {
    name: 'Chord (MIDI Effect)',
    category: 'MIDI Effect',
    icon: '🎼',
    path: 'MIDI Effects → Chord',
    description: 'Stacks additional notes onto each MIDI input note for chord voicings.',
  },
};

// ─── Analysis Function ────────────────────────────────────────────────────────

/**
 * Analyze a set of source synth parameters and produce a list of recommended
 * Ableton effects to pair with the Operator patch.
 *
 * @param {object} params - Flat normalized parameter object from the form/parser
 * @returns {EffectsRecommendation[]}
 */
export function recommendEffects(params) {
  const recommendations = [];

  // ── Unison / Chorus ─────────────────────────────────────────────────────
  const unisonVoices = Number(
    params['osc_a_unison'] || params['osc1_unison'] ||
    params['osc_a_voices'] || params['osc1_voices'] || 1
  );
  const unisonDetune = Number(
    params['osc_a_detune'] || params['osc1_detune'] ||
    params['osc_b_detune'] || params['osc2_detune'] || 0
  );

  if (unisonVoices > 1 || unisonDetune > 10) {
    recommendations.push({
      effect: EFFECTS_DB.chorus,
      priority: 'high',
      reason: `Your source uses ${unisonVoices}-voice unison with ${unisonDetune > 0 ? unisonDetune + ' cents detune' : 'stereo spread'}. Operator has no built-in unison — add Chorus-Ensemble to emulate this width.`,
      settings: `Voices: ${Math.min(unisonVoices, 6)}, Rate: ${unisonDetune > 50 ? '0.8' : '0.4'} Hz, Amount: ${Math.round(Math.min(unisonDetune * 0.8, 80))}%`,
    });
  }

  // ── Distortion / Drive ───────────────────────────────────────────────────
  const distOn    = Boolean(params['fx_dist'] || params['fx_dist_on']);
  const distDrive = Number(params['fx_dist_drive'] || 0);

  if (distOn && distDrive > 10) {
    if (distDrive > 60) {
      recommendations.push({
        effect: EFFECTS_DB.distortion,
        priority: 'high',
        reason: `Heavy distortion detected (Drive: ${distDrive}%). Use Amp device for authentic crunch.`,
        settings: `Drive: ${Math.round(distDrive)}%, Cabinet: On`,
      });
    } else {
      recommendations.push({
        effect: EFFECTS_DB.saturator,
        priority: 'high',
        reason: `Moderate distortion/drive detected (${distDrive}%). Saturator adds warmth without being too aggressive.`,
        settings: `Drive: ${Math.round(distDrive * 0.7)}%, Type: Analog Clip, DC: Off`,
      });
    }
  } else if (!distOn) {
    // Always recommend light saturation as Operator is very clean
    recommendations.push({
      effect: EFFECTS_DB.saturator,
      priority: 'low',
      reason: 'Operator produces very clean, digital-sounding output. A small amount of Saturator adds warmth and analog character even without explicit distortion.',
      settings: 'Drive: 5–10%, Type: Analog Clip',
    });
  }

  // ── Reverb ───────────────────────────────────────────────────────────────
  const reverbOn  = Boolean(params['fx_reverb'] || params['fx_reverb_on']);
  const reverbMix = Number(params['fx_reverb_mix'] || params['fx_reverb_amount'] || 0);

  if (reverbOn && reverbMix > 5) {
    recommendations.push({
      effect: EFFECTS_DB.reverb,
      priority: 'high',
      reason: `Your source has reverb active (${reverbMix}% wet). Add Ableton's Reverb or Hybrid Reverb for a comparable ambience.`,
      settings: `Dry/Wet: ${Math.round(reverbMix)}%, Decay: ${reverbMix > 50 ? '3–4s (large hall)' : '1–2s (medium room)'}`,
    });
  }

  // ── Delay / Echo ─────────────────────────────────────────────────────────
  const delayOn  = Boolean(params['fx_delay'] || params['fx_delay_on']);
  const delayMix = Number(params['fx_delay_mix'] || 0);
  const delayMs  = Number(params['fx_delay_time'] || 250);

  if (delayOn && delayMix > 5) {
    recommendations.push({
      effect: EFFECTS_DB.delay,
      priority: 'high',
      reason: `Your source uses delay (${delayMix}% wet, ${delayMs}ms). Add Echo for a tape-flavored repeat.`,
      settings: `Time: ${delayMs}ms or 1/8 note (synced), Feedback: 30–40%, Dry/Wet: ${Math.round(delayMix)}%`,
    });
  }

  // ── Phaser / Flanger ─────────────────────────────────────────────────────
  const phaserOn = Boolean(params['fx_phaser'] || params['fx_phaser_on']);
  if (phaserOn) {
    recommendations.push({
      effect: EFFECTS_DB.phaser,
      priority: 'medium',
      reason: 'Your source has a phaser active. Add Ableton Phaser-Flanger to replicate the sweeping phase effect.',
      settings: 'Poles: 8, Rate: ~0.3 Hz, Feedback: 50%, Dry/Wet: 60%',
    });
  }

  // ── Chorus ───────────────────────────────────────────────────────────────
  const chorusOn    = Boolean(params['fx_chorus'] || params['fx_chorus_on']);
  const chorusRate  = Number(params['fx_chorus_rate'] || 0.5);
  const chorusDepth = Number(params['fx_chorus_depth'] || params['fx_chorus_amount'] || 0);

  if (chorusOn && chorusDepth > 5 && unisonVoices <= 1) {
    // Only add if not already added for unison
    recommendations.push({
      effect: EFFECTS_DB.chorus,
      priority: 'high',
      reason: `Your source uses a chorus effect (Rate: ${chorusRate}Hz, Depth: ${chorusDepth}%).`,
      settings: `Rate: ${chorusRate.toFixed(1)} Hz, Amount: ${Math.round(chorusDepth)}%, Dry/Wet: 70%`,
    });
  }

  // ── EQ ───────────────────────────────────────────────────────────────────
  // Always recommend EQ Eight as a final touch
  recommendations.push({
    effect: EFFECTS_DB.eq,
    priority: 'low',
    reason: 'Add EQ Eight at the end of your chain to fine-tune the frequency balance after all other effects. Operator\'s tonal character differs from your source, so a high shelf boost or low-cut can help match the overall tone.',
    settings: 'Start flat. Boost presence (2–5kHz) by 2–3dB if it sounds too dark, or roll off high end (10kHz+) if too harsh.',
  });

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return recommendations;
}

/**
 * Get just the recommended MIDI effects for a source patch.
 */
export function recommendMIDIEffects(params) {
  const midiEffects = [];

  // Transpose/pitch shift
  const semi = Number(params['osc_a_semi'] || params['osc1_semi'] || params['osc1_pitch'] || 0);
  if (Math.abs(semi) > 0) {
    midiEffects.push({
      effect: EFFECTS_DB.pitch,
      priority: 'medium',
      reason: `Your source oscillator is transposed by ${semi} semitones. You can set this in Operator's Osc A Coarse, OR add a MIDI Pitch effect before Operator set to ${semi} semitones.`,
      settings: `Pitch: ${semi > 0 ? '+' : ''}${semi} semitones`,
    });
  }

  return midiEffects;
}
