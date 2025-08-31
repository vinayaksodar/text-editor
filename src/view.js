export class EditorView {
  constructor(model, container, widgetLayer) {
    this.model = model;
    this.container = container;
    this.widgetLayer = widgetLayer;

    this.searchMatches = [];

    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "cursor";
    container.appendChild(this.cursorEl);

    this.cursorBlinkInterval = null;
    this.cursorBlinkTimeout = null;

    this.startBlink(); // Start blinking when editor first loads
  }

  highlightMatches(ranges, currentIndex = -1) {
    this.searchMatches = ranges;
    this.currentMatchIndex = currentIndex;
    this.render();
  }

  clearHighlights() {
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    this.render();
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

      // Collect matches for this line
      const lineMatches = this.searchMatches.filter((m) => m.line === idx);

      if (!text) {
        // Empty line handling
        if (sel && idx >= sel.start.line && idx <= sel.end.line) {
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

      // If no matches & no selection → render plain text
      if (!sel && lineMatches.length === 0) {
        lineEl.appendChild(document.createTextNode(text));
        this.container.appendChild(lineEl);
        return;
      }

      // General case: split by selection & search matches
      let pos = 0;
      const pushText = (str) => {
        if (str) lineEl.appendChild(document.createTextNode(str));
      };

      // Collect markers
      const markers = [];

      if (sel && idx >= sel.start.line && idx <= sel.end.line) {
        markers.push({
          start: sel.start.line === idx ? sel.start.ch : 0,
          end: sel.end.line === idx ? sel.end.ch : text.length,
          type: "selection",
        });
      }

      lineMatches.forEach((m, i) => {
        markers.push({
          start: m.start,
          end: m.end,
          type:
            this.currentMatchIndex >= 0 &&
            this.searchMatches[this.currentMatchIndex] === m
              ? "search-match-current"
              : "search-match",
        });
      });

      // If no markers, render plain text
      if (markers.length === 0) {
        lineEl.appendChild(document.createTextNode(text));
        this.container.appendChild(lineEl);
        return;
      }

      // Build open/close events
      const events = [];
      markers.forEach((m) => {
        events.push({ pos: m.start, type: m.type, open: true });
        events.push({ pos: m.end, type: m.type, open: false });
      });

      // Sort by pos (close before open at same index to avoid empty spans)
      events.sort((a, b) => a.pos - b.pos || (a.open ? -1 : 1));

      // Sweep
      let active = [];
      let lastPos = 0;

      const flushSegment = (from, to) => {
        if (from >= to) return;
        const segText = text.slice(from, to);

        if (active.length === 0) {
          lineEl.appendChild(document.createTextNode(segText));
          return;
        }

        // Nest spans according to active order
        let node = document.createTextNode(segText);
        for (let i = active.length - 1; i >= 0; i--) {
          const span = document.createElement("span");
          span.className = active[i];
          span.appendChild(node);
          node = span;
        }
        lineEl.appendChild(node);
      };

      for (const ev of events) {
        flushSegment(lastPos, ev.pos);

        if (ev.open) active.push(ev.type);
        else active = active.filter((t) => t !== ev.type);

        lastPos = ev.pos;
      }

      flushSegment(lastPos, text.length);

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

  // Add a method for showing search widget
  showSearchWidget() {
    let widget = this.widgetLayer.querySelector(".search-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.className = "search-widget";
      widget.innerHTML = `
        <input type="text" placeholder="Find..." />
        <button>Next</button>
        <button>Prev</button>
      `;
      this.widgetLayer.appendChild(widget);
    }
    widget.style.display = "block";
    widget.querySelector("input").focus();
  }

  hideSearchWidget() {
    const widget = this.widgetLayer.querySelector(".search-widget");
    if (widget) widget.style.display = "none";
  }
}
