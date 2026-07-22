window.CP = window.CP || {};
CP.ui = {};

CP.ui.escapeHtml = function (str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

CP.ui.slug = function (s) {
  var out = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return out || 'none';
};

CP.ui.mapsLink = function (address) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address || '');
};

CP.ui.mapsDirLink = function (origin, destination) {
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(origin || '') + '&destination=' + encodeURIComponent(destination || '');
};

// Best-effort slug for a country name in GOV.UK's URL style (lowercase, hyphenated).
// Correct for most common country names, but GOV.UK's actual slug differs for a
// number of countries (e.g. "Ivory Coast" -> "cote-divoire"). Always paired with
// a guaranteed-correct search link as a fallback — see govukSearchUrl.
CP.ui.slugifyCountry = function (name) {
  return String(name || '').trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
};

CP.ui.govukTravelAdviceUrl = function (country) {
  var slug = CP.ui.slugifyCountry(country);
  return slug ? 'https://www.gov.uk/foreign-travel-advice/' + slug : null;
};

CP.ui.govukSearchUrl = function (country) {
  return 'https://www.gov.uk/search/all?keywords=' + encodeURIComponent((country || '') + ' travel advice');
};

// Direct guess at the GOV.UK country page, plus a search link that always resolves
// correctly even when the guessed slug is wrong.
CP.ui.govukLinks = function (country) {
  if (!country) return [];
  return [
    { label: 'GOV.UK Advice', url: CP.ui.govukTravelAdviceUrl(country) },
    { label: 'GOV.UK Search', url: CP.ui.govukSearchUrl(country) }
  ];
};

// This app has no login and no server — there is no way to know WHO made
// a change, only WHEN and on WHICH device. deviceLabel is a one-time,
// user-set nickname for "this browser on this device" (e.g. "Rick -
// MacBook"), stored globally so every operation on this device shares it.
// It is honest labelling, not a substitute for real multi-user accountability.
CP.ui.deviceLabel = function () {
  var existing = CP.storage._rawLoad('deviceLabel', null);
  if (existing) return existing;
  var guess = (navigator.platform || 'This device');
  var entered = window.prompt(
    'Name this device/browser for record-keeping (e.g. "Rick - MacBook"). ' +
    'This app has no login, so this label is the only way entries show who logged them. ' +
    'You can change it later by clearing this device\'s data.',
    guess
  );
  var label = (entered && entered.trim()) ? entered.trim() : guess;
  CP.storage._rawSave('deviceLabel', label);
  return label;
};

