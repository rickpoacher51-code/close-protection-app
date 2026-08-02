// Disclaimer acceptance tracking, written fresh — independent of the
// unattributed CP.disclaimer code found elsewhere in this repo, which
// stays unlinked and untouched. Uses CP.storage.loadGlobal / saveGlobal
// so acceptance persists across all operations, and is deliberately
// NOT swept into exportAll()/importAll() backups — a restored backup
// shouldn't silently carry forward acceptance of a version the user
// may never have actually seen on this device.

window.CP = window.CP || {};

CP.disclaimer = (function () {

  var VERSION = '1.0';
  var VERSION_LABEL = 'v1.0 (30 July 2026)';
  var GLOBAL_KEY = 'disclaimerAcceptance';

  var HTML =
    '<h3>Disclaimer</h3>' +
    '<p>Close Protection Ops (&ldquo;the App&rdquo;) is provided by RD Anzen Ltd as a planning and information-organisation aid for close protection and security professionals. It is not a substitute for professional judgement, risk assessment, or operational decision-making.</p>' +
    '<p>By using the App, you acknowledge and agree that:</p>' +
    '<ol>' +
    '<li><strong>No warranty of accuracy.</strong> The App is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; RD Anzen Ltd makes no representation or warranty, express or implied, as to the accuracy, completeness, reliability, or currency of any information entered, stored, generated, or displayed by the App, including but not limited to routes, venue data, contact details, medical information, or communications plans.</li>' +
    '<li><strong>Not professional advice.</strong> Nothing in the App constitutes security, medical, legal, or professional advice. All operational plans, risk assessments, and decisions remain the sole responsibility of the user and their organisation.</li>' +
    '<li><strong>User responsibility.</strong> The user is solely responsible for independently verifying all information within the App before relying on it in any operational context, and for exercising independent professional judgement at all times.</li>' +
    '<li><strong>Data handling.</strong> The App stores data locally on the user&rsquo;s device. RD Anzen Ltd is not responsible for loss, corruption, unauthorised access, or disclosure of data resulting from device loss, theft, failure, or user error.</li>' +
    '<li><strong>Limitation of liability.</strong> To the maximum extent permitted by law, RD Anzen Ltd excludes all liability for any indirect, incidental, special, or consequential loss or damage &mdash; including loss of data, loss of profit, or business interruption &mdash; arising from use of, or inability to use, the App.</li>' +
    '<li><strong>Statutory rights preserved.</strong> Nothing in this disclaimer excludes or limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability which cannot lawfully be excluded or limited under the laws of England and Wales.</li>' +
    '</ol>' +
    '<p>By continuing to use the App, you confirm that you have read, understood, and accepted this disclaimer.</p>' +
    '<p><em>RD Anzen Ltd &mdash; ' + VERSION_LABEL + '</em></p>';

  function getAcceptance() {
    return CP.storage.loadGlobal(GLOBAL_KEY, null);
  }

  function isAccepted() {
    var rec = getAcceptance();
    return !!(rec && rec.version === VERSION);
  }

  function recordAcceptance() {
    CP.storage.saveGlobal(GLOBAL_KEY, {
      acceptedAt: new Date().toISOString(),
      version: VERSION
    });
  }

  return {
    VERSION: VERSION,
    VERSION_LABEL: VERSION_LABEL,
    HTML: HTML,
    getAcceptance: getAcceptance,
    isAccepted: isAccepted,
    recordAcceptance: recordAcceptance
  };
})();

CP.disclaimerGate = (function () {

  function injectStyles() {
    if (document.getElementById('cpDisclaimerStyles')) return;
    var style = document.createElement('style');
    style.id = 'cpDisclaimerStyles';
    style.textContent =
      '#cpDisclaimerScreen{position:fixed;inset:0;background:#0f1418;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;z-index:9998;padding:20px;' +
      'box-sizing:border-box;}' +
      '#cpDisclaimerBox{width:100%;max-width:480px;max-height:90vh;display:flex;' +
      'flex-direction:column;}' +
      '#cpDisclaimerScroll{overflow-y:auto;background:#1b2126;padding:16px;' +
      'border-radius:6px;font-size:14px;line-height:1.5;}' +
      '#cpDisclaimerScroll h3{margin-top:0;}' +
      '#cpDisclaimerScroll ol{padding-left:20px;}' +
      '#cpDisclaimerScroll li{margin-bottom:10px;}' +
      '#cpDisclaimerBox button{width:100%;padding:12px;margin-top:14px;' +
      'border-radius:6px;border:none;background:#2f7a4d;color:#fff;' +
      'font-size:15px;cursor:pointer;flex-shrink:0;}' +
      '#cpDisclaimerBox button:disabled{background:#3a4650;cursor:not-allowed;}';
    document.head.appendChild(style);
  }

  function boot(onAccepted) {
    if (CP.disclaimer.isAccepted()) {
      onAccepted();
      return;
    }

    injectStyles();
    document.body.insertAdjacentHTML('beforeend',
      '<div id="cpDisclaimerScreen"><div id="cpDisclaimerBox">' +
      '<div id="cpDisclaimerScroll">' + CP.disclaimer.HTML + '</div>' +
      '<button id="cpDisclaimerAcceptBtn" disabled>Scroll to the bottom to continue</button>' +
      '</div></div>');

    var scrollEl = document.getElementById('cpDisclaimerScroll');
    var btn = document.getElementById('cpDisclaimerAcceptBtn');

    function checkScrolled() {
      var atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 4;
      if (atBottom) {
        btn.disabled = false;
        btn.textContent = 'I have read and accept';
      }
    }
    scrollEl.addEventListener('scroll', checkScrolled);
    checkScrolled(); // covers content short enough to not need scrolling

    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      CP.disclaimer.recordAcceptance();
      document.getElementById('cpDisclaimerScreen').remove();
      onAccepted();
    });
  }

  return { boot: boot };
})();
