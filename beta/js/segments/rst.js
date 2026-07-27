CP.registerSegment({
  key: 'rst',
  label: 'RST',
  icon: '🏘️',
  render: function (container) {
    container.innerHTML =
      '<h1>RST — Residential Security Team</h1>' +
      '<section class="panel"><h2>Shift Roster</h2><div id="rstRoster"></div></section>' +
      '<section class="panel"><h2>Perimeter & Access Checklist</h2><div id="rstChecklist"></div></section>' +
      '<section class="panel"><h2>Visitor Log</h2><div id="rstVisitors"></div></section>' +
      '<section class="panel"><h2>Patrol Log</h2><div id="rstPatrol"></div></section>';

    CP.ui.crud(container.querySelector('#rstRoster'), {
      storageKey: 'rstRoster',
      addLabel: '+ Add Roster Entry',
      fields: [
        { key: 'name', label: 'Name', required: true },
        { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night', 'Swing'], badge: true },
        { key: 'position', label: 'Post / Position' },
        { key: 'startTime', label: 'Start Time', type: 'time' },
        { key: 'endTime', label: 'End Time', type: 'time' },
        { key: 'phone', label: 'Phone', type: 'tel' }
      ],
      columns: ['name', 'shift', 'position', 'startTime', 'endTime'],
      emptyMessage: 'No roster entries yet.'
    });

    CP.ui.checklist(container.querySelector('#rstChecklist'), {
      storageKey: 'rstPerimeterChecklist',
      defaultItems: [
        'Perimeter fence / wall intact',
        'All gates locked / functioning',
        'CCTV cameras operational',
        'Alarm system armed',
        'External lighting operational',
        'Intercom / access control functioning',
        'Vehicle checks completed'
      ]
    });

    CP.ui.crud(container.querySelector('#rstVisitors'), {
      storageKey: 'rstVisitorLog',
      addLabel: '+ Log Visitor',
      fields: [
        { key: 'visitorName', label: 'Visitor Name', required: true },
        { key: 'company', label: 'Company / Reason' },
        { key: 'timeIn', label: 'Time In', type: 'time' },
        { key: 'timeOut', label: 'Time Out', type: 'time' },
        { key: 'idChecked', label: 'ID Checked', type: 'select', options: ['Yes', 'No'], badge: true },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['visitorName', 'company', 'timeIn', 'timeOut', 'idChecked'],
      emptyMessage: 'No visitors logged.'
    });

    CP.ui.crud(container.querySelector('#rstPatrol'), {
      storageKey: 'rstPatrolLog',
      addLabel: '+ Log Patrol',
      fields: [
        { key: 'time', label: 'Time', type: 'time' },
        { key: 'officer', label: 'Officer' },
        { key: 'observations', label: 'Observations', type: 'textarea', required: true },
        { key: 'actionTaken', label: 'Action Taken', type: 'textarea' }
      ],
      columns: ['time', 'officer', 'observations'],
      emptyMessage: 'No patrol entries logged.'
    });
  }
});
