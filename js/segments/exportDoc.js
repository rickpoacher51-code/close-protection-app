function cpEsc(s) { return CP.ui.escapeHtml(s); }

function cpRecordTableHtml(list, excludeKeys) {
  if (!list || !list.length) return '<p><em>No data recorded.</em></p>';
  excludeKeys = excludeKeys || [];
  var keys = [];
  list.forEach(function (rec) {
    Object.keys(rec).forEach(function (k) {
      if (keys.indexOf(k) === -1 && excludeKeys.indexOf(k) === -1) keys.push(k);
    });
  });
  var head = keys.map(function (k) { return '<th>' + cpEsc(CP.ui.prettifyKey(k)) + '</th>'; }).join('');
  var rows = list.map(function (rec) {
    var tds = keys.map(function (k) {
      var val = rec[k];
      if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
      return '<td>' + cpEsc(val) + '</td>';
    }).join('');
    return '<tr>' + tds + '</tr>';
  }).join('');
  return '<table border="1" cellspacing="0" cellpadding="4"><tr>' + head + '</tr>' + rows + '</table>';
}

function cpProfileTableHtml(obj) {
  var keys = Object.keys(obj || {}).filter(function (k) { return obj[k]; });
  if (!keys.length) return '<p><em>No data recorded.</em></p>';
  var rows = keys.map(function (k) {
    return '<tr><td><strong>' + cpEsc(CP.ui.prettifyKey(k)) + '</strong></td><td>' + cpEsc(obj[k]) + '</td></tr>';
  }).join('');
  return '<table border="1" cellspacing="0" cellpadding="4">' + rows + '</table>';
}

function cpBuildOperationDocumentHtml() {
  var opInfo = CP.storage.load('opInfo', {});

  var sections = [
    { title: 'Operation Details', html: cpProfileTableHtml(opInfo) },
    { title: 'Team List & Names', html: cpRecordTableHtml(CP.storage.load('team', []), ['id']) },
    { title: 'Principal Medical Profile', html: cpProfileTableHtml(CP.storage.load('medicalProfile', {})) },
    { title: 'Principal’s Family / Next of Kin', html: cpRecordTableHtml(CP.storage.load('principalFamily', []), ['id']) },
    { title: 'CASEVAC — Nearest Hospitals', html: cpRecordTableHtml(CP.storage.load('casevacHospitals', []), ['id']) },
    { title: 'Medication Legality by Destination', html: cpRecordTableHtml(CP.storage.load('medicationLegality', []), ['id']) },
    { title: 'Route Planning', html: cpRecordTableHtml(CP.storage.load('routes', []), ['id']) },
    { title: 'Advance Party — Venues', html: cpRecordTableHtml(CP.storage.load('advanceVenues', []), ['id']) },
    { title: 'Comms / Emergency Contacts', html: cpRecordTableHtml(CP.storage.load('commsContacts', []), ['id']) },
    { title: 'Advance Party — Tasks', html: cpRecordTableHtml(CP.storage.load('advanceTasks', []), ['id']) },
    { title: 'Event Security Plan', html: cpProfileTableHtml(CP.storage.load('eventSecurityPlan', {})) },
    { title: 'Event Security — Venue Plans & Documents', html: cpRecordTableHtml(CP.storage.load('eventDocuments', []), ['id', 'dataUrl', 'fileType']) },
    { title: 'Event Security — Incident Log', html: cpRecordTableHtml(CP.storage.load('eventIncidentLog', []), ['id']) },
    { title: 'RST — Shift Roster', html: cpRecordTableHtml(CP.storage.load('rstRoster', []), ['id']) },
    { title: 'RST — Visitor Log', html: cpRecordTableHtml(CP.storage.load('rstVisitorLog', []), ['id']) },
    { title: 'RST — Patrol Log', html: cpRecordTableHtml(CP.storage.load('rstPatrolLog', []), ['id']) },
    { title: 'Actions On', html: cpRecordTableHtml(CP.storage.load('actionsOnDrills', []), ['id']) },
    { title: 'Global Threats — Regional Assessment', html: cpRecordTableHtml(CP.storage.load('threatRegions', []), ['id']) },
    { title: 'Safe Havens', html: cpRecordTableHtml(CP.storage.load('safeHavens', []), ['id']) },
    { title: 'Extraction Points & Airports', html: cpRecordTableHtml(CP.storage.load('extractionPoints', []), ['id']) },
    { title: 'Travel Documentation', html: cpRecordTableHtml(CP.storage.load('travelDocs', []), ['id']) }
  ];

  var opName = opInfo.operationName || 'Close Protection Operation';
  var generated = new Date().toLocaleString();

  var body = '<h1>' + cpEsc(opName) + ' — Operation Export</h1>' +
    '<p><em>Generated ' + cpEsc(generated) + ' from Close Protection Ops. This is a working export for team coordination ' +
    '— verify safety-critical details (medical, threat, legal) independently before acting on them.</em></p>';

  sections.forEach(function (s) {
    body += '<h2>' + cpEsc(s.title) + '</h2>' + s.html;
  });

  return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"><title>' + cpEsc(opName) + ' Export</title></head>' +
    '<body style="font-family: Calibri, Arial, sans-serif;">' + body + '</body></html>';
}

function cpDownloadOperationDocument() {
  var html = cpBuildOperationDocumentHtml();
  var blob = new Blob(['﻿', html], { type: 'application/msword' });
  var url = URL.createObjectURL(blob);
  var opInfo = CP.storage.load('opInfo', {});
  var stamp = new Date().toISOString().slice(0, 10);
  var namePart = (opInfo.operationName || 'operation').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'operation';
  var a = document.createElement('a');
  a.href = url;
  a.download = namePart + '-export-' + stamp + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

CP.registerSegment({
  key: 'export',
  label: 'Export Document',
  icon: '📤',
  render: function (container) {
    container.innerHTML =
      '<h1>Export Document</h1>' +
      '<p class="hint">Generates one Word-compatible document containing everything currently stored in this app — team list, ' +
      'medical, routes, plans, logs, and reference lists. Share the downloaded file by email or drive; anyone can open and edit their ' +
      'own copy in Microsoft Word, Google Docs, or Pages. This is a snapshot, not live sync — edits others make in the document ' +
      'won’t come back into this app automatically.</p>' +
      '<div class="segment-toolbar"><button class="btn btn-primary" id="exportDocBtn">Generate & Download Document</button></div>';

    container.querySelector('#exportDocBtn').addEventListener('click', cpDownloadOperationDocument);
  }
});
