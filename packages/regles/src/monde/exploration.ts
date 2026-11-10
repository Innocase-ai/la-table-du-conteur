// Exploration d'un monde : les verbes que le conteur (M4) appelle et que le moteur valide, résout et applique.
// Aucun LLM ici : chaque verbe prend une partie et une demande, lance les dés sur les vraies fiches du groupe,
// applique les effets du monde et renvoie un compte rendu factuel, que le conteur raconte. Voir docs/M4-CONTEUR.md.
import { lancer, type Generateur } from '../des';
import type { Donnees } from '../donnees';
import { tirerDepouilles } from './depouilles';
import type { Jet } from '../noyau/types';
import { recuperer, type Personnage } from '../personnage';
import type { Fiche } from '../fiche';
import type { Caracteristique, Competence } from '../schemas';
import { testD20 } from '../tests-d20';
import { appliquerEffets, avancerQuetes, evaluerCondition, TEMOIGNAGES_MAX, verifierEnigme, type EtatMonde, type IssueRencontre, type PnjVu, type Temoignage } from './etat';
import { momentDe, pnjPresents } from './presence';
import { controlerReponse } from './reponses';
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
  /** Autres issues de rencontre tentées sans succès : `<rencontre>:<alternative>` (on ne retente pas la même). */
  essais?: string[];
  /**
   * Les PNJ qui ont surpris le groupe en train de crocheter ou de forcer, par identifiant : le jour (ils restent en alerte toute
   * la journée), ce qu'ils ont vu, et s'ils l'ont déjà dit au groupe en conversation (`confronte`). Absent des sauvegardes anciennes.
   */
  vus?: Record<string, { jour: number; objet: string; methode: 'crocheter' | 'forcer'; confronte?: boolean }>;
  /** Le récit d'arrivée déjà lu, par lieu : `base` ou `v<n>` (la variante). Il se relit quand la variante active change. Absent des sauvegardes anciennes. */
  arrivees?: Record<string, string>;
  /**
   * Les tentatives d'influence ratées : `<pnj>:<manière>` → l'heure de jeu absolue (`jour × 24 + heure`) de l'échec. Le SRD
   * demande d'attendre 24 h avant d'exhorter de nouveau de la même manière. Absent des sauvegardes anciennes.
   */
  influenceRatee?: Record<string, number>;
  // La mémoire du groupe (voir `MemoireGroupe` dans etat.ts) : tout est facultatif, les anciennes sauvegardes n'ont rien de cela.
  /** Comment chaque rencontre s'est dénouée (la dernière issue l'emporte). */
  issues?: Record<string, IssueRencontre>;
  /** Les PNJ à qui le groupe a parlé. */
  pnjVus?: Record<string, PnjVu>;
  /** Les rencontres dénouées sous les yeux de PNJ présents (les plus récentes, plafonnées). */
  temoignages?: Temoignage[];
}

/** Consigne comment une rencontre s'est dénouée, avec les PNJ présents à ce moment (ils en sont les témoins). */
export function consignerIssue(p: PartieMonde, rencontre: string, type: IssueRencontre['type'], alternative?: string): void {
  const x = p.etat.exploration;
  const jour = p.etat.jour;
  const lieu = p.etat.lieu;
  (x.issues ??= {})[rencontre] = { type, ...(alternative ? { alternative } : {}), jour, lieu };
  const liste = (x.temoignages ??= []);
  liste.push({ genre: type, ref: rencontre, lieu, jour, presents: pnjPresents(p).map((n) => n.id) });
  if (liste.length > TEMOIGNAGES_MAX) liste.splice(0, liste.length - TEMOIGNAGES_MAX);
}

/** Consigne que le groupe parle à un PNJ (salutation, sujet ou parole libre). */
export function consignerParole(p: PartieMonde, pnj: string): void {
  const vus = (p.etat.exploration.pnjVus ??= {});
  const v = vus[pnj];
  if (v) {
    v.dernierJour = p.etat.jour;
    v.paroles += 1;
  } else vus[pnj] = { premierJour: p.etat.jour, dernierJour: p.etat.jour, paroles: 1 };
}

export interface PartieMonde {
  dm: DonneesMonde;
  etat: EtatMonde & { exploration: EtatExploration };
  groupe: Personnage[];
  gen: Generateur;
  /** Le SRD (type et FP des monstres) : sans lui, pas de dépouilles automatiques. */
  srd?: Donnees;
}

export type { Jet };

export { momentDe };

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
  /** Combien des premières narrations sont les paroles du PNJ (les suivantes, d'un événement ou d'un palier, sont du récit). */
  paroles?: number;
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
function choisir(p: PartieMonde, test: Competence | Caracteristique, id?: string, qualifie?: (a: Personnage) => boolean): Personnage | undefined {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (id) return vivants.find((a) => a.id === id);
  // Quand l'action demande un équipement (crocheter : les outils de voleur), on préfère ceux qui l'ont, même au bonus plus faible.
  const equipes = qualifie ? vivants.filter(qualifie) : [];
  return [...(equipes.length ? equipes : vivants)].sort((x, y) => bonusTest(y, test) - bonusTest(x, test))[0];
}

