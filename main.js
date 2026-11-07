/* Логика интерфейса отделена от будущей проверки учебных заданий. */
(() => {
  'use strict';

  const motionButton = document.querySelector('.motion-toggle');
  const routes = [...document.querySelectorAll('.route')];
  const islands = [...document.querySelectorAll('.island')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userDisabledMotion = false;
  let motionContext;
  let introPlayed = false;

  try { userDisabledMotion = localStorage.getItem('studyquest-motion') === 'off'; } catch { /* Хранилище необязательно для работы страницы. */ }

  function openRoute(id) {
    const selected = document.getElementById(id);
    if (!selected || !selected.matches('.route')) return;
    routes.forEach(route => { route.open = route === selected; });
  }

  islands.forEach(island => {
    island.addEventListener('click', () => openRoute(island.hash.slice(1)));
  });

  function updateActiveNav() {
    const hash = location.hash || '#world';
    const section = hash.endsWith('-topics') ? '#routes' : hash;
    document.querySelectorAll('.side-nav .nav-link').forEach(link => {
      const active = link.hash === section;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  window.addEventListener('hashchange', () => {
    if (location.hash.endsWith('-topics')) openRoute(location.hash.slice(1));
    updateActiveNav();
  });
  if (location.hash.endsWith('-topics')) openRoute(location.hash.slice(1));
  updateActiveNav();

  function syncMotion() {
    const disabled = userDisabledMotion || reduceMotion.matches;
    document.documentElement.classList.toggle('motion-off', disabled);
    motionButton.setAttribute('aria-pressed', String(disabled));
    motionButton.setAttribute('aria-label', disabled ? 'Включить анимацию' : 'Отключить анимацию');
    motionButton.title = reduceMotion.matches ? 'Уменьшенное движение включено в настройках устройства' : (disabled ? 'Включить анимацию' : 'Отключить анимацию');
    if (motionContext) { motionContext.revert(); motionContext = undefined; }
    if (disabled || !window.gsap) return;

    const { gsap, ScrollTrigger } = window;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    motionContext = gsap.matchMedia();
    motionContext.add('(prefers-reduced-motion: no-preference)', () => {
      if (!introPlayed) {
        gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.65 } })
          .from('.page-heading', { y: 10, opacity: 0.65, clearProps: 'all' })
          .from('.island-picture', { y: 15, opacity: 0.6, stagger: 0.09, clearProps: 'all' }, '<0.08')
          .from('.journey-rail', { y: 8, opacity: 0.7, clearProps: 'all' }, '<0.15');
        introPlayed = true;
      }
      const cleanup = [];
      islands.forEach(island => {
        const art = island.querySelector('.island-picture');
        const enter = () => gsap.to(art, { y: -5, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        const leave = () => gsap.to(art, { y: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        island.addEventListener('pointerenter', enter);
        island.addEventListener('pointerleave', leave);
        island.addEventListener('focus', enter);
        island.addEventListener('blur', leave);
        cleanup.push(() => {
          island.removeEventListener('pointerenter', enter);
          island.removeEventListener('pointerleave', leave);
          island.removeEventListener('focus', enter);
          island.removeEventListener('blur', leave);
          gsap.killTweensOf(art);
          gsap.set(art, { clearProps: 'transform' });
        });
      });
      if (ScrollTrigger) {
        gsap.from('.routes>.section-heading', {
          y: 12, opacity: 0.7, duration: 0.55, ease: 'power3.out', clearProps: 'all',
          scrollTrigger: { trigger: '.routes', start: 'top 94%', once: true }
        });
      }
      return () => cleanup.forEach(remove => remove());
    });
  }

  motionButton.addEventListener('click', () => {
    userDisabledMotion = !userDisabledMotion;
    try { localStorage.setItem('studyquest-motion', userDisabledMotion ? 'off' : 'on'); } catch { /* У страницы остаётся переключатель без сохранения настройки. */ }
    syncMotion();
  });
  reduceMotion.addEventListener('change', syncMotion);
  syncMotion();
})();
