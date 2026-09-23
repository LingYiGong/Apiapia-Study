/**
 * =========================================================================
 * 1. 基础乐理常识与十二平均律频率映射 (Pitch & 12-TET Definitions)
 * =========================================================================
 */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SOLFEGE_MAP = {
  "C": "Do", "C#": "Di", "D": "Re", "D#": "Ri", "E": "Mi", "F": "Fa",
  "F#": "Fi", "G": "Sol", "G#": "Si", "A": "La", "A#": "Li", "B": "Ti"
};

function frequencyToNote(freq) {
  if (!freq || freq <= 0 || isNaN(freq)) return null;
  const midiFloat = 69 + 12 * Math.log2(freq / 440);
  const midiRound = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midiRound) * 100);
  const noteIndex = ((midiRound % 12) + 12) % 12;
  const octave = Math.floor(midiRound / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const standardFreq = 440 * Math.pow(2, (midiRound - 69) / 12);

  return {
    midi: midiRound,
    noteName: noteName,
    octave: octave,
    fullName: `${noteName}${octave}`,
    solfege: SOLFEGE_MAP[noteName] || "",
    cents: cents,
    standardFreq: standardFreq.toFixed(1),
    actualFreq: freq.toFixed(1)
  };
}

/**
 * =========================================================================
 * 2. 钢琴视奏出题题库 (Sight-Reading Note Pools)
 * =========================================================================
 */
const TREBLE_EASY = [
  { name: "C", octave: 4 }, // 中央 C (下加一线)
  { name: "D", octave: 4 }, // 下加一间
  { name: "E", octave: 4 }, // 第一线
  { name: "F", octave: 4 }, // 第一间
  { name: "G", octave: 4 }, // 第二线
  { name: "A", octave: 4 }, // 第二间
  { name: "B", octave: 4 }, // 第三线
  { name: "C", octave: 5 }, // 第三间
  { name: "D", octave: 5 }, // 第四线
  { name: "E", octave: 5 }  // 第四间
];

const TREBLE_MEDIUM = [
  ...TREBLE_EASY,
  { name: "A", octave: 3 }, // 下加二间
  { name: "B", octave: 3 }, // 下加二线
  { name: "F", octave: 5 }, // 第五线
  { name: "G", octave: 5 }, // 上加一间
  { name: "A", octave: 5 }  // 上加一线
];

const BASS_EASY = [
  { name: "C", octave: 3 }, // 第二间
  { name: "D", octave: 3 }, // 第三线
  { name: "E", octave: 3 }, // 第三间
  { name: "F", octave: 3 }, // 第四线
  { name: "G", octave: 3 }, // 第四间
  { name: "A", octave: 3 }, // 第五线
  { name: "B", octave: 3 }, // 上加一间
  { name: "C", octave: 4 }  // 中央 C (上加一线)
];

const BASS_MEDIUM = [
  ...BASS_EASY,
  { name: "F", octave: 2 }, // 下加二间
  { name: "G", octave: 2 }, // 第一线
  { name: "A", octave: 2 }, // 第一间
  { name: "B", octave: 2 }, // 第二线
  { name: "D", octave: 4 }  // 上加一间
];

/**
 * =========================================================================
 * 3. 音频处理与高精度自相关算法 (Normalized Square Difference - MPM)
 * =========================================================================
 */
let audioContext = null;
let analyserNode = null;
let micGainNode = null;     // 前置软件增益放大节点 (解决 iPad 麦克风收音微弱问题)
let micStream = null;
let audioDataBuffer = null;
let isListening = false;
let animationFrameId = null;

