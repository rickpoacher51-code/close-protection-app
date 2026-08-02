CP.registerSegment({
  key: 'medical',
  label: 'Medical',
  icon: '🩺',
  render: function (container) {
    container.innerHTML =
      '<h1>Medical</h1>' +
      '<section class="panel"><h2>Principal Medical Profile</h2><div id="medProfile"></div></section>' +
      '<section class="panel"><h2>Principal\'s Family / Next of Kin</h2><div id="medFamily"></div></section>' +
      '<section class="panel"><h2>MARCH & AVPU Reference</h2>' +
      '<div class="disclaimer">General reference only, not a substitute for first-aid/medical training. Act within your training ' +
      'and follow your team medic and local protocols.</div>' +
      '<div class="ref-list">' +
      '<details class="ref-item" open><summary>MARCH — Trauma Assessment Order</summary>' +
      '<ol>' +
      '<li><strong>M — Massive Haemorrhage:</strong> find and control life-threatening bleeding first — tourniquet high and tight on limb bleeds, wound packing plus pressure for junctional/torso bleeding, before anything else.</li>' +
      '<li><strong>A — Airway:</strong> open and check the airway. Head-tilt/chin-lift or jaw thrust, consider an NPA if trained. Assume spinal precautions if the mechanism of injury suggests it.</li>' +
      '<li><strong>R — Respiration (Breathing):</strong> expose and check the chest. Look for open/sucking chest wounds (seal them) and signs of tension pneumothorax. Check respiratory rate.</li>' +
      '<li><strong>C — Circulation:</strong> check pulse rate and quality, look for other sources of bleeding, treat for shock, monitor for deterioration.</li>' +
      '<li><strong>H — Head injury / Hypothermia:</strong> assess conscious level (AVPU) and look for signs of head injury. Insulate and cover the casualty — heat loss makes shock worse.</li>' +
      '</ol></details>' +
      '<details class="ref-item"><summary>AVPU — Conscious Level Scale</summary>' +
      '<ol>' +
      '<li><strong>A — Alert:</strong> spontaneously alert, aware of surroundings.</li>' +
      '<li><strong>V — Voice:</strong> responds only when spoken to.</li>' +
      '<li><strong>P — Pain:</strong> responds only to a painful stimulus.</li>' +
      '<li><strong>U — Unresponsive:</strong> no response to voice or pain.</li>' +
      '</ol></details>' +
      '</div></section>' +
      '<section class="panel"><h2>Observation Card</h2>' +
      '<p class="hint">Log casualty observations over time — one row per check.</p>' +
      '<div id="medObs"></div></section>' +
      '<section class="panel"><h2>Medical Kit Checklist</h2><div id="medKit"></div></section>' +
      '<section class="panel"><h2>CASEVAC — Nearest Hospitals</h2>' +
      '<p class="hint">Add hospitals near key locations (residence, venues, routes) with travel time.</p>' +
      '<div id="medHospitals"></div></section>' +
      '<section class="panel"><h2>Medication Legality by Destination</h2>' +
      '<div class="disclaimer">Rules on carrying medication (including common prescription and over-the-counter drugs) vary hugely by ' +
      'country and change often — some countries prosecute for medications that are legal at home. This is a record of your own research, ' +
      'not a live feed. Always verify directly with the destination country’s embassy/consulate before travel.</div>' +
      '<div id="medMedLegality"></div></section>';

    CP.ui.profileForm(container.querySelector('#medProfile'), {
      storageKey: 'medicalProfile',
      fields: [
        { key: 'principalName', label: 'Principal Name' },
        { key: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
        { key: 'allergies', label: 'Allergies', type: 'textarea' },
        { key: 'conditions', label: 'Medical Conditions', type: 'textarea' },
        { key: 'medications', label: 'Current Medications', type: 'textarea' },
        { key: 'medicOnTeam', label: 'Team Medic Assigned' },
        { key: 'emergencyContact', label: 'Emergency Contact (Name & Number)' }
      ]
    });

    CP.ui.crud(container.querySelector('#medFamily'), {
      storageKey: 'principalFamily',
      addLabel: '+ Add Family Member',
      fields: [
        { key: 'name', label: 'Name', required: true },
        { key: 'relationship', label: 'Relationship', type: 'select', options: ['Spouse / Partner', 'Child', 'Parent', 'Sibling', 'Other'], badge: true },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'relationship', 'phone'],
      emptyMessage: 'No family members added yet.'
    });

    CP.ui.crud(container.querySelector('#medObs'), {
      storageKey: 'observationCard',
      addLabel: '+ Add Observation',
      fields: [
        { key: 'time', label: 'Time', type: 'time', required: true },
        { key: 'avpu', label: 'AVPU', type: 'select', options: ['Alert', 'Voice', 'Pain', 'Unresponsive'], badge: true },
        { key: 'pulse', label: 'Pulse (bpm)' },
        { key: 'respirations', label: 'Respiration Rate (per min)' },
        { key: 'bloodPressure', label: 'Blood Pressure' },
        { key: 'spo2', label: 'SpO2 (%)' },
        { key: 'pupils', label: 'Pupils' },
        { key: 'skinColour', label: 'Skin Colour / Condition' },
        { key: 'painScore', label: 'Pain Score (0–10)' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['time', 'avpu', 'pulse', 'respirations', 'bloodPressure', 'spo2'],
      emptyMessage: 'No observations logged yet.'
    });

    CP.ui.checklist(container.querySelector('#medKit'), {
      storageKey: 'medicalKitChecklist',
      defaultItems: [
        'Tourniquet (CAT)',
        'Israeli / Emergency Bandage',
        'Chest Seal',
        'Haemostatic Gauze',
        'Nasopharyngeal Airway',
        'Trauma Shears',
        'Gloves (Nitrile)',
        'Casualty Card',
        'Burn Dressing',
        'SAM Splint',
        'Defibrillator (AED) Access Confirmed'
      ]
    });

    CP.ui.crud(container.querySelector('#medHospitals'), {
      storageKey: 'casevacHospitals',
      addLabel: '+ Add Hospital',
      fields: [
        { key: 'name', label: 'Hospital Name', required: true },
        { key: 'address', label: 'Address', required: true },
        { key: 'w3w', label: 'what3words (optional)', placeholder: '///filled.count.soap' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'travelTime', label: 'Travel Time from Base' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'address', 'travelTime', 'phone'],
      emptyMessage: 'No hospitals added yet.',
      rowLinks: function (rec) {
        var links = [];
        if (rec.address) links.push({ label: 'Map', url: CP.ui.mapsLink(rec.address) });
        if (rec.w3w) links.push({ label: 'what3words', url: CP.ui.w3wLink(rec.w3w) });
        return links;
      }
    });

    CP.ui.crud(container.querySelector('#medMedLegality'), {
      storageKey: 'medicationLegality',
      addLabel: '+ Add Medication Check',
      fields: [
        { key: 'medication', label: 'Medication', required: true },
        { key: 'country', label: 'Destination Country', required: true },
        { key: 'status', label: 'Legal Status', type: 'select', options: ['Legal', 'Requires Documentation / Prescription', 'Restricted', 'Illegal', 'Unknown / Check'], badge: true },
        { key: 'lastChecked', label: 'Last Verified', type: 'date' },
        { key: 'notes', label: 'Notes / Source', type: 'textarea' }
      ],
      columns: ['medication', 'country', 'status', 'lastChecked'],
      emptyMessage: 'No medication checks logged yet.',
      rowLinks: function (rec) { return CP.ui.govukLinks(rec.country); }
    });
  }
});