CP.ui.relativeTime = function (isoString) {
  if (!isoString) return '';
  var then = new Date(isoString).getTime();
  if (isNaN(then)) return '';
  var diffMs = Date.now() - then;
  var mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  var hours = Math.round(mins / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.round(hours / 24);
  if (days < 30) return days + 'd ago';
  return new Date(isoString).toLocaleDateString();
};

CP.ui.fieldInputHtml = function (field, value, idPrefix) {
  var val = value === undefined || value === null ? (field.default || '') : value;
  var id = (idPrefix || 'f_') + field.key;
  if (field.type === 'textarea') {
    return '<textarea id="' + id + '" name="' + field.key + '" rows="' + (field.rows || 3) + '" placeholder="' +
      CP.ui.escapeHtml(field.placeholder || '') + '">' + CP.ui.escapeHtml(val) + '</textarea>';
  }
  if (field.type === 'select') {
    var opts = field.options.map(function (o) {
      return '<option value="' + CP.ui.escapeHtml(o) + '"' + (o === val ? ' selected' : '') + '>' + CP.ui.escapeHtml(o) + '</option>';
    }).join('');
    return '<select id="' + id + '" name="' + field.key + '"><option value="">-- select --</option>' + opts + '</select>';
  }
  var type = field.type || 'text';
  return '<input type="' + type + '" id="' + id + '" name="' + field.key + '" value="' +
    CP.ui.escapeHtml(val) + '" placeholder="' + CP.ui.escapeHtml(field.placeholder || '') + '">';
};

// Generic CRUD list/table/card component backed by CP.storage.
// opts: { storageKey, fields[], columns[], emptyMessage, addLabel, rowLink(rec),
//         cardView, cardTitleField, cardMetaField, cardBodyField,
//         searchable, searchPlaceholder }
CP.ui.crud = function (container, opts) {
  var fields = opts.fields;
  var storageKey = opts.storageKey;
  var editId = null;
  var formOpen = false;
  var searchQuery = '';
  // Multiple crud() widgets can appear on one page (e.g. Advance Party has
  // two, RST has three). IDs must be unique per widget instance or a
  // querySelector('#id') scoped to the wrong container can silently find
  // nothing. Namespace every internal ID off the storageKey.
  var ns = 'crud_' + CP.ui.slug(storageKey) + '_';

  function load() { return CP.storage.load(storageKey, []); }
  function persist(list) { CP.storage.save(storageKey, list); }

  function fieldLabel(key) {
    var f = fields.filter(function (x) { return x.key === key; })[0];
    return f ? f.label : key;
  }

  function applyFilter(list) {
    if (!opts.searchable || !searchQuery) return list;
    var q = searchQuery.toLowerCase();
    return list.filter(function (rec) {
      return fields.some(function (f) {
        return String(rec[f.key] || '').toLowerCase().indexOf(q) !== -1;
      });
    });
  }

  function formHtml(record) {
    record = record || {};
    var rows = fields.map(function (f) {
      return '<label class="field"><span>' + CP.ui.escapeHtml(f.label) + (f.required ? ' *' : '') + '</span>' +
        CP.ui.fieldInputHtml(f, record[f.key], ns + 'f_') + '</label>';
    }).join('');
    return '<form class="crud-form" id="' + ns + 'form">' + rows +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary">' + (editId ? 'Save Changes' : 'Add') + '</button>' +
      '<button type="button" class="btn" id="' + ns + 'cancel">Cancel</button>' +
      '</div></form>';
  }

  function rowActionsHtml(rec) {
    var html = '<button class="btn btn-small" data-act="edit" data-id="' + rec.id + '">Edit</button> ' +
      '<button class="btn btn-small btn-danger" data-act="delete" data-id="' + rec.id + '">Delete</button>';
    if (opts.rowLinks) {
      (opts.rowLinks(rec) || []).filter(Boolean).forEach(function (link) {
        html += ' <a class="btn btn-small" target="_blank" rel="noopener" href="' + link.url + '">' +
          CP.ui.escapeHtml(link.label) + '</a>';
      });
    }
    return html;
  }

  function metaTitle(rec) {
    var bits = [];
    if (rec.createdAt) bits.push('Logged ' + CP.ui.relativeTime(rec.createdAt));
    if (rec.updatedAt && rec.updatedAt !== rec.createdAt) bits.push('updated ' + CP.ui.relativeTime(rec.updatedAt));
    if (rec.updatedDevice) bits.push('on ' + rec.updatedDevice);
    return bits.join(', ');
  }

  function tableHtml(list) {
    if (!list.length) return '<p class="empty-msg">' + (opts.emptyMessage || 'No records yet.') + '</p>';
    var head = opts.columns.map(function (c) { return '<th>' + CP.ui.escapeHtml(fieldLabel(c)) + '</th>'; }).join('');
    var rows = list.map(function (rec) {
      var tds = opts.columns.map(function (c) {
        var f = fields.filter(function (x) { return x.key === c; })[0];
        var val = rec[c];
        if (f && f.badge && val) {
          return '<td><span class="badge badge-' + CP.ui.slug(val) + '">' + CP.ui.escapeHtml(val) + '</span></td>';
        }
        return '<td>' + CP.ui.escapeHtml(val) + '</td>';
      }).join('');
      var metaTd = '<td class="meta-cell" title="' + CP.ui.escapeHtml(metaTitle(rec)) + '">' +
        CP.ui.escapeHtml(rec.updatedAt ? CP.ui.relativeTime(rec.updatedAt) : '') + '</td>';
      return '<tr>' + tds + metaTd + '<td class="actions">' + rowActionsHtml(rec) + '</td></tr>';
    }).join('');
    return '<div class="table-wrap"><table><thead><tr>' + head + '<th>Logged</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function cardGridHtml(list) {
    if (!list.length) return '<p class="empty-msg">' + (opts.emptyMessage || 'No records yet.') + '</p>';
    return '<div class="card-grid">' + list.map(function (rec) {
      var steps = String(rec[opts.cardBodyField] || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var stepsHtml = steps.length
        ? '<ol>' + steps.map(function (s) { return '<li>' + CP.ui.escapeHtml(s) + '</li>'; }).join('') + '</ol>'
        : '<p class="empty-msg">No steps added.</p>';
      var meta = rec[opts.cardMetaField];
      return '<div class="card">' +
        '<div class="card-head"><h3>' + CP.ui.escapeHtml(rec[opts.cardTitleField]) + '</h3>' +
        (meta ? '<span class="badge badge-' + CP.ui.slug(meta) + '">' + CP.ui.escapeHtml(meta) + '</span>' : '') +
        '</div>' + stepsHtml +
        (rec.notes ? '<p class="notes">' + CP.ui.escapeHtml(rec.notes) + '</p>' : '') +
        '<div class="card-actions">' + rowActionsHtml(rec) +
        (rec.updatedAt ? '<span class="meta-line">' + CP.ui.escapeHtml(metaTitle(rec)) + '</span>' : '') +
        '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function renderListInto(listWrap) {
    var list = applyFilter(load());
    listWrap.innerHTML = opts.cardView ? cardGridHtml(list) : tableHtml(list);
    wireListEvents(listWrap);
  }

  function wireListEvents(scope) {
    scope.querySelectorAll('[data-act="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editId = btn.getAttribute('data-id');
        formOpen = true;
        draw();
      });
    });
    scope.querySelectorAll('[data-act="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this record? This cannot be undone.')) return;
        var id = btn.getAttribute('data-id');
        persist(load().filter(function (r) { return r.id !== id; }));
        draw();
      });
    });
  }

  function draw() {
    var list = load();
    var html = '<div class="segment-toolbar">' +
      '<button class="btn btn-primary" id="' + ns + 'addBtn">' + (opts.addLabel || '+ Add') + '</button>' +
      '</div>';
    if (opts.searchable) {
      html += '<div class="search-bar"><input type="text" id="' + ns + 'search" placeholder="' +
        CP.ui.escapeHtml(opts.searchPlaceholder || 'Search...') + '" value="' + CP.ui.escapeHtml(searchQuery) + '"></div>';
    }
    var recordForForm = editId ? list.filter(function (r) { return r.id === editId; })[0] : {};
    html += '<div id="' + ns + 'formWrap">' + (formOpen ? formHtml(recordForForm) : '') + '</div>';
    html += '<div id="' + ns + 'listWrap"></div>';
    container.innerHTML = html;

    renderListInto(container.querySelector('#' + ns + 'listWrap'));

    var addBtn = container.querySelector('#' + ns + 'addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        editId = null;
        formOpen = true;
        draw();
        var first = container.querySelector('#' + ns + 'form [name]');
        if (first) first.focus();
      });
    }

    var cancelBtn = container.querySelector('#' + ns + 'cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        formOpen = false;
        editId = null;
        draw();
      });
    }

    var form = container.querySelector('#' + ns + 'form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {};
        fields.forEach(function (f) {
          var el = form.querySelector('[name="' + f.key + '"]');
          data[f.key] = el ? el.value : '';
        });
        var missing = fields.filter(function (f) { return f.required && !data[f.key]; });
        if (missing.length) {
          alert('Please fill in: ' + missing.map(function (f) { return f.label; }).join(', '));
          return;
        }
        var now = new Date().toISOString();
        var device = CP.ui.deviceLabel();
        data.updatedAt = now;
        data.updatedDevice = device;

        var current = load();
        if (editId) {
          current = current.map(function (r) { return r.id === editId ? Object.assign({}, r, data) : r; });
        } else {
          data.id = CP.storage.uid();
          data.createdAt = now;
          current.push(data);
        }
        persist(current);
        formOpen = false;
        editId = null;
        draw();
      });
    }

    var searchInput = container.querySelector('#' + ns + 'search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value;
        renderListInto(container.querySelector('#' + ns + 'listWrap'));
      });
    }
  }

  draw();
  return { refresh: draw };
};

