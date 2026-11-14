// Démo jouable du moteur de terres : se promener dans le Carrefour d'Aldric (positions et durées tirées de La Marche d'Ombrefiel).
// Le moteur ne sait rien du jeu : ici, les rencontres et les événements des points d'intérêt sont simulés en texte.
import {
  camper,
  CARREFOUR_D_ALDRIC,
  chargerVoyage,
  chercherGraine,
  creerVoyage,
  deplacer,
  formatHeure,
  genererCarte,
  marcher,
  moment,
  numeroJour,
  planifier,
  pireEcart,
  rapportDurees,
  rayonVision,
  serialiserVoyage,
  TABLE_EXEMPLE,
  TERRAINS,
  voisinage,
  type CarteTerres,
  type Case,
  type ContexteVoyage,
  type EtatVoyage,
  type EvenementTerres,
  type RencontreErrante,
  type ResultatVoyage,
} from '../src';
import { POI, RENCONTRES } from './contenu';
import { COULEUR, dessiner, dessinerMini, T, VH, VW } from './rendu';

const $ = <E extends HTMLElement>(id: string): E => document.getElementById(id) as E;
const vue = $<HTMLCanvasElement>('vue');
const CLE = 'terres-demo';

let carte: CarteTerres;
let etat: EtatVoyage;
let chemin: Case[] = [];
let timer: number | null = null;
let modale = false;
let origine = { ox: 0, oy: 0 };
let replans = 0;
let t0 = 0;

const contexte = (): ContexteVoyage => ({
  niveauGroupe: Number($<HTMLSelectElement>('niveau').value),
  tailleGroupe: Number($<HTMLSelectElement>('taille').value),
  ancresConnues: $<HTMLInputElement>('connus').checked ? carte.ancres.map((a) => a.id) : [],
});

function journal(texte: string, classe = ''): void {
  const j = $('journal');
  const d = document.createElement('div');
  d.className = classe;
  d.textContent = `${formatHeure(etat.minutes)} · ${texte}`;
  j.prepend(d);
  while (j.children.length > 60) j.lastElementChild?.remove();
}

function demarrer(graine: number, voyage?: EtatVoyage): void {
  carte = genererCarte({ ...CARREFOUR_D_ALDRIC, graine });
  $<HTMLInputElement>('graine').value = String(graine);
  etat = voyage ?? creerVoyage(carte, carte.ancres[0]!.id, contexte());
  chemin = [];
  arreter();
  $('journal').innerHTML = '';
  journal(voyage ? 'Partie reprise.' : `Le groupe se tient devant ${carte.ancres[0]!.nom}. Où aller ?`);
  const ecart = pireEcart(carte);
  $('rapport').innerHTML = `<b>Durées écrites / réelles</b><br>${rapportDurees(carte)
    .map((r) => `${nomCourt(r.de)} ↔ ${nomCourt(r.vers)} : ${r.heuresEcrites * 60} / ${r.minutesReelles} min`)
    .join('<br>')}<br>Pire écart : ×${ecart.toFixed(2)}`;
  rafraichir();
}

const nomCourt = (id: string): string => carte.ancres.find((a) => a.id === id)?.nom.replace(/^(Le |La |Les |L’|Auberge de |Moulin d’|Combe de l’|Vieux )/, '') ?? id;

function rafraichir(): void {
  const brouillard = $<HTMLInputElement>('fog').checked;
  origine = dessiner(vue, carte, etat, { brouillard, ctx: contexte(), connus: new Set(contexte().ancresConnues ?? []), pulsation: Math.sin((performance.now() - t0) / 350) * 0.5 + 0.5 });
  dessinerMini($<HTMLCanvasElement>('mini'), carte, etat, brouillard, origine.ox, origine.oy);
  const i = etat.y * carte.largeur + etat.x;
  const terrain = carte.route[i] && carte.tuiles[i] !== 'gue' ? 'route' : TERRAINS[carte.tuiles[i]!].libelle;
  $('horloge').textContent = `Jour ${numeroJour(etat.minutes)} · ${formatHeure(etat.minutes)} (${{ nuit: 'nuit', aube: 'aube', jour: 'jour', crepuscule: 'crépuscule' }[moment(etat.minutes)]})`;
  $('situation').textContent = `${terrain} · vision ${rayonVision(carte, etat, contexte())} cases · ${etat.pas} pas`;
  const vus = etat.explore.reduce((s, v) => s + v, 0);
  $('explore').textContent = `${((100 * vus) / etat.explore.length).toFixed(1)} % de la région explorée`;
  const ancre = carte.ancres.find((a) => a.x === etat.x && a.y === etat.y);
  const b = $<HTMLButtonElement>('entrer');
  b.style.display = ancre ? '' : 'none';
  if (ancre) b.textContent = `Entrer : ${ancre.nom}`;
  b.onclick = () => journal(`Commande « entrerLieu » : on entre à ${ancre!.nom}, sans repayer le trajet. Les portes écrites (verrou, passage caché, condition) sont vérifiées à ce moment.`, 'ancre');
}

