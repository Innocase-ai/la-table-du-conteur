// Les modules livrés avec le jeu, dans l'ordre d'enregistrement.
import { moduleDialogue } from './dialogue';
import { moduleExploration } from './exploration';
import { moduleGrimoire } from './grimoire';
import { moduleInventaire } from './inventaire';
import { moduleJournal } from './journal';
import { moduleScenes } from './scenes';
import type { Module } from '../noyau/types';

export { moduleDialogue, moduleExploration, moduleGrimoire, moduleInventaire, moduleJournal, moduleScenes };
export { sceneEnCours, scenesDu, SceneNarree, PlanScene, type EtatScenes } from './scenes';
export { objetDe, plusBlesse, POTION_DE_COMBAT, type EtatInventaire } from './inventaire';
export { sortsConnus } from './grimoire';
export type { Interlocuteur } from './dialogue';

export const MODULES_STANDARD: Module[] = [moduleExploration, moduleDialogue, moduleInventaire, moduleGrimoire, moduleJournal, moduleScenes];
