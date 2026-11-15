// Réglages du joueur : lecture tolérante, application à la page, résumé de l'état du conteur (sans jamais toucher à une clé).
import { describe, expect, it } from 'vitest';
import {
  ECHELLES_TEXTE,
  OPTIONS_PAR_DEFAUT,
  animationsReduites,
  appliquerOptions,
  facteurTexte,
  lireOptionsDepuisTexte,
  mouvementApplique,
  resumerConteur,
} from './options-regles';

/** Un faux élément `<html>` : seulement ce que `appliquerOptions` touche. */
function fauxRacine() {
  const props = new Map<string, string>();
  return {
    dataset: {} as Record<string, string | undefined>,
    style: { setProperty: (k: string, v: string) => void props.set(k, v) },
    props,
  };
}

describe('lecture des réglages', () => {
  it('sans rien d\'enregistré : les défauts (texte à 100 %, animations selon le système)', () => {
    expect(lireOptionsDepuisTexte(null)).toEqual(OPTIONS_PAR_DEFAUT);
    expect(lireOptionsDepuisTexte('')).toEqual(OPTIONS_PAR_DEFAUT);
    expect(OPTIONS_PAR_DEFAUT.reduireAnimations).toBeUndefined();
  });

  it('relit des réglages valides', () => {
    expect(lireOptionsDepuisTexte(JSON.stringify({ echelleTexte: 130, reduireAnimations: true }))).toEqual({ echelleTexte: 130, reduireAnimations: true });
    for (const n of ECHELLES_TEXTE) expect(lireOptionsDepuisTexte(JSON.stringify({ echelleTexte: n })).echelleTexte).toBe(n);
  });

  it('ignore champ par champ ce qui est invalide', () => {
    expect(lireOptionsDepuisTexte('pas du json')).toEqual(OPTIONS_PAR_DEFAUT);
    expect(lireOptionsDepuisTexte('42')).toEqual(OPTIONS_PAR_DEFAUT);
    expect(lireOptionsDepuisTexte('null')).toEqual(OPTIONS_PAR_DEFAUT);
    expect(lireOptionsDepuisTexte(JSON.stringify({ echelleTexte: 200, reduireAnimations: 'oui' }))).toEqual(OPTIONS_PAR_DEFAUT);
    expect(lireOptionsDepuisTexte(JSON.stringify({ echelleTexte: 115, reduireAnimations: 'oui' }))).toEqual({ echelleTexte: 115 });
  });
});

describe('animations réduites', () => {
  it('le choix du joueur prime sur le système, à défaut le système décide', () => {
    expect(animationsReduites({ echelleTexte: 100 }, true)).toBe(true);
    expect(animationsReduites({ echelleTexte: 100 }, false)).toBe(false);
    expect(animationsReduites({ echelleTexte: 100, reduireAnimations: false }, true)).toBe(false);
    expect(animationsReduites({ echelleTexte: 100, reduireAnimations: true }, false)).toBe(true);
  });
});

describe('application à la page', () => {
  it('pose la taille du texte et l\'état des animations sur la racine', () => {
    const r = fauxRacine();
    appliquerOptions({ echelleTexte: 115, reduireAnimations: true }, r as unknown as HTMLElement, false);
    expect(r.dataset['texte']).toBe('115');
    expect(r.dataset['mouvement']).toBe('reduit');
    expect(r.props.get('--echelle-texte')).toBe('1.15');
    appliquerOptions({ echelleTexte: 100 }, r as unknown as HTMLElement, false);
    expect(r.dataset['texte']).toBe('100');
    expect(r.dataset['mouvement']).toBe('normal');
    expect(mouvementApplique(r as unknown as HTMLElement)).toBe('normal');
  });

  it('sans réglage du joueur, suit le système', () => {
    const r = fauxRacine();
    appliquerOptions({ echelleTexte: 100 }, r as unknown as HTMLElement, true);
    expect(r.dataset['mouvement']).toBe('reduit');
  });

  it('le facteur de texte vaut 1, 1,15 ou 1,3', () => {
    expect(ECHELLES_TEXTE.map((n) => facteurTexte({ echelleTexte: n }))).toEqual([1, 1.15, 1.3]);
  });
});

describe('résumé du conteur', () => {
  it('sans état connu : rien à dire', () => {
    expect(resumerConteur(undefined)).toBeUndefined();
  });

  it('sans clé ou sans relais : non branché', () => {
    const r = resumerConteur({ disponible: false });
    expect(r?.etat).toBe('absent');
    expect(r?.modele).toBeUndefined();
  });

  it('branché : modèle, dépense, plafond et part utilisée', () => {
    const r = resumerConteur({ disponible: true, modele: 'anthropic/claude-haiku-5.5', depense: 0.125, plafond: 0.5 });
    expect(r).toMatchObject({ etat: 'ok', modele: 'anthropic/claude-haiku-5.5', depense: 0.125, plafond: 0.5, part: 0.25 });
  });

  it('la part ne dépasse jamais 100 % et un plafond nul compte comme atteint', () => {
    expect(resumerConteur({ disponible: true, depense: 2, plafond: 0.5 })?.part).toBe(1);
    expect(resumerConteur({ disponible: true, depense: 0, plafond: 0 })?.part).toBe(1);
  });

  it('ignore des valeurs invalides plutôt que de les afficher', () => {
    const r = resumerConteur({ disponible: true, depense: -1, plafond: Number.NaN });
    expect(r?.depense).toBeUndefined();
    expect(r?.plafond).toBeUndefined();
    expect(r?.part).toBeUndefined();
  });

  it('ne porte jamais de clé : le résumé ne contient que des champs d\'état', () => {
    const r = resumerConteur({ disponible: true, modele: 'm', depense: 0, plafond: 1 }) as object;
    expect(Object.keys(r).sort()).toEqual(['depense', 'etat', 'libelle', 'modele', 'part', 'plafond']);
  });
});
