export class EditorController {
  constructor(model, view, container) {
    this.model = model;
    this.view = view;
    this.container = container;

    this.container.tabIndex = 0; // Make focusable
    this.container.addEventListener("keydown", this.onKeyDown.bind(this));
    this.container.focus();
  }

  onKeyDown(e) {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this.model.insertChar(e.key);
    } else if (e.key === "Backspace") {
      this.model.deleteChar();
    } else if (e.key === "ArrowLeft") {
      this.model.moveCursor("left");
    } else if (e.key === "ArrowRight") {
      this.model.moveCursor("right");
    } else if (e.key === "ArrowUp") {
      this.model.moveCursor("up");
    } else if (e.key === "ArrowDown") {
      this.model.moveCursor("down");
    } else {
      return;
    }

    e.preventDefault();
    this.view.render();
  }
}
