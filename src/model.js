export class EditorModel {
  constructor(text = "") {
    this.lines = text.split("\n");
    this.cursor = { line: 0, ch: 0 };
  }

  insertChar(char) {
    const line = this.lines[this.cursor.line];
    const { ch } = this.cursor;
    this.lines[this.cursor.line] = line.slice(0, ch) + char + line.slice(ch);
    this.cursor.ch++;
  }

  deleteChar() {
    const { line, ch } = this.cursor;
    if (ch === 0 && line > 0) {
      const prev = this.lines[line - 1];
      const curr = this.lines[line];
      this.lines.splice(line, 1);
      this.lines[line - 1] = prev + curr;
      this.cursor.line--;
      this.cursor.ch = prev.length;
    } else if (ch > 0) {
      const l = this.lines[line];
      this.lines[line] = l.slice(0, ch - 1) + l.slice(ch);
      this.cursor.ch--;
    }
  }

  moveCursor(dir) {
    const { line, ch } = this.cursor;
    if (dir === "left") {
      if (ch > 0) this.cursor.ch--;
      else if (line > 0) {
        this.cursor.line--;
        this.cursor.ch = this.lines[this.cursor.line].length;
      }
    } else if (dir === "right") {
      if (ch < this.lines[line].length) this.cursor.ch++;
      else if (line < this.lines.length - 1) {
        this.cursor.line++;
        this.cursor.ch = 0;
      }
    } else if (dir === "up" && line > 0) {
      this.cursor.line--;
      this.cursor.ch = Math.min(
        this.cursor.ch,
        this.lines[this.cursor.line].length
      );
    } else if (dir === "down" && line < this.lines.length - 1) {
      this.cursor.line++;
      this.cursor.ch = Math.min(
        this.cursor.ch,
        this.lines[this.cursor.line].length
      );
    }
  }
}
