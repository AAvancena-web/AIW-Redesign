/* Auckland Integrity Waterproofing
   Shared behaviour: nav, reveals, counters, slider, parallax, forms. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Sticky header state
     --------------------------------------------------------- */
  var header = document.getElementById('siteHeader');

  /* ---------------------------------------------------------
     Mobile drawer
     --------------------------------------------------------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var drawerClose = document.getElementById('drawerClose');

  function openDrawer() {
    drawer.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    if (drawer.classList.contains('is-open')) { closeDrawer(); } else { openDrawer(); }
  });
  drawerClose.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer) { closeDrawer(); }
  });
  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeDrawer);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) { closeDrawer(); }
  });

  /* ---------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------- */
  var revealItems = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        var siblings = Array.prototype.slice.call(
          el.parentNode.querySelectorAll(':scope > [data-reveal]')
        );
        var index = siblings.indexOf(el);
        el.style.transitionDelay = (index > 0 ? Math.min(index, 6) * 90 : 0) + 'ms';
        el.classList.add('is-in');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     Animated counters
     --------------------------------------------------------- */
  var counters = document.querySelectorAll('.counter');

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }

    var duration = 1700;
    var start = null;

    function frame(now) {
      if (start === null) { start = now; }
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------------------------------------------------------
     Testimonial slider
     --------------------------------------------------------- */
  var slides = document.querySelectorAll('#tstmStage .slide');
  var dotsWrap = document.getElementById('tstmDots');
  var current = 0;
  var timer = null;

  if (slides.length && dotsWrap) {
    slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      if (i === 0) { dot.classList.add('is-active'); }
      dot.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });

    var dots = dotsWrap.querySelectorAll('button');

    function goTo(index) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
    }
    function restart() {
      if (timer) { clearInterval(timer); }
      if (!reduceMotion) { timer = setInterval(function () { goTo(current + 1); }, 7000); }
    }
    restart();

    var stage = document.getElementById('tstmStage');
    stage.addEventListener('mouseenter', function () { if (timer) { clearInterval(timer); } });
    stage.addEventListener('mouseleave', restart);
  }

  /* ---------------------------------------------------------
     Parallax backgrounds, header state, floating buttons
     All driven from one throttled scroll handler
     --------------------------------------------------------- */
  var parallaxLayers = document.querySelectorAll('[data-parallax]');
  var toTop = document.getElementById('toTop');
  var callNow = document.getElementById('callNow');
  var progress = document.getElementById('scrollProgress');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;

    /* Reading progress along the bottom of the header */
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
    }

    /* Header shrink */
    if (y > 40) { header.classList.add('is-stuck'); }
    else { header.classList.remove('is-stuck'); }

    /* Floating buttons appear after the hero */
    if (y > 420) {
      toTop.classList.add('is-visible');
      callNow.classList.add('is-visible');
    } else {
      toTop.classList.remove('is-visible');
      callNow.classList.remove('is-visible');
    }

    /* Parallax, only where the layer is on screen */
    if (!reduceMotion) {
      parallaxLayers.forEach(function (layer) {
        var host = layer.parentNode;
        var rect = host.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) { return; }
        var speed = parseFloat(layer.getAttribute('data-parallax')) || 0.12;
        layer.style.transform = 'translate3d(0,' + (-rect.top * speed) + 'px,0)';
      });
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Cursor following glow on the service cards
     --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.s-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll to top
     --------------------------------------------------------- */
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------
     Active nav link tracking
     --------------------------------------------------------- */
  var sections = ['about', 'services', 'work', 'faq', 'contact'];

  /* Only meaningful where the nav points at sections of this page. On the
     inner pages the links are real URLs, and the active item is already set
     in the markup, so the spy must leave it alone. */
  var anchorLinks = document.querySelectorAll('.nav__link[href^="#"]');
  /* The link the markup marks as current, for example Home on the home page.
     It gives way while an in-page section is on screen and comes back after. */
  var defaultActive = document.querySelector('.nav__link.is-active');

  if ('IntersectionObserver' in window && anchorLinks.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var matched = null;
        anchorLinks.forEach(function (link) {
          var on = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', on);
          if (on) { matched = link; }
        });
        if (defaultActive && defaultActive !== matched) {
          defaultActive.classList.toggle('is-active', !matched);
        }
      });
    }, { threshold: 0.35 });

    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { navObserver.observe(el); }
    });
  }

  /* ---------------------------------------------------------
     Gallery lightbox
     Built only when a gallery is on the page. Keyboard driven,
     returns focus to the thumbnail it opened from.
     --------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));

  if (galleryItems.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Project image viewer');
    lb.innerHTML =
      '<img class="lightbox__img" alt="">' +
      '<p class="lightbox__cap"></p>' +
      '<button type="button" class="lightbox__btn lightbox__close" aria-label="Close image viewer"><i class="fa-solid fa-xmark"></i></button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('.lightbox__img');
    var lbCap = lb.querySelector('.lightbox__cap');
    var lbClose = lb.querySelector('.lightbox__close');
    var current = 0;
    var opener = null;

    function show(i) {
      current = (i + galleryItems.length) % galleryItems.length;
      var item = galleryItems[current];
      var full = item.getAttribute('data-lightbox');
      var img = item.querySelector('img');
      lbImg.src = full;
      lbImg.alt = img ? img.alt : '';
      lbCap.textContent = (img ? img.alt : '') + '  (' + (current + 1) + ' of ' + galleryItems.length + ')';
    }
    function open(i, from) {
      opener = from || null;
      show(i);
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      /* The panel is still visibility hidden on this frame, and a hidden
         element cannot take focus, so move into the dialog on the next one. */
      requestAnimationFrame(function () { lbClose.focus(); });
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      if (opener) { opener.focus(); opener = null; }
    }

    galleryItems.forEach(function (item, i) {
      item.addEventListener('click', function (e) { e.preventDefault(); open(i, item); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, item); }
      });
    });
    lbClose.addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImg) { close(); } });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { close(); }
      if (e.key === 'ArrowLeft') { show(current - 1); }
      if (e.key === 'ArrowRight') { show(current + 1); }
    });
  }

  /* ---------------------------------------------------------
     Demo form handling, replace with Contact Form 7 in WordPress
     --------------------------------------------------------- */
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      if (!button) { return; }
      var original = button.innerHTML;
      button.innerHTML = '<i class="fa-solid fa-check"></i> Thank You, We Will Be In Touch';
      setTimeout(function () { button.innerHTML = original; }, 3200);
    });
  });
})();
