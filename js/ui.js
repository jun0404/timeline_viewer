// ============================================================
// UI COMPONENTS MODULE - Modals, forms, panels
// ============================================================

import { DEFAULT_COLORS, DEFAULT_SETTINGS } from './store.js';

// ---- Modal System ----

function showModal(title, contentHtml, options = {}) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-content');

  let html = `<div class="modal-header">
    <h2>${escHtml(title)}</h2>
    <button class="modal-close" id="modal-close-btn">&times;</button>
  </div>`;
  html += `<div class="modal-body">${contentHtml}</div>`;

  if (options.footer !== false) {
    html += `<div class="modal-footer">`;
    if (options.showDelete) {
      html += `<button class="btn btn-danger" id="modal-delete-btn">Delete</button>`;
    }
    html += `<div class="modal-footer-right">`;
    html += `<button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>`;
    if (options.submitLabel !== false) {
      html += `<button class="btn btn-primary" id="modal-submit-btn">${options.submitLabel || 'Save'}</button>`;
    }
    html += `</div></div>`;
  }

  modal.innerHTML = html;
  modal.className = 'modal-content' + (options.wide ? ' modal-wide' : '');
  overlay.classList.remove('hidden');

  // Focus first input
  requestAnimationFrame(() => {
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  });

  return new Promise((resolve) => {
    const close = (result) => {
      overlay.classList.add('hidden');
      resolve(result);
    };

    document.getElementById('modal-close-btn').onclick = () => close(null);
    document.getElementById('modal-cancel-btn').onclick = () => close(null);

    const submitBtn = document.getElementById('modal-submit-btn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        if (options.onSubmit) {
          const result = options.onSubmit();
          if (result !== false) close(result);
        } else {
          close(true);
        }
      };
    }

    const deleteBtn = document.getElementById('modal-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => close('delete');
    }

    overlay.onclick = (e) => {
      if (e.target === overlay) close(null);
    };

    // Enter key submits, Escape closes
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        close(null);
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
}

// ---- Task Form ----

const TASK_STATUSES = ['ongoing', 'done', 'accepted', 'expected', 'rejected', 'postponed', 'cancelled'];

