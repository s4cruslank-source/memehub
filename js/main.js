const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $  = (sel, root = document) => root.querySelector(sel);

(() => {
  const STORAGE_KEY = 'age_gate_consent_v1';
  const CONSENT_DAYS = 0;

  const overlay = document.getElementById('ageGate');
  const btnYes  = document.getElementById('ageYes');
  const btnNo   = document.getElementById('ageNo');

  const now  = () => Date.now();
  const days = (ms) => ms / 86400000;

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number') return null;
      return data;
    } catch (e) { return null; }
  }
  const hasValidConsent = () => {
    const data = readConsent();
    if (!data) return false;
    return days(now() - data.ts) < CONSENT_DAYS;
  };

  let focusHandler = null;
  function trapFocus(activate) {
    if (!overlay) return;
    if (activate) {
      focusHandler = (e) => {
        if (!overlay.hasAttribute('open')) return;
        const focusable = overlay.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusable).filter(el => !el.disabled);
        if (!list.length) return;
        const first = list[0];
        const last  = list[list.length - 1];
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
          else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
        if (e.key === 'Escape') { e.preventDefault(); }
      };
      document.addEventListener('keydown', focusHandler);
    } else if (focusHandler) {
      document.removeEventListener('keydown', focusHandler);
      focusHandler = null;
    }
  }

  function openGate() {
    if (!overlay) return;
    overlay.setAttribute('open', '');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => { btnYes?.focus(); }, 0);
    trapFocus(true);
  }
  function closeGate() {
    if (!overlay) return;
    overlay.removeAttribute('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    trapFocus(false);
  }
  function saveConsent() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: now() })); } catch (e) {}
  }

  function swapButtons() {
    if (!btnYes || !btnNo) return;
    const row = btnYes.parentElement;
    if (!row) return;
    if (btnYes.nextElementSibling === btnNo) {
      row.insertBefore(btnNo, btnYes);
    } else {
      row.insertBefore(btnYes, btnNo);
    }
    btnNo.focus();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!overlay) return;
    if (!hasValidConsent()) openGate();
    btnYes?.addEventListener('click', () => { saveConsent(); closeGate(); });
    btnNo?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      swapButtons();
    });
  });

  window.ageGate = {
    reset(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} openGate(); },
    open: openGate, close: closeGate
  };
})();

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    $$('.chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    const form = $('.search');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = form.querySelector('input')?.value.trim();
      if (q) console.log('Search:', q);
    });

    $$('.page').forEach(p => {
      p.addEventListener('click', () => {
        $$('.page').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      });
    });
  });
})();

