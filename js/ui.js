window.CP = window.CP || {};
CP.ui = {};

// Common international dialling codes for phone-number fields.
CP.ui.COUNTRY_CODES = [
  '+44 (UK)', '+1 (US/Canada)', '+353 (Ireland)', '+33 (France)', '+49 (Germany)',
  '+34 (Spain)', '+39 (Italy)', '+31 (Netherlands)', '+32 (Belgium)', '+41 (Switzerland)',
  '+351 (Portugal)', '+30 (Greece)', '+90 (Turkey)', '+971 (UAE)', '+966 (Saudi Arabia)',
  '+974 (Qatar)', '+965 (Kuwait)', '+20 (Egypt)', '+27 (South Africa)', '+234 (Nigeria)',
  '+254 (Kenya)', '+91 (India)', '+92 (Pakistan)', '+86 (China)', '+81 (Japan)',
  '+82 (South Korea)', '+65 (Singapore)', '+60 (Malaysia)', '+66 (Thailand)', '+63 (Philippines)',
  '+61 (Australia)', '+64 (New Zealand)', '+7 (Russia)', '+380 (Ukraine)', '+55 (Brazil)',
  '+52 (Mexico)', '+57 (Colombia)', '+54 (Argentina)', 'Other'
];

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

// 'bloodType' -> 'Blood Type'
CP.ui.prettifyKey = function (key) {
  var spaced = String(key || '').replace(/([A-Z])/g, ' $1');
  return (spaced.charAt(0).toUpperCase() + spaced.slice(1)).trim();
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

CP.ui.fieldInputHtml = function (field, value) {
  var val = value === undefined || value === null ? (field.default || '') : value;
  var id = 'f_' + field.key;
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
        CP.ui.fieldInputHtml(f, record[f.key]) + '</label>';
    }).join('');
    return '<form class="crud-form" id="crudForm">' + rows +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary">' + (editId ? 'Save Changes' : 'Add') + '</button>' +
      '<button type="button" class="btn" id="crudCancel">Cancel</button>' +
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
      return '<tr>' + tds + '<td class="actions">' + rowActionsHtml(rec) + '</td></tr>';
    }).join('');
    return '<div class="table-wrap"><table><thead><tr>' + head + '<th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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
        '<div class="card-actions">' + rowActionsHtml(rec) + '</div>' +
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
      '<button class="btn btn-primary" id="crudAddBtn">' + (opts.addLabel || '+ Add') + '</button>' +
      '</div>';
    if (opts.searchable) {
      html += '<div class="search-bar"><input type="text" id="crudSearch" placeholder="' +
        CP.ui.escapeHtml(opts.searchPlaceholder || 'Search...') + '" value="' + CP.ui.escapeHtml(searchQuery) + '"></div>';
    }
    var recordForForm = editId ? list.filter(function (r) { return r.id === editId; })[0] : {};
    html += '<div id="crudFormWrap">' + (formOpen ? formHtml(recordForForm) : '') + '</div>';
    html += '<div id="crudListWrap"></div>';
    container.innerHTML = html;

    renderListInto(container.querySelector('#crudListWrap'));

    var addBtn = container.querySelector('#crudAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        editId = null;
        formOpen = true;
        draw();
        var first = container.querySelector('#crudForm [name]');
        if (first) first.focus();
      });
    }

    var cancelBtn = container.querySelector('#crudCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        formOpen = false;
        editId = null;
        draw();
      });
    }

    var form = container.querySelector('#crudForm');
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
        var current = load();
        if (editId) {
          current = current.map(function (r) { return r.id === editId ? Object.assign({}, r, data) : r; });
        } else {
          data.id = CP.storage.uid();
          current.push(data);
        }
        persist(current);
        formOpen = false;
        editId = null;
        draw();
      });
    }

    var searchInput = container.querySelector('#crudSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value;
        renderListInto(container.querySelector('#crudListWrap'));
      });
    }
  }

  draw();
  return { refresh: draw };
};