function arreter(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

function raconter(ev: EvenementTerres[]): { arret?: 'rencontre' | 'poi' } {
  let arret: 'rencontre' | 'poi' | undefined;
  for (const e of ev) {
    if (e.type === 'terrain') journal(e.texte);
    else if (e.type === 'moment') journal(e.texte, 'moment');
    else if (e.type === 'jour') journal(`Un nouveau jour commence (jour ${e.jour}).`, 'moment');
    else if (e.type === 'repere') journal(`Vous apercevez ${e.nom.charAt(0).toLowerCase()}${e.nom.slice(1)}, ${e.direction}, à ${e.distance} cases.`, 'repere');
    else if (e.type === 'signe') journal(e.texte, 'rencontre');
    else if (e.type === 'ancre') journal(`Vous êtes à ${e.ancre.nom}.`, 'ancre');
    else if (e.type === 'bloque') journal(e.raison === 'eau' ? 'L’eau est trop profonde pour la traverser ici.' : e.raison === 'bord' ? 'Le bord de la région : il faudrait changer de carte.' : 'Un obstacle bloque le passage : arbres serrés, rochers.');
    else if (e.type === 'poi') {
      journal(e.poi.nom + ' : le groupe s’arrête.', 'poi');
      ouvrirPoi(e.poi.type, e.poi.nom);
      arret = 'poi';
    } else if (e.type === 'rencontre') {
      journal('Une rencontre !', 'rencontre');
      ouvrirRencontre(e.rencontre);
      arret = 'rencontre';
    }
  }
  return { arret };
}

function appliquer(r: ResultatVoyage): void {
  etat = r.etat;
  raconter(r.evenements);
  rafraichir();
}

function tic(): void {
  if (modale || !chemin.length) return arreter();
  const r = deplacer(etat, carte, chemin, contexte(), TABLE_EXEMPLE, { maxPas: 1 });
  chemin = r.restant;
  appliquer(r);
  if (r.arret === 'bloque') {
    const but = chemin.at(-1);
    const nouveau = but && replans++ < 25 ? planifier(etat, carte, but) : null;
    if (nouveau && nouveau.length) chemin = nouveau;
    else {
      chemin = [];
      arreter();
    }
  } else if (r.arret === 'rencontre' || r.arret === 'poi' || r.arret === 'ancre') {
    chemin = r.arret === 'ancre' ? [] : chemin;
    arreter();
  }
  if (!chemin.length) arreter();
}

function allerVers(but: Case): void {
  if (modale) return;
  const ch = planifier(etat, carte, but);
  if (!ch || !ch.length) return;
  chemin = ch;
  replans = 0;
  arreter();
  timer = window.setInterval(tic, 70);
}

// --- fenêtres : rencontres et points d'intérêt (simulés) ---

function ouvrirModale(html: string): HTMLElement {
  modale = true;
  arreter();
  $('contenu').innerHTML = html;
  $('modale').classList.add('ouverte');
  return $('contenu');
}
function fermerModale(): void {
  modale = false;
  $('modale').classList.remove('ouverte');
  rafraichir();
}

function apercuTerrain(r: RencontreErrante): string {
  // Ce que le moteur de jeu recevrait pour tirer un plateau de combat : le voisinage du groupe, case par case.
  const v = voisinage(carte, r, 9, 5);
  const c = document.createElement('canvas');
  c.width = 19 * 12;
  c.height = 11 * 12;
  const g = c.getContext('2d')!;
  v.forEach((ligne, y) => ligne.forEach((cs, x) => {
    g.fillStyle = cs.route ? '#c9b078' : COULEUR[cs.terrain];
    g.fillRect(x * 12, y * 12, 12, 12);
    if (cs.bloquee) {
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillRect(x * 12 + 3, y * 12 + 3, 6, 6);
    }
  }));
  g.strokeStyle = '#fff';
  g.strokeRect(9 * 12, 5 * 12, 12, 12);
  return `<img alt="Terrain autour du groupe" src="${c.toDataURL()}" style="max-width:100%;image-rendering:pixelated;border-radius:6px;display:block;margin:8px 0" />`;
}

function ouvrirRencontre(r: RencontreErrante): void {
  const txt = RENCONTRES[r.entree.id] ?? { titre: r.entree.id, texte: '' };
  const taille = contexte().tailleGroupe as 4 | 6;
  const combat = r.entree.genre === 'combat';
  const lieu = `${TERRAINS[r.terrain].libelle}${r.surRoute ? ' (sur la route)' : ''}, ${{ nuit: 'de nuit', aube: 'à l’aube', jour: 'de jour', crepuscule: 'au crépuscule' }[r.moment]}`;
  const el = ouvrirModale(`<h2>${txt.titre}</h2><div>${txt.texte}</div>
    <div class="doux" style="margin-top:8px">${combat ? `Le moteur de jeu composerait ici, pour ${taille} héros de niveau ${contexte().niveauGroupe} : <b>${txt.composition?.[taille] ?? '…'}</b>.` : `Rencontre sans combat (${r.entree.genre}) : un jet, une alternative, un petit gain ou un petit prix.`}<br>Lieu : ${lieu}.<br>Graine de la rencontre : ${r.graine}.</div>
    ${apercuTerrain(r)}<div class="doux">Voisinage fourni au moteur de jeu pour tirer le plateau de combat (case blanche : le groupe).</div>
    <div class="ligne" id="choix"></div>`);
  const choix = el.querySelector('#choix')!;
  const options = combat ? [['Combattre', 'Le combat se jouerait sur un plateau tiré de ce terrain, puis le groupe reviendrait ici.'], ['Parlementer', 'Un jet de Persuasion ou d’Intimidation décide de la suite.'], ['Se replier', 'Le groupe recule : du temps perdu, rien de plus.']] : [['Tenter', 'Le jet est tenté : un petit gain, ou un petit prix.'], ['Passer son chemin', 'Le groupe passe son chemin.']];
  for (const [lib, res] of options) {
    const b = document.createElement('button');
    b.textContent = lib!;
    b.onclick = () => {
      journal(`${txt.titre} — ${res}`, 'rencontre');
      fermerModale();
    };
    choix.append(b);
  }
}

function ouvrirPoi(type: string, nom: string): void {
  const p = POI[type] ?? { texte: nom, choix: [{ libelle: 'Passer', resultat: 'Vous poursuivez votre route.' }] };
  const el = ouvrirModale(`<h2>${nom}</h2><div>${p.texte}</div><div class="doux" style="margin-top:8px">Dans le vrai jeu : un événement à choix illustré, relié à ce type de point d’intérêt.</div><div class="ligne" id="choix"></div>`);
  for (const c of p.choix) {
    const b = document.createElement('button');
    b.textContent = c.libelle;
    b.onclick = () => {
      journal(`${nom} — ${c.resultat}`, 'poi');
      fermerModale();
    };
    el.querySelector('#choix')!.append(b);
  }
}

// --- commandes ---

function camp(minutes: number): void {
  if (modale) return;
  chemin = [];
  arreter();
  const r = camper(etat, carte, minutes, contexte(), TABLE_EXEMPLE);
  journal(r.arret === 'rencontre' ? `Le repos est interrompu au bout de ${Math.round(r.minutes / 60 * 10) / 10} h.` : `Le groupe se repose ${minutes / 60} h.`, 'moment');
  appliquer(r);
}

window.addEventListener('keydown', (e) => {
  if (modale) {
    if (e.key === 'Escape') fermerModale();
    return;
  }
  if (e.key === 'Escape') {
    chemin = [];
    arreter();
    return;
  }
  const d: Record<string, Case> = { ArrowUp: { x: 0, y: -1 }, z: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, q: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } };
  const v = d[e.key] ?? d[e.key.toLowerCase()];
  if (!v) return;
  e.preventDefault();
  chemin = [];
  arreter();
  const r = marcher(etat, carte, { x: etat.x + v.x, y: etat.y + v.y }, contexte(), TABLE_EXEMPLE);
  appliquer(r);
});

