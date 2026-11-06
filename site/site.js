// Visionneuse d'images et mise en évidence de la section courante.
(function () {
  var v = document.getElementById('visionneuse');
  var im = v.querySelector('img');
  var leg = v.querySelector('p');
  function ouvrir(src, texte) { im.src = src; im.alt = texte; leg.textContent = texte; v.hidden = false; document.body.style.overflow = 'hidden'; }
  function fermer() { v.hidden = true; im.removeAttribute('src'); document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.zoom');
    if (b) { ouvrir(b.dataset.src, b.dataset.leg || ''); return; }
    if (!v.hidden && (e.target === v || e.target.id === 'fermer')) fermer();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !v.hidden) fermer(); });

  var liens = {};
  document.querySelectorAll('.barre nav a').forEach(function (a) { liens[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting && liens[en.target.id]) {
          Object.keys(liens).forEach(function (k) { liens[k].classList.remove('actif'); });
          liens[en.target.id].classList.add('actif');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(liens).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  // Formulaire de sortie : envoyé à la fonction serveur /api/inscription (qui écrit dans AITable).
  var f = document.getElementById('formulaire-sortie');
  if (f) {
    var msg = document.getElementById('retour-sortie');
    var afficher = function (texte, erreur) { msg.hidden = false; msg.className = erreur ? 'retour erreur' : 'retour'; msg.textContent = texte; };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var champ = document.getElementById('courriel');
      var coche = document.getElementById('consentement');
      var bouton = f.querySelector('button[type=submit]');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champ.value.trim())) { afficher('Cette adresse e-mail ne semble pas valide.', true); return; }
      if (!coche.checked) { afficher('Veuillez cocher la case de consentement.', true); return; }
      bouton.disabled = true;
      afficher('Envoi en cours…', false);
      fetch(f.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courriel: champ.value.trim(), consentement: true, site_web: f.elements.site_web.value }),
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, message: j.message }; }); })
        .then(function (res) {
          if (res.ok) { afficher('Merci ! Votre adresse est enregistrée : vous serez prévenu à la sortie du jeu.', false); f.reset(); }
          else afficher(res.message || 'L’inscription n’a pas pu être enregistrée. Réessayez dans un moment.', true);
        })
        .catch(function () { afficher('L’inscription n’a pas pu être envoyée. Réessayez dans un moment.', true); })
        .then(function () { bouton.disabled = false; });
    });
  }
})();
