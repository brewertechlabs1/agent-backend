/**
 * Storage Unit Inventory Manager
 * ------------------------------
 * Runs entirely on Google Apps Script (free with a Google account).
 *  - Inventory data  -> Google Sheets
 *  - Item photos     -> Google Drive
 *  - Client bookings -> Google Calendar (with reminders)
 *
 * ONE-TIME SETUP: run the setup() function once from the editor (see SETUP.md).
 * It creates the spreadsheet, the Drive photo folder, and a dedicated calendar,
 * then remembers their IDs so nothing has to be configured by hand.
 */

var APP_NAME = 'Storage Inventory';
var PROP_SPREADSHEET = 'SPREADSHEET_ID';
var PROP_PHOTO_FOLDER = 'PHOTO_FOLDER_ID';
var PROP_CALENDAR = 'CALENDAR_ID';

var INVENTORY_HEADERS = [
  'ID', 'Name', 'Description', 'Category', 'Unit', 'Quantity',
  'Value', 'Status', 'PhotoIds', 'Notes', 'DateAdded', 'DateUpdated'
];
var CLIENT_HEADERS = [
  'ID', 'Name', 'Phone', 'Email', 'Unit', 'MoveInDate', 'Notes', 'DateAdded'
];

/* ============================= ONE-TIME SETUP ============================= */

/**
 * Run this once from the Apps Script editor. Safe to run again later —
 * it only creates things that don't exist yet.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();

  // 1. Spreadsheet with Inventory + Clients sheets
  var ssId = props.getProperty(PROP_SPREADSHEET);
  var ss;
  if (ssId) {
    ss = SpreadsheetApp.openById(ssId);
  } else {
    ss = SpreadsheetApp.create(APP_NAME);
    props.setProperty(PROP_SPREADSHEET, ss.getId());
  }
  ensureSheet_(ss, 'Inventory', INVENTORY_HEADERS);
  ensureSheet_(ss, 'Clients', CLIENT_HEADERS);
  var extra = ss.getSheetByName('Sheet1');
  if (extra && ss.getSheets().length > 2) ss.deleteSheet(extra);

  // 2. Drive folder for photos
  if (!props.getProperty(PROP_PHOTO_FOLDER)) {
    var folder = DriveApp.createFolder(APP_NAME + ' Photos');
    props.setProperty(PROP_PHOTO_FOLDER, folder.getId());
  }

  // 3. Dedicated calendar for client appointments
  if (!props.getProperty(PROP_CALENDAR)) {
    var cal = CalendarApp.createCalendar(APP_NAME + ' - Clients');
    props.setProperty(PROP_CALENDAR, cal.getId());
  }

  Logger.log('Setup complete!');
  Logger.log('Spreadsheet: https://docs.google.com/spreadsheets/d/' + props.getProperty(PROP_SPREADSHEET));
  Logger.log('Photo folder ID: ' + props.getProperty(PROP_PHOTO_FOLDER));
  Logger.log('Calendar ID: ' + props.getProperty(PROP_CALENDAR));
}

/** Runs setup() automatically the first time the web app is opened. */
function ensureSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_SPREADSHEET) ||
      !props.getProperty(PROP_PHOTO_FOLDER) ||
      !props.getProperty(PROP_CALENDAR)) {
    setup();
  }
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (String(firstRow[0]) !== headers[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

/* ============================= WEB APP ENTRY ============================== */

function doGet() {
  ensureSetup_(); // first visit auto-creates the Sheet, Drive folder, and calendar
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/* =============================== HELPERS ================================== */

function getSheet_(name) {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_SPREADSHEET);
  if (!id) throw new Error('Setup has not been run yet. Open the script editor and run setup().');
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

function getPhotoFolder_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_PHOTO_FOLDER);
  if (!id) throw new Error('Setup has not been run yet.');
  return DriveApp.getFolderById(id);
}

function getCalendar_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_CALENDAR);
  if (!id) throw new Error('Setup has not been run yet.');
  return CalendarApp.getCalendarById(id);
}

/** Read all rows of a sheet as objects keyed by header name. */
function readRows_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/** Find the 1-based row number for a given ID (column A). Returns -1 if absent. */
function findRowById_(sheet, id) {
  var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function thumbUrl_(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w500';
}

function viewUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + fileId + '/view';
}

/* ============================== INVENTORY ================================= */

function getItems() {
  var items = readRows_(getSheet_('Inventory'));
  items.forEach(function (it) {
    var ids = String(it.PhotoIds || '').split(',').filter(String);
    it.photos = ids.map(function (fid) {
      return { id: fid, thumb: thumbUrl_(fid), view: viewUrl_(fid) };
    });
  });
  // Newest first
  items.reverse();
  return items;
}

/**
 * Add an item. photos = [{name, mimeType, base64}] captured on the phone.
 */
