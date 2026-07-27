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

function cpRenderOpLabel() {
  var label = document.getElementById('currentOpLabel');
  var ops = CP.storage.getOperations();
  var currentId = CP.storage.getCurrentOperationId();
  var current = ops.filter(function (o) { return o.id === currentId; })[0];
  label.textContent = current ? current.name : '';
}

function cpWireHeader() {
  document.getElementById('exportBtn').addEventListener('click', function () {
    CP.storage.exportAll();
  });

  var importInput = document.getElementById('importInput');
  document.getElementById('importBtn').addEventListener('click', function () {
    importInput.click();
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files[0];
    if (!file) return;
    if (!confirm('Import will overwrite existing data for any matching sections. Continue?')) {
      importInput.value = '';
      return;
    }
    CP.storage.importAll(file, function (err) {
      if (err) {
        alert('Import failed: file is not valid JSON.');
      } else {
        alert('Import complete.');
        location.reload();
      }
      importInput.value = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  cpRenderOpLabel();
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
