CP.registerSegment({
  key: 'travelDocs',
  label: 'Travel Documentation',
  icon: '🛂',
  render: function (container) {
    container.innerHTML =
      '<h1>Travel Documentation</h1>' +
      '<div class="disclaimer">Visa and entry requirements depend on passport nationality, change frequently, and differ for ' +
      'diplomatic/official passports and firearms/equipment carriage. This is a record of your own research — always verify ' +
      'current requirements directly with the destination country’s embassy/consulate or your government’s official travel ' +
      'advisory before travel.</div>' +
      '<p class="hint">Each row links to that country’s GOV.UK Foreign Travel Advice page. The direct link is a best-effort guess from the country name typed — if it 404s, use the Search link instead.</p>' +
      '<div id="travelDocsCrud"></div>';

    CP.ui.crud(container.querySelector('#travelDocsCrud'), {
      storageKey: 'travelDocs',
      addLabel: '+ Add Country',
      searchable: true,
      searchPlaceholder: 'Search by country...',
      fields: [
        { key: 'country', label: 'Country', required: true },
        { key: 'docStatus', label: 'Entry Requirement', type: 'select', options: ['Visa Required', 'eVisa Required', 'Visa on Arrival', 'ETA / ESTA Required', 'Visa-Free', 'Unknown / Check'], badge: true },
        { key: 'maxStay', label: 'Max Stay Allowed' },
        { key: 'passportValidity', label: 'Passport Validity Rule (e.g. 6 months)' },
        { key: 'otherDocs', label: 'Other Required Docs (proof of onward travel, vaccination cert, etc.)', type: 'textarea' },
        { key: 'lastChecked', label: 'Last Verified', type: 'date' },
        { key: 'sourceNotes', label: 'Notes / Source', type: 'textarea' }
      ],
      columns: ['country', 'docStatus', 'maxStay', 'lastChecked'],
      emptyMessage: 'No countries logged yet.',
      rowLinks: function (rec) { return CP.ui.govukLinks(rec.country); }
    });
  }
});
