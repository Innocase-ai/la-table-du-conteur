import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assemblerMonde } from '@crpg/regles';
import { cheminFichierValide, idMondeValide, origineAutorisee, resoudre } from './chemins';
import { lireMonde, lireMondes } from './serveur-mondes';

const RACINE = resolve(import.meta.dirname, '../../packages/mondes');

describe('gardes de chemins', () => {
  it('accepte les identifiants de monde en kebab-case ASCII seulement', () => {
    expect(idMondeValide('val-des-cendres')).toBe(true);
    for (const mauvais of ['', '..', '../x', 'a/b', 'A', 'é', '-x', 'a b', undefined, 3]) expect(idMondeValide(mauvais)).toBe(false);
  });

  it('accepte monde.json, canon.json et <dossier>/<fichier>.json, rien d’autre', () => {
    for (const bon of ['monde.json', 'canon.json', 'lieux/z1-citadelle.json', 'savoirs/z8-ysmene-hautecote.json']) expect(cheminFichierValide(bon)).toBe(true);
    for (const mauvais of ['BIBLE.md', 'lieux/a/b.json', '../monde.json', 'lieux/../monde.json', '/etc/passwd.json', 'C:\\x.json', 'lieux/.json', 'lieux/x.js', 'monde.json/x']) expect(cheminFichierValide(mauvais)).toBe(false);
  });

  it('refuse tout chemin qui sort de la racine', () => {
    expect(resoudre(RACINE, 'val-des-cendres')).toBe(resolve(RACINE, 'val-des-cendres'));
    expect(resoudre(RACINE, 'val-des-cendres', 'lieux/z1.json')).toBe(resolve(RACINE, 'val-des-cendres', 'lieux', 'z1.json'));
    expect(resoudre(RACINE, '..')).toBeNull();
    expect(resoudre(RACINE, 'val-des-cendres', '../../x.json')).toBeNull();
    expect(resoudre(RACINE, 'val-des-cendres', 'lieux/..%2f..json')).toBeNull();
    expect(resoudre(RACINE, 'val-des-cendres', 'C:\\Windows\\x.json')).toBeNull();
  });

  it('n’accepte que les pages de l’atelier', () => {
    expect(origineAutorisee(undefined)).toBe(true);
    expect(origineAutorisee('http://localhost:5180')).toBe(true);
    expect(origineAutorisee('http://127.0.0.1:5180')).toBe(true);
    for (const mauvaise of ['http://localhost:5173', 'https://evil.example', 'http://localhost:5180.evil.example', 'null']) expect(origineAutorisee(mauvaise)).toBe(false);
  });
});

describe('lecture des mondes par le serveur', () => {
  it('liste les mondes, brouillons compris', () => {
    const mondes = lireMondes(RACINE);
    expect(mondes.map((m) => m.id)).toEqual(expect.arrayContaining(['val-des-cendres', 'citadelle-des-marees', 'dime-des-roseaux']));
    expect(mondes.find((m) => m.id === 'dime-des-roseaux')?.statut).toBe('brouillon');
  });

  it('un monde lu par le serveur s’assemble comme celui du chargeur Node', () => {
    const lu = lireMonde(RACINE, 'val-des-cendres')!;
    expect(lu.erreursLecture).toEqual([]);
    expect(lu.fichiers.length).toBeGreaterThan(20);
    expect(lu.fichiers.every((f) => /^[a-z0-9-]+\/[^/]+\.json$/.test(f.chemin) && /^[0-9a-f]{64}$/.test(f.empreinte))).toBe(true);
    expect(lu.fichiers.some((f) => f.chemin.startsWith('images/') || f.chemin.startsWith('voix/'))).toBe(false);
    const r = assemblerMonde(lu.monde, lu.fichiers.map(({ chemin, contenu }) => ({ chemin, contenu })), lu.erreursLecture);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.monde.lieux.size).toBeGreaterThan(100);
    expect(lu.docs.bible).toMatch(/\S/);
  });

  it('un id invalide ou inconnu ne donne rien', () => {
    expect(lireMonde(RACINE, '..')).toBeNull();
    expect(lireMonde(RACINE, 'monde-inexistant')).toBeNull();
  });

  it('un fichier JSON cassé est signalé sans arrêter la lecture, et un lien symbolique n’est pas suivi', () => {
    const racine = mkdtempSync(join(tmpdir(), 'atelier-'));
    mkdirSync(join(racine, 'm', 'lieux'), { recursive: true });
    writeFileSync(join(racine, 'm', 'monde.json'), '{"id":"m"}');
    writeFileSync(join(racine, 'm', 'lieux', 'bon.json'), '[]');
    writeFileSync(join(racine, 'm', 'lieux', 'casse.json'), '{ pas du json');
    mkdirSync(join(racine, 'm', 'images'));
    writeFileSync(join(racine, 'm', 'images', 'manifeste.json'), '{}');
    const lu = lireMonde(racine, 'm')!;
    expect(lu.fichiers.map((f) => f.chemin)).toEqual(['lieux/bon.json']);
    expect(lu.erreursLecture).toHaveLength(1);
    expect(lu.erreursLecture[0]!.fichier).toBe('lieux/casse.json');
    try {
      symlinkSync(join(racine, 'm'), join(racine, 'lien'), 'junction');
      expect(lireMondes(racine).map((m) => m.id)).toEqual(['m']);
    } catch {
      // création de lien refusée par le système : le garde-fou n'est pas testable ici
    }
  });
});
