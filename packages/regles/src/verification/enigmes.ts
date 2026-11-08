// Audit des énigmes d'un monde : on les JOUE dans le vrai moteur, avec la bonne réponse, une mauvaise, une réponse mal
// formée, et on lit ce qui se passe. Une énigme n'est « vérifiée » que si elle se résout par ses boutons, si son échec
// fait ce que son texte annonce et si sa récompense sert à quelque chose. Voir le skill `enigmes`.
//   erreur : l'énigme est cassée ; avis : à relire, c'est peut-être voulu.
import type { Donnees } from '../donnees';
import { bilanPersonnage, groupeConseille } from '../creation/groupe';
import { normaliserTexte } from '../monde/etat';
import type { DonneesMonde, Enigme } from '../monde/schemas';
import { MODULES_STANDARD } from '../modules';
import { creerMoteur, type Moteur } from '../noyau/moteur';
import type { Ordre, Partie, Proposition } from '../noyau/types';
import { personnageDepuisFiche } from '../personnage';

export interface Verification {
  id: string;
  gravite: 'erreur' | 'avis';
  ok: boolean;
  detail: string;
}

export interface RapportEnigme {
  id: string;
  nom: string;
  type: string;
  lieu: string;
  verifications: Verification[];
}

// ---------------------------------------------------------------------------
// Jouer une énigme
// ---------------------------------------------------------------------------

/** La partie, au lieu de l'énigme. */
export function auLieuDe(moteur: Moteur, groupe: ReturnType<typeof groupeDeTest>, e: Enigme, graine = 21): Partie {
  const p = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau: 3 }), { type: 'commencer' }).partie;
  // Le lieu de départ d'un monde peut ouvrir sur une rencontre d'arrivée : l'énigme se teste hors de cette scène.
  return { ...p, scene: { type: 'exploration' }, etat: { ...p.etat, lieu: e.lieu } };
}

