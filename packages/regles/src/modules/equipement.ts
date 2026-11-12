// Module Équipement : équiper un héros (armure, armes, bouclier, vêtements, bijoux) à son emplacement et le lui retirer, prendre en main
// l'autre jeu d'armes. Tout ce que ça change se lit ensuite dans sa fiche (CA, armes de combat) : le combat n'a rien de plus à
// savoir. Le catalogue est celui du SRD, commun à tous les mondes (voir `equipement-regles.ts`). Les objets portés s'affichent
// dans la grille du sac (module Inventaire), groupés par héros ; les actions viennent d'ici.
import { z } from 'zod';
import { autreJeu, EMPLACEMENTS, NOMS_EMPLACEMENTS, type Emplacement } from '../equipement/emplacements';
import { commande, type ContexteJeu, type Module, type Partie, type Proposition } from '../noyau/types';
import { equipementDe, type Personnage } from '../personnage';
import { objetDe } from './catalogue';
import { libre } from './commun';
import { appliquerEquipement, caAvecEquipement, copieEquipement, harmonises, HARMONISES_MAX, idElementPorte, infoEquipement, mainsArmees, normaliserEquipement, placer, retirerDe } from './equipement-regles';

declare module '../noyau/types' {
  interface CarteEvenements {
    equipementChange: { personnage: string; objet: string; ancien?: string; retire?: boolean };
  }
}

const PANNEAU_SAC = { id: 'sac', titre: 'Objets', ordre: 10, onglet: 'Sac' };

/** Ce que donnerait l'équipement du héros avec cet objet en plus, ou la raison de le refuser (mains, emplacement, harmonisation). */
function avecObjet(ctx: ContexteJeu, h: Personnage, objet: string, emplacement?: Emplacement) {
  const r = placer(ctx, h, objet, emplacement);
  // Harmonisation : compte tout ce qui serait porté (une pièce harmonisée remplace peut-être une autre).
  if ('equipe' in r && objetDe(ctx, objet).attunement && harmonises(ctx, r.equipe) > HARMONISES_MAX) return { refus: `${h.nom} est déjà harmonisé à ${HARMONISES_MAX} objets magiques, le maximum.` };
  return r;
}

/** Les mises en garde des règles (formation, Force) : on équipe quand même, comme à la création. */
function mises(ctx: ContexteJeu, h: Personnage, objet: string): string[] {
  const info = infoEquipement(ctx, objet);
  const res: string[] = [];
  if (info?.genre === 'armure' || info?.genre === 'bouclier') {
    const a = ctx.srd?.armures.get(info.base!);
    if (a && !h.fiche.formationArmures.includes(a.categorie))
      res.push(
        info.genre === 'bouclier'
          ? `${h.nom} n'a pas la formation au bouclier : pas de bonus de CA, désavantage aux attaques et aux jets de Force et de Dextérité, aucun sort possible.`
          : `${h.nom} n'a pas la formation à cette armure : désavantage aux attaques et aux jets de Force et de Dextérité, et il ne pourra lancer aucun sort.`,
      );
    if (a?.forceMin && h.fiche.caracteristiques.for.valeur < a.forceMin) res.push(`Force ${a.forceMin} requise pour cette armure : ${h.nom} serait ralenti de 3 m.`);
  }
  return res;
}

function retirerDuSac(sac: Record<string, number>, id: string): void {
  const n = (sac[id] ?? 0) - 1;
  if (n > 0) sac[id] = n;
  else delete sac[id];
}

const verserAuSac = (sac: Record<string, number>, ids: string[]) => {
  for (const id of ids) sac[id] = (sac[id] ?? 0) + 1;
};

const nomsDe = (ctx: ContexteJeu, ids: string[]) => ids.map((id) => objetDe(ctx, id).nom).join(', ');

/** Range l'équipement de chaque héros dans les emplacements (départ d'une partie, ancienne sauvegarde) ; le surplus va dans le sac. */
function rangerLeGroupe(ctx: ContexteJeu, partie: Partie): void {
  if (!ctx.srd) return;
  for (const h of partie.groupe) verserAuSac(partie.etat.inventaire, normaliserEquipement(ctx, h));
}

