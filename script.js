(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress + nav state */
  var prog = document.getElementById('progress');
  var nav  = document.getElementById('topnav');
  function onScroll(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* Reveal on scroll */
  var revs = document.querySelectorAll('.rv');
  if (reduce) {
    revs.forEach(function(el){ el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    revs.forEach(function(el){ ro.observe(el); });
  }

  /* Animate bars when in view */
  function animateCount(el, target, dur){
    if (reduce){ el.textContent = target; return; }
    var start = performance.now();
    function tick(now){
      var p = Math.min((now - start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var barObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var fills = e.target.querySelectorAll('.bar-fill');
      fills.forEach(function(f, i){
        var w = Math.max(parseFloat(f.dataset.w) || 0, 1.5);
        setTimeout(function(){ f.style.width = w + '%'; }, reduce ? 0 : i * 90);
      });
      var nums = e.target.querySelectorAll('.bar-val [data-count]');
      nums.forEach(function(n){
        var target = parseInt(n.dataset.count, 10);
        setTimeout(function(){ animateCount(n, target, 1100); }, reduce ? 0 : 90);
      });
      barObs.unobserve(e.target);
    });
  }, {threshold:0.3});
  document.querySelectorAll('.bar-card').forEach(function(c){ barObs.observe(c); });

  /* Count-up stats */
  var cObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target, target = parseInt(el.dataset.count,10), sfx = el.dataset.suffix || '';
      if (reduce){ el.textContent = target + sfx; cObs.unobserve(el); return; }
      var start = performance.now(), dur = 900;
      function tick(now){
        var p = Math.min((now - start)/dur, 1);
        var eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.round(target * eased) + (p === 1 ? sfx : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      cObs.unobserve(el);
    });
  }, {threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(function(el){ cObs.observe(el); });

  /* Methods map: filter chips */
  var chips = document.querySelectorAll('.fchip');
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      var f = chip.dataset.f;
      chips.forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      document.querySelectorAll('#pts .pt').forEach(function(pt){
        pt.classList.toggle('dim', f !== 'all' && pt.dataset.cat !== f);
      });
    });
  });

  /* Methods map: stagger points in */
  var pts = document.querySelectorAll('#pts .pt');
  pts.forEach(function(p){ p.style.opacity = reduce ? 1 : 0; p.style.transition = 'opacity .5s ease'; });
  var mObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      pts.forEach(function(p, i){
        setTimeout(function(){ p.style.opacity = 1; }, reduce ? 0 : i * 110);
      });
      mObs.unobserve(e.target);
    });
  }, {threshold:0.25});
  var plot = document.querySelector('.plot');
  if (plot) mObs.observe(plot);

  /* Methods map: small note tooltip for confidential-work points only */
  var noteTip = document.getElementById('mapNoteTip');
  var plotEl = document.querySelector('.plot');
  var plotWrapEl = document.querySelector('.plot-wrap');
  if (noteTip && plotEl && plotWrapEl) {
    document.querySelectorAll('.pt.has-note').forEach(function(p){
      var note = p.dataset.note;
      p.setAttribute('tabindex', '0');
      var label = p.querySelector('text') ? p.querySelector('text').textContent : '';
      p.setAttribute('aria-label', label + ': ' + note);
      function showNote(){
        noteTip.textContent = note;
        var core = p.querySelector('circle.core');
        var cx = parseFloat(core.getAttribute('cx'));
        var cy = parseFloat(core.getAttribute('cy'));
        var svgRect = plotEl.getBoundingClientRect();
        var wrapRect = plotWrapEl.getBoundingClientRect();
        var scaleX = svgRect.width / 900;
        var scaleY = svgRect.height / 620;
        noteTip.style.left = ((svgRect.left - wrapRect.left) + cx * scaleX) + 'px';
        noteTip.style.top = ((svgRect.top - wrapRect.top) + cy * scaleY) + 'px';
        noteTip.classList.add('show');
      }
      function hideNote(){ noteTip.classList.remove('show'); }
      p.addEventListener('mouseenter', showNote);
      p.addEventListener('mouseleave', hideNote);
      p.addEventListener('focus', showNote);
      p.addEventListener('blur', hideNote);
    });
  }

  /* Flow diagram & sprint timeline: trigger pulse animation on scroll */
  var flowObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('pulse-on'); }
    });
  }, {threshold:0.4});
  document.querySelectorAll('.flow, .sprint').forEach(function(f){ flowObs.observe(f); });

  /* Active nav link */
  var secs = ['about','methods','work','publications','contact']
    .map(function(id){ return document.getElementById(id); })
    .filter(Boolean);
  var navA = {};
  document.querySelectorAll('.nav-links a').forEach(function(a){
    var h = a.getAttribute('href');
    if (h && h.charAt(0) === '#') navA[h.slice(1)] = a;
  });
  var sObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      Object.keys(navA).forEach(function(k){ navA[k].classList.remove('active'); });
      var a = navA[e.target.id];
      if (a) a.classList.add('active');
    });
  }, {threshold:0.25, rootMargin:'-20% 0px -50% 0px'});
  secs.forEach(function(s){ sObs.observe(s); });

  /* Case study collapse/expand */
  document.querySelectorAll('.case-toggle').forEach(function(btn){
    var body = btn.nextElementSibling;
    var label = btn.querySelector('.case-toggle-txt');
    btn.addEventListener('click', function(){
      var isOpen = body.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      label.textContent = isOpen ? 'Hide case study' : 'View full case study';
      if (!isOpen) {
        var article = btn.closest('.case');
        var top = article.getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > top) window.scrollTo({top: top, behavior: 'smooth'});
      }
    });
  });

  /* Auto-expand a case if linked directly or via a map point */
  function expandCaseFor(hash){
    var id = hash.replace('#','');
    var target = document.getElementById(id) || document.getElementById('case-' + id);
    if (!target || !target.classList.contains('case')) return;
    var body = target.querySelector('.case-body');
    var btn = target.querySelector('.case-toggle');
    if (body && btn && !body.classList.contains('open')) {
      body.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('.case-toggle-txt').textContent = 'Hide case study';
    }
  }
  if (window.location.hash) expandCaseFor(window.location.hash);
  window.addEventListener('hashchange', function(){ expandCaseFor(window.location.hash); });
})();
