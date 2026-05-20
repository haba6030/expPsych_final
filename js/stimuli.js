/**
 * Stimuli for the working-memory × semantic-structure × processing-load experiment.
 *
 *   SEMANTIC_CATEGORIES : 16 thematic 4-word sets (used by grouped / interleaved / dissimilar)
 *   NARRATIVE_SETS      : 4 fairytale-style 4-word sets (narrative condition)
 *   MATH_POOL           : 80 single-digit ± verification equations (math filler, math_pool.js)
 *
 * Trial-builder utilities expose `generateTrialWords()` and `sampleMathForTrial()`.
 *
 * NOTE: 자극 풀은 아직 완성 전이다. 현재 16 + 4 세트로 grouped/interleaved 트라이얼이
 *       범주 재사용 없이 만들 수 있는 조합은 ~120 쌍. 추후 categories.xlsx 가 확장되면
 *       이 파일의 SEMANTIC_CATEGORIES / NARRATIVE_SETS 만 교체하면 된다.
 */

// ============================================================================
// 1. SEMANTIC CATEGORIES  (16 sets × 4 words)
// ============================================================================

const SEMANTIC_CATEGORIES = [
  { id:  1, label: '신체-하지',     words: ['손', '발', '다리', '무릎'] },
  { id:  2, label: '악기',           words: ['피아노', '기타', '바이올린', '플루트'] },
  { id:  3, label: '과일',           words: ['사과', '자두', '멜론', '배'] },
  { id:  4, label: '술',             words: ['막걸리', '맥주', '소주', '와인'] },
  { id:  5, label: '물-자연',        words: ['호수', '강', '해안', '바다'] },
  { id:  6, label: '입',             words: ['혀', '입술', '이빨', '입'] },
  { id:  7, label: '기상',           words: ['바람', '번개', '비', '태풍'] },
  { id:  8, label: '친족',           words: ['누이', '사촌', '삼촌', '이모'] },
  { id:  9, label: '음료',           words: ['커피', '차', '우유', '주스'] },
  { id: 10, label: '교통수단',       words: ['버스', '차', '트럭', '오토바이'] },
  { id: 11, label: '자산',           words: ['적금', '주식', '부동산', '예금'] },
  { id: 12, label: '영양제',         words: ['비타민', '유산균', '오메가', '단백질'] },
  { id: 13, label: '숙박',           words: ['온천', '민박', '호텔', '휴양'] },
  { id: 14, label: '한식',           words: ['김치', '국수', '된장', '젓갈'] },
  { id: 15, label: '도시',           words: ['다낭', '방콕', '도쿄', '상해'] },
  { id: 16, label: '미용',           words: ['쿨톤', '눈썹', '염색', '파마'] }
];

// ============================================================================
// 2. NARRATIVE SETS  (4 fairytale-style 4-word sets)
// ============================================================================

const NARRATIVE_SETS = [
  { id: 1, label: '흥부놀부',  words: ['형제', '주걱', '제비', '박씨'] },
  { id: 2, label: '심청전',    words: ['장님', '공양', '바다', '연꽃'] },
  { id: 3, label: '별주부전',  words: ['자라', '토끼', '간',   '용궁'] },
  { id: 4, label: '해와달',    words: ['떡',   '호랑이', '오누이', '밧줄'] }
];

// Session-level narrative queue — pops a distinct set per trial. With 4 sets
// and ≤4 narrative trials, every set is used at most once. Auto-refills if
// the trial count ever exceeds the pool size.
let _narrativeQueue = [];
function _refillNarrativeQueue() { _narrativeQueue = shuffle(NARRATIVE_SETS); }
function nextNarrativeSet() {
  if (_narrativeQueue.length === 0) _refillNarrativeQueue();
  return _narrativeQueue.shift();
}

