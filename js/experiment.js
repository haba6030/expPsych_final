/**
 * Main timeline — 의미 형성 × 작업기억 web experiment.
 *
 * Flow:
 *   1. Welcome / consent
 *   2. Participant ID display
 *   3. Block 1   (math 또는 no-math, 무작위)
 *        a. block intro
 *        b. practice intro → 1 practice trial (dissimilar)
 *        c. main intro → N main trials (Latin-square 4 conditions × repeats)
 *        d. block outro
 *   4. Block 2   (other load)  ← same a–d
 *   5. Survey
 *        a. narrative recognition (4 sets)
 *        b. grouped vs interleaved learnability
 *        c. demographics
 *   6. End screen + data save
 *
 * URL params:
 *   ?pid=…      participant id
 *   ?order=mn   force math-first; ?order=nm  force nomath-first
 *   ?group=1-4  force Latin-square group (condition order within blocks)
 */

// ============================================================================
// 1. CONFIG
// ============================================================================

const CONFIG = {
  FIX_MS:                 500,
  WORD_MS:               1000,
  FILLER_MS:             1500,    // math 또는 blank, 고정
  RECALL_MS:            60000,    // 60 s per recall
  TRIALS_PER_COND_MATH:     2,    // math 블록: 2 × 4 = 8 trials
  TRIALS_PER_COND_NOMATH:   2,    // no-math 블록: 2 × 4 = 8 trials
  SET_SIZE:                 8
};

// ----------------------------------------------------------------------------
// URL params + participant setup
// ----------------------------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const participant_id = urlParams.get('pid') ||
  ('P' + (Math.floor(Math.random() * 9000) + 1000));

function blockOrderFromParams() {
  const p = (urlParams.get('order') || '').toLowerCase();
  if (p === 'mn') return ['math', 'nomath'];
  if (p === 'nm') return ['nomath', 'math'];
  return Math.random() < 0.5 ? ['math', 'nomath'] : ['nomath', 'math'];
}

function latinGroupFromParams() {
  const g = parseInt(urlParams.get('group') || '0', 10);
  if (g >= 1 && g <= 4) return g;
  // Derive from pid digits if possible
  const digits = (participant_id.match(/\d/g) || []).join('');
  if (digits) return ((parseInt(digits, 10) - 1) % 4) + 1;
  return Math.floor(Math.random() * 4) + 1;
}

const BLOCK_ORDER  = blockOrderFromParams();
const LATIN_GROUP  = latinGroupFromParams();
const COND_ORDER   = conditionOrderForGroup(LATIN_GROUP);

const experiment_start_time = Date.now();
const mathUsed = new Set();   // dedupe across the whole session

console.log('Participant:', participant_id,
            'Block order:', BLOCK_ORDER,
            'Latin group:', LATIN_GROUP,
            'Condition order:', COND_ORDER);

// Deployed Google Apps Script Web App endpoint.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNhdCrXs7LFRdPxdWXfKW8FM099ORw21wEiy8WnhU__14q2OuFgZNrF3q-bxIUgMQ9/exec';

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const LOCAL_SAVE_URL = IS_LOCAL ? '/save-data' : '';

// ============================================================================
// 2. JS PSYCH INIT
// ============================================================================

const jsPsych = initJsPsych({
  display_element: 'jspsych-target',
  on_finish: function() {
    saveData();
    document.getElementById('jspsych-target').innerHTML =
      `<div style="max-width:600px;margin:80px auto;text-align:center;line-height:1.8;">
         <h2>실험이 종료되었습니다.</h2>
         <p>참여해 주셔서 감사합니다.</p>
         <p style="color:#666;font-size:14px;">
           데이터가 저장되었습니다. 이 창을 닫으셔도 됩니다.
         </p>
       </div>`;
  }
});

jsPsych.data.addProperties({
  participant_id: participant_id,
  block_order: BLOCK_ORDER.join('>'),
  latin_group: LATIN_GROUP
});

// ============================================================================
// 3. TRIAL FACTORY  (returns a sub-timeline for one encoding+recall trial)
// ============================================================================

