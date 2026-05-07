/**
 * UndoManager — Simple command-history undo/redo system.
 * Max 50 entries. Each command is { execute(), undo(), label }.
 */

class UndoManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.pointer = -1;
    this.maxHistory = maxHistory;
  }

  /**
   * Execute a command and push it onto the history stack.
   * @param {{ execute: Function, undo: Function, label: string }} command
   */
  execute(command) {
    command.execute();
    // Discard any redo entries after current pointer
    this.history = this.history.slice(0, this.pointer + 1);
    this.history.push(command);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.pointer++;
    }
    this._notify();
  }

  /**
   * Push a command without executing it (for actions already performed).
   */
  push(command) {
    this.history = this.history.slice(0, this.pointer + 1);
    this.history.push(command);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.pointer++;
    }
    this._notify();
  }

  undo() {
    if (this.pointer < 0) return null;
    const command = this.history[this.pointer];
    command.undo();
    this.pointer--;
    this._notify();
    return command;
  }

  redo() {
    if (this.pointer >= this.history.length - 1) return null;
    this.pointer++;
    const command = this.history[this.pointer];
    command.execute();
    this._notify();
    return command;
  }

  canUndo() { return this.pointer >= 0; }
  canRedo() { return this.pointer < this.history.length - 1; }

  clear() {
    this.history = [];
    this.pointer = -1;
    this._notify();
  }

  _notify() {
    document.dispatchEvent(new CustomEvent('undo-state-changed', {
      detail: { canUndo: this.canUndo(), canRedo: this.canRedo() }
    }));
  }
}

export const undoManager = new UndoManager();