// ============================================================================
// 2b. DISSIMILAR SETS  (1_categories.xlsx · Sheet2)
//     4개의 무관 단어 세트, 각 12 단어. `dissimilar` 조건과 `narrative` 조건의
//     filler 에 trial 별로 다른 세트를 순환 배정해 trial 간 단어 재사용을 최소화한다.
// ============================================================================

const DISSIMILAR_SETS = [
  { id: 1, words: ['루비',     '타원',   '자전거', '나무',  '시간', '단어',
                   '벽돌',     '주황',   '슬픔',   '혜성',  '이불', '꿀벌'] },
  { id: 2, words: ['에메랄드', '사각형', '자동차', '덤불',  '공간', '문장',
                   '시멘트',   '파랑',   '행복',   '행성',  '베개', '나비'] },
  { id: 3, words: ['사파이어', '삼각형', '기차',   '화단',  '날짜', '텍스트',
                   '콘크리트', '초록',   '기쁨',   '태양',  '침대', '매미'] },
  { id: 4, words: ['진주',     '오각형', '트럭',   '잔디',  '달력', '문단',
                   '진흙',     '빨강',   '사랑',   '은하수','쿠션', '초파리'] }
];

// Session-level chunk queues.  For each DISSIMILAR_SET, the 12 words are split
// into 8 (dissimilar-trial words) and 4 (narrative-filler words) — DISJOINT —
// so dissimilar and narrative trials never share a word.  Each queue holds one
// chunk per set, in shuffled order, popped front-to-back by trial.  When a
// queue is empty (rare: more trials than sets), it auto-refills with a fresh
// random split + shuffle.
//
//   _dissimQueue[i]    : { set_id, words: [..8..] }
//   _narrFillerQueue[i]: { set_id, words: [..4..] }
let _dissimQueue     = [];
let _narrFillerQueue = [];

function _refillDissimilarQueues() {
  const dissim = [];
  const narr   = [];
  DISSIMILAR_SETS.forEach(s => {
    const shuffled = shuffle(s.words);
    dissim.push({ set_id: s.id, words: shuffled.slice(0, 8) });
    narr.push  ({ set_id: s.id, words: shuffled.slice(8, 12) });
  });
  _dissimQueue     = shuffle(dissim);
  _narrFillerQueue = shuffle(narr);
}
_refillDissimilarQueues();

function nextDissimilarChunk() {
  if (_dissimQueue.length === 0) _refillDissimilarQueues();
  return _dissimQueue.shift();
}
function nextNarrativeFillerChunk() {
  if (_narrFillerQueue.length === 0) _refillDissimilarQueues();
  return _narrFillerQueue.shift();
}

// ============================================================================
// 3. MATH POOL  (single-digit ± verification items — loaded from math_pool.js)
//    Pool is generated by generate_math_pool.py and exposed as window.MATH_POOL.
//    See web/js/math_pool.js — script must be loaded before stimuli.js.
// ============================================================================

// ============================================================================
// 4. RANDOM HELPERS
// ============================================================================

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n) { return shuffle(arr).slice(0, n); }

// ============================================================================
// 5. TRIAL WORD GENERATORS  (one trial = 8 words)
// ============================================================================

/**
 * Build a trial word list and metadata for a given condition.
 *   - 'grouped'     : 2 categories × 4 words, AAAABBBB
 *   - 'interleaved' : 2 categories × 4 words, ABABABAB
 *   - 'dissimilar'  : 8 무관 단어 (DISSIMILAR_WORDS pool, 무작위 8개 비복원)
 *   - 'narrative'   : 1 narrative set (4) + 4 무관 단어 (DISSIMILAR_WORDS pool);
 *                     narrative 묶음은 positions 1–4 ('early') 또는 5–8 ('late').
 *
 * Returns: { words: [..8 strings..], meta: {...} }
 */
