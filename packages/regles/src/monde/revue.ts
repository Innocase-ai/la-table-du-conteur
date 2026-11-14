// La revue de cohérence d'un monde, sans LLM : ce que l'auteur relit à la main après les agents (secrets qui fuient, noms inventés,
// fiches qui se contredisent) devient des contrôles déterministes. Le jugement reste humain : chaque alerte se lit avec son extrait,
// et se rejette si c'est un faux positif (`revue.json`). Les alertes sont des `Diagnostic` de source « revue ».
import type { Canon, Revue } from './canon';
import type { Diagnostic, RefEntite } from './diagnostics';
import { examensDe } from './examens-donnees';
import { dilemmesDe } from './dilemmes-donnees';
import { evenementsChoixDe } from './evenements-choix-donnees';
import { questionsDe } from './codex-donnees';
import { normaliser, savoirsDe } from './savoirs-donnees';
import type { DonneesMonde } from './schemas';

/** Un texte que le joueur ou le conteur lit librement (sans condition de savoir) : c'est là qu'un secret ne doit pas fuir. */
export interface ChampLibre {
  entite: RefEntite;
  /** Où, dans l'entité (`['couleur', 2, 'texte']`). */
  chemin: (string | number)[];
  /** Le nom du champ, pour l'affichage. */
  champ: string;
  texte: string;
}

/**
 * Tous les champs de texte libres d'un monde : passé, liens et couleur des PNJ, salutations, sujets ouverts, accroches, ambiances,
 * visuels, passages, introductions de rencontres, narrations d'événements, examens, énoncés…
 */
export function champsLibres(dm: DonneesMonde): ChampLibre[] {
  const res: ChampLibre[] = [];
  const ajouter = (type: string, id: string, chemin: (string | number)[], champ: string, texte: string | undefined) => {
    if (texte && texte.trim()) res.push({ entite: { type, id }, chemin, champ, texte });
  };
  for (const s of savoirsDe(dm).savoirs) {
    ajouter('savoirs', s.pnj, ['passe'], 'passé', s.passe);
    s.liens.forEach((l, i) => {
      ajouter('savoirs', s.pnj, ['liens', i, 'nature'], 'lien (nature)', l.nature);
      ajouter('savoirs', s.pnj, ['liens', i, 'opinion'], 'lien (opinion)', l.opinion);
    });
    // Une confidence verrouillée (`acces`) n'est pas libre ; sans accès, elle l'est.
    s.couleur.forEach((c, i) => {
      if (c.acces.attitudeMin === undefined && !c.acces.condition) ajouter('savoirs', s.pnj, ['couleur', i, 'texte'], `couleur « ${c.id} »`, c.texte);
      ajouter('savoirs', s.pnj, ['couleur', i, 'evasif'], `esquive de « ${c.id} »`, c.evasif);
    });
    s.sait.forEach((x, i) => ajouter('savoirs', s.pnj, ['sait', i, 'evasif'], `esquive de « ${x.id} »`, x.evasif));
  }
  for (const p of dm.pnj.values()) {
    ajouter('pnj', p.id, ['salutations', 'neutre'], 'salutation', p.salutations.neutre);
    ajouter('pnj', p.id, ['salutations', 'amical'], 'salutation amicale', p.salutations.amical);
    ajouter('pnj', p.id, ['salutations', 'hostile'], 'salutation hostile', p.salutations.hostile);
    // Un sujet ouvert (ni condition ni attitude minimale) est lu par tout joueur qui parle au PNJ : un secret n'a rien à y faire. Un sujet
    // verrouillé est justement l'endroit où le secret se dit.
    p.sujets.forEach((s, i) => {
      if (s.condition || s.attitudeMin !== undefined) return;
      ajouter('pnj', p.id, ['sujets', i, 'question'], `question « ${s.id} »`, s.question);
      ajouter('pnj', p.id, ['sujets', i, 'reponse'], `réponse « ${s.id} »`, s.reponse);
      // Une variante à condition est lue par tout joueur dont l'état la rend vraie : le secret n'a rien à y faire non plus.
      s.variantes.forEach((v, k) => ajouter('pnj', p.id, ['sujets', i, 'variantes', k, 'reponse'], `réponse « ${s.id} » (variante ${k + 1})`, v.reponse));
    });
  }
  for (const l of dm.lieux.values()) {
    ajouter('lieux', l.id, ['resume'], 'résumé', l.resume);
    ajouter('lieux', l.id, ['accroche'], 'accroche', l.accroche);
    ajouter('lieux', l.id, ['ambiance'], 'ambiance', l.ambiance);
    // Le récit d'arrivée est lu tel quel par le joueur : c'est là qu'un secret ne doit pas fuir.
    ajouter('lieux', l.id, ['arrivee'], "récit d'arrivée", l.arrivee);
    l.arriveeVariantes.forEach((v, i) => ajouter('lieux', l.id, ['arriveeVariantes', i, 'texte'], `récit d'arrivée (variante ${i + 1})`, v.texte));
    // Le texte qui sert à dessiner l'image du lieu : ce qu'on y voit, donc ce que le joueur verra. (`description`, elle, est pour le
    // MJ : elle peut dire ce qu'on y trouve, donc elle n'est pas surveillée.)
    ajouter('lieux', l.id, ['visuel'], 'visuel (image)', l.visuel);
    l.liens.forEach((k, i) => {
      ajouter('lieux', l.id, ['liens', i, 'description'], `passage vers « ${k.vers} »`, k.description);
      ajouter('lieux', l.id, ['liens', i, 'retour'], `retour depuis « ${k.vers} »`, k.retour);
    });
  }
  // Les mises en scène et narrations que le jeu raconte telles quelles quand la rencontre ou l'événement se déclenche.
  for (const r of dm.rencontres.values()) ajouter('rencontres', r.id, ['intro'], 'introduction', r.intro);
  for (const e of dm.evenements.values()) ajouter('evenements', e.id, ['narration'], 'narration', e.narration);
  for (const x of examensDe(dm).examens) {
    ajouter('examens', x.id, ['texte'], 'texte', x.texte);
    ajouter('examens', x.id, ['apercu'], 'aperçu', x.apercu);
    x.regards.forEach((r, i) => ajouter('examens', x.id, ['regards', i, 'texte'], `regard ${i + 1}`, r.texte));
  }
  for (const d of dilemmesDe(dm).dilemmes) ajouter('dilemmes', d.id, ['situation'], 'situation', d.situation);
  for (const ev of evenementsChoixDe(dm).evenements) {
    ajouter('evenements-choix', ev.id, ['narration'], 'narration', ev.narration);
    ev.variantes.forEach((va, i) => ajouter('evenements-choix', ev.id, ['variantes', i, 'narration'], `narration (variante ${i + 1})`, va.narration));
    ev.choix.forEach((c, i) => {
      ajouter('evenements-choix', ev.id, ['choix', i, 'resultat'], `résultat « ${c.id} »`, c.resultat);
      ajouter('evenements-choix', ev.id, ['choix', i, 'resultatEchec'], `résultat de l'échec « ${c.id} »`, c.resultatEchec);
    });
  }
  for (const q of questionsDe(dm).questions) ajouter('codex', q.id, ['piste'], 'piste', q.piste);
  for (const e of dm.enigmes.values()) ajouter('enigmes', e.id, ['enonce'], 'énoncé', e.enonce);
  return res;
}

