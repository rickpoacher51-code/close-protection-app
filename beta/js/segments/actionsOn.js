function cpSeedActionsOnDefaults() {
  if (CP.storage.load('actionsOnSeeded', false)) return;
  var existing = CP.storage.load('actionsOnDrills', []);
  if (existing.length) {
    CP.storage.save('actionsOnSeeded', true);
    return;
  }
  var defaults = [
    {
      title: 'Actions On: Attack', category: 'Attack', steps: [
        'Shout warning / codeword to alert team',
        'Cover and evacuate principal away from threat axis',
        'Nearest driver brings vehicle to principal, engine running',
        'Load principal, break contact, move to pre-planned safe haven',
        'Call emergency services and notify control / ops room',
        'Do not return to the scene; conduct post-incident debrief'
      ].join('\n')
    },
    {
      title: 'Actions On: Fire', category: 'Fire', steps: [
        'Raise alarm and alert principal and team',
        'Move principal to nearest safe exit, away from smoke/heat',
        'Do not use lifts',
        'Move to designated assembly point',
        'Headcount team and principal',
        'Liaise with fire service on arrival'
      ].join('\n')
    },
    {
      title: 'Actions On: Bomb Threat / Suspect Package', category: 'Bomb Threat / Suspect Package', steps: [
        'Do not touch or move the item',
        'Evacuate the immediate area to a safe distance',
        'Isolate the area, deny access',
        'Notify police and venue security',
        'Move principal to alternate location via secondary route',
        'Await all-clear from authorities before returning'
      ].join('\n')
    },
    {
      title: 'Actions On: Medical Emergency', category: 'Medical Emergency', steps: [
        'Call for team medic, begin first aid / CPR as trained',
        'Call emergency services, give exact location',
        'Cover and reassure principal, maintain scene security',
        'Direct emergency services to casualty on arrival',
        'Notify control room and next of kin per protocol'
      ].join('\n')
    },
    {
      title: 'Actions On: Vehicle Ambush', category: 'Vehicle Ambush', steps: [
        'Do not stop in the kill zone — drive through if possible',
        'Use evasive driving to break contact',
        'Head to nearest safe haven / rendezvous point',
        'Notify control room and police en route',
        'Do not return to the ambush site'
      ].join('\n')
    },
    {
      title: 'Actions On: Lost Principal', category: 'Lost Principal', steps: [
        'Freeze team movement, confirm last known position',
        'Attempt contact via radio / phone',
        'Systematically search last known area outward',
        'Notify control room and venue security',
        'Escalate to police if not located within agreed timeframe'
      ].join('\n')
    },
    {
      title: 'Actions On: Vehicle Breakdown', category: 'Vehicle Breakdown', steps: [
        'Move vehicle to safest available position',
        'Maintain all-round security around principal',
        'Call for recovery / backup vehicle',
        'Consider moving principal to backup vehicle rather than waiting roadside',
        'Notify control room of delay and revised routing'
      ].join('\n')
    }
  ];
  CP.storage.save('actionsOnDrills', defaults);
  CP.storage.save('actionsOnSeeded', true);
}

CP.registerSegment({
  key: 'actionsOn',
  label: 'Actions On',
  icon: '⚡',
  render: function (container) {
    cpSeedActionsOnDefaults();
    container.innerHTML =
      '<h1>Actions On</h1>' +
      '<p class="hint">Standard contingency drills, provided as starting templates. Review and adapt every drill to your operation, principal, and area of operations before relying on it. Print for briefing cards.</p>' +
      '<div id="actionsOnCrud"></div>';

    CP.ui.crud(container.querySelector('#actionsOnCrud'), {
      storageKey: 'actionsOnDrills',
      cardView: true,
      cardTitleField: 'title',
      cardMetaField: 'category',
      cardBodyField: 'steps',
      addLabel: '+ Add Drill',
      fields: [
        { key: 'title', label: 'Scenario', required: true },
        { key: 'category', label: 'Category', type: 'select', options: ['Attack', 'Fire', 'Bomb Threat / Suspect Package', 'Medical Emergency', 'Vehicle Ambush', 'Lost Principal', 'Vehicle Breakdown', 'Civil Disturbance', 'Other'] },
        { key: 'steps', label: 'Actions (one step per line)', type: 'textarea', rows: 8 },
        { key: 'notes', label: 'Notes' }
      ],
      emptyMessage: 'No drills added yet.'
    });
  }
});
