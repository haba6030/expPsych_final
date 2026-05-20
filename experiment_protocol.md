# Experiment Protocol — Web Edition

**Project**: 의미 형성이 작업기억에 미치는 영향 (작업기억 × 의미 구조 × 처리부하)

**Implementation**: jsPsych 7.x on GitHub Pages (https://github.com/haba6030/expPsych_final)

**Last updated**: 2026-05-20

---

## 1. 개요

본 실험은 2 (처리부하: math vs no-math) × 4 (의미 구조: grouped / interleaved / dissimilar / narrative) 피험자 내 설계다. 단어 폭 과제 패러다임(Kowialiewski et al., 2024)에 OSpan-식 수식 distractor(Daneman & Carpenter, 1980; Unsworth et al., 2005)를 결합하고, 서사(narrative) 조건을 추가한다.

기존 설계(`proposal_final.pdf`)에서는 math/no-math를 한 시행 단위로 무작위 혼합했으나, **본 웹 버전에서는 두 처리부하를 별도 블록으로 분리한다.** 이는 (a) 참가자가 블록 안에서 일관된 기대(math 유/무)를 갖게 하여 trial-level 전환 비용을 제거하고, (b) 블록 간 효과를 평균 비교로 깔끔히 추출하기 위함이다.

---

## 2. 처리부하 블록

- 처리부하 두 수준은 각각 1개 블록을 이룬다.
- **두 블록의 순서는 참가자별로 무작위 배정** (math-first vs. no-math-first 50:50).
- URL parameter `?order=mn` (math→nomath) 또는 `?order=nm` (nomath→math)로 강제 가능. 미지정 시 무작위.

### 블록 내부 순서 (양 블록 공통)

1. 블록 안내 화면
2. 연습 안내 화면
3. **연습 시행** (1 trial)
4. 본 실험 안내 화면
5. **본 실험** (N trials)
6. 블록 마무리 화면

블록 1 종료 후 곧바로 블록 2의 안내 화면으로 이어진다.

---

## 3. 의미 구조 4조건

| 코드 | 명칭 | 구조 | 자극 구성 |
|------|------|------|-----------|
| `grouped` | 묶음 제시 | AAAABBBB | 2개 의미 범주에서 각 4개씩, 묶음 순으로 |
| `interleaved` | 번갈아 제시 | ABABABAB | 같은 2개 범주, 번갈아 순으로 |
| `dissimilar` | 무관 | ABCDEFGH | **무관 단어 세트** (`1_categories.xlsx · Sheet2`, 4세트 × 12단어) 의 dissim 청크 (set당 8단어) → 비복원 8개 |
| `narrative` | 서사 | (서사 4 + 무관 4) | 서사 세트 1개 + 동일/다른 dissim 세트의 narrative-filler 청크 (set당 나머지 4단어) |

> **dissim ↔ narrative-filler 단어 비중복** — 각 dissim 세트의 12단어는 session 시작 시 8(dissim 트라이얼용) + 4(narrative-filler용)로 무작위 분할된다. 두 청크는 항상 disjoint 이므로 dissim 트라이얼에서 본 단어와 narrative 트라이얼의 filler 단어가 겹칠 일이 없다. trial 진행 순서대로 청크 큐에서 pop 하며, 큐 소진 시 자동 재셔플.

`narrative` 조건에서 서사 단어 묶음의 위치(앞 4개 vs. 뒤 4개)는 trial 내에서 균형있게 배정한다.

### 조건 카운터밸런싱 (블록 내)

블록 내 4 조건의 제시 순서는 **참가자 ID로부터 결정되는 라틴 정방** 중 하나를 사용한다:

| group | 순서 |
|-------|------|
| 1 | grouped → interleaved → dissimilar → narrative |
| 2 | interleaved → dissimilar → narrative → grouped |
| 3 | dissimilar → narrative → grouped → interleaved |
| 4 | narrative → grouped → interleaved → dissimilar |

(즉 abcd / bcda / cdab / dabc.) 한 블록 안에서 조건은 위 순서대로 **반복 제시**된다. 예: trials/condition = 2이면 블록 = 8 trials = (a,b,c,d) × 2.

이 라틴 정방 순서는 두 블록(math, no-math)에 동일하게 적용된다.

### Trial 수

- **Math 블록**: 2 trials × 4 conditions = **8 trials**
- **No-math 블록**: 2 trials × 4 conditions = **8 trials**
- 합계: **16 trials** (블록 간 trial 수 대칭)

이 trial 분배는 가용 자극 풀과 정확히 맞물린다:
- 16개 의미 범주 → grouped 4 trial + interleaved 4 trial 에 1세트씩 (총 16세트 슬롯)
- 4개 서사 세트 → narrative 4 trial 에 1세트씩 (각 세트 1회 사용, 재출현 없음)
- 4개 dissimilar 세트 × 12단어 = 48단어 → dissim 4 trial (32단어) + narrative filler 4 trial (16단어), **서로 겹치지 않음**

`js/experiment.js`의 `CONFIG.TRIALS_PER_COND_MATH` / `TRIALS_PER_COND_NOMATH`로 조정 가능 (조정 시 자극 풀 부족분은 자동 재셔플 fallback 작동).

---

## 4. Trial 구조

### 4.1 학습 단계 (encoding)

각 trial은 다음을 8회 반복:

```
fixation(+)    500 ms
word           1000 ms
filler         (math 또는 blank)
```

#### 공통 filler 타이밍

- **filler 구간은 항상 1500 ms 고정**. 응답 유무와 무관하게 1500 ms 가 지나야 다음 단어로 진행한다.
- 두 부하 조건은 1500 ms 동안 화면에 표시되는 내용만 다르다 → 학습 단계 총 시간은 두 조건이 동일하다 (8 × (500 + 1000 + 1500) = 24 s).

#### Math 조건 filler

- 1500 ms 동안 수식 1개 제시 (예: `66 - 34 = 32`)
- 응답: `J` = 참 / `F` = 거짓
- 응답을 1500 ms 안에 입력해도 즉시 다음 단어로 넘어가지 않고 1500 ms 가 끝날 때까지 대기 (timing matched to no-math)
- 1500 ms 안에 미응답 시 무응답으로 기록
- 한 trial 당 **8개 수식** (단어1 → math1 → 단어2 → math2 → … → 단어8 → math8 → recall)

> **수식 풀 구성 원칙** — 한 trial 내에서 `+` 와 `-` 연산자 개수를 균형있게 배정한다 (8개 중 4 vs. 4). True/False 정답도 trial 내 4 vs. 4로 균형. 풀은 `math_pool_2digit_128.csv` (2자리 정수 ± 2자리 정수, 128개)에서 비복원 추출.

#### No-math 조건 filler

- 빈 화면 1500 ms

### 4.2 회상 단계 (recall)

학습 8단어 종료 직후:

- 화면에 단어 8개를 **제시된 순서대로** 띄어쓰기(space)로 구분하여 입력
- 기억나지 않는 위치는 **`##`** 으로 표기
- 예: `유리 구두 ## 자정 나무 ## 편지 평안`
- 제한 시간: trial당 **60초** (시간 초과 시 입력 내용 자동 제출)
- Submit 버튼 또는 Enter (Ctrl+Enter, IME 호환)로 즉시 제출

### 4.3 채점 (분석 단계에서 수행, 실험 중 미표시)

- **Item memory** = (제시된 단어 8개 중 응답에 등장한 단어 수) / 8 — 위치 무관
- **Order memory** = (제시 순서와 응답 순서가 일치하는 단어 수) / (`##`가 아닌 응답 수)

`##`와 빈 응답은 분모 계산에서 제외 (proposal §4 정의 그대로).

---

## 5. 연습 시행

- 각 블록의 본 실험 직전에 **1 trial** 진행.
- 사용 자극: `dissimilar` 조건 (서로 무관한 8개 단어).
- math 블록의 연습은 수식 포함, no-math 블록의 연습은 수식 미포함.
- 연습 trial은 본 실험 데이터 채점에서 제외 (`task: 'practice'`로 태깅).
- 종료 후 별도 피드백 없이 본 실험 안내로 이어짐.

---

## 6. 마무리 설문

본 실험 두 블록이 모두 끝난 뒤 1회 진행.

### 6.1 서사 인식 (Narrative awareness)

- **사용한 서사 세트 4개**의 핵심 4단어 묶음을 차례로 제시하고:
  - “이 단어들이 어떤 이야기(동화/우화)와 관련되어 있다고 느끼셨습니까?”
    1 (전혀 그렇지 않음) — 7 (매우 그렇다)
  - “어떤 이야기였는지 자유롭게 적어 주세요.” (free text)

### 6.2 의미 구조 학습 용이성

- 두 조건(grouped vs interleaved)에 대해 각각:
  - “같은 의미 범주 단어를 **연달아 묶어** 제시한 시행은 외우기 쉬웠습니까?” (1–7)
  - “같은 의미 범주 단어를 **번갈아** 제시한 시행은 외우기 쉬웠습니까?” (1–7)
- 비교 문항: “두 방식 중 어느 쪽이 더 외우기 쉬웠습니까?” (선택지: 묶음 / 번갈아 / 비슷)

### 6.3 인구통계

- 만 나이, 성별, 소속/학년, 본 실험 목적 추측 (free text).

---

## 7. 데이터 저장

3중 백업:

1. **Google Sheets** via Apps Script Web App (production, `GOOGLE_SCRIPT_URL` 상수)
2. **로컬 서버** via `server.js` (개발 시, `localhost`에서만)
3. **참가자 PC 다운로드**: JSON 파일로 자동 다운로드 (항상)

### 시트 구성 (Google Apps Script)

| 시트 | 단위 | 주요 컬럼 |
|------|------|-----------|
| `Metadata` | 참가자 1행 | participant_id, block_order, latin_group, duration_ms, ua, screen |
| `Trials` | trial 1행 | block, block_load, trial_idx, condition, load, narrative_set_id, presented_words, recall_response, item_score, order_score |
| `MathResponses` | math 응답 1행 | block, trial_idx, position, equation, displayed_answer, is_true, response, accurate, rt |
| `Survey` | 응답 1행 | task, item, response_json |

채점(`item_score`, `order_score`)은 클라이언트에서 즉시 계산해 저장한다.

---

## 8. 참가자 흐름 (요약)

```
1. Welcome / 동의
2. 참가자 ID 안내
3. [Block 1] = math 또는 no-math (랜덤)
   ├─ 블록 안내
   ├─ 연습 안내 → 연습 1 trial
   ├─ 본 실험 안내 → 본 실험 N trial
   └─ 블록 마무리
4. [Block 2] = 나머지 처리부하
   ├─ (블록 1과 동일 구조)
5. 마무리 설문
   ├─ 서사 인식 (4 narrative sets)
   ├─ grouped/interleaved 학습 용이성
   └─ 인구통계
6. 종료 화면 + 데이터 저장
```

예상 소요 시간 (24 trials 기준): **약 25–30분**.

---

## 9. URL 파라미터

| 파라미터 | 의미 | 예시 |
|----------|------|------|
| `pid` | 참가자 ID (미지정 시 P####) | `?pid=P03` |
| `order` | 블록 순서 강제 | `?order=mn` 또는 `?order=nm` |
| `group` | 라틴 정방 그룹 강제 (1–4) | `?group=2` |

미지정 시 모두 무작위 / 자동 배정.

---

## 10. 자극 풀 현황

| 풀 | 사용처 | 크기 | trial당 소비 | 트라이얼 수 | 비고 |
|----|--------|------|-------------|-------------|------|
| `SEMANTIC_CATEGORIES` | grouped / interleaved | 16 세트 × 4 | 2 세트 | 4 grouped + 4 interleaved | 세트 무작위 |
| `NARRATIVE_SETS` | narrative (target 4 단어) | 4 세트 | 1 세트 | 4 narrative | session 셔플 큐, 재사용 없음 |
| `DISSIMILAR_SETS` (dissim 청크) | dissimilar trial | 4 청크 × 8 단어 | 1 청크 | 4 dissim | session 셔플 큐 |
| `DISSIMILAR_SETS` (narr-filler 청크) | narrative filler | 4 청크 × 4 단어 | 1 청크 | 4 narrative | dissim 청크와 disjoint |
| `MATH_POOL` | math filler | 128 문항 | 8 문항 | 8 math trial | trial 당 +/− 4:4, T/F 4:4 |

향후 자극 확장 시 `js/stimuli.js`의 해당 배열만 수정하면 즉시 반영된다 (큐는 자동 재셔플).
