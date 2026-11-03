// Module Inventaire : le sac du groupe (objets trouvés, achetés, reçus), l'usage des consommables, les potions
// confiées aux héros (qu'ils boivent ensuite en combat), l'identification des objets rares, et ce qu'on jette.
import { z } from 'zod';
import { lancer } from '../des';
import { appliquerEffets } from '../monde/etat';
import type { Objet } from '../monde/schemas';
import { commande, type ContexteJeu, type Encart, type Module, type Partie, type Proposition, type Transaction } from '../noyau/types';
import type { Personnage } from '../personnage';
import { testD20 } from '../tests-d20';
import { libre } from './commun';

declare module '../noyau/types' {
  interface CarteEvenements {
    objetUtilise: { objet: string; personnage?: string };
    objetIdentifie: { objet: string };
  }
}

export interface EtatInventaire {
  /** Objets dont le groupe connaît l'histoire et les propriétés. */
  identifies: string[];
}

/** La potion que les héros boivent en combat (2d4 + 2). */
export const POTION_DE_COMBAT = 'potion-de-guerison';

/** Un objet du catalogue : celui du monde d'abord, puis celui du SRD (équipement, potions, armes, armures). */
export function objetDe(ctx: ContexteJeu, id: string): Pick<Objet, 'id' | 'nom' | 'categorie' | 'resume'> & Partial<Objet> {
  const o = ctx.dm.objets.get(id) ?? ctx.srd?.objets.get(id);
  if (o) return o;
  const arme = ctx.srd?.armes.get(id);
  if (arme) return { id, nom: arme.nom, categorie: 'arme', resume: `Arme : ${arme.degats} ${arme.typeDegats}.`, poidsKg: arme.poidsKg, valeurPo: arme.prixPo };
  const armure = ctx.srd?.armures.get(id);
  if (armure) return { id, nom: armure.nom, categorie: armure.id === 'bouclier' ? 'bouclier' : 'armure', resume: `Armure (CA ${armure.ca})` };
  return { id, nom: id, categorie: 'divers', resume: '' };
}

const etatModule = (p: Partie): EtatInventaire => (p.modules['inventaire'] as EtatInventaire | undefined) ?? { identifies: [] };

const vivants = (p: Partie) => p.groupe.filter((a) => a.pv > 0);
/** Le héros le plus blessé (proportion de PV la plus basse), s'il y en a un. */
export function plusBlesse(p: Partie): Personnage | undefined {
  return p.groupe.filter((a) => a.pv < a.fiche.pvMax).sort((a, b) => a.pv / a.fiche.pvMax - b.pv / b.fiche.pvMax)[0];
}
/** Le héros qui porte le moins de potions. */
const moinsDePotions = (p: Partie) => [...vivants(p)].sort((a, b) => (a.ressources.potions ?? 0) - (b.ressources.potions ?? 0))[0];

function retirer(t: Transaction, objet: string, quantite = 1): void {
  const n = (t.partie.etat.inventaire[objet] ?? 0) - quantite;
  if (n > 0) t.partie.etat.inventaire[objet] = n;
  else delete t.partie.etat.inventaire[objet];
}

function soigner(t: Transaction, cible: Personnage, des: string, bonus = 0): number {
  const avant = cible.pv;
  cible.pv = Math.min(cible.fiche.pvMax, cible.pv + Math.max(1, lancer(des, t.hasard).total + bonus));
  return cible.pv - avant;
}

const PANNEAU_SAC = { id: 'sac', titre: 'Objets', ordre: 10, onglet: 'Sac' };