/** Un test d20 du personnage, consigné dans le compte rendu. */
function tester(p: PartieMonde, r: CompteRendu, a: Personnage, test: Competence | Caracteristique, dd: number, opts: { avantage?: boolean; desavantage?: boolean } = {}): Jet {
  const bonus = bonusTest(a, test);
  const t = testD20({ bonus, dd, ...opts }, p.gen);
  const jet: Jet = { qui: a.id, nom: a.nom, test, dd, des: t.des, bonus, total: t.total, reussite: t.reussite, ...opts };
  r.jets.push(jet);
  return jet;
}

/** Applique des effets du monde en versant au compte rendu ce qu'ils produisent (faits, narrations, paliers de jauge). */
export function appliquer(p: PartieMonde, r: CompteRendu, effets: EffetMonde[]): void {
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

/** Événements, évolutions de jauge sur condition, quêtes et fin : à vérifier après chaque action (exploration et dialogue). */
export function suites(p: PartieMonde, r: CompteRendu): void {
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
      // Un événement attaché à un lieu ne se joue que là.
      if (ev.declencheur !== 'condition' || (ev.lieu && ev.lieu !== p.etat.lieu) || !jouable(p, ev.id, ev.unique, ev.condition)) continue;
      jouerEvenement(p, r, ev.id);
      change = true;
    }
    if (!change) break;
  }
  // Les étapes et récompenses de quête ont leurs effets : leurs narrations, faits et paliers vont au compte rendu.
  const avantQuetes = { faits: p.etat.faits.length, narrations: p.etat.narrations.length, jauges: { ...p.etat.jauges } };
  avancerQuetes(p.etat, p.dm);
  r.revele.push(...p.etat.faits.slice(avantQuetes.faits));
  r.narrations.push(...p.etat.narrations.slice(avantQuetes.narrations));
  for (const [id, v] of Object.entries(p.etat.jauges)) if (v !== avantQuetes.jauges[id]) franchirPaliers(p, r, id, avantQuetes.jauges[id] ?? 0, v);
  lancerRencontresEnAttente(p, r);
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
  /** Le texte de l'auteur pour ce passage, vu de ce côté (absent si l'auteur n'en a pas écrit). */
  description?: string;
  /** Ce que le joueur lit sous le bouton : le texte de l'auteur, à défaut (lieu déjà visité) le résumé du lieu d'arrivée, sinon rien. */
  apercu: string;
  /** Le groupe est déjà allé là-bas. */
  visite: boolean;
  /** Heures de trajet (0 à l'intérieur d'un lieu). */
  heures: number;
  /** Identifiant du passage, dans le sens où l'auteur l'a déclaré : `lien:<de>><vers>`. */
  cle: string;
  /** Passage caché pas encore trouvé : invisible pour le groupe. */
  cache: boolean;
  /** Condition du monde non remplie (passage bloqué, éboulé, scellé…). */
  bloque: boolean;
  verrou?: { dd: number; cle?: string; ouvert: boolean };
  /** La destination n'existe pas (encore) dans ce monde : le passage est montré, grisé, avec le texte de l'auteur. */
  absent?: { motif: 'bientot' | 'pack'; texte: string };
}

type Lien = Lieu['liens'][number];
const cleLien = (de: string, vers: string) => `lien:${de}>${vers}`;

