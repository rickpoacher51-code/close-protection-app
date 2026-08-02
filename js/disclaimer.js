window.CP = window.CP || {};
CP.disclaimer = {};

CP.disclaimer.VERSION = '1.0';
CP.disclaimer.VERSION_LABEL = 'v1.0 (29 July 2026)';

CP.disclaimer.HTML =
  '<p>By using the App, you acknowledge and agree that:</p>' +
  '<p><strong>No warranty of accuracy.</strong> The App is provided “as is” and “as available.” RD Anzen Ltd makes no representation ' +
  'or warranty, express or implied, as to the accuracy, completeness, reliability, or currency of any information entered, stored, ' +
  'generated, or displayed by the App, including but not limited to routes, venue data, contact details, medical information, or ' +
  'communications plans.</p>' +
  '<p><strong>Not professional advice.</strong> Nothing in the App constitutes security, medical, legal, or professional advice. ' +
  'All operational plans, risk assessments, and decisions remain the sole responsibility of the user and their organisation.</p>' +
  '<p><strong>User responsibility.</strong> The user is solely responsible for independently verifying all information within the App ' +
  'before relying on it in any operational context, and for exercising independent professional judgement at all times.</p>' +
  '<p><strong>Data handling.</strong> The App stores data locally on the user’s device. RD Anzen Ltd is not responsible for loss, ' +
  'corruption, unauthorised access, or disclosure of data resulting from device loss, theft, failure, or user error.</p>' +
  '<p><strong>Limitation of liability.</strong> To the maximum extent permitted by law, RD Anzen Ltd excludes all liability for any ' +
  'indirect, incidental, special, or consequential loss or damage — including loss of data, loss of profit, or business interruption — ' +
  'arising from use of, or inability to use, the App.</p>' +
  '<p><strong>Statutory rights preserved.</strong> Nothing in this disclaimer excludes or limits liability for death or personal injury ' +
  'caused by negligence, fraud or fraudulent misrepresentation, or any other liability which cannot lawfully be excluded or limited ' +
  'under the laws of England and Wales.</p>' +
  '<p>By continuing to use the App, you confirm that you have read, understood, and accepted this disclaimer.</p>' +
  '<p>RD Anzen Ltd — ' + CP.disclaimer.VERSION_LABEL + '</p>';

CP.disclaimer.getAcceptance = function () { return CP.storage.loadGlobal('disclaimerAcceptance', null); };

CP.disclaimer.isAccepted = function () {
  var rec = CP.disclaimer.getAcceptance();
  return !!(rec && rec.version === CP.disclaimer.VERSION);
};

CP.disclaimer.checkAndRun = function (onAccepted) {
  if (CP.disclaimer.isAccepted()) { onAccepted(); return; }

  var overlay = document.createElement('div');
  overlay.id = 'disclaimerOverlay';
  overlay.className = 'lock-overlay';
  overlay.innerHTML =
    '<div class="lock-card lock-card-wide">' +
    '<h2>Terms & Disclaimer</h2>' +
    '<div class="disclaimer-scroll">' + CP.disclaimer.HTML + '</div>' +
    '<button type="button" class="btn btn-primary" id="disclaimerAcceptBtn">I have read and accept</button>' +
    '</div>';
  document.body.appendChild(overlay);

  overlay.querySelector('#disclaimerAcceptBtn').addEventListener('click', function () {
    CP.storage.saveGlobal('disclaimerAcceptance', {
      version: CP.disclaimer.VERSION,
      acceptedAt: new Date().toISOString()
    });
    overlay.remove();
    onAccepted();
  });
};
