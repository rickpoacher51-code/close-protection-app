CP.registerSegment({
  key: 'team',
  label: 'Team List & Names',
  icon: '👥',
  render: function (container) {
    container.innerHTML = '<h1>Team List & Names</h1><div id="teamCrud"></div>';
    CP.ui.crud(container.querySelector('#teamCrud'), {
      storageKey: 'team',
      addLabel: '+ Add Team Member',
      fields: [
        { key: 'name', label: 'Name', required: true },
        { key: 'role', label: 'Role', type: 'select', options: ['Team Leader', 'PPO / Bodyguard', 'Driver', 'RST', 'Medic', 'Advance', 'Coordinator', 'Other'], badge: true },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
        { key: 'siaBadge', label: 'SIA Badge No.' },
        { key: 'vehicle', label: 'Vehicle Assigned' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: ['name', 'role', 'phone', 'vehicle'],
      emptyMessage: 'No team members added yet.'
    });
  }
});
