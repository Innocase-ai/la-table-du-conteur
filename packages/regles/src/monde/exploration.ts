// Exploration d'un monde : les verbes que le conteur (M4) appelle et que le moteur valide, résout et applique.
// Aucun LLM ici : chaque verbe prend une partie et une demande, lance les dés sur les vraies fiches du groupe,
// applique les effets du monde et renvoie un compte rendu factuel, que le conteur raconte. Voir docs/M4-CONTEUR.md.
import { lancer, type Generateur } from '../des';
import type { Jet } from '../noyau/types';
import { recuperer, type Personnage } from '../personnage';
import type { Fiche } from '../fiche';
import type { Caracteristique, Competence } from '../schemas';
import { testD20 } from '../tests-d20';
import { appliquerEffets, avancerQuetes, evaluerCondition, verifierEnigme, type EtatMonde } from './etat';
import type { DonneesMonde, EffetMonde, Lieu, Piege, Tresor } from './schemas';

/** Ce que l'exploration ajoute à l'état du monde (sauvegardé avec lui). */
export interface EtatExploration {
  /** Choses cachées trouvées : `lien:<de>><vers>`, `tresor:<id>`, `piege:<id>`. */
  decouverts: string[];
  /** Verrous ouverts : `lien:<de>><vers>`, `tresor:<id>`. */
  ouverts: string[];
  pieges: Record<string, 'desarme' | 'declenche'>;
  tresorsPris: string[];
  /** Sujets uniques déjà abordés : `<pnj>:<sujet>`. */
  sujetsVus: string[];
  enigmes: Record<string, 'resolue' | 'echouee'>;
  /** Paliers de jauge déjà franchis : `<jauge>:<seuil>`. */
  paliers: string[];
  /** Évolutions de jauge sur condition déjà appliquées : `<jauge>:<index>`. */
  evolutions: string[];
  /** Fouilles déjà faites : `<lieu>:<jour>` (une par lieu et par jour). */
  fouilles: string[];
  /** Niveau d'indice déjà atteint par énigme (absent des sauvegardes anciennes). */
  indices?: Record<string, number>;
}

export interface PartieMonde {
  dm: DonneesMonde;
  etat: EtatMonde & { exploration: EtatExploration };
  groupe: Personnage[];
  gen: Generateur;
}

export type { Jet };

/** Compte rendu d'un verbe : ce que le conteur doit raconter, rien de plus. */
export interface CompteRendu {
  ok: boolean;
  /** Pourquoi l'action est impossible (le conteur le raconte ou propose autre chose). */
  refus?: string;
  jets: Jet[];
  /** Faits établis par le moteur, en phrases simples (« Pip repère un piège : une aiguille… »). */
  constats: string[];
  /** Faits du monde révélés au groupe. */
  revele: string[];
  /** Narrations écrites par l'auteur du monde, à reformuler. */
  narrations: string[];
  /** Combat à lancer (id de rencontre). */
  combat?: string;
  /** Fin de l'histoire atteinte. */
  fin?: string;
}

export function etatExplorationVide(): EtatExploration {
  return { decouverts: [], ouverts: [], pieges: {}, tresorsPris: [], sujetsVus: [], enigmes: {}, paliers: [], evolutions: [], fouilles: [] };
}

export function nouvellePartie(dm: DonneesMonde, etat: EtatMonde, groupe: Personnage[], gen: Generateur): PartieMonde {
  return { dm, etat: { ...etat, exploration: etatExplorationVide() }, groupe, gen };
}

// ---------------------------------------------------------------------------
// Outils internes
// ---------------------------------------------------------------------------

function resultat(): CompteRendu {
  return { ok: true, jets: [], constats: [], revele: [], narrations: [] };
}

function refus(raison: string): CompteRendu {
  return { ...resultat(), ok: false, refus: raison };
}

const CARAC_COMPETENCE: Record<string, Caracteristique> = {
  acrobaties: 'dex', arcanes: 'int', athletisme: 'for', discretion: 'dex', dressage: 'sag', escamotage: 'dex', histoire: 'int', intimidation: 'cha',
  intuition: 'sag', investigation: 'int', medecine: 'sag', nature: 'int', perception: 'sag', persuasion: 'cha', religion: 'int', representation: 'cha',
  survie: 'sag', tromperie: 'cha',
};

function bonusTest(a: Personnage, test: Competence | Caracteristique): number {
  const comp = a.fiche.competences[test as Competence];
  if (comp) return comp.bonus;
  return a.fiche.caracteristiques[test as Caracteristique]?.modificateur ?? 0;
}

