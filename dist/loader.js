(() => {
  const dialog = document.getElementById('arrival-loader');
  const skip = document.getElementById('skip-arrival');
  const replay = document.getElementById('replay-arrival');
  const phases = [...document.querySelectorAll('[data-arrival-phase]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero-image');
  const frame = document.querySelector('.hero-image-wrap');
  const portal = dialog.querySelector('.arrival-photo');
  const scene = dialog.querySelector('.arrival-scene');
  let timers = [], closing = false, ready = false, waiting = false;
  let photoCue = false, handoff = false, returnFocus = null;
  const later = (fn, delay) => timers.push(setTimeout(fn, delay));
  function phase(index) {
    phases.forEach((item, i) => {
      item.classList.toggle('is-current', i === index);
      item.classList.toggle('is-complete', i < index);
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  function revealPhoto() {
    if (ready && photoCue && dialog.open && !closing) dialog.classList.add('has-photo');
  }
  function release() {
    timers.forEach(clearTimeout); timers = [];
    clearTimeout(window.atelierArrivalFailsafe);
    document.documentElement.classList.remove('arrival-pending');
    window.atelierArrivalPending = false;
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-running', 'is-departing', 'has-photo', 'is-handoff');
    portal.removeAttribute('style');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    closing = false; waiting = false; photoCue = false;
  }
  function finish(immediate = false) {
    if (!dialog.open) return;
    if (immediate || motion.matches) { release(); return; }
    if (closing) return;
    closing = true;
    if (handoff && ready && dialog.classList.contains('has-photo')) {
      // Same source and crop as the hero: the photograph travels into its actual page position.
      const rect = frame.getBoundingClientRect();
      const radius = getComputedStyle(hero).borderRadius;
      document.documentElement.classList.add('arrival-revealed');
      dialog.classList.add('is-handoff');
      Object.assign(portal.style, {
        left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: radius
      });
    }
    dialog.classList.add('is-departing');
    document.documentElement.classList.remove('arrival-pending');
    timers.forEach(clearTimeout); timers = [];
    later(release, 850);
  }
  function imageReady() {
    ready = !!(hero && hero.naturalWidth);
    revealPhoto();
    if (waiting && dialog.open) finish();
  }
  function open(isReplay = false) {
    if (dialog.open || typeof dialog.showModal !== 'function') {
      document.documentElement.classList.remove('arrival-pending'); return;
    }
    closing = false; waiting = false; photoCue = false; handoff = !isReplay;
    returnFocus = isReplay ? replay : document.querySelector('.brand');
    phase(0);
    try { dialog.showModal(); } catch (_) { release(); return; }
    try { sessionStorage.setItem('pakeezah-arrival-v3', 'seen'); } catch (_) {}
    const rect = scene.getBoundingClientRect();
    const height = Math.min(rect.height * .8, 350);
    const width = height * 811 / 1062;
    Object.assign(portal.style, {
      left: `${rect.left + (rect.width - width) / 2}px`,
      top: `${rect.top + (rect.height - height) / 2}px`,
      width: `${width}px`, height: `${height}px`, borderRadius: '180px 180px 0 0'
    });
    dialog.classList.add('is-running');
    skip.focus({ preventScroll: true });
    if (motion.matches) { phase(2); later(() => finish(true), 200); return; }
    later(() => phase(1), 1100);
    later(() => phase(2), 2500);
    later(() => { photoCue = true; revealPhoto(); }, 4050);
    later(() => { if (ready || isReplay) finish(); else waiting = true; }, 4700);
    later(() => finish(), 4900); // The full sequence remains bounded even if the image fails.
  }
  skip.addEventListener('click', () => finish(true));
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(true); });
  replay.addEventListener('click', () => open(true));
  motion.addEventListener('change', () => { if (motion.matches) finish(true); });
  window.addEventListener('pagehide', () => { if (dialog.open) release(); });
  if (hero) {
    if (typeof hero.decode === 'function') hero.decode().then(imageReady, imageReady);
    else if (hero.complete) imageReady();
    else {
      hero.addEventListener('load', imageReady, { once: true });
      hero.addEventListener('error', imageReady, { once: true });
    }
  }
  if (window.atelierArrivalPending) open();
})();