/**
 * Build a single trial sub-timeline.
 *
 *   blockTag      : 'math' | 'nomath'
 *   trialIdx      : 1-based index within block
 *   condition     : 'grouped' | 'interleaved' | 'dissimilar' | 'narrative'
 *   isPractice    : boolean
 */
function buildTrial(blockTag, trialIdx, condition, isPractice) {
  const isMath = (blockTag === 'math');
  const wordSpec = buildTrialWords(condition);     // {words, meta}
  const presented = wordSpec.words;
  const mathItems = isMath ? sampleMathForTrial(mathUsed) : [];

  // Capture math responses across the 8 filler steps of this trial.
  const mathResponses = [];

  const sub = [];

  // ---- Fixation (trial 시작 1회만 — 단어 사이에는 fixation 없음) ----
  sub.push({
    type: jsPsychHtmlKeyboardResponse,
    choices: 'NO_KEYS',
    trial_duration: CONFIG.FIX_MS,
    stimulus: '<div class="fixation">+</div>',
    data: {
      task: 'fixation',
      block: blockTag, trial_idx: trialIdx, condition: condition,
      is_practice: !!isPractice
    }
  });

  // ---- 8 × (word + filler) ----
  presented.forEach((word, pos) => {
    sub.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: 'NO_KEYS',
      trial_duration: CONFIG.WORD_MS,
      stimulus: `<div class="word-stim">${word}</div>`,
      data: {
        task: 'word', block: blockTag, trial_idx: trialIdx,
        condition: condition, position: pos + 1, word: word,
        is_practice: !!isPractice
      }
    });

    if (isMath) {
      const m = mathItems[pos];
      sub.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <div class="math-stim">
            ${m.problem} = ${m.displayed}
            <div class="math-keys">F = 거짓 &nbsp;·&nbsp; J = 참</div>
          </div>`,
        choices: ['f', 'j'],
        trial_duration: CONFIG.FILLER_MS,
        response_ends_trial: false,    // 고정 1500 ms
        data: {
          task: 'math', block: blockTag, trial_idx: trialIdx,
          condition: condition, position: pos + 1,
          equation: m.problem, displayed: m.displayed, is_true: m.is_true,
          is_practice: !!isPractice
        },
        on_finish: function(d) {
          const responded = (d.response === 'j' || d.response === 'f');
          const respondedTrue = (d.response === 'j');
          d.response_text = d.response || null;
          d.accurate = responded ? (respondedTrue === d.is_true) : false;
          d.no_response = !responded;
          mathResponses.push({
            position: d.position, equation: d.equation,
            displayed: d.displayed, is_true: d.is_true,
            response: d.response_text, accurate: d.accurate,
            rt: d.rt, no_response: d.no_response
          });
        }
      });
    } else {
      sub.push({
        type: jsPsychHtmlKeyboardResponse,
        choices: 'NO_KEYS',
        trial_duration: CONFIG.FILLER_MS,
        stimulus: '<div class="blank-stim">&nbsp;</div>',
        data: {
          task: 'blank', block: blockTag, trial_idx: trialIdx,
          condition: condition, position: pos + 1,
          is_practice: !!isPractice
        }
      });
    }
  });

  // ---- Recall ----
  sub.push({
    type: jsPsychSurveyText,
    preamble: `
      <div class="recall-card">
        <div class="rp-counter">${isPractice ? '연습' : `${trialIdx} / 본 실험`} ·
          <span class="recall-timer" id="recall-timer">남은 시간 ${CONFIG.RECALL_MS/1000}초</span>
        </div>
        <h3 class="recall-title">단어 회상</h3>
        <p class="recall-instructions">
          방금 본 <b>8개 단어</b>를 <b>제시된 순서대로</b> 띄어쓰기로 구분하여 입력해 주세요.<br>
          기억나지 않는 위치는 <b><code>##</code></b> 으로 표기하세요.
        </p>
        <p class="recall-example">예시: <code>유리 구두 ## 자정 나무 ## 편지 평안</code></p>
      </div>`,
    questions: [{ prompt: '회상 응답:', name: 'recall',
                  required: false, rows: 2, columns: 80, placeholder: '단어1 단어2 단어3 …' }],
    button_label: '제출',
    data: {
      task: isPractice ? 'recall_practice' : 'recall',
      block: blockTag, trial_idx: trialIdx, condition: condition,
      presented: presented.join(' '),
      condition_meta: wordSpec.meta,
      is_practice: !!isPractice
    },
    on_load: function() {
      const el = document.getElementById('recall-timer');
      let left = CONFIG.RECALL_MS / 1000;
      const paint = () => {
        if (!el) return;
        el.textContent = `남은 시간 ${left}초`;
        el.style.color = left <= 10 ? '#c0392b' : '#888';
      };
      paint();
      const t = setInterval(() => {
        left -= 1;
        paint();
        if (left <= 0) {
          clearInterval(t);
          const form = document.querySelector('#jspsych-survey-text-form');
          if (form) {
            if (typeof form.requestSubmit === 'function') form.requestSubmit();
            else form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      }, 1000);
    },
    on_finish: function(d) {
      // jsPsych 의 d.rt 는 '회상 화면이 뜬 순간 → 제출 버튼/시간초과'까지의 ms.
      // 두 블록(math/nomath) 모두 동일 SurveyText 컴포넌트를 쓰므로 RT 가 동일하게 잡힌다.
      d.recall_rt = d.rt;
      const txt = (d.response && d.response.recall) || '';
      d.recall_text = txt;
      const tokens = txt.trim().split(/\s+/).filter(s => s.length > 0);
      // Pad/truncate to 8 positions
      const recalled = [];
      for (let i = 0; i < CONFIG.SET_SIZE; i++) {
        recalled.push((tokens[i] !== undefined) ? tokens[i] : '');
      }
      d.recalled_tokens = recalled;
      d.recalled_str    = recalled.join(' ');

      // Scoring
      const presentedSet = new Set(presented);
      const validRecalls = recalled.filter(w => w && w !== '##');
      let itemCorrect = 0;
      validRecalls.forEach(w => { if (presentedSet.has(w)) itemCorrect++; });
      d.item_score  = itemCorrect / CONFIG.SET_SIZE;
      let orderCorrect = 0;
      for (let i = 0; i < CONFIG.SET_SIZE; i++) {
        if (recalled[i] && recalled[i] !== '##' && recalled[i] === presented[i]) {
          orderCorrect++;
        }
      }
      d.order_score = (validRecalls.length > 0)
        ? (orderCorrect / validRecalls.length) : 0;

      // Math summary for this trial
      d.math_responses     = mathResponses;
      d.math_n             = mathResponses.length;
      d.math_n_accurate    = mathResponses.filter(r => r.accurate).length;
      d.math_accuracy      = (mathResponses.length > 0)
        ? (d.math_n_accurate / mathResponses.length) : null;
      d.math_n_no_response = mathResponses.filter(r => r.no_response).length;
    }
  });

  return sub;
}

// ============================================================================
// 4. BLOCK BUILDER
// ============================================================================

function buildBlock(blockTag, blockIdx) {
  const isMath = (blockTag === 'math');
  const trialsPerCond = isMath
    ? CONFIG.TRIALS_PER_COND_MATH
    : CONFIG.TRIALS_PER_COND_NOMATH;
  const totalTrials = trialsPerCond * COND_ORDER.length;

  const tl = [];

  // --- Block intro ----------------------------------------------------------
  tl.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-card">
        <h2>블록 ${blockIdx} / 2</h2>
        <h3>${isMath ? '수식 + 단어 기억' : '단어 기억 (수식 없음)'}</h3>
        <p>이 블록에서는 단어들 사이에 ${isMath
          ? '<b>간단한 덧셈/뺄셈 검증 문제</b>가 함께 제시됩니다.'
          : '<b>빈 화면</b>이 나타납니다.'}</p>
        <p>각 시행에서 단어 8개를 차례로 보게 되며, 모든 단어가 끝난 후 단어를
           순서대로 회상해 입력합니다.</p>
        ${isMath ? `
        <p>화면에 식과 답이 함께 표시됩니다. 식이 <b>참</b>이면 <b>J</b> 키를,
           <b>거짓</b>이면 <b>F</b> 키를 눌러 주세요.<br>
           응답 여부와 관계없이 1.5초 후 자동으로 다음 단어로 넘어갑니다.</p>` : ''}
        <p>이번 블록은 총 <b>${totalTrials} 시행</b>입니다.</p>
        <p>준비되면 '다음'을 눌러 주세요.</p>
      </div>`,
    choices: ['다음']
  });

  // --- Practice intro -------------------------------------------------------
  tl.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-card">
        <h2>연습</h2>
        <p>먼저 본 실험과 동일한 방식의 <b>연습 시행 2회</b>를 진행합니다.</p>
        <p>시행이 끝나면 단어 회상 화면이 나타납니다. 8개 단어를
           <b>제시 순서대로</b> 띄어쓰기로 구분해 입력하세요. 기억나지 않는
           위치는 <b><code>##</code></b> 으로 표기합니다.</p>
        ${isMath ? `
        <p>수식 화면에서는 <b>J = 참 / F = 거짓</b> 키로 빠르게 응답해 주세요.
           응답 여부와 관계없이 1.5초 후 다음 단어로 넘어갑니다.</p>` : ''}
        <p>준비되면 '연습 시작'을 눌러 주세요.</p>
      </div>`,
    choices: ['연습 시작']
  });

  // --- Practice trials (2 — 무관 + 묶음) -----------------------------------
  // 연습 1: dissimilar — 가장 표준적인 8 단어 회상 흐름.
  // 연습 2: grouped — 같은 의미 범주 4 + 4 가 들어오는 구조를 미리 한 번 경험.
  tl.push(...buildTrial(blockTag, 0, 'dissimilar', true));
  tl.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-card centered">
        <h3>연습 1 완료</h3>
        <p>한 번 더 연습합니다. 준비되면 '다음 연습'을 눌러 주세요.</p>
      </div>`,
    choices: ['다음 연습']
  });
  tl.push(...buildTrial(blockTag, 0, 'grouped', true));

  // --- Main intro -----------------------------------------------------------
  tl.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-card">
        <h2>본 실험</h2>
        <p>연습이 끝났습니다. 이제 본 실험을 시작합니다.</p>
        <p>총 <b>${totalTrials} 시행</b>이며, 각 시행 사이에는 짧은 고정점(+)
           이후 자동으로 다음 단어가 제시됩니다.</p>
        <p>준비되면 '본 실험 시작'을 눌러 주세요.</p>
      </div>`,
    choices: ['본 실험 시작']
  });

  // --- Main trials ---------------------------------------------------------
  // For each repeat, walk COND_ORDER in fixed order (abcd, bcda, …).
  let trialIdx = 0;
  for (let rep = 0; rep < trialsPerCond; rep++) {
    COND_ORDER.forEach(cond => {
      trialIdx += 1;
      tl.push(...buildTrial(blockTag, trialIdx, cond, false));
    });
  }

  // --- Block outro ---------------------------------------------------------
  tl.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-card">
        <h2>블록 ${blockIdx} 종료</h2>
        <p>잠시 쉬어 주세요. 준비되면 '다음 단계로'를 눌러 ${
          blockIdx === 1 ? '두 번째 블록' : '마무리 설문'}을 시작합니다.</p>
      </div>`,
    choices: ['다음 단계로']
  });

  return tl;
}

