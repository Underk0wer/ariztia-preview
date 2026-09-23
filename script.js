(function () {
  'use strict';

  /* ---------- Menú móvil ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');

  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }

  menuBtn.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- Animaciones de scroll: entrada y salida ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animEls = document.querySelectorAll('.anim');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) {
          el.classList.remove('is-out-top');
          el.classList.add('is-in');
        } else {
          el.classList.remove('is-in');
          // si salió por arriba, animar hacia arriba; si salió por abajo, volver al estado inicial
          el.classList.toggle('is-out-top', entry.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0, rootMargin: '-8% 0px -8% 0px' });
    animEls.forEach(function (el) { io.observe(el); });
  } else {
    animEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Video de fondo del hero (desktop): avanza con el scroll ---------- */
  var heroVideo = document.getElementById('heroVideo');
  var desktopMQ = window.matchMedia('(min-width: 900px)');
  var videoReady = false;
  var heroVisible = true;
  var heroVariant = '';

  // Video de fondo en loop: una fuente para desktop y otra para mobile
  function loadHeroVideo() {
    if (!heroVideo) return;
    var variant = desktopMQ.matches ? 'desktop' : 'mobile';
    if (variant === heroVariant) return;
    heroVariant = variant;
    videoReady = false;
    heroVideo.classList.remove('is-ready');
    heroVideo.poster = heroVideo.getAttribute('data-poster-' + variant);
    heroVideo.src = heroVideo.getAttribute('data-src-' + variant);
    heroVideo.load();
    playHeroVideo();
  }

  function playHeroVideo() {
    if (!heroVideo || reduceMotion || !heroVisible) return;
    var p = heroVideo.play();
    if (p && p.catch) p.catch(function () {});   // autoplay bloqueado: queda el poster
  }

  if (heroVideo) {
    heroVideo.addEventListener('loadeddata', function () {
      videoReady = true;
      heroVideo.classList.add('is-ready');
    });
    loadHeroVideo();
    desktopMQ.addEventListener('change', loadHeroVideo);
    if (reduceMotion) heroVideo.removeAttribute('autoplay');
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) heroVideo.pause(); else playHeroVideo();
    });
  }

  /* ---------- Logo del header -> logo grande de la estancia 3 (desktop) ---------- */
  var headerLogo = document.getElementById('headerLogo');
  var campoLogo = document.getElementById('campoLogo');
  var logoGhost = document.createElement('div');
  logoGhost.className = 'logo-ghost';
  logoGhost.setAttribute('aria-hidden', 'true');
  logoGhost.innerHTML = '<img src="img/logo-ariztia.svg" alt="">';
  document.body.appendChild(logoGhost);
  var morphState = '';

  function easeInOut(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // El logo fantasma va por encima de todo (para poder salir del header), así que la zona que
  // coincide con la tarjeta del formulario se recorta: parece pasar por detrás y emerger bajo ella.
  var formCard = document.querySelector('.form-card');
  function clipBehindCard(x, y, w, h) {
    if (!formCard) return 'none';
    var C = formCard.getBoundingClientRect();
    if (x + w <= C.left || x >= C.right || y + h <= C.top || y >= C.bottom) return 'none';
    // radio real de las esquinas de la tarjeta, para que el recorte siga su forma redondeada
    var r = parseFloat(getComputedStyle(formCard).borderTopLeftRadius) || 0;
    r = Math.min(r, C.width / 2, C.height / 2);
    var f = function (n) { return n.toFixed(1); };
    var l = C.left - x, t = C.top - y, rt = C.right - x, bt = C.bottom - y;   // tarjeta en coords del logo
    var card = 'M' + f(l + r) + ' ' + f(t) + ' H' + f(rt - r) +
      ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(rt) + ' ' + f(t + r) + ' V' + f(bt - r) +
      ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(rt - r) + ' ' + f(bt) + ' H' + f(l + r) +
      ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(l) + ' ' + f(bt - r) + ' V' + f(t + r) +
      ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(l + r) + ' ' + f(t) + ' Z';
    var outer = 'M0 0 H' + f(w) + ' V' + f(h) + ' H0 Z';
    return 'path(evenodd, "' + outer + ' ' + card + '")';
  }

  function updateLogoMorph() {
    if (!campoLogo || !headerLogo) return;          // páginas sin estancia 3 (ej. gracias.html)
    if (!desktopMQ.matches || reduceMotion) {
      if (morphState !== 'off') {
        logoGhost.style.display = 'none';
        headerLogo.classList.remove('is-morphing');
        campoLogo.classList.remove('is-pending');
        morphState = 'off';
      }
      return;
    }
    var vh = window.innerHeight;
    var B = campoLogo.getBoundingClientRect();        // destino: logo grande (se mueve con el scroll)
    var A = headerLogo.getBoundingClientRect();       // origen: logo del header
    var T = vh * 0.42;                                 // altura a la que el logo grande "llega"
    var p = (vh - B.top) / (vh - T);
    p = Math.max(0, Math.min(1, p));
    var exitedAbove = B.bottom < (header.offsetHeight || 60);

    if (p <= 0 || exitedAbove) {
      // antes de la estancia 3 (o ya pasada): logo en el header, logo grande oculto/visible según corresponda
      logoGhost.style.display = 'none';
      headerLogo.classList.remove('is-morphing');
      campoLogo.classList.toggle('is-pending', !exitedAbove);
      morphState = 'header';
      return;
    }
    if (p >= 1) {
      // llegó: el logo grande real toma el relevo
      logoGhost.style.display = 'none';
      headerLogo.classList.add('is-morphing');
      campoLogo.classList.remove('is-pending');
      morphState = 'campo';
      return;
    }
    // en tránsito: interpolar posición y tamaño entre A y B
    var e = easeInOut(p);
    var x = A.left + (B.left - A.left) * e;
    var y = A.top + (B.top - A.top) * e;
    var w = A.width + (B.width - A.width) * e;
    logoGhost.style.display = 'block';
    logoGhost.style.width = w.toFixed(1) + 'px';
    logoGhost.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    logoGhost.style.clipPath = clipBehindCard(x, y, w, w * (B.height / B.width));
    headerLogo.classList.add('is-morphing');
    campoLogo.classList.add('is-pending');
    morphState = 'moving';
  }

  /* ---------- Loop del comercial (estancia 3): carga y reproduce solo cuando está cerca ---------- */
  var campoLoop = document.getElementById('campoLoop');
  if (campoLoop) {
    var loopLoaded = false;
    function playLoop() {
      if (!loopLoaded) {
        campoLoop.src = campoLoop.getAttribute('data-src');
        campoLoop.load();
        loopLoaded = true;
      }
      var pr = campoLoop.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) playLoop(); else if (loopLoaded) campoLoop.pause();
        });
      }, { rootMargin: '300px 0px' }).observe(campoLoop);
    } else {
      playLoop();
    }
  }

  /* ---------- Parallax del hero, header y barra de progreso ---------- */
  var hero = document.querySelector('.hero');
  var heroInner = document.querySelector('.hero__inner');
  var header = document.querySelector('.header');
  var progress = document.getElementById('scrollProgress');
  var campoSection = document.querySelector('.campo');
  var lastY = window.scrollY || 0;
  var headerHidden = false;
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      var heroH = (hero && hero.offsetHeight) || 1;
      // 0 = home completo a la vista, 1 = la sección 2 ya cubrió todo el home
      var p = Math.min(y / heroH, 1);

      if (!reduceMotion && hero && heroInner) {
        if (videoReady) {
          hero.style.backgroundPositionY = '';
        } else {
          hero.style.backgroundPositionY = 'calc(50% + ' + (y * 0.35).toFixed(1) + 'px)';
        }
        heroInner.style.setProperty('--hero-shift', (y * 0.18).toFixed(1) + 'px');
        heroInner.style.setProperty('--hero-fade', (1 - p * 1.1).toFixed(3));
      }

      // pausar el loop cuando el home ya no se ve (ahorra batería/CPU)
      if (heroVideo) {
        var visible = p < 1;
        if (visible !== heroVisible) {
          heroVisible = visible;
          if (visible) playHeroVideo(); else heroVideo.pause();
        }
      }

      updateLogoMorph();

      header.classList.toggle('is-scrolled', y > 10);

      // móvil: en la estancia 3 el header (logo + menú) se esconde al bajar y reaparece al subir
      if (campoSection && !desktopMQ.matches && !nav.classList.contains('is-open')) {
        var inCampo = campoSection.getBoundingClientRect().top <= (header.offsetHeight || 0);
        if (!inCampo) headerHidden = false;
        else if (y > lastY + 2) headerHidden = true;
        else if (y < lastY - 2) headerHidden = false;
      } else {
        headerHidden = false;
      }
      header.classList.toggle('is-hidden', headerHidden);
      lastY = y;

      var docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0).toFixed(4) + ')';

      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Modales ---------- */
  var videoModal = document.getElementById('videoModal');
  var legalModal = document.getElementById('legalModal');
  var videoFrame = document.getElementById('videoFrame');
  var legalContent = document.getElementById('legalContent');
  var lastFocus = null;

  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (modal === videoModal) videoFrame.src = 'about:blank';   // detiene el video de YouTube
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('no-scroll');
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('.js-open-video').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeMenu();
      openModal(videoModal);
      videoFrame.src = videoFrame.getAttribute('data-src');
    });
  });

  document.querySelectorAll('.js-close-modal').forEach(function (el) {
    el.addEventListener('click', function () {
      closeModal(el.closest('.modal'));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    if (nav.classList.contains('is-open')) closeMenu();
  });

  /* ---------- Documentos legales (contenido placeholder) ---------- */
  var docs = {
    bases: {
      title: 'Bases legales de la promoción',
      body: '<h3>1. Organizador</h3><p>Ariztía organiza la promoción "Al recetario del campo chileno le falta tu sabor", válida en todo el territorio nacional.</p>' +
            '<h3>2. Participación</h3><p>Podrán participar personas naturales mayores de 18 años, residentes en Chile, que completen el formulario del sitio con una receta original y una fotografía.</p>' +
            '<h3>3. Premios</h3><p>Se sortearán 3 Ollas + productos Ariztía entre las recetas válidas recibidas durante la vigencia de la promoción.</p>' +
            '<h3>4. Vigencia</h3><p>Texto pendiente de definición por el equipo legal.</p>'
    },
    terminos: {
      title: 'Términos y condiciones del sitio web',
      body: '<p>El uso de este sitio implica la aceptación de los presentes términos y condiciones. Contenido pendiente de definición por el equipo legal.</p>'
    }
  };

  document.querySelectorAll('.js-legal').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var doc = docs[a.getAttribute('data-doc')];
      if (!doc) return;
      legalContent.innerHTML = '<h2>' + doc.title + '</h2>' + doc.body;
      closeMenu();
      openModal(legalModal);
    });
  });

  /* ---------- Upload: mostrar nombre del archivo ---------- */
  var fileInput = document.getElementById('imagen');
  var uploadName = document.getElementById('uploadName');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      uploadName.textContent = fileInput.files.length ? fileInput.files[0].name : '';
    });
  }

  /* ---------- Textareas autoajustables ---------- */
  document.querySelectorAll('.form textarea').forEach(function (ta) {
    ta.addEventListener('input', function () {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  });

  /* ---------- Formulario en 2 pasos: navegación, validación y envío ---------- */
  var form = document.getElementById('recipeForm');
  if (!form) return;                                 // páginas sin formulario (ej. gracias.html)
  var formSuccess = document.getElementById('formSuccess');
  var stepsBar = document.getElementById('steps');
  var stepPanels = form.querySelectorAll('.step');
  var stepItems = stepsBar.querySelectorAll('.steps__item');
  var currentStep = 1;

  function markInvalid(el, invalid) {
    var wrap = el.closest('.field') || el.closest('.check');
    if (wrap) wrap.classList.toggle('is-invalid', invalid);
  }

  function fieldOk(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'file') return !el.required || el.files.length > 0;
    if (el.classList.contains('js-time')) {
      // horas + minutos: válido si el total del grupo es mayor a cero
      var total = 0;
      form.querySelectorAll('.js-time[data-group="' + el.getAttribute('data-group') + '"]').forEach(function (s) {
        total += Number(s.value) || 0;
      });
      return total > 0;
    }
    var v = el.value.trim();
    if (!v) return false;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (el.type === 'tel') return v.replace(/\D/g, '').length >= 8;
    if (el.type === 'number') return Number(v) >= (Number(el.min) || 0);
    return true;
  }

  // valida los campos obligatorios de un paso; devuelve el primero inválido o null
  function validateStep(n) {
    var panel = form.querySelector('.step[data-step="' + n + '"]');
    var first = null;
    panel.querySelectorAll('[required]').forEach(function (el) {
      var ok = fieldOk(el);
      markInvalid(el, !ok);
      if (!ok && !first) first = el;
    });
    var err = document.getElementById('formError' + n);
    err.hidden = !first;
    if (first) {
      var wrap = first.closest('.field') || first.closest('.check');
      (wrap || first).scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { first.focus({ preventScroll: true }); } catch (e) {}
    }
    return first;
  }

  function goToStep(n) {
    currentStep = n;
    stepPanels.forEach(function (p) {
      var active = p.getAttribute('data-step') === String(n);
      p.hidden = !active;
      p.classList.toggle('is-active', active);
    });
    stepItems.forEach(function (it) {
      var k = Number(it.getAttribute('data-step'));
      it.classList.toggle('is-active', k === n);
      it.classList.toggle('is-done', k < n);
      var btn = it.querySelector('.steps__btn');
      if (k === n) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
    stepsBar.classList.toggle('is-step-2', n === 2);
    // dejar el inicio del formulario a la vista
    var top = form.getBoundingClientRect().top + window.scrollY - 110;
    if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  form.querySelectorAll('[required]').forEach(function (el) {
    el.addEventListener('input', function () { markInvalid(el, false); });
    el.addEventListener('change', function () { markInvalid(el, false); });
  });

  form.querySelector('.js-next').addEventListener('click', function () {
    if (!validateStep(1)) goToStep(2);
  });
  form.querySelector('.js-prev').addEventListener('click', function () {
    goToStep(1);
  });

  // los botones del indicador también navegan (al paso 2 solo si el 1 está completo)
  stepItems.forEach(function (it) {
    it.querySelector('.steps__btn').addEventListener('click', function () {
      var k = Number(it.getAttribute('data-step'));
      if (k === currentStep) return;
      if (k === 2 && validateStep(1)) return;
      goToStep(k);
    });
  });

  // Enter en el paso 1 avanza en vez de enviar
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && currentStep === 1 && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (!validateStep(1)) goToStep(2);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateStep(1)) { goToStep(1); return; }
    if (validateStep(2)) return;

    // TODO: reemplazar por el envío real al backend.
    // var data = new FormData(form);
    // fetch('/api/recetas', { method: 'POST', body: data })

    // Thank you page
    window.location.href = 'gracias.html';
  });
})();