/** Le personnage désigné, ou celui du groupe qui a le meilleur bonus (« le groupe fouille »). */
function choisir(p: PartieMonde, test: Competence | Caracteristique, id?: string): Personnage | undefined {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (id) return vivants.find((a) => a.id === id);
  return [...vivants].sort((x, y) => bonusTest(y, test) - bonusTest(x, test))[0];
}

/** Un test d20 du personnage, consigné dans le compte rendu. */
function tester(p: PartieMonde, r: CompteRendu, a: Personnage, test: Competence | Caracteristique, dd: number, opts: { avantage?: boolean; desavantage?: boolean } = {}): Jet {
  const bonus = bonusTest(a, test);
  const t = testD20({ bonus, dd, ...opts }, p.gen);
  const jet: Jet = { qui: a.id, nom: a.nom, test, dd, des: t.des, bonus, total: t.total, reussite: t.reussite, ...opts };
  r.jets.push(jet);
  return jet;
}

function appliquer(p: PartieMonde, r: CompteRendu, effets: EffetMonde[]): void {
  const avant = { faits: p.etat.faits.length, narrations: p.etat.narrations.length, jauges: { ...p.etat.jauges } };
  appliquerEffets(effets, p.etat, p.dm);
  r.revele.push(...p.etat.faits.slice(avant.faits));
  r.narrations.push(...p.etat.narrations.slice(avant.narrations));
  for (const [id, v] of Object.entries(p.etat.jauges)) if (v !== avant.jauges[id]) franchirPaliers(p, r, id, avant.jauges[id] ?? 0, v);
}

/** Paliers de jauge franchis dans le sens du changement : narration et effets, une seule fois chacun. */
function franchirPaliers(p: PartieMonde, r: CompteRendu, id: string, avant: number, apres: number): void {
  const j = p.dm.jauges.get(id);
  if (!j) return;
  for (const palier of j.paliers) {
    const franchi = apres > avant ? avant < palier.seuil && apres >= palier.seuil : avant > palier.seuil && apres <= palier.seuil;
    const cle = `${id}:${palier.seuil}`;
    if (!franchi || p.etat.exploration.paliers.includes(cle)) continue;
    p.etat.exploration.paliers.push(cle);
    r.constats.push(`${j.nom} : ${palier.nom}.`);
    r.narrations.push(palier.narration);
    appliquer(p, r, palier.effets);
  }
}

function changerJauge(p: PartieMonde, r: CompteRendu, id: string, delta: number): void {
  appliquer(p, r, [{ jauge: { id, delta } }]);
}

/** Événements, évolutions de jauge sur condition, quêtes et fin : à vérifier après chaque action. */
function suites(p: PartieMonde, r: CompteRendu): void {
  for (let tour = 0; tour < 10; tour++) {
    let change = false;
    for (const j of p.dm.jauges.values()) {
      j.evolution.forEach((ev, i) => {
        const cle = `${j.id}:${i}`;
        if (ev.declencheur !== 'condition' || !ev.condition || p.etat.exploration.evolutions.includes(cle) || !evaluerCondition(ev.condition, p.etat)) return;
        p.etat.exploration.evolutions.push(cle);
        changerJauge(p, r, j.id, ev.delta);
        change = true;
      });
    }
    for (const ev of p.dm.evenements.values()) {
      if (ev.declencheur !== 'condition' || !jouable(p, ev.id, ev.unique, ev.condition)) continue;
      jouerEvenement(p, r, ev.id);
      change = true;
    }
    if (!change) break;
  }
  avancerQuetes(p.etat, p.dm);
  if (!p.etat.fin) {
    for (const f of p.dm.fins.values()) {
      if (evaluerCondition(f.condition, p.etat)) {
        p.etat.fin = f.id;
        break;
      }
    }
  }
  if (p.etat.fin) r.fin = p.etat.fin;
}

function jouable(p: PartieMonde, id: string, unique: boolean, condition?: Parameters<typeof evaluerCondition>[0]): boolean {
  if (unique && p.etat.evenementsJoues.includes(id)) return false;
  return !condition || evaluerCondition(condition, p.etat);
}

function jouerEvenement(p: PartieMonde, r: CompteRendu, id: string): void {
  const ev = p.dm.evenements.get(id)!;
  if (!p.etat.evenementsJoues.includes(id)) p.etat.evenementsJoues.push(id);
  r.narrations.push(ev.narration);
  appliquer(p, r, ev.effets);
}

// ---------------------------------------------------------------------------
// Lieux et passages
// ---------------------------------------------------------------------------

export interface Sortie {
  vers: string;
  nom: string;
  type: string;
  description?: string;
  /** Identifiant du passage, dans le sens où l'auteur l'a déclaré : `lien:<de>><vers>`. */
  cle: string;
  /** Passage caché pas encore trouvé : invisible pour le groupe. */
  cache: boolean;
  /** Condition du monde non remplie (passage bloqué, éboulé, scellé…). */
  bloque: boolean;
  verrou?: { dd: number; cle?: string; ouvert: boolean };
}

