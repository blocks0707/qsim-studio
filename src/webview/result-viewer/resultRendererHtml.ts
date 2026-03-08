import * as vscode from "vscode";
import { SimulationResult } from "../../providers/types";

export function getResultRendererHtml(
  webview: vscode.Webview,
  result: SimulationResult
): string {
  const nonce = getNonce();
  const resultJson = JSON.stringify(result);

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src data:;"/>
<title>Simulation Results</title>
<style nonce="${nonce}">
:root {
  --bg: var(--vscode-editor-background, #1e1e1e);
  --fg: var(--vscode-editor-foreground, #cccccc);
  --border: var(--vscode-panel-border, #444);
  --accent: var(--vscode-button-background, #0e639c);
  --accent-hover: var(--vscode-button-hoverBackground, #1177bb);
  --tab-bg: var(--vscode-tab-inactiveBackground, #2d2d2d);
  --tab-active: var(--vscode-tab-activeBackground, #1e1e1e);
  --badge: var(--vscode-badge-background, #4d4d4d);
  --badge-fg: var(--vscode-badge-foreground, #fff);
  --card-bg: var(--vscode-editorWidget-background, #252526);
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--fg); font-family:var(--vscode-font-family, system-ui); font-size:13px; padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.header h1 { font-size:16px; font-weight:600; }
.toolbar { display:flex; gap:6px; }
.toolbar button {
  background:var(--accent); color:#fff; border:none; padding:4px 10px;
  border-radius:3px; cursor:pointer; font-size:12px;
}
.toolbar button:hover { background:var(--accent-hover); }
.tabs { display:flex; gap:1px; border-bottom:1px solid var(--border); margin-bottom:12px; }
.tab {
  padding:6px 14px; cursor:pointer; background:var(--tab-bg);
  border:1px solid var(--border); border-bottom:none; border-radius:4px 4px 0 0;
  font-size:12px; color:var(--fg); opacity:0.7;
}
.tab.active { background:var(--tab-active); opacity:1; font-weight:600; }
.tab-content { display:none; }
.tab-content.active { display:block; }
.chart-container { width:100%; overflow-x:auto; }
svg text { fill:var(--fg); font-family:var(--vscode-font-family, system-ui); }
.bar-label { font-size:11px; text-anchor:middle; }
.axis-label { font-size:10px; }
.tooltip {
  position:absolute; background:var(--card-bg); border:1px solid var(--border);
  padding:4px 8px; border-radius:3px; font-size:11px; pointer-events:none;
  display:none; z-index:10;
}
.stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
.stat-card {
  background:var(--card-bg); border:1px solid var(--border);
  border-radius:4px; padding:12px;
}
.stat-card .label { font-size:11px; opacity:0.7; margin-bottom:4px; }
.stat-card .value { font-size:18px; font-weight:600; }
.stat-card .sub { font-size:11px; opacity:0.6; margin-top:2px; }
.sv-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:12px; }
.sv-bar { height:16px; border-radius:2px; min-width:1px; }
.sv-real { background:#4a9eff; }
.sv-imag { background:#c77dba; }
.phase-circle { width:20px; height:20px; border:1px solid var(--border); border-radius:50%; position:relative; }
.phase-line { position:absolute; top:50%; left:50%; width:8px; height:1px; background:var(--fg); transform-origin:left center; }
.no-data { padding:40px; text-align:center; opacity:0.5; }
</style>
</head>
<body>
<div class="header">
  <h1>Results — Job ${result.jobId.substring(0, 8)}…</h1>
  <div class="toolbar">
    <button id="btnCsv">📄 Export CSV</button>
    <button id="btnPng">🖼️ Export PNG</button>
  </div>
</div>
<div class="tabs">
  <div class="tab active" data-tab="histogram">Histogram</div>
  <div class="tab" data-tab="probability">Probability</div>
  <div class="tab" data-tab="statevector">State Vector</div>
  <div class="tab" data-tab="statistics">Statistics</div>
</div>
<div id="histogram" class="tab-content active"><div class="chart-container" id="histChart"></div></div>
<div id="probability" class="tab-content"><div class="chart-container" id="probChart"></div></div>
<div id="statevector" class="tab-content"><div id="svContent"></div></div>
<div id="statistics" class="tab-content"><div id="statsContent"></div></div>
<div class="tooltip" id="tooltip"></div>

<script nonce="${nonce}">
(function(){
const vscode = acquireVsCodeApi();
const result = ${resultJson};
const counts = result.counts;
const shots = result.shots;
const keys = Object.keys(counts).sort();
const maxCount = Math.max(...keys.map(k=>counts[k]));

// Tabs
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.tab).classList.add('active');
  });
});

// Tooltip
const tip = document.getElementById('tooltip');
function showTip(e,text){
  tip.style.display='block';
  tip.textContent=text;
  tip.style.left=(e.pageX+10)+'px';
  tip.style.top=(e.pageY-20)+'px';
}
function hideTip(){ tip.style.display='none'; }

// Bar chart SVG builder
function buildBarChart(container, labels, values, maxVal, formatLabel){
  const n = labels.length;
  const margin = {top:20,right:20,bottom:50,left:50};
  const barW = Math.max(20, Math.min(50, 600/n));
  const gap = Math.max(4, barW*0.2);
  const w = margin.left + n*(barW+gap) + margin.right;
  const h = 300;
  const plotH = h - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('id','activeChart');

  // Gradient
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
  grad.setAttribute('id','barGrad'); grad.setAttribute('x1','0'); grad.setAttribute('y1','1');
  grad.setAttribute('x2','0'); grad.setAttribute('y2','0');
  const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop');
  s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#6366f1');
  const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop');
  s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#818cf8');
  grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

  // Y axis ticks
  const ticks = 5;
  for(let i=0;i<=ticks;i++){
    const y = margin.top + plotH - (i/ticks)*plotH;
    const val = (maxVal*i/ticks);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',margin.left); line.setAttribute('x2',w-margin.right);
    line.setAttribute('y1',y); line.setAttribute('y2',y);
    line.setAttribute('stroke','var(--border)'); line.setAttribute('stroke-width','0.5');
    svg.appendChild(line);
    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x',margin.left-6); txt.setAttribute('y',y+3);
    txt.setAttribute('text-anchor','end'); txt.classList.add('axis-label');
    txt.textContent = formatLabel ? formatLabel(val) : Math.round(val).toString();
    svg.appendChild(txt);
  }

  // Bars
  labels.forEach((label,i)=>{
    const val = values[i];
    const barH = maxVal > 0 ? (val/maxVal)*plotH : 0;
    const x = margin.left + i*(barW+gap) + gap/2;
    const y = margin.top + plotH - barH;

    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x',x); rect.setAttribute('y',y);
    rect.setAttribute('width',barW); rect.setAttribute('height',barH);
    rect.setAttribute('fill','url(#barGrad)'); rect.setAttribute('rx','2');
    rect.style.cursor='pointer';
    rect.addEventListener('mousemove',e=>showTip(e, label+': '+(formatLabel?formatLabel(val):val)));
    rect.addEventListener('mouseleave',hideTip);
    svg.appendChild(rect);

    // Value on top
    const vt = document.createElementNS('http://www.w3.org/2000/svg','text');
    vt.setAttribute('x',x+barW/2); vt.setAttribute('y',y-4);
    vt.classList.add('bar-label');
    vt.textContent = formatLabel ? formatLabel(val) : val.toString();
    svg.appendChild(vt);

    // X label
    const xt = document.createElementNS('http://www.w3.org/2000/svg','text');
    xt.setAttribute('x',x+barW/2); xt.setAttribute('y',margin.top+plotH+16);
    xt.classList.add('bar-label');
    xt.textContent = label;
    svg.appendChild(xt);
  });

  // Shots badge
  const badge = document.createElementNS('http://www.w3.org/2000/svg','text');
  badge.setAttribute('x',w-margin.right); badge.setAttribute('y',margin.top-4);
  badge.setAttribute('text-anchor','end'); badge.classList.add('axis-label');
  badge.textContent = 'shots: '+shots;
  svg.appendChild(badge);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Histogram
buildBarChart(
  document.getElementById('histChart'),
  keys, keys.map(k=>counts[k]), maxCount, null
);

// Probability
const probs = keys.map(k=>counts[k]/shots);
const maxProb = Math.max(...probs);
buildBarChart(
  document.getElementById('probChart'),
  keys, probs, maxProb, v=>v.toFixed(4)
);

// State Vector
const svDiv = document.getElementById('svContent');
if(result.stateVector && result.stateVector.length > 0){
  const sv = result.stateVector;
  const maxAmp = Math.max(...sv.map(c=>Math.sqrt(c[0]*c[0]+c[1]*c[1])), 0.001);
  const barMax = 200;
  let html = '<div style="padding:8px;">';
  sv.forEach((c,i)=>{
    const re=c[0], im=c[1];
    const amp = Math.sqrt(re*re+im*im);
    const phase = Math.atan2(im,re);
    const bits = i.toString(2).padStart(Math.ceil(Math.log2(sv.length||2)),'0');
    const reW = Math.abs(re)/maxAmp*barMax;
    const imW = Math.abs(im)/maxAmp*barMax;
    html += '<div class="sv-row">';
    html += '<span style="min-width:40px;font-family:monospace;">|'+bits+'⟩</span>';
    html += '<div class="sv-bar sv-real" style="width:'+reW+'px" title="Re: '+re.toFixed(4)+'"></div>';
    html += '<div class="sv-bar sv-imag" style="width:'+imW+'px" title="Im: '+im.toFixed(4)+'"></div>';
    html += '<span style="min-width:60px;">amp: '+amp.toFixed(4)+'</span>';
    html += '<div class="phase-circle"><div class="phase-line" style="transform:rotate('+(-phase*180/Math.PI)+'deg)"></div></div>';
    html += '<span>φ: '+(phase*180/Math.PI).toFixed(1)+'°</span>';
    html += '</div>';
  });
  html += '<div style="margin-top:10px;font-size:11px;opacity:0.6;"><span class="sv-bar sv-real" style="width:12px;display:inline-block;"></span> Real &nbsp; <span class="sv-bar sv-imag" style="width:12px;display:inline-block;"></span> Imaginary</div>';
  html += '</div>';
  svDiv.innerHTML = html;
} else {
  svDiv.innerHTML = '<div class="no-data">State vector data not available.<br>Run simulation with statevector backend to see this tab.</div>';
}

// Statistics
const statsDiv = document.getElementById('statsContent');
const uniqueResults = keys.length;
const sortedByCount = keys.slice().sort((a,b)=>counts[b]-counts[a]);
const mostCommon = sortedByCount[0];
const leastCommon = sortedByCount[sortedByCount.length-1];
// Shannon entropy
let entropy = 0;
keys.forEach(k=>{
  const p = counts[k]/shots;
  if(p>0) entropy -= p * Math.log2(p);
});

let statsHtml = '<div class="stats-grid">';
statsHtml += card('Total Shots', shots.toLocaleString(), '');
statsHtml += card('Unique Results', uniqueResults.toString(), 'out of '+Math.pow(2,result.metadata?.qubits||1)+' possible');
statsHtml += card('Most Common', '|'+mostCommon+'⟩', counts[mostCommon]+' counts ('+(counts[mostCommon]/shots*100).toFixed(1)+'%)');
statsHtml += card('Least Common', '|'+leastCommon+'⟩', counts[leastCommon]+' counts ('+(counts[leastCommon]/shots*100).toFixed(1)+'%)');
statsHtml += card('Shannon Entropy', entropy.toFixed(4)+' bits', 'max: '+Math.log2(uniqueResults).toFixed(4)+' bits');
if(result.metadata){
  const m = result.metadata;
  statsHtml += card('Qubits', m.qubits.toString(), '');
  statsHtml += card('Circuit Depth', m.depth.toString(), '');
  statsHtml += card('Gate Count', m.gateCount.toString(), '');
  if(m.executionTimeMs !== undefined){
    statsHtml += card('Execution Time', m.executionTimeMs+'ms', (m.executionTimeMs/1000).toFixed(2)+'s');
  }
}
statsHtml += '</div>';
statsDiv.innerHTML = statsHtml;

function card(label, value, sub){
  return '<div class="stat-card"><div class="label">'+label+'</div><div class="value">'+value+'</div>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>';
}

// Export CSV
document.getElementById('btnCsv').addEventListener('click',()=>{
  let csv = 'state,count,probability\\n';
  keys.forEach(k=>{
    csv += k+','+counts[k]+','+(counts[k]/shots).toFixed(6)+'\\n';
  });
  vscode.postMessage({type:'exportCsv',data:csv});
});

// Export PNG
document.getElementById('btnPng').addEventListener('click',()=>{
  const svgEl = document.getElementById('activeChart');
  if(!svgEl){return;}
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement('canvas');
  const w = parseInt(svgEl.getAttribute('width')||'600');
  const h = parseInt(svgEl.getAttribute('height')||'300');
  canvas.width = w*2; canvas.height = h*2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2,2);
  const img = new Image();
  img.onload = ()=>{
    ctx.fillStyle='#1e1e1e';
    ctx.fillRect(0,0,w,h);
    ctx.drawImage(img,0,0);
    vscode.postMessage({type:'exportPng',data:canvas.toDataURL('image/png')});
  };
  img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svgData)));
});

})();
</script>
</body>
</html>`;
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
