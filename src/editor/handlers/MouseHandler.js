export class MouseHandler {
  constructor(controller, container) {
    this.controller = controller;
    this.container = container;

    this.mouseDown = false;
    this.drag = false;
    this.dragThreshold = 5;
    this.dragStartModelPos = null;
    this.mouseDownPos = { clientX: 0, clientY: 0 };

    this.pendingRenderFrame = null;
    this.pendingSelection = null;

    this.attachEvents();
  }

  attachEvents() {
    this.container.addEventListener("mousedown", this.onMouseDown);
    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("mouseup", this.onMouseUp);
  }

  attachGlobalEvents() {
    // Add global listeners during drag operations
    document.addEventListener("mousemove", this.onGlobalMouseMove);
    document.addEventListener("mouseup", this.onGlobalMouseUp);
  }

  detachGlobalEvents() {
    // Remove global listeners when drag ends
    document.removeEventListener("mousemove", this.onGlobalMouseMove);
    document.removeEventListener("mouseup", this.onGlobalMouseUp);
  }

  onMouseDown = (e) => {
    e.preventDefault();
    
    // Clean up any previous drag state
    this.detachGlobalEvents();
    
    this.mouseDown = true;
    this.drag = false;
    this.mouseDownPos = { clientX: e.clientX, clientY: e.clientY };
    this.dragStartModelPos = this.controller.viewToModelPos(this.mouseDownPos);
    
    // Attach global listeners to handle mouse events outside the container
    this.attachGlobalEvents();
    
    // Safety timeout to prevent stuck drag state
    this.dragTimeout = setTimeout(() => {
      if (this.mouseDown) {
        console.warn('Drag operation timed out, cleaning up');
        this.endDragOperation({ clientX: 0, clientY: 0 });
      }
    }, 10000); // 10 second timeout
  };

  onMouseMove = (e) => {
    this.handleMouseMove(e);
  };

  onMouseUp = (e) => {
    this.endDragOperation(e);
  };

  onGlobalMouseMove = (e) => {
    // Handle mouse move events globally during drag operations
    this.handleMouseMove(e);
  };

  onGlobalMouseUp = (e) => {
    // Handle mouse up events globally during drag operations
    this.endDragOperation(e);
  };

  handleMouseMove(e) {
    if (!this.mouseDown) return;

    const dx = e.clientX - this.mouseDownPos.clientX;
    const dy = e.clientY - this.mouseDownPos.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!this.drag && distance > this.dragThreshold) {
      this.drag = true;
    }

    if (this.drag) {
      this.pendingSelection = {
        startModelPos: this.dragStartModelPos,
        endClientPos: { clientX: e.clientX, clientY: e.clientY },
      };
      this.scheduleRenderSelection();
    }
  }

  endDragOperation(e) {
    // Clear safety timeout
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }
    
    // Detach global listeners first
    this.detachGlobalEvents();

    const wasMouseDown = this.mouseDown;
    const wasDragging = this.drag;

    this.mouseDown = false;
    this.drag = false;
    this.dragStartModelPos = null;

    if (wasMouseDown && !wasDragging) {
      // This was a click, not a drag
      this.controller.handleClick({
        clientPos: { clientX: e.clientX, clientY: e.clientY },
      });
    }

    // Clean up pending operations
    this.pendingSelection = null;
    if (this.pendingRenderFrame) {
      cancelAnimationFrame(this.pendingRenderFrame);
      this.pendingRenderFrame = null;
    }
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

  // Cleanup method to remove all event listeners
  destroy() {
    this.container.removeEventListener("mousedown", this.onMouseDown);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("mouseup", this.onMouseUp);
    this.detachGlobalEvents();
    
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }
    
    if (this.pendingRenderFrame) {
      cancelAnimationFrame(this.pendingRenderFrame);
      this.pendingRenderFrame = null;
    }
  }
}
