CP.registerSegment({
  key: 'uklaws',
  label: 'UK Laws',
  icon: '⚖️',
  render: function (container) {
    var sections = [
      {
        title: 'SIA Licensing — Private Security Industry Act 2001',
        body: 'Close protection work in the UK is a licensable activity under the Private Security Industry Act 2001. Operatives generally require a valid SIA Close Protection licence to work in a CP role for reward. Check licence validity and renewal dates for every team member before deployment.'
      },
      {
        title: 'Martyn’s Law — Terrorism (Protection of Premises) Act 2025',
        body: 'Martyn’s Law places new counter-terrorism duties on those responsible for qualifying public premises and events, named after Martyn Hett, a victim of the 2017 Manchester Arena attack. A "standard tier" (broadly, venues/events with a capacity around 200+) requires basic preparedness — staff training, a public protection plan, and simple physical measures. An "enhanced tier" (broadly, capacity around 800+) adds a requirement for a documented assessment and more substantial security measures. The Security Industry Authority (SIA) is the appointed regulator. Thresholds, duties, and the enforcement start date were still being finalised in official guidance as this was written — confirm current requirements and the compliance deadline directly with the SIA’s Martyn’s Law guidance before treating any venue or event as compliant, and factor it into Event Security and Advance Party planning for any qualifying premises.'
      },
      {
        title: 'Use of Force — Criminal Law Act 1967 s.3 & Common Law Self-Defence',
        body: 'Any force used to protect the principal, yourself, or others must be reasonable and proportionate in the circumstances as honestly believed at the time. This applies equally to self-defence, defence of another, and prevention of crime. Excessive or pre-emptive force is not protected. Document any use of force as soon as practicable after the event.'
      },
      {
        title: 'Firearms — Firearms Act 1968',
        body: 'UK close protection operatives are, with very limited exception, unarmed. Carrying a firearm without the relevant certificate/authority is a serious criminal offence. Any armed CP tasking in the UK requires specific lawful authority; this is not the default position for private CP work.'
      },
      {
        title: 'Powers of Arrest / Detention — PACE 1984',
        body: 'CP operatives have no special police-style powers. Any detention is limited to the citizen’s arrest power under s.24A PACE (indictable offence, necessity, reasonable grounds) and must be handed to police without unreasonable delay. Unlawful detention can expose the operative and employer to civil and criminal liability.'
      },
      {
        title: 'Data Protection — Data Protection Act 2018 / UK GDPR',
        body: 'Notes, logs, photographs, route plans, and medical details collected in this app are personal data. Handle them under data minimisation, purpose limitation, and security principles: restrict access, do not retain longer than necessary, and have a lawful basis (typically contract or legitimate interests) for processing the principal’s data.'
      },
      {
        title: 'Driving — Road Traffic Act 1988',
        body: 'CP drivers hold no special exemptions from speed limits, traffic signals, or the general duty of care. Advanced driving qualifications reduce risk but do not confer legal privilege. Any incident involving a CP vehicle is assessed under ordinary road traffic law.'
      },
      {
        title: 'Health & Safety — Health and Safety at Work etc. Act 1974',
        body: 'Employers and self-employed operatives have duties to assess and manage risk to themselves, colleagues, and others affected by the work, including dynamic risk assessment for advance work, events, and travel.'
      }
    ];

    var accordionHtml = sections.map(function (s, i) {
      return '<details class="law-item"' + (i === 0 ? ' open' : '') + '><summary>' +
        CP.ui.escapeHtml(s.title) + '</summary><p>' + CP.ui.escapeHtml(s.body) + '</p></details>';
    }).join('');

    container.innerHTML =
      '<h1>UK Laws — Reference</h1>' +
      '<div class="disclaimer"><strong>Not legal advice.</strong> This is general reference material for awareness only. ' +
      'Laws, case law, and licensing requirements change — verify against current legislation and take advice from a solicitor ' +
      'or your company’s legal advisor before making operational or employment decisions.</div>' +
      '<div class="law-list">' + accordionHtml + '</div>' +
      '<section class="panel"><h2>Unit Notes</h2><div id="uklawsNotes"></div></section>' +
      '<section class="panel"><h2>App Terms & Disclaimer</h2><div id="disclaimerRecord"></div></section>';

    CP.ui.profileForm(container.querySelector('#uklawsNotes'), {
      storageKey: 'uklawsNotes',
      fields: [
        { key: 'notes', label: 'Notes (e.g. company policy references, licence renewal dates)', type: 'textarea' }
      ]
    });

    var acceptance = CP.disclaimer.getAcceptance();
    var recordHtml = acceptance
      ? '<p class="hint">Accepted on this device: <strong>' + CP.ui.escapeHtml(new Date(acceptance.acceptedAt).toLocaleString()) +
        '</strong> (version ' + CP.ui.escapeHtml(acceptance.version) + ')</p>'
      : '<p class="hint">Not yet recorded on this device.</p>';
    container.querySelector('#disclaimerRecord').innerHTML =
      recordHtml + '<details class="law-item"><summary>View full text</summary><div class="disclaimer-scroll" style="max-height:none;">' +
      CP.disclaimer.HTML + '</div></details>';
  }
});