function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;

  // 1. 计算均方根振幅 (RMS) 作为静音门限
  let sumSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / SIZE);

  // 门限定为 0.003，轻柔弱奏 (Pianissimo) 也能灵敏捕获
  if (rms < 0.003) {
    return { freq: -1, rms: rms };
  }

  // 钢琴视奏主要针对 65Hz (C2) ~ 2100Hz (C7) 范围
  const minFreq = 65;
  const maxFreq = 2100;
  const maxPeriod = Math.min(Math.floor(sampleRate / minFreq), Math.floor(SIZE / 2));
  const minPeriod = Math.floor(sampleRate / maxFreq);

  // 2. 计算归一化自相关系数 (NSDF)
  const nsdf = new Float32Array(maxPeriod + 1);
  for (let tau = 0; tau <= maxPeriod; tau++) {
    let acf = 0;
    let divisor = 0;
    for (let i = 0; i < SIZE - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisor += (buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau]);
    }
    nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
  }

  // 3. 寻找所有正向局部极大值 (峰值)
  const peaks = [];
  for (let tau = Math.max(1, minPeriod); tau < maxPeriod; tau++) {
    if (nsdf[tau] > 0 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) {
      peaks.push({ tau: tau, val: nsdf[tau] });
    }
  }

  if (peaks.length === 0) {
    return { freq: -1, rms: rms };
  }

  // 找到全局最高峰
  let highestPeak = peaks[0];
  for (let i = 1; i < peaks.length; i++) {
    if (peaks[i].val > highestPeak.val) {
      highestPeak = peaks[i];
    }
  }

  // 降低置信度阈值至 0.25，真实钢琴轻弹时谐波分散也能稳定识别
  if (highestPeak.val < 0.25) {
    return { freq: -1, rms: rms };
  }

  // 智能基频周期决策：检查是否存在约 2 倍周期的真正基频峰
  // 避免击弦瞬间强 2 次泛音将 C4 误判为高八度的 C5
  let chosenPeak = highestPeak;
  for (let i = 0; i < peaks.length; i++) {
    const p1 = peaks[i];
    if (p1.val >= highestPeak.val * 0.70) {
      chosenPeak = p1;
      const doubleTau = p1.tau * 2;
      if (doubleTau <= maxPeriod) {
        const subPeak = peaks.find(p => Math.abs(p.tau - doubleTau) <= Math.max(3, p1.tau * 0.08));
        if (subPeak && subPeak.val >= 0.25 && subPeak.val >= p1.val * 0.40) {
          chosenPeak = subPeak; // 锁定真实基频周期
        }
      }
      break;
    }
  }

  // 4. 抛物线顶点插值修正 (Parabolic Peak Interpolation)
  let fineLag = chosenPeak.tau;
  if (chosenPeak.tau > 0 && chosenPeak.tau < maxPeriod) {
    const y0 = nsdf[chosenPeak.tau - 1];
    const y1 = nsdf[chosenPeak.tau];
    const y2 = nsdf[chosenPeak.tau + 1];
    const denom = 2 * (2 * y1 - y0 - y2);
    if (denom !== 0) {
      const delta = (y2 - y0) / denom;
      if (Math.abs(delta) < 1) {
        fineLag += delta;
      }
    }
  }

  const freq = sampleRate / fineLag;
  return { freq: freq, rms: rms, confidence: chosenPeak.val };
}

/**
 * =========================================================================
 * 4. 应用状态管理与游戏视奏逻辑 (App State & Logic)
 * =========================================================================
 */
const state = {
  clef: "treble",       // 'treble' | 'bass'
  range: "easy",        // 'easy' | 'medium' | 'accidentals'
  tolerance: 35,        // 允许音分容差 (±35 cents，适配真实钢琴拉伸律)
  micGain: 5.0,         // 前置软件增益放大倍数 (默认 5x，专门增强 iPad 收音)
  currentNote: null,    // 当前目标题目音符
  consecutiveMatches: 0,// 连续命中帧计数器
  MATCH_REQUIRED_FRAMES: 2, // 连续匹配 2 帧 (~40ms) 判定为有效弹奏
  isAdvancing: false,   // 是否正在切换题目
  totalCorrect: 0,      // 答对总题数
  currentStreak: 0      // 连击次数
};

// DOM 元素缓存
const dom = {
  btnToggleMic: document.getElementById("btn-toggle-mic"),
  btnText: document.getElementById("btn-text"),
  clefSelect: document.getElementById("clef-select"),
  rangeSelect: document.getElementById("range-select"),
  toleranceSelect: document.getElementById("tolerance-select"),
  gainSelect: document.getElementById("gain-select"),
  staffOutput: document.getElementById("staff-output"),
  staffCard: document.getElementById("staff-card"),
  targetNoteName: document.getElementById("target-note-name"),
  targetNoteSolfege: document.getElementById("target-note-solfege"),
  successToast: document.getElementById("success-toast"),
  btnPlayTarget: document.getElementById("btn-play-target"),
  btnSkipTarget: document.getElementById("btn-skip-target"),
  btnHeaderPlay: document.getElementById("btn-header-play"),
  btnHeaderSkip: document.getElementById("btn-header-skip"),
  micStatusTag: document.getElementById("mic-status-tag"),
  detectedNoteText: document.getElementById("detected-note-text"),
  detectedFreqText: document.getElementById("detected-freq-text"),
  micVolumeBar: document.getElementById("mic-volume-bar"),
  centsText: document.getElementById("cents-text"),
  tunerPointer: document.getElementById("tuner-pointer"),
  hdrTarget: document.getElementById("hdr-target"),
  hdrMicStatus: document.getElementById("hdr-mic-status"),
  hdrCorrect: document.getElementById("hdr-correct"),
  hdrStreak: document.getElementById("hdr-streak")
};

