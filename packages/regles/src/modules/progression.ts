// Module Progression : quand l'XP du groupe franchit un seuil (SRD 5.2.1 : 300, 900, 2700, 6500), chaque héros monte de
// niveau. Ses choix sont gardés ; les nouveaux sont complétés par les recommandations (voir `monterAuNiveau`). Les PV, les
// usages et les emplacements gagnés s'ajoutent à ce qui reste ; l'équipement porté est gardé.
import { etatDurableMax } from '../combat/creation';
import { niveauPourPx } from '../caracteristiques';
import { monterAuNiveau } from '../creation/progression';
import { NIVEAU_MAX } from '../fiche';
import type { Module } from '../noyau/types';
import { appliquerEquipement } from './equipement-regles';

export const moduleProgression: Module = {
  id: 'progression',
  dependances: ['equipement'],
  reactions: {
    xp: (t) => {
      const etat = t.partie.etat;
      const plafond = Math.min(NIVEAU_MAX, t.ctx.dm.monde.niveaux.max);
      const cible = Math.min(plafond, niveauPourPx(etat.xp));
      if (cible <= etat.niveauGroupe || !t.ctx.srd) return;
      for (const h of t.partie.groupe) {
        if (!h.choix) continue;
        for (let niveau = h.choix.niveau + 1; niveau <= cible; niveau++) {
          const r = monterAuNiveau(h.choix, niveau, t.ctx.srd);
          if (!r) {
            t.emettre({ type: 'constat', texte: `${h.nom} ne peut pas encore passer au niveau ${niveau} (choix à revoir).` });
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
        }
      }
      etat.niveauGroupe = cible;
      t.emettre({ type: 'constat', texte: `Le groupe atteint le niveau ${cible}.` });
    },
  },
};
