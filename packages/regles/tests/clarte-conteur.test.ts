// Phase 4 du plan de mémoire : des répliques de PNJ plus claires et plus étoffées (consignes du conteur et de l'outil de parole libre).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES_STANDARD, promptSysteme } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;

describe('les consignes de réplique du conteur', () => {
  const prompt = promptSysteme(dm, 'Bible.');

  it('une réplique de PNJ fait 3 à 6 phrases (60 à 100 mots), les récits restent courts', () => {
    expect(prompt).toContain('sa réplique (3 à 6 phrases, 60 à 100 mots, première personne, dans sa voix)');
    expect(prompt).not.toContain('1 à 4 phrases');
    expect(prompt).toContain('la réplique d\'un PNJ suit la règle 10');
    expect(prompt).toContain('50 à 100 mots pour une action ou une scène');
  });

  it('elle se construit en trois temps : réponse franche, détail concret, piste', () => {
    expect(prompt).toContain('d\'abord une phrase qui répond franchement à la question posée');
    expect(prompt).toContain('un détail concret tiré de la fiche');
    expect(prompt).toContain('une piste pour aller plus loin');
  });

  it('elle est claire : on présente ce que le groupe ne connaît pas encore, et une esquive est franche', () => {
    expect(prompt).toContain('présente-la en quelques mots');
    expect(prompt).toContain('Une esquive est franche');
    expect(prompt).toContain('plutôt que de répondre à côté');
  });

  it('on peut demander de redire plus simplement : mots plus simples, rien d\'ajouté', () => {
    expect(prompt).toContain('redire plus simplement');
    expect(prompt).toContain('sans rien y ajouter');
  });

  it('une question sur le passé du groupe ne passe pas par un sujet écrit, et le groupe qui a gagné n\'a pas perdu', () => {
    expect(prompt).toContain('Si la question du joueur porte sur ce que le groupe a fait ou vécu');
    expect(prompt).toContain('n\'appelle pas de sujet écrit');
    expect(prompt).toContain('le groupe qui a gagné un combat n\'a pas perdu');
  });

  it('l\'outil de parole libre annonce la même longueur et la même structure', () => {
    const savoirs = MODULES_STANDARD.find((m) => m.id === 'savoirs')!;
    const d = savoirs.commandes!['repondreEnPersonnage']!.description;
    expect(d).toContain('3 à 6 phrases, 60 à 100 mots');
    expect(d).toContain('une réponse franche, un détail concret, si possible une piste');
  });
});
