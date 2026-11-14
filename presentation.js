/* Page presentation shared by the browser, standalone download and desktop app. */
'use strict';
(() => {
  // The CSS also hides the splash on its own, even if later application code fails.
  const splash = document.getElementById('startupSplash');
  const dismiss = () => splash?.remove();
  splash?.addEventListener('animationend', event => {
    if (event.target === splash) dismiss();
  });
  setTimeout(dismiss, 1400);
  window.addEventListener('pagehide', dismiss, { once: true });

  const home = document.getElementById('home');
  const room = home.querySelector('.home-room');
  const layout = home.querySelector('.home-layout');
  const actions = home.querySelector('.home-actions');
  const hint = home.querySelector('.home-walk-hint');
  const number = value => parseFloat(value) || 0;
  const outerHeight = element => {
    if (!element.getClientRects().length) return 0;
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height + number(style.marginTop) + number(style.marginBottom);
  };
  let pending = false;
  function fitHome() {
    pending = false;
    if (home.hidden) return;
    const style = getComputedStyle(room);
    const chrome = number(style.paddingTop) + number(style.paddingBottom)
      + number(style.borderTopWidth) + number(style.borderBottomWidth);
    // Use document coordinates so scrolling cannot cause the room to grow or jump.
    const top = layout.getBoundingClientRect().top + window.scrollY;
    const viewport = window.visualViewport?.height || window.innerHeight;
    const height = Math.max(96, Math.floor(viewport - top - chrome - outerHeight(actions) - outerHeight(hint) - 20));
    const value = height + 'px';
    if (home.style.getPropertyValue('--home-scene-height') !== value) {
      home.style.setProperty('--home-scene-height', value);
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(fitHome);
  }
  const sizes = new ResizeObserver(schedule);
  for (const element of [document.querySelector('#gameShell > .header'), home.querySelector('.page-heading'), actions, hint]) {
    sizes.observe(element);
  }
  new MutationObserver(schedule).observe(home, { attributes: true, attributeFilter: ['hidden', 'class'] });
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
