export class MouseHandler {
  constructor(controller, container) {
    this.controller = controller;
    this.container = container;

    // existing state...
    this.mouseDown = false;
    this.drag = false;
    this.dragThreshold = 5;
    this.dragStartModelPos = null;
    this.mouseDownPos = { clientX: 0, clientY: 0 };

    this.pendingRenderFrame = null;
    this.pendingSelection = null;

    // --- touch/long-press state ---
    this.activeTouchId = null;
    this.longPressTimer = null;
    this.selectionMode = false; // true only after long press
    this.touchStartPos = null;

    // tuning knobs
    this.LONG_PRESS_MS = 400; // time to hold before selection
    this.TAP_MAX_MOVE = 8; // px allowed before we treat as scroll

    this.attachEvents();
  }

  attachEvents() {
    // Mouse
    this.container.addEventListener("mousedown", this.onMouseDown);
    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("mouseup", this.onMouseUp);

    // Touch (note: touchmove must be passive:false if we might call preventDefault)
    this.container.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    });
    this.container.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });
    this.container.addEventListener("touchend", this.onTouchEnd);
    this.container.addEventListener("touchcancel", this.onTouchCancel);
  }

  // Attach both mouse and touch global listeners during drags
  attachGlobalEvents() {
    document.addEventListener("mousemove", this.onGlobalMouseMove);
    document.addEventListener("mouseup", this.onGlobalMouseUp);

    document.addEventListener("touchmove", this.onGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.onGlobalTouchEnd);
    document.addEventListener("touchcancel", this.onGlobalTouchCancel);
  }

  detachGlobalEvents() {
    document.removeEventListener("mousemove", this.onGlobalMouseMove);
    document.removeEventListener("mouseup", this.onGlobalMouseUp);

    document.removeEventListener("touchmove", this.onGlobalTouchMove);
    document.removeEventListener("touchend", this.onGlobalTouchEnd);
    document.removeEventListener("touchcancel", this.onGlobalTouchCancel);
  }

  // --------------------
  // Mouse (unchanged)
  // --------------------
  onMouseDown = (e) => {
    e.preventDefault();

    this.detachGlobalEvents();

    this.mouseDown = true;
    this.drag = false;
    this.mouseDownPos = { clientX: e.clientX, clientY: e.clientY };
    this.dragStartModelPos = this.controller.viewToModelPos(this.mouseDownPos);

    this.attachGlobalEvents();

    this.dragTimeout = setTimeout(() => {
      if (this.mouseDown) {
        console.warn("Drag operation timed out, cleaning up");
        this.endDragOperation({ clientX: 0, clientY: 0 });
      }
    }, 10000);
  };

  onMouseMove = (e) => this.handleMouseMove(e);
  onMouseUp = (e) => this.endDragOperation(e);
  onGlobalMouseMove = (e) => this.handleMouseMove(e);
  onGlobalMouseUp = (e) => this.endDragOperation(e);

  // --------------------
  // Touch helpers
  // --------------------
  getActiveTouch(e) {
    if (this.activeTouchId == null) return e.touches[0] || e.changedTouches[0];
    // find the touch with the same identifier
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.activeTouchId) return e.touches[i];
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId)
        return e.changedTouches[i];
    }
    return e.touches[0] || e.changedTouches[0];
  }

  dist(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  beginLongPressSelection() {
    if (this.selectionMode) return;

    this.selectionMode = true;
    this.mouseDown = true; // reuse existing drag code path
    this.drag = true;

    this.dragStartModelPos = this.controller.viewToModelPos(this.touchStartPos);

    // once we enter selection, we manage globally
    this.attachGlobalEvents();
  }

  clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // --------------------
  // Touch handlers
  // --------------------
  onTouchStart = (e) => {
    if (e.touches.length > 1) {
      // multi-touch: treat as gesture (pinch/zoom) — do nothing
      this.cancelTouchFlow();
      return;
    }

    const t = e.touches[0];
    this.activeTouchId = t.identifier;
    this.touchStartPos = { clientX: t.clientX, clientY: t.clientY };
    this.selectionMode = false;

    // Start long-press timer — do NOT preventDefault here so page can scroll if user moves
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      // Only start selection if the finger hasn't moved much
      if (!this.touchStartPos) return;
      this.beginLongPressSelection();
    }, this.LONG_PRESS_MS);
  };

  onTouchMove = (e) => {
    const t = this.getActiveTouch(e);
    if (!t) return;

    const pos = { clientX: t.clientX, clientY: t.clientY };
    console.log(pos);

    if (!this.selectionMode) {
      // Before long-press triggers:
      // If user moves too much, assume they’re scrolling → cancel long-press.
      if (this.dist(pos, this.touchStartPos) > this.TAP_MAX_MOVE) {
        this.clearLongPressTimer();
        // Do not preventDefault → allow natural scrolling
      }
      return;
    }

    // We are in selection mode (long-press was triggered):
    // Block page scroll and route to drag logic.
    e.preventDefault();

    // Reuse the existing drag path
    this.handleMouseMove(pos);
  };

  onTouchEnd = (e) => {
    const t = this.getActiveTouch(e);
    const pos = t
      ? { clientX: t.clientX, clientY: t.clientY }
      : this.touchStartPos;

    // If long-press never triggered and movement stayed small → tap = caret placement
    if (!this.selectionMode) {
      this.clearLongPressTimer();

      if (pos) {
        // Place caret where the user tapped
        this.controller.handleClick({ clientPos: pos });
        // Ensure the hidden input gets focus for typing
        if (this.controller.hiddenInput) this.controller.hiddenInput.focus();
      }

      this.cancelTouchFlow();
      return;
    }

    // If selection mode is active, end the drag selection
    e.preventDefault();
    this.endDragOperation(pos); // accepts {clientX, clientY}
    this.cancelTouchFlow();
  };

  onTouchCancel = (e) => {
    // If selection is active, treat cancel as end (don't drop it abruptly)
    if (this.selectionMode) {
      const t = this.getActiveTouch(e);
      const pos = t
        ? { clientX: t.clientX, clientY: t.clientY }
        : this.touchStartPos;
      this.endDragOperation(pos);
    }

    this.cancelTouchFlow();
  };

  onGlobalTouchMove = (e) => {
    const t = this.getActiveTouch(e);
    if (!t) return;
    if (!this.selectionMode) return;
    e.preventDefault();
    this.handleMouseMove({ clientX: t.clientX, clientY: t.clientY });
  };

  onGlobalTouchEnd = (e) => {
    const t = this.getActiveTouch(e);
    const pos = t
      ? { clientX: t.clientX, clientY: t.clientY }
      : this.touchStartPos;
    if (this.selectionMode) {
      e.preventDefault();
      this.endDragOperation(pos);
    }
    this.cancelTouchFlow();
  };

  onGlobalTouchCancel = () => {
    this.cancelTouchFlow();
  };

  cancelTouchFlow() {
    this.clearLongPressTimer();
    this.selectionMode = false;
    this.activeTouchId = null;
    this.touchStartPos = null;
    // Don’t forcibly reset mouseDown here; endDragOperation will handle when needed
  }

  // --------------------
  // Existing selection pipeline
  // --------------------
  handleMouseMove(e) {
    if (!this.mouseDown) return;

    const cur = "clientX" in e ? e : { clientX: e.clientX, clientY: e.clientY };
    const dx = cur.clientX - this.mouseDownPos.clientX;
    const dy = cur.clientY - this.mouseDownPos.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!this.drag && distance > this.dragThreshold) {
      this.drag = true;
    }

    if (this.drag) {
      this.pendingSelection = {
        startModelPos: this.dragStartModelPos,
        endClientPos: { clientX: cur.clientX, clientY: cur.clientY },
      };
      this.scheduleRenderSelection();
    }
  }

  endDragOperation(e) {
    // e can be {clientX, clientY} from touch
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }

    this.detachGlobalEvents();

    const wasMouseDown = this.mouseDown;
    const wasDragging = this.drag;

    this.mouseDown = false;
    this.drag = false;
    this.dragStartModelPos = null;

    if (wasMouseDown && !wasDragging && e && "clientX" in e) {
      // Click (mouse) — touch taps are handled in onTouchEnd before we reach here
      this.controller.handleClick({
        clientPos: { clientX: e.clientX, clientY: e.clientY },
      });
    }

    this.pendingSelection = null;
    if (this.pendingRenderFrame) {
      cancelAnimationFrame(this.pendingRenderFrame);
      this.pendingRenderFrame = null;
    }

    // reset touch selection flag after finishing
    this.selectionMode = false;
  }

  scheduleRenderSelection() {
    if (this.pendingRenderFrame) return;

    this.pendingRenderFrame = requestAnimationFrame(() => {
      this.pendingRenderFrame = null;

      if (!this.pendingSelection) return;

      const { startModelPos, endClientPos } = this.pendingSelection;

      const endModelPos = this.controller.viewToModelPos(endClientPos);
      this.controller.model.setSelection(startModelPos, endModelPos);
      this.controller.model.updateCursor(endModelPos);
      this.controller.view.render();
    });
  }

  destroy() {
    // Mouse
    this.container.removeEventListener("mousedown", this.onMouseDown);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("mouseup", this.onMouseUp);

    // Touch
    this.container.removeEventListener("touchstart", this.onTouchStart);
    this.container.removeEventListener("touchmove", this.onTouchMove);
    this.container.removeEventListener("touchend", this.onTouchEnd);
    this.container.removeEventListener("touchcancel", this.onTouchCancel);

    this.detachGlobalEvents();

    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.pendingRenderFrame) {
      cancelAnimationFrame(this.pendingRenderFrame);
      this.pendingRenderFrame = null;
    }
  }
}
