/**
 * Google Apps Script endpoint for the exp_psych final web experiment.
 *
 * SETUP (5 minutes):
 *   1. Google Drive에서 새 Google Sheets 생성
 *   2. Extensions → Apps Script
 *   3. 이 파일 내용을 모두 복사해 붙여넣고 저장
 *   4. Deploy → New deployment
 *      - Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. 배포 후 표시되는 Web app URL을 복사해서
 *      web/js/experiment.js 의 GOOGLE_SCRIPT_URL 상수에 붙여넣기
 *
 * 생성되는 시트:
 *   - Metadata        : 참가자별 1행
 *   - Trials          : trial 단위 결과 (item/order score 포함)
 *   - MathResponses   : math 단계별 응답
 *   - Survey          : 사후 설문 응답
 */

const SHEETS = {
  META:   'Metadata',
  TRIAL:  'Trials',
  MATH:   'MathResponses',
  SURVEY: 'Survey'
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, name: 'expPsychFinal endpoint' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    save(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function save(p) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const ts  = new Date();
  const pid = p.participant_id;

  // ---- Metadata ----
  const meta = getOrCreate(ss, SHEETS.META, [
    'timestamp','participant_id','block_order','latin_group','condition_order',
    'total_duration_ms','user_agent','screen_w','screen_h'
  ]);
  meta.appendRow([ts, pid, p.block_order, p.latin_group, p.condition_order,
                  p.total_duration_ms, p.user_agent, p.screen_w, p.screen_h]);

  if (!Array.isArray(p.all_trials)) return;

  const trialSheet = getOrCreate(ss, SHEETS.TRIAL, [
    'timestamp','participant_id','block','block_order','latin_group',
    'trial_idx','condition','is_practice',
    'presented','recalled','item_score','order_score',
    'math_n','math_n_accurate','math_accuracy','math_n_no_response',
    'condition_meta_json'
  ]);
  const mathSheet = getOrCreate(ss, SHEETS.MATH, [
    'timestamp','participant_id','block','trial_idx','position',
    'equation','displayed','is_true','response','accurate','no_response','rt'
  ]);
  const survSheet = getOrCreate(ss, SHEETS.SURVEY, [
    'timestamp','participant_id','task','item','response_json'
  ]);

  p.all_trials.forEach(t => {
    switch (t.task) {
      case 'recall':
      case 'recall_practice':
        trialSheet.appendRow([
          ts, pid, t.block, p.block_order, p.latin_group,
          t.trial_idx, t.condition, t.is_practice ? 1 : 0,
          t.presented || '', t.recalled_str || '',
          t.item_score, t.order_score,
          t.math_n, t.math_n_accurate, t.math_accuracy, t.math_n_no_response,
          JSON.stringify(t.condition_meta || {})
        ]);
        if (Array.isArray(t.math_responses)) {
          t.math_responses.forEach(m => {
            mathSheet.appendRow([
              ts, pid, t.block, t.trial_idx, m.position,
              m.equation, m.displayed, m.is_true,
              m.response, m.accurate, m.no_response, m.rt
            ]);
          });
        }
        break;

      case 'survey_narrative_likert':
        survSheet.appendRow([ts, pid, t.task,
          t.narrative_label || ('set ' + t.narrative_set_id),
          JSON.stringify({ rating: t.rating })]);
        break;
      case 'survey_narrative_freetext':
        survSheet.appendRow([ts, pid, t.task,
          t.narrative_label || ('set ' + t.narrative_set_id),
          JSON.stringify({ guess: t.guess_text || '' })]);
        break;
      case 'survey_structure_likert':
        survSheet.appendRow([ts, pid, t.task, 'grouped_vs_interleaved',
          JSON.stringify({ grouped_easy: t.grouped_easy,
                           interleaved_easy: t.interleaved_easy })]);
        break;
      case 'survey_structure_choice':
        survSheet.appendRow([ts, pid, t.task, 'choice',
          JSON.stringify({ choice: t.structure_choice })]);
        break;
      case 'survey_demographics':
        survSheet.appendRow([ts, pid, t.task, 'demographics',
          JSON.stringify(t.response || {})]);
        break;
    }
  });
}

function getOrCreate(ss, name, header) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(header);
  }
  return s;
}
