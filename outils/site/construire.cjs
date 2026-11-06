// Construit site/index.html à partir de outils/site/contenu.json (les textes) et des images de site/images.
// Le dossier site/ est le site publié (autonome, prêt à glisser-déposer sur Netlify) ; ce script et les textes restent hors du dossier publié.
// Usage : node outils/site/construire.cjs
const fs = require('fs');
const path = require('path');

const dossier = path.join(__dirname, '..', '..', 'site');
const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'contenu.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (id) => `images/ecrans/${id}.webp`;
for (const s of c.sections) for (const i of s.images || []) if (!fs.existsSync(path.join(dossier, img(i.id)))) throw new Error(`image absente : ${i.id}`);

const court = { conteur: 'Le conteur', groupe: 'Groupe', histoires: 'Histoires', explorer: 'Explorer', parler: 'Parler', choix: 'Choix', combat: 'Combat', monstres: 'Monstres', monde: 'Image et son', auteurs: 'Auteurs', cout: 'Coût' };
const figure = (i, gros = false) =>
  `<figure class="${gros ? 'gros' : ''}"><button class="zoom" data-src="${img(i.id)}" data-leg="${esc(i.legende)}" aria-label="Agrandir : ${esc(i.legende)}"><img src="${img(i.id)}" alt="${esc(i.legende)}" loading="lazy"></button><figcaption>${esc(i.legende)}</figcaption></figure>`;

const section = (s, n) => {
  const imgs = s.images || [];
  const pairs = n % 2 === 1;
  return `
<section id="${esc(s.id)}" class="bloc ${pairs ? 'inverse' : ''}">
  <div class="colonne">
    <div class="texte">
      <p class="num">${String(n + 1).padStart(2, '0')}</p>
      <h2>${esc(s.titre)}</h2>
      <p class="accroche">${esc(s.accroche)}</p>
      ${(s.paragraphes || []).map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <ul class="puces">${(s.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>
    ${imgs.length ? `<div class="vue">${figure(imgs[0], true)}</div>` : ''}
  </div>
  ${imgs.length > 1 ? `<div class="galerie g${Math.min(imgs.length - 1, 4)}">${imgs.slice(1).map((i) => figure(i)).join('')}</div>` : ''}
</section>`;
};

const galerie = (titre, texte, fichiers, classe) => `
<section class="bloc art ${classe}">
  <div class="entete"><h2>${esc(titre)}</h2><p>${esc(texte)}</p></div>
  <div class="mosaique">${fichiers.map(([f, nom]) => `<figure><img src="images/art/${f}" alt="${esc(nom)}" loading="lazy"><figcaption>${esc(nom)}</figcaption></figure>`).join('')}</div>
</section>`;

const etapes = [['espece','Espèce','Neuf espèces, leurs traits et leur lignage.'],['classe','Classe','Douze classes, niveau de départ de 1 à 20.'],['historique','Historique','Le passé du héros, ses atouts et son don.'],['caracteristiques','Caractéristiques','Valeurs standard, achat de points ou tirage 4d6.'],['choix','Choix de classe','Compétences, sorts, équipement, avec le bouton Recommandé.'],['alignement','Alignement','Les neuf alignements, en un clic.'],['portrait','Nom et portrait','Une galerie de 54 portraits, et une ligne de caractère.'],['recap','Récapitulatif','La fiche complète, validée par le jeu.']];
const createur = `
<section id="createur" class="bloc createur">
  <div class="entete"><p class="num">Création</p><h2>Le créateur de personnage, en 8 écrans</h2><p>Des écrans courts, une liste à gauche, une description à droite, un bouton Recommandé partout et une Création rapide. Le jeu vérifie chaque choix : une fiche invalide ne passe pas.</p></div>
  <ol class="etapes">${etapes.map(([id, nom, d], k) => `<li><button class="zoom" data-src="${img('createur-' + id)}" data-leg="Écran ${k + 1} : ${esc(nom)}. ${esc(d)}"><img src="${img('createur-' + id)}" alt="Créateur de personnage, écran ${k + 1} : ${esc(nom)}" loading="lazy"></button><div><b>${k + 1}. ${esc(nom)}</b><span>${esc(d)}</span></div></li>`).join('')}</ol>
</section>`;