export const moduleInventaire: Module = {
  id: 'inventaire',
  dependances: ['exploration'],
  etatInitial: (): EtatInventaire => ({ identifies: [] }),
  commandes: {
    utiliserObjet: commande({
      description: "Utiliser un objet consommable du sac (soins, onguent, cendre bénite…) ; sans personnage, sur le héros le plus blessé.",
      entree: z.object({ objet: z.string(), personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[e.objet] ?? 0)) return { refus: "Le groupe n'a pas cet objet." };
        const o = objetDe(t.ctx, e.objet);
        if (o.usage?.type !== 'consommable') return { refus: `${o.nom} ne s'utilise pas ainsi${o.usage?.type === 'permanent' ? ' : son effet est permanent tant qu’on le porte' : ''}.` };
        let cible: Personnage | undefined;
        if (o.usage.soins) {
          cible = e.personnage ? t.partie.groupe.find((a) => a.id === e.personnage) : plusBlesse(t.partie);
          if (!cible) return { refus: 'Personne n’a besoin de soins.' };
          const gain = soigner(t, cible, o.usage.soins);
          t.emettre({ type: 'constat', texte: `${cible.nom} utilise ${o.nom} : +${gain} PV (${cible.pv}/${cible.fiche.pvMax}).` });
        } else {
          t.emettre({ type: 'constat', texte: `Le groupe utilise ${o.nom}.${o.usage.resume ? ` ${o.usage.resume}` : ''}` });
        }
        if (o.usage.effets.length) appliquerEffets(o.usage.effets, t.partie.etat, t.ctx.dm);
        retirer(t, e.objet);
        t.emettre({ type: 'objetUtilise', objet: e.objet, personnage: cible?.id });
      },
    }),
    confierPotion: commande({
      description: 'Confier une potion de guérison du sac à un héros, qui pourra la boire en combat ; sans personnage, à celui qui en a le moins.',
      entree: z.object({ personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[POTION_DE_COMBAT] ?? 0)) return { refus: "Il n'y a plus de potion de guérison dans le sac." };
        const a = e.personnage ? t.partie.groupe.find((x) => x.id === e.personnage) : moinsDePotions(t.partie);
        if (!a) return { refus: 'Personne pour la prendre.' };
        retirer(t, POTION_DE_COMBAT);
        a.ressources.potions = (a.ressources.potions ?? 0) + 1;
        t.emettre({ type: 'constat', texte: `${a.nom} prend une potion de guérison (${a.ressources.potions} en tout).` });
      },
    }),
    identifierObjet: commande({
      description: "Étudier un objet du sac pour en connaître l'histoire et les propriétés (jet d'Arcanes contre son DD).",
      entree: z.object({ objet: z.string(), personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[e.objet] ?? 0)) return { refus: "Le groupe n'a pas cet objet." };
        const o = objetDe(t.ctx, e.objet);
        const etat = (t.partie.modules['inventaire'] ??= { identifies: [] }) as EtatInventaire;
        if (!o.identification || etat.identifies.includes(e.objet)) return { refus: `${o.nom} n'a pas de secret à percer.` };
        const a = e.personnage ? t.partie.groupe.find((x) => x.id === e.personnage) : [...vivants(t.partie)].sort((x, y) => y.fiche.competences.arcanes.bonus - x.fiche.competences.arcanes.bonus)[0];
        if (!a) return { refus: 'Personne ne peut l’étudier.' };
        const bonus = a.fiche.competences.arcanes.bonus;
        const r = testD20({ bonus, dd: o.identification }, t.hasard);
        t.emettre({ type: 'jet', jet: { qui: a.id, nom: a.nom, test: 'arcanes', dd: o.identification, des: r.des, bonus, total: r.total, reussite: r.reussite } });
        if (!r.reussite) {
          t.emettre({ type: 'constat', texte: `${a.nom} ne perce pas le secret de ${o.nom}.` });
          return;
        }
        etat.identifies.push(e.objet);
        t.emettre({ type: 'objetIdentifie', objet: e.objet });
        t.emettre({ type: 'texte', texte: o.lore ?? o.resume });
        if (o.maudit) t.emettre({ type: 'constat', texte: `Attention : ${o.maudit}` });
      },
    }),
    jeterObjet: commande({
      description: "Se débarrasser d'un objet du sac (sauf les objets de quête).",
      entree: z.object({ objet: z.string(), quantite: z.number().int().positive().optional() }),
      disponible: libre,
      executer: (t, e) => {
        const n = t.partie.etat.inventaire[e.objet] ?? 0;
        if (!n) return { refus: "Le groupe n'a pas cet objet." };
        const o = objetDe(t.ctx, e.objet);
        if (o.categorie === 'quete') return { refus: `${o.nom} est trop important pour être abandonné.` };
        retirer(t, e.objet, Math.min(n, e.quantite ?? 1));
        t.emettre({ type: 'constat', texte: `Le groupe abandonne ${o.nom}.` });
      },
    }),
  },
  encarts: (ctx, p): Encart[] => {
    const objets = Object.entries(p.etat.inventaire).map(([id, q]) => ({ o: objetDe(ctx, id), q }));
    const poids = objets.reduce((s, x) => s + (x.o.poidsKg ?? 0) * x.q, 0);
    const identifies = etatModule(p).identifies;
    return [
      {
        onglet: 'Sac',
        id: 'sac-bourse',
        titre: 'Bourse et charge',
        ordre: 0,
        lignes: [
          { libelle: 'Pièces', valeur: `${p.etat.pieces.toLocaleString('fr-FR')} po`, ton: 'fort' },
          { libelle: 'Poids du sac', valeur: `${poids.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg` },
        ],
      },
      {
        onglet: 'Sac',
        id: 'sac-potions',
        titre: 'Potions de guérison portées',
        ordre: 1,
        lignes: p.groupe.map((a) => ({ libelle: a.nom, valeur: String(a.ressources.potions ?? 0), ton: (a.ressources.potions ?? 0) ? undefined : ('faible' as const) })),
      },
      {
        onglet: 'Sac',
        id: 'sac-objets',
        titre: 'Le sac du groupe',
        ordre: 2,
        texte: objets.length ? undefined : 'Le sac est vide.',
        lignes: objets
          .sort((a, b) => a.o.nom.localeCompare(b.o.nom))
          .map(({ o, q }) => ({
            libelle: `${q > 1 ? `${q} × ` : ''}${o.nom}`,
            valeur: o.valeurPo ? `${o.valeurPo.toLocaleString('fr-FR')} po` : undefined,
            detail: identifies.includes(o.id) && o.lore ? o.lore : o.resume,
            ton: o.categorie === 'quete' ? ('fort' as const) : o.magique ? ('succes' as const) : undefined,
          })),
      },
    ];
  },
};