function pickNextNote() {
  let pool = [];
  if (state.clef === "treble") {
    pool = (state.range === "easy") ? TREBLE_EASY : TREBLE_MEDIUM;
  } else {
    pool = (state.range === "easy") ? BASS_EASY : BASS_MEDIUM;
  }

  let next = null;
  do {
    const idx = Math.floor(Math.random() * pool.length);
    next = { ...pool[idx] };
  } while (pool.length > 1 && state.currentNote && 
           state.currentNote.name === next.name && 
           state.currentNote.octave === next.octave);

  if (state.range === "accidentals") {
    const addAccidental = Math.random() < 0.35;
    if (addAccidental && ["C", "D", "F", "G", "A"].includes(next.name)) {
      next.accidental = "#";
    }
  }

  next.fullName = `${next.name}${next.accidental || ""}${next.octave}`;
  next.baseName = `${next.name}${next.accidental || ""}`;
  next.solfege = SOLFEGE_MAP[next.baseName] || SOLFEGE_MAP[next.name];

  state.currentNote = next;
  state.consecutiveMatches = 0;
  updateTargetDisplay();
  renderStaff(false);
}

function updateTargetDisplay() {
  if (!state.currentNote) return;
  dom.targetNoteName.textContent = state.currentNote.fullName;
  dom.targetNoteSolfege.textContent = `(${state.currentNote.solfege})`;
  dom.hdrTarget.textContent = `${state.currentNote.fullName} (${state.currentNote.solfege})`;
}

/**
 * =========================================================================
 * 5. 五线谱渲染模块 (超大儿童友好设计：优先 VexFlow + 高度保真原生矢量 SVG)
 * =========================================================================
 */
function renderStaff(isCorrect = false) {
  if (!state.currentNote) return;
  const container = dom.staffOutput;
  container.innerHTML = "";

  const rendered = renderWithVexFlow(container, state.currentNote, state.clef, isCorrect);
  if (!rendered) {
    renderWithNativeSVG(container, state.currentNote, state.clef, isCorrect);
  }
}

function renderWithVexFlow(container, noteInfo, clef, isCorrect) {
  try {
    const VF = window.Vex && (window.Vex.Flow || window.Vex);
    if (!VF || !VF.Renderer || !VF.Stave || !VF.StaveNote) {
      return false;
    }

    const width = Math.min(window.innerWidth - 36, 560);
    const height = 230;

    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont("Arial", 11, "").setBackgroundFillStyle("#eed");

    // 核心：放大 1.35 倍矢量等比渲染，专为儿童视奏加粗加大
    const scale = 1.35;
    context.scale(scale, scale);

    const staveWidth = Math.min(Math.floor((width - 24) / scale), 360);
    const staveX = Math.floor(((width / scale) - staveWidth) / 2);
    const staveY = 22;

    const stave = new VF.Stave(staveX, staveY, staveWidth);
    stave.addClef(clef);
    stave.setContext(context).draw();

    const acc = noteInfo.accidental || "";
    const vexKey = `${noteInfo.name.toLowerCase()}${acc}/${noteInfo.octave}`;

    const staveNote = new VF.StaveNote({
      clef: clef,
      keys: [vexKey],
      duration: "w"
    });

    if (acc) {
      staveNote.addAccidental(0, new VF.Accidental(acc));
    }

    const noteColor = isCorrect ? "#10b981" : "#0f172a";
    staveNote.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });

    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables([staveNote]);

    new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 110);
    voice.draw(context, stave);

    return true;
  } catch (err) {
    console.warn("VexFlow 渲染捕获异常，启用内置 SVG 引擎:", err);
    return false;
  }
}

