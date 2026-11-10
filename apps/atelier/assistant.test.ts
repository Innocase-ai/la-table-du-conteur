// L'assistant d'écriture de l'atelier, sans appel payant : textes proposés, cibles de longueur, mots tabou, demande envoyée au modèle.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Canon } from '../../packages/regles/src';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import {
  cibleDuTexte,
  contexteDeLaFiche,
  ecrireChemin,
  fuites,
  lireChemin,
  messageDeSuite,
  messagesInitiaux,
  nettoyerProposition,
  sectionDuCanon,
  SYSTEME,
  tabousPour,
  textesDeLaFiche,
} from './src/assistant';

const dossierVal = join(RACINE_MONDES, 'val-des-cendres');
const r = chargerMonde(dossierVal);
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const canon = Canon.parse(JSON.parse(readFileSync(join(dossierVal, 'canon.json'), 'utf8')));

describe('l’assistant d’écriture', () => {
  it('propose les textes d’une fiche, imbriqués compris, jamais les identifiants ni les liens', () => {
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length > 1)!;
    const chemins = textesDeLaFiche(pnj).map((t) => t.libelle);
    expect(chemins).toContain('sujets[0].reponse');
    expect(chemins).toContain('apparence');
    expect(chemins).not.toContain('id');
    expect(chemins).not.toContain('lieu');
    expect(chemins).not.toContain('nom');
    // Un champ de texte connu se propose même vide (pour « Rédiger »).
    expect(textesDeLaFiche({ id: 'x', arrivee: '' }).map((t) => t.libelle)).toEqual(['arrivee']);
  });

  it('lit et écrit un texte imbriqué sans toucher le reste de la fiche', () => {
    const fiche = { id: 'a', sujets: [{ id: 's', reponse: 'avant' }, { id: 't', reponse: 'autre' }] };
    const apres = ecrireChemin(fiche, ['sujets', 0, 'reponse'], 'après');
    expect(lireChemin(apres, ['sujets', 0, 'reponse'])).toBe('après');
    expect(fiche.sujets[0]!.reponse).toBe('avant');
    expect(apres.sujets[1]).toBe(fiche.sujets[1]);
    expect(Array.isArray(apres.sujets)).toBe(true);
  });

  it('donne les cibles validées des textes lus par le joueur', () => {
    expect(cibleDuTexte('lieux', ['arrivee'])).toMatchObject({ min: 130, max: 170 });
    expect(cibleDuTexte('lieux', ['arriveeVariantes', 0, 'texte'])).toMatchObject({ min: 130, max: 170 });
    expect(cibleDuTexte('rencontres', ['intro'])).toMatchObject({ min: 70, max: 110 });
    expect(cibleDuTexte('rencontres', ['alternatives', 1, 'resume'])).toMatchObject({ min: 50, max: 80 });
    expect(cibleDuTexte('pnj', ['sujets', 3, 'reponse'])).toMatchObject({ min: 75, max: 115 });
    expect(cibleDuTexte('pnj', ['apparence'])).toBeUndefined();
  });

  it('applique les mots tabou d’un secret, sauf aux fiches qu’il autorise', () => {
    const secret = canon.secrets.find((s) => s.motsTabou.length && s.autorise.some((a) => a.startsWith('pnj:')))!;
    const autorise = secret.autorise.find((a) => a.startsWith('pnj:'))!.slice(4);
    const autre = [...dm.pnj.values()].find((p) => !secret.autorise.includes(`pnj:${p.id}`))!;
    expect(tabousPour(canon, 'pnj', autre.id).some((t) => t.secret === secret.id)).toBe(true);
    expect(tabousPour(canon, 'pnj', autorise).some((t) => t.secret === secret.id)).toBe(false);
    expect(tabousPour(canon, 'savoirs', autorise).some((t) => t.secret === secret.id)).toBe(false);
    const mot = secret.motsTabou[0]!;
    expect(fuites(`Elle murmure : ${mot}, puis se tait.`, tabousPour(canon, 'pnj', autre.id)).some((f) => f.mot === mot)).toBe(true);
    expect(fuites('Rien à signaler.', tabousPour(canon, 'pnj', autre.id))).toEqual([]);
  });

  it('envoie la bible, la fiche, le champ, la cible, les mots interdits et la demande', () => {
    const lieu = [...dm.lieux.values()].find((l) => l.parent && l.arrivee)!;
    const tabous = tabousPour(canon, 'lieux', lieu.id);
    const m = messagesInitiaux({ nomMonde: dm.monde.nom, bible: 'BIBLE DU VAL', contexte: contexteDeLaFiche(dm, 'lieux', lieu), dossier: 'lieux', fiche: lieu, chemin: ['arrivee'], texte: lieu.arrivee!, tabous, action: 'ameliorer', consigne: 'plus de vent' });
    expect(m[0]).toEqual({ role: 'system', content: SYSTEME });
    const u = m[1]!.content;
    expect(u).toContain('BIBLE DU VAL');
    expect(u).toContain(lieu.id);
    expect(u).toContain('Lieu parent : ' + dm.lieux.get(lieu.parent!)!.nom);
    expect(u).toContain('130 à 170 mots');
    expect(u).toContain('plus de vent');
    expect(u).toContain('Réécris ce texte en mieux');
    if (tabous.length) expect(u).toContain(`« ${tabous[0]!.mot} »`);
    expect(messageDeSuite('raccourcir', 'garde la cloche').content).toMatch(/Resserre[\s\S]*garde la cloche/);
  });

  it('trouve la section du canon d’un personnage et nettoie la proposition', () => {
    const md = '# Canon\n\n## Hesta Cendrebrune\nForgeronne, 52 ans.\n\n## Oswin le Veilleur\nVieux.';
    expect(sectionDuCanon(md, 'Hesta Cendrebrune')).toContain('Forgeronne');
    expect(sectionDuCanon(md, 'Oswin')).toContain('Vieux');
    expect(sectionDuCanon(md, 'Personne')).toBeUndefined();
    expect(nettoyerProposition('```\nLe vent tombe.\n```')).toBe('Le vent tombe.');
    expect(nettoyerProposition('"Le vent tombe."')).toBe('Le vent tombe.');
    expect(nettoyerProposition('« Je ne sais rien », dit-il.')).toBe('« Je ne sais rien », dit-il.');
  });
});
