// ============================================================
// MAIN APPLICATION CONTROLLER
// ============================================================

import { Store } from './store.js';
import { renderTimeline, renderLegend } from './timeline.js';
import {
  showTaskDialog,
  showConferenceDialog,
  renderHistoryPanel,
  renderSettingsPanel,
  showToast,
} from './ui.js';

class App {
  constructor() {
    this.store = new Store();
    this.elements = {};
    this._init();
  }

  _init() {
    // Cache DOM elements
    this.elements = {
      timelineContainer: document.getElementById('timeline-container'),
      legendPanel: document.getElementById('legend-panel'),
      historyPanel: document.getElementById('history-panel'),
      settingsPanel: document.getElementById('settings-panel'),
      btnAddTask: document.getElementById('btn-add-task'),
      btnAddConf: document.getElementById('btn-add-conference'),
      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnHistory: document.getElementById('btn-history'),
      btnSettings: document.getElementById('btn-settings'),
      btnImport: document.getElementById('btn-import'),
      btnExport: document.getElementById('btn-export'),
    };

    // Bind toolbar buttons
    this.elements.btnAddTask.addEventListener('click', () => this._addTask());
    this.elements.btnAddConf.addEventListener('click', () => this._addConference());
    this.elements.btnUndo.addEventListener('click', () => this._undo());
    this.elements.btnRedo.addEventListener('click', () => this._redo());
    this.elements.btnHistory.addEventListener('click', () => this._toggleHistory());
    this.elements.btnSettings.addEventListener('click', () => this._toggleSettings());
    this.elements.btnImport.addEventListener('click', () => this._triggerImport());
    this.elements.btnExport.addEventListener('click', () => this._exportJSON());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this._handleKeyboard(e));

    // Listen for store changes
    this.store.onChange(() => this._render());

    // Apply cell width from settings
    this._applyCellWidth();

    // Initial render
    this._render();
    this._updateUndoRedoButtons();
  }

  _applyCellWidth() {
    const settings = this.store.getSettings();
    document.documentElement.style.setProperty('--timeline-cell-width', `${settings.timelineCellWidth}px`);

    if (settings.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }

  _render() {
    this._applyCellWidth();

    // Render main timeline
    renderTimeline(this.elements.timelineContainer, this.store, {
      'edit-task': (id) => this._editTask(id),
      'delete-task': (id) => this._deleteTask(id),
      'edit-conf': (id) => this._editConference(id),
      'delete-conf': (id) => this._deleteConference(id),
    });

    // Render legend
    const settings = this.store.getSettings();
    if (settings.showLegend) {
      this.elements.legendPanel.classList.remove('hidden');
      renderLegend(this.elements.legendPanel, this.store.getColors());
    } else {
      this.elements.legendPanel.classList.add('hidden');
    }

    // Update undo/redo state
    this._updateUndoRedoButtons();

    // Update history panel if visible
    if (!this.elements.historyPanel.classList.contains('hidden')) {
      renderHistoryPanel(this.elements.historyPanel, this.store, (id) => this._revertHistory(id));
    }
  }

  _updateUndoRedoButtons() {
    this.elements.btnUndo.disabled = !this.store.canUndo();
    this.elements.btnRedo.disabled = !this.store.canRedo();
    this.elements.btnUndo.classList.toggle('btn-disabled', !this.store.canUndo());
    this.elements.btnRedo.classList.toggle('btn-disabled', !this.store.canRedo());
  }

  // ---- Task Operations ----

  async _addTask() {
    const result = await showTaskDialog(this.store);
    if (result === 'added') {
      showToast('Task added');
    }
  }

  async _editTask(id) {
    const result = await showTaskDialog(this.store, id);
    if (result === 'updated') {
      showToast('Task updated');
    } else if (result === 'deleted') {
      showToast('Task deleted');
    }
  }

  async _deleteTask(id) {
    const task = this.store.getTaskById(id);
    if (!task) return;

    // Use the dialog's built-in delete via edit
    const result = await showTaskDialog(this.store, id);
    if (result === 'deleted') {
      showToast('Task deleted');
    } else if (result === 'updated') {
      showToast('Task updated');
    }
  }

  // ---- Conference Operations ----

  async _addConference() {
    const result = await showConferenceDialog(this.store);
    if (result === 'added') {
      showToast('Conference added');
    }
  }

  async _editConference(id) {
    const result = await showConferenceDialog(this.store, id);
    if (result === 'updated') {
      showToast('Conference updated');
    } else if (result === 'deleted') {
      showToast('Conference deleted');
    }
  }

  async _deleteConference(id) {
    const result = await showConferenceDialog(this.store, id);
    if (result === 'deleted') {
      showToast('Conference deleted');
    } else if (result === 'updated') {
      showToast('Conference updated');
    }
  }

  // ---- History / Undo / Redo ----

  _undo() {
    if (this.store.undo()) {
      showToast('Undone');
    }
  }

  _redo() {
    if (this.store.redo()) {
      showToast('Redone');
    }
  }

  _toggleHistory() {
    const panel = this.elements.historyPanel;
    const settingsPanel = this.elements.settingsPanel;

    // Close settings if open
    if (!settingsPanel.classList.contains('hidden')) {
      settingsPanel.classList.add('hidden');
    }

    panel.classList.toggle('hidden');

    if (!panel.classList.contains('hidden')) {
      renderHistoryPanel(panel, this.store, (id) => this._revertHistory(id));
    }
  }

  _revertHistory(id) {
    if (this.store.revertTo(id)) {
      showToast('Reverted to previous state');
    }
  }

  // ---- Settings ----

  _toggleSettings() {
    const panel = this.elements.settingsPanel;
    const historyPanel = this.elements.historyPanel;

    // Close history if open
    if (!historyPanel.classList.contains('hidden')) {
      historyPanel.classList.add('hidden');
    }

    panel.classList.toggle('hidden');

    if (!panel.classList.contains('hidden')) {
      renderSettingsPanel(panel, this.store, () => this._render());
    }
  }

  // ---- Import / Export ----

  _triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (this.store.importData(ev.target.result)) {
          showToast('Data imported successfully');
          this._render();
        } else {
          showToast('Import failed - invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  _exportJSON() {
    const data = this.store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported');
  }

  // ---- Keyboard Shortcuts ----

  _handleKeyboard(e) {
    // Don't handle shortcuts when modal is open or input is focused
    const overlay = document.getElementById('modal-overlay');
    if (overlay && !overlay.classList.contains('hidden')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this._redo();
      } else {
        this._undo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      this._redo();
    } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
      // 'n' for new task
      this._addTask();
    } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
      // 'c' for new conference
      this._addConference();
    } else if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
      this._toggleHistory();
    } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
      this._toggleSettings();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
