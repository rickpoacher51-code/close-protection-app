function cpExpiryDeriveFields(dateKey) {
  return function (rec) {
    return { status: CP.ui.expiryStatus(rec[dateKey]) };
  };
}

var CP_EXPIRY_STATUS_COLUMN = { key: 'status', label: 'Status', badge: true };

CP.registerSegment({
  key: 'admin',
  label: 'Admin',
  icon: '🗂️',
  render: function (container) {
    container.innerHTML =
      '<h1>Admin</h1>' +
      '<p class="hint">Expiry tracking and reminders. Status is worked out automatically from each date — Expired, Expiring Soon (within 30 days), or In Date.</p>' +
      '<section class="panel"><h2>Medical Reminders</h2>' +
      '<p class="hint">Medication refills, AED pad/battery checks, prescription renewals, and similar recurring medical reminders.</p>' +
      '<div id="adminMedReminders"></div></section>' +
      '<section class="panel"><h2>Vehicle / Car Servicing</h2><div id="adminVehicles"></div></section>' +
      '<section class="panel"><h2>Medical Kit Expiry</h2><div id="adminMedKitExpiry"></div></section>' +
      '<section class="panel"><h2>Team Certificates & Licences</h2><div id="adminCerts"></div></section>';

    CP.ui.crud(container.querySelector('#adminMedReminders'), {
      storageKey: 'adminMedReminders',
      addLabel: '+ Add Reminder',
      fields: [
        { key: 'item', label: 'Item / Reminder', required: true },
        { key: 'dueDate', label: 'Due / Expiry Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      derivedColumns: [CP_EXPIRY_STATUS_COLUMN],
      deriveFields: cpExpiryDeriveFields('dueDate'),
      columns: ['item', 'dueDate', 'status'],
      emptyMessage: 'No medical reminders added yet.'
    });

    CP.ui.crud(container.querySelector('#adminVehicles'), {
      storageKey: 'adminVehicleServices',
      addLabel: '+ Add Vehicle Item',
      fields: [
        { key: 'vehicleReg', label: 'Vehicle Registration', required: true },
        { key: 'serviceType', label: 'Type', type: 'select', options: ['Service', 'MOT', 'Insurance Renewal', 'Road Tax', 'Other'] },
        { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      derivedColumns: [CP_EXPIRY_STATUS_COLUMN],
      deriveFields: cpExpiryDeriveFields('dueDate'),
      columns: ['vehicleReg', 'serviceType', 'dueDate', 'status'],
      emptyMessage: 'No vehicle servicing items added yet.'
    });

    CP.ui.crud(container.querySelector('#adminMedKitExpiry'), {
      storageKey: 'adminMedKitExpiry',
      addLabel: '+ Add Kit Item',
      fields: [
        { key: 'item', label: 'Item', required: true },
        { key: 'lotNumber', label: 'Lot / Batch No.' },
        { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      derivedColumns: [CP_EXPIRY_STATUS_COLUMN],
      deriveFields: cpExpiryDeriveFields('expiryDate'),
      columns: ['item', 'lotNumber', 'expiryDate', 'status'],
      emptyMessage: 'No medical kit expiry items added yet.'
    });

    CP.ui.crud(container.querySelector('#adminCerts'), {
      storageKey: 'adminTeamCerts',
      addLabel: '+ Add Certificate',
      fields: [
        { key: 'teamMember', label: 'Team Member', required: true },
        { key: 'certType', label: 'Certificate / Licence', type: 'select', options: ['SIA Close Protection', 'First Aid', 'Driving Licence', 'Firearms', 'Other'] },
        { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes' }
      ],
      derivedColumns: [CP_EXPIRY_STATUS_COLUMN],
      deriveFields: cpExpiryDeriveFields('expiryDate'),
      columns: ['teamMember', 'certType', 'expiryDate', 'status'],
      emptyMessage: 'No team certificates added yet.'
    });
  }
});
