// Module Journal : les quêtes (en cours avec leurs étapes, accomplies, échouées) et les notes du groupe (ce qu'il a
// appris de sûr). Un module sans commande : il ne fait que montrer l'état, tiré des quêtes du monde et des faits connus.
import type { Encart, Module } from '../noyau/types';

const TYPES = { principale: 'Quête principale', secondaire: 'Quête secondaire', personnelle: 'Quête personnelle', faction: 'Quête de faction' } as const;

export const moduleJournal: Module = {
  id: 'journal',
  encarts: (ctx, p): Encart[] => {
    const quetes = Object.entries(p.etat.quetes)
      .map(([id, q]) => ({ id, q, def: ctx.dm.quetes.get(id) }))
      .filter((x) => x.def);
    const enCours = quetes.filter((x) => x.q.statut === 'active' || x.q.statut === 'proposee').sort((a, b) => Number(b.def!.type === 'principale') - Number(a.def!.type === 'principale'));
    const finies = quetes.filter((x) => x.q.statut === 'terminee' || x.q.statut === 'echouee');
    // Les notes : les faits sûrs, du plus récent au plus ancien (une rumeur porte la vérité pour le conteur : elle n'y figure pas).
    const notes = [...p.etat.faits]
      .reverse()
      .map((f) => ctx.dm.faits.get(f))
      .filter((f) => f?.fiable);
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
        })),
      },
      ...(finies.length
        ? [
            {
              onglet: 'Journal',
              id: 'quetes-finies',
              titre: 'Quêtes achevées',
              ordre: 1,
              lignes: finies.map(({ q, def }) => ({ libelle: def!.nom, valeur: q.statut === 'terminee' ? 'accomplie' : 'échouée', ton: q.statut === 'terminee' ? ('succes' as const) : ('danger' as const) })),
            },
          ]
        : []),
      {
        onglet: 'Journal',
        id: 'notes',
        titre: 'Notes',
        ordre: 2,
        texte: notes.length ? undefined : 'Rien de noté pour l’instant.',
        lignes: notes.slice(0, 40).map((f) => ({ libelle: f!.texte })),
      },
    ];
  },
};
