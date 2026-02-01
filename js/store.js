// ============================================================
// DATA STORE MODULE - Manages all application data with history
// ============================================================

const STORAGE_KEYS = {
  TASKS: 'timeline_tasks',
  CONFERENCES: 'timeline_conferences',
  HISTORY: 'timeline_history',
  SETTINGS: 'timeline_settings',
  COLORS: 'timeline_colors',
};

// Default color palette matching the VBA code
const DEFAULT_COLORS = {
  ongoing: '#FF0000',
  done: '#00B050',
  accepted: '#00B050',
  expected: '#FFC000',
  rejected: '#C0C0C0',
  postponed: '#C0C0C0',
  cancelled: '#C0C0C0',
  grey: '#C0C0C0',
  header: '#D3D3D3',
  approachingDue: '#FF0000',
  ongoingStripe: '#FF6464',
  attended: '#00B050',
  willAttend: '#FF0000',
  unsure: '#FF8000',
  cantAttend: '#C0C0C0',
  conferenceCancelled: '#C0C0C0',
  conference: '#FFFF00',
  currentWeekBorder: '#FF0000',
  currentWeekBg: '#FFC8C8',
  dueBorder: '#FF0000',
};

const DEFAULT_SETTINGS = {
  dueSoonDays: 7,
  weekStartDay: 'monday',
  showCurrentWeek: true,
  showLegend: true,
  showConferences: true,
  showTooltips: true,
  compactMode: false,
  dateRangeExtendBefore: 7,
  dateRangeExtendAfter: 14,
  maxHistoryEntries: 200,
  autoSave: true,
  showProjectSeparators: true,
  timelineCellWidth: 28,
};

// Sample data for first-time users
const SAMPLE_TASKS = [
  {
    id: 't1', professor: 'Dr. Smith', area: 'ML', project: 'Neural Architecture Search',
    task: 'Literature review on NAS methods', startDate: '2025-12-01', dueDate: '2026-01-15',
    finishDate: '2026-01-10', status: 'done',
  },
  {
    id: 't2', professor: 'Dr. Smith', area: 'ML', project: 'Neural Architecture Search',
    task: 'Implement baseline NAS algorithm', startDate: '2026-01-10', dueDate: '2026-02-28',
    finishDate: '', status: 'ongoing',
  },
  {
    id: 't3', professor: 'Dr. Smith', area: 'ML', project: 'Neural Architecture Search',
    task: 'Write paper draft for ICML submission', startDate: '2026-02-15', dueDate: '2026-03-20',
    finishDate: '', status: 'expected',
  },
  {
    id: 't4', professor: 'Dr. Lee', area: 'NLP', project: 'Multilingual Transformers',
    task: 'Collect parallel corpus data', startDate: '2025-11-15', dueDate: '2026-01-05',
    finishDate: '2025-12-28', status: 'done',
  },
  {
    id: 't5', professor: 'Dr. Lee', area: 'NLP', project: 'Multilingual Transformers',
    task: 'Fine-tune mBERT on collected data', startDate: '2026-01-05', dueDate: '2026-02-10',
    finishDate: '', status: 'ongoing',
  },
  {
    id: 't6', professor: 'Dr. Lee', area: 'NLP', project: 'Multilingual Transformers',
    task: 'Evaluate on XTREME benchmark', startDate: '2026-02-10', dueDate: '2026-03-01',
    finishDate: '', status: 'expected',
  },
  {
    id: 't7', professor: 'Dr. Park', area: 'CV', project: 'Medical Image Segmentation',
    task: 'Dataset preprocessing pipeline', startDate: '2025-12-10', dueDate: '2026-01-20',
    finishDate: '2026-01-18', status: 'done',
  },
  {
    id: 't8', professor: 'Dr. Park', area: 'CV', project: 'Medical Image Segmentation',
    task: 'Train U-Net variant on CT scans', startDate: '2026-01-20', dueDate: '2026-02-05',
    finishDate: '', status: 'ongoing',
  },
  {
    id: 't9', professor: 'Dr. Park', area: 'CV', project: 'Medical Image Segmentation',
    task: 'Submit to MICCAI 2026', startDate: '2026-02-20', dueDate: '2026-03-15',
    finishDate: '', status: 'expected',
  },
  {
    id: 't10', professor: 'Dr. Kim', area: 'RL', project: 'Robotic Control',
    task: 'Initial proposal', startDate: '2025-10-01', dueDate: '2025-11-01',
    finishDate: '', status: 'postponed',
  },
];