function buildTaskForm(task = null) {
  const t = task || {};
  return `
    <form id="task-form" class="form-grid">
      <div class="form-group">
        <label for="tf-professor">Professor</label>
        <input type="text" id="tf-professor" value="${escAttr(t.professor)}" placeholder="e.g., Dr. Smith" list="professor-list">
      </div>
      <div class="form-group">
        <label for="tf-area">Area</label>
        <input type="text" id="tf-area" value="${escAttr(t.area)}" placeholder="e.g., ML, NLP, CV" list="area-list">
      </div>
      <div class="form-group form-group-wide">
        <label for="tf-project">Project</label>
        <input type="text" id="tf-project" value="${escAttr(t.project)}" placeholder="Project name" list="project-list">
      </div>
      <div class="form-group form-group-wide">
        <label for="tf-task">Task</label>
        <input type="text" id="tf-task" value="${escAttr(t.task)}" placeholder="Task description" required>
      </div>
      <div class="form-group">
        <label for="tf-start">Start Date</label>
        <input type="date" id="tf-start" value="${escAttr(t.startDate)}">
      </div>
      <div class="form-group">
        <label for="tf-due">Due Date</label>
        <input type="date" id="tf-due" value="${escAttr(t.dueDate)}">
      </div>
      <div class="form-group">
        <label for="tf-finish">Finish Date</label>
        <input type="date" id="tf-finish" value="${escAttr(t.finishDate)}">
      </div>
      <div class="form-group">
        <label for="tf-status">Status</label>
        <select id="tf-status">
          ${TASK_STATUSES.map(s => `<option value="${s}" ${(t.status || 'ongoing').toLowerCase() === s ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
        </select>
      </div>
    </form>
  `;
}

function getTaskFormData() {
  return {
    professor: document.getElementById('tf-professor')?.value?.trim() || '',
    area: document.getElementById('tf-area')?.value?.trim() || '',
    project: document.getElementById('tf-project')?.value?.trim() || '',
    task: document.getElementById('tf-task')?.value?.trim() || '',
    startDate: document.getElementById('tf-start')?.value || '',
    dueDate: document.getElementById('tf-due')?.value || '',
    finishDate: document.getElementById('tf-finish')?.value || '',
    status: document.getElementById('tf-status')?.value || 'ongoing',
  };
}

async function showTaskDialog(store, taskId = null) {
  const existing = taskId ? store.getTaskById(taskId) : null;
  const title = existing ? 'Edit Task' : 'Add New Task';
  const formHtml = buildTaskForm(existing) + buildDataLists(store);

  const result = await showModal(title, formHtml, {
    submitLabel: existing ? 'Update' : 'Add',
    showDelete: !!existing,
    onSubmit: () => {
      const data = getTaskFormData();
      if (!data.task) {
        highlightField('tf-task');
        return false;
      }
      return data;
    },
  });

  if (result === 'delete') {
    const confirmed = await showConfirmDialog('Delete Task', `Are you sure you want to delete "${existing.task}"?`);
    if (confirmed) {
      store.deleteTask(taskId);
      return 'deleted';
    }
    return null;
  }

  if (result && typeof result === 'object') {
    if (existing) {
      store.updateTask(taskId, result);
      return 'updated';
    } else {
      store.addTask(result);
      return 'added';
    }
  }

  return null;
}

// ---- Conference Form ----

const CONF_STATUSES = ['will attend', 'attended', 'unsure of attendance', "can't attend", 'cancelled'];

function buildConferenceForm(conf = null) {
  const c = conf || {};
  return `
    <form id="conf-form" class="form-grid">
      <div class="form-group">
        <label for="cf-area">Area</label>
        <input type="text" id="cf-area" value="${escAttr(c.area)}" placeholder="e.g., ML, NLP">
      </div>
      <div class="form-group form-group-wide">
        <label for="cf-project">Conference Name</label>
        <input type="text" id="cf-project" value="${escAttr(c.project)}" placeholder="e.g., ICML 2026" required>
      </div>
      <div class="form-group form-group-wide">
        <label for="cf-task">Description</label>
        <input type="text" id="cf-task" value="${escAttr(c.task)}" placeholder="e.g., Paper presentation">
      </div>
      <div class="form-group">
        <label for="cf-start">Start Date</label>
        <input type="date" id="cf-start" value="${escAttr(c.startDate)}">
      </div>
      <div class="form-group">
        <label for="cf-finish">End Date</label>
        <input type="date" id="cf-finish" value="${escAttr(c.finishDate)}">
      </div>
      <div class="form-group">
        <label for="cf-status">Status</label>
        <select id="cf-status">
          ${CONF_STATUSES.map(s => `<option value="${s}" ${(c.status || 'will attend').toLowerCase() === s ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
        </select>
      </div>
    </form>
  `;
}

function getConferenceFormData() {
  return {
    area: document.getElementById('cf-area')?.value?.trim() || '',
    project: document.getElementById('cf-project')?.value?.trim() || '',
    task: document.getElementById('cf-task')?.value?.trim() || '',
    startDate: document.getElementById('cf-start')?.value || '',
    finishDate: document.getElementById('cf-finish')?.value || '',
    status: document.getElementById('cf-status')?.value || 'will attend',
  };
}

async function showConferenceDialog(store, confId = null) {
  const existing = confId ? store.getConferenceById(confId) : null;
  const title = existing ? 'Edit Conference' : 'Add New Conference';
  const formHtml = buildConferenceForm(existing);

  const result = await showModal(title, formHtml, {
    submitLabel: existing ? 'Update' : 'Add',
    showDelete: !!existing,
    onSubmit: () => {
      const data = getConferenceFormData();
      if (!data.project) {
        highlightField('cf-project');
        return false;
      }
      return data;
    },
  });

  if (result === 'delete') {
    const confirmed = await showConfirmDialog('Delete Conference', `Are you sure you want to delete "${existing.project}"?`);
    if (confirmed) {
      store.deleteConference(confId);
      return 'deleted';
    }
    return null;
  }

  if (result && typeof result === 'object') {
    if (existing) {
      store.updateConference(confId, result);
      return 'updated';
    } else {
      store.addConference(result);
      return 'added';
    }
  }

  return null;
}

// ---- Confirm Dialog ----

async function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    modal.innerHTML = `
      <div class="modal-header">
        <h2>${escHtml(title)}</h2>
        <button class="modal-close" id="confirm-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p>${escHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <div class="modal-footer-right">
          <button class="btn btn-secondary" id="confirm-no-btn">Cancel</button>
          <button class="btn btn-danger" id="confirm-yes-btn">Delete</button>
        </div>
      </div>
    `;
    modal.className = 'modal-content';
    overlay.classList.remove('hidden');

    const close = (result) => {
      overlay.classList.add('hidden');
      resolve(result);
    };

    document.getElementById('confirm-close-btn').onclick = () => close(false);
    document.getElementById('confirm-no-btn').onclick = () => close(false);
    document.getElementById('confirm-yes-btn').onclick = () => close(true);
  });
}

