// ID verification flow: details → scanning ID → face match → verified.
// Demo only: nothing is uploaded; the photo never leaves the device.
import { openSheet } from './sheet.js';
import { icon } from '../icons.js';
import { field, setFieldError, setLoading } from './ui.js';
import { profile } from '../services/profile.js';
import { toast } from './toast.js';
import { confetti } from './fx.js';
import { compressImage, countUp, esc, sleep, vibrate } from '../util.js';
import { navigate } from '../router.js';

const ID_TYPES = ['National Identification Number (NIN)', 'Voter’s Card', 'International Passport'];

export function openVerification(onDone) {
  let idPhoto = '';
  const sheet = openSheet({
    title: 'Verify your identity',
    html: `<p class="t-small t-soft" style="margin-bottom:16px">Verified traders get more swaps. Your legal name is locked once verified.</p>
      <form data-vform class="stack" style="--gap:14px" novalidate>
        ${field({ id: 'vName', label: 'Legal name (as on ID)', autocomplete: 'name', placeholder: 'e.g. Chioma Adebayo' })}
        <div class="field"><label for="vType">ID type</label><select class="select" id="vType">${ID_TYPES.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><span class="label">Photo of your ID</span>
          <label class="drop" data-vdrop style="min-height:120px;cursor:pointer"><div class="state" style="padding:12px"><div class="step-ic">${icon('camera', 22)}</div><p>Tap to take or choose a photo</p></div>
            <input type="file" accept="image/*" capture="environment" hidden data-vfile></label>
          <p class="field-error" id="vPhoto-err" role="alert"></p></div>
        <p class="t-caption t-muted row" style="gap:6px;align-items:flex-start">${icon('lock', 14)} Demo mode: your photo stays on this device and nothing is uploaded.</p>
        <button class="btn btn-primary btn-block" type="submit">Start verification</button>
      </form>`,
  });

  sheet.el.addEventListener('change', async e => {
    if (!e.target.matches('[data-vfile]')) return;
    const f = e.target.files[0]; if (!f) return;
    try {
      idPhoto = await compressImage(f, 700);
      sheet.$('[data-vdrop]').innerHTML = `<img src="${idPhoto}" alt="ID preview"><input type="file" accept="image/*" capture="environment" hidden data-vfile>`;
      sheet.$('#vPhoto-err').textContent = '';
    } catch (err) { toast(err.message, 'error'); }
  });

  sheet.el.addEventListener('submit', async e => {
    e.preventDefault();
    const name = sheet.$('#vName').value.trim(), type = sheet.$('#vType').value;
    let ok = true;
    if (name.length < 3) { ok = false; setFieldError(sheet.el, 'vName', 'Enter your full legal name.'); }
    if (!idPhoto) { ok = false; sheet.$('#vPhoto-err').textContent = 'Add a photo of your ID.'; }
    if (!ok) { vibrate([10, 40, 10]); return; }

    // Step 2: scan the ID
    sheet.setContent(`<div class="center stack" style="--gap:16px;padding:8px 0 12px">
      <div class="scan-box" style="--scan-h:170px;height:170px"><img src="${idPhoto}" alt=""><div class="scan-line"></div></div>
      <div><b>Reading your ID…</b><p class="t-small t-muted">Checking name, number and security features</p></div></div>`, 'Verifying');
    await sleep(2300);

    // Step 3: face match ring
    sheet.setContent(`<div class="center stack" style="--gap:16px;padding:8px 0 12px">
      <div class="match"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" r="52" data-ring/></svg>
        <span class="step-ic" style="width:70px;height:70px;border-radius:50%">${icon('face', 34)}</span></div>
      <div><b>Matching your face</b><p class="t-small t-muted">Match score: <b data-score style="color:var(--brand-ink)">0</b>%</p></div></div>`);
    requestAnimationFrame(() => requestAnimationFrame(() => { sheet.$('[data-ring]').style.strokeDashoffset = 327 * 0.02; }));
    countUp(sheet.$('[data-score]'), 98, { duration: 1800 });
    await sleep(2100);

    try {
      await profile.verifyIdentity({ legalName: name, idType: type });
      sheet.setContent(`<div class="center stack" style="--gap:12px;padding:8px 0 4px">
        <div class="success-ic"><svg class="ic" width="44" height="44" viewBox="0 0 24 24"><path class="check-draw" d="M20 6 9 17l-5-5" style="stroke-width:2.6"/></svg></div>
        <h3 class="t-title">You’re verified</h3>
        <p class="t-small t-soft">${esc(name)} is now locked to your profile.</p>
        <button class="btn btn-primary btn-block" data-sheet-close style="margin-top:8px">Done</button></div>`, 'Verified');
      confetti({ x: 50, y: 50 });
      onDone?.();
    } catch (err) { sheet.close(); toast(err.message, 'error'); }
  });
}
