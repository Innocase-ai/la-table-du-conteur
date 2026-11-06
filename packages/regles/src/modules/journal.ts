// Module Journal : les quêtes (proposées, en cours avec leurs étapes, accomplies, échouées). Ce que le groupe sait et les
// questions qu'il se pose vivent dans le module Codex. Sa seule commande : accepter une quête proposée.
import { z } from 'zod';
import { evaluerCondition } from '../monde/etat';
import { accepterQuete } from '../monde/exploration';
import { commande, type Encart, type FicheInfo, type Module, type Partie, type ContexteJeu } from '../noyau/types';
import { libre, partieMonde, verser } from './commun';
import type { Quete } from '../monde/schemas';

const TYPES = { principale: 'Quête principale', secondaire: 'Quête secondaire', personnelle: 'Quête personnelle', faction: 'Quête de faction' } as const;

const STATUTS = { proposee: 'proposée', active: 'en cours', terminee: 'accomplie', echouee: 'échouée' } as const;

/** La fiche d'une quête pour le joueur : type, donneur, niveaux, état, puis son résumé et ce qu'il reste à faire. */
function ficheDeQuete(ctx: ContexteJeu, p: Partie, def: Quete, statut: keyof typeof STATUTS, actives: string[]): FicheInfo {
  const proprietes: FicheInfo['proprietes'] = [{ libelle: 'État', valeur: STATUTS[statut] }];
  const donneur = def.donneur ? ctx.dm.pnj.get(def.donneur)?.nom : undefined;
  if (donneur) proprietes.push({ libelle: 'Confiée par', valeur: donneur });
  const lieu = def.lieu ? ctx.dm.lieux.get(def.lieu) : undefined;
  if (lieu && p.etat.lieuxVisites.includes(lieu.id)) proprietes.push({ libelle: 'Lieu', valeur: lieu.nom });
  proprietes.push({ libelle: 'Niveaux', valeur: def.niveau.min === def.niveau.max ? String(def.niveau.min) : `${def.niveau.min} à ${def.niveau.max}` });
  const etapes = actives.map((e) => def.etapes.find((x) => x.id === e)?.texte).filter((x): x is string => !!x);
  const aFaire = statut === 'active' && etapes.length ? [`À faire :\n${etapes.map((e) => `→ ${e}`).join('\n')}`] : [];
  return { rubrique: 'Informations sur la quête', titre: def.nom, sousTitre: TYPES[def.type], proprietes, texte: [def.resume, ...aFaire].join('\n\n') };
}

const PANNEAU_PROPOSEES = { id: 'quetes-proposees', titre: 'Quêtes proposées', ordre: 15 };

export const moduleJournal: Module = {
  id: 'journal',
  commandes: {
    accepterQuete: commande({
      description: 'Accepter une quête proposée par un personnage : elle devient active et ses étapes commencent.',
      entree: z.object({ quete: z.string() }),
      disponible: libre,
      executer: (t, e) => verser(t, accepterQuete(partieMonde(t), e.quete)),
      propositions: (ctx, p) =>
        Object.entries(p.etat.quetes)
          .filter(([, q]) => q.statut === 'proposee')
          .flatMap(([id]) => {
            const def = ctx.dm.quetes.get(id);
            if (!def) return [];
            const ok = !def.prerequis || evaluerCondition(def.prerequis, p.etat);
            return [{ groupe: PANNEAU_PROPOSEES, libelle: `Accepter : ${def.nom}`, aide: def.resume, ordre: { type: 'accepterQuete', quete: id }, desactivee: ok ? undefined : 'Les conditions pour l’accepter ne sont pas réunies.' }];
          }),
    }),
  },
  encarts: (ctx, p): Encart[] => {
    const quetes = Object.entries(p.etat.quetes)
      .map(([id, q]) => ({ id, q, def: ctx.dm.quetes.get(id) }))
      .filter((x) => x.def);
    const enCours = quetes.filter((x) => x.q.statut === 'active' || x.q.statut === 'proposee').sort((a, b) => Number(b.def!.type === 'principale') - Number(a.def!.type === 'principale'));
    const finies = quetes.filter((x) => x.q.statut === 'terminee' || x.q.statut === 'echouee');
    return [
      {
        onglet: 'Journal',
        id: 'quetes-en-cours',
        titre: 'Quêtes en cours',
        ordre: 0,
        texte: enCours.length ? undefined : "Aucune quête pour l'instant : parlez aux habitants.",
        lignes: enCours.map(({ q, def }) => ({
          libelle: def!.nom,
          valeur: TYPES[def!.type],
          detail: [def!.resume, ...q.actives.map((e) => `→ ${def!.etapes.find((x) => x.id === e)?.texte ?? e}`)].join('\n'),
          ton: def!.type === 'principale' ? ('fort' as const) : undefined,
          fiche: ficheDeQuete(ctx, p, def!, q.statut, q.actives),
        })),
      },
      ...(finies.length
        ? [
            {
              onglet: 'Journal',
              id: 'quetes-finies',
              titre: 'Quêtes achevées',
              ordre: 1,
              lignes: finies.map(({ q, def }) => ({ libelle: def!.nom, valeur: q.statut === 'terminee' ? 'accomplie' : 'échouée', ton: q.statut === 'terminee' ? ('succes' as const) : ('danger' as const), fiche: ficheDeQuete(ctx, p, def!, q.statut, []) })),
            },
          ]
        : []),
    ];
  },
};