type Lien = Lieu['liens'][number];
const cleLien = (de: string, vers: string) => `lien:${de}>${vers}`;

/** Passages qui partent d'un lieu, avec leur définition : liens déclarés ici, liens à double sens déclarés en face, parent et enfants. */
function passages(p: PartieMonde, lieu: string): { sortie: Sortie; lien?: Lien }[] {
  const ex = p.etat.exploration;
  const res: { sortie: Sortie; lien?: Lien }[] = [];
  const ajouter = (vers: string, cle: string, lien?: Lien) => {
    const dest = p.dm.lieux.get(vers);
    if (!dest || res.some((x) => x.sortie.vers === vers)) return;
    const debloque = p.etat.debloques.includes(vers);
    res.push({
      lien,
      sortie: {
        vers,
        nom: dest.nom,
        type: lien?.type ?? 'passage',
        description: lien?.description,
        cle,
        cache: !!lien?.cache && !ex.decouverts.includes(cle) && !debloque,
        bloque: !!lien?.condition && !evaluerCondition(lien.condition, p.etat) && !debloque,
        verrou: lien?.verrou ? { dd: lien.verrou.dd, cle: lien.verrou.cle, ouvert: ex.ouverts.includes(cle) || debloque } : undefined,
      },
    });
  };
  const ici = p.dm.lieux.get(lieu);
  for (const l of ici?.liens ?? []) ajouter(l.vers, cleLien(lieu, l.vers), l);
  for (const autre of p.dm.lieux.values()) {
    for (const l of autre.liens) if (l.vers === lieu && l.sens === 'double') ajouter(autre.id, cleLien(autre.id, lieu), l);
  }
  for (const enfant of p.dm.lieux.values()) if (enfant.parent === lieu) ajouter(enfant.id, cleLien(lieu, enfant.id));
  if (ici?.parent) ajouter(ici.parent, cleLien(ici.parent, lieu));
  return res;
}

export function sortiesDe(p: PartieMonde, lieu: string): Sortie[] {
  return passages(p, lieu).map((x) => x.sortie);
}

/** Choses cachées d'un lieu, avec la compétence qui permet de les trouver. */
function cachettes(p: PartieMonde, lieu: string): { cle: string; dd: number; competence: Competence; libelle: string; reveler: () => void }[] {
  const ex = p.etat.exploration;
  const res: ReturnType<typeof cachettes> = [];
  for (const { sortie: s, lien } of passages(p, lieu)) {
    if (!s.cache || !lien?.cache) continue;
    res.push({ cle: s.cle, dd: lien.cache.dd, competence: lien.cache.competence, libelle: `un passage caché vers ${s.nom}${lien.description ? ` (${lien.description})` : ''}`, reveler: () => ex.decouverts.push(s.cle) });
  }
  for (const t of p.dm.tresors.values()) {
    const cle = `tresor:${t.id}`;
    if (t.lieu !== lieu || !t.acces.cache || ex.decouverts.includes(cle) || ex.tresorsPris.includes(t.id)) continue;
    if (t.condition && !evaluerCondition(t.condition, p.etat)) continue;
    res.push({ cle, dd: t.acces.cache.dd, competence: t.acces.cache.competence, libelle: `${t.nom} (${t.description})`, reveler: () => ex.decouverts.push(cle) });
  }
  for (const pg of p.dm.pieges.values()) {
    const cle = `piege:${pg.id}`;
    if (pg.lieu !== lieu || ex.decouverts.includes(cle) || ex.pieges[pg.id]) continue;
    res.push({ cle, dd: pg.detection.dd, competence: pg.detection.competence, libelle: `un piège : ${pg.nom} (${pg.resume})`, reveler: () => ex.decouverts.push(cle) });
  }
  const ici = p.dm.lieux.get(lieu);
  for (const f of ici?.faits ?? []) {
    const d = f.decouverte;
    if (d.auto || !d.dd || p.etat.faits.includes(f.fait)) continue;
    if (d.condition && !evaluerCondition(d.condition, p.etat)) continue;
    res.push({ cle: `fait:${f.fait}`, dd: d.dd, competence: (d.competence ?? 'investigation') as Competence, libelle: 'un indice', reveler: () => p.etat.faits.push(f.fait) });
  }
  return res;
}

