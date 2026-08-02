window.CP = window.CP || {};

CP.PREFIX = 'cpapp_';
CP.NAV = [];
CP.segments = {};

CP.registerSegment = function (seg) {
  CP.segments[seg.key] = seg;
  CP.NAV.push(seg);
};

// Every data key used anywhere in the app. Used only for the one-time migration
// below, to move a pre-existing (single-operation) install into "Operation 1".
var CP_KNOWN_DATA_KEYS = [
  'opInfo', 'team', 'medicalProfile', 'principalFamily', 'medicalKitChecklist',
  'casevacHospitals', 'medicationLegality', 'routes', 'advanceVenues', 'commsContacts',
  'advanceTasks', 'eventSecurityPlan', 'eventDocuments', 'eventIncidentLog',
  'rstRoster', 'rstPerimeterChecklist', 'rstVisitorLog', 'rstPatrolLog',
  'actionsOnDrills', 'actionsOnSeeded', 'threatRegions', 'safeHavens',
  'extractionPoints', 'travelDocs', 'uklawsNotes'
];

function cpMigrateToOperationsIfNeeded() {
  if (localStorage.getItem(CP.PREFIX + 'operations')) return;

  var id = 'op_' + CP.storage.uid();
  var opInfoRaw = localStorage.getItem(CP.PREFIX + 'opInfo');
  var opInfo = {};
  try { opInfo = opInfoRaw ? JSON.parse(opInfoRaw) : {}; } catch (e) { opInfo = {}; }
  var name = opInfo.operationName || 'Operation 1';

  CP_KNOWN_DATA_KEYS.forEach(function (key) {
    var raw = localStorage.getItem(CP.PREFIX + key);
    if (raw !== null) {
      localStorage.setItem(CP.PREFIX + id + '_' + key, raw);
      localStorage.removeItem(CP.PREFIX + key);
    }
  });

  localStorage.setItem(CP.PREFIX + 'operations', JSON.stringify([
    { id: id, name: name, createdDate: new Date().toISOString().slice(0, 10) }
  ]));
  localStorage.setItem(CP.PREFIX + 'currentOperationId', id);
}

CP.storage = {
  load: function (key, fallback) {
    try {
      var raw = localStorage.getItem(CP.PREFIX + CP.storage.getCurrentOperationId() + '_' + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('CP storage load failed for', key, e);
      return fallback;
    }
  },

  save: function (key, value) {
    localStorage.setItem(CP.PREFIX + CP.storage.getCurrentOperationId() + '_' + key, JSON.stringify(value));
  },

  uid: function () {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  },

  // --- Global (non-operation-scoped) storage, for things like app lock config
  // that must apply regardless of which operation is currently open ---

  loadGlobal: function (key, fallback) {
    try {
      var raw = localStorage.getItem(CP.PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },

  saveGlobal: function (key, value) {
    localStorage.setItem(CP.PREFIX + key, JSON.stringify(value));
  },

  removeGlobal: function (key) {
    localStorage.removeItem(CP.PREFIX + key);
  },

  // --- Operations (separate "pages" of data you can switch between) ---

  getOperations: function () {
    try {
      return JSON.parse(localStorage.getItem(CP.PREFIX + 'operations')) || [];
    } catch (e) {
      return [];
    }
  },

  getCurrentOperationId: function () {
    return localStorage.getItem(CP.PREFIX + 'currentOperationId');
  },

  setCurrentOperationId: function (id) {
    localStorage.setItem(CP.PREFIX + 'currentOperationId', id);
  },

  createOperation: function (name) {
    var ops = CP.storage.getOperations();
    var id = 'op_' + CP.storage.uid();
    ops.push({ id: id, name: name || ('Operation ' + (ops.length + 1)), createdDate: new Date().toISOString().slice(0, 10) });
    localStorage.setItem(CP.PREFIX + 'operations', JSON.stringify(ops));
    return id;
  },

  renameOperation: function (id, name) {
    var ops = CP.storage.getOperations().map(function (o) {
      return o.id === id ? Object.assign({}, o, { name: name }) : o;
    });
    localStorage.setItem(CP.PREFIX + 'operations', JSON.stringify(ops));
  },

  // Returns false if this was the only remaining operation (delete refused).
  deleteOperation: function (id) {
    var ops = CP.storage.getOperations();
    if (ops.length <= 1) return false;
    ops = ops.filter(function (o) { return o.id !== id; });
    localStorage.setItem(CP.PREFIX + 'operations', JSON.stringify(ops));

    var opPrefix = CP.PREFIX + id + '_';
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(opPrefix) === 0) toRemove.push(k);
    }
    toRemove.forEach(function (k) { localStorage.removeItem(k); });

    if (CP.storage.getCurrentOperationId() === id) {
      CP.storage.setCurrentOperationId(ops[0].id);
    }
    return true;
  },

  // --- Full backup across ALL operations (JSON export/import in the header) ---

  exportAll: function () {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(CP.PREFIX) === 0) {
        try {
          out[k.slice(CP.PREFIX.length)] = JSON.parse(localStorage.getItem(k));
        } catch (e) {
          // skip unreadable entry
        }
      }
    }
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'cp-ops-backup-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importAll: function (file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        Object.keys(data).forEach(function (k) {
          localStorage.setItem(CP.PREFIX + k, JSON.stringify(data[k]));
        });
        if (cb) cb(null);
      } catch (e) {
        if (cb) cb(e);
      }
    };
    reader.onerror = function () { if (cb) cb(reader.error); };
    reader.readAsText(file);
  }
};

CP.storage.OPERATION_DATA_KEYS = CP_KNOWN_DATA_KEYS;

cpMigrateToOperationsIfNeeded();
