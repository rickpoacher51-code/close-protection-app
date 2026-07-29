window.CP = window.CP || {};
CP.lock = {};

// Simple, distinct, easy-to-write words for system-generated recovery phrases.
var CP_LOCK_WORDS = [
  'able', 'acorn', 'amber', 'anchor', 'apple', 'arch', 'arrow', 'ash', 'aspen', 'autumn',
  'badge', 'banner', 'barn', 'basin', 'beacon', 'bear', 'birch', 'blade', 'blaze', 'bloom',
  'blue', 'boat', 'bolt', 'bramble', 'brave', 'breeze', 'bridge', 'brook', 'cabin', 'camp',
  'canyon', 'cedar', 'chalk', 'charm', 'cliff', 'cloud', 'clover', 'coast', 'comet', 'compass',
  'copper', 'coral', 'cove', 'crane', 'creek', 'crest', 'crimson', 'crown', 'cypress', 'dawn',
  'deer', 'delta', 'desert', 'dove', 'drift', 'eagle', 'ember', 'falcon', 'feather', 'fern',
  'field', 'finch', 'fjord', 'flame', 'flint', 'forest', 'fox', 'garnet', 'glacier', 'glade',
  'gold', 'granite', 'grove', 'gull', 'harbor', 'hawk', 'hazel', 'hearth', 'hickory', 'holly',
  'honey', 'horizon', 'indigo', 'ivory', 'ivy', 'jade', 'juniper', 'kestrel', 'lagoon', 'lake',
  'lantern', 'lark', 'laurel', 'leaf', 'ledge', 'lily', 'linden', 'lotus', 'lynx', 'maple',
  'marble', 'marsh', 'meadow', 'mesa', 'mint', 'mist', 'moor', 'moss', 'mountain', 'myrtle',
  'north', 'oak', 'oasis', 'oat', 'ocean', 'olive', 'onyx', 'opal', 'orbit', 'osprey',
  'otter', 'owl', 'palm', 'path', 'peak', 'pear', 'pebble', 'pepper', 'pine', 'plum',
  'pond', 'poplar', 'prairie', 'quail', 'quartz', 'quill', 'rain', 'raven', 'reed', 'reef',
  'ridge', 'river', 'robin', 'rock', 'rose', 'rowan', 'ruby', 'sage', 'sail', 'sand',
  'sapphire', 'shale', 'shore', 'sky', 'slate', 'snow', 'sparrow', 'spring', 'spruce', 'star',
  'stone', 'storm', 'stream', 'summit', 'sunset', 'swan', 'sycamore', 'teal', 'thistle', 'thorn',
  'thunder', 'tide', 'timber', 'topaz', 'trail', 'tundra', 'valley', 'velvet', 'vine', 'violet',
  'vista', 'walnut', 'warbler', 'water', 'wave', 'wheat', 'whisper', 'willow', 'wind', 'wing',
  'winter', 'wolf', 'wood', 'wren', 'zephyr'
];

var CP_RECOVERY_WORD_COUNT = 6;

