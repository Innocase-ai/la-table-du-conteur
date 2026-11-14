// Le bouton « Préparer ses sorts » (proposition à `intention: 'preparer'`) ouvre l'écran de préparation : l'écran d'aventure fournit
// la fonction qui l'ouvre, les boutons (onglet Grimoire, feuille, pages pleines) la prennent ici sans qu'on la leur transmette partout.
import { createContext } from 'react';

/** Ouvre l'écran de préparation des sorts, sur ce héros. */
export const ContextePreparation = createContext<(personnage: string) => void>(() => undefined);
