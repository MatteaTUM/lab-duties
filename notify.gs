/**
 * Lab Duties ISBM – daily order email
 *
 * Runs in Google Apps Script (script.google.com) under the lab manager's Google account.
 * Every weekday evening it reads that day's checklist from the Firebase database and emails
 * the responsible person of the month:
 *   - restock items marked "Order needed? yes" or ✗, with their min level / fill to,
 *   - daily checks marked ✗ (problems), with comments.
 * Nothing is sent on days with nothing to order and no problems.
 *
 * Setup: see SETUP.md, step 6. Fill in the emails below – they stay private in this script.
 */

// ============ Settings ============
const RESPONSIBLE = {          // month number (1 = January … 12 = December) → email
  11: '',                      // November – Mattea
  12: '',                      // December – Julian
  1:  '',                      // January  – Xiya
  2:  '',                      // February – not assigned yet
};
const FALLBACK_EMAIL = '';     // gets the email when no one is set for the month (e.g. the lab manager)
const SEND_HOUR = 18;          // around 18:00 Berlin time (round time is 17:30)
const INCLUDE_PROBLEMS = true; // also list daily checks marked ✗
const APP_URL = 'https://matteatum.github.io/lab-duties/';
const PROJECT_ID = 'lab-duties';
const LAB = 'isbm';
const TZ = 'Europe/Berlin';

// Same lists and order as in the app (index.html)
const RESTOCK = ['Serological pipettes 5 ml','Serological pipettes 10 ml','Serological pipettes 25 ml','Filter tips 10 µl','Filter tips 200 µl','Filter tips 1000 µl','Cell plates 96-well','Cell plates 48-well','Cell plates 24-well','Cell plates 12-well','Cell plates 6-well','Culture dishes 10cm and 15cm','1.5 ml tubes','15 ml Falcon','50 ml Falcon','Reservoirs','70% Ethanol'];
const DAILY = {1:'Fridges & freezers',2:'Water bath',3:'Enzymes, oligos, maxipreps',4:'Kits',5:'Bench cleared',6:'Bench wiped',7:'Pipettes',8:'Bench bins / biohazard / sharps',9:'37 °C room',10:'4 °C cold room',11:'-80 °C freezer',12:'Blue-light transilluminator / gel doc',13:'Thermocyclers',14:'Gels',15:'Erlenmeyer flasks (agarose)',16:'Gel waste / trash',17:'HCS Studio',18:'Maxi column regeneration',19:'Bench cleared & wiped (Room 010)',20:'Biosafety cabinet',21:'Hood waste',22:'Aspiration pump',23:'Metal bead bath',24:'Media & solutions',25:'Microscope',26:'Incubator(s)',27:'CO₂ supply',28:'Surfaces & centrifuge',29:'Sticky mat',30:'Consumables'};

// ============ Run these ============

/** Run once after filling in the settings: sends today's email right away (even if empty). */
function testNotification(){ sendFor_(new Date(), true); }

/** Run once: schedules the daily email (Mon–Fri around SEND_HOUR). */
function installTrigger(){
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyOrderEmail').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyOrderEmail').timeBased().everyDays(1).atHour(SEND_HOUR).inTimezone(TZ).create();
  Logger.log('Daily email scheduled for about ' + SEND_HOUR + ':00 (' + TZ + ').');
}

/** Called by the trigger. */
function dailyOrderEmail(){ sendFor_(new Date(), false); }

