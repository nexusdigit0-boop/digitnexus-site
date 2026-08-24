(function(){
  'use strict';

  // ================================================================
  // CONFIGURATION — ENVOI RÉEL DES FORMULAIRES (Formspree)
  // ================================================================
  // 1. Crée un compte gratuit sur https://formspree.io
  // 2. Crée un formulaire "Waitlist" et un formulaire "Contact"
  // 3. Colle les deux identifiants ci-dessous (ex: "xanybkqp")
  //    Formspree te les donne dans l'URL d'intégration : formspree.io/f/XXXXXXX
  // Tant que les identifiants ne sont pas remplacés, les formulaires
  // restent en mode simulation locale (aucun email n'est envoyé).
  var CONFIG = {
    formspreeWaitlistId: 'REMPLACE_PAR_TON_ID_FORMSPREE',
    formspreeContactId:  'REMPLACE_PAR_TON_ID_FORMSPREE'
  };
  function isConfigured(id){
    return !!id && id.indexOf('REMPLACE_PAR') === -1;
  }
  function submitToFormspree(formId, data){
    return fetch('https://formspree.io/f/' + formId, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(res){
      if (!res.ok) throw new Error('formspree_error');
      return res.json();
    });
  }

  // --- Header scroll state ---
  var header = document.getElementById('siteHeader');
  if (header){
    var onScroll = function(){
      if (window.scrollY > 30) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  // --- Mobile nav ---
  var burger = document.getElementById('burger');
  var panel = document.getElementById('mobilePanel');
  if (burger && panel){
    var closePanel = function(){
      burger.classList.remove('open');
      panel.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', function(){
      var open = panel.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    panel.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closePanel);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closePanel();
    });
  }

  // --- Scroll reveal ---
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length){
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting){
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add('in'); });
    }
  }

  // --- KPI count-up (page À propos) ---
  var targets = [1200, 340, 68, 45]; // valeurs cibles illustratives, à connecter aux vraies données au lancement
  var kpiNums = document.querySelectorAll('.kpi-num');
  var kpiDone = false;
  function animateCount(el, target){
    var suffixEl = el.querySelector('.suffix');
    var suffix = suffixEl ? suffixEl.outerHTML : '';
    var duration = 1400;
    var startTime = null;
    function step(ts){
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.innerHTML = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.innerHTML = target + suffix;
    }
    requestAnimationFrame(step);
  }
  var kpiSection = document.getElementById('kpi');
  if (kpiSection && kpiNums.length && 'IntersectionObserver' in window){
    var kpiIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && !kpiDone){
          kpiDone = true;
          kpiNums.forEach(function(el, i){ animateCount(el, targets[i] || 0); });
          kpiIo.disconnect();
        }
      });
    }, { threshold: 0.35 });
    kpiIo.observe(kpiSection);
  }

  // --- Waitlist form (mini, page d'accueil) ---
  var waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm){
    var emailInput = document.getElementById('waitlistEmail');
    var row = waitlistForm.querySelector('.waitlist-row');
    var msg = document.getElementById('waitlistMsg');
    var submitBtn = waitlistForm.querySelector('button[type="submit"]');
    var btnLabel = submitBtn.querySelector('.btn-label');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var submitted = false;

    waitlistForm.addEventListener('submit', function(e){
      e.preventDefault();
      if (submitted) return;
      var value = emailInput.value.trim();

      if (!emailRe.test(value)){
        row.classList.add('invalid');
        msg.textContent = 'Entre une adresse email valide pour rejoindre la liste.';
        msg.className = 'waitlist-msg error';
        emailInput.focus();
        return;
      }

      row.classList.remove('invalid');
      submitted = true;
      submitBtn.disabled = true;
      btnLabel.textContent = 'Inscription en cours…';

      function onSuccess(){
        btnLabel.textContent = 'Inscrit !';
        msg.textContent = 'Merci — tu recevras un email dès l\'ouverture des accès.';
        msg.className = 'waitlist-msg success';
        emailInput.value = '';
        emailInput.disabled = true;
      }
      function onFailure(){
        submitted = false;
        submitBtn.disabled = false;
        btnLabel.textContent = 'Rejoindre la liste d\'attente';
        msg.textContent = 'Une erreur est survenue. Réessaie, ou écris-nous directement à contact@digitnexus.cm.';
        msg.className = 'waitlist-msg error';
      }

      if (isConfigured(CONFIG.formspreeWaitlistId)){
        submitToFormspree(CONFIG.formspreeWaitlistId, {
          email: value,
          _subject: 'Nouvelle inscription — liste d\'attente DigitNexus'
        }).then(onSuccess).catch(onFailure);
      } else {
        // Mode simulation : aucun identifiant Formspree configuré pour l'instant.
        setTimeout(onSuccess, 650);
      }
    });

    emailInput.addEventListener('input', function(){
      if (row.classList.contains('invalid')){
        row.classList.remove('invalid');
        msg.textContent = '';
      }
    });
  }

  // --- Contact form (page Contact) ---
  var contactForm = document.getElementById('contactForm');
  if (contactForm){
    var cName = document.getElementById('cName');
    var cEmail = document.getElementById('cEmail');
    var cRole = document.getElementById('cRole');
    var cMessage = document.getElementById('cMessage');
    var cMsg = document.getElementById('contactMsg');
    var cSubmit = contactForm.querySelector('button[type="submit"]');
    var cLabel = cSubmit.querySelector('.btn-label');
    var emailRe2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var cSubmitted = false;

    function setInvalid(field, invalid){
      var group = field.closest('.field-group');
      if (!group) return;
      group.classList.toggle('invalid', invalid);
    }

    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      if (cSubmitted) return;

      var nameOk = cName.value.trim().length > 1;
      var emailOk = emailRe2.test(cEmail.value.trim());
      var messageOk = cMessage.value.trim().length > 4;

      setInvalid(cName, !nameOk);
      setInvalid(cEmail, !emailOk);
      setInvalid(cMessage, !messageOk);

      if (!nameOk || !emailOk || !messageOk){
        cMsg.textContent = 'Merci de vérifier les champs surlignés.';
        cMsg.className = 'form-msg error';
        (!nameOk ? cName : (!emailOk ? cEmail : cMessage)).focus();
        return;
      }

      cSubmitted = true;
      cSubmit.disabled = true;
      cLabel.textContent = 'Envoi en cours…';

      var firstName = cName.value.trim().split(' ')[0];
      function onSuccess(){
        cLabel.textContent = 'Message envoyé';
        cMsg.textContent = 'Merci ' + firstName + ' — on te répond sous 48h.';
        cMsg.className = 'form-msg success';
        contactForm.reset();
      }
      function onFailure(){
        cSubmitted = false;
        cSubmit.disabled = false;
        cLabel.textContent = 'Envoyer le message';
        cMsg.textContent = 'Une erreur est survenue. Réessaie, ou écris directement à contact@digitnexus.cm.';
        cMsg.className = 'form-msg error';
      }

      if (isConfigured(CONFIG.formspreeContactId)){
        submitToFormspree(CONFIG.formspreeContactId, {
          name: cName.value.trim(),
          email: cEmail.value.trim(),
          role: cRole.value,
          message: cMessage.value.trim(),
          _subject: 'Nouveau message — formulaire de contact DigitNexus'
        }).then(onSuccess).catch(onFailure);
      } else {
        // Mode simulation : aucun identifiant Formspree configuré pour l'instant.
        setTimeout(onSuccess, 700);
      }
    });

    [cName, cEmail, cMessage].forEach(function(field){
      field.addEventListener('input', function(){ setInvalid(field, false); });
    });
  }

  // --- FAQ accordion ---
  document.querySelectorAll('.faq-item').forEach(function(item){
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(other){
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open', !wasOpen);
    });
  });

  // --- Smooth anchor scroll offset for fixed header (same-page anchors only) ---
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo({ top:y, behavior:'smooth' });
      if (panel) closePanelSafe();
    });
  });
  function closePanelSafe(){
    if (burger && panel){
      burger.classList.remove('open');
      panel.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  }
})();
