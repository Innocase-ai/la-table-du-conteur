// Contrôle « quête sautable » : le joueur ne doit pas pouvoir atteindre l'objectif d'une quête (le lieu, le combat, l'objet) sans que
// cette quête soit active. Sinon il tue le chef et prend la relique avant d'avoir su qu'on la cherchait (décision du 17/11/2026).
//
// Deux fautes sont cherchées :
//  1. L'objectif est atteignable depuis le départ par des passages dont aucun n'exige la quête (une `condition` qui la nomme) : le
//     joueur peut y aller sans l'avoir prise.
//  2. Un sujet de PNJ (effet `debloquer`) ouvre un passage protégé par la quête sans la démarrer : `debloquer` contourne la condition
//     du passage, la protection ne vaut alors plus rien.
import { refsCondition } from './references';
import type { Condition, DonneesMonde, EffetMonde } from './schemas';

const nomme = (c: Condition | undefined, quete: string): boolean => {
  let trouve = false;
  if (c) refsCondition(c, (genre, id) => { if ((genre === 'quete' || genre === 'etape') && id === quete) trouve = true; });
  return trouve;
};

/** Les lieux où se joue l'objectif d'une quête : lieu à atteindre, lieu d'une rencontre, lieu du contenant d'un objet. */
export function lieuxObjectif(dm: DonneesMonde, quete: string): Set<string> {
  const res = new Set<string>();
  for (const e of dm.quetes.get(quete)?.etapes ?? []) {
    refsCondition(e.completion, (genre, id) => {
      if (genre === 'lieu') res.add(id);
      else if (genre === 'rencontre') { const l = dm.rencontres.get(id)?.lieu; if (l) res.add(l); }
      else if (genre === 'objet') for (const t of dm.tresors.values()) if (t.contenu.objets.some((o) => o.objet === id)) res.add(t.lieu);
    });
  }
  return res;
}

/** Les lieux joignables depuis le départ sans quête active : on ignore les passages dont la condition nomme la quête. */
function joignablesSans(dm: DonneesMonde, quete: string): Set<string> {
  const depart = dm.monde.depart.lieu;
  const vus = new Set<string>([depart]);
  const file = [depart];
  const entrees = (id: string) => {
    // Les liens que d'AUTRES lieux déclarent vers `id` (hors ses propres salles), comme le moteur (exploration.ts).
    const dedans = (lieu: string): boolean => {
      for (let l = dm.lieux.get(lieu), n = 0; l && n < 20; l = l.parent ? dm.lieux.get(l.parent) : undefined, n++) if (l.parent === id) return true;
      return false;
    };
    return [...dm.lieux.values()].filter((a) => !dedans(a.id)).flatMap((a) => a.liens.filter((l) => l.vers === id));
  };
  const fermeParLiens = (id: string) => { const l = entrees(id); return l.length > 0 && l.every((x) => !!x.condition || !!x.cache || !!x.verrou); };
  while (file.length) {
    const a = file.shift()!;
    const ici = dm.lieux.get(a);
    const suivants: string[] = [];
    if (ici?.parent) suivants.push(ici.parent);
    for (const e of dm.lieux.values()) if (e.parent === a && !fermeParLiens(e.id)) suivants.push(e.id);
    for (const l of ici?.liens ?? []) if (!nomme(l.condition, quete)) suivants.push(l.vers);
    for (const o of dm.lieux.values()) for (const l of o.liens) if (l.vers === a && l.sens === 'double' && !nomme(l.condition, quete)) suivants.push(o.id);
    for (const s of suivants) if (!vus.has(s) && dm.lieux.has(s)) (vus.add(s), file.push(s));
  }
  return vus;
}

const demarre = (effets: EffetMonde[], quete: string) => effets.some((e) => 'quete' in e && e.quete.id === quete && (e.quete.statut === 'active' || e.quete.statut === 'terminee'));

/** Les avis « quête sautable » d'un monde (liste de phrases, vide si tout va bien). */
export function avisQuetesSautables(dm: DonneesMonde): string[] {
  const res: string[] = [];
  // Seules les quêtes principales comptent : on ne gardera pas toutes les salles d'un donjon derrière une quête annexe (elle se valide
  // alors après coup). Une quête lancée par un événement (ouverture, entrée dans un lieu) est découverte, pas confiée : exclue.
  const lanceeParEvenement = (id: string): boolean => [...dm.evenements.values()].some((e) => e.effets.some((x) => 'quete' in x && x.quete.id === id && x.quete.statut === 'active'));
  for (const q of dm.quetes.values()) {
    if (q.type !== 'principale' || lanceeParEvenement(q.id)) continue;
    const objectif = lieuxObjectif(dm, q.id);
    if (!objectif.size) continue;
    const libres = joignablesSans(dm, q.id);
    const sautables = [...objectif].filter((l) => libres.has(l) && l !== dm.monde.depart.lieu);
    if (sautables.length)
      res.push(`Quête « ${q.id} » sautable : son objectif (${sautables.join(', ')}) est atteignable sans qu'elle soit active ; ajoutez une condition { "quete": { "id": "${q.id}", "statut": "active" } } au passage qui y mène, et faites-la démarrer par tout sujet qui l'ouvre.`);
    // Un passage protégé par la quête, mais ouvert par un sujet qui ne la démarre pas : `debloquer` contourne la condition.
    const gardes = new Set<string>();
    for (const l of dm.lieux.values()) for (const k of l.liens) if (nomme(k.condition, q.id)) gardes.add(k.vers);
    for (const n of dm.pnj.values()) {
      for (const s of n.sujets) {
        const ouverts = s.effets.flatMap((e) => ('debloquer' in e && gardes.has(e.debloquer) ? [e.debloquer] : []));
        if (ouverts.length && !demarre(s.effets, q.id) && !nomme(s.condition, q.id))
          res.push(`Sujet « ${n.id}:${s.id} » : il débloque ${ouverts.join(', ')} (protégé par la quête « ${q.id} ») sans la démarrer ; ajoutez { "quete": { "id": "${q.id}", "statut": "active" } } à ses effets, ou retirez le « debloquer ».`);
      }
    }
  }
  return res;
}