/** Le groupe conseillé du créateur, de vrais personnages. */
export function groupeDeTest(donnees: Donnees) {
  return groupeConseille(3, donnees).emplacements.map((p) => {
    const f = bilanPersonnage(p!, donnees).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
}

/** Le bouton « Répondre » de l'énigme tel que le joueur le voit. */
export const boutonReponse = (moteur: Moteur, p: Partie, e: Enigme): Proposition | undefined =>
  moteur.propositions(p).find((x) => x.ordre?.type === 'repondreEnigme' && x.ordre.enigme === e.id);

/** La bonne réponse, construite à partir de ce que le formulaire propose (pas de la solution seule). */
export function bonneReponse(bouton: Proposition, e: Enigme): { reponse: unknown } | { erreur: string } {
  const f = bouton.formulaire;
  const s = e.solution;
  if (!f) {
    if (!bouton.saisie) return { erreur: 'ni formulaire ni champ de texte : le joueur ne peut pas répondre' };
    return { reponse: s.type === 'mot-de-passe' ? s.mots[0] : s.type === 'deduction' ? s.reponses[0] : undefined };
  }
  if (f.type === 'ordre' && s.type === 'sequence') {
    const reponse: string[] = [];
    for (const x of s.ordre) {
      const o = f.options.find((o) => normaliserTexte(o.valeur) === normaliserTexte(x));
      if (!o) return { erreur: `l'élément « ${x} » n'est pas proposé par le formulaire` };
      reponse.push(o.valeur);
    }
    return f.taille === s.ordre.length ? { reponse } : { erreur: `le formulaire attend ${f.taille} éléments, la solution en a ${s.ordre.length}` };
  }
  if (f.type === 'nombres' && s.type === 'cadran') {
    if (f.libelles.length !== s.valeurs.length) return { erreur: `${f.libelles.length} champs pour ${s.valeurs.length} réglages` };
    const dehors = s.valeurs.find((v) => (f.min !== undefined && v < f.min) || (f.max !== undefined && v > f.max));
    return dehors === undefined ? { reponse: s.valeurs } : { erreur: `la valeur ${dehors} sort de la plage ${f.min} à ${f.max}` };
  }
  if (f.type === 'interrupteurs' && s.type === 'leviers') {
    return f.libelles.length === s.positions.length
      ? { reponse: s.positions }
      : { erreur: `${f.libelles.length} leviers pour ${s.positions.length} positions` };
  }
  if (f.type === 'association' && s.type === 'placement') {
    const reponse: Record<string, string> = {};
    for (const em of f.emplacements) {
      const attendu = s.emplacements[em.cle];
      const o = f.options.find((o) => o.valeur === attendu);
      if (attendu === undefined || !o) return { erreur: `l'élément « ${attendu} » de l'emplacement « ${em.cle} » n'est pas proposé` };
      reponse[em.cle] = o.valeur;
    }
    return f.emplacements.length === Object.keys(s.emplacements).length
      ? { reponse }
      : { erreur: 'les emplacements du formulaire ne sont pas ceux de la solution' };
  }
  return { erreur: `formulaire « ${f.type} » pour une solution « ${s.type} »` };
}

/** Une réponse bien formée mais fausse. */
export function mauvaiseReponse(e: Enigme): unknown {
  const s = e.solution;
  switch (s.type) {
    case 'sequence':
      return [...s.ordre].reverse();
    case 'leviers':
      return s.positions.map((x) => !x);
    case 'cadran':
      return s.valeurs.map((v) => v + 1);
    case 'placement': {
      const cles = Object.keys(s.emplacements);
      const valeurs = Object.values(s.emplacements);
      return Object.fromEntries(cles.map((c, i) => [c, valeurs[(i + 1) % valeurs.length]]));
    }
    default:
      return 'zzz';
  }
}

/** Une réponse qui n'a pas la forme attendue. */
export const reponseMalFormee = (e: Enigme): unknown => (e.solution.type === 'mot-de-passe' || e.solution.type === 'deduction' ? ['x'] : 'n importe quoi');

// ---------------------------------------------------------------------------
// L'audit
// ---------------------------------------------------------------------------

const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'd', 'l', 'et', 'en', 'au', 'aux']);

/** Le mot qui désigne un élément dans un énoncé : le dernier mot significatif (« wagonnet-de-minerai » → « minerai »). */
function motCle(element: string): string | undefined {
  return normaliserTexte(element)
    .split(' ')
    .filter((m) => m.length >= 3 && !MOTS_VIDES.has(m))
    .pop();
}

/** Les éléments cités dans l'énoncé, dans l'ordre de la solution (renvoie vrai si la solution se lit dans l'énoncé). */
function enonceDonneLOrdre(e: Enigme): boolean {
  if (e.solution.type !== 'sequence') return false;
  const enonce = ` ${normaliserTexte(e.enonce)} `;
  const positions = e.solution.ordre.map((x) => {
    const mot = motCle(x);
    return mot ? enonce.indexOf(` ${mot} `) : -1;
  });
  return positions.every((p) => p >= 0) && positions.every((p, i) => i === 0 || p > positions[i - 1]!);
}

/** Chaque entité du monde sous forme de texte, pour savoir si un identifiant est lu quelque part. */
function entitesDuMonde(dm: DonneesMonde): { id?: string; texte: string }[] {
  const res: { id?: string; texte: string }[] = [];
  for (const v of Object.values(dm)) {
    if (v instanceof Map) for (const x of v.values()) res.push({ id: (x as { id?: string }).id, texte: JSON.stringify(x) });
  }
  for (const liste of Object.values(dm.extensions ?? {})) for (const x of liste) res.push({ id: (x as { id?: string })?.id, texte: JSON.stringify(x) });
  return res;
}

const SUGGERE_UN_DANGER = /attaqu|réveill|patrouille|zombi|monstre|surgi|sort aussitôt|alerte|alarme|éboul|s'effondr|dégât|brûl/i;

