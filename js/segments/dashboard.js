function cpRenderOpsSwitcher(container) {
  var ops = CP.storage.getOperations();
  var currentId = CP.storage.getCurrentOperationId();
  var current = ops.filter(function (o) { return o.id === currentId; })[0];

  var options = ops.map(function (o) {
    return '<option value="' + o.id + '"' + (o.id === currentId ? ' selected' : '') + '>' + CP.ui.escapeHtml(o.name) + '</option>';
  }).join('');

  container.innerHTML =
    '<label class="field"><span>Viewing</span><select id="opsSelect">' + options + '</select></label>' +
    '<form class="inline-add-form" id="newOpForm">' +
    '<input type="text" id="newOpName" placeholder="New operation name...">' +
    '<button type="submit" class="btn btn-small btn-primary">+ Start New Operation</button>' +
    '</form>' +
    '<div class="form-actions" style="margin-top:10px;">' +
    '<button class="btn btn-small" id="renameOpBtn">Rename Current</button>' +
    (ops.length > 1 ? '<button class="btn btn-small btn-danger" id="deleteOpBtn">Delete Current Operation</button>' : '') +
    '</div>';

  container.querySelector('#opsSelect').addEventListener('change', function (e) {
    CP.storage.setCurrentOperationId(e.target.value);
    location.reload();
  });

  container.querySelector('#newOpForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = container.querySelector('#newOpName');
    var name = input.value.trim();
    if (!name) { alert('Enter a name for the new operation.'); return; }
    var id = CP.storage.createOperation(name);
    CP.storage.setCurrentOperationId(id);
    location.reload();
  });

  container.querySelector('#renameOpBtn').addEventListener('click', function () {
    var name = window.prompt('Rename operation:', current ? current.name : '');
    if (name && name.trim()) {
      CP.storage.renameOperation(currentId, name.trim());
      location.reload();
    }
  });

  var deleteBtn = container.querySelector('#deleteOpBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      if (!confirm('Delete operation "' + (current ? current.name : '') + '" and ALL of its data? This cannot be undone.')) return;
      CP.storage.deleteOperation(currentId);
      location.reload();
    });
  }
}

CP.registerSegment({
  key: 'dashboard',
  label: 'Dashboard',
  icon: '🏠',
  render: function (container) {
    container.innerHTML =
      '<h1>Operation Overview</h1>' +
      '<section class="panel"><h2>Operations</h2>' +
      '<p class="hint">Each operation has its own completely separate data — team, routes, medical, plans, everything. ' +
      'Start a new one to begin a fresh page without losing the last one; switch back to it anytime.</p>' +
      '<div id="opsSwitcher"></div></section>' +
      '<section class="panel"><h2>App Lock (PIN Security)</h2><div id="lockSettings"></div></section>' +
      '<section class="panel"><h2>Operation Details</h2><div id="opInfo"></div></section>' +
      '<section class="panel"><h2>Quick Access</h2><div id="quickGrid" class="quick-grid"></div></section>';

    cpRenderOpsSwitcher(container.querySelector('#opsSwitcher'));
    CP.lock.renderSettings(container.querySelector('#lockSettings'));

    CP.ui.profileForm(container.querySelector('#opInfo'), {
      storageKey: 'opInfo',
      fields: [
        { key: 'operationName', label: 'Operation Name' },
        { key: 'principalName', label: 'Principal' },
        { key: 'startDate', label: 'Start Date', type: 'date' },
        { key: 'endDate', label: 'End Date', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      validate: function (data) {
        if (data.startDate && data.endDate && data.endDate < data.startDate) {
          return 'End date can’t be before the start date.';
        }
        return null;
      }
    });

    var counts = {
      team: CP.storage.load('team', []).length,
      medical: CP.storage.load('casevacHospitals', []).length,
      routes: CP.storage.load('routes', []).length,
      advance: CP.storage.load('advanceVenues', []).length,
      eventSecurity: CP.storage.load('eventIncidentLog', []).length + CP.storage.load('eventDocuments', []).length,
      rst: CP.storage.load('rstRoster', []).length,
      actionsOn: CP.storage.load('actionsOnDrills', []).length,
      threatZones: CP.storage.load('threatRegions', []).length,
      travelDocs: CP.storage.load('travelDocs', []).length
    };

    var cards = [
      { key: 'team', label: 'Team List & Names', desc: counts.team + ' member(s)' },
      { key: 'medical', label: 'Medical', desc: counts.medical + ' hospital(s) logged' },
      { key: 'routes', label: 'Route Planning', desc: counts.routes + ' route(s)' },
      { key: 'advance', label: 'Advance Party', desc: counts.advance + ' venue(s)' },
      { key: 'eventSecurity', label: 'Event Security', desc: counts.eventSecurity + ' log entrie(s) / document(s)' },
      { key: 'rst', label: 'RST', desc: counts.rst + ' roster entrie(s)' },
      { key: 'actionsOn', label: 'Actions On', desc: counts.actionsOn + ' drill(s)' },
      { key: 'threatZones', label: 'Global Threats & Extraction', desc: counts.threatZones + ' region(s) logged' },
      { key: 'travelDocs', label: 'Travel Documentation', desc: counts.travelDocs + ' countr(y/ies) logged' },
      { key: 'uklaws', label: 'UK Laws', desc: 'Reference' },
      { key: 'export', label: 'Export Document', desc: 'Share a Word-compatible copy' }
    ];

    container.querySelector('#quickGrid').innerHTML = cards.map(function (c) {
      return '<a class="quick-card" href="#' + c.key + '"><h3>' + c.label + '</h3><p>' + c.desc + '</p></a>';
    }).join('');
  }
});