/** Cherche un mot (ou une expression) dans un texte, sans tenir compte des accents ni de la casse, avec ses pluriels simples. */
export function trouverMot(texte: string, mot: string): { index: number; extrait: string } | null {
  const t = normaliser(texte);
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  if (!m) return null;
  const r = new RegExp(`(?<![a-z0-9])${m}(?:s|x|e|es)?(?![a-z0-9])`).exec(t);
  if (!r) return null;
  // Les index du texte normalisé et du texte d'origine ne diffèrent pas (les accents sont des lettres seules, normalisées une à une).
  const debut = Math.max(0, r.index - 40);
  const fin = Math.min(texte.length, r.index + r[0].length + 40);
  return { index: r.index, extrait: `${debut > 0 ? '…' : ''}${texte.slice(debut, fin).replace(/\s+/g, ' ')}${fin < texte.length ? '…' : ''}` };
}

/** La clé qui identifie une alerte pour la rejeter : même alerte, même clé ; si le texte change, l'alerte revient. */
export function cleDeRevue(d: Diagnostic): string {
  return [d.code, d.entite ? `${d.entite.type}:${d.entite.id}` : '', (d.chemin ?? []).join('.'), String(d.donnees?.['mot'] ?? ''), String(d.donnees?.['extrait'] ?? '').slice(0, 80)].join('|');
}

/** Les alertes qui ne sont pas rejetées. */
export const sansRejets = (diags: Diagnostic[], revue: Revue): Diagnostic[] => {
  const rejets = new Set(revue.rejets);
  return diags.filter((d) => !rejets.has(cleDeRevue(d)));
};

