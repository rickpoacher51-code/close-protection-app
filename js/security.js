// Device-level PIN gate. Deliberately does NOT use CP.storage.save/load
// (those are scoped per-operation) and deliberately does NOT share CP.PREFIX
// ('cpapp_'), so this data is never swept into exportAll()/importAll().

window.CP = window.CP || {};

CP.security = (function () {

  var KEY_PIN_HASH = 'cpops_security_pinHash';
  var KEY_PIN_SALT = 'cpops_security_pinSalt';
  var KEY_RECOVERY_HASH = 'cpops_security_recoveryHash';
  var SESSION_KEY = 'cpops_security_unlocked';

  var RECOVERY_WORDS = [
    'anchor','beacon','cedar','delta','ember','falcon','granite','harbor',
    'ivory','jasper','kestrel','lumen','maple','nectar','onyx','pebble',
    'quartz','raven','sable','tundra','umber','violet','willow','yonder',
    'zephyr','arbor','birch','cobalt','drift','echo','flint','glacier',
    'heron','indigo','juniper','knoll','lantern','meadow','nomad','opal',
    'prairie','quill','ridge','summit','thistle','urchin','vale','wren'
  ];

  function bufToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ('00' + b.toString(16)).slice(-2);
    }).join('');
  }

  function sha256Hex(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(bufToHex);
  }

  function randomSalt() {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return bufToHex(arr);
  }

  function generateRecoveryPhrase() {
    var words = [];
    var pool = RECOVERY_WORDS.slice();
    for (var i = 0; i < 5; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      words.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return words.join('-');
  }

  function hasPin() {
    return !!localStorage.getItem(KEY_PIN_HASH);
  }

  function isUnlockedThisSession() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function markUnlocked() {
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  function setPin(pin) {
    var salt = randomSalt();
    return sha256Hex(salt + pin).then(function (hash) {
      localStorage.setItem(KEY_PIN_SALT, salt);
      localStorage.setItem(KEY_PIN_HASH, hash);
    });
  }

  function checkPin(pin) {
    var salt = localStorage.getItem(KEY_PIN_SALT) || '';
    return sha256Hex(salt + pin).then(function (hash) {
      return hash === localStorage.getItem(KEY_PIN_HASH);
    });
  }

  function setRecoveryPhrase(phrase) {
    return sha256Hex(phrase.toLowerCase().trim()).then(function (hash) {
      localStorage.setItem(KEY_RECOVERY_HASH, hash);
    });
  }

  function checkRecoveryPhrase(phrase) {
    return sha256Hex(phrase.toLowerCase().trim()).then(function (hash) {
      return hash === localStorage.getItem(KEY_RECOVERY_HASH);
    });
  }

  return {
    hasPin: hasPin,
    isUnlockedThisSession: isUnlockedThisSession,
    markUnlocked: markUnlocked,
    setPin: setPin,
    checkPin: checkPin,
    generateRecoveryPhrase: generateRecoveryPhrase,
    setRecoveryPhrase: setRecoveryPhrase,
    checkRecoveryPhrase: checkRecoveryPhrase
  };
})();

