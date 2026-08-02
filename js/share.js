window.CP = window.CP || {};
CP.share = {};

function cpBufToB64(buf) {
  var bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  var binary = '';
  bytes.forEach(function (b) { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function cpB64ToBuf(b64) {
  var binary = atob(b64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function cpDeriveShareKey(pin, salt) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']).then(function (keyMaterial) {
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  });
}

// Builds a plain object of everything in the CURRENT operation only (not the whole app).
CP.share.buildOperationPayload = function () {
  var opInfo = CP.storage.load('opInfo', {});
  var payload = { _operationName: opInfo.operationName || 'Shared Operation', _exportedAt: new Date().toISOString() };
  CP.storage.OPERATION_DATA_KEYS.forEach(function (key) {
    payload[key] = CP.storage.load(key, null);
  });
  return payload;
};

CP.share.encrypt = function (obj, pin) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return cpDeriveShareKey(pin, salt).then(function (key) {
    var enc = new TextEncoder();
    var data = enc.encode(JSON.stringify(obj));
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data).then(function (cipherBuf) {
      return { v: 1, salt: cpBufToB64(salt), iv: cpBufToB64(iv), data: cpBufToB64(cipherBuf) };
    });
  });
};

// Rejects (throws) if the PIN is wrong or the file is corrupted — AES-GCM authenticates itself.
CP.share.decrypt = function (envelope, pin) {
  var salt = cpB64ToBuf(envelope.salt);
  var iv = cpB64ToBuf(envelope.iv);
  return cpDeriveShareKey(pin, new Uint8Array(salt)).then(function (key) {
    var cipherBuf = cpB64ToBuf(envelope.data);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, cipherBuf).then(function (plainBuf) {
      return JSON.parse(new TextDecoder().decode(plainBuf));
    });
  });
};

CP.share.downloadEnvelope = function (envelope, filenameBase) {
  var blob = new Blob([JSON.stringify(envelope)], { type: 'application/octet-stream' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (filenameBase || 'operation-share') + '.cpshare';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Imports a decrypted payload as a brand-new operation, leaving the importer's existing operations untouched.
CP.share.importAsNewOperation = function (payload) {
  var name = payload._operationName ? payload._operationName + ' (Shared)' : 'Shared Operation';
  var newId = CP.storage.createOperation(name);
  var previousId = CP.storage.getCurrentOperationId();
  CP.storage.setCurrentOperationId(newId);
  CP.storage.OPERATION_DATA_KEYS.forEach(function (key) {
    if (payload[key] !== undefined && payload[key] !== null) {
      CP.storage.save(key, payload[key]);
    }
  });
  CP.storage.setCurrentOperationId(previousId);
  return newId;
};