function cpRandomInt(max) {
  var arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function cpRandomWords(count) {
  var pool = CP_LOCK_WORDS.slice();
  var chosen = [];
  for (var i = 0; i < count; i++) {
    var idx = cpRandomInt(pool.length);
    chosen.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return chosen;
}

function cpRandomSalt() {
  var arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function cpSha256Hex(str) {
  var enc = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  });
}

function cpNormalizePhrase(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// --- Config ---

CP.lock.getConfig = function () { return CP.storage.loadGlobal('appLock', null); };
CP.lock.isEnabled = function () { return !!CP.lock.getConfig(); };

CP.lock.verifyPin = function (pin, cb) {
  var cfg = CP.lock.getConfig();
  if (!cfg) { cb(true); return; }
  cpSha256Hex(cfg.salt + ':pin:' + pin).then(function (hash) { cb(hash === cfg.pinHash); });
};

CP.lock.verifyRecoveryPhrase = function (phrase, cb) {
  var cfg = CP.lock.getConfig();
  if (!cfg) { cb(true); return; }
  cpSha256Hex(cfg.salt + ':phrase:' + cpNormalizePhrase(phrase)).then(function (hash) { cb(hash === cfg.recoveryHash); });
};

// Generates a fresh salt + recovery phrase, hashes everything, saves config.
// cb(recoveryWords) is called with the plaintext words so the caller can display them once.
CP.lock.setNewPin = function (pin, cb) {
  var salt = cpRandomSalt();
  var words = cpRandomWords(CP_RECOVERY_WORD_COUNT);
  var phrase = words.join(' ');
  Promise.all([
    cpSha256Hex(salt + ':pin:' + pin),
    cpSha256Hex(salt + ':phrase:' + cpNormalizePhrase(phrase))
  ]).then(function (results) {
    CP.storage.saveGlobal('appLock', { salt: salt, pinHash: results[0], recoveryHash: results[1], updatedDate: new Date().toISOString().slice(0, 10) });
    cb(words);
  });
};

CP.lock.disable = function () { CP.storage.removeGlobal('appLock'); };

function cpIsValidPin(pin) { return /^\d{6}$/.test(pin); }

// --- Startup lock screen (blocks the app until unlocked; only shown on a fresh page load) ---

CP.lock.checkAndRun = function (onUnlocked) {
  if (!CP.lock.isEnabled()) { onUnlocked(); return; }

  var overlay = document.createElement('div');
  overlay.id = 'lockOverlay';
  overlay.className = 'lock-overlay';
  document.body.appendChild(overlay);

  var mode = 'pin'; // 'pin' | 'recovery' | 'newpin'

  function unlock() {
    overlay.remove();
    onUnlocked();
  }

  function draw() {
    if (mode === 'pin') {
      overlay.innerHTML =
        '<div class="lock-card">' +
        '<div class="lock-emblem"><img src="icons/icon-192.png" alt=""></div>' +
        '<h2>Enter PIN</h2>' +
        '<form id="lockPinForm">' +
        '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockPinInput" placeholder="6-digit PIN">' +
        '<div class="lock-error" id="lockError"></div>' +
        '<button type="submit" class="btn btn-primary">Unlock</button>' +
        '</form>' +
        '<a href="#" id="lockForgotLink">Forgotten PIN?</a>' +
        '</div>';
      overlay.querySelector('#lockPinInput').focus();
      overlay.querySelector('#lockPinForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var pin = overlay.querySelector('#lockPinInput').value;
        CP.lock.verifyPin(pin, function (ok) {
          if (ok) { unlock(); return; }
          overlay.querySelector('#lockError').textContent = 'Incorrect PIN.';
          overlay.querySelector('#lockPinInput').value = '';
          overlay.querySelector('#lockPinInput').focus();
        });
      });
      overlay.querySelector('#lockForgotLink').addEventListener('click', function (e) {
        e.preventDefault();
        mode = 'recovery';
        draw();
      });
    } else if (mode === 'recovery') {
      overlay.innerHTML =
        '<div class="lock-card">' +
        '<h2>Recovery Phrase</h2>' +
        '<p class="hint">Enter the recovery phrase you were shown when the PIN was set up.</p>' +
        '<form id="lockRecoveryForm">' +
        '<input type="text" autocomplete="off" id="lockRecoveryInput" placeholder="word word word word word word">' +
        '<div class="lock-error" id="lockError"></div>' +
        '<button type="submit" class="btn btn-primary">Continue</button>' +
        '</form>' +
        '<a href="#" id="lockBackLink">Back to PIN entry</a>' +
        '</div>';
      overlay.querySelector('#lockRecoveryInput').focus();
      overlay.querySelector('#lockRecoveryForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var phrase = overlay.querySelector('#lockRecoveryInput').value;
        CP.lock.verifyRecoveryPhrase(phrase, function (ok) {
          if (ok) { mode = 'newpin'; draw(); return; }
          overlay.querySelector('#lockError').textContent = 'That recovery phrase doesn’t match.';
        });
      });
      overlay.querySelector('#lockBackLink').addEventListener('click', function (e) {
        e.preventDefault();
        mode = 'pin';
        draw();
      });
    } else if (mode === 'newpin') {
      overlay.innerHTML =
        '<div class="lock-card">' +
        '<h2>Set a New PIN</h2>' +
        '<p class="hint">Recovery verified. Choose a new 6-digit PIN — you’ll get a new recovery phrase too.</p>' +
        '<form id="lockNewPinForm">' +
        '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockNewPin1" placeholder="New 6-digit PIN">' +
        '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockNewPin2" placeholder="Confirm new PIN">' +
        '<div class="lock-error" id="lockError"></div>' +
        '<button type="submit" class="btn btn-primary">Save New PIN</button>' +
        '</form>' +
        '</div>';
      overlay.querySelector('#lockNewPinForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var p1 = overlay.querySelector('#lockNewPin1').value;
        var p2 = overlay.querySelector('#lockNewPin2').value;
        if (!cpIsValidPin(p1)) { overlay.querySelector('#lockError').textContent = 'PIN must be exactly 6 digits.'; return; }
        if (p1 !== p2) { overlay.querySelector('#lockError').textContent = 'PINs don’t match.'; return; }
        CP.lock.setNewPin(p1, function (words) {
          mode = 'showphrase';
          renderPhraseAck(words);
        });
      });
    }
  }

  function renderPhraseAck(words) {
    overlay.innerHTML =
      '<div class="lock-card">' +
      '<h2>Your New Recovery Phrase</h2>' +
      '<p class="hint">Write this down somewhere safe, outside this app. It won’t be shown again.</p>' +
      '<div class="lock-phrase">' + words.join(' ') + '</div>' +
      '<label class="lock-ack"><input type="checkbox" id="lockAckBox"> I’ve saved this phrase somewhere safe</label>' +
      '<button type="button" class="btn btn-primary" id="lockAckContinue" disabled>Continue</button>' +
      '</div>';
    var box = overlay.querySelector('#lockAckBox');
    var btn = overlay.querySelector('#lockAckContinue');
    box.addEventListener('change', function () { btn.disabled = !box.checked; });
    btn.addEventListener('click', function () { unlock(); });
  }

  draw();
};

