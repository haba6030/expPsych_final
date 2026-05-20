# exp_psych final — Web Experiment

웹 기반 jsPsych 7.x 실험. 처리부하(math/no-math) × 의미 구조(grouped/interleaved/dissimilar/narrative) 2×4 피험자내 설계.

자세한 설계는 [`experiment_protocol.md`](experiment_protocol.md) 참조.

## 디렉터리

```
.
├── index.html              # jsPsych 7.3.4 + plugins (unpkg CDN)
├── css/style.css           # 한국어 typography, word/math/recall 카드
├── js/
│   ├── stimuli.js          # 16 semantic + 4 narrative + 4 dissimilar + 128 math + 트라이얼 생성기
│   └── experiment.js       # main timeline + Latin-square block builder + 데이터 저장
├── google-apps-script.js   # Google Sheets 저장 endpoint (4-sheet schema)
├── server.js               # 로컬 Express 서버 (개발용)
├── package.json
├── experiment_protocol.md  # 본 실험 설계 문서
└── README.md
```

## URL 파라미터

| 파라미터 | 의미 | 예시 |
|----------|------|------|
| `pid` | 참가자 ID (미지정 시 `P####` 무작위) | `?pid=P03` |
| `order` | 블록 순서 강제 | `?order=mn` (math→nomath) 또는 `?order=nm` |
| `group` | 라틴 정방 그룹 (1–4) | `?group=2` |

예: `https://haba6030.github.io/expPsych_final/?pid=P01&group=1`
