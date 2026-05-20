# exp_psych final — Web Experiment

웹 기반 jsPsych 7.x 실험. 처리부하(math/no-math) × 의미 구조(grouped/interleaved/dissimilar/narrative) 2×4 피험자내 설계.

자세한 설계는 [`experiment_protocol.md`](experiment_protocol.md) 참조.

## 디렉터리

```
web/
├── index.html              # jsPsych 7.3.4 + plugins (unpkg CDN)
├── css/style.css           # 한국어 typography, word/math/recall 카드
├── js/
│   ├── stimuli.js          # 16 semantic + 4 narrative + 128 math + trial generators
│   └── experiment.js       # main timeline + Latin-square block builder + save
├── google-apps-script.js   # Web App endpoint (4-sheet schema)
├── server.js               # 로컬 Express 서버 (개발용)
├── package.json
├── experiment_protocol.md  # 본 실험 설계 문서
└── README.md
```

## 로컬 실행

```bash
cd web
npm install
node server.js
```

브라우저에서 `http://localhost:3000/` 접속. 데이터는 `web/data/` 에 JSON으로 저장됨.

## GitHub Pages 배포

1. https://github.com/haba6030/expPsych_final 에 `web/` 내용을 push (또는 디렉터리 자체를 repo로 설정)
2. Repo Settings → Pages → Source: `main` branch, root (`/`)
3. 배포 후 URL: `https://haba6030.github.io/expPsych_final/`

## Google Sheets 저장 설정

1. Google Sheets 새로 만들기
2. Extensions → Apps Script
3. [`google-apps-script.js`](google-apps-script.js) 내용 붙여넣기 → 저장 → Deploy → New deployment (Web app, Anyone)
4. 배포 URL 을 `js/experiment.js` 의 `GOOGLE_SCRIPT_URL` 상수에 붙여넣기

## URL 파라미터

| 파라미터 | 의미 | 예시 |
|----------|------|------|
| `pid` | 참가자 ID (미지정 시 P####) | `?pid=P03` |
| `order` | 블록 순서 강제 | `?order=mn` (math→nomath) 또는 `?order=nm` |
| `group` | 라틴 정방 그룹 (1–4) | `?group=2` |

예: `https://haba6030.github.io/expPsych_final/?pid=P01&group=1`

## 실험 흐름 (한눈)

1. 동의 / 참가자 ID 안내
2. **Block 1** (math 또는 no-math, 무작위) — 안내 → 연습 1 → 본 실험 → 마무리
3. **Block 2** (나머지 처리부하) — 동일 구조
4. 사후 설문
   - 서사 인식 (4 narrative set Likert + free text)
   - 묶음 vs 번갈아 학습 용이성
   - 인구통계
5. 종료 + 데이터 저장 (Google Sheets + 로컬 다운로드)

## 진행자 체크리스트

1. 참가자 1 → `?pid=P01`, 참가자 2 → `?pid=P02`, … 로 접속 (group/order 자동 배정)
2. Welcome 화면을 함께 확인. OS 알림 끔
3. 총 24 시행 + 설문, 약 25–30분
4. 종료 화면("실험이 종료되었습니다") 표시되면 저장 완료. JSON 자동 다운로드도 백업
5. Google Sheet `Metadata` 탭에서 해당 pid row 확인

## 자극 수정

`js/stimuli.js` 의 `SEMANTIC_CATEGORIES`, `NARRATIVE_SETS`, `MATH_POOL` 을 직접 편집.
원본 소스: `../trials/1_categories.xlsx`, `../trials/math_pool_2digit_128.csv`.

## 미결 사항

`experiment_protocol.md` §10 참조 (no-math trial 수 확장, narrative 자극 추가 등).
