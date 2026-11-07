// Module Inventaire : le sac du groupe (objets trouvés, achetés, reçus), l'usage des consommables, les potions
// confiées aux héros (qu'ils boivent ensuite en combat), l'identification des objets rares, et ce qu'on jette.
import { z } from 'zod';
import { lancer } from '../des';
import { appliquerEffets } from '../monde/etat';
import type { Objet } from '../monde/schemas';
import { commande, type ContexteJeu, type ElementGrille, type Encart, type Module, type Partie, type Proposition, type Transaction } from '../noyau/types';
import { equipementDe, type Personnage } from '../personnage';
import { testD20 } from '../tests-d20';
import { objetDe } from './catalogue';
import { libre } from './commun';
import { chargeDuGroupe, idElementPorte, objetsPortes } from './equipement-regles';
import { idImageCommune } from './image-commune';

declare module '../noyau/types' {
  interface CarteEvenements {
    objetUtilise: { objet: string; personnage?: string };
    objetIdentifie: { objet: string };
  }
}

export interface EtatInventaire {
  /** Objets dont le groupe connaît l'histoire et les propriétés. */
  identifies: string[];
  /** Objets arrivés dans le sac que le joueur n'a pas encore regardés (pastille « nouveau »). */
  nouveaux?: string[];
}

/** La potion que les héros boivent en combat (2d4 + 2). */
export const POTION_DE_COMBAT = 'potion-de-guerison';

export { objetDe };

const etatModule = (p: Partie): EtatInventaire => (p.modules['inventaire'] as EtatInventaire | undefined) ?? { identifies: [] };
/** L'état du module, créé s'il manque, pour le modifier. */
const etatPourModifier = (p: Partie): EtatInventaire & { nouveaux: string[] } => {
  const e = (p.modules['inventaire'] ??= { identifies: [] }) as EtatInventaire;
  return Object.assign(e, { nouveaux: e.nouveaux ?? [] }) as EtatInventaire & { nouveaux: string[] };
};

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

/** Les groupes du sac, dans l'ordre d'affichage. */
const GROUPES_SAC = {
  quete: { id: 'quete', titre: 'Objets de quête', ordre: 0 },
  consommables: { id: 'consommables', titre: 'Consommables', ordre: 1 },
  armes: { id: 'armes', titre: 'Armes', ordre: 2 },
  armures: { id: 'armures', titre: 'Armures et boucliers', ordre: 3 },
  parures: { id: 'parures', titre: 'Parures et vêtements', ordre: 4 },
  magie: { id: 'magie', titre: 'Baguettes et parchemins', ordre: 5 },
  materiel: { id: 'materiel', titre: 'Outils et matériel', ordre: 6 },
  savoir: { id: 'savoir', titre: 'Livres et clés', ordre: 7 },
  curiosites: { id: 'curiosites', titre: 'Curiosités et trésors', ordre: 8 },
  divers: { id: 'divers', titre: 'Divers', ordre: 9 },
} as const;

function groupeDuSac(o: Pick<Objet, 'categorie'> & Partial<Objet>): (typeof GROUPES_SAC)[keyof typeof GROUPES_SAC] {
  if (o.categorie === 'quete') return GROUPES_SAC.quete;
  if (o.usage?.type === 'consommable' || o.categorie === 'potion' || o.categorie === 'nourriture') return GROUPES_SAC.consommables;
  switch (o.categorie) {
    case 'arme':
      return GROUPES_SAC.armes;
    case 'armure':
    case 'bouclier':
      return GROUPES_SAC.armures;
    case 'bijou':
    case 'anneau':
    case 'vetement':
      return GROUPES_SAC.parures;
    case 'baguette':
    case 'parchemin':
      return GROUPES_SAC.magie;
    case 'outil':
    case 'materiel':
      return GROUPES_SAC.materiel;
    case 'livre':
    case 'cle':
      return GROUPES_SAC.savoir;
    case 'curiosite':
    case 'monnaie-ancienne':
    case 'gemme':
    case 'objet-d-art':
      return GROUPES_SAC.curiosites;
    default:
      return GROUPES_SAC.divers;
  }
}