export const moduleEquipement: Module = {
  id: 'equipement',
  dependances: ['inventaire'],
  demarrer: rangerLeGroupe,
  apresChargement: rangerLeGroupe,
  commandes: {
    equiper: commande({
      description:
        "Équiper un héros d'un objet du sac (armure, bouclier, arme, bijou, vêtement ou objet magique) à son emplacement (tête, cou, torse, dos, gants, ceinture, pieds, anneaux, mains des jeux d'armes I et II) ; ce qu'il portait à la même place revient dans le sac. Une arme à deux mains prend les deux mains ; la main gauche tient un bouclier ou une arme Légère. Recalcule sa Classe d'Armure et ses armes de combat.",
      entree: z.object({ objet: z.string(), personnage: z.string(), emplacement: z.enum(EMPLACEMENTS).optional() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[e.objet] ?? 0)) return { refus: "Le groupe n'a pas cet objet." };
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        if (h.pv <= 0) return { refus: `${h.nom} est hors de combat.` };
        const r = avecObjet(t.ctx, h, e.objet, e.emplacement);
        if ('refus' in r) return { refus: r.refus };
        const caAvant = h.fiche.ca;
        const o = objetDe(t.ctx, e.objet);
        retirerDuSac(t.partie.etat.inventaire, e.objet);
        verserAuSac(t.partie.etat.inventaire, r.remis);
        h.equipe = r.equipe;
        appliquerEquipement(t.ctx, h);
        t.emettre({
          type: 'constat',
          texte: `${h.nom} équipe ${o.nom} (${NOMS_EMPLACEMENTS[r.emplacement].toLowerCase()})${r.remis.length ? ` : ${nomsDe(t.ctx, r.remis)} retourne dans le sac` : ''}${h.fiche.ca !== caAvant ? ` : CA ${caAvant} → ${h.fiche.ca}` : ''}.`,
        });
        for (const m of mises(t.ctx, h, e.objet)) t.emettre({ type: 'constat', texte: m });
        t.emettre({ type: 'equipementChange', personnage: h.id, objet: e.objet, ancien: r.remis[0] });
      },
      propositions: (ctx, p) => propositionsEquiper(ctx, p),
    }),
    retirerEquipement: commande({
      description: "Retirer un objet porté par un héros (par son emplacement, ou par l'objet) : il revient dans le sac. Recalcule sa Classe d'Armure et ses armes de combat.",
      entree: z.object({ objet: z.string().optional(), personnage: z.string(), emplacement: z.enum(EMPLACEMENTS).optional() }),
      disponible: libre,
      executer: (t, e) => {
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        const eq = equipementDe(h);
        const s = e.emplacement ?? EMPLACEMENTS.find((x) => eq.emplacements[x] === e.objet);
        if (!s || !eq.emplacements[s] || (e.objet && eq.emplacements[s] !== e.objet)) return { refus: `${h.nom} ne porte pas cet objet.` };
        const retire = eq.emplacements[s]!;
        const r = retirerDe(t.ctx, eq, s);
        const caAvant = h.fiche.ca;
        h.equipe = r.equipe;
        appliquerEquipement(t.ctx, h);
        verserAuSac(t.partie.etat.inventaire, r.remis);
        t.emettre({ type: 'constat', texte: `${h.nom} range ${nomsDe(t.ctx, r.remis)} dans le sac${h.fiche.ca !== caAvant ? ` : CA ${caAvant} → ${h.fiche.ca}` : ''}.` });
        t.emettre({ type: 'equipementChange', personnage: h.id, objet: retire, retire: true });
      },
      propositions: (ctx, p) =>
        p.groupe.flatMap((h) => {
          const eq = equipementDe(h);
          return EMPLACEMENTS.filter((s) => eq.emplacements[s]).map((s) => ({
            groupe: PANNEAU_SAC,
            element: { id: idElementPorte(h.id, eq.emplacements[s]!), titre: `${objetDe(ctx, eq.emplacements[s]!).nom} (${h.nom})` },
            libelle: 'Retirer',
            style: 'discret' as const,
            aide: `Le range dans le sac (${NOMS_EMPLACEMENTS[s].toLowerCase()}).`,
            ordre: { type: 'retirerEquipement', objet: eq.emplacements[s]!, personnage: h.id, emplacement: s },
          }));
        }),
    }),
    changerJeuArmes: commande({
      description:
        "Prendre en main l'autre jeu d'armes du héros (jeu I ou jeu II : par exemple l'épée, puis l'arc). Hors combat c'est libre ; en combat, la carte « Changer d'armes » le fait. Recalcule sa Classe d'Armure (le bouclier suit le jeu) et ses armes de combat.",
      entree: z.object({ personnage: z.string() }),
      disponible: libre,
      executer: (t, e) => {
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        if (h.pv <= 0) return { refus: `${h.nom} est hors de combat.` };
        const eq = copieEquipement(equipementDe(h));
        eq.jeuActif = autreJeu(eq.jeuActif);
        const caAvant = h.fiche.ca;
        h.equipe = eq;
        appliquerEquipement(t.ctx, h);
        const apres = equipementDe(h);
        const armes = mainsArmees(t.ctx, apres).map((s) => objetDe(t.ctx, apres.emplacements[s]!).nom);
        t.emettre({ type: 'constat', texte: `${h.nom} prend le jeu d'armes ${apres.jeuActif === 1 ? 'I' : 'II'} : ${armes.join(' et ') || 'les mains nues'}${h.fiche.ca !== caAvant ? ` : CA ${caAvant} → ${h.fiche.ca}` : ''}.` });
      },
    }),
  },
};

/** Pour chaque objet du sac qui s'équipe : « Équiper… » avec le choix du héros, et ce que ça changerait à sa CA. */
function propositionsEquiper(ctx: ContexteJeu, p: Partie): Proposition[] {
  const res: Proposition[] = [];
  for (const id of Object.keys(p.etat.inventaire)) {
    const info = infoEquipement(ctx, id);
    if (!info) continue;
    const o = objetDe(ctx, id);
    res.push({
      groupe: PANNEAU_SAC,
      element: { id, titre: o.nom },
      libelle: 'Équiper…',
      aide: "Le héros choisi le porte à son emplacement ; ce qu'il portait à la même place revient dans le sac.",
      ordre: { type: 'equiper', objet: id },
      choix: {
        champ: 'personnage',
        indication: 'Équiper qui ?',
        options: p.groupe.map((h) => {
          const r = avecObjet(ctx, h, id);
          const refus = 'refus' in r ? r.refus : h.pv <= 0 ? `${h.nom} est hors de combat.` : undefined;
          const ca = 'equipe' in r ? caAvecEquipement(ctx, h, r.equipe) : h.fiche.ca;
          return {
            valeur: h.id,
            libelle: h.nom,
            personnage: h.id,
            detail: info.genre === 'arme' || info.genre === 'porte' ? (ca !== h.fiche.ca ? `CA ${h.fiche.ca} → ${ca}` : `CA ${h.fiche.ca}`) : `CA ${h.fiche.ca} → ${ca}`,
            desactivee: refus,
          };
        }),
      },
    });
  }
  return res;
}
