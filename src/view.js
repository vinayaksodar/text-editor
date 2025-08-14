export class EditorView {
  constructor(model, container) {
    this.model = model;
    this.container = container;
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "cursor";
    container.appendChild(this.cursorEl);

    this.cursorBlinkInterval = null;
    this.cursorBlinkTimeout = null;

    this.startBlink(); // Start blinking when editor first loads
  }

  render() {
    this.container.innerHTML = "";
    this.container.appendChild(this.cursorEl);

    const sel = this.model.hasSelection()
      ? this.model.normalizeSelection()
      : null;

    // Hide or show cursor based on selection state
    if (sel) {
      this.cursorEl.style.display = "none";
    } else {
      this.cursorEl.style.display = "block";
    }

    this.model.lines.forEach((text, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "line";

      if (sel && idx >= sel.start.line && idx <= sel.end.line) {
        const startCh = idx === sel.start.line ? sel.start.ch : 0;
        const endCh = idx === sel.end.line ? sel.end.ch : text.length;

        const before = text.slice(0, startCh);
        const selected = text.slice(startCh, endCh);
        const after = text.slice(endCh);

        // Anytime we deal with direct HTML best to escape it to prevent xss attack
        lineEl.innerHTML =
          escapeHtml(before) +
          `<span class="selection">${escapeHtml(selected)}</span>` +
          escapeHtml(after);
      } else {
        lineEl.textContent = text || "\u200B";
      }

      this.container.appendChild(lineEl);
    });

    // Only update cursor if it's visible
    if (!sel) {
      this.updateCursor();
    }
  }

  updateCursor() {
    const { line, ch } = this.model.cursor;
    const lineEl = this.container.children[line + 1]; // +1 for cursorEl
    if (!lineEl) return;

    const range = document.createRange();
    const textNode = lineEl.firstChild;
    const pos = Math.min(ch, textNode?.length || 0);

    try {
      range.setStart(textNode, pos);
      range.setEnd(textNode, pos);
    } catch (_) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    this.cursorEl.style.top = `${rect.top - containerRect.top}px`;
    this.cursorEl.style.left = `${rect.left - containerRect.left}px`;
    this.cursorEl.style.height = `${rect.height}px`;

    this.pauseBlinkAndRestart();
  }

  startBlink() {
    if (this.cursorBlinkInterval) clearInterval(this.cursorBlinkInterval);

    this.cursorEl.style.visibility = "visible";

    this.cursorBlinkInterval = setInterval(() => {
      const isVisible = this.cursorEl.style.visibility !== "hidden";
      this.cursorEl.style.visibility = isVisible ? "hidden" : "visible";
    }, 500);
  }

  pauseBlinkAndRestart() {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }

    this.cursorEl.style.visibility = "visible";

    if (this.cursorBlinkTimeout) clearTimeout(this.cursorBlinkTimeout);
    this.cursorBlinkTimeout = setTimeout(() => {
      this.startBlink();
    }, 500); // start blinking again after delay
  }
}

// move this to a seperate utils file/folder later
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
