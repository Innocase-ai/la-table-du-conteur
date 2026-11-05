import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  bilanPersonnage,
  COMMANDES_HORS_CONTEUR,
  creerLLM,
  creerMoteur,
  ErreurService,
  evenementsEnTexte,
  ficheDeTour,
  groupeConseille,
  jouerTour,
  MACHINE,
  MODULES_STANDARD,
  outilsDuConteur,
  personnageDepuisFiche,
  promptSysteme,
  PROPOSER_ACTIONS,
  versSchemaJson,
  type LLM,
  type MessageLLM,
  type Partie,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const dossier = join(RACINE_MONDES, 'val-des-cendres');
const r = chargerMonde(dossier);
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const BIBLE = 'BIBLE DE TEST : le secret du Cœur-de-Braise.';

const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
const depart = (): Partie => moteur.executer(moteur.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;

const usage = (cout = 0.001) => ({ entree: 1000, cache: 800, sortie: 100, cout });
const appel = (nom: string, args: unknown, id = `c-${nom}`) => ({
  id,
  type: 'function' as const,
  function: { name: nom, arguments: typeof args === 'string' ? args : JSON.stringify(args) },
});

/** Un modèle scripté : à chaque appel, la réponse suivante ; il garde les messages qu'il a reçus. */
function scripte(reponses: Partial<MessageLLM>[]): { llm: LLM; recus: MessageLLM[][] } {
  const recus: MessageLLM[][] = [];
  let i = 0;
  const llm: LLM = async ({ messages }) => {
    recus.push(structuredClone(messages));
    const rep = reponses[Math.min(i++, reponses.length - 1)]!;
    return { message: { role: 'assistant', content: null, ...rep }, usage: usage() };
  };
  return { llm, recus };
}

describe('conteur : les outils', () => {
  const outils = outilsDuConteur(moteur);
  const noms = outils.map((o) => o.function.name);

  it('chaque commande du moteur, sauf celles réservées au jeu, devient un outil ; plus la fin de tour', () => {
    for (const c of moteur.commandes()) expect(noms.includes(c.type), c.type).toBe(!COMMANDES_HORS_CONTEUR.has(c.type));
    expect(noms).toContain('aller');
    expect(noms).toContain('parler');
    expect(noms).toContain(PROPOSER_ACTIONS);
    for (const interdit of ['commencer', 'reglerRencontre', 'jeterObjet', 'saisie', 'raconter']) expect(noms).not.toContain(interdit);
  });

  it('la liste est identique à chaque appel (condition du cache) et chaque schéma est un objet valide', () => {
    expect(JSON.stringify(outilsDuConteur(moteur))).toBe(JSON.stringify(outils));
    for (const o of outils) {
      expect(o.function.parameters, o.function.name).toMatchObject({ type: 'object' });
      expect(o.function.description.length).toBeGreaterThan(5);
    }
  });

  it('le convertisseur de schémas : facultatif, énumération, liste, union, borne', () => {
    const aller = outils.find((o) => o.function.name === 'aller')!.function.parameters as { properties: Record<string, unknown>; required: string[] };
    expect(aller.required).toContain('vers');
    const equiper = outils.find((o) => o.function.name === 'equiper')!.function.parameters as { required: string[] };
    expect(equiper.required.sort()).toEqual(['objet', 'personnage']);
    const utiliser = outils.find((o) => o.function.name === 'utiliserObjet')!.function.parameters as { required: string[] };
    expect(utiliser.required).toEqual(['objet']);
    const indice = outils.find((o) => o.function.name === 'indiceEnigme')!.function.parameters as { properties: { niveau: Record<string, unknown> } };
    expect(indice.properties.niveau).toMatchObject({ type: 'integer', minimum: 1, maximum: 3 });
    const reponse = outils.find((o) => o.function.name === 'repondreEnigme')!.function.parameters as { properties: { reponse: { anyOf: unknown[] } } };
    expect(reponse.properties.reponse.anyOf.length).toBe(3);
  });

  it('versSchemaJson ignore ce qu’il ne connaît pas sans planter', () => {
    expect(versSchemaJson(z.date())).toEqual({});
    expect(versSchemaJson(z.string().describe('Un nom.'))).toEqual({ type: 'string', description: 'Un nom.' });
  });
});

describe('conteur : le contexte', () => {
  it('le préfixe fixe contient les règles, le monde et la bible ; la fiche de tour, le lieu, le groupe et les sorties', () => {
    const systeme = promptSysteme(dm, BIBLE);
    expect(systeme).toContain('Tu ne décides jamais du résultat');
    expect(systeme).toContain(BIBLE);
    expect(systeme).toContain(dm.monde.nom);
    const fiche = ficheDeTour(moteur, depart());
    expect(fiche).toMatch(/## Lieu : /);
    expect(fiche).toMatch(/Sorties : /);
    expect(fiche).toContain('[id: bran]');
    expect(fiche).toMatch(/PV \d+\/\d+, CA \d+/);
    expect(fiche).toMatch(/porte : /);
  });

  it('les comptes rendus montrent les jets, les textes de l’auteur et les faits fiables, jamais le texte d’une rumeur', () => {
    const rumeur = [...dm.faits.values()].find((f) => !f.fiable)!;
    const fiable = [...dm.faits.values()].find((f) => f.fiable)!;
    const texte = evenementsEnTexte(dm, [
      { type: 'jet', jet: { qui: 'pip', nom: 'Pip', test: 'perception', dd: 12, des: [14], bonus: 5, total: 19, reussite: true } },
      { type: 'texte', texte: 'La porte grince.', voix: 'Hesta' },
      { type: 'faitAppris', fait: rumeur.id },
      { type: 'faitAppris', fait: fiable.id },
    ]);
    expect(texte).toMatch(/Pip, perception 19 \(d20 14 \+5\) contre DD 12 → réussi/);
    expect(texte).toContain("Texte de l'auteur (Hesta parle), déjà montré au joueur : « La porte grince. »");
    expect(texte).toContain(fiable.texte);
    expect(texte).not.toContain(rumeur.texte);
  });
});

describe('conteur : un tour', () => {
  it('le joueur écrit, le conteur appelle un outil, le moteur l’exécute, le conteur raconte et propose des actions', async () => {
    const { llm, recus } = scripte([
      { tool_calls: [appel('fouiller', {})] },
      {
        content: 'Vous fouillez la pièce avec soin ; la poussière se lève.',
        tool_calls: [appel(PROPOSER_ACTIONS, { actions: ['Parler à Hesta', 'Sortir', ' ', 'Se reposer', 'Quatrième', 'Cinquième'] })],
      },
    ]);
    const outils: string[] = [];
    const res = await jouerTour({ moteur, partie: depart(), texte: 'Nous fouillons la pièce.', bible: BIBLE, llm, surOutil: (o) => outils.push(o.nom) });
    expect(res.erreur).toBeUndefined();
    expect(res.appels).toBe(2);
    expect(res.recit).toBe('Vous fouillez la pièce avec soin ; la poussière se lève.');
    expect(res.actions).toEqual(['Parler à Hesta', 'Sortir', 'Se reposer', 'Quatrième']);
    expect(outils).toEqual(['fouiller']);
    expect(res.usage.cout).toBeCloseTo(0.002);
    // Le journal : la saisie, puis ce que le moteur a fait, puis le récit.
    const types = res.partie.journal.map((e) => e.type);
    expect(types.indexOf('saisieJoueur')).toBeLessThan(types.indexOf('jet'));
    expect(types.at(-1)).toBe('recitConteur');
    expect(res.partie.journal.at(-1)).toMatchObject({ texte: 'Vous fouillez la pièce avec soin ; la poussière se lève.' });
    // Le premier message est le préfixe en cache ; le moteur a répondu à l'outil avec les jets.
    expect(recus[0]![0]).toMatchObject({ role: 'system', content: [{ type: 'text', cache_control: { type: 'ephemeral' } }] });
    expect(recus[0]!.at(-1)!.content).toContain('Nous fouillons la pièce.');
    const retourOutil = recus[1]!.find((m) => m.role === 'tool')!.content as string;
    expect(retourOutil).toMatch(/Jet : /);
    expect(res.memoire).toEqual([
      { role: 'user', content: 'Nous fouillons la pièce.' },
      { role: 'assistant', content: 'Vous fouillez la pièce avec soin ; la poussière se lève.' },
    ]);
  });

  it('un refus du moteur est rendu au conteur sans rien changer ; un outil inconnu ou des arguments invalides aussi', async () => {
    const { llm, recus } = scripte([
      { tool_calls: [appel('aller', { vers: 'nulle-part' }), appel('teleporter', {}, 'c-2'), appel('fouiller', '{pas du json', 'c-3')] },
      { content: 'Rien ne bouge.' },
    ]);
    const avant = depart();
    const res = await jouerTour({ moteur, partie: avant, texte: 'Je vais nulle part.', bible: BIBLE, llm });
    const retours = recus[1]!.filter((m) => m.role === 'tool').map((m) => m.content as string);
    expect(retours[0]).toMatch(/^IMPOSSIBLE POUR L'INSTANT : /);
    expect(retours[1]).toMatch(/n'existe pas/);
    expect(retours[2]).toMatch(/pas du JSON/);
    expect(res.partie.etat.lieu).toBe(avant.etat.lieu);
    expect(res.outils[0]!.refus).toBeDefined();
    expect(res.recit).toBe('Rien ne bouge.');
    // Le moteur est la seule autorité : aucun jet n'a eu lieu.
    expect(res.partie.journal.some((e) => e.type === 'jet')).toBe(false);
  });

  it('le conteur ne déplace jamais le groupe sans que le moteur le permette : une sortie existante est suivie', async () => {
    const depart0 = depart();
    const sortie = moteur.vue<{ sorties: { vers: string; etat: string }[] }>('scene', depart0).sorties.find((s) => s.etat === 'libre')!;
    const { llm } = scripte([{ tool_calls: [appel('aller', { vers: sortie.vers })] }, { content: 'Vous vous mettez en route.' }]);
    const res = await jouerTour({ moteur, partie: depart0, texte: 'On y va.', bible: BIBLE, llm });
    expect(res.partie.etat.lieu).toBe(sortie.vers);
  });

  it('un modèle qui boucle est arrêté au nombre d’appels permis, avec un récit de repli', async () => {
    const { llm } = scripte([{ tool_calls: [appel('fouiller', {})] }]);
    const res = await jouerTour({ moteur, partie: depart(), texte: 'Encore.', bible: BIBLE, llm, maxAppels: 3 });
    expect(res.appels).toBe(3);
    expect(res.recit).toMatch(/silencieux/);
    expect(res.partie.journal.at(-1)!.type).toBe('recitConteur');
  });

  it('une panne du service avant tout outil laisse la partie intacte (le joueur peut réécrire) ; après un outil, on garde ce qui a eu lieu', async () => {
    const avant = depart();
    const panne: LLM = async () => {
      throw new ErreurService('Le crédit du compte du conteur est épuisé.', 402);
    };
    const r1 = await jouerTour({ moteur, partie: avant, texte: 'Bonjour ?', bible: BIBLE, llm: panne });
    expect(r1.erreur).toMatch(/crédit/);
    expect(r1.partie).toBe(avant);
    let n = 0;
    const apresUnOutil: LLM = async () => {
      if (n++ === 0) return { message: { role: 'assistant', content: null, tool_calls: [appel('fouiller', {})] }, usage: usage() };
      throw new ErreurService('Le service du conteur est momentanément indisponible.', 503);
    };
    const r2 = await jouerTour({ moteur, partie: avant, texte: 'On fouille.', bible: BIBLE, llm: apresUnOutil });
    expect(r2.erreur).toMatch(/indisponible/);
    expect(r2.partie.journal.some((e) => e.type === 'jet')).toBe(true);
  });

  it('la mémoire garde les derniers échanges et les rejoue au tour suivant', async () => {
    const { llm, recus } = scripte([{ content: 'Un.' }, { content: 'Deux.' }, { content: 'Trois.' }]);
    let partie = depart();
    let memoire: Awaited<ReturnType<typeof jouerTour>>['memoire'] = [];
    for (const t of ['a', 'b', 'c']) {
      const res = await jouerTour({ moteur, partie, texte: t, bible: BIBLE, llm, memoire, memoireMax: 4 });
      partie = res.partie;
      memoire = res.memoire;
    }
    expect(memoire).toHaveLength(4);
    expect(memoire.map((m) => m.content)).toEqual(['b', 'Deux.', 'c', 'Trois.']);
    expect(recus[2]!.filter((m) => m.role === 'assistant').map((m) => m.content)).toEqual(['Un.', 'Deux.']);
  });
});

describe('conteur : l’appel au service (OpenRouter)', () => {
  const reponse = (corps: unknown, statut = 200) =>
    ({ ok: statut < 400, status: statut, json: async () => corps, text: async () => JSON.stringify(corps) }) as Response;

  it('envoie le modèle, les outils et la demande de coût ; lit les tokens, le cache et le coût ; sans clé, pas d’en-tête d’autorisation', async () => {
    const fetchSimule = vi.fn(async () =>
      reponse({
        choices: [{ message: { content: 'Bonjour.' } }],
        usage: { prompt_tokens: 5000, completion_tokens: 80, cost: 0.00073, prompt_tokens_details: { cached_tokens: 4200 } },
      }),
    );
    vi.stubGlobal('fetch', fetchSimule);
    const llm = creerLLM({ url: '/api/conteur/chat' });
    const res = await llm({ messages: [{ role: 'user', content: 'x' }], tools: outilsDuConteur(moteur) });
    expect(res.usage).toEqual({ entree: 5000, cache: 4200, sortie: 80, cout: 0.00073 });
    expect(res.message.content).toBe('Bonjour.');
    const [url, init] = fetchSimule.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/conteur/chat');
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    const corps = JSON.parse(init.body as string);
    expect(corps).toMatchObject({ model: 'anthropic/claude-haiku-5.5', usage: { include: true }, tool_choice: 'auto' });
    expect(corps.tools.length).toBeGreaterThan(10);
    // Avec la clé du joueur : l'appel part avec son en-tête.
    await creerLLM({ cle: 'cle-de-test' })({ messages: [], tools: [] });
    expect((fetchSimule.mock.calls[1] as unknown as [string, RequestInit])[1].headers).toMatchObject({ Authorization: 'Bearer cle-de-test' });
    vi.unstubAllGlobals();
  });

  it('des messages lisibles : clé refusée, crédit épuisé ; une limite de débit est retentée puis abandonnée', async () => {
    const pause = vi.fn(async () => {});
    for (const [statut, motif] of [
      [401, /clé/],
      [402, /crédit/],
    ] as const) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => reponse({}, statut)),
      );
      await expect(creerLLM({ pause })({ messages: [], tools: [] })).rejects.toThrow(motif);
    }
    const limite = vi.fn(async () => reponse({}, 429));
    vi.stubGlobal('fetch', limite);
    await expect(creerLLM({ pause })({ messages: [], tools: [] })).rejects.toThrow(/sollicité/);
    expect(limite).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledTimes(3);
    // Une panne passagère suivie d'une réponse : le tour réussit.
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => (n++ === 0 ? reponse({}, 503) : reponse({ choices: [{ message: { content: 'Ça va.' } }] }))),
    );
    const ok = await creerLLM({ pause })({ messages: [], tools: [] });
    expect(ok.message.content).toBe('Ça va.');
    vi.unstubAllGlobals();
  });
});

