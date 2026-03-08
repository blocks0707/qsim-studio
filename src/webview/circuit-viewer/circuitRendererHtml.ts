import * as vscode from "vscode";
import { CircuitModel } from "../../circuit/types";

export function getCircuitRendererHtml(webview: vscode.Webview, model: CircuitModel): string {
  const nonce = getNonce();
  const modelJson = JSON.stringify(model);

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Circuit Viewer</title>
  <style nonce="${nonce}">
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #d4d4d4);
      font-family: var(--vscode-font-family, monospace);
      overflow: hidden;
      width: 100vw; height: 100vh;
    }
    #canvas { width: 100%; height: 100%; cursor: grab; }
    #canvas:active { cursor: grabbing; }
    #tooltip {
      position: fixed; display: none; pointer-events: none;
      background: var(--vscode-editorHoverWidget-background, #252526);
      border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
      color: var(--vscode-editorHoverWidget-foreground, #d4d4d4);
      padding: 4px 8px; border-radius: 4px; font-size: 12px;
      z-index: 100; white-space: pre;
    }
    #empty {
      display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 14px; opacity: 0.6;
    }
  </style>
</head>
<body>
  <div id="tooltip"></div>
  <svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>
  <div id="empty" style="display:none">No circuit to display</div>
  <script nonce="${nonce}">
  (function() {
    const model = ${modelJson};
    const svg = document.getElementById('canvas');
    const tooltip = document.getElementById('tooltip');
    const emptyDiv = document.getElementById('empty');

    if (!model || model.qubits === 0) {
      svg.style.display = 'none';
      emptyDiv.style.display = 'flex';
      return;
    }

    const GATE_W = 40, GATE_H = 36, COL_GAP = 56, ROW_GAP = 52;
    const LABEL_W = 50, PAD_TOP = 30, PAD_RIGHT = 40;
    const WIRE_COLOR = 'var(--vscode-editor-foreground, #d4d4d4)';
    const COLORS = {
      h: '#4a9eff', x: '#e74c3c', y: '#2ecc71', z: '#9b59b6',
      cx: '#e67e22', cz: '#e67e22', swap: '#e67e22',
      rx: '#4a9eff', ry: '#2ecc71', rz: '#9b59b6',
      measure: '#7f8c8d', barrier: '#7f8c8d', default: '#888'
    };

    const nq = model.qubits;
    const gates = model.gates;
    const ncols = gates.length;
    const totalW = LABEL_W + ncols * COL_GAP + PAD_RIGHT + 40;
    const totalH = PAD_TOP + nq * ROW_GAP + 20;

    function qY(q) { return PAD_TOP + q * ROW_GAP + ROW_GAP / 2; }
    function colX(c) { return LABEL_W + c * COL_GAP + COL_GAP / 2; }
    function color(name) { return COLORS[name] || COLORS.default; }

    let svgContent = '';
    function el(tag, attrs, inner) {
      let s = '<' + tag;
      for (const [k,v] of Object.entries(attrs||{})) s += ' ' + k + '="' + v + '"';
      if (inner !== undefined) s += '>' + inner + '</' + tag + '>';
      else s += '/>';
      return s;
    }

    // Qubit labels + wires
    for (let q = 0; q < nq; q++) {
      const y = qY(q);
      svgContent += el('text', { x: 10, y: y + 4, fill: WIRE_COLOR, 'font-size': 13 }, 'q\\u2080'.slice(0,1) + String.fromCharCode(0x2080 + q));
      svgContent += el('line', { x1: LABEL_W - 5, y1: y, x2: totalW - PAD_RIGHT, y2: y, stroke: WIRE_COLOR, 'stroke-width': 1, opacity: 0.4 });
    }

    // Classical bit wires (double line)
    if (model.classicalBits > 0) {
      const cy = PAD_TOP + nq * ROW_GAP + 10;
      svgContent += el('text', { x: 10, y: cy + 4, fill: WIRE_COLOR, 'font-size': 13, opacity: 0.5 }, 'c');
      svgContent += el('line', { x1: LABEL_W - 5, y1: cy - 1, x2: totalW - PAD_RIGHT, y2: cy - 1, stroke: WIRE_COLOR, 'stroke-width': 1, opacity: 0.25 });
      svgContent += el('line', { x1: LABEL_W - 5, y1: cy + 1, x2: totalW - PAD_RIGHT, y2: cy + 1, stroke: WIRE_COLOR, 'stroke-width': 1, opacity: 0.25 });
    }

    // Gates
    gates.forEach((g, ci) => {
      const x = colX(ci);
      const c = color(g.name);
      const dataAttr = 'data-gate="' + ci + '"';

      if (g.name === 'barrier') {
        for (const q of g.qubits) {
          svgContent += el('line', { x1: x, y1: qY(q) - ROW_GAP/2 + 4, x2: x, y2: qY(q) + ROW_GAP/2 - 4, stroke: c, 'stroke-width': 2, 'stroke-dasharray': '4,3', opacity: 0.6 });
        }
      } else if (g.name === 'cx' || g.name === 'cnot') {
        const ctrl = g.qubits[0], tgt = g.qubits[1];
        // vertical line
        svgContent += el('line', { x1: x, y1: qY(ctrl), x2: x, y2: qY(tgt), stroke: c, 'stroke-width': 2 });
        // control dot
        svgContent += '<circle cx="'+x+'" cy="'+qY(ctrl)+'" r="5" fill="'+c+'" '+dataAttr+' class="gate-el"/>';
        // target ⊕
        svgContent += '<circle cx="'+x+'" cy="'+qY(tgt)+'" r="12" fill="none" stroke="'+c+'" stroke-width="2" '+dataAttr+' class="gate-el"/>';
        svgContent += el('line', { x1: x, y1: qY(tgt)-12, x2: x, y2: qY(tgt)+12, stroke: c, 'stroke-width': 2 });
        svgContent += el('line', { x1: x-12, y1: qY(tgt), x2: x+12, y2: qY(tgt), stroke: c, 'stroke-width': 2 });
      } else if (g.name === 'cz') {
        const ctrl = g.qubits[0], tgt = g.qubits[1];
        svgContent += el('line', { x1: x, y1: qY(ctrl), x2: x, y2: qY(tgt), stroke: c, 'stroke-width': 2 });
        svgContent += '<circle cx="'+x+'" cy="'+qY(ctrl)+'" r="5" fill="'+c+'" '+dataAttr+' class="gate-el"/>';
        svgContent += '<circle cx="'+x+'" cy="'+qY(tgt)+'" r="5" fill="'+c+'" '+dataAttr+' class="gate-el"/>';
      } else if (g.name === 'measure') {
        const y = qY(g.qubits[0]);
        svgContent += '<rect x="'+(x-GATE_W/2)+'" y="'+(y-GATE_H/2)+'" width="'+GATE_W+'" height="'+GATE_H+'" rx="4" fill="'+c+'" opacity="0.15" stroke="'+c+'" stroke-width="1.5" '+dataAttr+' class="gate-el"/>';
        svgContent += el('text', { x: x, y: y+5, fill: c, 'font-size': 16, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'M');
        // line to classical
        if (model.classicalBits > 0 && g.classicalBits && g.classicalBits.length > 0) {
          const cy = PAD_TOP + nq * ROW_GAP + 10;
          svgContent += el('line', { x1: x, y1: y + GATE_H/2, x2: x, y2: cy, stroke: c, 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.5 });
        }
      } else {
        // Generic gate box
        const minQ = Math.min(...g.qubits), maxQ = Math.max(...g.qubits);
        if (g.qubits.length > 1 && g.name !== 'cx' && g.name !== 'cz') {
          svgContent += el('line', { x1: x, y1: qY(minQ), x2: x, y2: qY(maxQ), stroke: c, 'stroke-width': 2 });
        }
        for (const q of g.qubits) {
          const y = qY(q);
          const label = g.name.toUpperCase();
          const w = Math.max(GATE_W, label.length * 10 + 12);
          svgContent += '<rect x="'+(x-w/2)+'" y="'+(y-GATE_H/2)+'" width="'+w+'" height="'+GATE_H+'" rx="4" fill="'+c+'" opacity="0.15" stroke="'+c+'" stroke-width="1.5" '+dataAttr+' class="gate-el"/>';
          svgContent += el('text', { x: x, y: y+5, fill: c, 'font-size': 13, 'text-anchor': 'middle', 'font-weight': 'bold' }, label);
        }
      }
    });

    svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + (totalH + (model.classicalBits > 0 ? 30 : 0)));
    svg.innerHTML = svgContent;

    // Tooltip
    svg.addEventListener('mousemove', function(e) {
      const el = e.target.closest('.gate-el');
      if (!el) { tooltip.style.display = 'none'; return; }
      const gi = parseInt(el.getAttribute('data-gate'));
      if (isNaN(gi)) { tooltip.style.display = 'none'; return; }
      const g = model.gates[gi];
      let text = g.name.toUpperCase() + '\\nQubits: ' + g.qubits.join(', ');
      if (g.params && g.params.length) text += '\\nParams: ' + g.params.join(', ');
      if (g.classicalBits) text += '\\nClassical: ' + g.classicalBits.join(', ');
      tooltip.textContent = text;
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY + 12) + 'px';
    });
    svg.addEventListener('mouseleave', () => tooltip.style.display = 'none');

    // Pan & Zoom
    let viewBox = { x: 0, y: 0, w: totalW, h: totalH + (model.classicalBits > 0 ? 30 : 0) };
    let isPanning = false, startPt = { x: 0, y: 0 };

    function updateViewBox() {
      svg.setAttribute('viewBox', viewBox.x+' '+viewBox.y+' '+viewBox.w+' '+viewBox.h);
    }

    svg.addEventListener('wheel', function(e) {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * viewBox.w + viewBox.x;
      const my = (e.clientY - rect.top) / rect.height * viewBox.h + viewBox.y;
      viewBox.x = mx - (mx - viewBox.x) * scale;
      viewBox.y = my - (my - viewBox.y) * scale;
      viewBox.w *= scale;
      viewBox.h *= scale;
      updateViewBox();
    }, { passive: false });

    svg.addEventListener('mousedown', function(e) {
      isPanning = true;
      startPt = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mousemove', function(e) {
      if (!isPanning) return;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - startPt.x) / rect.width * viewBox.w;
      const dy = (e.clientY - startPt.y) / rect.height * viewBox.h;
      viewBox.x -= dx; viewBox.y -= dy;
      startPt = { x: e.clientX, y: e.clientY };
      updateViewBox();
    });
    window.addEventListener('mouseup', () => isPanning = false);
  })();
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
