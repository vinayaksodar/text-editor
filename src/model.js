export class EditorModel {
  constructor(text = "") {
    this.lines = text.split("\n");
    this.cursor = { line: 0, ch: 0 };
    this.selection = null; // {start:{line,ch}, end:{line,ch}}
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

  // Insert a new line at the current cursor position
  insertNewLine() {
    const { line, ch } = this.cursor;
    const currentLine = this.lines[line];
    const before = currentLine.slice(0, ch);
    const after = currentLine.slice(ch);
    this.lines.splice(line, 1, before, after);
    this.cursor.line++;
    this.cursor.ch = 0; // Move cursor to the start of the new line
  }

  setSelection(start, end) {
    this.selection = { start, end };
  }

  // just clear the selection without actually deleting it from the model
  clearSelection() {
    this.selection = null;
  }

  hasSelection() {
    return (
      this.selection &&
      this.selection.start &&
      this.selection.end &&
      (this.selection.start.line !== this.selection.end.line ||
        this.selection.start.ch !== this.selection.end.ch)
    );
  }

  getSelectedText() {
    if (!this.hasSelection()) return "";
    const { start, end } = this.normalizeSelection();
    const lines = this.lines.slice(start.line, end.line + 1);

    if (lines.length === 1) {
      return lines[0].slice(start.ch, end.ch);
    }

    lines[0] = lines[0].slice(start.ch);
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, end.ch);
    return lines.join("\n");
  }

  // switch start and end if selection is done by moving cursor up ie. start > end
  normalizeSelection() {
    const { start, end } = this.selection;
    if (
      start.line < end.line ||
      (start.line === end.line && start.ch <= end.ch)
    ) {
      return { start, end };
    }
    return { start: end, end: start };
  }

  insertText(text) {
    if (this.hasSelection()) this.deleteSelection(); // In case the user has selected text and is replacing it with paste command

    const linesToInsert = text.split("\n");
    if (linesToInsert.length === 1) {
      this.insertChar(linesToInsert[0]);
      return;
    }

    const { line, ch } = this.cursor;
    const curentLine = this.linesToInsert[line];
    const before = currentLine.slice(0, ch); // the content on the starting line which is not part of the selection
    const after = currentLine.slice(ch);

    const newLines = [
      before + linesToInsert[0],
      ...linesToInsert.slice(1, -1),
      after + linesToInsert.at(-1) + after,
    ];
    this.lines.splice(line, 1, ...newLines);

    this.cursor.line += linesToInsert.length - 1;
    this.cursor.ch = linesToInsert.at(-1).length;
  }

  deleteSelection() {
    const { start, end } = this.normalizeSelection();
    const beforeSelInLine = this.lines[start.line].slice(0, start.ch);
    const afterSelInLine = this.lines[end.line].slice(end.ch);

    if (start.line == end.line) {
      this.lines[start.line] = beforeSelInLine + afterSelInLine;
    } else {
      this.lines.splice(
        start.line,
        end.line - start.line + 1,
        beforeSelInLine + afterSelInLine
      );
    }
    this.cursor = { ...start }; //make sure to pass a copy of start and not reference the start object itself
    this.clearSelection();
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

  updateCursor({ line, ch }) {
    this.cursor.line = line;
    this.cursor.ch = ch;
  }
}