// Persistent checkbox checklist with user-addable items.
// opts: { storageKey, defaultItems[] }
CP.ui.checklist = function (container, opts) {
  var ns = 'checklist_' + CP.ui.slug(opts.storageKey) + '_';

  function load() {
    var data = CP.storage.load(opts.storageKey, null);
    if (!data) {
      data = opts.defaultItems.map(function (name) { return { name: name, checked: false }; });
      CP.storage.save(opts.storageKey, data);
    }
    return data;
  }
  function persist(list) { CP.storage.save(opts.storageKey, list); }

  function draw() {
    var list = load();
    var rows = list.map(function (item, idx) {
      return '<li class="checklist-item">' +
        '<label><input type="checkbox" data-idx="' + idx + '" ' + (item.checked ? 'checked' : '') + '> ' +
        CP.ui.escapeHtml(item.name) + '</label>' +
        '<button class="btn btn-small btn-danger" data-remove="' + idx + '">Remove</button>' +
        '</li>';
    }).join('');
    container.innerHTML = '<ul class="checklist">' + rows + '</ul>' +
      '<form class="inline-add-form" id="' + ns + 'addForm">' +
      '<input type="text" name="newItem" placeholder="Add item...">' +
      '<button type="submit" class="btn btn-small">Add</button>' +
      '</form>';

    container.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var idx = +cb.getAttribute('data-idx');
        var l = load();
        l[idx].checked = cb.checked;
        persist(l);
      });
    });
    container.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = +btn.getAttribute('data-remove');
        var l = load();
        l.splice(idx, 1);
        persist(l);
        draw();
      });
    });
    var form = container.querySelector('#' + ns + 'addForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.newItem;
      if (!input.value.trim()) return;
      var l = load();
      l.push({ name: input.value.trim(), checked: false });
      persist(l);
      draw();
    });
  }
  draw();
};

