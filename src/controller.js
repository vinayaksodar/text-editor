import { UndoManager } from "./undoManager";
import {
  DeleteCharCommand,
  InsertCharCommand,
  InsertNewLineCommand,
  DeleteSelectionCommand,
  InsertTextCommand,
} from "./commands";
export class EditorController {
  constructor(model, view, container) {
    this.model = model;
    this.view = view;
    this.container = container;

    this.container.tabIndex = 0; // Make focusable
    this.container.addEventListener("keydown", this.onKeyDown.bind(this));
    this.container.focus();

    // Initial state
    this.drag = false;
    this.mouseDown = false;
    this.mouseDownPos = { clientX: 0, clientY: 0 };
    this.dragThreshold = 5;
    this.pendingRenderFrame = null;
    this.pendingSelection = null;

    this.container.addEventListener("mousedown", (e) => {
      this.mouseDown = true;
      this.drag = false;
      this.mouseDownPos = { clientX: e.clientX, clientY: e.clientY };
    });

    this.container.addEventListener("mousemove", (e) => {
      if (!this.mouseDown) return;

      const dx = e.clientX - this.mouseDownPos.clientX;
      const dy = e.clientY - this.mouseDownPos.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!this.drag && distance > this.dragThreshold) {
        this.drag = true;
      }

      if (this.drag) {
        this.pendingSelection = {
          startClientPos: this.mouseDownPos,
          endClientPos: { clientX: e.clientX, clientY: e.clientY },
        };
        this.scheduleRenderSelection(); // request safe render
      }
    });

    this.container.addEventListener("mouseup", (e) => {
      this.mouseDown = false;

      if (!this.drag) {
        this.handleClick({
          clientPos: { clientX: e.clientX, clientY: e.clientY },
        });
      }
      this.pendingSelection = null;
      this.pendingRenderFrame = null;
      this.drag = false;
    });

    this.undoManager = new UndoManager();
  }

  onKeyDown(e) {
    const isArrow =
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight";

    if (e.shiftKey && isArrow) {
      // Allow extending selection with arrow keys
      const dir = e.key.replace("Arrow", "").toLowerCase();
      this.model.extendSelection(dir);
      e.preventDefault();
      this.view.render();
      return;
    }

    if (this.model.hasSelection()) {
      // Don't allow typing while a selection exists
      if (e.key == "Backspace") {
        const cmd = new DeleteSelectionCommand(this.model);
        cmd.execute();
        this.undoManager.add(cmd);
      } else if (e.key === "Delete") {
        this.model.deleteSelection();
      } else if (e.key === "Escape") {
        this.model.clearSelection();
      } else if (e.key === "ArrowLeft") {
        this.model.moveCursorToSelectionStart();
      } else if (e.key === "ArrowRight") {
        this.model.moveCursorToSelectionEnd();
      }
    } else {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const cmd = new InsertCharCommand(this.model, this.model.cursor, e.key);
        cmd.execute();
        this.undoManager.add(cmd);
      } else if (e.key === "Enter") {
        const cmd = new InsertNewLineCommand(
          this.model,
          this.model.cursor,
          e.key
        );
        cmd.execute();
        this.undoManager.add(cmd);
      } else if (e.key === "Backspace") {
        const cmd = new DeleteCharCommand(this.model, this.model.cursor);
        cmd.execute();
        this.undoManager.add(cmd);
      } else if (e.key === "ArrowLeft") {
        this.model.moveCursor("left");
      } else if (e.key === "ArrowRight") {
        this.model.moveCursor("right");
      } else if (e.key === "ArrowUp") {
        this.model.moveCursor("up");
      } else if (e.key === "ArrowDown") {
        this.model.moveCursor("down");
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        this.undoManager.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        this.undoManager.redo();
      }
    }

    // --- CUT / COPY / PASTE ---
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      if (this.model.hasSelection()) {
        const text = this.model.getSelectedText();
        navigator.clipboard.writeText(text).catch(() => {
          // fallback to execCommand for older browsers
          document.execCommand("copy");
        });
      }
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
      if (this.model.hasSelection()) {
        const text = this.model.getSelectedText();
        navigator.clipboard.writeText(text).catch(() => {
          document.execCommand("cut");
        });
        const cmd = new DeleteSelectionCommand(this.model);
        cmd.execute();
        this.undoManager.add(cmd);
        this.view.render();
      }
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      navigator.clipboard.readText().then((text) => {
        if (!text) return;

        this.undoManager.endBatch(); // finalize any ongoing typing batch
        this.undoManager.beginBatch(); // start paste batch

        if (this.model.hasSelection()) {
          const delCmd = new DeleteSelectionCommand(this.model);
          delCmd.execute();
          this.undoManager.add(delCmd);
        }

        const insertCmd = new InsertTextCommand(this.model, text);
        insertCmd.execute();
        this.undoManager.add(insertCmd);

        this.undoManager.endBatch(); // finalize paste as one undo step

        this.view.render();
      });
      e.preventDefault();
      return;
    }
    // --- END CUT / COPY / PASTE ---

    e.preventDefault();
    this.view.render();
  }

  handleClick({ clientPos }) {
    this.model.clearSelection();
    const { line, ch } = this.viewToModelPos(clientPos);
    this.model.updateCursor({ line, ch });
    this.view.render();
  }

  // handleSelection({ startClientPos, endClientPos }) {
  //   const startModelPos = this.viewToModelPos(startClientPos);
  //   const endModelPos = this.viewToModelPos(endClientPos);
  //   console.log(startModelPos, endModelPos);
  //   this.model.setSelection(startModelPos, endModelPos);
  //   this.view.render();
  // }

  scheduleRenderSelection() {
    if (this.pendingRenderFrame) return;

    this.pendingRenderFrame = requestAnimationFrame(() => {
      this.pendingRenderFrame = null;

      if (!this.pendingSelection) return;

      const { startClientPos, endClientPos } = this.pendingSelection;
      const startModelPos = this.viewToModelPos(startClientPos);
      const endModelPos = this.viewToModelPos(endClientPos);
      this.model.setSelection(startModelPos, endModelPos);
      this.model.updateCursor(endModelPos);
      this.view.render();
    });
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

    return { line: closestLineIdx, ch: closestCh };
  }
}
