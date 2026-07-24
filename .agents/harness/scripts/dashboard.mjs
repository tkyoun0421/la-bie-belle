import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadIndex, repoRootFrom } from "./lib/index.mjs";
import { runnableIssues } from "./lib/workflow-contract.mjs";

const root = repoRootFrom(import.meta.url);
const reportPath = join(root, ".agents/reports/ai-readiness/latest.json");
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
const { entries } = loadIndex(root);
const execution = {
  current_task: entries.find((entry) => entry.kind === "task" && entry.status === "in_progress")?.id ?? null,
  tasks: entries.filter((entry) => entry.kind === "task").map((task) => ({
    id: task.id,
    phase: task.phase,
    title: task.title,
    status: task.status,
    blockers: task.status === "done" ? [] : runnableIssues(entries, task, root).map(({ code, message }) => ({ code, message }))
  }))
};
const encoded = JSON.stringify({ report, execution }).replace(/</g, "\\u003c");
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>라비에벨 개발 현황</title>
  <style>
    :root{color-scheme:light;--blue:#0052ff;--blue-dark:#003ecc;--ink:#0a0b0d;--sub:#5b616e;--line:#dee1e6;--surface:#f7f7f7;--success:#087a4b;--success-bg:#e8f8f1;--warning:#765500;--warning-bg:#fff7d6;--danger:#b01825;--danger-bg:#fff0f1;--radius:20px;--shadow:0 8px 24px rgba(10,11,13,.08)}
    *{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font-family:Pretendard Variable,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:16px;line-height:1.5}main{max-width:1120px;margin:0 auto;padding:48px 20px 80px}.eyebrow{margin:0 0 8px;color:var(--blue);font-size:14px;font-weight:700;letter-spacing:.04em}.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:48px}.hero h1{margin:0;font-size:32px;line-height:1.25;letter-spacing:-.04em}.hero p{max-width:560px;margin:12px 0 0;color:var(--sub)}.task-now{min-width:180px;padding:16px 20px;border:1px solid #b8ceff;border-radius:16px;background:#eef4ff;color:var(--blue)}.task-now b{display:block;font-size:13px}.task-now strong{display:block;margin-top:4px;font-variant-numeric:tabular-nums}.section{margin-top:48px}.section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:16px}.section h2{margin:0;font-size:22px;line-height:1.36;letter-spacing:-.03em}.caption{margin:0;color:var(--sub);font-size:13px}.score-panel{display:grid;grid-template-columns:minmax(220px,.75fr) minmax(0,1.75fr);gap:32px;padding:28px;border:1px solid var(--line);border-radius:var(--radius);background:#fff;box-shadow:var(--shadow)}.score-value{font-size:48px;line-height:1;font-weight:700;letter-spacing:-.05em;font-variant-numeric:tabular-nums}.score-value small{font-size:18px;font-weight:600;color:var(--sub);letter-spacing:0}.score-meta{margin:12px 0 0;color:var(--sub);font-size:13px}.category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 24px}.category{min-width:0}.category-top{display:flex;justify-content:space-between;gap:8px;font-size:14px;font-weight:600}.category-top span:last-child{color:var(--sub);font-variant-numeric:tabular-nums}.progress{height:8px;margin-top:9px;overflow:hidden;border-radius:999px;background:#eef0f3}.progress i{display:block;height:100%;border-radius:inherit;background:var(--blue)}.empty{padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--sub)}.proposal{font-weight:600}.badge{display:inline-flex;align-items:center;min-height:28px;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap}.badge-planned{color:var(--sub);background:#f7f7f7;border:1px solid var(--line)}.badge-progress{color:var(--blue);background:#eef4ff;border:1px solid #b8ceff}.badge-done{color:var(--success);background:var(--success-bg);border:1px solid #9bddc2}.badge-blocked{color:var(--danger);background:var(--danger-bg);border:1px solid #efb4ba}.badge-pending{color:var(--warning);background:var(--warning-bg);border:1px solid #f1cf61}.number{font-variant-numeric:tabular-nums}.roi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}.roi-card{padding:20px;border:1px solid var(--line);border-radius:16px}.roi-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.roi-score{color:var(--blue);font-size:26px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}.roi-formula{margin:16px 0 12px;color:var(--sub);font-size:13px}.metric{display:grid;grid-template-columns:64px 1fr 24px;align-items:center;gap:8px;margin-top:8px;font-size:13px}.metric .progress{margin:0;height:6px}.metric.cost .progress i{background:#f4b000}.phase-list{display:grid;gap:12px}.phase{border:1px solid var(--line);border-radius:16px;background:#fff}.phase[open]{box-shadow:var(--shadow)}summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}.phase-title{font-weight:700}.phase-meta{display:flex;align-items:center;gap:12px;color:var(--sub);font-size:14px;font-variant-numeric:tabular-nums}.phase-tasks{padding:0 20px 16px;border-top:1px solid var(--line)}.task-row{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #eef0f3}.task-row:last-child{border-bottom:0}.footer{margin-top:28px;color:var(--sub);font-size:13px}@media(max-width:680px){main{padding-top:32px}.hero{display:block;margin-bottom:40px}.hero h1{font-size:26px}.task-now{display:inline-block;margin-top:20px}.section{margin-top:40px}.score-panel{grid-template-columns:1fr;gap:28px;padding:24px 20px}.category-grid{grid-template-columns:1fr;gap:18px}.roi-grid{grid-template-columns:1fr}.phase-meta{gap:8px}.task-row{grid-template-columns:64px 1fr}.task-row .badge{grid-column:2;justify-self:start}.task-row .caption{grid-column:2}.phase-tasks{padding:0 16px 12px}summary{padding:16px}.proposal{max-width:70%;text-align:right}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  </style>
</head>
<body>
  <main>
    <header class="hero"><div><p class="eyebrow">LA VIE BELLE · ENGINEERING</p><h1>개발 현황</h1><p>실행 상태와 AI 준비도는 작업 인덱스와 평가 결과를 바탕으로 표시합니다.</p></div><div class="task-now"><b>현재 작업</b><strong id="current-task">불러오는 중</strong></div></header>
    <section aria-labelledby="readiness-title"><div class="section-heading"><h2 id="readiness-title">AI 준비도</h2><p class="caption">반복 가능하고 안전한 변경을 위한 기준</p></div><div id="readiness" aria-live="polite"></div></section>
    <section class="section" aria-labelledby="proposal-title"><div class="section-heading"><h2 id="proposal-title">우선 개선안</h2><p class="caption">효과 대비 비용 순</p></div><div id="proposals"></div></section>
    <section class="section" aria-labelledby="task-title"><div class="section-heading"><h2 id="task-title">Phase 작업</h2><p class="caption">요약을 누르면 해당 작업을 볼 수 있어요</p></div><div id="tasks"></div></section>
    <p class="footer">라비에벨 개발 하네스 · 수치는 평가 JSON과 작업 인덱스에서 생성됩니다.</p>
  </main>
  <script type="application/json" id="dashboard-data">${encoded}</script>
  <script>
    const d=JSON.parse(document.getElementById('dashboard-data').textContent);
    const categoryNames={context:'문맥 탐색',workflow:'작업 결정성',verification:'검증과 CI',architecture:'아키텍처',isolation:'변경 격리',reproducibility:'환경 재현성',safety:'안전 경계'};
    const proposalNames={'Add a CI workflow invoking the same harness checks':'동일한 하네스 검사를 실행하는 CI 추가','Add a committed dependency lockfile':'의존성 잠금 파일 커밋'};
    const statusNames={proposed:'인터뷰 제안',planned:'실행 승인됨',in_progress:'진행 중',done:'완료',blocked:'차단됨',verification_pending:'검증 대기'};
    const escape=v=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
    const badge=s=>'<span class="badge badge-'+(s==='in_progress'?'progress':s==='done'?'done':s==='blocked'?'blocked':s==='verification_pending'?'pending':'planned')+'">'+escape(statusNames[s]||s)+'</span>';
    document.getElementById('current-task').textContent=d.execution.current_task||'없음';
    const readiness=document.getElementById('readiness');
    if(!d.report){readiness.innerHTML='<p class="empty">아직 AI 준비도 평가 결과가 없습니다. 평가를 실행하면 이곳에 표시됩니다.</p>'}else{const r=d.report;readiness.innerHTML='<div class="score-panel"><div><div class="score-value">'+escape(r.total_score)+' <small>/ 100</small></div><p class="score-meta">평가 기준 '+escape(r.rubric_version)+'<br>기준 커밋 '+escape(r.evaluated_commit)+'</p></div><div class="category-grid">'+r.categories.map(c=>{const ratio=Math.max(0,Math.min(100,(c.score/c.max_score)*100));return '<div class="category"><div class="category-top"><span>'+escape(categoryNames[c.id]||c.name)+'</span><span>'+escape(c.score)+' / '+escape(c.max_score)+'</span></div><div class="progress" aria-label="'+escape(categoryNames[c.id]||c.name)+' '+escape(c.score)+'점 / '+escape(c.max_score)+'점"><i style="width:'+ratio+'%"></i></div></div>'}).join('')+'</div></div>'}
    const proposals=d.report?.proposals||[];document.getElementById('proposals').innerHTML=proposals.length?'<div class="roi-grid">'+proposals.map(p=>{const impact=Number(p.impact),confidence=Number(p.confidence),cost=Number(p.cost);return '<article class="roi-card"><div class="roi-top"><div class="proposal">'+escape(proposalNames[p.title]||p.title)+'</div><div class="roi-score">'+escape(Number(p.roi).toFixed(2))+'</div></div><p class="roi-formula">ROI = 영향 × 확신 ÷ 비용 · '+badge('verification_pending')+'</p><div class="metric"><span>영향</span><div class="progress"><i style="width:'+impact*20+'%"></i></div><b>'+impact+'</b></div><div class="metric"><span>확신</span><div class="progress"><i style="width:'+confidence*20+'%"></i></div><b>'+confidence+'</b></div><div class="metric cost"><span>비용</span><div class="progress"><i style="width:'+cost*20+'%"></i></div><b>'+cost+'</b></div></article>'}).join('')+'</div>':'<p class="empty">현재 등록된 개선안이 없습니다.</p>';
    const phases=Object.values(d.execution.tasks.reduce((all,t)=>{(all[t.phase]??=[]).push(t);return all},{}));document.getElementById('tasks').innerHTML='<div class="phase-list">'+phases.map(group=>{const done=group.filter(t=>t.status==='done').length;const active=group.some(t=>t.id===d.execution.current_task);const phase=group[0].phase;return '<details class="phase"'+(active?' open':'')+'><summary><span><span class="phase-title">'+escape(phase)+' 단계</span><span class="caption"> · '+escape(group.length)+'개 작업</span></span><span class="phase-meta"><span>'+done+' / '+group.length+' 완료</span>'+badge(active?'in_progress':done===group.length?'done':'planned')+'</span></summary><div class="phase-tasks">'+group.map(t=>'<div class="task-row"><span class="number">'+escape(t.id)+'</span><span class="proposal">'+escape(t.title)+(t.blockers?.length?'<p class="caption">'+t.blockers.map(b=>escape('['+b.code+'] '+b.message)).join('<br>')+'</p>':'')+'</span>'+badge(t.status)+'</div>').join('')+'</div></details>'}).join('')+'</div>';
  </script>
</body>
</html>`;
mkdirSync(join(root, ".agents/dashboard"), { recursive: true });
writeFileSync(join(root, ".agents/dashboard/index.html"), html);
console.log(join(root, ".agents/dashboard/index.html"));