// Les boutons du sac : chaque commande propose ses actions sur les objets qu'elle concerne.
const propositionsSac = (ctx: ContexteJeu, p: Partie): Proposition[] => {
  const res: Proposition[] = [];
  const blesse = plusBlesse(p);
  const identifies = etatModule(p).identifies;
  for (const [id, q] of Object.entries(p.etat.inventaire).sort(([a], [b]) => objetDe(ctx, a).nom.localeCompare(objetDe(ctx, b).nom))) {
    const o = objetDe(ctx, id);
    const element = { id, titre: `${q > 1 ? `${q} × ` : ''}${o.nom}` };
    if (o.usage?.type === 'consommable' && o.usage.soins) {
      res.push({ groupe: PANNEAU_SAC, element, libelle: blesse ? `Soigner ${blesse.nom}` : 'Soigner', desactivee: blesse ? undefined : 'Personne n’est blessé.', ordre: { type: 'utiliserObjet', objet: id } });
    } else if (o.usage?.type === 'consommable') {
      res.push({ groupe: PANNEAU_SAC, element, libelle: 'Utiliser', aide: o.usage.resume, ordre: { type: 'utiliserObjet', objet: id } });
    }
    if (id === POTION_DE_COMBAT) {
      const a = moinsDePotions(p);
      if (a) res.push({ groupe: PANNEAU_SAC, element, libelle: `Confier à ${a.nom}`, style: 'discret', aide: 'Il pourra la boire en combat.', ordre: { type: 'confierPotion' } });
    }
    if (o.identification && !identifies.includes(id)) res.push({ groupe: PANNEAU_SAC, element, libelle: 'Identifier', style: 'discret', aide: `Arcanes, DD ${o.identification}`, ordre: { type: 'identifierObjet', objet: id } });
    if (o.categorie !== 'quete' && res.some((x) => x.element?.id === id)) res.push({ groupe: PANNEAU_SAC, element, libelle: 'Jeter', style: 'discret', ordre: { type: 'jeterObjet', objet: id } });
  }
  return res;
};
// Rattachées à la commande la plus générale : une seule source de boutons pour tout le sac.
moduleInventaire.commandes!.utiliserObjet!.propositions = propositionsSac;