export function auditerEnigmes(dm: DonneesMonde, donnees: Donnees): RapportEnigme[] {
  const moteur = creerMoteur({ dm, srd: donnees }, MODULES_STANDARD);
  const groupe = groupeDeTest(donnees);
  const entites = entitesDuMonde(dm);

  return [...dm.enigmes.values()].map((e) => {
    const v: Verification[] = [];
    const ajouter = (id: string, gravite: Verification['gravite'], ok: boolean, detail: string) => v.push({ id, gravite, ok, detail: ok ? '' : detail });
    const jouer = (reponse: unknown, partie = auLieuDe(moteur, groupe, e)) => {
      const bouton = boutonReponse(moteur, partie, e);
      return bouton?.ordre ? { bouton, res: moteur.executer(partie, { ...bouton.ordre, reponse } as Ordre) } : { bouton, res: undefined };
    };
    const depart = auLieuDe(moteur, groupe, e);
    const bouton = boutonReponse(moteur, depart, e);

    // 1. Le joueur peut-il résoudre l'énigme avec ses boutons ?
    if (!bouton) ajouter('jouable', 'erreur', false, "aucun bouton « Répondre » au lieu de l'énigme");
    else {
      const bonne = bonneReponse(bouton, e);
      if ('erreur' in bonne) ajouter('jouable', 'erreur', false, bonne.erreur);
      else {
        const { res } = jouer(bonne.reponse, depart);
        const resolue = res?.partie.etat.exploration.enigmes[e.id] === 'resolue';
        ajouter(
          'jouable',
          'erreur',
          !res?.refus && resolue,
          res?.refus ? `la bonne réponse est refusée : ${res.refus}` : 'la bonne réponse ne résout pas l’énigme',
        );
      }
    }

    // 2. Les éléments proposés ne donnent pas la solution par leur ordre.
    const f = bouton?.formulaire;
    if (f?.type === 'ordre' && e.solution.type === 'sequence')
      ajouter(
        'ordre-neutre',
        'erreur',
        f.options.map((o) => o.valeur).join('|') !== e.solution.ordre.join('|'),
        "les éléments sont proposés dans l'ordre de la solution",
      );
    if (f?.type === 'association' && e.solution.type === 'placement') {
      const attendu = Object.values(e.solution.emplacements);
      ajouter(
        'ordre-neutre',
        'erreur',
        f.options.map((o) => o.valeur).join('|') !== attendu.join('|'),
        "les éléments sont proposés dans l'ordre des emplacements",
      );
    }

    // 3. Une réponse mal formée est refusée sans aucune conséquence.
    {
      const { res } = jouer(reponseMalFormee(e));
      const intact =
        !!res?.refus &&
        res.partie.etat.exploration.enigmes[e.id] === undefined &&
        res.partie.scene.type === 'exploration' &&
        !(res.partie.etat.rencontresEnAttente ?? []).length;
      ajouter('mal-formee', 'erreur', !res || intact, res?.refus ? 'une réponse mal formée change la partie' : 'une réponse mal formée n’est pas refusée');
    }

    // 4. Un échec fait ce que son texte annonce.
    {
      const { res } = jouer(mauvaiseReponse(e));
      const echouee = res?.partie.etat.exploration.enigmes[e.id] === 'echouee';
      ajouter(
        'echec',
        'erreur',
        !res || (!res.refus && echouee),
        res?.refus ? `la mauvaise réponse est refusée : ${res.refus}` : 'une mauvaise réponse n’est pas un échec',
      );
      if (res && echouee) {
        for (const eff of e.echec?.effets ?? []) {
          if (!('rencontre' in eff)) continue;
          const def = dm.rencontres.get(eff.rencontre);
          const lancee =
            res.partie.scene.type === 'rencontre'
              ? res.partie.scene.rencontre === eff.rencontre
              : res.evenements.some((x) => x.type === 'constat' && x.texte.includes(def?.nom ?? '§'));
          ajouter('echec-rencontre', 'erreur', lancee, `l'échec doit déclencher « ${eff.rencontre} » et ne le fait pas`);
        }
        if (e.echec?.piege) {
          const ex = res.partie.etat.exploration;
          ajouter(
            'echec-piege',
            'erreur',
            ex.decouverts.includes(`piege:${e.echec.piege}`),
            `l'échec doit déclencher le piège « ${e.echec.piege} » et ne le fait pas`,
          );
        }
        // Après l'échec (et le combat qu'il a lancé, une fois réglé), le joueur peut-il retenter sa chance ?
        const apres = res.partie.scene.type === 'rencontre' ? moteur.executer(res.partie, { type: 'reglerRencontre', issue: 'victoire' }).partie : res.partie;
        ajouter('reessayer', 'avis', !!boutonReponse(moteur, apres, e), 'après un échec, le joueur ne peut plus répondre');
      }
    }
    ajouter('echec-defini', 'avis', !!e.echec, "pas d'échec défini : on peut tenter toutes les réponses sans rien risquer");
    if (e.echec?.resume && SUGGERE_UN_DANGER.test(e.echec.resume)) {
      const agit = !!e.echec.piege || e.echec.effets.some((x) => !('narration' in x));
      ajouter(
        'echec-annonce',
        'avis',
        agit,
        `le texte d'échec annonce un danger (« ${e.echec.resume.slice(0, 70)}… ») mais aucun effet, piège ni rencontre ne le produit`,
      );
    }

    // 5. La récompense sert à quelque chose : un drapeau posé doit être lu quelque part.
    for (const eff of e.recompense.effets) {
      if (!('flag' in eff) || eff.valeur === false) continue;
      const lu = entites.some((x) => x.id !== e.id && x.id !== eff.flag && x.texte.includes(`"${eff.flag}"`));
      ajouter(
        'recompense-lue',
        'avis',
        lu,
        `le drapeau « ${eff.flag} » posé par la récompense n'est lu nulle part (aucune condition, aucun lien ne l'utilise)`,
      );
    }

    // 6. Les indices.
    const niveaux = new Set(e.indices.map((i) => i.niveau));
    ajouter(
      'indices',
      'avis',
      [1, 2, 3].every((n) => niveaux.has(n)),
      `il manque des niveaux d'indice (présents : ${[...niveaux].sort().join(', ')}) ; l'indice 3 doit mener à la réponse`,
    );
    ajouter(
      'indices-jet',
      'avis',
      e.indices.every((i) => !!i.competence === !!i.dd),
      'un indice a une compétence sans DD, ou un DD sans compétence',
    );

    // 7. Lisibilité de l'énoncé.
    if (enonceDonneLOrdre(e))
      ajouter(
        'enonce-ordre',
        'avis',
        false,
        "l'énoncé cite les éléments dans l'ordre de la solution : la réponse se lit sans réfléchir (vérifie que c'est voulu)",
      );
    if (e.solution.type === 'leviers')
      ajouter(
        'lecture-leviers',
        'avis',
        /haut|l[eéè]v[éèe]/i.test(e.enonce) && /bas|repos|couch/i.test(e.enonce),
        "l'énoncé ne dit pas comment lire les leviers (en haut / en bas)",
      );
    if (e.solution.type === 'cadran') {
      ajouter('plage-cadran', 'avis', !!e.solution.plage, 'pas de `plage` : le formulaire ne borne pas les champs');
      ajouter('libelles-cadran', 'avis', !!e.solution.libelles, 'pas de `libelles` : les réglages s’appelleront « Réglage 1, 2… »');
    }

    return { id: e.id, nom: e.nom, type: e.solution.type, lieu: e.lieu, verifications: v };
  });
}

/** Compte les erreurs et les avis d'un audit. */
export function bilanAudit(rapports: RapportEnigme[]): { erreurs: number; avis: number } {
  const manques = rapports.flatMap((r) => r.verifications).filter((x) => !x.ok);
  return { erreurs: manques.filter((x) => x.gravite === 'erreur').length, avis: manques.filter((x) => x.gravite === 'avis').length };
}
