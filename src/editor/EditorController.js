import { UndoManager } from "./undoManager.js";
import {
  DeleteCharCommand,
  InsertCharCommand,
  InsertNewLineCommand,
  DeleteSelectionCommand,
  InsertTextCommand,
} from "./commands.js";
import { MouseHandler } from "./handlers/MouseHandler.js";
import { KeyboardHandler } from "./handlers/KeyboardHandler.js";
import { SearchHandler } from "./handlers/SearchHandler.js";

export class EditorController {
  constructor(model, view, wrapper, toolbar, fileManager) {
    this.model = model;
    this.view = view;
    this.container = view.container;
    this.toolbar = toolbar;
    this.fileManager = fileManager;

    this.container.tabIndex = 0; // Make focusable

    // Ensure container gets focus when clicked
    this.container.addEventListener('click', () => {
      this.container.focus();
    });

    this.container.focus();

    this.mouseHandler = new MouseHandler(this, this.container);
    this.keyBoardHandler = new KeyboardHandler(this, this.container);
    this.searchHandler = new SearchHandler(this, this.view, this.model);

    this.undoManager = new UndoManager();

    // Setup toolbar event handling
    this.setupToolbarHandlers();

    // Listen for global shortcuts
    window.addEventListener("keydown", this.onGlobalKeyDown);
  }

  onGlobalKeyDown = (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // File operations
    if (isCtrlOrCmd && e.key === "n") {
      e.preventDefault();
      this.handleNewFile();
      return;
    }

    if (isCtrlOrCmd && e.key === "o") {
      e.preventDefault();
      this.handleOpenFile();
      return;
    }

    if (isCtrlOrCmd && e.key === "s") {
      e.preventDefault();
      this.handleSaveFile();
      return;
    }

    // Search
    if (isCtrlOrCmd && e.key === "f") {
      e.preventDefault();
      this.view.showSearchWidget();
      this.view.searchWidget.querySelector(".search-input").focus();
      return;
    }

    // Undo/Redo
    if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      this.handleUndo();
      return;
    }

    if (isCtrlOrCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      this.handleRedo();
      return;
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
    // Ensure the editor container has focus after click
    this.container.focus();
  }

  viewToModelPos({ clientX, clientY }) {
    const lines = Array.from(this.container.querySelectorAll(".line"));
    if (lines.length === 0) return { line: 0, ch: 0 };

    const containerRect = this.container.getBoundingClientRect();
    
    // Handle coordinates way outside the viewport
    const maxDistance = 1000; // pixels
    let adjustedClientY = clientY;
    
    if (clientY < containerRect.top - maxDistance) {
      // Way above - go to document start
      return { line: 0, ch: 0 };
    } else if (clientY > containerRect.bottom + maxDistance) {
      // Way below - go to document end
      const lastLine = this.model.lines.length - 1;
      const lastLineText = this.model.lines[lastLine] || '';
      return { line: lastLine, ch: lastLineText.length };
    } else if (clientY < containerRect.top) {
      // Above the container - select first visible line
      adjustedClientY = containerRect.top + 5;
    } else if (clientY > containerRect.bottom) {
      // Below the container - select last visible line
      adjustedClientY = containerRect.bottom - 5;
    }

    let closestLineIdx = 0;
    let minLineDist = Infinity;

    // Find the line vertically closest to the click
    lines.forEach((lineEl, idx) => {
      const rect = lineEl.getBoundingClientRect();
      const lineCenterY = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(adjustedClientY - lineCenterY);
      if (dist < minLineDist) {
        minLineDist = dist;
        closestLineIdx = idx;
      }
    });

    const lineEl = lines[closestLineIdx];
    const lineRect = lineEl.getBoundingClientRect();
    
    // Handle horizontal bounds
    let adjustedClientX = clientX;
    if (clientX < lineRect.left) {
      // Left of the line - position at start
      return { line: this.view.startLine + closestLineIdx, ch: 0 };
    } else if (clientX > lineRect.right) {
      // Right of the line - position at end
      const lineText = this.model.lines[this.view.startLine + closestLineIdx] || '';
      return { line: this.view.startLine + closestLineIdx, ch: lineText.length };
    }

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

          const dist = Math.abs(adjustedClientX - x);
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

  setupToolbarHandlers() {
    if (!this.toolbar) return;

    this.toolbar.addEventListener('click', (e) => {
      const button = e.target.closest('.iconbtn');
      if (!button) return;

      const action = button.dataset.action;
      this.handleToolbarAction(action);
    });
  }

  async handleToolbarAction(action) {
    try {
      switch (action) {
        case 'new':
          this.handleNewFile();
          break;
        case 'open':
          await this.handleOpenFile();
          break;
        case 'save':
          this.handleSaveFile();
          // Focus editor after save
          this.container.focus();
          break;
        case 'export':
          this.handleExportFile();
          // Focus editor after export
          this.container.focus();
          break;
        case 'files':
          this.handleManageFiles();
          // Focus will be handled when modal closes
          break;
        case 'undo':
          this.handleUndo();
          this.container.focus();
          break;
        case 'redo':
          this.handleRedo();
          this.container.focus();
          break;
        case 'cut':
          await this.handleCut();
          this.container.focus();
          break;
        case 'copy':
          await this.handleCopy();
          this.container.focus();
          break;
        case 'paste':
          await this.handlePaste();
          this.container.focus();
          break;
        case 'search':
          this.handleSearch();
          // Search widget will handle its own focus
          break;
      }
    } catch (error) {
      console.error('Toolbar action failed:', error);
      alert('Operation failed: ' + error.message);
      // Focus editor even after errors
      this.container.focus();
    }
  }

  handleNewFile() {
    if (this.fileManager.hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Create new file anyway?')) {
        return;
      }
    }
    this.fileManager.newFile();
    this.focusEditor();
  }

