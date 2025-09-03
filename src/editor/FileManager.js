export class FileManager {
  constructor(model) {
    this.model = model;
    this.currentFileName = "untitled.txt";
    this.autoSaveInterval = null;
    this.autoSaveDelay = 2000; // 2 seconds
    this.lastSaveTime = Date.now();
    
    // Start auto-save
    this.startAutoSave();
  }

  // Auto-save functionality
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.autoSaveToLocalStorage();
    }, this.autoSaveDelay);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  autoSaveToLocalStorage() {
    const content = this.model.getText();
    const saveData = {
      content,
      fileName: this.currentFileName,
      timestamp: Date.now(),
      cursor: { ...this.model.cursor },
      selection: this.model.selection ? { ...this.model.selection } : null
    };
    
    localStorage.setItem('editor-autosave', JSON.stringify(saveData));
    this.lastSaveTime = Date.now();
  }

  // Load from auto-save
  loadFromAutoSave() {
    try {
      const saved = localStorage.getItem('editor-autosave');
      if (saved) {
        const saveData = JSON.parse(saved);
        this.model.setText(saveData.content);
        this.currentFileName = saveData.fileName || "untitled.txt";
        
        // Restore cursor and selection
        if (saveData.cursor) {
          this.model.updateCursor(saveData.cursor);
        }
        if (saveData.selection) {
          this.model.setSelection(saveData.selection.start, saveData.selection.end);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
    }
    return false;
  }

  // Manual save to localStorage with custom name
  saveToLocalStorage(fileName = null) {
    if (fileName) {
      this.currentFileName = fileName;
    }
    
    const content = this.model.getText();
    const saveData = {
      content,
      fileName: this.currentFileName,
      timestamp: Date.now(),
      cursor: { ...this.model.cursor },
      selection: this.model.selection ? { ...this.model.selection } : null
    };
    
    // Save to named slot
    const savedFiles = this.getSavedFiles();
    savedFiles[this.currentFileName] = saveData;
    localStorage.setItem('editor-saved-files', JSON.stringify(savedFiles));
    
    return this.currentFileName;
  }

  // Get all saved files from localStorage
  getSavedFiles() {
    try {
      const saved = localStorage.getItem('editor-saved-files');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to get saved files:', error);
      return {};
    }
  }

  // Load specific file from localStorage
  loadFromLocalStorage(fileName) {
    try {
      const savedFiles = this.getSavedFiles();
      const fileData = savedFiles[fileName];
      
      if (fileData) {
        this.model.setText(fileData.content);
        this.currentFileName = fileName;
        
        // Restore cursor and selection
        if (fileData.cursor) {
          this.model.updateCursor(fileData.cursor);
        }
        if (fileData.selection) {
          this.model.setSelection(fileData.selection.start, fileData.selection.end);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
    return false;
  }

  // Delete file from localStorage
  deleteFromLocalStorage(fileName) {
    try {
      const savedFiles = this.getSavedFiles();
      delete savedFiles[fileName];
      localStorage.setItem('editor-saved-files', JSON.stringify(savedFiles));
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  // Export file (download)
  exportFile(fileName = null, content = null) {
    const finalFileName = fileName || this.currentFileName;
    const finalContent = content || this.model.getText();
    
    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import file (upload)
  importFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.js,.ts,.jsx,.tsx,.css,.html,.md,.json,.xml,.csv,.log';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          this.model.setText(content);
          this.currentFileName = file.name;
          
          // Reset cursor to beginning
          this.model.updateCursor({ line: 0, ch: 0 });
          this.model.clearSelection();
          
          resolve({
            fileName: file.name,
            content: content,
            size: file.size
          });
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    });
  }

  // Create new file
  newFile() {
    this.model.setText("");
    this.currentFileName = "untitled.txt";
    this.model.updateCursor({ line: 0, ch: 0 });
    this.model.clearSelection();
  }

  // Get current file info
  getCurrentFileInfo() {
    return {
      fileName: this.currentFileName,
      content: this.model.getText(),
      size: this.model.getText().length,
      lines: this.model.lines.length,
      lastSaved: this.lastSaveTime
    };
  }

  // Check if file has unsaved changes
  hasUnsavedChanges() {
    try {
      const saved = localStorage.getItem('editor-autosave');
      if (!saved) return true;
      
      const saveData = JSON.parse(saved);
      return saveData.content !== this.model.getText();
    } catch (error) {
      return true;
    }
  }
}