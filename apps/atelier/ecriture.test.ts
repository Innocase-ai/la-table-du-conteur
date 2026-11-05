import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { corpsJson } from './chemins';
import { ecrireFiche, empreinteDe, type DemandeEcriture } from './ecriture';

const MINI = resolve(import.meta.dirname, '../../packages/regles/tests/fixtures/mini-monde');

let racine = '';
const lire = (chemin: string) => readFileSync(join(racine, 'm', chemin), 'utf8');
const fichier = (chemin: string) => join(racine, 'm', chemin);

beforeEach(() => {
  racine = mkdtempSync(join(tmpdir(), 'atelier-ecriture-'));
  cpSync(MINI, join(racine, 'm'), { recursive: true });
  // Un fichier développé comme ceux que les scripts écrivent : le diff d'une modification se lit ligne à ligne.
  const pnj = join(racine, 'm', 'pnj', 'pnj.json');
  writeFileSync(pnj, JSON.stringify(JSON.parse(readFileSync(pnj, 'utf8')), null, 2) + '\n');
});

const demande = (d: Partial<DemandeEcriture> & Pick<DemandeEcriture, 'chemin' | 'mode' | 'valeur'>): DemandeEcriture => ({
  monde: 'm',
  empreinteAttendue: existsSync(fichier(d.chemin)) ? empreinteDe(lire(d.chemin)) : null,
  ...d,
});

const BERTRAND = () => ({ ...(JSON.parse(lire('pnj/pnj.json')) as Record<string, unknown>[])[0]! });