const SAMPLE_CONFERENCES = [
  {
    id: 'c1', area: 'ML', project: 'ICML 2026', task: 'Paper submission + attendance',
    startDate: '2026-07-19', finishDate: '2026-07-25', status: 'will attend',
  },
  {
    id: 'c2', area: 'NLP', project: 'ACL 2026', task: 'Workshop presentation',
    startDate: '2026-08-10', finishDate: '2026-08-15', status: 'unsure of attendance',
  },
  {
    id: 'c3', area: 'CV', project: 'CVPR 2026', task: 'Poster session',
    startDate: '2026-06-14', finishDate: '2026-06-20', status: 'will attend',
  },
  {
    id: 'c4', area: 'ML', project: 'NeurIPS 2025', task: 'Attended main conference',
    startDate: '2025-12-09', finishDate: '2025-12-15', status: 'attended',
  },
  {
    id: 'c5', area: 'RL', project: 'CoRL 2025', task: 'Could not attend',
    startDate: '2025-11-05', finishDate: '2025-11-08', status: "can't attend",
  },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

class Store {
  constructor() {
    this._tasks = [];
    this._conferences = [];
    this._history = [];
    this._historyIndex = -1;
    this._colors = { ...DEFAULT_COLORS };
    this._settings = { ...DEFAULT_SETTINGS };
    this._listeners = [];
    this._load();
  }

  // ---- Persistence ----

  _load() {
    try {
      const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const conferences = localStorage.getItem(STORAGE_KEYS.CONFERENCES);
      const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const colors = localStorage.getItem(STORAGE_KEYS.COLORS);

      if (tasks) {
        this._tasks = JSON.parse(tasks);
      } else {
        this._tasks = [...SAMPLE_TASKS];
      }

      if (conferences) {
        this._conferences = JSON.parse(conferences);
      } else {
        this._conferences = [...SAMPLE_CONFERENCES];
      }

      if (history) {
        const parsed = JSON.parse(history);
        this._history = parsed.entries || [];
        this._historyIndex = parsed.index ?? (this._history.length - 1);
      }

      if (settings) {
        this._settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settings) };
      }

      if (colors) {
        this._colors = { ...DEFAULT_COLORS, ...JSON.parse(colors) };
      }

      // If no history exists, create initial snapshot
      if (this._history.length === 0) {
        this._pushHistory('init', 'Initial state');
      }
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
      this._tasks = [...SAMPLE_TASKS];
      this._conferences = [...SAMPLE_CONFERENCES];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this._tasks));
      localStorage.setItem(STORAGE_KEYS.CONFERENCES, JSON.stringify(this._conferences));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify({
        entries: this._history,
        index: this._historyIndex,
      }));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this._settings));
      localStorage.setItem(STORAGE_KEYS.COLORS, JSON.stringify(this._colors));
    } catch (e) {
      console.error('Failed to save data to localStorage:', e);
    }
  }

  // ---- Event system ----

  onChange(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notify(eventType) {
    for (const listener of this._listeners) {
      try {
        listener(eventType);
      } catch (e) {
        console.error('Listener error:', e);
      }
    }
  }

  // ---- History Management ----

  _pushHistory(action, description) {
    // Trim any future entries if we've undone some actions
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      description,
      snapshot: {
        tasks: JSON.parse(JSON.stringify(this._tasks)),
        conferences: JSON.parse(JSON.stringify(this._conferences)),
      },
    };

    this._history.push(entry);

    // Enforce max history
    if (this._history.length > this._settings.maxHistoryEntries) {
      this._history = this._history.slice(this._history.length - this._settings.maxHistoryEntries);
    }

    this._historyIndex = this._history.length - 1;
    this._save();
  }

  undo() {
    if (this._historyIndex <= 0) return false;
    this._historyIndex--;
    const snapshot = this._history[this._historyIndex].snapshot;
    this._tasks = JSON.parse(JSON.stringify(snapshot.tasks));
    this._conferences = JSON.parse(JSON.stringify(snapshot.conferences));
    this._save();
    this._notify('undo');
    return true;
  }

  redo() {
    if (this._historyIndex >= this._history.length - 1) return false;
    this._historyIndex++;
    const snapshot = this._history[this._historyIndex].snapshot;
    this._tasks = JSON.parse(JSON.stringify(snapshot.tasks));
    this._conferences = JSON.parse(JSON.stringify(snapshot.conferences));
    this._save();
    this._notify('redo');
    return true;
  }

  revertTo(historyId) {
    const idx = this._history.findIndex(h => h.id === historyId);
    if (idx === -1) return false;

    // Create a new history entry for the revert action
    const snapshot = this._history[idx].snapshot;
    this._tasks = JSON.parse(JSON.stringify(snapshot.tasks));
    this._conferences = JSON.parse(JSON.stringify(snapshot.conferences));
    this._pushHistory('revert', `Reverted to: ${this._history[idx].description}`);
    this._notify('revert');
    return true;
  }

  canUndo() {
    return this._historyIndex > 0;
  }

  canRedo() {
    return this._historyIndex < this._history.length - 1;
  }

  getHistory() {
    return this._history.map((h, i) => ({
      ...h,
      isCurrent: i === this._historyIndex,
    }));
  }

  getHistoryIndex() {
    return this._historyIndex;
  }

  // ---- Task CRUD ----

  getTasks() {
    return this._getSortedTasks();
  }

  _getSortedTasks() {
    return [...this._tasks].sort((a, b) => {
      // Sort by project first
      if (a.project < b.project) return -1;
      if (a.project > b.project) return 1;
      // Then by start date
      const aStart = a.startDate ? new Date(a.startDate) : new Date(0);
      const bStart = b.startDate ? new Date(b.startDate) : new Date(0);
      if (aStart < bStart) return -1;
      if (aStart > bStart) return 1;
      // Then by end date
      const aEnd = new Date(a.finishDate || a.dueDate || a.startDate || 0);
      const bEnd = new Date(b.finishDate || b.dueDate || b.startDate || 0);
      if (aEnd < bEnd) return -1;
      if (aEnd > bEnd) return 1;
      return 0;
    });
  }

  getTaskById(id) {
    return this._tasks.find(t => t.id === id) || null;
  }

  addTask(task) {
    const newTask = {
      id: generateId(),
      professor: task.professor || '',
      area: task.area || '',
      project: task.project || '',
      task: task.task || '',
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      finishDate: task.finishDate || '',
      status: task.status || 'ongoing',
    };
    this._tasks.push(newTask);
    this._pushHistory('add_task', `Added task: ${newTask.task}`);
    this._notify('task_added');
    return newTask;
  }

  updateTask(id, updates) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const oldName = this._tasks[idx].task;
    this._tasks[idx] = { ...this._tasks[idx], ...updates, id };
    this._pushHistory('edit_task', `Edited task: ${oldName}`);
    this._notify('task_updated');
    return this._tasks[idx];
  }

  deleteTask(id) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const name = this._tasks[idx].task;
    this._tasks.splice(idx, 1);
    this._pushHistory('delete_task', `Deleted task: ${name}`);
    this._notify('task_deleted');
    return true;
  }

  // ---- Conference CRUD ----

  getConferences() {
    return [...this._conferences].sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate) : new Date(0);
      const bStart = b.startDate ? new Date(b.startDate) : new Date(0);
      return aStart - bStart;
    });
  }

  getConferenceById(id) {
    return this._conferences.find(c => c.id === id) || null;
  }

  addConference(conf) {
    const newConf = {
      id: generateId(),
      area: conf.area || '',
      project: conf.project || '',
      task: conf.task || '',
      startDate: conf.startDate || '',
      finishDate: conf.finishDate || '',
      status: conf.status || 'will attend',
    };
    this._conferences.push(newConf);
    this._pushHistory('add_conference', `Added conference: ${newConf.project}`);
    this._notify('conference_added');
    return newConf;
  }

  updateConference(id, updates) {
    const idx = this._conferences.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const oldName = this._conferences[idx].project;
    this._conferences[idx] = { ...this._conferences[idx], ...updates, id };
    this._pushHistory('edit_conference', `Edited conference: ${oldName}`);
    this._notify('conference_updated');
    return this._conferences[idx];
  }

  deleteConference(id) {
    const idx = this._conferences.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const name = this._conferences[idx].project;
    this._conferences.splice(idx, 1);
    this._pushHistory('delete_conference', `Deleted conference: ${name}`);
    this._notify('conference_deleted');
    return true;
  }

  // ---- Colors ----

  getColors() {
    return { ...this._colors };
  }

  updateColors(colors) {
    this._colors = { ...this._colors, ...colors };
    this._save();
    this._notify('colors_changed');
  }

  resetColors() {
    this._colors = { ...DEFAULT_COLORS };
    this._save();
    this._notify('colors_changed');
  }

  // ---- Settings ----

  getSettings() {
    return { ...this._settings };
  }

  updateSettings(settings) {
    this._settings = { ...this._settings, ...settings };
    this._save();
    this._notify('settings_changed');
  }

  resetSettings() {
    this._settings = { ...DEFAULT_SETTINGS };
    this._save();
    this._notify('settings_changed');
  }

  // ---- Date Range Calculation ----

  getDateRange() {
    let minDate = new Date();
    let maxDate = new Date();
    minDate.setFullYear(minDate.getFullYear() + 1);
    maxDate.setFullYear(maxDate.getFullYear() - 5);

    const allDates = [];

    for (const t of this._tasks) {
      if (t.startDate) allDates.push(new Date(t.startDate));
      if (t.dueDate) allDates.push(new Date(t.dueDate));
      if (t.finishDate) allDates.push(new Date(t.finishDate));
    }

    for (const c of this._conferences) {
      if (c.startDate) allDates.push(new Date(c.startDate));
      if (c.finishDate) allDates.push(new Date(c.finishDate));
    }

    if (allDates.length === 0) {
      minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 1);
      maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
    } else {
      minDate = new Date(Math.min(...allDates));
      maxDate = new Date(Math.max(...allDates));
    }

    // Extend range
    minDate.setDate(minDate.getDate() - this._settings.dateRangeExtendBefore);
    maxDate.setDate(maxDate.getDate() + this._settings.dateRangeExtendAfter);

    // Adjust to week boundaries (Monday start)
    const dayOfWeek = minDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    minDate.setDate(minDate.getDate() - mondayOffset);

    const maxDayOfWeek = maxDate.getDay();
    const sundayOffset = maxDayOfWeek === 0 ? 0 : 7 - maxDayOfWeek;
    maxDate.setDate(maxDate.getDate() + sundayOffset);

    return { minDate, maxDate };
  }

  // ---- Import / Export ----

  exportData() {
    return JSON.stringify({
      version: 1,
      exportDate: new Date().toISOString(),
      tasks: this._tasks,
      conferences: this._conferences,
      colors: this._colors,
      settings: this._settings,
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) this._tasks = data.tasks;
      if (data.conferences) this._conferences = data.conferences;
      if (data.colors) this._colors = { ...DEFAULT_COLORS, ...data.colors };
      if (data.settings) this._settings = { ...DEFAULT_SETTINGS, ...data.settings };
      this._pushHistory('import', 'Imported data from file');
      this._notify('import');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  exportCSV() {
    const headers = ['Type', 'Professor', 'Area', 'Project', 'Task', 'Start Date', 'Due Date', 'Finish Date', 'Status'];
    const rows = [headers.join(',')];

    for (const t of this._tasks) {
      rows.push([
        'Task',
        `"${(t.professor || '').replace(/"/g, '""')}"`,
        `"${(t.area || '').replace(/"/g, '""')}"`,
        `"${(t.project || '').replace(/"/g, '""')}"`,
        `"${(t.task || '').replace(/"/g, '""')}"`,
        t.startDate || '',
        t.dueDate || '',
        t.finishDate || '',
        t.status || '',
      ].join(','));
    }

    for (const c of this._conferences) {
      rows.push([
        'Conference',
        '',
        `"${(c.area || '').replace(/"/g, '""')}"`,
        `"${(c.project || '').replace(/"/g, '""')}"`,
        `"${(c.task || '').replace(/"/g, '""')}"`,
        c.startDate || '',
        '',
        c.finishDate || '',
        c.status || '',
      ].join(','));
    }

    return rows.join('\n');
  }

  clearAllData() {
    this._tasks = [];
    this._conferences = [];
    this._pushHistory('clear', 'Cleared all data');
    this._notify('clear');
  }
}

export { Store, DEFAULT_COLORS, DEFAULT_SETTINGS, generateId };