vue.addEventListener('click', (e) => {
  vue.focus();
  const b = vue.getBoundingClientRect();
  const x = origine.ox + Math.floor(((e.clientX - b.left) / b.width) * VW);
  const y = origine.oy + Math.floor(((e.clientY - b.top) / b.height) * VH);
  if (x < 0 || y < 0 || x >= carte.largeur || y >= carte.hauteur) return;
  if ($<HTMLInputElement>('fog').checked && !etat.explore[y * carte.largeur + x]) {
    journal('Case inconnue : vous ne savez pas encore ce qu’il y a là. Vous y allez quand même.');
  }
  allerVers({ x, y });
});

$('camper1').onclick = () => camp(60);
$('camper8').onclick = () => camp(480);
$('fog').onchange = rafraichir;
$('connus').onchange = rafraichir;
$('nouvelle').onclick = () => demarrer(Math.floor(Math.random() * 100000));
$('chercher').onclick = () => {
  const r = chercherGraine({ ...CARREFOUR_D_ALDRIC, graine: 0 }, { essais: 200, depuis: Number($<HTMLInputElement>('graine').value) + 1, tolerance: 1.2 });
  if (r) demarrer(r.graine);
};
$<HTMLInputElement>('graine').onchange = () => demarrer(Number($<HTMLInputElement>('graine').value) || 21);
$('sauver').onclick = () => {
  localStorage.setItem(CLE, JSON.stringify({ graine: carte.graine, voyage: serialiserVoyage(etat) }));
  journal(`Sauvegardé (${serialiserVoyage(etat).length} caractères).`);
};
$('charger').onclick = () => {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as { graine: number; voyage: string } | null;
    if (!brut) return journal('Rien à charger.');
    const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine: brut.graine });
    demarrer(brut.graine, chargerVoyage(brut.voyage, c));
  } catch (err) {
    journal(err instanceof Error ? err.message : String(err), 'rencontre');
  }
};

t0 = performance.now();
demarrer(CARREFOUR_D_ALDRIC.graine);
vue.focus();
window.setInterval(() => {
  if (!modale) rafraichir();
}, 120);