// ---- History Panel ----

function renderHistoryPanel(container, store, onRevert) {
  const history = store.getHistory();

  let html = '<div class="panel-header">';
  html += '<h2>Change History</h2>';
  html += '<button class="panel-close-btn" id="history-close-btn">&times;</button>';
  html += '</div>';
  html += '<div class="panel-body">';

  if (history.length === 0) {
    html += '<p class="empty-message">No history entries yet.</p>';
  } else {
    html += '<div class="history-list">';
    // Show newest first
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      const date = new Date(h.timestamp);
      const timeStr = date.toLocaleString();
      const actionIcon = getActionIcon(h.action);

      html += `<div class="history-item ${h.isCurrent ? 'history-current' : ''}" data-history-id="${h.id}">`;
      html += `<div class="history-icon">${actionIcon}</div>`;
      html += `<div class="history-info">`;
      html += `<div class="history-desc">${escHtml(h.description)}</div>`;
      html += `<div class="history-time">${timeStr}</div>`;
      html += `</div>`;
      if (!h.isCurrent) {
        html += `<button class="btn btn-sm btn-secondary history-revert-btn" data-history-id="${h.id}">Revert</button>`;
      } else {
        html += `<span class="history-current-badge">Current</span>`;
      }
      html += `</div>`;
    }
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // Bind events
  document.getElementById('history-close-btn').onclick = () => {
    container.classList.add('hidden');
  };

  container.querySelectorAll('.history-revert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.historyId;
      if (onRevert) onRevert(id);
    });
  });
}

function getActionIcon(action) {
  switch (action) {
    case 'init': return '<span class="action-icon init">&#9654;</span>';
    case 'add_task': return '<span class="action-icon add">+T</span>';
    case 'edit_task': return '<span class="action-icon edit">&#9998;T</span>';
    case 'delete_task': return '<span class="action-icon delete">&#10005;T</span>';
    case 'add_conference': return '<span class="action-icon add">+C</span>';
    case 'edit_conference': return '<span class="action-icon edit">&#9998;C</span>';
    case 'delete_conference': return '<span class="action-icon delete">&#10005;C</span>';
    case 'import': return '<span class="action-icon import">&#8595;</span>';
    case 'revert': return '<span class="action-icon revert">&#8634;</span>';
    case 'clear': return '<span class="action-icon delete">&#9888;</span>';
    default: return '<span class="action-icon">&#8226;</span>';
  }
}

// ---- Settings Panel ----