/** Ce que la perception passive du groupe repère sans jet (SRD : Perception passive = 10 + bonus). */
function perceptionPassive(p: PartieMonde, r: CompteRendu): void {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (!vivants.length) return;
  const meilleur = [...vivants].sort((x, y) => y.fiche.perceptionPassive - x.fiche.perceptionPassive)[0]!;
  for (const c of cachettes(p, p.etat.lieu)) {
    if (c.competence !== 'perception' || meilleur.fiche.perceptionPassive < c.dd) continue;
    c.reveler();
    if (c.cle.startsWith('fait:')) r.revele.push(c.cle.slice(5));
    r.constats.push(`${meilleur.nom} remarque ${c.libelle} (perception passive ${meilleur.fiche.perceptionPassive}, DD ${c.dd}).`);
  }
}

/** Entrée dans un lieu : visite, faits évidents, jauges du lieu, événements d'entrée, rencontres. */
function entrer(p: PartieMonde, r: CompteRendu, lieu: Lieu): void {
  p.etat.lieu = lieu.id;
  if (!p.etat.lieuxVisites.includes(lieu.id)) p.etat.lieuxVisites.push(lieu.id);
  for (const f of lieu.faits) {
    const d = f.decouverte;
    if ((d.auto ?? !d.dd) && (!d.condition || evaluerCondition(d.condition, p.etat)) && !p.etat.faits.includes(f.fait)) {
      p.etat.faits.push(f.fait);
      r.revele.push(f.fait);
    }
  }
  for (const j of p.dm.jauges.values()) for (const ev of j.evolution) if (ev.declencheur === 'lieu' && ev.lieu === lieu.id) changerJauge(p, r, j.id, ev.delta);
  for (const ev of p.dm.evenements.values()) {
    if (ev.declencheur === 'entree-lieu' && ev.lieu === lieu.id && jouable(p, ev.id, ev.unique, ev.condition)) jouerEvenement(p, r, ev.id);
  }
  perceptionPassive(p, r);
  declencherRencontre(p, r, lieu, 'entree');
}

function declencherRencontre(p: PartieMonde, r: CompteRendu, lieu: Lieu, declencheur: 'entree' | 'exploration' | 'repos'): void {
  if (r.combat) return;
  for (const rc of lieu.rencontres) {
    if (rc.declencheur !== declencheur) continue;
    if (rc.unique && p.etat.rencontresFaites.includes(rc.id)) continue;
    if (rc.condition && !evaluerCondition(rc.condition, p.etat)) continue;
    const def = p.dm.rencontres.get(rc.id);
    if (!def) continue;
    if (def.type === 'combat' || def.type === 'mixte') r.combat = rc.id;
    r.constats.push(`Rencontre : ${def.nom}.`);
    r.narrations.push(def.intro);
    return;
  }
}

/** Début de l'histoire : l'arrivée au lieu de départ (faits évidents, événements, perception, rencontre). */
export function commencer(p: PartieMonde): CompteRendu {
  const r = resultat();
  entrer(p, r, p.dm.lieux.get(p.dm.monde.depart.lieu)!);
  suites(p, r);
  return r;
}

/** Aller vers un lieu voisin (passage, porte, escalier, entrée d'un bâtiment, retour au lieu parent…). */
export function aller(p: PartieMonde, vers: string): CompteRendu {
  const s = sortiesDe(p, p.etat.lieu).find((x) => x.vers === vers);
  if (!s || s.cache) return refus(`Aucun passage connu ne mène d'ici à « ${p.dm.lieux.get(vers)?.nom ?? vers} ».`);
  if (s.bloque) return refus(`Le passage vers ${s.nom} est infranchissable pour l'instant${s.description ? ` (${s.description})` : ''}.`);
  if (s.verrou && !s.verrou.ouvert) {
    return refus(`Le passage vers ${s.nom} est verrouillé (DD ${s.verrou.dd}${s.verrou.cle ? `, clé : ${p.dm.objets.get(s.verrou.cle)?.nom ?? s.verrou.cle}` : ''}).`);
  }
  const r = resultat();
  entrer(p, r, p.dm.lieux.get(vers)!);
  suites(p, r);
  return r;
}

// ---------------------------------------------------------------------------
// Fouiller, ouvrir, désarmer, prendre
// ---------------------------------------------------------------------------

/**
 * Fouille du lieu : un jet par compétence utile, contre chaque chose cachée. Une seule fouille par lieu et par jour :
 * on ne relance pas les dés jusqu'à réussir (on revient après un repos long).
 */
