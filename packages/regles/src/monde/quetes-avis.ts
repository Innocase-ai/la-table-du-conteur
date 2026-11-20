// Les avis de quêtes de la fiche F3 (20/11/2026, docs/PRD-SAGA.md et docs/MONDES.md « Gabarit de quête ») : ce que le validateur dit d'une
// quête sans la jouer. Ce sont des AVIS (jamais des erreurs : un faux positif ne bloque rien, P1) ; ils ne s'affichent dans `valider` et
// `verifier` que pour un monde qui déclare `"format": "episode"` (opt-in, P2), et `pnpm monde quetes <monde>` les donne pour n'importe quel monde.
//
// Ils complètent ce que `validation.ts` dit déjà des quêtes (références, étapes inatteignables, quête que rien ne propose, lieu de la quête, quête
// sautable) et ce que `episode.ts` dit de leur nombre et de leurs `lieu` d'étape.
import type { Donnees } from '../donnees';
import { alternativesDeParole, parolesDeRencontre } from './parole';
import { conditionSatisfiable, indexerReferences, refsCondition } from './references';
import type { Condition, DonneesMonde } from './schemas';

export interface AvisQuete {
  /** Code stable (atelier, tests) : `quete.tue-qui-parle`, `rencontre.parole-muette`, `quete.sans-annonce`, `quete.sans-retour`, `quete.etape-impossible`. */
  code: string;
  message: string;
  quete?: string;
}

/**
 * Les rencontres qu'une condition EXIGE : celles qui sont vraies dans tous les cas où la condition l'est. Un `ou` n'exige que ce que toutes
 * ses branches exigent (« le péage payé OU la rencontre réglée » n'exige pas la rencontre) ; `non` n'exige rien.
 */
export function rencontresExigees(c: Condition): string[] {
  if ('rencontre' in c) return [c.rencontre.id];
  if ('et' in c) return [...new Set(c.et.flatMap(rencontresExigees))];
  if ('ou' in c) {
    const [premiere, ...reste] = c.ou.map(rencontresExigees);
    return (premiere ?? []).filter((id) => reste.every((r) => r.includes(id)));
  }
  return [];
}

const liste = (xs: string[], n = 4) => `${xs.slice(0, n).join(', ')}${xs.length > n ? `… (${xs.length} en tout)` : ''}`;

export function avisQuetes(dm: DonneesMonde, srd: Donnees): AvisQuete[] {
  const res: AvisQuete[] = [];
  const noter = (code: string, quete: string | undefined, message: string) => res.push({ code, message, ...(quete ? { quete } : {}) });

  // 1. Une quête dont l'étape exige un combat contre un adversaire qui PARLE, sans porte de sortie par la parole (PRD-SAGA décision 4 : une porte
  //    de sortie seulement si l'adversaire parle). Le critère se lit dans `langues` (voir `parole.ts`), pas dans le type de créature.
  for (const q of dm.quetes.values()) {
    const vues = new Set<string>();
    for (const e of q.etapes) {
      for (const id of rencontresExigees(e.completion)) {
        const r = dm.rencontres.get(id);
        if (!r || vues.has(id) || (r.type !== 'combat' && r.type !== 'mixte')) continue;
        vues.add(id);
        const p = parolesDeRencontre(srd, r);
        if (p.parle && !alternativesDeParole(r, true).length) {
          const qui = [...new Set(p.adversaires.filter((a) => a.parole === 'parle').map((a) => a.profil))];
          noter('quete.tue-qui-parle', q.id, `Quête « ${q.id} », étape « ${e.id} » : elle exige la rencontre « ${id} » contre des adversaires qui parlent (${liste(qui)}) sans aucune alternative de parole (négocier, payer, ruser) : ajoutez une alternative, ou assumez le combat dans la revue.`);
        }
      }
    }
  }

  // 2. L'inverse : une alternative de négociation contre des adversaires qui ne parlent pas (des rats ne marchandent pas). Les créatures qui
  //    « comprennent sans parler » ne sont pas visées (zone grise : elles entendent une menace ou un ordre).
  for (const r of dm.rencontres.values()) {
    if ((r.type !== 'combat' && r.type !== 'mixte') || !r.monstres.length) continue;
    if (!parolesDeRencontre(srd, r).muette) continue;
    for (const a of alternativesDeParole(r)) {
      noter('rencontre.parole-muette', undefined, `Rencontre « ${r.id} », alternative « ${a.id} » : une négociation contre des adversaires qui ne parlent pas (${liste([...new Set(r.monstres.map((m) => m.profil))])} : langues « aucune »). Ruser, fuir ou apaiser (Dressage, Survie) conviendraient mieux.`);
    }
  }

  const idx = indexerReferences(dm);
  for (const q of dm.quetes.values()) {
    // 3. Chaque quête annonce sa récompense (le donneur la promet : « 75 po et une lettre d'Elara »).
    if (!q.recompenses.annonce?.trim()) noter('quete.sans-annonce', q.id, `Quête « ${q.id} » : pas d'\`annonce\` de récompense (ce que le donneur promet, en clair : le parchemin du jeu la lit avant l'acceptation).`);

    // 4. Chaque quête rendue a un retour au donneur, SANS l'heuristique du prénom : la dernière étape attend un drapeau que pose un sujet du donneur.
    const donneur = q.donneur ? dm.pnj.get(q.donneur) : undefined;
    if (donneur) {
      const finales = q.etapes.filter((e) => e.suivantes.length === 0 || e.termine);
      if (!finales.some((e) => e.effets.some((x) => 'fin' in x))) {
        const posesParLeDonneur = new Set(donneur.sujets.flatMap((s) => s.effets.flatMap((x) => ('flag' in x ? [x.flag] : []))));
        const retour = finales.some((e) => {
          let ok = false;
          refsCondition(e.completion, (genre, id) => {
            if (genre === 'flag' && posesParLeDonneur.has(id)) ok = true;
            if (genre === 'pnj' && id === donneur.id) ok = true; // `parle: donneur`
          });
          return ok;
        });
        if (!retour) noter('quete.sans-retour', q.id, `Quête « ${q.id} » : la dernière étape ne se rend pas à son donneur « ${donneur.id} » (aucun drapeau que posent ses sujets, aucun « parle ») : le joueur ne sait pas où la rendre ; ajoutez une étape « Retournez voir ${donneur.nom} » accomplie par un sujet de ce PNJ.`);
      }
    }

    // 5. Une étape dont la condition d'accomplissement ne peut jamais être vraie (un drapeau, un fait ou un objet du monde que rien ne produit) bloque la quête.
    const impossibles = q.etapes.filter((e) => !conditionSatisfiable(e.completion, idx, dm)).map((e) => e.id);
    if (impossibles.length) noter('quete.etape-impossible', q.id, `Quête « ${q.id} » : l'accomplissement de l'étape ${liste(impossibles.map((i) => `« ${i} »`))} ne peut jamais être vrai (un drapeau, un fait ou un objet exigé n'est produit nulle part) : la quête restera bloquée.`);
    if (q.prerequis && !conditionSatisfiable(q.prerequis, idx, dm)) noter('quete.etape-impossible', q.id, `Quête « ${q.id} » : son prérequis ne peut jamais être vrai : elle ne s'acceptera jamais.`);
  }
  return res;
}