function addItem(item, photos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Inventory');
    var id = Utilities.getUuid();
    var photoIds = savePhotos_(photos, item.name || 'item');
    var now = new Date();
    sheet.appendRow([
      id,
      item.name || '',
      item.description || '',
      item.category || '',
      item.unit || '',
      item.quantity || 1,
      item.value || '',
      item.status || 'In Storage',
      photoIds.join(','),
      item.notes || '',
      now,
      now
    ]);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

/** Update an existing item; newPhotos are appended to its photo list. */
function updateItem(item, newPhotos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Inventory');
    var row = findRowById_(sheet, item.ID);
    if (row === -1) throw new Error('Item not found — it may have been deleted.');

    var existing = String(sheet.getRange(row, 9).getValue() || '')
      .split(',').filter(String);
    var keep = item.keepPhotoIds || existing; // UI sends which photos to keep
    var added = savePhotos_(newPhotos, item.name || 'item');
    var allIds = keep.concat(added);

    sheet.getRange(row, 2, 1, 11).setValues([[
      item.name || '',
      item.description || '',
      item.category || '',
      item.unit || '',
      item.quantity || 1,
      item.value || '',
      item.status || 'In Storage',
      allIds.join(','),
      item.notes || '',
      sheet.getRange(row, 11).getValue(), // preserve DateAdded
      new Date()
    ]]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteItem(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Inventory');
    var row = findRowById_(sheet, id);
    if (row === -1) return { ok: true };
    // Trash the photos too (recoverable from Drive trash for 30 days)
    var photoIds = String(sheet.getRange(row, 9).getValue() || '').split(',').filter(String);
    photoIds.forEach(function (fid) {
      try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) { /* already gone */ }
    });
    sheet.deleteRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function savePhotos_(photos, itemName) {
  if (!photos || !photos.length) return [];
  var folder = getPhotoFolder_();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmmss');
  return photos.map(function (p, i) {
    var blob = Utilities.newBlob(
      Utilities.base64Decode(p.base64),
      p.mimeType || 'image/jpeg',
      itemName + ' ' + stamp + (photos.length > 1 ? ' (' + (i + 1) + ')' : '') + '.jpg'
    );
    return folder.createFile(blob).getId();
  });
}

/* =============================== CLIENTS ================================== */

function getClients() {
  var clients = readRows_(getSheet_('Clients'));
  clients.sort(function (a, b) {
    return String(a.Name).toLowerCase() < String(b.Name).toLowerCase() ? -1 : 1;
  });
  return clients;
}

function addClient(c) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Clients');
    var id = Utilities.getUuid();
    sheet.appendRow([
      id, c.name || '', c.phone || '', c.email || '',
      c.unit || '', c.moveInDate || '', c.notes || '', new Date()
    ]);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function updateClient(c) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Clients');
    var row = findRowById_(sheet, c.ID);
    if (row === -1) throw new Error('Client not found.');
    sheet.getRange(row, 2, 1, 6).setValues([[
      c.name || '', c.phone || '', c.email || '',
      c.unit || '', c.moveInDate || '', c.notes || ''
    ]]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteClient(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_('Clients');
    var row = findRowById_(sheet, id);
    if (row !== -1) sheet.deleteRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ============================ CALENDAR / EVENTS =========================== */

/** Upcoming appointments for the next `days` days (default 60). */
function getUpcomingEvents(days) {
  var cal = getCalendar_();
  var now = new Date();
  var end = new Date(now.getTime() + (days || 60) * 24 * 60 * 60 * 1000);
  var tz = Session.getScriptTimeZone();
  return cal.getEvents(now, end).map(function (ev) {
    return {
      id: ev.getId(),
      title: ev.getTitle(),
      description: ev.getDescription(),
      start: ev.getStartTime().getTime(),
      startLabel: Utilities.formatDate(ev.getStartTime(), tz, 'EEE, MMM d, yyyy'),
      timeLabel: Utilities.formatDate(ev.getStartTime(), tz, 'h:mm a') +
                 ' - ' + Utilities.formatDate(ev.getEndTime(), tz, 'h:mm a')
    };
  });
}

/**
 * Create an appointment with reminders.
 * appt = { title, date:'yyyy-MM-dd', time:'HH:mm', durationMins,
 *          notes, reminderMins, emailReminder:boolean }
 */
function addAppointment(appt) {
  var cal = getCalendar_();
  var start = new Date(appt.date + 'T' + (appt.time || '09:00') + ':00');
  if (isNaN(start.getTime())) throw new Error('Please pick a valid date and time.');
  var end = new Date(start.getTime() + (Number(appt.durationMins) || 60) * 60 * 1000);

  var ev = cal.createEvent(appt.title || 'Appointment', start, end, {
    description: appt.notes || ''
  });
  ev.removeAllReminders();
  var mins = Number(appt.reminderMins);
  if (!isNaN(mins) && mins >= 0) {
    ev.addPopupReminder(mins);
    if (appt.emailReminder) ev.addEmailReminder(mins);
  }
  return { ok: true, id: ev.getId() };
}

function deleteAppointment(eventId) {
  var cal = getCalendar_();
  var ev = cal.getEventById(eventId);
  if (ev) ev.deleteEvent();
  return { ok: true };
}

/* ============================ DASHBOARD STATS ============================= */

function getDashboard() {
  var items = readRows_(getSheet_('Inventory'));
  var clients = readRows_(getSheet_('Clients'));
  var events = getUpcomingEvents(14);
  var totalValue = items.reduce(function (sum, it) {
    var v = parseFloat(it.Value);
    return sum + (isNaN(v) ? 0 : v * (parseFloat(it.Quantity) || 1));
  }, 0);
  return {
    itemCount: items.length,
    clientCount: clients.length,
    upcomingCount: events.length,
    totalValue: totalValue
  };
}