/** Un objet du sac vu par la grille : ce que le joueur a le droit de savoir (un objet à identifier reste mystérieux). */
function elementDuSac(ctx: ContexteJeu, o: ReturnType<typeof objetDe>, quantite: number, identifies: string[], nouveaux: string[]): ElementGrille {
  const aIdentifier = !!o.identification && !identifies.includes(o.id);
  const mystere = aIdentifier ? o.inconnu : undefined;
  const proprietes: { libelle: string; valeur: string }[] = [];
  const base = o.base ?? o.id;
  const arme = o.categorie === 'arme' ? ctx.srd?.armes.get(base) : undefined;
  const armure = o.categorie === 'armure' || o.categorie === 'bouclier' ? ctx.srd?.armures.get(base) : undefined;
  if (aIdentifier) proprietes.push({ libelle: 'À étudier', valeur: `Arcanes, DD ${o.identification}` });
  else {
    // Les caractéristiques de l'arme ou de l'armure viennent du catalogue du SRD, commun à tous les mondes.
    if (arme) {
      proprietes.push({ libelle: 'Dégâts', valeur: `${arme.degats} ${arme.typeDegats}` });
      if (arme.proprietes.length) proprietes.push({ libelle: 'Propriétés', valeur: arme.proprietes.join(', ') });
      if (arme.portees) proprietes.push({ libelle: 'Portée', valeur: `${arme.portees[0]} / ${arme.portees[1]} m` });
    }
    if (armure) {
      proprietes.push({ libelle: armure.categorie === 'bouclier' ? 'CA' : 'CA de base', valeur: armure.categorie === 'bouclier' ? `+${armure.ca}` : `${armure.ca}${armure.dex === 'complet' ? ' + Dex' : armure.dex === 'max2' ? ' + Dex (2 au plus)' : ''}` });
      if (armure.forceMin) proprietes.push({ libelle: 'Force min.', valeur: String(armure.forceMin) });
      if (armure.desavantageDiscretion) proprietes.push({ libelle: 'Discrétion', valeur: 'désavantage' });
    }
    if (o.usage) {
      const type = { consommable: 'Consommable', charges: 'À charges', permanent: 'Effet permanent' }[o.usage.type];
      proprietes.push({ libelle: type, valeur: o.usage.soins ? `soigne ${o.usage.soins}` : (o.usage.resume ?? '—') });
    }
    const b = o.bonus;
    if (b) proprietes.push({ libelle: 'Bonus', valeur: [b.attaque && `${b.attaque > 0 ? '+' : ''}${b.attaque} attaque`, b.degats && `${b.degats > 0 ? '+' : ''}${b.degats} dégâts`, b.ca && `${b.ca > 0 ? '+' : ''}${b.ca} CA`].filter(Boolean).join(', ') });
    if (o.attunement) proprietes.push({ libelle: 'Harmonisation', valeur: 'requise' });
    if (o.maudit && identifies.includes(o.id)) proprietes.push({ libelle: 'Malédiction', valeur: o.maudit });
  }
  return {
    id: o.id,
    titre: mystere?.nom ?? o.nom,
    quantite,
    groupe: groupeDuSac(o),
    rarete: o.rarete,
    image: { groupe: 'objets', id: o.id },
    // Le SRD est commun à tous les mondes : l'image d'un objet du catalogue se partage, sans la refaire par histoire.
    imageCommune: { groupe: 'equipement', id: idImageCommune(base) },
    icone: o.categorie,
    resume: mystere?.resume ?? o.resume,
    histoire: !aIdentifier && identifies.includes(o.id) ? o.lore : undefined,
    mesures: [
      { id: 'valeur', libelle: 'Valeur', valeur: o.valeurPo ?? 0, unite: 'po' },
      ...(o.poidsKg !== undefined ? [{ id: 'poids', libelle: 'Poids', valeur: o.poidsKg, unite: 'kg' }] : []),
    ],
    proprietes,
    nouveau: nouveaux.includes(o.id) || undefined,
    ordreVu: nouveaux.includes(o.id) ? { type: 'voirObjet', objet: o.id } : undefined,
    inconnu: aIdentifier || undefined,
    magique: (o.magique && !aIdentifier) || undefined,
    ton: o.categorie === 'quete' ? 'fort' : o.magique && !aIdentifier ? 'succes' : undefined,
  };
}

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
          if (!cible || cible.pv >= cible.fiche.pvMax) return { refus: `${cible?.nom ?? 'Personne'} n’a pas besoin de soins.` };
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
    rendrePotion: commande({
      description: 'Rendre au sac du groupe une potion de guérison que portait un héros.',
      entree: z.object({ personnage: z.string() }),
      disponible: libre,
      executer: (t, e) => {
        const a = t.partie.groupe.find((x) => x.id === e.personnage);
        if (!a) return { refus: 'Aucun héros de ce nom.' };
        if (!(a.ressources.potions ?? 0)) return { refus: `${a.nom} ne porte aucune potion de guérison.` };
        a.ressources.potions = (a.ressources.potions ?? 0) - 1;
        t.partie.etat.inventaire[POTION_DE_COMBAT] = (t.partie.etat.inventaire[POTION_DE_COMBAT] ?? 0) + 1;
        t.emettre({ type: 'constat', texte: `${a.nom} range une potion de guérison dans le sac (${a.ressources.potions} gardée(s)).` });
      },
      propositions: (ctx, p) =>
        p.groupe
          .filter((a) => (a.ressources.potions ?? 0) > 0)
          .map((a) => ({
            groupe: PANNEAU_SAC,
            element: { id: idElementPorte(a.id, POTION_DE_COMBAT), titre: `${objetDe(ctx, POTION_DE_COMBAT).nom} (${a.nom})` },
            libelle: 'Rendre au sac',
            style: 'discret' as const,
            aide: 'La potion revient dans le sac du groupe.',
            ordre: { type: 'rendrePotion', personnage: a.id },
          })),
    }),
    identifierObjet: commande({
      description: "Étudier un objet du sac pour en connaître l'histoire et les propriétés (jet d'Arcanes contre son DD).",
      entree: z.object({ objet: z.string(), personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[e.objet] ?? 0)) return { refus: "Le groupe n'a pas cet objet." };
        const o = objetDe(t.ctx, e.objet);
        const etat = etatPourModifier(t.partie);
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
    voirObjet: commande({
      description: 'Marquer un objet du sac comme vu (retire sa pastille « nouveau »).',
      entree: z.object({ objet: z.string() }),
      executer: (t, e) => {
        const es = etatPourModifier(t.partie);
        es.nouveaux = es.nouveaux.filter((x) => x !== e.objet);
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
  reactions: {
    // Un objet qui arrive est « nouveau » jusqu'à ce que le joueur le regarde ; un objet qui n'est plus dans le sac ne l'est plus.
    objetObtenu: (t, e) => {
      const es = etatPourModifier(t.partie);
      if (!es.nouveaux.includes(e.objet)) es.nouveaux.push(e.objet);
    },
    objetPerdu: (t, e) => {
      if (t.partie.etat.inventaire[e.objet]) return;
      const es = etatPourModifier(t.partie);
      es.nouveaux = es.nouveaux.filter((x) => x !== e.objet);
    },
  },
  encarts: (ctx, p): Encart[] => {
    const identifies = etatModule(p).identifies;
    const nouveaux = etatModule(p).nouveaux ?? [];
    const dansLeSac = Object.entries(p.etat.inventaire).map(([id, q]) => elementDuSac(ctx, objetDe(ctx, id), q, identifies, nouveaux));
    // Ce que portent les héros : un groupe par héros, avant le sac ; l'objet garde son identifiant propre pour ses actions.
    const portes = p.groupe.flatMap((h, i) =>
      objetsPortes(equipementDe(h)).map((id) => ({
        ...elementDuSac(ctx, objetDe(ctx, id), 1, identifies, []),
        id: idElementPorte(h.id, id),
        quantite: undefined,
        groupe: { id: `porte:${h.id}`, titre: `Porté par ${h.nom}`, ordre: -100 + i },
        porteur: { id: h.id, nom: h.nom },
      })),
    );
    // Les potions de guérison confiées à un héros sont dans ses ressources, pas dans le sac : elles apparaissent aussi parmi ce qu'il porte.
    const potions = p.groupe.flatMap((h, i) =>
      (h.ressources.potions ?? 0) > 0
        ? [
            {
              ...elementDuSac(ctx, objetDe(ctx, POTION_DE_COMBAT), h.ressources.potions!, identifies, []),
              id: idElementPorte(h.id, POTION_DE_COMBAT),
              groupe: { id: `porte:${h.id}`, titre: `Porté par ${h.nom}`, ordre: -100 + i },
              porteur: { id: h.id, nom: h.nom },
            },
          ]
        : [],
    );
    const elements = [...dansLeSac, ...portes, ...potions];
    const { poids, capacite } = chargeDuGroupe(ctx, p.groupe, p.etat.inventaire);
    return [
      {
        onglet: 'Sac',
        id: 'sac-objets',
        titre: 'Le sac du groupe',
        ordre: 0,
        grille: {
          elements,
          resume: [
            { libelle: 'Pièces', valeur: `${p.etat.pieces.toLocaleString('fr-FR')} po`, ton: 'fort' },
            { libelle: 'Charge du groupe', valeur: `${poids.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / ${capacite.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg`, ton: poids > capacite ? ('danger' as const) : undefined },
          ],
          vide: 'Le sac est vide.',
          touche: 'i',
        },
      },
      {
        onglet: 'Sac',
        id: 'sac-potions',
        titre: 'Potions de guérison portées',
        ordre: 1,
        lignes: p.groupe.map((a) => ({ libelle: a.nom, valeur: String(a.ressources.potions ?? 0), ton: (a.ressources.potions ?? 0) ? undefined : ('faible' as const) })),
      },
    ];
  },
};

// Les boutons du sac : chaque commande propose ses actions sur les objets qu'elle concerne.
const propositionsSac = (ctx: ContexteJeu, p: Partie): Proposition[] => {
  const res: Proposition[] = [];
  const blesse = plusBlesse(p);
  const identifies = etatModule(p).identifies;
  /** Un choix de héros : portrait, nom et une précision. */
  const heros = (precision: (a: Personnage) => string, indisponible?: (a: Personnage) => string | undefined) =>
    p.groupe.map((a) => ({ valeur: a.id, libelle: a.nom, personnage: a.id, detail: precision(a), desactivee: indisponible?.(a) }));
  for (const [id, q] of Object.entries(p.etat.inventaire).sort(([a], [b]) => objetDe(ctx, a).nom.localeCompare(objetDe(ctx, b).nom))) {
    const o = objetDe(ctx, id);
    const element = { id, titre: `${q > 1 ? `${q} × ` : ''}${o.nom}` };
    const agir = (x: Omit<Proposition, 'groupe' | 'element'>) => res.push({ groupe: PANNEAU_SAC, element, ...x });
    if (o.usage?.type === 'consommable' && o.usage.soins) {
      const ordre = { type: 'utiliserObjet', objet: id };
      agir({ libelle: blesse ? `Soigner ${blesse.nom}` : 'Soigner', icone: 'sort:soins', desactivee: blesse ? undefined : 'Personne n’est blessé.', ordre });
      agir({
        libelle: 'Soigner…',
        style: 'discret',
        desactivee: blesse ? undefined : 'Personne n’est blessé.',
        ordre,
        choix: { champ: 'personnage', indication: 'Soigner qui ?', options: heros((a) => `${a.pv}/${a.fiche.pvMax} PV`, (a) => (a.pv >= a.fiche.pvMax ? 'Pas blessé.' : undefined)) },
      });
    } else if (o.usage?.type === 'consommable') {
      agir({ libelle: 'Utiliser', aide: o.usage.resume, ordre: { type: 'utiliserObjet', objet: id } });
    }
    if (id === POTION_DE_COMBAT) {
      const a = moinsDePotions(p);
      const ordre = { type: 'confierPotion' };
      if (a) agir({ libelle: `Confier à ${a.nom}`, style: 'discret', aide: 'Il pourra la boire en combat.', ordre });
      agir({
        libelle: 'Confier à…',
        style: 'discret',
        aide: 'Il pourra la boire en combat.',
        ordre,
        choix: { champ: 'personnage', indication: 'Confier à qui ?', options: heros((x) => `${x.ressources.potions ?? 0} potion(s)`) },
      });
    }
    if (o.identification && !identifies.includes(id)) {
      const ordre = { type: 'identifierObjet', objet: id };
      agir({ libelle: 'Identifier', icone: 'ecole:divination', style: 'discret', aide: `Arcanes, DD ${o.identification}`, ordre });
      agir({
        libelle: 'Identifier avec…',
        style: 'discret',
        ordre,
        choix: { champ: 'personnage', indication: 'Qui l’étudie ?', options: heros((a) => `Arcanes ${a.fiche.competences.arcanes.bonus >= 0 ? '+' : ''}${a.fiche.competences.arcanes.bonus}`) },
      });
    }
    if (o.categorie !== 'quete') {
      agir({ libelle: q > 1 ? 'Jeter 1' : 'Jeter', style: 'discret', confirmer: true, ordre: { type: 'jeterObjet', objet: id } });
      if (q > 1) agir({ libelle: `Jeter les ${q}`, style: 'discret', confirmer: true, ordre: { type: 'jeterObjet', objet: id, quantite: q } });
    }
  }
  return res;
};
// Rattachées à la commande la plus générale : une seule source de boutons pour tout le sac.
moduleInventaire.commandes!.utiliserObjet!.propositions = propositionsSac;
