CP.registerSegment({
  key: 'documents',
  label: 'Documents',
  icon: '📄',
  render: function (container) {
    var docs = [
      {
        title: 'Event Security Plan — Template',
        desc: 'Generic, event-agnostic security plan template. Duplicate it, fill in one copy per event, then export to PDF and attach the completed version under that Operation\u2019s Event Security \u203a Venue Plans & Documents. Do not edit this master.',
        pdf: 'templates/Event_Security_Plan_Template.pdf',
        docx: 'templates/Event_Security_Plan_Template.docx'
      }
    ];

    container.innerHTML =
      '<h1>Documents</h1>' +
      '<p class="hint">Built-in reference templates shipped with the app. These are not tied to any Operation \u2014 they\u2019re the same on every install. Fill in a copy per event and store the completed version under that Operation\u2019s own Documents (Event Security tab), not here.</p>' +
      '<div class="card-grid">' +
      docs.map(function (d) {
        return '<div class="card">' +
          '<div class="card-head"><h3>' + CP.ui.escapeHtml(d.title) + '</h3></div>' +
          '<p class="notes">' + CP.ui.escapeHtml(d.desc) + '</p>' +
          '<div class="card-actions">' +
          '<a class="btn btn-small" href="' + d.pdf + '" download target="_blank" rel="noopener">Download PDF</a>' +
          '<a class="btn btn-small" href="' + d.docx + '" download target="_blank" rel="noopener">Download Word (editable)</a>' +
          '</div></div>';
      }).join('') +
      '</div>';
  }
});