const monstres = [['monstre-dragon-rouge-adulte.webp', 'Dragon rouge adulte'], ['monstre-liche.webp', 'Liche'], ['monstre-troll.webp', 'Troll'], ['monstre-kraken.webp', 'Kraken'], ['monstre-hydre.webp', 'Hydre'], ['monstre-vampire.webp', 'Vampire'], ['monstre-golem-de-fer.webp', 'Golem de fer'], ['monstre-mimique.webp', 'Mimique'], ['monstre-manticore.webp', 'Manticore'], ['monstre-basilic.webp', 'Basilic'], ['monstre-griffon.webp', 'Griffon'], ['monstre-licorne.webp', 'Licorne'], ['monstre-balor.webp', 'Balor'], ['monstre-spectre.webp', 'Spectre']];
const portraits = [['portrait-drakeide-f-1.webp', 'Drakéide'], ['portrait-elfe-m-2.webp', 'Elfe'], ['portrait-gnome-f-2.webp', 'Gnome'], ['portrait-goliath-m-1.webp', 'Goliath'], ['portrait-halfelin-f-1.webp', 'Halfelin'], ['portrait-humain-m-3.webp', 'Humain'], ['portrait-nain-f-2.webp', 'Nain'], ['portrait-orc-m-2.webp', 'Orc'], ['portrait-tieffelin-f-1.webp', 'Tieffelin']];
const histoires = [['carte-citadelle.webp', 'La Citadelle des Marées'], ['carte-cote.webp', 'La côte de Hautmarée'], ['carte-port-sillage.webp', 'Port-Sillage'], ['lieu-crypte.webp', 'La crypte de Port-Sillage'], ['lieu-place.webp', 'La place de la Criée'], ['pnj-octave.webp', 'Octave Lamberte'], ['pnj-sorel.webp', 'Sorel Noirbec'], ['pnj-aubin.webp', 'Père Aubin'], ['objet-livre.webp', 'Le Livre de Maëlle']];

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.meta.titre)} : ${esc(c.meta.sousTitre)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<meta property="og:title" content="${esc(c.meta.titre)}">
<meta property="og:description" content="${esc(c.meta.description)}">
<meta property="og:image" content="images/ecrans/titre.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="barre">
  <a class="marque" href="#haut">${esc(c.meta.titre)}</a>
  <nav>${c.sections.map((s) => `<a href="#${esc(s.id)}">${esc(court[s.id] || s.titre)}</a>` + (s.id === 'groupe' ? '<a href="#createur">Créateur</a>' : '')).join('')}<a href="#etat">État du jeu</a></nav>
</header>

<main id="haut">
<section class="hero" style="background-image:linear-gradient(180deg,rgba(14,11,8,.35),rgba(14,11,8,.92)),url('images/art/hero.webp')">
  <div class="hero-contenu">
    <p class="surtitre">Jeu de rôle narratif illustré · règles du SRD 5.2.1</p>
    <h1>${esc(c.meta.titre)}</h1>
    <p class="accroche-hero">${esc(c.hero.accroche)}</p>
    <p class="para-hero">${esc(c.hero.paragraphe)}</p>
    <p class="actions"><a class="bouton" href="#conteur">Découvrir le jeu</a><a class="bouton second" href="#etat">Où en est-il ?</a></p>
  </div>
</section>

<section class="chiffres" aria-label="Le jeu en chiffres">
  ${c.chiffres.map((x) => `<div><b>${esc(x.valeur)}</b><span>${esc(x.libelle)}</span></div>`).join('')}
</section>

${c.sections.map((s, n) => section(s, n) + (s.id === 'groupe' ? createur : '')).join('\n')}

${galerie('Un bestiaire complet', 'Les 329 monstres du SRD ont leur illustration, dans un même style peint. En voici quelques-uns.', monstres, 'monstres-galerie')}
${galerie('Des héros qui vous ressemblent', 'Neuf espèces, deux silhouettes, trois visages chacune : 54 portraits à choisir.', portraits, 'portraits-galerie')}
${galerie('Des mondes qui se dessinent', 'Cartes, lieux, personnages et objets des histoires livrées.', histoires, 'mondes-galerie')}

<section id="etat" class="bloc etat">
  <h2>${esc(c.etat.titre)}</h2>
  ${(c.etat.paragraphes || []).map((p) => `<p>${esc(p)}</p>`).join('')}
  <ul class="puces">${(c.etat.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</section>
</main>

<footer class="pied"><p>${esc(c.pied)}</p></footer>

<div id="visionneuse" hidden><button id="fermer" aria-label="Fermer">×</button><img alt=""><p></p></div>
<script src="site.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(dossier, 'index.html'), html);
console.log('site/index.html écrit :', c.sections.length, 'sections,', c.sections.reduce((n, s) => n + (s.images || []).length, 0), 'captures');