function renderSettingsPanel(container, store, onApply) {
  const settings = store.getSettings();
  const colors = store.getColors();

  let html = '<div class="panel-header">';
  html += '<h2>Settings</h2>';
  html += '<button class="panel-close-btn" id="settings-close-btn">&times;</button>';
  html += '</div>';
  html += '<div class="panel-body">';

  // General Settings
  html += '<div class="settings-section">';
  html += '<h3>General</h3>';

  html += `<div class="setting-row">
    <label for="s-due-soon-days">"Due soon" threshold (days)</label>
    <input type="number" id="s-due-soon-days" value="${settings.dueSoonDays}" min="1" max="90">
  </div>`;

  html += `<div class="setting-row">
    <label for="s-extend-before">Extend timeline before (days)</label>
    <input type="number" id="s-extend-before" value="${settings.dateRangeExtendBefore}" min="0" max="90">
  </div>`;

  html += `<div class="setting-row">
    <label for="s-extend-after">Extend timeline after (days)</label>
    <input type="number" id="s-extend-after" value="${settings.dateRangeExtendAfter}" min="0" max="180">
  </div>`;

  html += `<div class="setting-row">
    <label for="s-cell-width">Timeline cell width (px)</label>
    <input type="number" id="s-cell-width" value="${settings.timelineCellWidth}" min="16" max="80">
  </div>`;

  html += `<div class="setting-row">
    <label for="s-max-history">Max history entries</label>
    <input type="number" id="s-max-history" value="${settings.maxHistoryEntries}" min="10" max="1000">
  </div>`;

  html += '</div>';

  // Display Settings
  html += '<div class="settings-section">';
  html += '<h3>Display</h3>';

  html += `<div class="setting-row">
    <label for="s-show-current-week">Highlight current week</label>
    <input type="checkbox" id="s-show-current-week" ${settings.showCurrentWeek ? 'checked' : ''}>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-show-legend">Show legend</label>
    <input type="checkbox" id="s-show-legend" ${settings.showLegend ? 'checked' : ''}>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-show-conferences">Show conferences section</label>
    <input type="checkbox" id="s-show-conferences" ${settings.showConferences ? 'checked' : ''}>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-show-tooltips">Show tooltips</label>
    <input type="checkbox" id="s-show-tooltips" ${settings.showTooltips ? 'checked' : ''}>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-show-separators">Show project separators</label>
    <input type="checkbox" id="s-show-separators" ${settings.showProjectSeparators ? 'checked' : ''}>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-compact-mode">Compact mode</label>
    <input type="checkbox" id="s-compact-mode" ${settings.compactMode ? 'checked' : ''}>
  </div>`;

  html += '</div>';

  // Color Palette
  html += '<div class="settings-section">';
  html += '<h3>Color Palette</h3>';

  const colorLabels = {
    ongoing: 'Ongoing',
    done: 'Done',
    accepted: 'Accepted',
    expected: 'Expected',
    grey: 'Rejected/Postponed/Cancelled',
    approachingDue: 'Approaching Due Date',
    ongoingStripe: 'Ongoing Stripe',
    header: 'Header Background',
    attended: 'Attended',
    willAttend: 'Will Attend',
    unsure: 'Unsure of Attendance',
    cantAttend: "Can't Attend",
    conferenceCancelled: 'Conference Cancelled',
    conference: 'Conference Default',
    currentWeekBorder: 'Current Week Border',
    currentWeekBg: 'Current Week Background',
    dueBorder: 'Due Date Border',
  };

  for (const [key, label] of Object.entries(colorLabels)) {
    html += `<div class="setting-row color-row">
      <label for="c-${key}">${label}</label>
      <div class="color-input-wrapper">
        <input type="color" id="c-${key}" value="${colors[key] || DEFAULT_COLORS[key]}">
        <span class="color-hex" id="ch-${key}">${colors[key] || DEFAULT_COLORS[key]}</span>
      </div>
    </div>`;
  }

  html += `<div class="setting-row">
    <button class="btn btn-secondary" id="s-reset-colors">Reset Colors to Default</button>
  </div>`;

  html += '</div>';

  // Data Management
  html += '<div class="settings-section">';
  html += '<h3>Data Management</h3>';

  html += `<div class="setting-row">
    <button class="btn btn-secondary" id="s-export-json">Export as JSON</button>
    <button class="btn btn-secondary" id="s-export-csv">Export as CSV</button>
  </div>`;

  html += `<div class="setting-row">
    <label for="s-import-file">Import Data (JSON)</label>
    <input type="file" id="s-import-file" accept=".json">
  </div>`;

  html += `<div class="setting-row">
    <button class="btn btn-danger" id="s-clear-data">Clear All Data</button>
    <button class="btn btn-secondary" id="s-reset-settings">Reset Settings</button>
  </div>`;

  html += '</div>';

  // Apply button
  html += `<div class="settings-actions">
    <button class="btn btn-primary" id="s-apply-btn">Apply Settings</button>
  </div>`;

  html += '</div>';
  container.innerHTML = html;

  // Bind color input syncing
  for (const key of Object.keys(colorLabels)) {
    const colorInput = document.getElementById(`c-${key}`);
    const hexSpan = document.getElementById(`ch-${key}`);
    if (colorInput && hexSpan) {
      colorInput.addEventListener('input', () => {
        hexSpan.textContent = colorInput.value;
      });
    }
  }

  // Bind buttons
  document.getElementById('settings-close-btn').onclick = () => {
    container.classList.add('hidden');
  };

  document.getElementById('s-apply-btn').onclick = () => {
    applySettings(store);
    if (onApply) onApply();
  };

  document.getElementById('s-reset-colors').onclick = () => {
    store.resetColors();
    renderSettingsPanel(container, store, onApply);
    if (onApply) onApply();
  };

  document.getElementById('s-reset-settings').onclick = () => {
    store.resetSettings();
    renderSettingsPanel(container, store, onApply);
    if (onApply) onApply();
  };

  document.getElementById('s-export-json').onclick = () => {
    downloadFile('timeline_data.json', store.exportData(), 'application/json');
  };

  document.getElementById('s-export-csv').onclick = () => {
    downloadFile('timeline_data.csv', store.exportCSV(), 'text/csv');
  };

  document.getElementById('s-import-file').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (store.importData(ev.target.result)) {
        showToast('Data imported successfully');
        if (onApply) onApply();
      } else {
        showToast('Import failed - invalid file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  document.getElementById('s-clear-data').onclick = async () => {
    const confirmed = await showConfirmDialog('Clear All Data', 'This will remove all tasks and conferences. This action can be undone via history. Continue?');
    if (confirmed) {
      store.clearAllData();
      if (onApply) onApply();
      showToast('All data cleared');
    }
  };
}

function applySettings(store) {
  const colorLabels = {
    ongoing: true, done: true, accepted: true, expected: true, grey: true,
    approachingDue: true, ongoingStripe: true, header: true,
    attended: true, willAttend: true, unsure: true, cantAttend: true,
    conferenceCancelled: true, conference: true, currentWeekBorder: true,
    currentWeekBg: true, dueBorder: true,
  };

  // Gather settings
  const newSettings = {
    dueSoonDays: parseInt(document.getElementById('s-due-soon-days')?.value) || 7,
    dateRangeExtendBefore: parseInt(document.getElementById('s-extend-before')?.value) || 7,
    dateRangeExtendAfter: parseInt(document.getElementById('s-extend-after')?.value) || 14,
    timelineCellWidth: parseInt(document.getElementById('s-cell-width')?.value) || 28,
    maxHistoryEntries: parseInt(document.getElementById('s-max-history')?.value) || 200,
    showCurrentWeek: document.getElementById('s-show-current-week')?.checked ?? true,
    showLegend: document.getElementById('s-show-legend')?.checked ?? true,
    showConferences: document.getElementById('s-show-conferences')?.checked ?? true,
    showTooltips: document.getElementById('s-show-tooltips')?.checked ?? true,
    showProjectSeparators: document.getElementById('s-show-separators')?.checked ?? true,
    compactMode: document.getElementById('s-compact-mode')?.checked ?? false,
  };

  store.updateSettings(newSettings);

  // Gather colors
  const newColors = {};
  for (const key of Object.keys(colorLabels)) {
    const el = document.getElementById(`c-${key}`);
    if (el) newColors[key] = el.value;
  }
  store.updateColors(newColors);

  showToast('Settings applied');
}

// ---- Data Lists for Autocomplete ----

function buildDataLists(store) {
  const tasks = store.getTasks();
  const professors = [...new Set(tasks.map(t => t.professor).filter(Boolean))];
  const areas = [...new Set(tasks.map(t => t.area).filter(Boolean))];
  const projects = [...new Set(tasks.map(t => t.project).filter(Boolean))];

  let html = '<datalist id="professor-list">';
  for (const p of professors) html += `<option value="${escAttr(p)}">`;
  html += '</datalist>';

  html += '<datalist id="area-list">';
  for (const a of areas) html += `<option value="${escAttr(a)}">`;
  html += '</datalist>';

  html += '<datalist id="project-list">';
  for (const p of projects) html += `<option value="${escAttr(p)}">`;
  html += '</datalist>';

  return html;
}

// ---- Toast Notifications ----

function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Utility Functions ----

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function highlightField(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.classList.add('field-error');
    el.focus();
    setTimeout(() => el.classList.remove('field-error'), 2000);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export {
  showModal,
  closeModal,
  showTaskDialog,
  showConferenceDialog,
  showConfirmDialog,
  renderHistoryPanel,
  renderSettingsPanel,
  showToast,
};
