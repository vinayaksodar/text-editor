import { UndoManager } from "./undoManager";
import {
  DeleteCharCommand,
  InsertCharCommand,
  InsertNewLineCommand,
  DeleteSelectionCommand,
  InsertTextCommand,
} from "./commands";
import { MouseHandler } from "./handlers/MouseHandler";
import { KeyboardHandler } from "./handlers/KeyboardHandler";
import { SearchHandler } from "./handlers/SearchHandler";

export class EditorController {
  constructor(model, view, wrapper) {
    this.model = model;
    this.view = view;
    this.container = view.container;
    this.toolbar = toolbar;

    this.container.tabIndex = 0; // Make focusable

    this.container.focus();

    this.mouseHandler = new MouseHandler(this, this.container);
    this.keyBoardHandler = new KeyboardHandler(this, this.container);
    this.searchHandler = new SearchHandler(this, this.view, this.model);

    this.undoManager = new UndoManager();

    // Listen for global shortcuts
    window.addEventListener("keydown", this.onGlobalKeyDown);
  }

  onGlobalKeyDown = (e) => {
    // Ctrl+F or Cmd+F → Show Search
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      this.view.showSearchWidget();
      this.view.searchWidget.querySelector(".search-input").focus();
    }

    // Escape → Hide Search and focus editor
    if (e.key === "Escape") {
      this.view.hideSearchWidget();
      this.view.container.focus();
    }
  };

  handleClick({ clientPos }) {
    this.model.clearSelection();
    const { line, ch } = this.viewToModelPos(clientPos);
    this.model.updateCursor({ line, ch });
    this.view.render();
  }

  viewToModelPos({ clientX, clientY }) {
    const lines = Array.from(this.container.querySelectorAll(".line"));
    if (lines.length === 0) return { line: 0, ch: 0 };

    let closestLineIdx = 0;
    let minLineDist = Infinity;

    // Find the line vertically closest to the click
    lines.forEach((lineEl, idx) => {
      const rect = lineEl.getBoundingClientRect();
      const lineCenterY = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(clientY - lineCenterY);
      if (dist < minLineDist) {
        minLineDist = dist;
        closestLineIdx = idx;
      }
    });

    const lineEl = lines[closestLineIdx];
    const walker = document.createTreeWalker(
      lineEl,
      NodeFilter.SHOW_TEXT,
      null
    );
    const range = document.createRange();

    let closestCh = 0;
    let totalOffset = 0;
    let minDist = Infinity;

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const len = textNode.length;

      for (let i = 0; i <= len; i++) {
        try {
          range.setStart(textNode, 0);
          range.setEnd(textNode, i);
          const rect = range.getBoundingClientRect();
          const x = rect.left + (rect.width || 0);

          const dist = Math.abs(clientX - x);
          if (dist < minDist) {
            minDist = dist;
            closestCh = totalOffset + i;
          }
        } catch (_) {
          // Skip invalid positions
        }
      }

      totalOffset += len;
    }

    return { line: this.view.startLine + closestLineIdx, ch: closestCh };
  }
}