CP.securityGate = (function () {

  function injectStyles() {
    if (document.getElementById('cpSecurityStyles')) return;
    var style = document.createElement('style');
    style.id = 'cpSecurityStyles';
    style.textContent =
      '#cpLockScreen{position:fixed;inset:0;background:#0f1418;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;z-index:9999;}' +
      '#cpLockBox{width:280px;text-align:center;}' +
      '#cpLockBox input{width:100%;font-size:24px;letter-spacing:6px;' +
      'text-align:center;padding:10px;margin:12px 0;border-radius:6px;' +
      'border:1px solid #444;background:#1b2126;color:#fff;box-sizing:border-box;}' +
      '#cpLockBox button{width:100%;padding:10px;margin-top:8px;' +
      'border-radius:6px;border:none;background:#2f7a4d;color:#fff;' +
      'font-size:15px;cursor:pointer;}' +
      '#cpLockBox .link{background:none;color:#9db3a8;font-size:13px;' +
      'text-decoration:underline;margin-top:14px;padding:0;}' +
      '#cpLockBox .msg{min-height:18px;color:#e07a5f;font-size:13px;}' +
      '#cpLockBox .phrase{font-size:18px;letter-spacing:1px;' +
      'background:#1b2126;padding:14px;border-radius:6px;margin:12px 0;' +
      'word-break:break-word;}';
    document.head.appendChild(style);
  }

  function render(html) {
    var existing = document.getElementById('cpLockScreen');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend',
      '<div id="cpLockScreen"><div id="cpLockBox">' + html + '</div></div>');
  }

  function remove() {
    var el = document.getElementById('cpLockScreen');
    if (el) el.remove();
  }

  function showSetup(onDone) {
    render(
      '<h2>Set a PIN</h2>' +
      '<p>Protects this app if your device is unlocked.</p>' +
      '<input type="password" inputmode="numeric" maxlength="6" id="cpPin1" placeholder="6-digit PIN">' +
      '<input type="password" inputmode="numeric" maxlength="6" id="cpPin2" placeholder="Confirm PIN">' +
      '<div class="msg" id="cpMsg"></div>' +
      '<button id="cpSetPinBtn">Set PIN</button>'
    );
    document.getElementById('cpSetPinBtn').addEventListener('click', function () {
      var p1 = document.getElementById('cpPin1').value;
      var p2 = document.getElementById('cpPin2').value;
      var msg = document.getElementById('cpMsg');
      if (!/^\d{6}$/.test(p1)) { msg.textContent = 'PIN must be exactly 6 digits.'; return; }
      if (p1 !== p2) { msg.textContent = 'PINs do not match.'; return; }
      CP.security.setPin(p1).then(function () {
        var phrase = CP.security.generateRecoveryPhrase();
        CP.security.setRecoveryPhrase(phrase).then(function () {
          showRecoveryPhraseOnce(phrase, onDone);
        });
      });
    });
  }

  function showRecoveryPhraseOnce(phrase, onDone) {
    render(
      '<h2>Write this down</h2>' +
      '<p>This is the only way back in if you forget your PIN. It will not be shown again, and it is not included in your app backups.</p>' +
      '<div class="phrase">' + phrase + '</div>' +
      '<button id="cpPhraseConfirmBtn">I\'ve saved it &mdash; continue</button>'
    );
    document.getElementById('cpPhraseConfirmBtn').addEventListener('click', function () {
      CP.security.markUnlocked();
      remove();
      onDone();
    });
  }

  function showUnlock(onDone) {
    render(
      '<h2>Enter PIN</h2>' +
      '<input type="password" inputmode="numeric" maxlength="6" id="cpPinEntry" placeholder="6-digit PIN" autofocus>' +
      '<div class="msg" id="cpMsg"></div>' +
      '<button id="cpUnlockBtn">Unlock</button>' +
      '<button class="link" id="cpForgotBtn">Forgot PIN?</button>'
    );
    document.getElementById('cpUnlockBtn').addEventListener('click', attempt);
    document.getElementById('cpPinEntry').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });
    document.getElementById('cpForgotBtn').addEventListener('click', function () {
      showRecoveryEntry(onDone);
    });

    function attempt() {
      var val = document.getElementById('cpPinEntry').value;
      var msg = document.getElementById('cpMsg');
      CP.security.checkPin(val).then(function (ok) {
        if (ok) {
          CP.security.markUnlocked();
          remove();
          onDone();
        } else {
          msg.textContent = 'Incorrect PIN.';
        }
      });
    }
  }

  function showRecoveryEntry(onDone) {
    render(
      '<h2>Recovery phrase</h2>' +
      '<p>Enter the phrase shown when you first set your PIN.</p>' +
      '<input type="text" id="cpRecoveryEntry" placeholder="word-word-word-word-word">' +
      '<div class="msg" id="cpMsg"></div>' +
      '<button id="cpRecoveryBtn">Verify</button>'
    );
    document.getElementById('cpRecoveryBtn').addEventListener('click', function () {
      var val = document.getElementById('cpRecoveryEntry').value;
      var msg = document.getElementById('cpMsg');
      CP.security.checkRecoveryPhrase(val).then(function (ok) {
        if (ok) {
          showSetup(onDone); // recovery succeeded — force setting a new PIN
        } else {
          msg.textContent = 'Phrase did not match.';
        }
      });
    });
  }

  function boot(onUnlocked) {
    injectStyles();
    if (!CP.security.hasPin()) {
      showSetup(onUnlocked);
    } else if (CP.security.isUnlockedThisSession()) {
      onUnlocked();
    } else {
      showUnlock(onUnlocked);
    }
  }

  return { boot: boot };
})();