// Persistent checkbox checklist with user-addable items.
// opts: { storageKey, defaultItems[] }
CP.ui.checklist = function (container, opts) {
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
      '<form class="inline-add-form" id="checklistAddForm">' +
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
    var form = container.querySelector('#checklistAddForm');
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

// Document library: upload a PDF/image, attach a title and notes, view/download it later.
// Files are stored as data URLs inside localStorage, so keep files small (a few MB total budget).
// opts: { storageKey, addLabel, emptyMessage }
CP.ui.docLibrary = function (container, opts) {
  var editId = null;
  var formOpen = false;

  function load() { return CP.storage.load(opts.storageKey, []); }

  function persist(list) {
    try {
      CP.storage.save(opts.storageKey, list);
      return true;
    } catch (e) {
      alert('Could not save: the file may be too large for browser storage. Try a smaller file, or remove an older document first.');
      return false;
    }
  }

  function formHtml(record) {
    record = record || {};
    return '<form class="crud-form" id="docForm">' +
      '<label class="field"><span>Title *</span><input type="text" name="title" value="' + CP.ui.escapeHtml(record.title || '') + '"></label>' +
      '<label class="field"><span>File (PDF or image)' + (record.fileName ? ' — currently: ' + CP.ui.escapeHtml(record.fileName) : '') + '</span>' +
      '<input type="file" name="file" accept="application/pdf,image/*"></label>' +
      '<label class="field"><span>Notes / Details</span><textarea name="notes" rows="3">' + CP.ui.escapeHtml(record.notes || '') + '</textarea></label>' +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary">' + (editId ? 'Save Changes' : 'Add') + '</button>' +
      '<button type="button" class="btn" id="docCancel">Cancel</button>' +
      '</div></form>';
  }

  function cardHtml(rec) {
    var viewLink = rec.dataUrl
      ? '<a class="btn btn-small" href="' + rec.dataUrl + '" download="' + CP.ui.escapeHtml(rec.fileName || 'document') + '" target="_blank" rel="noopener">View / Download</a>'
      : '';
    return '<div class="card">' +
      '<div class="card-head"><h3>' + CP.ui.escapeHtml(rec.title) + '</h3>' +
      (rec.fileName ? '<span class="badge">' + CP.ui.escapeHtml(rec.fileName) + '</span>' : '') +
      '</div>' +
      (rec.notes ? '<p class="notes">' + CP.ui.escapeHtml(rec.notes) + '</p>' : '') +
      '<div class="card-actions">' + viewLink +
      ' <button class="btn btn-small" data-act="edit" data-id="' + rec.id + '">Edit</button>' +
      ' <button class="btn btn-small btn-danger" data-act="delete" data-id="' + rec.id + '">Delete</button>' +
      '</div></div>';
  }

  function draw() {
    var list = load();
    var recordForForm = editId ? list.filter(function (r) { return r.id === editId; })[0] : {};
    var html = '<div class="segment-toolbar"><button class="btn btn-primary" id="docAddBtn">' + (opts.addLabel || '+ Add Document') + '</button></div>';
    html += '<div id="docFormWrap">' + (formOpen ? formHtml(recordForForm) : '') + '</div>';
    html += '<div class="card-grid" id="docListWrap">' +
      (list.length ? list.map(cardHtml).join('') : '<p class="empty-msg">' + (opts.emptyMessage || 'No documents added yet.') + '</p>') +
      '</div>';
    container.innerHTML = html;

    var addBtn = container.querySelector('#docAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { editId = null; formOpen = true; draw(); });
    }

    var cancelBtn = container.querySelector('#docCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () { formOpen = false; editId = null; draw(); });
    }

    var form = container.querySelector('#docForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = form.title.value.trim();
        if (!title) { alert('Please enter a title.'); return; }
        var file = form.file.files[0];
        var notes = form.notes.value;

        function finish(dataUrl, fileName, fileType) {
          var current = load();
          if (editId) {
            current = current.map(function (r) {
              if (r.id !== editId) return r;
              var updated = Object.assign({}, r, { title: title, notes: notes });
              if (dataUrl) { updated.dataUrl = dataUrl; updated.fileName = fileName; updated.fileType = fileType; }
              return updated;
            });
          } else {
            current.push({
              id: CP.storage.uid(), title: title, notes: notes,
              dataUrl: dataUrl || '', fileName: fileName || '', fileType: fileType || '',
              addedDate: new Date().toISOString().slice(0, 10)
            });
          }
          if (persist(current)) { formOpen = false; editId = null; draw(); }
        }

        if (file) {
          var reader = new FileReader();
          reader.onload = function () { finish(reader.result, file.name, file.type); };
          reader.onerror = function () { alert('Could not read the file.'); };
          reader.readAsDataURL(file);
        } else {
          finish(null, null, null);
        }
      });
    }

    container.querySelectorAll('[data-act="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () { editId = btn.getAttribute('data-id'); formOpen = true; draw(); });
    });
    container.querySelectorAll('[data-act="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this document?')) return;
        var id = btn.getAttribute('data-id');
        persist(load().filter(function (r) { return r.id !== id; }));
        draw();
      });
    });
  }

  draw();
};

// Single-object form (profile-style) backed by CP.storage.
// opts: { storageKey, fields[] }
CP.ui.profileForm = function (container, opts) {
  function load() { return CP.storage.load(opts.storageKey, {}); }

  function draw() {
    var data = load();
    var rows = opts.fields.map(function (f) {
      return '<label class="field"><span>' + CP.ui.escapeHtml(f.label) + '</span>' +
        CP.ui.fieldInputHtml(f, data[f.key]) + '</label>';
    }).join('');
    container.innerHTML = '<form class="profile-form" id="profileForm">' + rows +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Save</button>' +
      '<span class="save-indicator" id="saveIndicator"></span></div></form>';

    container.querySelector('#profileForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      opts.fields.forEach(function (f) {
        var el = container.querySelector('[name="' + f.key + '"]');
        d[f.key] = el ? el.value : '';
      });
      CP.storage.save(opts.storageKey, d);
      var ind = container.querySelector('#saveIndicator');
      if (ind) {
        ind.textContent = 'Saved.';
        setTimeout(function () { if (ind) ind.textContent = ''; }, 2000);
      }
    });
  }
  draw();
};
