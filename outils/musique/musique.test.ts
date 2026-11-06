import { describe, expect, it } from 'vitest';
import { AMBIANCES, consigne, coutEstime, MODELES } from './ambiances';
import { formatAudio, lireFlux } from './flux';

const b64 = (s: string) => Buffer.from(s, 'latin1').toString('base64');

describe('lireFlux', () => {
  it('recolle l’audio dans l’ordre et relève le coût', () => {
    const r = lireFlux([
      'data: {"choices":[{"delta":{"audio":{"data":"' + b64('ID3ab') + '"}}}]}',
      ': OPENROUTER PROCESSING',
      '',
      'data: {"choices":[{"delta":{"audio":{"data":"' + b64('cd') + '"},"content":"Titre"}}]}',
      'data: {"choices":[],"usage":{"cost":0.04}}',
      'data: [DONE]',
    ]);
    expect(r.audio.toString('latin1')).toBe('ID3abcd');
    expect(r.texte).toBe('Titre');
    expect(r.cout).toBe(0.04);
    expect(r.erreur).toBeUndefined();
    expect(r.evenements).toBe(3);
  });

  it('lit aussi un message complet (sans flux)', () => {
    const r = lireFlux(['data: {"choices":[{"message":{"audio":{"data":"' + b64('RIFFxx') + '"},"content":"ok"}}]}']);
    expect(r.audio.toString('latin1')).toBe('RIFFxx');
    expect(r.texte).toBe('ok');
  });

  it('relève une erreur annoncée dans le flux', () => {
    expect(lireFlux(['data: {"error":{"message":"quota"}}']).erreur).toBe('quota');
    expect(lireFlux(['data: {"error":"boum"}']).erreur).toBe('boum');
  });

  it('ignore les lignes illisibles', () => {
    const r = lireFlux(['data: {pas du json', 'data: {"choices":[{"delta":{"audio":{"data":"' + b64('x') + '"}}}]}']);
    expect(r.audio.toString('latin1')).toBe('x');
    expect(r.evenements).toBe(1);
  });

  it('rend un audio vide quand il n’y a rien', () => {
    expect(lireFlux([]).audio.length).toBe(0);
  });
});

describe('formatAudio', () => {
  it('reconnaît un mp3 (étiquette ou trame) et un wav', () => {
    expect(formatAudio(Buffer.from('ID3\x04\x00', 'latin1'))).toBe('mp3');
    expect(formatAudio(Buffer.from([0xff, 0xfb, 0x90, 0x00]))).toBe('mp3');
    expect(formatAudio(Buffer.from('RIFF....WAVE', 'latin1'))).toBe('wav');
    expect(formatAudio(Buffer.from('rien du tout', 'latin1'))).toBe('inconnu');
    expect(formatAudio(Buffer.from([1, 2]))).toBe('inconnu');
  });
});

describe('ambiances', () => {
  it('cinq ambiances, aux identifiants uniques', () => {
    expect(AMBIANCES).toHaveLength(5);
    expect(new Set(AMBIANCES.map((a) => a.id)).size).toBe(5);
  });

  it('couvrent les quatre terrains du plateau et le combat intense', () => {
    expect(AMBIANCES.map((a) => a.terrain).sort()).toEqual(['camp', 'caverne', 'foret', 'intense', 'souterrain']);
  });

  it('chaque consigne demande de l’instrumental et une musique qui boucle', () => {
    for (const a of AMBIANCES) {
      const c = consigne(a, 'clip');
      expect(c).toContain('Instrumental only');
      expect(c).toContain('loop');
      expect(c.startsWith('A 30-second clip.')).toBe(true);
    }
    expect(consigne(AMBIANCES[0]!, 'pro').startsWith('A full track')).toBe(true);
  });

  it('annonce le coût au tarif du modèle', () => {
    expect(coutEstime('clip', 1)).toBe(0.04);
    expect(coutEstime('clip', 5)).toBe(0.2);
    expect(coutEstime('pro', 5)).toBe(0.4);
    expect(MODELES.clip.id).toBe('google/lyria-3-clip-preview');
  });
});
