// Le relais de l'assistant d'écriture : modèle imposé, demandes bornées, plafond de dépense tenu, une requête à la fois. Sans réseau.
import { describe, expect, it } from 'vitest';
import { CARACTERES_MAX, lirePlafondAssistant, MESSAGES_MAX, MODELE_ASSISTANT, traiterDemande, verifierDemande, type Appeler, type EtatRelaisIa } from './relais-ia';

const demande = (contenu = 'Écris le récit d’arrivée.') => ({ messages: [{ role: 'system', content: 'Tu es l’assistant.' }, { role: 'user', content: contenu }] });
const etat = (depense = 0, plafond = 0.5): EtatRelaisIa => ({ depense, plafond, enCours: false });

/** Un faux OpenRouter qui renvoie un texte et un coût, et garde la dernière requête. */
function faux(texte = 'La halle sent la cendre froide.', cout = 0.002, status = 200) {
  const appels: { url: string; corps: Record<string, unknown>; entetes: Record<string, string> }[] = [];
  const appeler: Appeler = async (url, init) => {
    appels.push({ url, corps: JSON.parse(init.body) as Record<string, unknown>, entetes: init.headers });
    return { status, text: async () => JSON.stringify(status === 200 ? { choices: [{ message: { content: texte } }], usage: { cost: cout } } : { error: { message: 'Clé refusée' } }) };
  };
  return { appeler, appels };
}

describe('le relais de l’assistant d’écriture', () => {
  it('impose le modèle et la longueur, ajoute la clé, renvoie le texte et compte la dépense', async () => {
    const e = etat();
    const f = faux();
    const r = await traiterDemande(e, 'cle-de-test', { ...demande(), model: 'openai/gpt-hors-de-prix', max_tokens: 99999 }, f.appeler);
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ texte: 'La halle sent la cendre froide.', cout: 0.002, depense: 0.002 });
    expect(f.appels[0]!.corps['model']).toBe(MODELE_ASSISTANT);
    expect(f.appels[0]!.corps['max_tokens']).toBe(1200);
    expect(f.appels[0]!.entetes['Authorization']).toBe('Bearer cle-de-test');
    expect(e.depense).toBeCloseTo(0.002);
    expect(e.enCours).toBe(false);
  });

  it('refuse sans clé, au-delà du plafond, ou pendant une autre demande, sans appeler OpenRouter', async () => {
    const f = faux();
    expect((await traiterDemande(etat(), undefined, demande(), f.appeler)).statut).toBe(503);
    expect((await traiterDemande(etat(0.5, 0.5), 'c', demande(), f.appeler)).statut).toBe(402);
    expect((await traiterDemande({ ...etat(), enCours: true }, 'c', demande(), f.appeler)).statut).toBe(429);
    expect(f.appels).toHaveLength(0);
  });

  it('compte le coût même quand OpenRouter répond une erreur, et la relaie lisiblement', async () => {
    const e = etat();
    const r = await traiterDemande(e, 'c', demande(), faux('', 0, 401).appeler);
    expect(r.statut).toBe(502);
    expect(JSON.stringify(r.corps)).toContain('Clé refusée');
    expect(e.enCours).toBe(false);
  });

  it('une panne réseau libère le relais', async () => {
    const e = etat();
    const r = await traiterDemande(e, 'c', demande(), async () => {
      throw new Error('réseau coupé');
    });
    expect(r.statut).toBe(502);
    expect(e.enCours).toBe(false);
  });

  it('borne les demandes : forme, nombre, taille, dernier message de l’auteur', () => {
    expect(verifierDemande(demande()).ok).toBe(true);
    expect(verifierDemande({}).ok).toBe(false);
    expect(verifierDemande({ messages: [{ role: 'tool', content: 'x' }] }).ok).toBe(false);
    expect(verifierDemande({ messages: [{ role: 'user', content: 3 }] }).ok).toBe(false);
    expect(verifierDemande({ messages: Array.from({ length: MESSAGES_MAX + 1 }, () => ({ role: 'user', content: 'x' })) }).ok).toBe(false);
    expect(verifierDemande(demande('x'.repeat(CARACTERES_MAX))).ok).toBe(false);
    expect(verifierDemande({ messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] }).ok).toBe(false);
  });

  it('lit le plafond (virgule acceptée) et ne le fait jamais sauter sur une valeur invalide', () => {
    expect(lirePlafondAssistant(undefined)).toEqual({ plafond: 0.5, invalide: false });
    expect(lirePlafondAssistant('0,10')).toEqual({ plafond: 0.1, invalide: false });
    expect(lirePlafondAssistant('beaucoup')).toEqual({ plafond: 0.5, invalide: true });
    expect(lirePlafondAssistant('-1')).toEqual({ plafond: 0.5, invalide: true });
  });
});