export function fouiller(p: PartieMonde, personnage?: string): CompteRendu {
  const fouille = `${p.etat.lieu}:${p.etat.jour}`;
  if (p.etat.exploration.fouilles.includes(fouille)) return refus('Le groupe a déjà fouillé ce lieu aujourd\'hui : il faudra revenir après un repos.');
  p.etat.exploration.fouilles.push(fouille);
  const r = resultat();
  const caches = cachettes(p, p.etat.lieu);
  const competences = [...new Set(caches.map((c) => c.competence))];
  if (!competences.length) competences.push('investigation');
  for (const comp of competences) {
    const a = choisir(p, comp, personnage);
    if (!a) return refus(personnage ? `« ${personnage} » ne peut pas fouiller.` : 'Personne ne peut fouiller.');
    // Le DD d'une fouille reste secret : le joueur ne doit pas savoir s'il reste quelque chose à trouver.
    const jet = tester(p, r, a, comp, 0);
    jet.ddSecret = true;
    const trouves = caches.filter((x) => x.competence === comp && jet.total >= x.dd);
    jet.reussite = trouves.length > 0;
    for (const c of trouves) {
      c.reveler();
      if (c.cle.startsWith('fait:')) r.revele.push(c.cle.slice(5));
      r.constats.push(`${a.nom} trouve ${c.libelle}.`);
    }
  }
  if (!r.constats.length) r.constats.push('La fouille ne donne rien.');
  declencherRencontre(p, r, p.dm.lieux.get(p.etat.lieu)!, 'exploration');
  suites(p, r);
  return r;
}

export type CibleOuvrir = { lien: string } | { tresor: string };

/** Ouvrir un passage verrouillé ou un trésor fermé : avec la clé, en crochetant (outils de voleur) ou en forçant. */
export function ouvrir(p: PartieMonde, cible: CibleOuvrir, methode: 'cle' | 'crocheter' | 'forcer', personnage?: string): CompteRendu {
  const ex = p.etat.exploration;
  let verrou: { dd: number; cle?: string } | undefined;
  let cle: string;
  let nom: string;
  let tresor: Tresor | undefined;
  if ('lien' in cible) {
    const s = sortiesDe(p, p.etat.lieu).find((x) => x.vers === cible.lien && !x.cache);
    if (!s) return refus('Aucun passage connu de ce côté.');
    if (!s.verrou || s.verrou.ouvert) return refus(`Le passage vers ${s.nom} n'est pas verrouillé.`);
    verrou = s.verrou;
    cle = s.cle;
    nom = `le passage vers ${s.nom}`;
  } else {
    tresor = p.dm.tresors.get(cible.tresor);
    if (!tresor || tresor.lieu !== p.etat.lieu || !tresorVisible(p, tresor)) return refus("Il n'y a rien de tel ici.");
    verrou = tresor.acces.verrou;
    cle = `tresor:${tresor.id}`;
    if (!verrou || ex.ouverts.includes(cle)) return refus(`${tresor.nom} n'est pas fermé.`);
    nom = tresor.nom;
  }
  const r = resultat();
  if (methode === 'cle') {
    if (!verrou.cle || !(p.etat.inventaire[verrou.cle] ?? 0)) return refus(`Le groupe n'a pas la clé de ${nom}.`);
    ex.ouverts.push(cle);
    r.constats.push(`La clé ouvre ${nom}.`);
    suites(p, r);
    return r;
  }
  const test: Competence = methode === 'crocheter' ? 'escamotage' : 'athletisme';
  const a = choisir(p, test, personnage);
  if (!a) return refus('Personne ne peut le faire.');
  if (methode === 'crocheter' && !aOutils(p, a)) return refus(`${a.nom} n'a pas d'outils de voleur pour crocheter.`);
  const jet = tester(p, r, a, test, verrou.dd);
  if (jet.reussite) {
    ex.ouverts.push(cle);
    r.constats.push(`${a.nom} ${methode === 'crocheter' ? 'crochète' : 'force'} ${nom}.`);
  } else r.constats.push(`${a.nom} ne parvient pas à ${methode === 'crocheter' ? 'crocheter' : 'forcer'} ${nom}.`);
  // Un contenant piégé se déclenche quand on l'ouvre sans clé, s'il n'a pas été désarmé.
  if (tresor?.acces.piege && !ex.pieges[tresor.acces.piege]) declencher(p, r, p.dm.pieges.get(tresor.acces.piege)!, a);
  suites(p, r);
  return r;
}

function aOutils(p: PartieMonde, a: Personnage): boolean {
  return a.outils.includes('outils-de-voleur') || (p.etat.inventaire['outils-de-voleur'] ?? 0) > 0;
}

function tresorVisible(p: PartieMonde, t: Tresor): boolean {
  if (t.condition && !evaluerCondition(t.condition, p.etat)) return false;
  return !t.acces.cache || p.etat.exploration.decouverts.includes(`tresor:${t.id}`);
}

