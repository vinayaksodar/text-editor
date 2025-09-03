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

  onMouseDown = (e) => {
    e.preventDefault();
    this.mouseDown = true;
    this.drag = false;
    this.mouseDownPos = { clientX: e.clientX, clientY: e.clientY };
    this.dragStartModelPos = this.controller.viewToModelPos(this.mouseDownPos);
  };

  onMouseMove = (e) => {
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
  };

  onMouseUp = (e) => {
    this.mouseDown = false;

    if (!this.drag) {
      this.controller.handleClick({
        clientPos: { clientX: e.clientX, clientY: e.clientY },
      });
    }

    this.pendingSelection = null;
    this.pendingRenderFrame = null;
    this.drag = false;
    this.dragStartModelPos = null;
  };

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
}