// Single-object form (profile-style) backed by CP.storage.
// opts: { storageKey, fields[] }
CP.ui.profileForm = function (container, opts) {
  var ns = 'profile_' + CP.ui.slug(opts.storageKey) + '_';

  function load() { return CP.storage.load(opts.storageKey, {}); }

  function draw() {
    var data = load();
    var rows = opts.fields.map(function (f) {
      return '<label class="field"><span>' + CP.ui.escapeHtml(f.label) + '</span>' +
        CP.ui.fieldInputHtml(f, data[f.key], ns + 'f_') + '</label>';
    }).join('');
    container.innerHTML = '<form class="profile-form" id="' + ns + 'form">' + rows +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Save</button>' +
      '<span class="save-indicator" id="' + ns + 'saveIndicator"></span></div></form>';

    container.querySelector('#' + ns + 'form').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      opts.fields.forEach(function (f) {
        var el = container.querySelector('[name="' + f.key + '"]');
        d[f.key] = el ? el.value : '';
      });
      CP.storage.save(opts.storageKey, d);
      var ind = container.querySelector('#' + ns + 'saveIndicator');
      if (ind) {
        ind.textContent = 'Saved.';
        setTimeout(function () { if (ind) ind.textContent = ''; }, 2000);
      }
    });
  }
  draw();
};
