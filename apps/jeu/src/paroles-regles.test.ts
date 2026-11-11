// La clé d'un texte parlé : stable, insensible aux espaces en trop, différente dès que le texte change.
import { describe, expect, it } from 'vitest';
import { cheminParole, cleParole, texteDeParole } from './paroles-regles';

describe('les paroles des PNJ', () => {
  it('la clé est stable : huit caractères hexadécimaux, toujours les mêmes pour le même texte', () => {
    const texte = '« Entrez, et ne touchez pas au mortier. »';
    expect(cleParole(texte)).toMatch(/^[0-9a-f]{8}$/);
    expect(cleParole(texte)).toBe(cleParole(texte));
  });

  it('deux écritures du même texte (espaces, retours à la ligne) ont la même clé', () => {
    expect(cleParole('« Entrez,  et refermez\nvite la porte. »')).toBe(cleParole('« Entrez, et refermez vite la porte. »'));
    expect(texteDeParole('  a   b \n c ')).toBe('a b c');
  });

  it('un texte modifié a une autre clé (sa voix est à refaire)', () => {
    expect(cleParole('« Entrez. »')).not.toBe(cleParole('« Entrez ! »'));
    expect(cleParole('« Entrez. »')).not.toBe(cleParole('« Entrez. » '.replace('Entrez', 'Sortez')));
  });

  it('le chemin range le fichier sous la voix du PNJ', () => {
    expect(cheminParole('f-matrone', '« Bonjour. »')).toBe(`f-matrone/${cleParole('« Bonjour. »')}`);
  });
});
