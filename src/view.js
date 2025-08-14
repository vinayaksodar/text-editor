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

    this.cursorEl.style.display = "block";

    this.model.lines.forEach((text, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "line";

      // Empty lines → zero-width space for cursor positioning
      if (!text) {
        if (sel && idx >= sel.start.line && idx <= sel.end.line) {
          // Entire empty line is selected
          const span = document.createElement("span");
          span.className = "selection";
          span.appendChild(document.createTextNode("\u200B"));
          lineEl.appendChild(span);
        } else {
          lineEl.appendChild(document.createTextNode("\u200B"));
        }
        this.container.appendChild(lineEl);
        return;
      }

      // Lines with possible selection
      if (sel && idx >= sel.start.line && idx <= sel.end.line) {
        const startCh = idx === sel.start.line ? sel.start.ch : 0;
        const endCh = idx === sel.end.line ? sel.end.ch : text.length;

        const before = text.slice(0, startCh);
        const selected = text.slice(startCh, endCh);
        const after = text.slice(endCh);

        if (before) {
          lineEl.appendChild(document.createTextNode(before));
        }
        if (selected) {
          const span = document.createElement("span");
          span.className = "selection";
          span.appendChild(document.createTextNode(selected));
          lineEl.appendChild(span);
        }
        if (after) {
          lineEl.appendChild(document.createTextNode(after));
        }
      } else {
        // No selection in this line
        lineEl.appendChild(document.createTextNode(text));
      }

      this.container.appendChild(lineEl);
    });

    this.updateCursor();
  }

  updateCursor() {
    const { line, ch } = this.model.cursor;
    const lineEl = this.container.children[line + 1]; // +1 for cursorEl
    if (!lineEl) return;

    const walker = document.createTreeWalker(
      lineEl,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let remaining = ch;
    let targetNode = null;
    let offset = 0;

    while (walker.nextNode()) {
      const len = walker.currentNode.textContent.length;

      if (remaining <= len) {
        targetNode = walker.currentNode;
        offset = remaining;
        break;
      }

      remaining -= len;
    }

    if (!targetNode) {
      // If cursor is at end of line
      if (walker.currentNode) {
        targetNode = walker.currentNode;
        offset = targetNode.textContent.length;
      } else {
        // Line is empty → create a text node to put cursor into
        const emptyNode = document.createTextNode("\u200B");
        lineEl.appendChild(emptyNode);
        targetNode = emptyNode;
        offset = 0;
      }
    }

    const range = document.createRange();
    range.setStart(targetNode, offset);
    range.setEnd(targetNode, offset);

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