function buildTrialWords(condition, narrativePosition /* 'early'|'late' for narrative */) {
  if (condition === 'grouped') {
    const [catA, catB] = pickN(SEMANTIC_CATEGORIES, 2);
    return {
      words: [...catA.words, ...catB.words],
      meta: { cat_a: catA.id, cat_b: catB.id, structure: 'AAAABBBB' }
    };
  }

  if (condition === 'interleaved') {
    const [catA, catB] = pickN(SEMANTIC_CATEGORIES, 2);
    const a = catA.words, b = catB.words;
    return {
      words: [a[0], b[0], a[1], b[1], a[2], b[2], a[3], b[3]],
      meta: { cat_a: catA.id, cat_b: catB.id, structure: 'ABABABAB' }
    };
  }

  if (condition === 'dissimilar') {
    const chunk = nextDissimilarChunk();          // 8 words, no overlap with narrative fillers
    return {
      words: shuffle(chunk.words),
      meta: { dissimilar_set_id: chunk.set_id, structure: 'ABCDEFGH' }
    };
  }

  if (condition === 'narrative') {
    const nset       = nextNarrativeSet();        // unique narrative set per trial
    const fillChunk  = nextNarrativeFillerChunk();// 4 filler words, disjoint from dissim
    const pos = narrativePosition || (Math.random() < 0.5 ? 'early' : 'late');
    const words = (pos === 'early')
      ? [...nset.words, ...fillChunk.words]
      : [...fillChunk.words, ...nset.words];
    return {
      words,
      meta: {
        narrative_set_id: nset.id,
        narrative_label: nset.label,
        narrative_position: pos,
        filler_dissimilar_set_id: fillChunk.set_id,
        structure: pos === 'early' ? 'AAAA+BBBB' : 'BBBB+AAAA'
      }
    };
  }

  throw new Error('Unknown condition: ' + condition);
}

// ============================================================================
// 6. MATH SAMPLER  (8 problems per trial, balanced +/− and T/F)
// ============================================================================

/**
 * Sample 8 math problems with 4 '+' / 4 '-' and 4 true / 4 false, drawn without
 * replacement from MATH_POOL.  Items are then shuffled to randomize position.
 *
 * `used` is an in-place Set of problem strings already drawn this session
 * (prevents duplicates across the experiment).
 */
function sampleMathForTrial(used) {
  const need = { '+T': 2, '+F': 2, '-T': 2, '-F': 2 };
  const pool = window.MATH_POOL.filter(m => !used.has(m.problem));
  const buckets = { '+T': [], '+F': [], '-T': [], '-F': [] };
  pool.forEach(m => {
    const key = m.op + (m.is_true ? 'T' : 'F');
    buckets[key].push(m);
  });

  const picked = [];
  for (const k of Object.keys(need)) {
    let candidates = shuffle(buckets[k]);
    if (candidates.length < need[k]) {
      // Pool exhausted for this bucket → reset usage tracker and re-sample
      candidates = shuffle(window.MATH_POOL.filter(m => (m.op + (m.is_true ? 'T' : 'F')) === k));
    }
    for (let i = 0; i < need[k]; i++) {
      const item = candidates[i];
      used.add(item.problem);
      picked.push(item);
    }
  }
  return shuffle(picked);
}

// ============================================================================
// 7. LATIN-SQUARE CONDITION ORDERS  (abcd / bcda / cdab / dabc)
// ============================================================================

const CONDITION_BASE = ['grouped', 'interleaved', 'dissimilar', 'narrative'];

function conditionOrderForGroup(group /* 1..4 */) {
  const g = ((group - 1) % 4 + 4) % 4;
  return [...CONDITION_BASE.slice(g), ...CONDITION_BASE.slice(0, g)];
}

// ============================================================================
// 8. EXPORT
// ============================================================================

window.SEMANTIC_CATEGORIES = SEMANTIC_CATEGORIES;
window.NARRATIVE_SETS      = NARRATIVE_SETS;
window.DISSIMILAR_SETS     = DISSIMILAR_SETS;
window.shuffle             = shuffle;
window.buildTrialWords     = buildTrialWords;
window.sampleMathForTrial  = sampleMathForTrial;
window.conditionOrderForGroup = conditionOrderForGroup;
