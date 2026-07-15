CP.registerSegment({
  key: 'medical',
  label: 'Medical',
  icon: '🩺',
  render: function (container) {
    container.innerHTML =
      '<h1>Medical</h1>' +
      '<section class="panel"><h2>Principal Medical Profile</h2><div id="medProfile"></div></section>' +
      '<section class="panel"><h2>Medical Kit Checklist</h2><div id="medKit"></div></section>' +
      '<section class="panel"><h2>CASEVAC — Nearest Hospitals</h2>' +
      '<p class="hint">Add hospitals near key locations (residence, venues, routes) with travel time.</p>' +
      '<div id="medHospitals"></div></section>';

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
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'travelTime', label: 'Travel Time from Base' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'address', 'travelTime', 'phone'],
      emptyMessage: 'No hospitals added yet.',
      rowLinks: function (rec) { return rec.address ? [{ label: 'Map', url: CP.ui.mapsLink(rec.address) }] : []; }
    });
  }
});
