/**
 * Stimuli for the working-memory × semantic-structure × processing-load experiment.
 *
 *   SEMANTIC_CATEGORIES : 16 thematic 4-word sets (used by grouped / interleaved / dissimilar)
 *   NARRATIVE_SETS      : 4 fairytale-style 4-word sets (narrative condition)
 *   MATH_POOL           : 128 two-digit ± verification equations (math filler)
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
// 3. MATH POOL  (128 items: 64 add / 64 sub, 64 true / 64 false)
//    From trials/math_pool_2digit_128.csv  (auto-generated)
// ============================================================================

const MATH_POOL = [
  {"problem": "66 - 34", "op": "-", "displayed": 32, "is_true": true},
  {"problem": "56 - 26", "op": "-", "displayed": 30, "is_true": true},
  {"problem": "43 - 24", "op": "-", "displayed": 19, "is_true": true},
  {"problem": "69 + 10", "op": "+", "displayed": 79, "is_true": true},
  {"problem": "32 + 14", "op": "+", "displayed": 38, "is_true": false},
  {"problem": "72 - 48", "op": "-", "displayed": 24, "is_true": true},
  {"problem": "19 + 40", "op": "+", "displayed": 59, "is_true": true},
  {"problem": "46 - 25", "op": "-", "displayed": 16, "is_true": false},
  {"problem": "19 + 45", "op": "+", "displayed": 69, "is_true": false},
  {"problem": "96 + 16", "op": "+", "displayed": 112, "is_true": true},
  {"problem": "68 + 18", "op": "+", "displayed": 86, "is_true": true},
  {"problem": "84 + 21", "op": "+", "displayed": 105, "is_true": true},
  {"problem": "25 + 12", "op": "+", "displayed": 46, "is_true": false},
  {"problem": "66 - 26", "op": "-", "displayed": 40, "is_true": true},
  {"problem": "94 - 93", "op": "-", "displayed": 8, "is_true": false},
  {"problem": "66 - 25", "op": "-", "displayed": 41, "is_true": true},
  {"problem": "66 - 18", "op": "-", "displayed": 41, "is_true": false},
  {"problem": "63 + 23", "op": "+", "displayed": 86, "is_true": true},
  {"problem": "40 + 26", "op": "+", "displayed": 66, "is_true": true},
  {"problem": "99 + 29", "op": "+", "displayed": 136, "is_true": false},
  {"problem": "82 - 22", "op": "-", "displayed": 60, "is_true": true},
  {"problem": "63 + 59", "op": "+", "displayed": 118, "is_true": false},
  {"problem": "24 - 10", "op": "-", "displayed": 17, "is_true": false},
  {"problem": "80 - 44", "op": "-", "displayed": 33, "is_true": false},
  {"problem": "54 + 12", "op": "+", "displayed": 66, "is_true": true},
  {"problem": "47 - 37", "op": "-", "displayed": 18, "is_true": false},
  {"problem": "90 + 27", "op": "+", "displayed": 124, "is_true": false},
  {"problem": "48 + 15", "op": "+", "displayed": 63, "is_true": true},
  {"problem": "61 - 22", "op": "-", "displayed": 44, "is_true": false},
  {"problem": "65 + 30", "op": "+", "displayed": 97, "is_true": false},
  {"problem": "32 + 13", "op": "+", "displayed": 48, "is_true": false},
  {"problem": "40 - 16", "op": "-", "displayed": 30, "is_true": false},
  {"problem": "28 - 10", "op": "-", "displayed": 11, "is_true": false},
  {"problem": "28 + 11", "op": "+", "displayed": 30, "is_true": false},
  {"problem": "63 + 46", "op": "+", "displayed": 109, "is_true": true},
  {"problem": "38 + 19", "op": "+", "displayed": 52, "is_true": false},
  {"problem": "48 - 10", "op": "-", "displayed": 38, "is_true": true},
  {"problem": "81 - 35", "op": "-", "displayed": 46, "is_true": true},
  {"problem": "55 - 48", "op": "-", "displayed": 10, "is_true": false},
  {"problem": "27 + 34", "op": "+", "displayed": 52, "is_true": false},
  {"problem": "55 + 90", "op": "+", "displayed": 145, "is_true": true},
  {"problem": "96 + 76", "op": "+", "displayed": 178, "is_true": false},
  {"problem": "70 + 60", "op": "+", "displayed": 130, "is_true": true},
  {"problem": "45 - 40", "op": "-", "displayed": 5, "is_true": true},
  {"problem": "40 - 12", "op": "-", "displayed": 30, "is_true": false},
  {"problem": "64 + 39", "op": "+", "displayed": 103, "is_true": true},
  {"problem": "83 + 41", "op": "+", "displayed": 127, "is_true": false},
  {"problem": "13 + 96", "op": "+", "displayed": 117, "is_true": false},
  {"problem": "39 - 16", "op": "-", "displayed": 23, "is_true": true},
  {"problem": "29 - 18", "op": "-", "displayed": 11, "is_true": true},
  {"problem": "72 - 11", "op": "-", "displayed": 61, "is_true": true},
  {"problem": "35 + 19", "op": "+", "displayed": 63, "is_true": false},
  {"problem": "59 + 49", "op": "+", "displayed": 100, "is_true": false},
  {"problem": "33 - 31", "op": "-", "displayed": 10, "is_true": false},
  {"problem": "26 - 17", "op": "-", "displayed": 13, "is_true": false},
  {"problem": "72 - 13", "op": "-", "displayed": 53, "is_true": false},
  {"problem": "65 + 57", "op": "+", "displayed": 120, "is_true": false},
  {"problem": "70 + 60", "op": "+", "displayed": 123, "is_true": false},
  {"problem": "46 + 43", "op": "+", "displayed": 89, "is_true": true},
  {"problem": "98 - 71", "op": "-", "displayed": 27, "is_true": true},
  {"problem": "52 - 21", "op": "-", "displayed": 24, "is_true": false},
  {"problem": "62 + 93", "op": "+", "displayed": 155, "is_true": true},
  {"problem": "55 - 35", "op": "-", "displayed": 20, "is_true": true},
  {"problem": "30 + 78", "op": "+", "displayed": 108, "is_true": true},
  {"problem": "49 - 39", "op": "-", "displayed": 10, "is_true": true},
  {"problem": "21 + 53", "op": "+", "displayed": 68, "is_true": false},
  {"problem": "28 - 24", "op": "-", "displayed": 4, "is_true": true},
  {"problem": "87 - 18", "op": "-", "displayed": 69, "is_true": true},
  {"problem": "64 + 73", "op": "+", "displayed": 137, "is_true": true},
  {"problem": "69 + 67", "op": "+", "displayed": 136, "is_true": true},
  {"problem": "95 - 50", "op": "-", "displayed": 39, "is_true": false},
  {"problem": "76 + 28", "op": "+", "displayed": 104, "is_true": true},
  {"problem": "49 - 12", "op": "-", "displayed": 28, "is_true": false},
  {"problem": "26 + 86", "op": "+", "displayed": 115, "is_true": false},
  {"problem": "33 - 27", "op": "-", "displayed": 6, "is_true": true},
  {"problem": "39 + 98", "op": "+", "displayed": 139, "is_true": false},
  {"problem": "91 + 80", "op": "+", "displayed": 180, "is_true": false},
  {"problem": "31 + 50", "op": "+", "displayed": 72, "is_true": false},
  {"problem": "27 - 18", "op": "-", "displayed": 6, "is_true": false},
  {"problem": "72 + 59", "op": "+", "displayed": 138, "is_true": false},
  {"problem": "58 + 61", "op": "+", "displayed": 117, "is_true": false},
  {"problem": "57 + 13", "op": "+", "displayed": 70, "is_true": true},
  {"problem": "50 - 22", "op": "-", "displayed": 31, "is_true": false},
  {"problem": "41 + 34", "op": "+", "displayed": 81, "is_true": false},
  {"problem": "35 + 93", "op": "+", "displayed": 128, "is_true": true},
  {"problem": "73 + 80", "op": "+", "displayed": 153, "is_true": true},
  {"problem": "31 + 61", "op": "+", "displayed": 92, "is_true": true},
  {"problem": "26 - 17", "op": "-", "displayed": 9, "is_true": true},
  {"problem": "93 - 12", "op": "-", "displayed": 81, "is_true": true},
  {"problem": "95 + 74", "op": "+", "displayed": 169, "is_true": true},
  {"problem": "44 - 13", "op": "-", "displayed": 36, "is_true": false},
  {"problem": "74 + 71", "op": "+", "displayed": 150, "is_true": false},
  {"problem": "60 + 55", "op": "+", "displayed": 118, "is_true": false},
  {"problem": "51 + 31", "op": "+", "displayed": 82, "is_true": true},
  {"problem": "67 + 37", "op": "+", "displayed": 104, "is_true": true},
  {"problem": "52 - 51", "op": "-", "displayed": 1, "is_true": true},
  {"problem": "30 - 15", "op": "-", "displayed": 24, "is_true": false},
  {"problem": "76 + 10", "op": "+", "displayed": 86, "is_true": true},
  {"problem": "68 + 96", "op": "+", "displayed": 168, "is_true": false},
  {"problem": "46 - 16", "op": "-", "displayed": 30, "is_true": true},
  {"problem": "37 + 99", "op": "+", "displayed": 136, "is_true": true},
  {"problem": "75 - 68", "op": "-", "displayed": 7, "is_true": true},
  {"problem": "75 - 20", "op": "-", "displayed": 55, "is_true": true},
  {"problem": "19 + 75", "op": "+", "displayed": 94, "is_true": true},
  {"problem": "50 - 23", "op": "-", "displayed": 24, "is_true": false},
  {"problem": "91 - 34", "op": "-", "displayed": 66, "is_true": false},
  {"problem": "36 + 74", "op": "+", "displayed": 104, "is_true": false},
  {"problem": "91 - 43", "op": "-", "displayed": 48, "is_true": true},
  {"problem": "45 + 12", "op": "+", "displayed": 57, "is_true": true},
  {"problem": "56 - 53", "op": "-", "displayed": 3, "is_true": true},
  {"problem": "81 - 61", "op": "-", "displayed": 17, "is_true": false},
  {"problem": "87 - 32", "op": "-", "displayed": 48, "is_true": false},
  {"problem": "97 + 53", "op": "+", "displayed": 145, "is_true": false},
  {"problem": "43 - 34", "op": "-", "displayed": 9, "is_true": true},
  {"problem": "22 - 16", "op": "-", "displayed": 6, "is_true": true},
  {"problem": "26 - 10", "op": "-", "displayed": 22, "is_true": false},
  {"problem": "11 + 87", "op": "+", "displayed": 98, "is_true": true},
  {"problem": "51 - 35", "op": "-", "displayed": 20, "is_true": false},
  {"problem": "48 - 21", "op": "-", "displayed": 18, "is_true": false},
  {"problem": "99 + 61", "op": "+", "displayed": 160, "is_true": true},
  {"problem": "31 - 26", "op": "-", "displayed": 13, "is_true": false},
  {"problem": "77 - 53", "op": "-", "displayed": 24, "is_true": true},
  {"problem": "86 + 19", "op": "+", "displayed": 102, "is_true": false},
  {"problem": "99 - 39", "op": "-", "displayed": 60, "is_true": true},
  {"problem": "20 - 16", "op": "-", "displayed": 4, "is_true": true},
  {"problem": "84 - 67", "op": "-", "displayed": 9, "is_true": false},
  {"problem": "65 - 53", "op": "-", "displayed": 15, "is_true": false},
  {"problem": "44 - 18", "op": "-", "displayed": 31, "is_true": false}
];

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
  const pool = MATH_POOL.filter(m => !used.has(m.problem));
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
      candidates = shuffle(MATH_POOL.filter(m => (m.op + (m.is_true ? 'T' : 'F')) === k));
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
window.MATH_POOL           = MATH_POOL;
window.shuffle             = shuffle;
window.buildTrialWords     = buildTrialWords;
window.sampleMathForTrial  = sampleMathForTrial;
window.conditionOrderForGroup = conditionOrderForGroup;