// ============ Internals ============
function sendFor_(date, isTest){
  const weekday = Number(Utilities.formatDate(date, TZ, 'u')); // 1 = Mon … 7 = Sun
  if (!isTest && weekday >= 6) return;
  const key = Utilities.formatDate(date, TZ, 'yyyy-MM-dd');
  const month = Number(Utilities.formatDate(date, TZ, 'M'));
  const day = getDoc_('day-' + key) || {};
  const settings = getDoc_('settings') || {};

  const order = [];
  RESTOCK.forEach((name, i) => {
    const o = pick_(day, ['order', i]), st = pick_(day, ['restock', i]);
    if (o === 'yes' || st === '✗') order.push({
      name, status: st || '', order: o || '',
      loc: pick_(settings, ['restock', i, 'loc']) || '', min: pick_(settings, ['restock', i, 'min']) || '', fill: pick_(settings, ['restock', i, 'fill']) || '',
      by: pick_(day, ['by', 'restock_' + i]) || ''
    });
  });
  const problems = [];
  if (INCLUDE_PROBLEMS) Object.keys(DAILY).forEach(n => {
    if (pick_(day, ['daily', n]) === '✗') problems.push({
      n, name: DAILY[n], cmt: pick_(day, ['cmt', n]) || '', reading: pick_(day, ['read', n]) || '', by: pick_(day, ['by', 'daily_' + n]) || ''
    });
  });

  if (!order.length && !problems.length && !isTest) return;
  const to = RESPONSIBLE[month] || FALLBACK_EMAIL;
  if (!to) throw new Error('No email set for month ' + month + ' and no FALLBACK_EMAIL.');

  const dateText = Utilities.formatDate(date, TZ, 'EEEE, d MMMM yyyy');
  const subject = 'Lab duty ' + Utilities.formatDate(date, TZ, 'd MMM') + ': ' +
    (order.length ? order.length + ' item' + (order.length > 1 ? 's' : '') + ' to order' : 'nothing to order') +
    (problems.length ? ', ' + problems.length + ' problem' + (problems.length > 1 ? 's' : '') : '') + (isTest ? ' (test)' : '');

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const th = 'style="text-align:left;padding:6px 8px;border-bottom:1px solid #ccd;background:#eef1f6;font-size:12px"';
  const td = 'style="padding:6px 8px;border-bottom:1px solid #e3e6ec;font-size:14px"';
  let html = '<div style="font-family:Arial,sans-serif;color:#1b2230">' +
    '<h2 style="margin:0 0 4px">Lab duty – ' + esc(dateText) + '</h2>' +
    '<p style="margin:0 0 16px;color:#5a6477">Summary of today\'s end-of-day round.</p>';
  if (order.length){
    html += '<h3 style="margin:16px 0 6px">To order / restock</h3><table style="border-collapse:collapse;width:100%"><tr>' +
      ['Item','Status','Order?','Location','Min level','Fill to','Checked by'].map(h => '<th ' + th + '>' + h + '</th>').join('') + '</tr>' +
      order.map(r => '<tr>' + [r.name, r.status, r.order, r.loc, r.min, r.fill, r.by].map(v => '<td ' + td + '>' + esc(v || '–') + '</td>').join('') + '</tr>').join('') + '</table>';
  } else html += '<p>Nothing marked to order today.</p>';
  if (problems.length){
    html += '<h3 style="margin:16px 0 6px">Problems in the daily check (✗)</h3><table style="border-collapse:collapse;width:100%"><tr>' +
      ['#','Check','Comment','Reading','By'].map(h => '<th ' + th + '>' + h + '</th>').join('') + '</tr>' +
      problems.map(r => '<tr>' + [r.n, r.name, r.cmt, r.reading, r.by].map(v => '<td ' + td + '>' + esc(v || '–') + '</td>').join('') + '</tr>').join('') + '</table>';
  }
  html += '<p style="margin-top:20px"><a href="' + APP_URL + '">Open Lab Duties</a></p></div>';

  MailApp.sendEmail({ to, subject, htmlBody: html, name: 'Lab Duties ISBM' });
  Logger.log('Sent to ' + to + ': ' + subject);
}

function getDoc_(id){
  const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/labs/' + LAB + '/docs/' + encodeURIComponent(id);
  const r = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT_ID },
    muteHttpExceptions: true
  });
  if (r.getResponseCode() === 404) return null;
  if (r.getResponseCode() !== 200) throw new Error('Database read failed (' + r.getResponseCode() + '): ' + r.getContentText().slice(0, 300));
  const doc = JSON.parse(r.getContentText());
  return decode_({ mapValue: { fields: doc.fields || {} } });
}
function decode_(v){
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode_);
  if ('mapValue' in v){ const o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(k => o[k] = decode_(f[k])); return o; }
  return null;
}
function pick_(obj, path){ return path.reduce((o, k) => (o && typeof o === 'object') ? o[String(k)] : undefined, obj); }
