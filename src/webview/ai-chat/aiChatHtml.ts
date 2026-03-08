export function getAIChatHtml(nonce: string, cspSource: string): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style nonce="${nonce}">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background, var(--vscode-editor-background));
      display: flex; flex-direction: column; height: 100vh;
    }
    #quick-prompts {
      display: flex; flex-wrap: wrap; gap: 4px; padding: 8px;
      border-bottom: 1px solid var(--vscode-panel-border, #333);
    }
    .quick-btn {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ccc);
      border: none; border-radius: 12px; padding: 4px 10px;
      font-size: 11px; cursor: pointer; white-space: nowrap;
    }
    .quick-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #505357);
    }
    #messages {
      flex: 1; overflow-y: auto; padding: 8px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .msg {
      padding: 8px 10px; border-radius: 8px; max-width: 95%;
      line-height: 1.45; word-wrap: break-word; white-space: pre-wrap;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
    }
    .msg.assistant {
      align-self: flex-start;
      background: var(--vscode-editorWidget-background, #252526);
    }
    .msg code {
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      padding: 1px 4px; border-radius: 3px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.92em;
    }
    .code-block-wrap { position: relative; margin: 6px 0; }
    .code-block-wrap pre {
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      padding: 8px; border-radius: 4px; overflow-x: auto;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.9em; line-height: 1.4;
    }
    .insert-btn {
      position: absolute; top: 4px; right: 4px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      border: none; border-radius: 3px; padding: 2px 8px;
      font-size: 10px; cursor: pointer; opacity: 0.7;
    }
    .insert-btn:hover { opacity: 1; }
    .typing { align-self: flex-start; padding: 8px 14px; }
    .typing span {
      display: inline-block; width: 6px; height: 6px; margin: 0 2px;
      background: var(--vscode-foreground); border-radius: 50%;
      animation: bounce 1.2s infinite;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }
    #input-area {
      display: flex; gap: 4px; padding: 8px;
      border-top: 1px solid var(--vscode-panel-border, #333);
    }
    #input-area textarea {
      flex: 1; resize: none; min-height: 34px; max-height: 120px;
      background: var(--vscode-input-background, #3c3c3c);
      color: var(--vscode-input-foreground, #ccc);
      border: 1px solid var(--vscode-input-border, #555);
      border-radius: 4px; padding: 6px 8px;
      font-family: var(--vscode-font-family); font-size: var(--vscode-font-size);
    }
    #input-area textarea:focus { outline: 1px solid var(--vscode-focusBorder); }
    #send-btn {
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      border: none; border-radius: 4px; padding: 0 14px;
      cursor: pointer; font-size: 14px;
    }
    #send-btn:hover { background: var(--vscode-button-hoverBackground, #1177bb); }
    #send-btn:disabled { opacity: 0.5; cursor: default; }
    .empty-state {
      flex: 1; display: flex; align-items: center; justify-content: center;
      color: var(--vscode-descriptionForeground); font-size: 13px; text-align: center; padding: 20px;
    }
  </style>
</head>
<body>
  <div id="quick-prompts">
    <button class="quick-btn" data-prompt="이 회로를 설명해줘">🔍 회로 설명</button>
    <button class="quick-btn" data-prompt="이 코드를 최적화해줘">⚡ 코드 최적화</button>
    <button class="quick-btn" data-prompt="이 에러를 해결하는 방법을 알려줘">🐛 에러 도움</button>
    <button class="quick-btn" data-prompt="Explain this quantum algorithm step by step">📚 알고리즘 설명</button>
  </div>
  <div id="messages">
    <div class="empty-state">QSim AI Assistant<br/>양자 컴퓨팅에 대해 물어보세요!</div>
  </div>
  <div id="input-area">
    <textarea id="input" rows="1" placeholder="메시지를 입력하세요..."></textarea>
    <button id="send-btn">▶</button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    let isEmpty = true;

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function renderMarkdown(text) {
      // Code blocks
      let html = escapeHtml(text);
      html = html.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, (_, lang, code) => {
        const id = 'cb-' + Math.random().toString(36).slice(2, 8);
        return '<div class="code-block-wrap"><button class="insert-btn" data-code-id="' + id + '">Insert</button><pre id="' + id + '">' + code + '</pre></div>';
      });
      // Inline code
      html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
      // Bold
      html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      return html;
    }

    function addMessage(role, text) {
      if (isEmpty) { messagesEl.innerHTML = ''; isEmpty = false; }
      const div = document.createElement('div');
      div.className = 'msg ' + role;
      if (role === 'assistant') {
        div.innerHTML = renderMarkdown(text);
      } else {
        div.textContent = text;
      }
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    let typingEl = null;
    function showTyping() {
      if (typingEl) return;
      typingEl = document.createElement('div');
      typingEl.className = 'msg assistant typing';
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function hideTyping() {
      if (typingEl) { typingEl.remove(); typingEl = null; }
    }

    function send(text) {
      const msg = (text || inputEl.value).trim();
      if (!msg) return;
      inputEl.value = '';
      inputEl.style.height = 'auto';
      addMessage('user', msg);
      showTyping();
      sendBtn.disabled = true;
      vscode.postMessage({ type: 'send', text: msg });
    }

    sendBtn.addEventListener('click', () => send());
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    document.getElementById('quick-prompts').addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-btn');
      if (btn) send(btn.dataset.prompt);
    });

    messagesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.insert-btn');
      if (btn) {
        const pre = document.getElementById(btn.dataset.codeId);
        if (pre) vscode.postMessage({ type: 'insertCode', code: pre.textContent });
      }
    });

    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'response') {
        hideTyping();
        sendBtn.disabled = false;
        addMessage('assistant', msg.text);
      } else if (msg.type === 'error') {
        hideTyping();
        sendBtn.disabled = false;
        addMessage('assistant', '⚠️ Error: ' + msg.text);
      } else if (msg.type === 'setInput') {
        inputEl.value = msg.text;
        inputEl.dispatchEvent(new Event('input'));
        inputEl.focus();
      }
    });

    inputEl.focus();
  </script>
</body>
</html>`;
}