function renderWithNativeSVG(container, noteInfo, clef, isCorrect) {
  const width = Math.min(window.innerWidth - 36, 540);
  const height = 230;
  const staffLineSpacing = 21; // 放大至 21px 间距，小朋友容易辨识
  const topStaffLineY = 74;
  const staffWidth = width - 60;
  const startX = 30;

  const stepIndexMap = { "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6 };
  const noteStep = stepIndexMap[noteInfo.name] + (noteInfo.octave - 4) * 7;

  let refStep = (clef === "treble") ? 2 : -11;
  let refY = topStaffLineY + 4 * staffLineSpacing;

  const noteY = refY - (noteStep - refStep) * (staffLineSpacing / 2);
  const noteX = startX + staffWidth * 0.58;
  const noteColor = isCorrect ? "#10b981" : "#1e293b";

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  // 绘制五条加粗基准线 (粗度 2.6px)
  for (let i = 0; i < 5; i++) {
    const y = topStaffLineY + i * staffLineSpacing;
    svg += `<line x1="${startX}" y1="${y}" x2="${startX + staffWidth}" y2="${y}" stroke="#1e293b" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  svg += `<line x1="${startX}" y1="${topStaffLineY}" x2="${startX}" y2="${topStaffLineY + 4 * staffLineSpacing}" stroke="#1e293b" stroke-width="3"/>`;
  svg += `<line x1="${startX + staffWidth}" y1="${topStaffLineY}" x2="${startX + staffWidth}" y2="${topStaffLineY + 4 * staffLineSpacing}" stroke="#1e293b" stroke-width="3"/>`;

  // 大号儿童矢量谱号
  if (clef === "treble") {
    svg += `<text x="${startX + 14}" y="${topStaffLineY + 3.85 * staffLineSpacing}" font-size="76" font-family="serif" fill="#1e293b" font-weight="bold" user-select="none">𝄞</text>`;
  } else {
    svg += `<text x="${startX + 14}" y="${topStaffLineY + 2.85 * staffLineSpacing}" font-size="64" font-family="serif" fill="#1e293b" font-weight="bold" user-select="none">𝄢</text>`;
  }

  // 上加线 / 下加线
  const bottomStaffLineY = topStaffLineY + 4 * staffLineSpacing;
  if (noteY >= bottomStaffLineY + staffLineSpacing) {
    for (let ly = bottomStaffLineY + staffLineSpacing; ly <= noteY + 2; ly += staffLineSpacing) {
      svg += `<line x1="${noteX - 24}" y1="${ly}" x2="${noteX + 24}" y2="${ly}" stroke="#1e293b" stroke-width="2.6"/>`;
    }
  }
  if (noteY <= topStaffLineY - staffLineSpacing) {
    for (let ly = topStaffLineY - staffLineSpacing; ly >= noteY - 2; ly -= staffLineSpacing) {
      svg += `<line x1="${noteX - 24}" y1="${ly}" x2="${noteX + 24}" y2="${ly}" stroke="#1e293b" stroke-width="2.6"/>`;
    }
  }

  // 大号升降号
  if (noteInfo.accidental === "#") {
    svg += `<text x="${noteX - 32}" y="${noteY + 10}" font-size="32" font-weight="900" fill="${noteColor}">♯</text>`;
  }

  // 超大儿童全音符符头 (rx=15.5, ry=10.5, 粗度 4.5px)
  svg += `<ellipse cx="${noteX}" cy="${noteY}" rx="15.5" ry="10.5" transform="rotate(-22 ${noteX} ${noteY})" fill="none" stroke="${noteColor}" stroke-width="4.5" />`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

/**
 * =========================================================================
 * 6. Web Audio 麦克风录音控制 (iOS Safari 关键适配)
 * =========================================================================
 */
async function startListening() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true, // 开启硬件前级放大
        channelCount: 1
      }
    };

    micStream = await navigator.mediaDevices.getUserMedia(constraints);
    const sourceNode = audioContext.createMediaStreamSource(micStream);

    // 前置软件增益放大器 (GainNode)，默认 5 倍增益
    micGainNode = audioContext.createGain();
    micGainNode.gain.setValueAtTime(state.micGain, audioContext.currentTime);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;

    sourceNode.connect(micGainNode);
    micGainNode.connect(analyserNode);

    audioDataBuffer = new Float32Array(analyserNode.fftSize);
    isListening = true;

    dom.btnToggleMic.className = "w-full py-4 text-white font-black text-base sm:text-lg rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 kid-btn-success";
    dom.btnText.textContent = "麦克风正在收音中 · 请在钢琴上弹奏...";
    dom.micStatusTag.textContent = "● 麦克风收音中";
    dom.micStatusTag.className = "text-emerald-500 font-bold";
    dom.hdrMicStatus.textContent = "收音中";
    dom.hdrMicStatus.className = "text-emerald-300 font-black ml-1 text-sm";

    processAudioLoop();

  } catch (err) {
    console.error("麦克风启动受阻:", err);
    if (window.kidToast) {
      window.kidToast("无法访问麦克风，请在浏览器权限提示中点击【允许】", "error");
    } else {
      alert("无法访问麦克风。请确保当前在 HTTPS 或 localhost 环境下，并允许麦克风权限。");
    }
  }
}

function stopListening() {
  isListening = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (micGainNode) {
    try { micGainNode.disconnect(); } catch (e) {}
    micGainNode = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  dom.btnToggleMic.className = "w-full py-4 text-white font-black text-base sm:text-lg rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 kid-btn-primary";
  dom.btnText.textContent = "点击开始练习（开启麦克风）";
  dom.micStatusTag.textContent = "● 麦克风已暂停";
  dom.micStatusTag.className = "text-amber-500 font-bold";
  dom.hdrMicStatus.textContent = "已暂停";
  dom.hdrMicStatus.className = "text-amber-200 font-black ml-1 text-sm";
  dom.micVolumeBar.style.width = "0%";
  dom.detectedNoteText.textContent = "--";
  dom.detectedFreqText.textContent = "0.0 Hz";
  dom.tunerPointer.style.left = "50%";
  dom.centsText.textContent = "0 ¢";
}

function processAudioLoop() {
  if (!isListening || !analyserNode) return;

  analyserNode.getFloatTimeDomainData(audioDataBuffer);
  const sampleRate = audioContext.sampleRate;

  const result = autoCorrelate(audioDataBuffer, sampleRate);

  const volumePercent = Math.min(100, Math.round(result.rms * 240));
  dom.micVolumeBar.style.width = `${volumePercent}%`;

  if (result.rms >= 0.008) {
    dom.micStatusTag.textContent = "● 麦克风已接收琴声";
    dom.micStatusTag.className = "text-emerald-500 font-bold";
  } else {
    dom.micStatusTag.textContent = "● 麦克风监听中...";
    dom.micStatusTag.className = "text-sky-500 font-bold";
  }

  if (result.freq > 0 && result.rms >= 0.003) {
    const detected = frequencyToNote(result.freq);
    if (detected) {
      handleDetectedNote(detected);
    }
  } else {
    if (state.consecutiveMatches > 0) {
      state.consecutiveMatches--;
    }
  }

  animationFrameId = requestAnimationFrame(processAudioLoop);
}

function handleDetectedNote(detected) {
  dom.detectedNoteText.textContent = detected.fullName;
  dom.detectedFreqText.textContent = `${detected.actualFreq} Hz (${detected.solfege})`;
  dom.centsText.textContent = `${detected.cents > 0 ? "+" : ""}${detected.cents} ¢`;

  const clampedCents = Math.max(-50, Math.min(50, detected.cents));
  const pointerPos = 50 + (clampedCents / 50) * 45;
  dom.tunerPointer.style.left = `${pointerPos}%`;

  if (state.isAdvancing || !state.currentNote) return;

  const targetBaseName = state.currentNote.baseName || state.currentNote.name;
  const isNameMatch = (detected.noteName === targetBaseName);
  const isOctaveExact = (detected.octave === state.currentNote.octave);
  const isOctaveHarmonic = (Math.abs(detected.octave - state.currentNote.octave) === 1);
  const isOctaveMatch = isOctaveExact || isOctaveHarmonic;
  const isPitchAccurate = Math.abs(detected.cents) <= state.tolerance;

  if (isNameMatch && isOctaveMatch && isPitchAccurate) {
    state.consecutiveMatches++;
    dom.detectedNoteText.className = "text-3xl font-black text-emerald-500";

    if (state.consecutiveMatches >= state.MATCH_REQUIRED_FRAMES) {
      triggerSuccess();
    }
  } else {
    dom.detectedNoteText.className = "text-3xl font-black text-slate-800";
    if (state.consecutiveMatches > 0) {
      state.consecutiveMatches--;
    }
  }
}

function triggerSuccess() {
  state.isAdvancing = true;
  state.totalCorrect++;
  state.currentStreak++;

  dom.hdrCorrect.textContent = state.totalCorrect;
  dom.hdrStreak.textContent = state.currentStreak;

  try {
    const saved = JSON.parse(localStorage.getItem('piano_app_stats') || '{}');
    const maxStreak = Math.max(saved.maxStreak || 0, state.currentStreak);
    localStorage.setItem('piano_app_stats', JSON.stringify({
      totalCorrect: state.totalCorrect,
      maxStreak: maxStreak,
      lastUpdated: Date.now()
    }));
  } catch (e) {}

  playSuccessChime();

  renderStaff(true);
  dom.staffCard.classList.add("success-flash");
  dom.successToast.classList.add("show");

  setTimeout(() => {
    dom.staffCard.classList.remove("success-flash");
    dom.successToast.classList.remove("show");
    dom.detectedNoteText.className = "text-3xl font-black text-slate-800";
    state.isAdvancing = false;
    pickNextNote();
  }, 650);
}

/**
 * =========================================================================
 * 7. 真实声学钢琴发音引擎 (Realistic Acoustic Piano Synthesizer)
 * =========================================================================
 */
function playPianoSound(freq, duration = 1.4) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!audioContext) audioContext = new AudioCtx();
  if (audioContext.state === "suspended") audioContext.resume();

  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0.85, now);
  masterGain.connect(audioContext.destination);

  const harmonics = [
    { mult: 1.0,  amp: 0.58, decayRate: 1.0 },
    { mult: 2.0,  amp: 0.28, decayRate: 0.65 },
    { mult: 3.0,  amp: 0.14, decayRate: 0.42 },
    { mult: 4.0,  amp: 0.07, decayRate: 0.26 }
  ];

  const detunes = [-0.65, 0.55];

  detunes.forEach(detuneCents => {
    harmonics.forEach(h => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";
      const partialFreq = freq * h.mult + (detuneCents * 0.12 * h.mult);
      osc.frequency.setValueAtTime(partialFreq, now);

      const peakAmp = (h.amp / detunes.length);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakAmp, now + 0.0025);

      const partialDuration = duration * h.decayRate;
      gain.gain.exponentialRampToValueAtTime(peakAmp * 0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partialDuration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + partialDuration);
    });
  });

  // 琴槌击弦木质打击瞬态
  try {
    const bufferSize = Math.floor(audioContext.sampleRate * 0.025);
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(Math.min(freq * 2.2, 1300), now);
    filter.Q.setValueAtTime(2.8, now);

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.20, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start(now);
    noise.stop(now + 0.025);
  } catch (e) {}
}

function playSuccessChime() {
  try {
    playPianoSound(523.25, 0.7); // C5 钢琴音
    setTimeout(() => playPianoSound(783.99, 0.9), 110); // G5 钢琴音
  } catch (e) {}
}

function playTargetNoteSound() {
  if (!state.currentNote) return;
  const noteNameWithAcc = state.currentNote.name + (state.currentNote.accidental || "");
  const noteIdx = NOTE_NAMES.indexOf(noteNameWithAcc);
  const midi = (state.currentNote.octave + 1) * 12 + noteIdx;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  playPianoSound(freq, 1.4);
}

/**
 * =========================================================================
 * 8. 交互事件绑定与初始化
 * =========================================================================
 */
dom.btnToggleMic.addEventListener("click", () => {
  if (!isListening) {
    startListening();
  } else {
    stopListening();
  }
});

dom.clefSelect.addEventListener("change", (e) => {
  state.clef = e.target.value;
  pickNextNote();
});

dom.rangeSelect.addEventListener("change", (e) => {
  state.range = e.target.value;
  pickNextNote();
});

dom.toleranceSelect.addEventListener("change", (e) => {
  state.tolerance = parseInt(e.target.value, 10);
});

dom.gainSelect.addEventListener("change", (e) => {
  state.micGain = parseFloat(e.target.value);
  if (micGainNode && audioContext) {
    micGainNode.gain.setValueAtTime(state.micGain, audioContext.currentTime);
  }
});

dom.btnPlayTarget.addEventListener("click", playTargetNoteSound);
dom.btnHeaderPlay.addEventListener("click", playTargetNoteSound);

dom.btnSkipTarget.addEventListener("click", () => {
  state.currentStreak = 0;
  dom.hdrStreak.textContent = 0;
  pickNextNote();
});
dom.btnHeaderSkip.addEventListener("click", () => {
  state.currentStreak = 0;
  dom.hdrStreak.textContent = 0;
  pickNextNote();
});

window.addEventListener("resize", () => {
  renderStaff(false);
});

try {
  const saved = JSON.parse(localStorage.getItem('piano_app_stats') || '{}');
  if (saved && saved.totalCorrect) {
    state.totalCorrect = saved.totalCorrect;
    dom.hdrCorrect.textContent = state.totalCorrect;
  }
} catch (e) {}

pickNextNote();