/** Une fiche est autorisée par son identifiant (`savoirs:anselme-roux`), son dossier (`savoirs`), ou son PNJ (`pnj:anselme-roux` couvre aussi sa fiche de savoir). */
const autorise = (s: Canon['secrets'][number], e: RefEntite) => s.autorise.some((a) => a === `${e.type}:${e.id}` || a === e.type || (e.type === 'savoirs' && a === `pnj:${e.id}`));

export function revoirMonde(dm: DonneesMonde, canon: Canon): Diagnostic[] {
  const res: Diagnostic[] = [];
  const libres = champsLibres(dm);

  // 1. Un secret ne fuit pas : aucun mot tabou dans un texte libre (hors fiches autorisées).
  for (const s of canon.secrets) {
    for (const c of libres) {
      if (autorise(s, c.entite)) continue;
      for (const mot of s.motsTabou) {
        const t = trouverMot(c.texte, mot);
        if (!t) continue;
        res.push({
          code: 'revue.secret',
          gravite: 'avis',
          message: `Secret « ${s.id} » : le mot « ${mot} » apparaît dans ${c.champ} de « ${c.entite.id} » (« ${t.extrait} »).`,
          entite: c.entite,
          chemin: c.chemin,
          source: 'revue',
          donnees: { secret: s.id, mot, extrait: t.extrait, champ: c.champ },
        });
        break; // un mot suffit par secret et par champ
      }
    }
  }

  // 2. Les personnages du canon concordent avec les fiches (nom, âge, espèce).
  for (const p of canon.personnages) {
    const fiche = dm.pnj.get(p.id);
    if (!fiche) {
      res.push({ code: 'revue.personnage', gravite: 'avis', message: `Canon : le personnage « ${p.id} » n'a pas de fiche dans pnj/.`, entite: { type: 'pnj', id: p.id }, source: 'revue', donnees: { champ: 'fiche' } });
      continue;
    }
    const ecart = (champ: string, attendu: unknown, trouve: unknown, corrigeable: boolean) =>
      res.push({
        code: 'revue.personnage',
        gravite: 'avis',
        message: `Canon : « ${p.id} » devrait avoir ${champ} « ${String(attendu)} », la fiche dit « ${String(trouve)} ».`,
        entite: { type: 'pnj', id: p.id },
        chemin: [champ],
        source: 'revue',
        donnees: { champ, attendu, trouve, corrigeable },
      });
    if (p.nom && p.nom !== fiche.nom) ecart('nom', p.nom, fiche.nom, true);
    if (p.espece && p.espece !== fiche.espece) ecart('espece', p.espece, fiche.espece, true);
    const age = /\d+/.exec(fiche.age ?? '')?.[0];
    if (p.age !== undefined && age !== undefined && Number(age) !== p.age) ecart('age', `${p.age} ans`, fiche.age, true);
  }

  // 3. Les liens entre personnages sont réciproques : si A parle de B, B parle de A (« la même histoire vue de chaque côté »).
  const fiches = new Map(savoirsDe(dm).savoirs.map((s) => [s.pnj, s]));
  for (const s of fiches.values()) {
    for (const l of s.liens) {
      if (!l.pnj || !fiches.has(l.pnj)) continue;
      if (!fiches.get(l.pnj)!.liens.some((x) => x.pnj === s.pnj)) {
        res.push({
          code: 'revue.lien-reciproque',
          gravite: 'conseil',
          message: `Savoir « ${s.pnj} » parle de « ${l.pnj} », mais « ${l.pnj} » n'a aucun lien vers « ${s.pnj} ».`,
          entite: { type: 'savoirs', id: l.pnj },
          source: 'revue',
          donnees: { de: s.pnj, vers: l.pnj },
        });
      }
    }
  }

  res.push(...nomsInconnus(dm, canon, libres));
  return res;
}

// ---------------------------------------------------------------------------
// Noms propres qui n'apparaissent nulle part ailleurs : lore inventé ?
// ---------------------------------------------------------------------------

/** Mots à majuscule qui ne sont pas des noms propres du monde : titres, jours, mois, points cardinaux. */
const ADMIS = new Set(
  'dieu dieux seigneur seigneurs dame dames maitre maitres frere frere soeur soeurs pere mere prieur capitaine sergent roi reine prince princesse lundi mardi mercredi jeudi vendredi samedi dimanche janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre nord sud est ouest cendre cendres lanterne lanternes'.split(' '),
);

