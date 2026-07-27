window.CP = window.CP || {};

CP.PREFIX = 'cpapp_';
CP.NAV = [];
CP.segments = {};

CP.registerSegment = function (seg) {
  CP.segments[seg.key] = seg;
  CP.NAV.push(seg);
};

// Keys that are NOT scoped to a single operation — they describe the
// operation registry itself, or app-wide device/browser settings.
CP.storage = {
  GLOBAL_KEYS: ['operations', 'currentOpId', 'legacyMigrated', 'deviceLabel'],

  _rawKey: function (key) {
    return CP.PREFIX + key;
  },

  _rawLoad: function (key, fallback) {
    try {
      var raw = localStorage.getItem(CP.storage._rawKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('CP storage load failed for', key, e);
      return fallback;
    }
  },

  _rawSave: function (key, value) {
    localStorage.setItem(CP.storage._rawKey(key), JSON.stringify(value));
  },

  // Segment-facing key: automatically namespaced under the current
  // operation unless it's a known global key. Segment files never need
  // to know this is happening.
  _scopedKey: function (key) {
    if (CP.storage.GLOBAL_KEYS.indexOf(key) !== -1) return key;
    return 'op_' + CP.ops.current() + '_' + key;
  },

  load: function (key, fallback) {
    return CP.storage._rawLoad(CP.storage._scopedKey(key), fallback);
  },

  save: function (key, value) {
    CP.storage._rawSave(CP.storage._scopedKey(key), value);
  },

  uid: function () {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  },

  // Exports the CURRENT operation only: a clean single-op backup/handover file.
  exportCurrentOp: function () {
    var opId = CP.ops.current();
    var opRecord = CP.ops.get(opId);
    var out = { _exportType: 'single-operation', _operation: opRecord, data: {} };
    var prefix = CP.PREFIX + 'op_' + opId + '_';
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(prefix) === 0) {
        try {
          out.data[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k));
        } catch (e) {
          // skip unreadable entry
        }
      }
    }
    var stamp = new Date().toISOString().slice(0, 10);
    var name = 'cp-ops-' + CP.ui.slug(opRecord ? opRecord.name : 'operation') + '-' + stamp + '.json';
    CP.storage._downloadJson(out, name);
  },

  // Exports every operation plus the registry itself — a full-app backup.
  exportAllOperations: function () {
    var out = { _exportType: 'full-backup', data: {} };
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(CP.PREFIX) === 0) {
        try {
          out.data[k.slice(CP.PREFIX.length)] = JSON.parse(localStorage.getItem(k));
        } catch (e) {
          // skip unreadable entry
        }
      }
    }
    var stamp = new Date().toISOString().slice(0, 10);
    CP.storage._downloadJson(out, 'cp-ops-full-backup-' + stamp + '.json');
  },

  _downloadJson: function (obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Accepts either export shape (full-backup or single-operation), and also
  // the old flat pre-operations export format for backward compatibility.
  importAll: function (file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);

        if (parsed && parsed._exportType === 'full-backup') {
          Object.keys(parsed.data).forEach(function (k) {
            CP.storage._rawSave(k, parsed.data[k]);
          });
          if (cb) cb(null, { mode: 'full-backup' });
          return;
        }

        if (parsed && parsed._exportType === 'single-operation') {
          var newOp = CP.ops.create(
            (parsed._operation && parsed._operation.name ? parsed._operation.name + ' (imported)' : 'Imported Operation'),
            parsed._operation && parsed._operation.client
          );
          Object.keys(parsed.data).forEach(function (k) {
            CP.storage._rawSave('op_' + newOp.id + '_' + k, parsed.data[k]);
          });
          CP.ops.setCurrent(newOp.id);
          if (cb) cb(null, { mode: 'single-operation', opName: newOp.name });
          return;
        }

        // Legacy flat export (pre-operations version of the app) — import
        // straight into the currently selected operation.
        var opId = CP.ops.current();
        Object.keys(parsed).forEach(function (k) {
          CP.storage._rawSave('op_' + opId + '_' + k, parsed[k]);
        });
        if (cb) cb(null, { mode: 'legacy' });
      } catch (e) {
        if (cb) cb(e);
      }
    };
    reader.onerror = function () { if (cb) cb(reader.error); };
    reader.readAsText(file);
  }
};

// --- Operations registry -----------------------------------------------
// Everything in the app now lives "inside" an operation. On first load
// after this update, any pre-existing data (from before operations
// existed) is migrated into a default "Operation 1" so nothing is lost.

CP.ops = {
  list: function () {
    return CP.storage._rawLoad('operations', []);
  },

  get: function (id) {
    return CP.ops.list().filter(function (o) { return o.id === id; })[0] || null;
  },

  save: function (list) {
    CP.storage._rawSave('operations', list);
  },

  create: function (name, client) {
    var op = {
      id: CP.storage.uid(),
      name: name || 'New Operation',
      client: client || '',
      status: 'planning', // planning | live | complete
      createdAt: new Date().toISOString()
    };
    var list = CP.ops.list();
    list.push(op);
    CP.ops.save(list);
    return op;
  },

  update: function (id, patch) {
    var list = CP.ops.list().map(function (o) {
      return o.id === id ? Object.assign({}, o, patch) : o;
    });
    CP.ops.save(list);
  },

  current: function () {
    CP.ops._ensureInit();
    return CP.storage._rawLoad('currentOpId', null);
  },

  setCurrent: function (id) {
    CP.storage._rawSave('currentOpId', id);
  },

  _ensureInit: function () {
    if (CP.storage._rawLoad('legacyMigrated', false)) return;

    var list = CP.ops.list();
    if (list.length) {
      CP.storage._rawSave('legacyMigrated', true);
      if (!CP.storage._rawLoad('currentOpId', null)) CP.ops.setCurrent(list[0].id);
      return;
    }

    // No operations registered yet. Check for legacy flat-format data
    // (anything under cpapp_ that isn't itself a global key) and, if
    // found, migrate it into a new default operation rather than losing it.
    var legacyKeys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(CP.PREFIX) !== 0) continue;
      var short = k.slice(CP.PREFIX.length);
      if (CP.storage.GLOBAL_KEYS.indexOf(short) !== -1) continue;
      if (short.indexOf('op_') === 0) continue; // already scoped, not legacy
      legacyKeys.push(short);
    }

    var op = CP.ops.create('Operation 1');

    legacyKeys.forEach(function (short) {
      var raw = localStorage.getItem(CP.PREFIX + short);
      localStorage.setItem(CP.PREFIX + 'op_' + op.id + '_' + short, raw);
      localStorage.removeItem(CP.PREFIX + short);
    });

    CP.ops.setCurrent(op.id);
    CP.storage._rawSave('legacyMigrated', true);
  }
};