const Drawer = (() => {
  let drawer, backdrop, burger, closeBtn;

  function openDrawer() {
    if (!drawer || !backdrop || !burger) return;
    drawer.setAttribute('open', '');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    burger.classList.add('is-open');
    const firstLink = drawer.querySelector('a,button');
    firstLink && firstLink.focus();
  }
  function closeDrawer() {
    if (!drawer || !backdrop || !burger) return;
    drawer.removeAttribute('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    burger.classList.remove('is-open');
    burger.focus();
  }

  function init() {
    drawer   = document.getElementById('drawer');
    backdrop = document.getElementById('drawerBackdrop');
    burger   = document.querySelector('.burger');
    closeBtn = document.querySelector('.drawer-close');

    if (!drawer || !backdrop || !burger) return;

    burger.addEventListener('click', () => {
      const isOpen = drawer.hasAttribute('open');
      isOpen ? closeDrawer() : openDrawer();
    });
    backdrop.addEventListener('click', closeDrawer);
    closeBtn?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.hasAttribute('open')) {
        e.preventDefault();
        closeDrawer();
      }
      if (!drawer.hasAttribute('open') || e.key !== 'Tab') return;
      const focusables = drawer.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      const list = Array.from(focusables).filter(el => !el.disabled);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return { open: openDrawer, close: closeDrawer };
})();

(() => {
  const NAV_SELECTOR = '.main-nav a';
  const DEFAULT_VIEW = 'home';

  function showView(view) {
    $$('.view').forEach(s => s.hidden = true);
    const el = document.getElementById('view-' + view) || document.getElementById('view-' + DEFAULT_VIEW);
    if (el) el.hidden = false;
    $$(NAV_SELECTOR).forEach(a => {
      const v = (a.getAttribute('href') || '').replace('#', '');
      const active = v === view;
      a.classList.toggle('active', active);
      a.setAttribute('aria-selected', active ? 'true' : 'false');
      a.tabIndex = active ? 0 : -1;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$(NAV_SELECTOR).forEach(a => {
      a.addEventListener('click', (e) => {
        const hash = a.getAttribute('href') || '';
        if (hash.startsWith('#')) {
          e.preventDefault();
          const view = hash.slice(1);
          if (location.hash !== hash) history.pushState({ view }, '', hash);
          showView(view);
        }
      });
    });

    window.addEventListener('popstate', () => {
      const view = (history.state && history.state.view) || location.hash.slice(1) || DEFAULT_VIEW;
      showView(view);
    });
    window.addEventListener('hashchange', () => {
      showView(location.hash.slice(1) || DEFAULT_VIEW);
    });

    showView(location.hash.slice(1) || DEFAULT_VIEW);
  });
})();

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const pager = $('#view-home .pager');
    if (!pager) return;

    const prevBtn = pager.querySelector('.btn.ghost');
    const nextBtn = pager.querySelector('.btn:not(.ghost)');
    const pages   = pager.querySelectorAll('.pages .page');

    function spawnFX(el){
      const r = el.getBoundingClientRect();
      const fx = el.cloneNode(true);
      fx.classList.add('pager-fx');
      fx.style.position = 'fixed';
      fx.style.left   = `${r.left}px`;
      fx.style.top    = `${r.top}px`;
      fx.style.width  = `${r.width}px`;
      fx.style.height = `${r.height}px`;
      fx.style.zIndex = '99999';
      document.body.appendChild(fx);
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return fx;
    }

    function twoStage(original, side){
      if (original.dataset.stage === '2') return;
      if (!original._fx) original._fx = spawnFX(original);
      const fx = original._fx;

      if (!original.dataset.stage || original.dataset.stage === '0'){
        original.dataset.stage = '1';
        fx.classList.remove('fall-left','fall-right','hinge-left-cw','hinge-right-ccw');
        fx.classList.add(side === 'left' ? 'hinge-left-cw' : 'hinge-right-ccw');

        const handleSecond = (e) => {
          e.stopPropagation();
          if (original.dataset.stage !== '1') return;
          original.dataset.stage = '2';
          fx.classList.remove('hinge-left-cw','hinge-right-ccw');
          fx.classList.add(side === 'left' ? 'fall-left' : 'fall-right');
          fx.addEventListener('animationend', () => {
            fx.remove();
            original._fx = null;
          }, { once:true });
        };
        fx.addEventListener('click', handleSecond, { once:true });

      } else if (original.dataset.stage === '1'){
        original.dataset.stage = '2';
        fx.classList.remove('hinge-left-cw','hinge-right-ccw');
        fx.classList.add(side === 'left' ? 'fall-left' : 'fall-right');
        fx.addEventListener('animationend', () => {
          fx.remove();
          original._fx = null;
        }, { once:true });
      }
    }

    prevBtn?.addEventListener('click', (e) => { e.preventDefault(); twoStage(prevBtn, 'left'); });
    nextBtn?.addEventListener('click', (e) => { e.preventDefault(); twoStage(nextBtn, 'right'); });

    pages.forEach(pg => {
      pg.addEventListener('click', (e) => {
        e.preventDefault();
        if (pg.dataset.fell) return;
        pg.dataset.fell = '1';
        const fx = spawnFX(pg);
        fx.classList.add('drop-down');
        fx.addEventListener('animationend', () => fx.remove(), { once:true });
      });
    });

    document.documentElement.style.setProperty('--pager-fall', '1.8s');
    document.documentElement.style.setProperty('--pager-number-fall', '1.4s');
  });
})();

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    $$('.copy-ca').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ca = btn.dataset.ca || 'coming soon';
        try{
          await navigator.clipboard.writeText(ca);
          const old = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(()=> btn.textContent = old, 1200);
        }catch(e){ alert(ca); }
      });
    });

    const copyBtn = document.getElementById('tokCopy');
    const caEl    = document.getElementById('tokCA');
    copyBtn?.addEventListener('click', async () => {
      const text = caEl?.textContent.trim() || '';
      try{
        await navigator.clipboard.writeText(text);
        const old = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy CA', 1200);
      }catch(e){ alert(text); }
    });
  });
})();

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const CA = window.MEMEHUB_CA || 'coming soon';
    $$('.ca-text').forEach(el => { el.textContent = CA; });
    $$('.copy-ca').forEach(btn => { btn.dataset.ca = CA; });
  });
})();

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const fs      = document.getElementById('fsPhoto');
    const fsImg   = document.getElementById('fsPhotoImg');
    const fsClose = document.getElementById('fsPhotoClose');
    const drawer   = document.getElementById('drawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const hasFs = fs && fsImg && fsClose;
    if (!drawer) return;

    function openFsPhoto(src, alt = '') {
      if (!hasFs || !src) return;
      fsImg.src = src;
      fsImg.alt = alt || '';
      fs.setAttribute('open', '');
      fs.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      fsClose.focus();
    }
    function closeFsPhoto() {
      if (!hasFs) return;
      fs.removeAttribute('open');
      fs.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      fsImg.removeAttribute('src');
    }

    if (hasFs) {
      fs.addEventListener('click', (e) => { if (e.target === fs) closeFsPhoto(); });
      fsClose.addEventListener('click', closeFsPhoto);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fs.hasAttribute('open')) {
          e.preventDefault(); closeFsPhoto();
        }
      });
    }

    drawer.addEventListener('click', (e) => {
      const a = e.target.closest('.drawer-list a');
      if (!a) return;
      const img = a.getAttribute('data-img');
      if (!img) return;
      e.preventDefault();
      try { Drawer.close?.(); } catch(e){}
      drawer.removeAttribute('open');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      openFsPhoto(img, a.textContent.trim());
    });
  });
})();

