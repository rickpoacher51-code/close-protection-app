CP.registerSegment({
  key: 'advance',
  label: 'Advance Party',
  icon: '🎯',
  render: function (container) {
    container.innerHTML =
      '<h1>Advance Party</h1>' +
      '<section class="panel"><h2>Venues</h2><div id="advVenues"></div></section>' +
      '<section class="panel"><h2>Advance Tasks</h2><div id="advTasks"></div></section>';

    CP.ui.crud(container.querySelector('#advVenues'), {
      storageKey: 'advanceVenues',
      addLabel: '+ Add Venue',
      fields: [
        { key: 'venueName', label: 'Venue Name', required: true },
        { key: 'address', label: 'Address', required: true },
        { key: 'eventDate', label: 'Event Date', type: 'date' },
        { key: 'contactName', label: 'Venue Contact Name' },
        { key: 'contactPhone', label: 'Venue Contact Phone', type: 'tel' },
        { key: 'parking', label: 'Parking Notes', type: 'textarea' },
        { key: 'cctv', label: 'CCTV Coverage', type: 'textarea' },
        { key: 'entryExit', label: 'Entry / Exit Points', type: 'textarea' },
        { key: 'comms', label: 'Comms Plan', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['venueName', 'address', 'eventDate', 'contactName'],
      emptyMessage: 'No venues added yet.',
      rowLinks: function (rec) { return rec.address ? [{ label: 'Map', url: CP.ui.mapsLink(rec.address) }] : []; }
    });

    CP.ui.crud(container.querySelector('#advTasks'), {
      storageKey: 'advanceTasks',
      addLabel: '+ Add Task',
      fields: [
        { key: 'task', label: 'Task', required: true },
        { key: 'venue', label: 'Venue' },
        { key: 'owner', label: 'Owner' },
        { key: 'dueDate', label: 'Due Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Done'], badge: true }
      ],
      columns: ['task', 'venue', 'owner', 'dueDate', 'status'],
      emptyMessage: 'No advance tasks added yet.'
    });
  }
});