// ============================================================================
// 5. TIMELINE
// ============================================================================

const timeline = [];

// ---- Welcome / consent -----------------------------------------------------
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-card">
      <h1>단어 기억 실험</h1>
      <p>안녕하세요. 본 실험은 <b>단어 학습과 기억에 대한 인지 연구</b>입니다.
         전체 소요 시간은 약 <b>25–30분</b>입니다.</p>
      <p>다음 순서로 진행됩니다.</p>
      <ol>
        <li>안내</li>
        <li>블록 1 (안내 → 연습 → 본 실험)</li>
        <li>블록 2 (안내 → 연습 → 본 실험)</li>
        <li>사후 설문</li>
      </ol>
      <p>모든 응답은 익명 처리되며 학술 연구 목적 외에는 사용되지 않습니다.
         참여에 동의하시면 '시작' 버튼을 눌러 주세요.</p>
    </div>`,
  choices: ['시작']
});

// ---- Participant ID --------------------------------------------------------
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-card centered">
      <h2>참가자 ID</h2>
      <p>아래 ID가 자동으로 부여되었습니다. 진행자에게 필요 시 알려주세요.</p>
      <p class="participant-id">${participant_id}</p>
      <p style="color:#666;font-size:14px;">
        블록 순서: ${BLOCK_ORDER.join(' → ')}<br>
        조건 순서 그룹: ${LATIN_GROUP}
      </p>
      <p>준비되면 '다음'을 눌러 주세요.</p>
    </div>`,
  choices: ['다음']
});