// --- Dashboard settings panel: view status, set up / change / disable the PIN ---

CP.lock.renderSettings = function (container) {
  var step = { mode: CP.lock.isEnabled() ? 'status' : 'status' };
  var pendingWords = null;

  function draw() {
    var enabled = CP.lock.isEnabled();

    if (step.mode === 'status') {
      container.innerHTML = enabled
        ? '<p class="hint">App lock is <strong>ON</strong>. A 6-digit PIN is required every time the app is fully closed and reopened.</p>' +
          '<div class="form-actions"><button class="btn btn-small" id="lockChangeBtn">Change PIN</button>' +
          '<button class="btn btn-small btn-danger" id="lockDisableBtn">Disable Lock</button></div>'
        : '<p class="hint">App lock is <strong>OFF</strong>. Set a 6-digit PIN so the app can’t be opened without it. ' +
          'This deters casual/shoulder-surfed access on this device — it isn’t protection against someone with the device and technical tools.</p>' +
          '<div class="form-actions"><button class="btn btn-primary btn-small" id="lockSetupBtn">Set Up PIN</button></div>';

      var setupBtn = container.querySelector('#lockSetupBtn');
      if (setupBtn) setupBtn.addEventListener('click', function () { step.mode = 'new-pin'; step.afterVerify = false; draw(); });

      var changeBtn = container.querySelector('#lockChangeBtn');
      if (changeBtn) changeBtn.addEventListener('click', function () { step.mode = 'verify'; step.next = 'new-pin'; draw(); });

      var disableBtn = container.querySelector('#lockDisableBtn');
      if (disableBtn) disableBtn.addEventListener('click', function () { step.mode = 'verify'; step.next = 'disable'; draw(); });
    }

    else if (step.mode === 'verify') {
      container.innerHTML =
        '<form id="lockVerifyForm" class="inline-add-form">' +
        '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockVerifyInput" placeholder="Enter current PIN">' +
        '<button type="submit" class="btn btn-small btn-primary">Confirm</button>' +
        '<button type="button" class="btn btn-small" id="lockVerifyCancel">Cancel</button>' +
        '</form><div class="lock-error" id="lockSettingsError"></div>';
      container.querySelector('#lockVerifyCancel').addEventListener('click', function () { step.mode = 'status'; draw(); });
      container.querySelector('#lockVerifyForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var pin = container.querySelector('#lockVerifyInput').value;
        CP.lock.verifyPin(pin, function (ok) {
          if (!ok) { container.querySelector('#lockSettingsError').textContent = 'Incorrect PIN.'; return; }
          if (step.next === 'disable') {
            CP.lock.disable();
            step.mode = 'status';
            draw();
          } else {
            step.mode = 'new-pin';
            draw();
          }
        });
      });
    }

    else if (step.mode === 'new-pin') {
      container.innerHTML =
        '<form id="lockNewPinForm" class="crud-form">' +
        '<label class="field"><span>New 6-digit PIN</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockSetupPin1"></label>' +
        '<label class="field"><span>Confirm New PIN</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" id="lockSetupPin2"></label>' +
        '<div class="lock-error" id="lockSettingsError"></div>' +
        '<div class="form-actions"><button type="submit" class="btn btn-primary">Save PIN</button>' +
        '<button type="button" class="btn" id="lockNewPinCancel">Cancel</button></div>' +
        '</form>';
      container.querySelector('#lockNewPinCancel').addEventListener('click', function () { step.mode = 'status'; draw(); });
      container.querySelector('#lockNewPinForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var p1 = container.querySelector('#lockSetupPin1').value;
        var p2 = container.querySelector('#lockSetupPin2').value;
        var err = container.querySelector('#lockSettingsError');
        if (!cpIsValidPin(p1)) { err.textContent = 'PIN must be exactly 6 digits.'; return; }
        if (p1 !== p2) { err.textContent = 'PINs don’t match.'; return; }
        CP.lock.setNewPin(p1, function (words) {
          pendingWords = words;
          step.mode = 'show-phrase';
          draw();
        });
      });
    }

    else if (step.mode === 'show-phrase') {
      container.innerHTML =
        '<p class="hint">Write this recovery phrase down somewhere safe, outside this app. It won’t be shown again.</p>' +
        '<div class="lock-phrase">' + pendingWords.join(' ') + '</div>' +
        '<label class="lock-ack"><input type="checkbox" id="lockSettingsAck"> I’ve saved this phrase somewhere safe</label>' +
        '<div class="form-actions"><button type="button" class="btn btn-primary" id="lockSettingsAckDone" disabled>Done</button></div>';
      var box = container.querySelector('#lockSettingsAck');
      var btn = container.querySelector('#lockSettingsAckDone');
      box.addEventListener('change', function () { btn.disabled = !box.checked; });
      btn.addEventListener('click', function () { pendingWords = null; step.mode = 'status'; draw(); });
    }
  }

  draw();
};
