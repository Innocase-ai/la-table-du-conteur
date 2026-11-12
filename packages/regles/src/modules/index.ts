// Les modules livrés avec le jeu, dans l'ordre d'enregistrement.
import { moduleCommerce } from './commerce';
import { moduleProgression } from './progression';
import { moduleConteur } from './conteur';
import { moduleDialogue } from './dialogue';
import { moduleDilemmes } from './dilemmes';
import { moduleEquipement } from './equipement';
import { moduleExploration } from './exploration';
import { moduleGrimoire } from './grimoire';
import { moduleCodex } from './codex';
import { moduleExamens } from './examens';
import { moduleEvenementsChoix } from './evenements-choix';
import { moduleInterjections } from './interjections';
import { moduleInventaire } from './inventaire';
import { moduleCarte } from './carte';
import { moduleJournal } from './journal';
import { moduleSavoirs } from './savoirs';
import { moduleScenes } from './scenes';
import type { Module } from '../noyau/types';

export { moduleCarte, moduleCodex, moduleCommerce, moduleProgression, moduleConteur, moduleDialogue, moduleDilemmes, moduleEquipement, moduleEvenementsChoix, moduleExamens, moduleExploration, moduleGrimoire, moduleInventaire, moduleInterjections, moduleJournal, moduleSavoirs, moduleScenes };
export { evenementsIci, herosQuiAgit, origineAffichee, type EtatEvenementsChoix, type FicheEvenement, type ChoixAffiche, type ResultatEvenement } from './evenements-choix';
export { sceneEnCours, scenesDu, SceneNarree, PlanScene, type EtatScenes } from './scenes';
export { objetDe, plusBlesse, POTION_DE_COMBAT, type EtatInventaire } from './inventaire';
export { appliquerEquipement, bouclierActif, caAvecEquipement, chargeDuGroupe, copieEquipement, estDeuxMains, estLegere, harmonises, HARMONISES_MAX, idElementPorte, infoEquipement, mainsArmees, normaliserEquipement, objetsPortes, placer, proprietesArme, rangerAvecCatalogue, retirerDe, type ResultatPlacer } from './equipement-regles';
export { sortsConnus } from './grimoire';
export { ficheDeSort } from './fiche-sort';
export { articles, rachats, prixLisible, type EtatCommerce } from './commerce';
export { idImageCommune } from './image-commune';
export type { Interlocuteur } from './dialogue';

export const MODULES_STANDARD: Module[] = [moduleExploration, moduleDialogue, moduleInventaire, moduleEquipement, moduleGrimoire, moduleCarte, moduleJournal, moduleCodex, moduleCommerce, moduleProgression, moduleDilemmes, moduleSavoirs, moduleInterjections, moduleExamens, moduleEvenementsChoix, moduleScenes, moduleConteur];