describe('le conteur ne parle jamais des coulisses du jeu', () => {
  it('le prompt interdit le vocabulaire de machine et apprend à raconter une impossibilité dans la fiction', () => {
    const prompt = promptSysteme(dm, BIBLE);
    expect(prompt).toContain('Jamais de vocabulaire de machine');
    expect(prompt).toMatch(/« moteur », « arbitre »/);
    expect(prompt).toMatch(/dans la fiction/);
    // Ce que reçoit le modèle ne présente plus les refus comme ceux d'un « moteur ».
    expect(prompt).not.toMatch(/Un refus du moteur/);
  });

  it('un récit qui parle du moteur est réécrit une fois, dans la fiction', async () => {
    const { llm, recus } = scripte([
      { content: 'Le moteur refuse de refouiller le bassin aujourd’hui.' },
      { content: 'Vous avez déjà retourné ce bassin de fond en comble : il faudra laisser passer une nuit.' },
    ]);
    const res = await jouerTour({ moteur, partie: depart(), texte: 'On refouille le bassin.', bible: BIBLE, llm });
    expect(res.erreur).toBeUndefined();
    expect(res.appels).toBe(2);
    expect(res.recit).toBe('Vous avez déjà retourné ce bassin de fond en comble : il faudra laisser passer une nuit.');
    const consigne = recus[1]!.at(-1)!;
    expect(consigne.role).toBe('user');
    expect(String(consigne.content)).toMatch(/coulisses/);
    expect(res.partie.journal.at(-1)).toMatchObject({ type: 'recitConteur' });
  });

  it('un récit propre ne coûte aucun appel de plus', async () => {
    const { llm } = scripte([{ content: 'Le bassin est vide : vous l’avez déjà fouillé.' }]);
    const res = await jouerTour({ moteur, partie: depart(), texte: 'Encore le bassin.', bible: BIBLE, llm });
    expect(res.appels).toBe(1);
  });

  it('si la réécriture parle encore des coulisses, on garde le premier récit (le tour n’est pas perdu)', async () => {
    const { llm } = scripte([{ content: 'Le moteur refuse.' }, { content: 'Le moteur refuse toujours.' }]);
    const res = await jouerTour({ moteur, partie: depart(), texte: 'Encore.', bible: BIBLE, llm });
    expect(res.recit).toBe('Le moteur refuse.');
    expect(res.appels).toBe(2);
  });

  it('le détecteur ne confond pas un mot du décor avec les coulisses', () => {
    expect(MACHINE.test('Vous prenez les outils de voleur et crochetez la serrure.')).toBe(false);
    expect(MACHINE.test('Le règlement du village interdit les armes.')).toBe(false);
    expect(MACHINE.test('Le moteur refuse de refouiller.')).toBe(true);
    expect(MACHINE.test('Selon les règles du jeu, c’est impossible.')).toBe(true);
    expect(MACHINE.test('L’arbitre a tranché.')).toBe(true);
  });
});
