function cpCurrentKey() {
  var h = (location.hash || '').replace('#', '');
  return CP.segments[h] ? h : CP.NAV[0].key;
}

function cpRenderNav() {
  var nav = document.getElementById('sidebar');
  var key = cpCurrentKey();
  nav.innerHTML = CP.NAV.map(function (seg) {
    return '<a href="#' + seg.key + '" class="nav-link' + (seg.key === key ? ' active' : '') + '">' +
      '<span class="nav-icon">' + seg.icon + '</span><span class="nav-label">' + seg.label + '</span></a>';
  }).join('');
}

function cpRenderContent() {
  var key = cpCurrentKey();
  var seg = CP.segments[key];
  var content = document.getElementById('content');
  content.innerHTML = '';
  seg.render(content);
  document.title = 'CP Ops — ' + seg.label;
}

var OP_STATUS_LABELS = { planning: 'PLANNING', live: 'LIVE OPERATION', complete: 'COMPLETE' };

function cpRenderOpBanner() {
  var op = CP.ops.get(CP.ops.current());
  var banner = document.getElementById('opStatusBanner');
  var status = (op && op.status) || 'planning';
  banner.className = 'op-status-banner status-' + status;
  banner.textContent = (op ? op.name : 'No operation selected') + ' — ' + OP_STATUS_LABELS[status];
  document.body.setAttribute('data-op-status', status);
}

function cpRenderOpSwitcher() {
  var select = document.getElementById('opSelect');
  var statusSelect = document.getElementById('opStatusSelect');
  var ops = CP.ops.list();
  var currentId = CP.ops.current();

  select.innerHTML = ops.map(function (o) {
    return '<option value="' + o.id + '"' + (o.id === currentId ? ' selected' : '') + '>' + CP.ui.escapeHtml(o.name) + '</option>';
  }).join('');

  var currentOp = CP.ops.get(currentId);
  statusSelect.value = (currentOp && currentOp.status) || 'planning';

  cpRenderOpBanner();
}

function cpWireHeader() {
  document.getElementById('exportBtn').addEventListener('click', function () {
    CP.storage.exportCurrentOp();
  });

  document.getElementById('exportAllBtn').addEventListener('click', function () {
    CP.storage.exportAllOperations();
  });

  var importInput = document.getElementById('importInput');
  document.getElementById('importBtn').addEventListener('click', function () {
    importInput.click();
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files[0];
    if (!file) return;
    if (!confirm('Import data from this file? A single-operation file adds a new operation. A full-backup file restores everything and may overwrite existing operations with matching IDs.')) {
      importInput.value = '';
      return;
    }
    CP.storage.importAll(file, function (err, result) {
      if (err) {
        alert('Import failed: file is not valid JSON.');
      } else {
        alert('Import complete' + (result && result.opName ? ' — added operation "' + result.opName + '"' : '') + '.');
        location.reload();
      }
      importInput.value = '';
    });
  });

  document.getElementById('opSelect').addEventListener('change', function (e) {
    CP.ops.setCurrent(e.target.value);
    cpRenderOpSwitcher();
    cpRenderContent();
    cpRenderNav();
  });

  document.getElementById('opStatusSelect').addEventListener('change', function (e) {
    CP.ops.update(CP.ops.current(), { status: e.target.value });
    cpRenderOpBanner();
  });

  document.getElementById('newOpBtn').addEventListener('click', function () {
    var name = window.prompt('New operation name:');
    if (!name || !name.trim()) return;
    var client = window.prompt('Client / principal (optional):') || '';
    var op = CP.ops.create(name.trim(), client.trim());
    CP.ops.setCurrent(op.id);
    cpRenderOpSwitcher();
    cpRenderContent();
    cpRenderNav();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  CP.ops.current(); // triggers one-time legacy-data migration if needed
  cpRenderOpSwitcher();
  cpRenderNav();
  cpRenderContent();
  cpWireHeader();
  window.addEventListener('hashchange', function () {
    cpRenderContent();
    cpRenderNav();
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.error('Service worker registration failed:', err);
    });
  });
}