// ---- Block 1, Block 2 ------------------------------------------------------
timeline.push(...buildBlock(BLOCK_ORDER[0], 1));
timeline.push(...buildBlock(BLOCK_ORDER[1], 2));

// ============================================================================
// 6. SURVEY
// ============================================================================

const likert7 = ['1\n전혀\n그렇지 않다', '2', '3', '4\n보통', '5', '6', '7\n매우\n그렇다'];

// 6a. Narrative awareness — one screen per narrative set
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-card">
      <h2>사후 설문 (1/3)</h2>
      <p>이제 실험에서 본 단어들 가운데 일부를 다시 보여 드립니다.</p>
      <p>각 단어 묶음에 대해 두 가지 질문에 답해 주세요.</p>
      <p>준비되면 '다음'을 눌러 주세요.</p>
    </div>`,
  choices: ['다음']
});

NARRATIVE_SETS.forEach((nset, idx) => {
  timeline.push({
    type: jsPsychSurveyLikert,
    preamble: `
      <div class="screen-card">
        <h3>단어 묶음 ${idx + 1} / ${NARRATIVE_SETS.length}</h3>
        <p class="narrative-words">${nset.words.join(' &nbsp; · &nbsp; ')}</p>
      </div>`,
    questions: [{
      prompt: '이 단어들이 어떤 이야기(동화/우화 등)와 관련 있다고 느끼셨습니까?',
      labels: likert7, required: true, name: 'narrative_rating'
    }],
    button_label: '다음',
    data: {
      task: 'survey_narrative_likert',
      narrative_set_id: nset.id,
      narrative_label: nset.label
    },
    on_finish: function(d) {
      d.rating = (d.response && d.response.narrative_rating);
    }
  });

  timeline.push({
    type: jsPsychSurveyText,
    preamble: `
      <div class="screen-card">
        <h3>단어 묶음 ${idx + 1} / ${NARRATIVE_SETS.length}</h3>
        <p class="narrative-words">${nset.words.join(' &nbsp; · &nbsp; ')}</p>
      </div>`,
    questions: [{
      prompt: '어떤 이야기였는지 자유롭게 적어 주세요. (생각나지 않으면 빈칸 가능)',
      name: 'narrative_guess', rows: 2, columns: 60, required: false
    }],
    button_label: '다음',
    data: {
      task: 'survey_narrative_freetext',
      narrative_set_id: nset.id,
      narrative_label: nset.label
    },
    on_finish: function(d) {
      d.guess_text = (d.response && d.response.narrative_guess) || '';
    }
  });
});

// 6b. grouped vs interleaved learnability
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-card">
      <h2>사후 설문 (2/3)</h2>
      <p>실험에서 같은 의미 범주(예: 과일, 악기)의 단어가 함께 등장하는 시행을
         보았습니다.</p>
      <p>두 가지 제시 방식에 대해 떠올려 주세요.</p>
      <ul>
        <li><b>묶음 제시</b>: 같은 의미 범주의 단어 4개가 연달아 (예: 사과–배–멜론–자두 → 피아노–기타–바이올린–플루트)</li>
        <li><b>번갈아 제시</b>: 두 범주의 단어가 번갈아 (예: 사과–피아노–배–기타–멜론–바이올린–자두–플루트)</li>
      </ul>
      <p>준비되면 '다음'을 눌러 주세요.</p>
    </div>`,
  choices: ['다음']
});

