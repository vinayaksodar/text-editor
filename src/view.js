export class EditorView {
  constructor(model, container) {
    this.model = model;
    this.container = container;
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "cursor";
    container.appendChild(this.cursorEl);
  }

  render() {
    this.container.innerHTML = "";
    this.container.appendChild(this.cursorEl);

    this.model.lines.forEach((text, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "line";
      lineEl.textContent = text || "\u200B"; // zero-width space for empty lines
      this.container.appendChild(lineEl);
    });

    this.updateCursor();
  }

  updateCursor() {
    const { line, ch } = this.model.cursor;
    const lineEl = this.container.children[line + 1]; // +1 because of cursor element
    if (!lineEl) return;

    const range = document.createRange();
    const sel = window.getSelection();

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
  }
}
