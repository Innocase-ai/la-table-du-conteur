import { describe, expect, it } from 'vitest';
import type { EvenementJeu } from '@crpg/regles';
import { entreesDeConversation, ENTREES_MAX, indiceDerniereParole, jetAnnonce } from './conversation-regles';

const parole = (voix: string, texte = 'Bien.'): EvenementJeu => ({ type: 'texte', texte, voix });
const constat = (texte: string): EvenementJeu => ({ type: 'constat', texte });
const arrivee: EvenementJeu = { type: 'arrivee', lieu: 'halle' };
const saisie: EvenementJeu = { type: 'saisieJoueur', texte: 'Je fouille.' } as EvenementJeu;

describe('entreesDeConversation : tout l’échange, pas la seule dernière réplique', () => {
  it('garde la salutation, les réponses suivantes et ce qui les suit', () => {
    const j = [arrivee, constat('Il fait froid.'), parole('Mira', 'Salut.'), constat('Vous apprenez…'), parole('Mira', 'Deuxième.'), constat('Mira est convaincue.')];
    expect(entreesDeConversation(j, 'Mira')).toEqual(j.slice(2));
  });

  it('ne remonte pas plus haut que l’arrivée, une saisie du joueur ou la parole d’un autre personnage', () => {
    expect(entreesDeConversation([parole('Bram'), constat('x'), parole('Mira', 'a'), parole('Mira', 'b')], 'Mira')).toEqual([parole('Mira', 'a'), parole('Mira', 'b')]);
    expect(entreesDeConversation([saisie, constat('x'), parole('Mira', 'a')], 'Mira')).toEqual([parole('Mira', 'a')]);
    expect(entreesDeConversation([arrivee, parole('Mira', 'a')], 'Mira')).toEqual([parole('Mira', 'a')]);
  });

  it('ne garde pas ce qui a précédé la salutation (fouilles, constats de l’exploration)', () => {
    const j = [constat('Vous fouillez : rien.'), constat('Vous prenez une clé.'), parole('Mira', 'Salut.')];
    expect(entreesDeConversation(j, 'Mira')).toEqual([parole('Mira', 'Salut.')]);
  });

  it('avec le début connu, deux conversations de suite avec le même personnage ne se mélangent pas', () => {
    const j = [parole('Mira', 'Première conversation.'), constat('Elle sait.'), parole('Mira', 'Seconde conversation.')];
    expect(entreesDeConversation(j, 'Mira', 2)).toEqual([parole('Mira', 'Seconde conversation.')]);
    // Sans le début : tout ce qui est contigu (les deux, faute de mieux).
    expect(entreesDeConversation(j, 'Mira')).toHaveLength(3);
  });

  it('un début qui ne mène à aucune parole du personnage est ignoré', () => {
    const j = [parole('Mira', 'a'), constat('b')];
    expect(entreesDeConversation(j, 'Mira', 2)).toEqual(j);
    expect(entreesDeConversation(j, 'Mira', 99)).toEqual(j);
  });

  it('plafonne une conversation très longue', () => {
    const j = [parole('Mira'), ...Array.from({ length: ENTREES_MAX + 30 }, (_, i) => constat(`c${i}`))];
    const r = entreesDeConversation(j, 'Mira');
    expect(r).toHaveLength(ENTREES_MAX);
    expect(r[r.length - 1]).toEqual(j[j.length - 1]);
  });

  it('sans parole du personnage : la fin du journal jusqu’à une rupture', () => {
    expect(entreesDeConversation([arrivee, constat('a'), constat('b')], 'Mira')).toEqual([constat('a'), constat('b')]);
  });
});

describe('indiceDerniereParole', () => {
  it('trouve la dernière réplique du personnage', () => {
    const e = [parole('Mira', 'a'), constat('x'), parole('Mira', 'b'), constat('y')];
    expect(indiceDerniereParole(e, 'Mira')).toBe(2);
    expect(indiceDerniereParole(e, 'Bram')).toBe(-1);
  });
});

describe('jetAnnonce : le jet affiché sur le bouton', () => {
  it('compétence, DD, meilleur orateur et bonus, Avantage', () => {
    expect(jetAnnonce({ test: 'persuasion', dd: 15, qui: 'Hilda', bonus: 4, mode: 'avantage' }).texte).toBe('Persuasion DD 15 · Hilda +4 (Avantage)');
  });
  it('un bonus négatif prend le vrai signe moins, le Désavantage est annoncé', () => {
    const j = jetAnnonce({ test: 'tromperie', dd: 15, qui: 'Grukk', bonus: -1, mode: 'desavantage' });
    expect(j.texte).toBe('Tromperie DD 15 · Grukk −1 (Désavantage)');
    expect(j.mode).toBe('Désavantage');
  });
  it('sans mode ni orateur, reste lisible', () => {
    expect(jetAnnonce({ test: 'intimidation', dd: 15 }).texte).toBe('Intimidation DD 15');
    expect(jetAnnonce({ test: 'intimidation', dd: 13, qui: 'Pip', bonus: 0 }).texte).toBe('Intimidation DD 13 · Pip +0');
  });
});