/** Les mots à majuscule d'un texte qui ne commencent pas une phrase. */
function motsAMajuscule(texte: string): string[] {
  const res: string[] = [];
  for (const m of texte.matchAll(/(?<![\p{L}\p{N}'’-])\p{Lu}[\p{L}'’-]{2,}/gu)) {
    const avant = texte.slice(0, m.index).trimEnd();
    if (!avant || /[.!?…:;«"“”—–(\[\n]$/.test(avant) || /\n\s*$/.test(texte.slice(0, m.index))) continue;
    res.push(m[0]);
  }
  return res;
}

function nomsInconnus(dm: DonneesMonde, canon: Canon, libres: ChampLibre[]): Diagnostic[] {
  // Dans quelles entités chaque mot à majuscule apparaît-il ? Un mot qui n'est que dans UNE fiche (et pas dans un nom, un fait, le lexique)
  // est peut-être une invention d'agent.
  const ou = new Map<string, Set<string>>();
  const noter = (mot: string, entite: string) => (ou.get(normaliser(mot)) ?? ou.set(normaliser(mot), new Set()).get(normaliser(mot))!).add(entite);
  const parcourir = (x: unknown, entite: string) => {
    if (typeof x === 'string') for (const m of motsAMajuscule(` ${x}`)) noter(m, entite);
    else if (Array.isArray(x)) x.forEach((y) => parcourir(y, entite));
    else if (x && typeof x === 'object') for (const v of Object.values(x as Record<string, unknown>)) parcourir(v, entite);
  };
  const connus = new Set<string>(ADMIS);
  const mots = (t: string) => t.match(/[\p{L}'’-]{3,}/gu)?.forEach((m) => connus.add(normaliser(m)));
  for (const n of canon.noms.lexique) mots(n);
  const cartes: [string, Map<string, { nom?: string; titre?: string; texte?: string }>][] = [
    ['lieux', dm.lieux], ['pnj', dm.pnj], ['objets', dm.objets], ['factions', dm.factions], ['quetes', dm.quetes], ['fins', dm.fins], ['jauges', dm.jauges],
    ['rencontres', dm.rencontres], ['tresors', dm.tresors], ['enigmes', dm.enigmes], ['pieges', dm.pieges], ['evenements', dm.evenements], ['tables', dm.tables], ['faits', dm.faits],
  ] as never;
  for (const [type, carte] of cartes) {
    for (const [id, e] of carte) {
      if (e.nom) mots(e.nom);
      if (e.titre) mots(e.titre);
      // Les faits sont le canon : un mot qui y figure n'est pas inventé.
      if (type === 'faits' && e.texte) for (const m of e.texte.match(/[\p{L}'’-]{3,}/gu) ?? []) connus.add(normaliser(m));
      parcourir(e, `${type}:${id}`);
    }
  }
  // Les données des modules (savoirs, examens, dilemmes…) comptent aussi ; la fiche de savoir d'un PNJ est « le même personnage » que sa fiche.
  for (const [dossier, elements] of Object.entries(dm.extensions ?? {})) {
    for (const x of elements as { id?: string; pnj?: string }[]) {
      const id = x?.id ?? x?.pnj;
      if (id) parcourir(x, `${dossier === 'savoirs' ? 'pnj' : dossier}:${id}`);
    }
  }
  const res: Diagnostic[] = [];
  const vus = new Set<string>();
  for (const c of libres) {
    for (const mot of motsAMajuscule(` ${c.texte}`)) {
      const n = normaliser(mot);
      const cle = `${c.entite.type}:${c.entite.id}:${n}`;
      if (connus.has(n) || vus.has(cle)) continue;
      // Il apparaît ailleurs dans une AUTRE fiche : c'est un nom du monde.
      const entites = ou.get(n) ?? new Set();
      const propre = c.entite.type === 'savoirs' ? `pnj:${c.entite.id}` : `${c.entite.type}:${c.entite.id}`;
      if ([...entites].some((e) => e !== propre && e !== `${c.entite.type}:${c.entite.id}`)) continue;
      vus.add(cle);
      const t = trouverMot(c.texte, mot);
      res.push({
        code: 'revue.nom-inconnu',
        gravite: 'conseil',
        message: `Le nom « ${mot} » n'apparaît nulle part ailleurs dans le monde (${c.champ} de « ${c.entite.id} ») : invention d'un agent ? Sinon ajoutez-le au lexique du canon.`,
        entite: c.entite,
        chemin: c.chemin,
        source: 'revue',
        donnees: { mot, extrait: t?.extrait ?? c.texte.slice(0, 80), champ: c.champ },
      });
    }
  }
  return res;
}

/** Les alertes de revue d'un monde, sans celles que l'auteur a rejetées. */
export const listerRevue = (dm: DonneesMonde, canon: Canon, revue: Revue): Diagnostic[] => sansRejets(revoirMonde(dm, canon), revue);
