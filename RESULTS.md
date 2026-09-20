# Close Protection Ops - Patch 1 (security hardening) - results

Nothing here is live. It is a patch against `rickpoacher51-code/close-protection-app` (commit 6c81c49). Apply it, then deploy.

## How to apply
Either: `git apply patch-1-security-hardening.diff` from the repo root (verified to apply cleanly to a fresh clone),
or copy everything under `files/` over the repo, same paths. Commit ALL of it in one commit, including the new `privacy.html`
and `beta/js/disclaimer.js` (sw.js precaches them - a missing precached file makes the new service worker fail to install).

Before deploying the beta: use Export Full Backup in the current beta. The beta now stores data under `cpbeta_` instead of the
production app's `cpapp_`, so existing beta data won't appear until you Import that backup.
After deploy: reload twice (new service worker), accept Terms v1.2.

## What changed
Production app (root):
- Import: key allow-list, value cleaning (ids, data URLs, size/depth caps, prototype keys); PIN config + terms record can no longer be imported. Backups no longer contain PIN hashes.
- Rendering: record ids, links and data URLs validated before they reach an HTML attribute (ui.js, dashboard.js). Only https links; only PDF/PNG/JPEG/GIF/WebP data URLs.
- Content-Security-Policy meta + no-referrer on index.html.
- Lock: PBKDF2-SHA256 600k (was one SHA-256), old PINs upgraded on next unlock; back-off after 5 wrong tries; re-lock after 5 min in background; text says plainly data is not encrypted; dead cpops_security_* hashes deleted.
- Encrypted share: passphrase min 12 chars (was 4), PBKDF2 600k (v2 files; v1 files still open), imported payload cleaned.
- Storage: failed writes are loud (no more silent loss); persistent-storage requested; 1.5 MB upload cap; backup-status panel on Dashboard.
- Terms v1.2: live "[£ - cap to be set]" removed (see Not fixed), business-use, licence/IP, third-party links, privacy, changes; SHA-256 of the accepted text stored with the acceptance. Everyone re-accepts.
- privacy.html added; footer now shows company name + number + Privacy link + contact.
- UK Laws: force card rewritten (s.76 CJIA 2008, Beckford), Art. 9 added to data protection, weapons card added, Martyn's Law card brought up to date, source link + edit date on every card.
- Service worker: cp-ops-v6; only deletes its own caches (it used to delete every other cache on the origin).
Beta: same import/URL/id hardening, separate storage prefix, terms screen, CSP, UK Laws content, footer entity name fixed ("RDanzen" -> "RD Anzen").
Separate repo (Safer-route): `saferoute-repo-service-worker.diff` - same cache-deletion bug in its service worker.

## Tests (jsdom, patched tree applied to a fresh clone)
tests/ folder. `cd tests && npm i jsdom && ROOT=/path/to/patched-repo ORIG=/path/to/original-repo node t3_root.js` (also t1, t2, t4). 81 root + 16 beta checks pass; boot + all 14/12 sections render with 0 errors.
Exploit reproduction (t2): the same hostile backup on the ORIGINAL code injected onfocus handlers into the Team page, a javascript: href into Event Security, overwrote the PIN config and forged the terms acceptance. On the patched code: none of that.
Real Chrome, live prod + beta pages with the new CSP applied: all sections rendered, 0 violations from the app; a deliberate inline handler was blocked (proving enforcement).

## Not fixed
See the chat message.