(function(){
    const root = document.documentElement;
    const tb = document.querySelector('.topbar');

    function applyTBH(){
      const h = tb ? Math.round(tb.getBoundingClientRect().height) : 64;
      root.style.setProperty('--tb-h', h + 'px');
    }

    window.addEventListener('DOMContentLoaded', applyTBH);
    window.addEventListener('load', applyTBH);
    window.addEventListener('resize', applyTBH);
    window.addEventListener('orientationchange', applyTBH);

    if (window.ResizeObserver && tb){
      new ResizeObserver(applyTBH).observe(tb);
    }
})();

(() => {
  const isNarrow = () => window.matchMedia('(max-width: 540px)').matches;
  document.addEventListener('DOMContentLoaded', () => {
    if (isNarrow()) {
      const pager = document.querySelector('#view-home .pager');
      if (!pager) return;
      pager.querySelectorAll('.btn, .page').forEach(el => {
        el.classList.remove('hinge-left-cw','hinge-right-ccw','fall-left','fall-right','drop-down');
      });
      return;
    }
  });
})();

(() => {
  const MODAL_ID = 'siteModal';
  const CONTENT = {
    terms: { title: 'Terms of Use', html: `<p>Our terms are simple: hold your tokens as tightly as you hold on to your browser history secrets.</p>` },
    privacy: { title: 'Privacy Policy', html: `<p>We don’t collect your data… except for the fact that you love 18+ memes.</p>` },
    parents: { title: 'Parent Controls', html: `<p>If your parents find out about MEMHUB, just say it’s an educational project… in economics.</p>` },
    support: { title: 'Support', html: `<p>We fix bugs, but we don’t cure addiction to 18+ jokes.</p>` }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  let overlay, card, titleEl, bodyEl, btnClose, focusTrapHandler, lastFocused;

  function ensureModal(){
    overlay = overlay || document.getElementById(MODAL_ID);
    if (!overlay) return false;
    card     = $('.modal-card', overlay);
    titleEl  = $('.modal-title', overlay);
    bodyEl   = $('.modal-body', overlay);
    btnClose = $('.modal-close', overlay);
    return !!(overlay && card && titleEl && bodyEl && btnClose);
  }

  function trapFocus(enable){
    if (!overlay) return;
    if (enable){
      focusTrapHandler = (e) => {
        if (!overlay.hasAttribute('open')) return;
        const focusables = overlay.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        const list = Array.from(focusables).filter(el => !el.disabled && el.offsetParent !== null);
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.key === 'Tab'){
          if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
          else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
        }
        if (e.key === 'Escape'){ e.preventDefault(); closeModal(); }
      };
      document.addEventListener('keydown', focusTrapHandler);
    } else if (focusTrapHandler){
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  function openModal(kind){
    if (!ensureModal()) return;
    const data = CONTENT[kind];
    if (!data) return;
    lastFocused = document.activeElement;
    titleEl.textContent = data.title;
    bodyEl.innerHTML = data.html;
    overlay.setAttribute('open','');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
    const okBtn = overlay.querySelector('[data-modal-close]') || btnClose;
    okBtn?.focus();
    trapFocus(true);
  }

  function closeModal(){
    if (!ensureModal()) return;
    overlay.removeAttribute('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    trapFocus(false);
    try{ lastFocused?.focus(); }catch(e){}
  }

  function wire(){
    if (!ensureModal()) return;
    $$('.site-footer .links a[data-modal]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const kind = a.getAttribute('data-modal');
        openModal(kind);
      });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    $('[data-modal-close]', overlay)?.addEventListener('click', closeModal);
    btnClose.addEventListener('click', closeModal);
  }

  document.addEventListener('DOMContentLoaded', wire);
  window.SiteModal = { open: openModal, close: closeModal };
})();

const prev = document.querySelector('.pager .btn.prev');
const next = document.querySelector('.pager .btn.next');

function runPhase(btn, side){
  const hinge = side === 'left' ? 'hinge-left-cw' : 'hinge-right-ccw';
  const fall  = side === 'left' ? 'fall-left'     : 'fall-right';
  if (btn.dataset.phase !== 'hinge') {
    btn.dataset.phase = 'hinge';
    btn.classList.remove(fall, 'animating', 'drop-down', 'hinge-left-cw', 'hinge-right-ccw');
    void btn.offsetWidth;
    btn.classList.add(hinge);
    return;
  }
  btn.dataset.phase = '';
  btn.classList.remove('hinge-left-cw', 'hinge-right-ccw');
  void btn.offsetWidth;
  btn.classList.add('animating', fall);
  btn.addEventListener('animationend', () => {
    btn.classList.remove('animating', fall);
  }, { once: true });
}

prev.addEventListener('click', () => runPhase(prev, 'left'));
next.addEventListener('click', () => runPhase(next, 'right'));
