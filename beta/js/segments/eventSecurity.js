CP.registerSegment({
  key: 'eventSecurity',
  label: 'Event Security',
  icon: '🛡️',
  render: function (container) {
    container.innerHTML =
      '<h1>Event Security</h1>' +
      '<section class="panel"><h2>Security Plan</h2><div id="evPlan"></div></section>' +
      '<section class="panel"><h2>Incident Log</h2><div id="evLog"></div></section>';

    CP.ui.profileForm(container.querySelector('#evPlan'), {
      storageKey: 'eventSecurityPlan',
      fields: [
        { key: 'eventName', label: 'Event Name' },
        { key: 'venue', label: 'Venue' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'threatLevel', label: 'Threat Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
        { key: 'accessControlPlan', label: 'Access Control Plan', type: 'textarea' },
        { key: 'screeningPlan', label: 'Screening Plan', type: 'textarea' },
        { key: 'seatingStagePlan', label: 'Seating / Stage Plan', type: 'textarea' }
      ]
    });

    CP.ui.crud(container.querySelector('#evLog'), {
      storageKey: 'eventIncidentLog',
      addLabel: '+ Log Incident',
      fields: [
        { key: 'time', label: 'Time', type: 'time' },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
        { key: 'reportedBy', label: 'Reported By' }
      ],
      columns: ['time', 'description', 'reportedBy'],
      emptyMessage: 'No incidents logged.'
    });
  }
});