timeline.push({
  type: jsPsychSurveyLikert,
  preamble: `<div class="screen-card"><h3>학습 용이성</h3></div>`,
  questions: [
    { prompt: '같은 의미 범주 단어를 <b>연달아 묶어</b> 제시한 시행은 외우기 쉬웠다.',
      labels: likert7, required: true, name: 'grouped_easy' },
    { prompt: '같은 의미 범주 단어를 <b>번갈아</b> 제시한 시행은 외우기 쉬웠다.',
      labels: likert7, required: true, name: 'interleaved_easy' }
  ],
  randomize_question_order: false,
  button_label: '다음',
  data: { task: 'survey_structure_likert' },
  on_finish: function(d) {
    const r = d.response || {};
    d.grouped_easy     = r.grouped_easy;
    d.interleaved_easy = r.interleaved_easy;
  }
});

timeline.push({
  type: jsPsychSurveyMultiChoice,
  preamble: `<div class="screen-card"><h3>비교</h3></div>`,
  questions: [{
    prompt: '두 방식 중 어느 쪽이 더 외우기 쉬웠습니까?',
    options: ['묶음 제시가 더 쉬웠다',
              '번갈아 제시가 더 쉬웠다',
              '두 방식이 비슷했다'],
    required: true,
    name: 'structure_choice'
  }],
  button_label: '다음',
  data: { task: 'survey_structure_choice' },
  on_finish: function(d) {
    d.structure_choice = (d.response && d.response.structure_choice);
  }
});

