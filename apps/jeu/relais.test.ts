import { describe, expect, it } from 'vitest';
import { bornerMaxTokens, corpsJson, lirePlafond, MAX_TOKENS_PAR_DEFAUT, origineAutorisee, PLAFOND_PAR_DEFAUT } from './relais';

describe('origineAutorisee', () => {
  it('accepte le jeu lui-même : même machine, n’importe quel port', () => {
    expect(origineAutorisee('http://localhost:5173')).toBe(true);
    expect(origineAutorisee('http://127.0.0.1:5174')).toBe(true);
    expect(origineAutorisee('http://[::1]:5173')).toBe(true);
  });

  it('accepte l’application de bureau', () => {
    expect(origineAutorisee('tauri://localhost')).toBe(true);
    expect(origineAutorisee('http://tauri.localhost')).toBe(true);
  });

  it('accepte une requête sans origine (outil en ligne de commande)', () => {
    expect(origineAutorisee(undefined)).toBe(true);
    expect(origineAutorisee('')).toBe(true);
  });

  it('refuse une page web ouverte dans le navigateur', () => {
    expect(origineAutorisee('https://site-malveillant.example')).toBe(false);
    expect(origineAutorisee('http://localhost.example.com')).toBe(false);
    expect(origineAutorisee('null')).toBe(false);
    expect(origineAutorisee('tauri://ailleurs')).toBe(false);
    expect(origineAutorisee('file://')).toBe(false);
  });
});

describe('corpsJson', () => {
  it('exige un corps déclaré en JSON', () => {
    expect(corpsJson('application/json')).toBe(true);
    expect(corpsJson('application/json; charset=utf-8')).toBe(true);
    expect(corpsJson('text/plain')).toBe(false);
    expect(corpsJson('application/x-www-form-urlencoded')).toBe(false);
    expect(corpsJson(undefined)).toBe(false);
  });
});

describe('bornerMaxTokens', () => {
  it('borne la longueur de réponse', () => {
    expect(bornerMaxTokens(400)).toBe(400);
    expect(bornerMaxTokens(99_999)).toBe(1500);
    expect(bornerMaxTokens('800')).toBe(800);
    expect(bornerMaxTokens(812.7)).toBe(812);
  });

  it('une valeur invalide ne fait plus sauter la borne', () => {
    expect(bornerMaxTokens('abc')).toBe(MAX_TOKENS_PAR_DEFAUT);
    expect(bornerMaxTokens({})).toBe(MAX_TOKENS_PAR_DEFAUT);
    expect(bornerMaxTokens(undefined)).toBe(MAX_TOKENS_PAR_DEFAUT);
    expect(bornerMaxTokens(-5)).toBe(MAX_TOKENS_PAR_DEFAUT);
    expect(bornerMaxTokens(Number.NaN)).toBe(MAX_TOKENS_PAR_DEFAUT);
    expect(bornerMaxTokens(Number.POSITIVE_INFINITY)).toBe(MAX_TOKENS_PAR_DEFAUT);
  });
});

describe('lirePlafond', () => {
  it('lit le plafond, virgule comprise', () => {
    expect(lirePlafond('1.5')).toEqual({ plafond: 1.5, invalide: false });
    expect(lirePlafond('0,5')).toEqual({ plafond: 0.5, invalide: false });
  });

  it('sans valeur, prend le plafond par défaut', () => {
    expect(lirePlafond(undefined)).toEqual({ plafond: PLAFOND_PAR_DEFAUT, invalide: false });
  });

  it('une valeur invalide garde un plafond, au lieu de le supprimer', () => {
    expect(lirePlafond('beaucoup')).toEqual({ plafond: PLAFOND_PAR_DEFAUT, invalide: true });
    expect(lirePlafond('-2')).toEqual({ plafond: PLAFOND_PAR_DEFAUT, invalide: true });
  });
});
