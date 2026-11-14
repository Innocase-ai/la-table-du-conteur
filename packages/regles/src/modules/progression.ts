// Module Progression : quand l'XP du groupe franchit un seuil (SRD 5.2.1 : 300, 900, 2700, 6500), chaque héros monte de
// niveau. Ses choix sont gardés ; les nouveaux sont complétés par les recommandations (voir `monterAuNiveau`). Les PV, les
// usages et les emplacements gagnés s'ajoutent à ce qui reste ; l'équipement porté est gardé.
import { etatDurableMax } from '../combat/creation';
import { niveauPourPx } from '../caracteristiques';
import { ChoixPersonnageSchema } from '../creation/groupe';
import { accorderApresNiveau } from '../creation/preparation';
import { choixDeMontee, monterAuNiveau, reviserChoixDeMontee } from '../creation/progression';
import { NIVEAU_MAX } from '../fiche';
import { z } from 'zod';
import { commande, type Module } from '../noyau/types';
import { appliquerEquipement } from './equipement-regles';
import { plafondDeNiveau } from '../monde/etat';

export const moduleProgression: Module = {
  id: 'progression',
  dependances: ['equipement'],
  commandes: {
    reviserMontee: commande({
      description: "Le joueur revoit les nouveaux choix de son héros après une montée de niveau (amélioration de caractéristique, sorts, options de classe, expertises) ; le reste de sa fiche ne change pas.",
      entree: z.object({ personnage: z.string(), choix: ChoixPersonnageSchema }),
      disponible: () => true,
      executer: (t, e) => {
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h || !h.choix) return { refus: 'Aucun héros de ce nom.' };
        if (!h.monteeEnAttente) return { refus: `${h.nom} n'a pas de nouveau choix à faire.` };
        if (!t.ctx.srd) return { refus: 'Les règles ne sont pas chargées.' };
        const r = reviserChoixDeMontee(h.choix, e.choix, t.ctx.srd);
        if (!r.ok) return { refus: r.erreur };
        const avant = etatDurableMax(h.fiche);
        const pvMaxAvant = h.fiche.pvMax;
        h.fiche = r.fiche;
        h.choix = r.choix;
        const apres = etatDurableMax(h.fiche);
        // Les maximums peuvent changer (Constitution : PV ; Charisme : Inspiration…) : l'écart s'applique à ce qui reste.
        if (h.pv > 0) h.pv = Math.max(1, Math.min(h.fiche.pvMax, h.pv + h.fiche.pvMax - pvMaxAvant));
        for (const [k, m] of Object.entries(apres.ressources)) {
          if (k === 'potions') continue;
          h.ressources[k] = Math.max(0, Math.min(m, (h.ressources[k] ?? m) + m - (avant.ressources[k] ?? m)));
        }
        h.emplacements = apres.emplacements.map((m, i) => Math.max(0, Math.min(m, (h.emplacements[i] ?? 0) + m - (avant.emplacements[i] ?? 0))));
        appliquerEquipement(t.ctx, h);
        h.monteeEnAttente = undefined;
        t.emettre({ type: 'constat', texte: `${h.nom} a choisi ses nouveautés du niveau ${h.choix.niveau}.` });
      },
    }),
    garderMontee: commande({
      description: 'Le joueur garde les choix conseillés de la montée de niveau de son héros.',
      entree: z.object({ personnage: z.string() }),
      disponible: () => true,
      executer: (t, e) => {
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        h.monteeEnAttente = undefined;
      },
    }),
  },
  reactions: {
    xp: (t) => monterSiBesoin(t),
    // Entrer dans un chapitre plus avancé relève le plafond : l'XP gardée en réserve devient des niveaux.
    deplacement: (t) => monterSiBesoin(t),
  },
};

type TransactionProgression = Parameters<NonNullable<NonNullable<Module['reactions']>['xp']>>[0];

function monterSiBesoin(t: TransactionProgression): void {
      const etat = t.partie.etat;
      const plafond = Math.min(NIVEAU_MAX, plafondDeNiveau(etat, t.ctx.dm));
      const cible = Math.min(plafond, niveauPourPx(etat.xp));
      if (!t.ctx.srd) return;
      // Un héros resté en arrière (montée impossible une fois) est retenté à chaque occasion : il ne reste jamais derrière le groupe.
      const enRetard = t.partie.groupe.some((h) => h.choix && h.choix.niveau < Math.min(cible, etat.niveauGroupe));
      const nouveauNiveau = cible > etat.niveauGroupe;
      if (!nouveauNiveau && !enRetard) return;
      for (const h of t.partie.groupe) {
        if (!h.choix) continue;
        const niveauAvant = h.choix.niveau;
        for (let niveau = h.choix.niveau + 1; niveau <= cible; niveau++) {
          const r = monterAuNiveau(h.choix, niveau, t.ctx.srd);
          if (!r) {
            if (nouveauNiveau) t.emettre({ type: 'constat', texte: `${h.nom} ne peut pas encore passer au niveau ${niveau} (choix à revoir).` });
            break;
          }
          const avant = etatDurableMax(h.fiche);
          const pvAvant = h.fiche.pvMax;
          h.fiche = r.fiche;
          h.choix = r.choix;
          const apres = etatDurableMax(h.fiche);
          if (h.pv > 0) h.pv += h.fiche.pvMax - pvAvant;
          for (const [k, m] of Object.entries(apres.ressources)) if (k !== 'potions') h.ressources[k] = (h.ressources[k] ?? 0) + Math.max(0, m - (avant.ressources[k] ?? 0));
          h.emplacements = apres.emplacements.map((m, i) => (h.emplacements[i] ?? 0) + Math.max(0, m - (avant.emplacements[i] ?? 0)));
          appliquerEquipement(t.ctx, h);
          t.emettre({ type: 'constat', texte: `${h.nom} passe au niveau ${niveau} : ${h.fiche.pvMax} PV, CA ${h.fiche.ca}.` });
          // Barde, Ensorceleur, Occultiste (et les mineurs des lanceurs de sorts complets) : un niveau gagné permet de remplacer un sort.
          const preparation = accorderApresNiveau(h);
          if (preparation) t.emettre({ type: 'constat', texte: `${preparation}.` });
        }
        // Des choix nouveaux à ce niveau (amélioration, sorts, options, expertises) : le joueur pourra les revoir (seulement s'il
        // vient de monter : un héros déjà à jour ne se voit pas redemander ses choix quand un autre rattrape son retard).
        const nouveaux = h.choix && h.choix.niveau > niveauAvant ? choixDeMontee(h.choix, t.ctx.srd) : undefined;
        if (nouveaux && !nouveaux.aucun && h.choix!.niveau === cible) h.monteeEnAttente = cible;
      }
      if (!nouveauNiveau) return;
      etat.niveauGroupe = cible;
      t.emettre({ type: 'constat', texte: `Le groupe atteint le niveau ${cible}.` });
}