/** Désarmer un piège repéré. Sans l'outil requis : désavantage. Un échec de 5 ou plus le déclenche. */
export function desarmer(p: PartieMonde, piege: string, personnage?: string): CompteRendu {
  const pg = p.dm.pieges.get(piege);
  const ex = p.etat.exploration;
  if (!pg || pg.lieu !== p.etat.lieu || !ex.decouverts.includes(`piege:${piege}`)) return refus("Aucun piège repéré de ce genre ici.");
  if (ex.pieges[piege]) return refus(`${pg.nom} est déjà ${ex.pieges[piege] === 'desarme' ? 'désarmé' : 'déclenché'}.`);
  const r = resultat();
  const a = choisir(p, pg.desarmement.competence, personnage);
  if (!a) return refus('Personne ne peut le faire.');
  const sansOutil = !!pg.desarmement.outil && !(pg.desarmement.outil === 'outils-de-voleur' ? aOutils(p, a) : a.outils.includes(pg.desarmement.outil));
  const jet = tester(p, r, a, pg.desarmement.competence, pg.desarmement.dd, sansOutil ? { desavantage: true } : {});
  if (jet.reussite) {
    ex.pieges[piege] = 'desarme';
    r.constats.push(`${a.nom} désarme ${pg.nom}.`);
  } else if (jet.total <= pg.desarmement.dd - 5) {
    r.constats.push(`${a.nom} se trompe : ${pg.nom} se déclenche.`);
    declencher(p, r, pg, a);
  } else r.constats.push(`${a.nom} n'arrive pas à désarmer ${pg.nom}, mais ne le déclenche pas.`);
  suites(p, r);
  return r;
}

/** Un piège se déclenche sur un personnage : sauvegarde, dégâts, états, effets du monde. */
export function declencher(p: PartieMonde, r: CompteRendu, pg: Piege, victime: Personnage): void {
  const ex = p.etat.exploration;
  if (!pg.reinitialisation) ex.pieges[pg.id] = 'declenche';
  if (!ex.decouverts.includes(`piege:${pg.id}`)) ex.decouverts.push(`piege:${pg.id}`);
  r.narrations.push(pg.declenchement);
  let facteur = 1;
  if (pg.sauvegarde) {
    const s = pg.sauvegarde;
    const bonus = victime.fiche.sauvegardes[s.caracteristique].bonus;
    const t = testD20({ bonus, dd: s.dd }, p.gen);
    r.jets.push({ qui: victime.id, nom: victime.nom, test: `sauvegarde de ${s.caracteristique}`, dd: s.dd, des: t.des, bonus, total: t.total, reussite: t.reussite });
    if (t.reussite) facteur = s.moitieSiReussite ? 0.5 : 0;
  }
  const degats = pg.degats.map((d) => ({ type: d.type, total: Math.floor(lancer(d.des, p.gen).total * facteur) }));
  const total = degats.reduce((s, d) => s + d.total, 0);
  if (total > 0) {
    victime.pv = Math.max(0, victime.pv - total);
    r.constats.push(`${victime.nom} subit ${degats.map((d) => `${d.total} dégâts de ${d.type}`).join(' et ')} (PV ${victime.pv}/${victime.fiche.pvMax})${victime.pv === 0 ? ' et tombe inconscient' : ''}.`);
  }
  if (pg.etats.length && facteur === 1) r.constats.push(`${victime.nom} est ${pg.etats.join(', ')}.`);
  appliquer(p, r, pg.effets);
}

/** Prendre le contenu d'un trésor : il doit être visible, ouvert, non gardé. */
export function prendre(p: PartieMonde, tresor: string): CompteRendu {
  const t = p.dm.tresors.get(tresor);
  const ex = p.etat.exploration;
  if (!t || t.lieu !== p.etat.lieu || !tresorVisible(p, t)) return refus("Il n'y a rien de tel ici.");
  if (ex.tresorsPris.includes(t.id)) return refus(`${t.nom} a déjà été vidé.`);
  if (t.acces.verrou && !ex.ouverts.includes(`tresor:${t.id}`)) return refus(`${t.nom} est fermé (DD ${t.acces.verrou.dd}).`);
  if (t.gardien && !p.etat.rencontresFaites.includes(t.gardien)) return refus(`${t.nom} est gardé : ${p.dm.rencontres.get(t.gardien)?.nom ?? t.gardien}.`);
  const r = resultat();
  // Un piège encore armé se déclenche sur qui se sert (sauf trésor ouvert à la clé, déjà déclenché dans ouvrir sinon).
  if (t.acces.piege && !ex.pieges[t.acces.piege] && !t.acces.verrou) declencher(p, r, p.dm.pieges.get(t.acces.piege)!, choisir(p, 'perception')!);
  ex.tresorsPris.push(t.id);
  const gains: string[] = [];
  const pc = t.contenu.pieces;
  if (pc) {
    const po = (pc.po ?? 0) + (pc.pa ?? 0) / 10 + (pc.pc ?? 0) / 100;
    if (po) p.etat.pieces = Number((p.etat.pieces + po).toFixed(2));
    if (po) gains.push(`${po} po`);
  }
  for (const o of t.contenu.objets) {
    p.etat.inventaire[o.objet] = (p.etat.inventaire[o.objet] ?? 0) + o.quantite;
    gains.push(`${o.quantite > 1 ? `${o.quantite} × ` : ''}${nomObjet(p, o.objet)}`);
  }
  for (const tb of t.contenu.tables) for (let i = 0; i < tb.jets; i++) gains.push(...tirerTable(p, tb.table));
  if (t.indice && !p.etat.faits.includes(t.indice)) {
    p.etat.faits.push(t.indice);
    r.revele.push(t.indice);
  }
  r.constats.push(`Dans ${t.nom} : ${gains.filter(Boolean).join(', ') || 'rien de valeur'}.`);
  suites(p, r);
  return r;
}

