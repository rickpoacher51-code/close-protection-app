CP.registerSegment({
  key: 'threatZones',
  label: 'Global Threats & Extraction',
  icon: '🌍',
  render: function (container) {
    container.innerHTML =
      '<h1>Global Threats & Extraction</h1>' +
      '<div class="disclaimer">This section stores your own team’s assessments — it is not a live threat feed. ' +
      'Threat levels change constantly. Always verify current ratings against official sources (e.g. UK FCDO Travel Advice, ' +
      'US State Department Travel Advisories, your organisation’s intelligence cell, or a commercial risk provider) ' +
      'before making operational decisions.</div>' +
      '<section class="panel"><h2>Regional Threat Assessment</h2>' +
      '<p class="hint">Each row links to that country’s GOV.UK Foreign Travel Advice page. The direct link is a best-effort guess from the name typed — if it 404s, use the Search link instead.</p>' +
      '<div id="threatRegions"></div></section>' +
      '<section class="panel"><h2>Safe Havens</h2><div id="safeHavens"></div></section>' +
      '<section class="panel"><h2>Extraction Points & Airports</h2><div id="extractionPoints"></div></section>';

    CP.ui.crud(container.querySelector('#threatRegions'), {
      storageKey: 'threatRegions',
      addLabel: '+ Add Region',
      fields: [
        { key: 'region', label: 'Country / Region', required: true },
        { key: 'threatLevel', label: 'Threat Level', type: 'select', options: ['Low', 'Medium', 'High', 'Extreme'], badge: true },
        { key: 'threatType', label: 'Primary Threat Type(s)' },
        { key: 'lastReviewed', label: 'Last Reviewed', type: 'date' },
        { key: 'sourceNotes', label: 'Assessment Notes / Source', type: 'textarea' }
      ],
      columns: ['region', 'threatLevel', 'threatType', 'lastReviewed'],
      emptyMessage: 'No regions assessed yet.',
      rowLinks: function (rec) { return CP.ui.govukLinks(rec.region); }
    });

    CP.ui.crud(container.querySelector('#safeHavens'), {
      storageKey: 'safeHavens',
      addLabel: '+ Add Safe Haven',
      fields: [
        { key: 'name', label: 'Location Name', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Embassy / Consulate', 'Designated Safe House', 'Friendly Military Base', 'Hotel Safe Room', 'Other'], badge: true },
        { key: 'address', label: 'Address' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'contactName', label: 'Contact Name' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'type', 'address', 'phone'],
      emptyMessage: 'No safe havens added yet.',
      rowLinks: function (rec) { return rec.address ? [{ label: 'Map', url: CP.ui.mapsLink(rec.address) }] : []; }
    });

    CP.ui.crud(container.querySelector('#extractionPoints'), {
      storageKey: 'extractionPoints',
      addLabel: '+ Add Extraction Point',
      fields: [
        { key: 'name', label: 'Name', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['International Airport', 'Regional Airport', 'Heliport / LZ', 'Seaport', 'Land Border Crossing', 'Rail'], badge: true },
        { key: 'address', label: 'Address' },
        { key: 'distanceFromBase', label: 'Distance / Time from Base' },
        { key: 'notes', label: 'Access Notes / Restrictions', type: 'textarea' }
      ],
      columns: ['name', 'type', 'address', 'distanceFromBase'],
      emptyMessage: 'No extraction points added yet.',
      rowLinks: function (rec) { return rec.address ? [{ label: 'Map', url: CP.ui.mapsLink(rec.address) }] : []; }
    });
  }
});