// 6c. Demographics
timeline.push({
  type: jsPsychSurveyText,
  preamble: `<div class="screen-card"><h2>사후 설문 (3/3)</h2><p>마지막 질문입니다.</p></div>`,
  questions: [
    { prompt: '연령(만 나이):', name: 'age', columns: 8 },
    { prompt: '성별 (남/여/기타/응답거부):', name: 'gender', columns: 12 },
    { prompt: '소속/학년:', name: 'affiliation', columns: 25 },
    { prompt: '본 실험의 목적이 무엇이라고 생각하셨습니까?', name: 'guess_purpose', rows: 3, columns: 60 }
  ],
  button_label: '제출',
  data: { task: 'survey_demographics' }
});

// ============================================================================
// 7. DATA SAVE
// ============================================================================

function saveData() {
  const all = jsPsych.data.get().values();

  const payload = {
    dataType: 'complete',
    participant_id: participant_id,
    block_order: BLOCK_ORDER.join('>'),
    latin_group: LATIN_GROUP,
    condition_order: COND_ORDER.join('>'),
    timestamp: new Date().toISOString(),
    total_duration_ms: Date.now() - experiment_start_time,
    user_agent: navigator.userAgent,
    screen_w: window.screen.width,
    screen_h: window.screen.height,
    all_trials: all
  };

  // 1) Local server fallback
  if (LOCAL_SAVE_URL) {
    fetch(LOCAL_SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id, data: payload,
        condition: BLOCK_ORDER[0] + '_first'
      })
    }).then(r => r.json())
      .then(j => console.log('Local save:', j))
      .catch(e => console.warn('Local save failed:', e));
  }

  // 2) Google Apps Script (production)
  if (GOOGLE_SCRIPT_URL) {
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(() => console.log('GAS save dispatched.'))
      .catch(e => console.warn('GAS save failed:', e));
  }

  // 3) Local download fallback
  const blob = new Blob([JSON.stringify(payload, null, 2)],
                       { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `expPsychFinal_${participant_id}_${Date.now()}.json`;
  a.click();
}

// ============================================================================
// 8. RUN
// ============================================================================

jsPsych.run(timeline);