function nomObjet(p: PartieMonde, id: string): string {
  return p.dm.objets.get(id)?.nom ?? id;
}

/** Un tirage sur une table de butin (entrées pondérées, tables imbriquées). */
function tirerTable(p: PartieMonde, id: string, profondeur = 0): string[] {
  const t = p.dm.tables.get(id);
  if (!t || profondeur > 5) return [];
  const total = t.entrees.reduce((s, e) => s + e.poids, 0);
  let x = p.gen() * total;
  const e = t.entrees.find((en) => (x -= en.poids) < 0) ?? t.entrees[t.entrees.length - 1]!;
  if (e.rien) return [];
  if (e.table) return tirerTable(p, e.table, profondeur + 1);
  if (e.pieces) {
    const n = lancer(e.pieces.des, p.gen).total;
    const po = e.pieces.unite === 'po' ? n : e.pieces.unite === 'pa' ? n / 10 : n / 100;
    p.etat.pieces = Number((p.etat.pieces + po).toFixed(2));
    return [`${n} ${e.pieces.unite}`];
  }
  if (e.objet) {
    const q = e.quantite ?? 1;
    p.etat.inventaire[e.objet] = (p.etat.inventaire[e.objet] ?? 0) + q;
    return [`${q > 1 ? `${q} × ` : ''}${nomObjet(p, e.objet)}`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Énigmes, repos, issue des rencontres, test libre
// ---------------------------------------------------------------------------

export function repondreEnigme(p: PartieMonde, enigme: string, reponse: unknown): CompteRendu {
  const e = p.dm.enigmes.get(enigme);
  const ex = p.etat.exploration;
  if (!e || e.lieu !== p.etat.lieu) return refus("Il n'y a pas d'énigme de ce genre ici.");
  if (ex.enigmes[enigme] === 'resolue') return refus(`${e.nom} est déjà résolue.`);
  const r = resultat();
  if (verifierEnigme(e, reponse)) {
    ex.enigmes[enigme] = 'resolue';
    r.constats.push(`Bonne réponse : ${e.nom} est résolue.${e.recompense.resume ? ` ${e.recompense.resume}` : ''}`);
    appliquer(p, r, e.recompense.effets);
    if (e.recompense.tresor) {
      // Le trésor de l'énigme devient accessible : trouvé et ouvert.
      for (const k of [`tresor:${e.recompense.tresor}`]) {
        if (!ex.decouverts.includes(k)) ex.decouverts.push(k);
        if (!ex.ouverts.includes(k)) ex.ouverts.push(k);
      }
    }
  } else {
    ex.enigmes[enigme] = 'echouee';
    r.ok = true;
    r.constats.push(`Mauvaise réponse à ${e.nom}.${e.echec?.resume ? ` ${e.echec.resume}` : ''}`);
    if (e.echec?.piege) {
      const pg = p.dm.pieges.get(e.echec.piege);
      if (pg && !ex.pieges[pg.id]) declencher(p, r, pg, choisir(p, 'perception')!);
    }
    appliquer(p, r, e.echec?.effets ?? []);
  }
  suites(p, r);
  return r;
}

/** Indices d'une énigme jusqu'à un niveau (1 : vague, 3 : clair). Un indice avec jet ne se donne qu'en le réussissant. */
export function indiceEnigme(p: PartieMonde, enigme: string, niveau: number, personnage?: string): CompteRendu {
  const e = p.dm.enigmes.get(enigme);
  if (!e || e.lieu !== p.etat.lieu) return refus("Il n'y a pas d'énigme de ce genre ici.");
  const r = resultat();
  const indices = (p.etat.exploration.indices ??= {});
  indices[enigme] = Math.max(indices[enigme] ?? 0, niveau);
  for (const i of e.indices.filter((x) => x.niveau <= niveau)) {
    if (i.competence && i.dd) {
      const a = choisir(p, i.competence, personnage);
      if (!a || !tester(p, r, a, i.competence, i.dd).reussite) continue;
    }
    r.constats.push(`Indice : ${i.texte}`);
  }
  return r;
}

export function seReposer(p: PartieMonde, duree: 'court' | 'long'): CompteRendu {
  const lieu = p.dm.lieux.get(p.etat.lieu)!;
  if (lieu.repos === 'impossible') return refus(`Impossible de se reposer ici (${lieu.nom}).`);
  const r = resultat();
  // Chaque héros récupère selon les règles du repos (PV, usages d'aptitudes, emplacements ; jamais les potions).
  for (const a of p.groupe) {
    const changes = recuperer(a, duree, p.gen);
    if (changes.length) r.constats.push(`${a.nom} récupère : ${changes.join(', ')}.`);
  }
  if (duree === 'long') {
    p.etat.jour += 1;
    r.constats.push(`Le groupe se repose une nuit entière${lieu.repos === 'dangereux' ? ', malgré le danger' : ''}. Jour ${p.etat.jour}.`);
    for (const j of p.dm.jauges.values()) for (const ev of j.evolution) if (ev.declencheur === 'repos-long' || ev.declencheur === 'jour') changerJauge(p, r, j.id, ev.delta);
    for (const ev of p.dm.evenements.values()) if ((ev.declencheur === 'repos' || ev.declencheur === 'jour') && (!ev.lieu || ev.lieu === lieu.id) && jouable(p, ev.id, ev.unique, ev.condition)) jouerEvenement(p, r, ev.id);
  } else if (!r.constats.length) r.constats.push('Une courte halte.');
  declencherRencontre(p, r, lieu, 'repos');
  suites(p, r);
  return r;
}

/** Issue d'une rencontre : victoire (combat gagné), alternative réussie (négocier, ruser…) ou fuite. */
export function issueRencontre(p: PartieMonde, rencontre: string, issue: { type: 'victoire'; px?: number } | { type: 'alternative'; id: string; personnage?: string } | { type: 'fuite' }): CompteRendu {
  const def = p.dm.rencontres.get(rencontre);
  if (!def) return refus(`Rencontre inconnue : ${rencontre}.`);
  const r = resultat();
  if (issue.type === 'fuite') {
    r.constats.push(`Le groupe se dérobe à ${def.nom}.`);
    return r;
  }
  if (issue.type === 'alternative') {
    const alt = def.alternatives.find((x) => x.id === issue.id);
    if (!alt) return refus(`Pas d'issue « ${issue.id} » pour ${def.nom}.`);
    if (alt.condition && !evaluerCondition(alt.condition, p.etat)) return refus(`${alt.nom} : ce n'est pas possible pour l'instant.`);
    if (alt.jet) {
      const a = choisir(p, alt.jet.competence, issue.personnage);
      if (!a) return refus('Personne ne peut le tenter.');
      if (!tester(p, r, a, alt.jet.competence, alt.jet.dd).reussite) {
        r.ok = false;
        r.constats.push(`${alt.nom} échoue.`);
        if (def.type === 'combat' || def.type === 'mixte') r.combat = rencontre;
        return r;
      }
    }
    r.constats.push(`${alt.nom} : ${alt.resume}`);
    appliquer(p, r, alt.effets);
  } else {
    r.constats.push(`Victoire : ${def.nom}${issue.px ? ` (${issue.px} PX)` : ''}.`);
    if (issue.px) p.etat.xp += issue.px;
    appliquer(p, r, def.effetsVictoire);
    for (const tb of def.butin.tables) r.constats.push(`Butin : ${tirerTable(p, tb).join(', ') || 'rien'}.`);
  }
  if (!p.etat.rencontresFaites.includes(rencontre)) p.etat.rencontresFaites.push(rencontre);
  suites(p, r);
  return r;
}

/** Test libre (escalader, nager, se souvenir…) : un jet contre un DD de 5 à 30, sans effet sur le monde. */
export function testLibre(p: PartieMonde, competence: Competence | Caracteristique, dd: number, personnage?: string): CompteRendu {
  if (!Number.isInteger(dd) || dd < 5 || dd > 30) return refus('Le DD doit être un entier de 5 à 30.');
  if (!(competence in CARAC_COMPETENCE) && !['for', 'dex', 'con', 'int', 'sag', 'cha'].includes(competence)) return refus(`Test inconnu : ${competence}.`);
  const a = choisir(p, competence, personnage);
  if (!a) return refus('Personne ne peut le tenter.');
  const r = resultat();
  const jet = tester(p, r, a, competence, dd);
  r.constats.push(`${a.nom} ${jet.reussite ? 'réussit' : 'échoue'}.`);
  return r;
}

