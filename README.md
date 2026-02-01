# Timeline Viewer

A web-based schedule manager with GUI features showing weekly timeline views for managing research projects and conference attendances.

## Features

### Timeline View
- Weekly timeline grid with tasks grouped and sorted by project, start date, and end date
- Month headers spanning multiple weeks with full month names
- Color-coded task bars based on status (Ongoing, Done, Expected, Rejected, etc.)
- Ongoing tasks colored from start date to current date only
- Due date markers with star symbols and red borders
- Current week column highlighting
- Approaching due date alerts (row highlighted red for ongoing tasks due within configurable days)
- Ongoing tasks not due soon shown with diagonal stripe pattern
- Greyed-out display for postponed/cancelled/rejected tasks
- Bold project separators between different project groups
- Tooltips on timeline cells with status details

### Conference Tracking
- Separate conference section below tasks
- Color-coded by attendance status (Will Attend, Attended, Unsure, Can't Attend, Cancelled)

### Schedule Management
- Add, edit, and delete tasks via modal dialogs
- Add, edit, and delete conferences
- Double-click any row to edit
- Autocomplete for professor, area, and project fields based on existing data

### History & Undo/Redo
- Full change history with timestamps and action descriptions
- Undo/Redo support (Ctrl+Z / Ctrl+Shift+Z)
- Revert to any previous state from the history panel
- All changes automatically tracked and persisted

### Custom Color Palette
- 17 customizable color settings for all status types
- Color picker with hex value display
- Reset to defaults

### Settings
- "Due soon" threshold (days)
- Timeline date range extension (before/after)
- Cell width control
- Toggle: current week highlight, legend, conferences, tooltips, project separators
- Compact mode
- Max history entries

### Data Management
- Export data as JSON or CSV
- Import data from JSON files
- Clear all data (reversible via history)
- All data persisted in browser localStorage

## Usage

Open `index.html` in a web browser. No build tools or server required.

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | Add new task |
| `C` | Add new conference |
| `H` | Toggle history panel |
| `S` | Toggle settings panel |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |

## File Structure

```
index.html          Main HTML page
css/styles.css      Complete stylesheet
js/store.js         Data store with localStorage persistence and history
js/timeline.js      Timeline rendering engine
js/ui.js            UI components (modals, forms, panels)
js/app.js           Main application controller
```

## License

MIT License - see LICENSE file for details.
