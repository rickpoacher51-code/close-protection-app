CP.registerSegment({
  key: 'dashboard',
  label: 'Dashboard',
  icon: '🏠',
  render: function (container) {
    container.innerHTML =
      '<h1>Operation Overview</h1>' +
      '<section class="panel"><h2>Operation Details</h2><div id="opInfo"></div></section>' +
      '<section class="panel"><h2>Quick Access</h2><div id="quickGrid" class="quick-grid"></div></section>';

    CP.ui.profileForm(container.querySelector('#opInfo'), {
      storageKey: 'opInfo',
      fields: [
        { key: 'operationName', label: 'Operation Name' },
        { key: 'principalName', label: 'Principal' },
        { key: 'startDate', label: 'Start Date', type: 'date' },
        { key: 'endDate', label: 'End Date', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ]
    });

    var counts = {
      team: CP.storage.load('team', []).length,
      medical: CP.storage.load('casevacHospitals', []).length,
      routes: CP.storage.load('routes', []).length,
      advance: CP.storage.load('advanceVenues', []).length,
      eventSecurity: CP.storage.load('eventIncidentLog', []).length,
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
      { key: 'eventSecurity', label: 'Event Security', desc: counts.eventSecurity + ' log entrie(s)' },
      { key: 'rst', label: 'RST', desc: counts.rst + ' roster entrie(s)' },
      { key: 'actionsOn', label: 'Actions On', desc: counts.actionsOn + ' drill(s)' },
      { key: 'threatZones', label: 'Global Threats & Extraction', desc: counts.threatZones + ' region(s) logged' },
      { key: 'travelDocs', label: 'Travel Documentation', desc: counts.travelDocs + ' countr(y/ies) logged' },
      { key: 'uklaws', label: 'UK Laws', desc: 'Reference' }
    ];

    container.querySelector('#quickGrid').innerHTML = cards.map(function (c) {
      return '<a class="quick-card" href="#' + c.key + '"><h3>' + c.label + '</h3><p>' + c.desc + '</p></a>';
    }).join('');
  }
});
