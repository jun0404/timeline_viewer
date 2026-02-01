// ============================================================
// TIMELINE RENDERING MODULE
// ============================================================

function formatDate(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function formatMonthYear(d) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function weekOverlaps(weekStart, taskStart, taskEnd) {
  const weekEnd = addDays(weekStart, 6);
  if (!taskEnd || isNaN(taskEnd.getTime())) taskEnd = taskStart;
  return weekStart <= taskEnd && weekEnd >= taskStart;
}

function isDateInWeek(weekStart, date) {
  if (!date) return false;
  const weekEnd = addDays(weekStart, 6);
  return date >= weekStart && date <= weekEnd;
}

function getWeekNumber(weekStart, monthStart) {
  // Calculate which week of the month this is
  let count = 1;
  let d = new Date(monthStart);
  while (d < weekStart) {
    d = addDays(d, 7);
    count++;
  }
  return count;
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function generateWeeks(minDate, maxDate) {
  const weeks = [];
  let current = new Date(minDate);
  while (current <= maxDate) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }
  return weeks;
}

function generateMonthSpans(weeks) {
  const spans = [];
  let currentMonth = -1;
  let currentYear = -1;
  let spanStart = 0;

  for (let i = 0; i < weeks.length; i++) {
    const m = weeks[i].getMonth();
    const y = weeks[i].getFullYear();
    if (m !== currentMonth || y !== currentYear) {
      if (currentMonth !== -1) {
        spans.push({
          month: currentMonth,
          year: currentYear,
          start: spanStart,
          count: i - spanStart,
        });
      }
      currentMonth = m;
      currentYear = y;
      spanStart = i;
    }
  }
  // Last span
  if (currentMonth !== -1) {
    spans.push({
      month: currentMonth,
      year: currentYear,
      start: spanStart,
      count: weeks.length - spanStart,
    });
  }
  return spans;
}

function getStatusColorVar(status) {
  switch ((status || '').toLowerCase().trim()) {
    case 'ongoing': return 'var(--color-ongoing)';
    case 'done': return 'var(--color-done)';
    case 'accepted': return 'var(--color-accepted)';
    case 'expected': return 'var(--color-expected)';
    case 'rejected':
    case 'postponed':
    case 'cancelled': return 'var(--color-grey)';
    case 'attended': return 'var(--color-attended)';
    case 'unsure of attendance': return 'var(--color-unsure)';
    case 'will attend': return 'var(--color-willAttend)';
    case "can't attend": return 'var(--color-cantAttend)';
    default: return 'var(--color-ongoing)';
  }
}

function getConferenceStatusColorVar(status) {
  switch ((status || '').toLowerCase().trim()) {
    case 'attended': return 'var(--color-attended)';
    case 'will attend': return 'var(--color-willAttend)';
    case 'unsure of attendance': return 'var(--color-unsure)';
    case "can't attend": return 'var(--color-cantAttend)';
    case 'cancelled': return 'var(--color-conferenceCancelled)';
    default: return 'var(--color-conference)';
  }
}

function getStatusTooltip(status) {
  switch ((status || '').toLowerCase().trim()) {
    case 'ongoing': return 'Ongoing - Task in progress';
    case 'done': return 'Done - Task completed';
    case 'accepted': return 'Accepted - Submission accepted';
    case 'expected': return 'Expected - Awaiting result';
    case 'rejected': return 'Rejected - Submission rejected';
    case 'postponed': return 'Postponed - Task delayed';
    case 'cancelled': return 'Cancelled - Task cancelled';
    default: return status;
  }
}

function getConferenceStatusTooltip(status) {
  switch ((status || '').toLowerCase().trim()) {
    case 'attended': return 'Attended - Conference attended';
    case 'will attend': return 'Will Attend - Planning to attend';
    case 'unsure of attendance': return 'Unsure - Attendance uncertain';
    case "can't attend": return "Can't Attend - Unable to attend";
    case 'cancelled': return 'Cancelled - Conference cancelled';
    default: return 'Conference: ' + status;
  }
}

function isGreyedStatus(status) {
  const s = (status || '').toLowerCase().trim();
  return s === 'postponed' || s === 'cancelled' || s === 'rejected';
}

function isOngoing(status) {
  return (status || '').toLowerCase().trim() === 'ongoing';
}

/**
 * Render the complete timeline into the given container element.
 */
function renderTimeline(container, store, callbacks) {
  const tasks = store.getTasks();
  const conferences = store.getConferences();
  const settings = store.getSettings();
  const colors = store.getColors();
  const { minDate, maxDate } = store.getDateRange();
  const weeks = generateWeeks(minDate, maxDate);
  const monthSpans = generateMonthSpans(weeks);
  const today = stripTime(new Date());
  const dueSoonMs = settings.dueSoonDays * 24 * 60 * 60 * 1000;

  // Apply CSS variables for colors
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  // Find current week index
  let currentWeekIdx = -1;
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i] <= today && today < addDays(weeks[i], 7)) {
      currentWeekIdx = i;
      break;
    }
  }

  // Build HTML
  let html = '';
  html += '<div class="timeline-scroll-wrapper">';
  html += '<table class="timeline-table" id="timeline-table">';

  // ---- HEADER: Month row ----
  html += '<thead>';
  html += '<tr class="month-header-row">';
  html += '<th class="sticky-col col-prof" rowspan="2">Professor</th>';
  html += '<th class="sticky-col col-area" rowspan="2">Area</th>';
  html += '<th class="sticky-col col-proj" rowspan="2">Project</th>';
  html += '<th class="sticky-col col-task" rowspan="2">Task</th>';
  html += '<th class="sticky-col col-status" rowspan="2">Status</th>';

  for (const span of monthSpans) {
    const d = new Date(span.year, span.month, 1);
    html += `<th colspan="${span.count}" class="month-cell">${formatMonthYear(d)}</th>`;
  }
  html += '</tr>';

  // ---- HEADER: Week row ----
  html += '<tr class="week-header-row">';

  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    const wEnd = addDays(w, 6);
    // Calculate week number within month
    const monthFirstDay = new Date(w.getFullYear(), w.getMonth(), 1);
    const firstMonday = new Date(monthFirstDay);
    const dow = firstMonday.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    firstMonday.setDate(firstMonday.getDate() - mondayOffset);

    let weekInMonth = 1;
    let check = new Date(firstMonday);
    while (check < w) {
      check = addDays(check, 7);
      weekInMonth++;
    }

    const isCurrent = i === currentWeekIdx;
    const cls = isCurrent ? 'week-cell current-week-header' : 'week-cell';
    const label = `W${weekInMonth} (${formatDate(w)}-${formatDate(wEnd)})`;
    html += `<th class="${cls}" title="${label}"><div class="week-label">${label}</div></th>`;
  }
  html += '</tr>';
  html += '</thead>';

  // ---- BODY: Tasks ----
  html += '<tbody>';
  let prevProject = null;

  for (let ti = 0; ti < tasks.length; ti++) {
    const t = tasks[ti];
    const isNewProject = t.project !== prevProject && prevProject !== null;
    prevProject = t.project;

    const startDate = t.startDate ? stripTime(new Date(t.startDate)) : null;
    const dueDate = t.dueDate ? stripTime(new Date(t.dueDate)) : null;
    const finishDate = t.finishDate ? stripTime(new Date(t.finishDate)) : null;
    const endDateForSort = finishDate || dueDate || startDate;

    // Determine effective end date for coloring
    let colorEnd = endDateForSort;
    if (isOngoing(t.status)) {
      colorEnd = today; // Ongoing: color up to today only
    } else if (startDate && !endDateForSort) {
      if ((t.status || '').toLowerCase().trim() === 'expected') {
        colorEnd = addDays(today, 14);
      } else {
        colorEnd = startDate;
      }
    }

    // Due date approaching check (only for ongoing)
    const isDueApproaching = dueDate && isOngoing(t.status) &&
      dueDate >= today && (dueDate - today) <= dueSoonMs;

    // Row class
    let rowClass = 'task-row';
    if (isNewProject && settings.showProjectSeparators) rowClass += ' project-separator';
    if (isDueApproaching) rowClass += ' due-approaching';
    if (isOngoing(t.status) && !isDueApproaching) rowClass += ' ongoing-stripe';
    if (isGreyedStatus(t.status)) rowClass += ' greyed-out';

    html += `<tr class="${rowClass}" data-task-id="${t.id}">`;

    // Fixed columns
    html += `<td class="sticky-col col-prof data-cell" title="${escHtml(t.professor)}">${escHtml(t.professor)}</td>`;
    html += `<td class="sticky-col col-area data-cell" title="${escHtml(t.area)}">${escHtml(t.area)}</td>`;
    html += `<td class="sticky-col col-proj data-cell" title="${escHtml(t.project)}">${escHtml(t.project)}</td>`;
    html += `<td class="sticky-col col-task data-cell" title="${escHtml(t.task)}">${escHtml(t.task)}</td>`;

    // Status cell with action buttons
    let statusTooltip = getStatusTooltip(t.status);
    if (isDueApproaching && dueDate) {
      const daysLeft = Math.ceil((dueDate - today) / (24 * 60 * 60 * 1000));
      statusTooltip = `DUE DATE APPROACHING!\nDue: ${t.dueDate}\nDays remaining: ${daysLeft}`;
    } else if (isOngoing(t.status) && dueDate) {
      const daysLeft = Math.ceil((dueDate - today) / (24 * 60 * 60 * 1000));
      statusTooltip = `ONGOING - Due: ${t.dueDate}\nDays remaining: ${daysLeft}`;
    }
    html += `<td class="sticky-col col-status data-cell status-cell" title="${escHtml(statusTooltip)}">`;
    html += `<span class="status-text">${escHtml(t.status)}</span>`;
    html += `<span class="row-actions">`;
    html += `<button class="btn-icon btn-edit" data-action="edit-task" data-id="${t.id}" title="Edit">&#9998;</button>`;
    html += `<button class="btn-icon btn-delete" data-action="delete-task" data-id="${t.id}" title="Delete">&#10005;</button>`;
    html += `</span>`;
    html += `</td>`;

    // Timeline cells
    for (let wi = 0; wi < weeks.length; wi++) {
      const w = weeks[wi];
      const isCurrent = wi === currentWeekIdx;
      let cellClass = 'timeline-cell';
      if (isCurrent) cellClass += ' current-week-col';

      let cellStyle = '';
      let cellContent = '';
      let cellTitle = '';

      // Check if this week is a due date week
      const isDueWeek = dueDate && isDateInWeek(w, dueDate);

      // Check if this week overlaps with the task
      if (startDate && colorEnd && weekOverlaps(w, startDate, colorEnd)) {
        const color = getStatusColorVar(t.status);
        cellStyle = `background-color: ${color};`;
        cellTitle = statusTooltip;
      }

      // Due date marker
      if (isDueWeek) {
        cellClass += ' due-date-cell';
        cellContent = '<span class="due-star">&#9733;</span>';
        const daysLeft = Math.ceil((dueDate - today) / (24 * 60 * 60 * 1000));
        cellTitle = `DUE DATE: ${t.dueDate}\nDays remaining: ${daysLeft}\nStatus: ${getStatusTooltip(t.status)}`;
      }

      html += `<td class="${cellClass}" style="${cellStyle}" title="${escHtml(cellTitle)}">${cellContent}</td>`;
    }

    html += '</tr>';
  }

  // ---- CONFERENCE SECTION ----
  if (settings.showConferences && conferences.length > 0) {
    // Conference header row
    html += '<tr class="conference-header-row">';
    html += `<td colspan="5" class="conference-header-cell conf-header-sticky">CONFERENCES</td>`;
    for (let wi = 0; wi < weeks.length; wi++) {
      const isCurrent = wi === currentWeekIdx;
      html += `<td class="conference-header-cell timeline-cell${isCurrent ? ' current-week-col' : ''}"></td>`;
    }
    html += '</tr>';

    for (const c of conferences) {
      const confStart = c.startDate ? stripTime(new Date(c.startDate)) : null;
      const confEnd = c.finishDate ? stripTime(new Date(c.finishDate)) : (confStart ? new Date(confStart) : null);
      const confStatus = (c.status || '').toLowerCase().trim();

      let rowClass = 'conference-row';
      if (confStatus === "can't attend" || confStatus === 'cancelled') {
        rowClass += ' conf-greyed';
      } else if (confStatus === 'will attend') {
        rowClass += ' conf-will-attend';
      } else if (confStatus === 'attended') {
        rowClass += ' conf-attended';
      } else if (confStatus === 'unsure of attendance') {
        rowClass += ' conf-unsure';
      }

      html += `<tr class="${rowClass}" data-conf-id="${c.id}">`;
      html += `<td class="sticky-col col-prof data-cell"></td>`;
      html += `<td class="sticky-col col-area data-cell" title="${escHtml(c.area)}">${escHtml(c.area)}</td>`;
      html += `<td class="sticky-col col-proj data-cell" title="${escHtml(c.project)}">${escHtml(c.project)}</td>`;
      html += `<td class="sticky-col col-task data-cell" title="${escHtml(c.task)}">${escHtml(c.task)}</td>`;
      html += `<td class="sticky-col col-status data-cell status-cell" title="${escHtml(getConferenceStatusTooltip(c.status))}">`;
      html += `<span class="status-text">${escHtml(c.status)}</span>`;
      html += `<span class="row-actions">`;
      html += `<button class="btn-icon btn-edit" data-action="edit-conf" data-id="${c.id}" title="Edit">&#9998;</button>`;
      html += `<button class="btn-icon btn-delete" data-action="delete-conf" data-id="${c.id}" title="Delete">&#10005;</button>`;
      html += `</span>`;
      html += `</td>`;

      // Conference timeline cells
      for (let wi = 0; wi < weeks.length; wi++) {
        const w = weeks[wi];
        const isCurrent = wi === currentWeekIdx;
        let cellClass = 'timeline-cell';
        if (isCurrent) cellClass += ' current-week-col';

        let cellStyle = '';
        let cellTitle = '';

        if (confStart && confEnd && weekOverlaps(w, confStart, confEnd)) {
          const color = getConferenceStatusColorVar(c.status);
          cellStyle = `background-color: ${color};`;
          cellTitle = getConferenceStatusTooltip(c.status);
        }

        html += `<td class="${cellClass}" style="${cellStyle}" title="${escHtml(cellTitle)}"></td>`;
      }

      html += '</tr>';
    }
  }

  html += '</tbody>';
  html += '</table>';
  html += '</div>';

  container.innerHTML = html;

  // Scroll current week into view
  if (currentWeekIdx >= 0 && settings.showCurrentWeek) {
    requestAnimationFrame(() => {
      const currentWeekEl = container.querySelector('.current-week-header');
      if (currentWeekEl) {
        currentWeekEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  // Bind action buttons
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (callbacks && callbacks[action]) {
        callbacks[action](id);
      }
    });
  });

  // Bind row click for editing
  container.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('dblclick', () => {
      const id = row.dataset.taskId;
      if (callbacks && callbacks['edit-task']) {
        callbacks['edit-task'](id);
      }
    });
  });

  container.querySelectorAll('.conference-row').forEach(row => {
    row.addEventListener('dblclick', () => {
      const id = row.dataset.confId;
      if (callbacks && callbacks['edit-conf']) {
        callbacks['edit-conf'](id);
      }
    });
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;');
}

/**
 * Render the legend panel
 */
function renderLegend(container, colors) {
  let html = '<div class="legend-content">';

  html += '<h3>Task Status</h3>';
  html += '<div class="legend-items">';

  html += `<div class="legend-item">
    <span class="legend-swatch due-star-legend">&#9733;</span>
    <span>Due Date</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-approachingDue);"></span>
    <span>Due within 1 week</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch ongoing-stripe-legend"></span>
    <span>Ongoing (not due soon)</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-ongoing);"></span>
    <span>Ongoing</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-expected);"></span>
    <span>Expected</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-done);"></span>
    <span>Done / Accepted</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-grey);"></span>
    <span>Rejected / Postponed / Cancelled</span>
  </div>`;

  html += '</div>';

  html += '<h3>Conference Status</h3>';
  html += '<div class="legend-items">';

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-willAttend);"></span>
    <span>Will Attend</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-attended);"></span>
    <span>Attended</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-unsure);"></span>
    <span>Unsure of Attendance</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-cantAttend);"></span>
    <span>Can't Attend</span>
  </div>`;

  html += `<div class="legend-item">
    <span class="legend-swatch" style="background:var(--color-conferenceCancelled);"></span>
    <span>Cancelled</span>
  </div>`;

  html += '</div>';
  html += '</div>';

  container.innerHTML = html;
}

export { renderTimeline, renderLegend };
