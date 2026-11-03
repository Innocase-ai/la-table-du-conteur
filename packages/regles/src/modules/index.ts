// Les modules livrés avec le jeu, dans l'ordre d'enregistrement.
import { moduleDialogue } from './dialogue';
import { moduleExploration } from './exploration';
import type { Module } from '../noyau/types';

export { moduleDialogue, moduleExploration };
export type { Interlocuteur } from './dialogue';

export const MODULES_STANDARD: Module[] = [moduleExploration, moduleDialogue];