  async handleOpenFile() {
    try {
      const result = await this.fileManager.importFile();
      this.focusEditor();
      console.log(`Opened file: ${result.fileName} (${result.size} bytes)`);
    } catch (error) {
      if (error.message !== 'No file selected') {
        throw error;
      }
    }
  }

  handleSaveFile() {
    const fileName = prompt('Enter filename:', this.fileManager.currentFileName);
    if (fileName) {
      this.fileManager.saveToLocalStorage(fileName);
      console.log(`Saved as: ${fileName}`);
    }
  }

  handleExportFile() {
    this.fileManager.exportFile();
  }

  handleManageFiles() {
    this.showFileManager();
  }

  handleUndo() {
    const command = this.undoManager.undo();
    if (command) {
      command.undo(this.model);
      this.view.render();
    }
  }

  handleRedo() {
    const command = this.undoManager.redo();
    if (command) {
      command.execute(this.model);
      this.view.render();
    }
  }

  async handleCut() {
    if (this.model.hasSelection()) {
      const text = this.model.getSelectedText();
      await navigator.clipboard.writeText(text);
      this.executeCommand(new DeleteSelectionCommand());
    }
  }

  async handleCopy() {
    if (this.model.hasSelection()) {
      const text = this.model.getSelectedText();
      await navigator.clipboard.writeText(text);
    }
  }

  async handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.executeCommand(new InsertTextCommand(text));
      }
    } catch (error) {
      console.error('Paste failed:', error);
    }
  }

  handleSearch() {
    this.view.showSearchWidget();
    this.view.searchWidget.querySelector('.search-input').focus();
  }

  showFileManager() {
    // Create a simple file manager modal
    const modal = document.createElement('div');
    modal.className = 'file-manager-modal';
    modal.innerHTML = `
      <div class="file-manager-content">
        <h3>Manage Files</h3>
        <div class="file-list"></div>
        <div class="file-manager-actions">
          <button class="btn" data-action="close">Close</button>
        </div>
      </div>
    `;

    const fileList = modal.querySelector('.file-list');
    const savedFiles = this.fileManager.getSavedFiles();

    if (Object.keys(savedFiles).length === 0) {
      fileList.innerHTML = '<p>No saved files</p>';
    } else {
      Object.entries(savedFiles).forEach(([fileName, fileData]) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
          <span class="file-name">${fileName}</span>
          <span class="file-date">${new Date(fileData.timestamp).toLocaleString()}</span>
          <button class="btn-small" data-action="load" data-filename="${fileName}">Load</button>
          <button class="btn-small btn-danger" data-action="delete" data-filename="${fileName}">Delete</button>
        `;
        fileList.appendChild(fileItem);
      });
    }

    modal.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const fileName = e.target.dataset.filename;

      if (action === 'close') {
        document.body.removeChild(modal);
        // Restore focus to editor when modal closes
        this.container.focus();
      } else if (action === 'load') {
        if (this.fileManager.loadFromLocalStorage(fileName)) {
          this.focusEditor();
          document.body.removeChild(modal);
        }
      } else if (action === 'delete') {
        if (confirm(`Delete file "${fileName}"?`)) {
          this.fileManager.deleteFromLocalStorage(fileName);
          this.showFileManager(); // Refresh the modal
          document.body.removeChild(modal);
          // Focus will be handled by the new modal
        }
      }
    });

    document.body.appendChild(modal);
  }

  // Ensure editor is focused and ready for input
  focusEditor() {
    this.container.focus();
    // Force a re-render to ensure cursor is visible
    this.view.render();
  }
}