/** Passages qui partent d'un lieu, avec leur définition : liens déclarés ici, liens à double sens déclarés en face, parent et enfants. */
function passages(p: PartieMonde, lieu: string): { sortie: Sortie; lien?: Lien }[] {
  const ex = p.etat.exploration;
  const res: { sortie: Sortie; lien?: Lien }[] = [];
  // `retour` : le lien est déclaré de l'autre côté ; on lit alors le texte « vu d'ici » (`retour`) avant celui de l'auteur.
  // `parDefaut` : texte d'un lien automatique (parent / enfant), qui n'a pas de définition propre.
  const ajouter = (vers: string, cle: string, lien?: Lien, retour = false, parDefaut?: string) => {
    const dest = p.dm.lieux.get(vers);
    if (res.some((x) => x.sortie.vers === vers)) return;
    if (!dest) {
      // Suite pas encore écrite, ou d'un pack absent : le passage reste visible, fermé, avec ce que l'auteur en dit.
      if (lien?.absent && !retour)
        res.push({ lien, sortie: { vers, nom: lien.absent.nom, type: lien.type, description: lien.absent.texte, apercu: lien.absent.texte, visite: false, heures: lien.heures, cle, cache: false, bloque: false, absent: { motif: lien.absent.motif, texte: lien.absent.texte } } });
      return;
    }
    const debloque = p.etat.debloques.includes(vers);
    const description = (retour ? (lien?.retour ?? lien?.description) : lien?.description) || parDefaut || undefined;
    res.push({
      lien,
      sortie: {
        vers,
        nom: dest.nom,
        type: lien?.type ?? 'passage',
        description,
        // Le résumé d'un lieu jamais visité peut en dire trop (il est écrit pour l'arrivée) : on ne le montre qu'après.
        apercu: description ?? (p.etat.lieuxVisites.includes(vers) ? dest.resume : ''),
        visite: p.etat.lieuxVisites.includes(vers),
        heures: lien?.heures ?? 0,
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
    for (const l of autre.liens) if (l.vers === lieu && l.sens === 'double') ajouter(autre.id, cleLien(autre.id, lieu), l, true);
  }
  for (const enfant of p.dm.lieux.values()) if (enfant.parent === lieu) ajouter(enfant.id, cleLien(lieu, enfant.id), undefined, false, enfant.accroche);
  const parent = ici?.parent ? p.dm.lieux.get(ici.parent) : undefined;
  // « Le pont » → « le pont » au milieu d'une phrase (les noms propres, eux, gardent leur majuscule).
  const minuscule = (nom: string) => nom.replace(/^(Le |La |Les |L['’])/, (a) => a.toLowerCase());
  if (ici && parent) ajouter(parent.id, cleLien(parent.id, lieu), undefined, false, `Quitter ${minuscule(ici.nom)} pour revenir à « ${parent.nom} », d'où l'on rejoint les autres lieux.`);
  return res;
}

export function sortiesDe(p: PartieMonde, lieu: string): Sortie[] {
  return passages(p, lieu).map((x) => x.sortie);
}

/** Choses cachées d'un lieu, avec la compétence qui permet de les trouver. */
function cachettes(p: PartieMonde, lieu: string): { cle: string; dd: number; competence: Competence; libelle: string; reveler: () => void; passif?: boolean }[] {
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
    // Un piège ne se repère pas d'office en entrant (perception passive) : il faut fouiller, avec un jet qui peut échouer.
    res.push({ cle, dd: pg.detection.dd, competence: pg.detection.competence, libelle: `un piège : ${pg.nom} (${pg.resume})`, reveler: () => ex.decouverts.push(cle), passif: false });
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
    if (c.passif === false || c.competence !== 'perception' || meilleur.fiche.perceptionPassive < c.dd) continue;
    c.reveler();
    if (c.cle.startsWith('fait:')) r.revele.push(c.cle.slice(5));
    r.constats.push(`${meilleur.nom} remarque ${c.libelle} (perception passive ${meilleur.fiche.perceptionPassive}, DD ${c.dd}).`);
  }
}

/** Entrée dans un lieu : visite, faits évidents, jauges du lieu, événements d'entrée, rencontres. */
/** Le récit d'arrivée en vigueur dans ce lieu (la première variante vraie, sinon le récit de base) et sa clé. */
export function arriveeDe(p: PartieMonde, lieu: Lieu): { cle: string; texte: string } | undefined {
  const v = lieu.arriveeVariantes.findIndex((x) => evaluerCondition(x.condition, p.etat));
  if (v >= 0) return { cle: `v${v}`, texte: lieu.arriveeVariantes[v]!.texte };
  const base = lieu.arrivee?.trim();
  return base ? { cle: 'base', texte: base } : undefined;
}

function entrer(p: PartieMonde, r: CompteRendu, lieu: Lieu): void {
  p.etat.lieu = lieu.id;
  if (!p.etat.lieuxVisites.includes(lieu.id)) p.etat.lieuxVisites.push(lieu.id);
  // Le récit d'arrivée vient avant tout le reste de ce que l'entrée déclenche : à la première visite, et quand une variante a pris le relais.
  const arrivee = arriveeDe(p, lieu);
  const vues = (p.etat.exploration.arrivees ??= {});
  if (arrivee && vues[lieu.id] !== arrivee.cle) {
    vues[lieu.id] = arrivee.cle;
    r.narrations.unshift(arrivee.texte);
  }
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
    // Une rencontre « aléatoire » survient une fois sur trois en arrivant au lieu ou en s'y reposant.
    if (rc.declencheur === 'aleatoire') {
      if (declencheur === 'exploration' || lancer('1d6', p.gen).total > 2) continue;
    } else if (rc.declencheur !== declencheur) continue;
    if (rc.unique && p.etat.rencontresFaites.includes(rc.id)) continue;
    if (rc.condition && !evaluerCondition(rc.condition, p.etat)) continue;
    if (lancerRencontre(p, r, rc.id)) return;
  }
}

/**
 * Met la rencontre en scène : son introduction, puis la scène de rencontre (combattre, une autre issue, se replier). Une
 * rencontre sociale ou d'exploration sans autre issue n'est qu'un récit : elle est faite aussitôt.
 */
function lancerRencontre(p: PartieMonde, r: CompteRendu, id: string): boolean {
  const def = p.dm.rencontres.get(id);
  if (!def) return false;
  if (def.type === 'combat' || def.type === 'mixte' || def.alternatives.length) r.combat = id;
  else if (!p.etat.rencontresFaites.includes(id)) p.etat.rencontresFaites.push(id);
  r.constats.push(`Rencontre : ${def.nom}.`);
  r.narrations.push(def.intro);
  return true;
}

/** Une rencontre qu'un lieu déclare non unique peut se rejouer ; les autres ne se jouent qu'une fois. */
function rencontreRepetable(dm: DonneesMonde, id: string): boolean {
  return [...dm.lieux.values()].some((l) => l.rencontres.some((rc) => rc.id === id && !rc.unique));
}

/** Les rencontres que des effets ont déclenchées (échec d'une énigme, piège…) : une seule à la fois si c'est un combat. */
function lancerRencontresEnAttente(p: PartieMonde, r: CompteRendu): void {
  const attente = p.etat.rencontresEnAttente;
  while (attente?.length && !r.combat) {
    const id = attente.shift()!;
    if (p.etat.rencontresFaites.includes(id) && !rencontreRepetable(p.dm, id)) continue;
    lancerRencontre(p, r, id);
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
  if (s.absent) return refus(s.absent.texte);
  if (s.bloque) return refus(`Le passage vers ${s.nom} est infranchissable pour l'instant${s.description ? ` (${s.description})` : ''}.`);
  if (s.verrou && !s.verrou.ouvert) {
    return refus(`Le passage vers ${s.nom} est verrouillé (DD ${s.verrou.dd}${s.verrou.cle ? `, clé : ${p.dm.objets.get(s.verrou.cle)?.nom ?? s.verrou.cle}` : ''}).`);
  }
  const r = resultat();
  declencherPiegeDePassage(p, r);
  if (s.heures) avancerHeures(p, r, s.heures);
  entrer(p, r, p.dm.lieux.get(vers)!);
  suites(p, r);
  return r;
}

/** Le temps passe (un trajet) : à minuit, un nouveau jour commence, avec ses évolutions de jauge et ses événements. */
export function avancerHeures(p: PartieMonde, r: CompteRendu, heures: number): void {
  let h = (p.etat.heure ?? 8) + heures;
  while (h >= 24) {
    h -= 24;
    p.etat.jour += 1;
    r.constats.push(`Le jour se lève : jour ${p.etat.jour}.`);
    nouveauJour(p, r, false);
  }
  p.etat.heure = h;
}

/** Ce qu'apporte un nouveau jour : évolutions de jauge « jour » (et « repos-long » après une nuit de repos), événements. */
function nouveauJour(p: PartieMonde, r: CompteRendu, repos: boolean): void {
  for (const j of p.dm.jauges.values()) for (const ev of j.evolution) if ((repos && ev.declencheur === 'repos-long') || ev.declencheur === 'jour') changerJauge(p, r, j.id, ev.delta);
  for (const ev of p.dm.evenements.values()) if (((repos && ev.declencheur === 'repos') || ev.declencheur === 'jour') && (!ev.lieu || ev.lieu === p.etat.lieu) && jouable(p, ev.id, ev.unique, ev.condition)) jouerEvenement(p, r, ev.id);
}

// ---------------------------------------------------------------------------
// Fouiller, ouvrir, désamorcer, prendre
// ---------------------------------------------------------------------------

/**
 * Fouille du lieu : un jet par compétence utile, contre chaque chose cachée. Une seule fouille par lieu et par jour :
 * on ne relance pas les dés jusqu'à réussir (on revient après un repos long).
 */
/** Regarder autour de soi : relire le récit du lieu (sans temps ni jet). Sans récit d'arrivée, le résumé du lieu. */
export function regarder(p: PartieMonde): CompteRendu {
  const lieu = p.dm.lieux.get(p.etat.lieu);
  const r = resultat();
  if (!lieu) return refus('Aucun lieu ici.');
  r.narrations.push(arriveeDe(p, lieu)?.texte ?? lieu.resume);
  return r;
}

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
    // Dans une phrase (« Bran force le tiroir de la caisse »), l'article du nom perd sa majuscule.
    nom = tresor.nom.replace(/^(Le|La|Les|L’|L') ?/, (m) => m.toLowerCase());
  }
  const r = resultat();
  if (methode === 'cle') {
    if (!verrou.cle || !(p.etat.inventaire[verrou.cle] ?? 0)) return refus(`Le groupe n'a pas la clé de ${nom}.`);
    ex.ouverts.push(cle);
    r.constats.push(`La clé ouvre ${nom}.`);
    declencherPiegeLibre(p, r, undefined);
    suites(p, r);
    return r;
  }
  const test: Competence = methode === 'crocheter' ? 'escamotage' : 'athletisme';
  const a = choisir(p, test, personnage, methode === 'crocheter' ? (x) => aOutils(p, x) : undefined);
  if (!a) return refus('Personne ne peut le faire.');
  if (methode === 'crocheter' && !aOutils(p, a)) return refus(`${a.nom} n'a pas d'outils de voleur pour crocheter.`);
  // Des témoins qui voient le groupe l'arrêtent net : pas de jet d'ouverture, pas de piège, et ils restent en alerte.
  if (repererTemoins(p, r, a, methode, nom)) {
    suites(p, r);
    return r;
  }
  const jet = tester(p, r, a, test, verrou.dd);
  if (jet.reussite) {
    ex.ouverts.push(cle);
    r.constats.push(`${a.nom} ${methode === 'crocheter' ? 'crochète' : 'force'} ${nom}.`);
  } else r.constats.push(`${a.nom} ne parvient pas à ${methode === 'crocheter' ? 'crocheter' : 'forcer'} ${nom}.`);
  // Un contenant piégé se déclenche quand on l'ouvre sans clé, s'il n'a pas été désamorcé.
  if (tresor?.acces.piege && !ex.pieges[tresor.acces.piege]) declencher(p, r, p.dm.pieges.get(tresor.acces.piege)!, a);
  declencherPiegeLibre(p, r, a);
  suites(p, r);
  return r;
}

/** Les verbes du constat quand des témoins surprennent le groupe (l'écran de crochetage les reconnaît : voir `crochetage-regles.ts`). */
export const VERBES_OUVRIR = { crocheter: 'crocheter', forcer: 'forcer' } as const;

/**
 * Qui regarde ? Les PNJ présents dans le lieu (les compagnons qui suivent le groupe ne comptent pas) ont une chance de voir le
 * groupe s'attaquer à la serrure : un jet de Discrétion du héros contre un DD que le joueur ne voit pas, `10 + 2` par témoin en
 * plus du premier (au plus 18), et `+5` pour forcer, qui fait du bruit. Sans témoin, personne ne regarde : pas de jet.
 *
 * Repéré, **le groupe est arrêté net** : l'ouverture n'a pas lieu (ni jet, ni piège), chaque témoin perd de l'attitude envers le
 * groupe (−10 pour crocheter, −15 pour forcer) et reste **en alerte toute la journée** : s'ils sont encore là, impossible de
 * retenter sous leur nez (sans jet). Au prochain dialogue, le PNJ en parle (voir `parler`) ; une persuasion, une tromperie ou une
 * intimidation réussie le calme (voir `influencer`). Renvoie `true` quand l'action est arrêtée.
 */
function repererTemoins(p: PartieMonde, r: CompteRendu, a: Personnage, methode: 'crocheter' | 'forcer', nom: string): boolean {
  const temoins = pnjPresents(p).filter((n) => !p.etat.escortes?.includes(n.id));
  if (!temoins.length) return false;
  const verbe = VERBES_OUVRIR[methode];
  const liste = (l: { nom: string }[]) => (l.length === 1 ? l[0]!.nom : `${l.slice(0, -1).map((n) => n.nom).join(', ')} et ${l[l.length - 1]!.nom}`);
  // Déjà surpris aujourd'hui : ceux qui sont là gardent le groupe à l'œil.
  const alertes = temoins.filter((n) => p.etat.exploration.vus?.[n.id]?.jour === p.etat.jour);
  if (alertes.length) {
    r.constats.push(`${liste(alertes)} ${alertes.length === 1 ? 'vous surveille' : 'vous surveillent'} de près : impossible de ${verbe} ${nom} sous ${alertes.length === 1 ? 'son' : 'leur'} nez.`);
    return true;
  }
  const dd = Math.min(18, 10 + 2 * (temoins.length - 1)) + (methode === 'forcer' ? 5 : 0);
  const jet = tester(p, r, a, 'discretion', dd);
  jet.ddSecret = true;
  if (jet.reussite) return false;
  r.constats.push(`${liste(temoins)} ${temoins.length === 1 ? 'vous a' : 'vous ont'} vus ${verbe} ${nom} et ${temoins.length === 1 ? 'vous arrête' : 'vous arrêtent'} net.`);
  const vus = (p.etat.exploration.vus ??= {});
  for (const n of temoins) vus[n.id] = { jour: p.etat.jour, objet: nom, methode };
  appliquer(p, r, temoins.map((n) => ({ attitude: { pnj: n.id, delta: methode === 'forcer' ? -15 : -10 } })));
  return true;
}

function aOutils(p: PartieMonde, a: Personnage): boolean {
  return a.outils.includes('outils-de-voleur') || (p.etat.inventaire['outils-de-voleur'] ?? 0) > 0;
}

function tresorVisible(p: PartieMonde, t: Tresor): boolean {
  if (t.condition && !evaluerCondition(t.condition, p.etat)) return false;
  return !t.acces.cache || p.etat.exploration.decouverts.includes(`tresor:${t.id}`);
}

/** Désamorcer un piège repéré. Sans l'outil requis : désavantage. Un échec de 5 ou plus le déclenche. */
export function desarmer(p: PartieMonde, piege: string, personnage?: string): CompteRendu {
  const pg = p.dm.pieges.get(piege);
  const ex = p.etat.exploration;
  if (!pg || pg.lieu !== p.etat.lieu || !ex.decouverts.includes(`piege:${piege}`)) return refus("Aucun piège repéré de ce genre ici.");
  if (ex.pieges[piege]) return refus(`${pg.nom} est déjà ${ex.pieges[piege] === 'desarme' ? 'désamorcé' : 'déclenché'}.`);
  const r = resultat();
  const a = choisir(p, pg.desarmement.competence, personnage);
  if (!a) return refus('Personne ne peut le faire.');
  const sansOutil = !!pg.desarmement.outil && !(pg.desarmement.outil === 'outils-de-voleur' ? aOutils(p, a) : a.outils.includes(pg.desarmement.outil));
  const jet = tester(p, r, a, pg.desarmement.competence, pg.desarmement.dd, sansOutil ? { desavantage: true } : {});
  if (jet.reussite) {
    ex.pieges[piege] = 'desarme';
    r.constats.push(`${a.nom} désamorce ${pg.nom}.`);
  } else if (jet.total <= pg.desarmement.dd - 5) {
    r.constats.push(`${a.nom} se trompe : ${pg.nom} se déclenche.`);
    declencher(p, r, pg, a);
  } else r.constats.push(`${a.nom} n'arrive pas à désamorcer ${pg.nom}, mais ne le déclenche pas.`);
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

const piegesRattaches = new WeakMap<DonneesMonde, Set<string>>();

/** Les pièges que quelque chose garde déjà : un contenant piégé (`tresor.acces.piege`) ou l'échec d'une énigme (`enigme.echec.piege`). */
function rattaches(dm: DonneesMonde): Set<string> {
  let s = piegesRattaches.get(dm);
  if (!s) {
    s = new Set();
    for (const t of dm.tresors.values()) if (t.acces.piege) s.add(t.acces.piege);
    for (const e of dm.enigmes.values()) if (e.echec?.piege) s.add(e.echec.piege);
    piegesRattaches.set(dm, s);
  }
  return s;
}

/**
 * Un piège de ce lieu que rien ne garde et que le groupe n'a pas trouvé se déclenche dès que le groupe prend ou ouvre quelque
 * chose ici (un seul à la fois : le suivant attend la prochaine fois). Trouvé, désamorcé ou déjà déclenché, il ne fait plus rien.
 */
function declencherPiegeLibre(p: PartieMonde, r: CompteRendu, victime: Personnage | undefined): void {
  const ex = p.etat.exploration;
  const garde = rattaches(p.dm);
  const pg = [...p.dm.pieges.values()].find((x) => x.lieu === p.etat.lieu && !x.passage && !garde.has(x.id) && !ex.pieges[x.id] && !ex.decouverts.includes(`piege:${x.id}`));
  const cible = victime ?? choisir(p, 'perception');
  if (pg && cible) declencher(p, r, pg, cible);
}

/** Un piège de passage de ce lieu, ni trouvé ni déjà déclenché, part quand le groupe s'en va : qui fouille d'abord l'évite. */
function declencherPiegeDePassage(p: PartieMonde, r: CompteRendu): void {
  const ex = p.etat.exploration;
  const pg = [...p.dm.pieges.values()].find((x) => x.passage && x.lieu === p.etat.lieu && !ex.pieges[x.id] && !ex.decouverts.includes(`piege:${x.id}`));
  const cible = choisir(p, 'perception');
  if (pg && cible) declencher(p, r, pg, cible);
}

/** Verse le contenu d'un trésor au groupe (pièces, objets, tirages, indice) et le marque vidé. */
function viderTresor(p: PartieMonde, r: CompteRendu, t: Tresor): void {
  p.etat.exploration.tresorsPris.push(t.id);
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
}

/**
 * Le butin fixe d'une victoire (`butin.tresors`) : la réserve de l'ennemi, ici même, sans verrou ni piège, est prise aussitôt ;
 * une réserve cachée, fermée ou piégée est seulement révélée (il reste à l'ouvrir ou la désamorcer).
 */
function butinFixe(p: PartieMonde, r: CompteRendu, rencontre: string): void {
  const def = p.dm.rencontres.get(rencontre);
  for (const id of def?.butin.tresors ?? []) {
    const t = p.dm.tresors.get(id);
    const ex = p.etat.exploration;
    if (!t || ex.tresorsPris.includes(t.id) || (t.condition && !evaluerCondition(t.condition, p.etat))) continue;
    if (t.gardien && t.gardien !== rencontre && !p.etat.rencontresFaites.includes(t.gardien)) continue;
    if (!t.acces.verrou && !t.acces.piege && t.lieu === p.etat.lieu) {
      viderTresor(p, r, t);
      continue;
    }
    if (t.acces.cache && !ex.decouverts.includes(`tresor:${t.id}`)) ex.decouverts.push(`tresor:${t.id}`);
    r.constats.push(`Vous remarquez : ${t.nom}.`);
  }
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
  const victime = choisir(p, 'perception');
  if (victime && t.acces.piege && !ex.pieges[t.acces.piege] && !t.acces.verrou) declencher(p, r, p.dm.pieges.get(t.acces.piege)!, victime);
  declencherPiegeLibre(p, r, undefined);
  viderTresor(p, r, t);
  suites(p, r);
  return r;
}

function nomObjet(p: PartieMonde, id: string): string {
  return p.dm.objets.get(id)?.nom ?? p.srd?.objets.get(id)?.nom ?? id;
}

/** Les dépouilles des adversaires vaincus (bourse, matériel selon leur nature) : un résumé unique, versé au sac. */
function depouilles(p: PartieMonde, r: CompteRendu, rencontre: string): void {
  const def = p.dm.rencontres.get(rencontre);
  if (!p.srd || !def || !def.butin.depouilles) return;
  const d = tirerDepouilles(p.srd, def.monstres, p.gen);
  const lignes: string[] = [];
  if (d.pieces > 0) {
    p.etat.pieces = Number((p.etat.pieces + d.pieces).toFixed(2));
    lignes.push(`${d.pieces} po`);
  }
  for (const [objet, q] of Object.entries(d.objets)) {
    p.etat.inventaire[objet] = (p.etat.inventaire[objet] ?? 0) + q;
    lignes.push(`${q > 1 ? `${q} × ` : ''}${nomObjet(p, objet)}`);
  }
  if (lignes.length) r.constats.push(`Dépouilles : ${lignes.join(', ')}.`);
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
  // Une réponse mal formée n'est pas une mauvaise réponse : refusée, sans aucune conséquence.
  const malFormee = controlerReponse(e, reponse);
  if (malFormee) return refus(malFormee);
  const r = resultat();
  if (verifierEnigme(e, reponse)) {
    ex.enigmes[enigme] = 'resolue';
    // Ce qui arrive se raconte (récit), le verdict se constate : le récit passe avant, comme la suite d'une scène.
    if (e.recompense.resume) r.narrations.push(e.recompense.resume);
    r.constats.push(`Bonne réponse : ${e.nom} est résolue.`);
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
    // Le récit de l'échec précède la rencontre qu'il déclenche (dont l'introduction se raconte à la suite).
    if (e.echec?.resume) r.narrations.push(e.echec.resume);
    r.constats.push(`Mauvaise réponse à ${e.nom}.`);
    if (e.echec?.piege) {
      const pg = p.dm.pieges.get(e.echec.piege);
      const victime = choisir(p, 'perception');
      if (pg && victime && !ex.pieges[pg.id]) declencher(p, r, pg, victime);
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

/** Le refus d'une nuit hors d'un lieu sûr (le conteur le raconte ; le bouton « Dormir » le dit au joueur). */
export const MESSAGE_PAS_DE_NUIT = (lieu: string) => `On ne dort pas ici (${lieu}) : trop exposé. Une halte est possible ; pour une nuit entière, il faut un abri sûr (auberge, camp, refuge).`;

/** `abri` : une nuit payée à un PNJ (chambre, refuge) se passe chez lui, quel que soit le lieu. */
/** Le début du constat d'une nuit qu'une rencontre interrompt (l'écran de sommeil le reconnaît : voir `sommeil-regles.ts`). */
export const PHRASE_NUIT_INTERROMPUE = 'Le groupe s’endort, mais la nuit est interrompue';

export function seReposer(p: PartieMonde, duree: 'court' | 'long', options: { abri?: boolean } = {}): CompteRendu {
  const lieu = p.dm.lieux.get(p.etat.lieu)!;
  if (lieu.repos === 'impossible' && !options.abri) return refus(`Impossible de se reposer ici (${lieu.nom}).`);
  // Une halte (repos court) se fait presque partout ; une nuit entière demande un abri sûr : auberge, camp, refuge.
  if (duree === 'long' && lieu.repos !== 'sur' && !options.abri) return refus(MESSAGE_PAS_DE_NUIT(lieu.nom));
  const r = resultat();
  // La rencontre du repos se tire d'abord : un combat l'interrompt (SRD 5.2.1). Une halte interrompue ne rapporte rien ;
  // une nuit interrompue s'arrête au milieu et ne donne que les bénéfices d'un repos court (au moins une heure de repos).
  const rencontre = resultat();
  declencherRencontre(p, rencontre, lieu, 'repos');
  const interrompu = !!rencontre.combat;
  const recuperation = (sorte: 'court' | 'long') => {
    // Chaque héros récupère selon les règles du repos (PV, usages d'aptitudes, emplacements ; jamais les potions).
    for (const a of p.groupe) {
      const changes = recuperer(a, sorte, p.gen);
      if (changes.length) r.constats.push(`${a.nom} récupère : ${changes.join(', ')}.`);
    }
  };
  if (duree === 'long' && interrompu) {
    const nuit = (24 - (p.etat.heure ?? 8)) + 8;
    const heures = Math.max(1, Math.floor(nuit / 2));
    r.constats.push(`${PHRASE_NUIT_INTERROMPUE} au bout de ${heures} h : le repos ne vaut qu'une halte.`);
    recuperation('court');
    avancerHeures(p, r, heures);
  } else if (duree === 'long') {
    recuperation('long');
    p.etat.jour += 1;
    p.etat.heure = 8;
    r.constats.push(`Le groupe se repose une nuit entière. Jour ${p.etat.jour}.`);
    nouveauJour(p, r, true);
  } else if (interrompu) {
    r.constats.push('La halte est interrompue : personne ne récupère.');
  } else {
    recuperation('court');
    if (!r.constats.length) r.constats.push('Une courte halte.');
  }
  // La rencontre se raconte après le repos (ou ce qu'il en reste).
  r.constats.push(...rencontre.constats);
  r.narrations.push(...rencontre.narrations);
  if (rencontre.combat) r.combat = rencontre.combat;
  suites(p, r);
  return r;
}

/** Issue d'une rencontre : victoire (combat gagné), alternative réussie (négocier, ruser…) ou fuite. */
export function issueRencontre(
  p: PartieMonde,
  rencontre: string,
  issue: { type: 'victoire'; px?: number } | { type: 'alternative'; id: string; personnage?: string } | { type: 'fuite' } | { type: 'defaite' },
): CompteRendu {
  const def = p.dm.rencontres.get(rencontre);
  if (!def) return refus(`Rencontre inconnue : ${rencontre}.`);
  const r = resultat();
  // Défaite : le groupe n'est pas achevé (l'histoire continue), mais il paie. Les héros reviennent à 1 PV des heures plus
  // tard, dépouillés de la moitié de leur or ; la rencontre n'est pas faite (elle attend toujours au même endroit).
  if (issue.type === 'defaite') {
    for (const a of p.groupe) a.pv = Math.max(1, a.pv);
    const perte = Math.floor(p.etat.pieces / 2);
    p.etat.pieces -= perte;
    consignerIssue(p, rencontre, 'defaite');
    r.constats.push(`Défaite : ${def.nom}. Le groupe reprend connaissance bien plus tard, meurtri${perte ? `, et délesté de ${perte} po` : ''}.`);
    avancerHeures(p, r, 8);
    suites(p, r);
    return r;
  }
  if (issue.type === 'fuite') {
    consignerIssue(p, rencontre, 'fuite');
    r.constats.push(`Le groupe se dérobe à ${def.nom}.`);
    return r;
  }
  if (issue.type === 'alternative') {
    const alt = def.alternatives.find((x) => x.id === issue.id);
    if (!alt) return refus(`Pas d'issue « ${issue.id} » pour ${def.nom}.`);
    if (alt.condition && !evaluerCondition(alt.condition, p.etat)) return refus(`${alt.nom} : ce n'est pas possible pour l'instant.`);
    const essai = `${rencontre}:${alt.id}`;
    if (p.etat.exploration.essais?.includes(essai)) return refus(`${alt.nom} : déjà tenté, sans succès.`);
    if (alt.jet) {
      const a = choisir(p, alt.jet.competence, issue.personnage);
      if (!a) return refus('Personne ne peut le tenter.');
      if (!tester(p, r, a, alt.jet.competence, alt.jet.dd).reussite) {
        r.constats.push(`${alt.nom} échoue.`);
        // L'échec a un prix : ses effets s'appliquent.
        if (alt.echec?.length) appliquer(p, r, alt.echec);
        if (alt.echecResout) {
          // Fail forward : la rencontre se dénoue quand même, autrement et plus cher.
          consignerIssue(p, rencontre, 'alternative', alt.id);
          if (!p.etat.rencontresFaites.includes(rencontre)) p.etat.rencontresFaites.push(rencontre);
          suites(p, r);
          return r;
        }
        r.ok = false;
        // La rencontre attend toujours : combattre, tenter une autre issue ou se replier.
        (p.etat.exploration.essais ??= []).push(essai);
        r.combat = rencontre;
        suites(p, r);
        return r;
      }
    }
    r.constats.push(`${alt.nom} : ${alt.resume}`);
    consignerIssue(p, rencontre, 'alternative', alt.id);
    appliquer(p, r, alt.effets);
  } else {
    consignerIssue(p, rencontre, 'victoire');
    r.constats.push(`Victoire : ${def.nom}${issue.px ? ` (${issue.px} PX)` : ''}.`);
    // L'XP d'un combat se partage entre les héros (SRD 5.2.1) ; l'XP du monde (quêtes, effets) est celle de chacun.
    // Une rencontre qui revient (aléatoire, répétable) ne rapporte pas de PX une seconde fois : pas de farm.
    if (issue.px && !p.etat.rencontresFaites.includes(rencontre)) p.etat.xp += Math.floor(issue.px / Math.max(1, p.groupe.length));
    appliquer(p, r, def.effetsVictoire);
    for (const tb of def.butin.tables) r.constats.push(`Butin : ${tirerTable(p, tb).join(', ') || 'rien'}.`);
    butinFixe(p, r, rencontre);
    depouilles(p, r, rencontre);
  }
  if (!p.etat.rencontresFaites.includes(rencontre)) p.etat.rencontresFaites.push(rencontre);
  suites(p, r);
  return r;
}

/** Accepter une quête proposée : elle devient active (si ses prérequis sont remplis) et commence à sa première étape. */
export function accepterQuete(p: PartieMonde, id: string): CompteRendu {
  const q = p.etat.quetes[id];
  const def = p.dm.quetes.get(id);
  if (!def || !q) return refus('Aucune quête de ce nom ne vous a été proposée.');
  if (q.statut !== 'proposee') return refus(`« ${def.nom} » n'est pas en attente : elle est déjà ${q.statut === 'active' ? 'en cours' : 'close'}.`);
  if (def.prerequis && !evaluerCondition(def.prerequis, p.etat)) return refus(`« ${def.nom} » : les conditions pour l'accepter ne sont pas réunies.`);
  const r = resultat();
  r.constats.push(`Quête acceptée : ${def.nom}.`);
  appliquer(p, r, [{ quete: { id, statut: 'active' } }]);
  suites(p, r);
  return r;
}

/**
 * Joue des effets du monde en dehors d'un verbe (choix d'un dilemme, écho différé) : les constats d'abord, puis les effets
 * et leurs suites (quêtes, paliers, rencontres déclenchées). `base` reprend un compte rendu déjà commencé (un jet).
 */
export function jouerEffets(p: PartieMonde, constats: string[], effets: EffetMonde[], base: CompteRendu = resultat()): CompteRendu {
  base.constats.push(...constats);
  appliquer(p, base, effets);
  suites(p, base);
  return base;
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

