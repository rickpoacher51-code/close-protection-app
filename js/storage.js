window.CP = window.CP || {};

CP.PREFIX = 'cpapp_';
CP.NAV = [];
CP.segments = {};

CP.registerSegment = function (seg) {
  CP.segments[seg.key] = seg;
  CP.NAV.push(seg);
};

CP.storage = {
  load: function (key, fallback) {
    try {
      var raw = localStorage.getItem(CP.PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('CP storage load failed for', key, e);
      return fallback;
    }
  },

  save: function (key, value) {
    localStorage.setItem(CP.PREFIX + key, JSON.stringify(value));
  },

  uid: function () {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  },

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
