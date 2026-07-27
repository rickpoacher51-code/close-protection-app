CP.registerSegment({
  key: 'commsTree',
  label: 'Communications Tree',
  icon: '📡',
  render: function (container) {
    container.innerHTML =
      '<h1>Communications Tree</h1>' +
      '<p class="hint">Who reports to whom, and how to reach them. Keep this current — it is the first thing anyone should ' +
      'check when they need to escalate fast.</p>' +
      '<section class="panel"><h2>Control Room / Emergency Contact</h2><div id="commsControl"></div></section>' +
      '<section class="panel"><h2>Escalation Structure</h2><div id="commsTreeView"></div></section>' +
      '<section class="panel"><h2>Team Comms Entries</h2><div id="commsCrud"></div></section>';

    CP.ui.profileForm(container.querySelector('#commsControl'), {
      storageKey: 'commsControlRoom',
      fields: [
        { key: 'name', label: 'Control Room / Ops Name' },
        { key: 'callsign', label: 'Callsign' },
        { key: 'phone', label: 'Primary Number', type: 'tel' },
        { key: 'fallbackPhone', label: 'Fallback Number', type: 'tel' },
        { key: 'emergencyServicesNote', label: 'Local Emergency Services Number (country-specific)' }
      ]
    });

    var team = CP.storage.load('team', []);
    var nameOptions = team.map(function (t) { return t.name; }).filter(Boolean);

    function renderTreeView() {
      var entries = CP.storage.load('commsEntries', []);
      var wrap = container.querySelector('#commsTreeView');
      if (!entries.length) {
        wrap.innerHTML = '<p class="empty-msg">Add comms entries below to see the escalation structure here.</p>';
        return;
      }
      var byManager = {};
      entries.forEach(function (e) {
        var key = e.reportsTo || '(Top of chain)';
        byManager[key] = byManager[key] || [];
        byManager[key].push(e);
      });
      var roots = byManager['(Top of chain)'] || [];
      function renderNode(entry, depth) {
        var children = byManager[entry.name] || [];
        var contact = [entry.primaryContact, entry.fallbackContact].filter(Boolean).join(' / ');
        var html = '<li class="tree-node" style="margin-left:' + (depth * 18) + 'px">' +
          '<strong>' + CP.ui.escapeHtml(entry.name) + '</strong>' +
          (entry.role ? ' <span class="badge">' + CP.ui.escapeHtml(entry.role) + '</span>' : '') +
          (contact ? '<span class="tree-contact"> — ' + CP.ui.escapeHtml(contact) + '</span>' : '') +
          '</li>';
        children.forEach(function (c) { html += renderNode(c, depth + 1); });
        return html;
      }
      var out = '<ul class="tree-list">';
      if (roots.length) {
        roots.forEach(function (r) { out += renderNode(r, 0); });
      } else {
        out += '<li class="tree-node">No entry marked as top of chain — set "Reports To" to blank/"(Top of chain)" for the senior role.</li>';
      }
      out += '</ul>';
      wrap.innerHTML = out;
    }

    CP.ui.crud(container.querySelector('#commsCrud'), {
      storageKey: 'commsEntries',
      addLabel: '+ Add Comms Entry',
      fields: [
        { key: 'name', label: 'Name', required: true },
        { key: 'role', label: 'Role', type: 'select', options: ['Team Leader', 'PPO / Bodyguard', 'Driver', 'RST', 'Medic', 'Advance', 'Coordinator', 'Control Room', 'Other'], badge: true },
        { key: 'reportsTo', label: 'Reports To (leave blank if top of chain)', type: nameOptions.length ? 'select' : 'text', options: nameOptions },
        { key: 'primaryContact', label: 'Primary Contact (method + number)' },
        { key: 'fallbackContact', label: 'Fallback Contact (method + number)' }
      ],
      columns: ['name', 'role', 'reportsTo', 'primaryContact'],
      emptyMessage: 'No comms entries added yet.'
    });

    renderTreeView();
    // Re-render the derived tree whenever the CRUD list changes underneath it.
    var origSave = CP.storage.save;
    container.addEventListener('click', function () { setTimeout(renderTreeView, 0); });
  }
});
