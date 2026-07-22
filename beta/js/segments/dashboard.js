CP.registerSegment({
  key: 'dashboard',
  label: 'Dashboard',
  icon: '🏠',
  render: function (container) {
    var op = CP.ops.get(CP.ops.current());

    container.innerHTML =
      '<h1>Operation Overview</h1>' +
      '<section class="panel"><h2>Operation Details</h2><div id="opInfo"></div></section>' +
      '<section class="panel glance-panel"><h2>At a Glance</h2><div id="glanceGrid" class="glance-grid"></div></section>' +
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

    // --- At a Glance --------------------------------------------------
    var team = CP.storage.load('team', []);
    var roleCounts = {};
    team.forEach(function (t) {
      if (!t.role) return;
      roleCounts[t.role] = (roleCounts[t.role] || 0) + 1;
    });
    var roleSummary = Object.keys(roleCounts).map(function (r) { return roleCounts[r] + ' ' + r; }).join(', ');

    var advanceVenues = CP.storage.load('advanceVenues', []);
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = advanceVenues
      .filter(function (v) { return v.eventDate && v.eventDate >= today; })
      .sort(function (a, b) { return a.eventDate < b.eventDate ? -1 : 1; })[0];

    var advanceTasks = CP.storage.load('advanceTasks', []);
    var openTasks = advanceTasks.filter(function (t) { return t.status !== 'Done'; });

    var teamLeaders = team.filter(function (t) { return t.role === 'Team Leader' && t.phone; });
    var medProfile = CP.storage.load('medicalProfile', {});

    var glanceCards = [];

    glanceCards.push({
      label: 'Team',
      value: team.length ? team.length + ' on roster' : 'No team added',
      sub: roleSummary || 'Add team members to see role breakdown'
    });

    glanceCards.push({
      label: 'Next Movement / Venue',
      value: upcoming ? upcoming.venueName : 'None scheduled',
      sub: upcoming ? upcoming.eventDate + (upcoming.address ? ' — ' + upcoming.address : '') : 'Add an Advance Party venue with an event date'
    });

    glanceCards.push({
      label: 'Open Advance Tasks',
      value: openTasks.length + ' open',
      sub: (advanceTasks.length - openTasks.length) + ' done of ' + advanceTasks.length + ' total'
    });

    glanceCards.push({
      label: 'Key Contact',
      value: teamLeaders.length ? teamLeaders[0].name + ' (TL)' : 'No Team Leader with phone set',
      sub: teamLeaders.length ? teamLeaders[0].phone : 'Set a Team Leader + phone in Team List'
    });

    var medFlags = [];
    if (medProfile.allergies) medFlags.push('Allergies on file');
    if (medProfile.conditions) medFlags.push('Conditions on file');
    if (medProfile.medications) medFlags.push('Medications on file');
    glanceCards.push({
      label: 'Medical',
      value: medProfile.medicOnTeam ? ('Medic: ' + medProfile.medicOnTeam) : 'No medic assigned',
      // Deliberately not showing the actual allergy/condition text here —
      // this is a glance screen, not somewhere sensitive detail should be
      // readable at a distance. Full detail lives in the Medical section.
      sub: medFlags.length ? medFlags.join(', ') + ' — see Medical' : 'No medical profile entered yet'
    });

    container.querySelector('#glanceGrid').innerHTML = glanceCards.map(function (c) {
      return '<div class="glance-card"><span class="glance-label">' + CP.ui.escapeHtml(c.label) + '</span>' +
        '<span class="glance-value">' + CP.ui.escapeHtml(c.value) + '</span>' +
        '<span class="glance-sub">' + CP.ui.escapeHtml(c.sub) + '</span></div>';
    }).join('');

    // --- Quick Access ---------------------------------------------------
    var counts = {
      team: team.length,
      medical: CP.storage.load('casevacHospitals', []).length,
      routes: CP.storage.load('routes', []).length,
      advance: advanceVenues.length,
      eventSecurity: CP.storage.load('eventIncidentLog', []).length,
      rst: CP.storage.load('rstRoster', []).length,
      actionsOn: CP.storage.load('actionsOnDrills', []).length,
      threatZones: CP.storage.load('threatRegions', []).length,
      travelDocs: CP.storage.load('travelDocs', []).length,
      commsTree: CP.storage.load('commsEntries', []).length
    };

    var cards = [
      { key: 'team', label: 'Team List & Names', desc: counts.team + ' member(s)' },
      { key: 'commsTree', label: 'Communications Tree', desc: counts.commsTree + ' entrie(s)' },
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
