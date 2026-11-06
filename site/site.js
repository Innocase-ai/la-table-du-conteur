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

  // Formulaire de sortie : pas encore relié à un service, rien n'est envoyé ni enregistré.
  var f = document.getElementById('formulaire-sortie');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var champ = document.getElementById('courriel');
      var msg = document.getElementById('retour-sortie');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champ.value.trim());
      msg.hidden = false;
      msg.className = ok ? 'retour' : 'retour erreur';
      msg.textContent = ok ? 'Les inscriptions ne sont pas encore ouvertes : votre adresse n’a pas été enregistrée. Revenez bientôt.' : 'Cette adresse e-mail ne semble pas valide.';
    });
  }
})();
