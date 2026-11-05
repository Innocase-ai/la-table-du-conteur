// Les modules livrés avec le jeu, dans l'ordre d'enregistrement.
import { moduleConteur } from './conteur';
import { moduleDialogue } from './dialogue';
import { moduleEquipement } from './equipement';
import { moduleExploration } from './exploration';
import { moduleGrimoire } from './grimoire';
import { moduleInventaire } from './inventaire';
import { moduleJournal } from './journal';
import { moduleScenes } from './scenes';
import type { Module } from '../noyau/types';

export { moduleConteur, moduleDialogue, moduleEquipement, moduleExploration, moduleGrimoire, moduleInventaire, moduleJournal, moduleScenes };
export { sceneEnCours, scenesDu, SceneNarree, PlanScene, type EtatScenes } from './scenes';
export { objetDe, plusBlesse, POTION_DE_COMBAT, type EtatInventaire } from './inventaire';
export { appliquerEquipement, caAvecEquipement, chargeDuGroupe, infoEquipement, objetsPortes } from './equipement-regles';
export { sortsConnus } from './grimoire';
export { ficheDeSort } from './fiche-sort';
export type { Interlocuteur } from './dialogue';

export const MODULES_STANDARD: Module[] = [moduleExploration, moduleDialogue, moduleInventaire, moduleEquipement, moduleGrimoire, moduleJournal, moduleScenes, moduleConteur];