describe('écrire une fiche', () => {
  it('remplace une fiche : seule elle change, le reste du fichier est identique, et la nouvelle empreinte est celle du fichier', () => {
    const avant = lire('pnj/pnj.json');
    const fiche = BERTRAND();
    fiche['role'] = 'Aubergiste et conteur';
    const r = ecrireFiche(racine, demande({ chemin: 'pnj/pnj.json', mode: 'remplacer', id: 'bertrand', valeur: fiche }));
    expect(r.ok).toBe(true);
    const apres = lire('pnj/pnj.json');
    expect(apres).toBe(avant.replace('"role": "Aubergiste"', '"role": "Aubergiste et conteur"'));
    expect(apres).not.toBe(avant);
    if (r.ok) expect(r.empreinte).toBe(empreinteDe(apres));
    expect(readdirSync(fichier('pnj')).filter((f) => f.includes('.tmp'))).toEqual([]);
  });

  it('refuse si le fichier a changé depuis la lecture (409) et n’écrit rien', () => {
    const lu = empreinteDe(lire('pnj/pnj.json'));
    writeFileSync(fichier('pnj/pnj.json'), lire('pnj/pnj.json').replace('Bavard', 'Bavard').replace('"attitude": 10', '"attitude": 11'));
    const fiche = BERTRAND();
    fiche['role'] = 'X';
    const modifie = lire('pnj/pnj.json');
    const r = ecrireFiche(racine, demande({ chemin: 'pnj/pnj.json', mode: 'remplacer', id: 'bertrand', valeur: fiche, empreinteAttendue: lu }));
    expect(r).toMatchObject({ ok: false, statut: 409, empreinteActuelle: empreinteDe(modifie) });
    expect(lire('pnj/pnj.json')).toBe(modifie);
  });

  it('refuse une fiche invalide (schéma), un identifiant changé ou mal formé, et ce qui n’est pas un objet', () => {
    const base = { chemin: 'pnj/pnj.json', mode: 'remplacer' as const, id: 'bertrand' };
    const avant = lire('pnj/pnj.json');
    const invalide = BERTRAND();
    delete invalide['nom'];
    expect(ecrireFiche(racine, demande({ ...base, valeur: invalide }))).toMatchObject({ ok: false, statut: 400, erreur: expect.stringMatching(/Fiche invalide/) });
    expect(ecrireFiche(racine, demande({ ...base, valeur: { ...BERTRAND(), id: 'autre' } }))).toMatchObject({ ok: false, statut: 400, erreur: expect.stringMatching(/identifiant/) });
    expect(ecrireFiche(racine, demande({ ...base, valeur: { ...BERTRAND(), id: 'Bertrand' } }))).toMatchObject({ ok: false, statut: 400 });
    expect(ecrireFiche(racine, demande({ ...base, valeur: [] }))).toMatchObject({ ok: false, statut: 400 });
    expect(ecrireFiche(racine, demande({ ...base, valeur: null }))).toMatchObject({ ok: false, statut: 400 });
    expect(ecrireFiche(racine, demande({ ...base, id: 'inconnu', valeur: { ...BERTRAND(), id: 'inconnu' } }))).toMatchObject({ ok: false, statut: 404 });
    expect(lire('pnj/pnj.json')).toBe(avant);
  });

  it('ajoute une fiche à la fin d’un fichier existant, et crée un nouveau fichier de zone', () => {
    const lieu = { id: 'marais', nom: 'Le marais', type: 'lieu-dit', resume: 'Un marais.', description: 'Boue et roseaux.', visuel: 'marais brumeux' };
    const r1 = ecrireFiche(racine, demande({ chemin: 'lieux/lieux.json', mode: 'ajouter', valeur: lieu }));
    expect(r1.ok).toBe(true);
    const lieux = JSON.parse(lire('lieux/lieux.json')) as { id: string }[];
    expect(lieux.map((l) => l.id)).toEqual(['village', 'auberge', 'sentier', 'grotte', 'marais']);

    const r2 = ecrireFiche(racine, demande({ chemin: 'lieux/z2-nouveau.json', mode: 'ajouter', valeur: { ...lieu, id: 'plage', nom: 'La plage' } }));
    expect(r2.ok).toBe(true);
    expect(JSON.parse(lire('lieux/z2-nouveau.json'))).toEqual([{ ...lieu, id: 'plage', nom: 'La plage' }]);
  });

  it('refuse un identifiant déjà pris dans le dossier, même dans un autre fichier', () => {
    const lieu = { id: 'sentier', nom: 'Doublon', type: 'route', resume: 'x', description: 'x', visuel: 'x' };
    expect(ecrireFiche(racine, demande({ chemin: 'lieux/z2-autre.json', mode: 'ajouter', valeur: lieu }))).toMatchObject({ ok: false, statut: 409, erreur: expect.stringMatching(/existe déjà/) });
    expect(existsSync(fichier('lieux/z2-autre.json'))).toBe(false);
  });

  it('refuse de créer un fichier qui existe déjà sans en connaître l’empreinte, et d’écrire dans un fichier absent en mode remplacer', () => {
    const lieu = { id: 'plage', nom: 'La plage', type: 'route', resume: 'x', description: 'x', visuel: 'x' };
    expect(ecrireFiche(racine, { monde: 'm', chemin: 'lieux/lieux.json', mode: 'ajouter', valeur: lieu, empreinteAttendue: null })).toMatchObject({ ok: false, statut: 409 });
    expect(ecrireFiche(racine, { monde: 'm', chemin: 'lieux/absent.json', mode: 'remplacer', id: 'plage', valeur: lieu, empreinteAttendue: null })).toMatchObject({ ok: false, statut: 404 });
  });

  it('refuse un fichier existant illisible et n’y touche pas', () => {
    writeFileSync(fichier('lieux/casse.json'), '[ { pas du json');
    const lieu = { id: 'plage', nom: 'La plage', type: 'route', resume: 'x', description: 'x', visuel: 'x' };
    const r = ecrireFiche(racine, demande({ chemin: 'lieux/casse.json', mode: 'ajouter', valeur: lieu }));
    expect(r).toMatchObject({ ok: false, statut: 400 });
    expect(lire('lieux/casse.json')).toBe('[ { pas du json');
  });
});

describe('chemins interdits', () => {
  const valeur = { id: 'x', nom: 'X', type: 'route', resume: 'x', description: 'x', visuel: 'x' };
  it.each([
    ['monde.json'],
    ['canon.json'],
    ['BIBLE.md'],
    ['../monde.json'],
    ['lieux/../../x.json'],
    ['lieux/a/b.json'],
    ['scenes/scenes.json'],
    ['images/manifeste.json'],
    ['inconnu/x.json'],
  ])('« %s » est refusé', (chemin) => {
    const r = ecrireFiche(racine, { monde: 'm', chemin, mode: 'ajouter', valeur, empreinteAttendue: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.statut).toBe(403);
  });

  it('un monde invalide est refusé', () => {
    expect(ecrireFiche(racine, { monde: '../x', chemin: 'lieux/lieux.json', mode: 'ajouter', valeur, empreinteAttendue: null })).toMatchObject({ ok: false, statut: 403 });
  });

  it('le corps d’une requête doit être du JSON', () => {
    expect(corpsJson('application/json')).toBe(true);
    expect(corpsJson('application/json; charset=utf-8')).toBe(true);
    for (const mauvais of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', undefined, 'application/jsonp']) expect(corpsJson(mauvais)).toBe(false);
  });
});
