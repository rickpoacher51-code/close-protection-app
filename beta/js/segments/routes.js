CP.registerSegment({
  key: 'routes',
  label: 'Route Planning',
  icon: '🗺️',
  render: function (container) {
    container.innerHTML = '<h1>Route Planning</h1><div id="routesCrud"></div>';
    CP.ui.crud(container.querySelector('#routesCrud'), {
      storageKey: 'routes',
      addLabel: '+ Add Route',
      fields: [
        { key: 'name', label: 'Route Name', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Primary', 'Alternate'], badge: true },
        { key: 'origin', label: 'Origin', required: true },
        { key: 'destination', label: 'Destination', required: true },
        { key: 'estTime', label: 'Estimated Time' },
        { key: 'reviewStatus', label: 'Review Status', type: 'select', options: ['Draft', 'Reviewed', 'Approved'], badge: true },
        { key: 'vulnerablePoints', label: 'Vulnerable Points / RVPs', type: 'textarea' },
        { key: 'attachmentLinks', label: 'Attachment Links (annotated maps, waypoint files — paste Drive/Photos URLs, one per line)', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'type', 'origin', 'destination', 'estTime', 'reviewStatus'],
      emptyMessage: 'No routes added yet.',
      rowLinks: function (rec) {
        return (rec.origin && rec.destination) ? [{ label: 'Map', url: CP.ui.mapsDirLink(rec.origin, rec.destination) }] : [];
      }
    });
  }
});
