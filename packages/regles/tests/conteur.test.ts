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
  FAITS_RECENTS,
  ficheDeTour,
  groupeConseille,
  jouerTour,
  MACHINE,
  memoireDuJournal,
  motsDejaDecrits,
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

describe('le conteur comprend la scène : fiche enrichie, tri des demandes, mémoire tirée du journal', () => {
  /** Le groupe chez Hesta, conversation ouverte, un sujet déjà abordé. */
  const chezHesta = (): Partie => {
    let p = depart();
    p = moteur.executer(p, { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
    p = moteur.executer(p, { type: 'parler', pnj: 'hesta-cendrebrune' }).partie;
    const sujet = dm.pnj.get('hesta-cendrebrune')!.sujets.find((s) => !s.condition && !s.attitudeMin)!;
    return moteur.executer(p, { type: 'parler', pnj: 'hesta-cendrebrune', sujet: sujet.id }).partie;
  };

  it('la fiche donne l’heure et le moment, le portrait des PNJ présents (voix, désir), ce qu’ils ont déjà dit et leurs sujets ouverts', () => {
    const p = chezHesta();
    const fiche = ficheDeTour(moteur, p);
    const hesta = dm.pnj.get('hesta-cendrebrune')!;
    expect(fiche).toMatch(/jour 1, \d+ h \((le jour|le soir|la nuit)\)/);
    expect(fiche).toContain('Personnes ici (seules personnes présentes)');
    expect(fiche).toContain(`Voix : ${hesta.personnalite.voix}`);
    expect(fiche).toContain(`Désir : ${hesta.personnalite.desir}`);
    expect(fiche).toMatch(/Déjà abordé avec le groupe : /);
    expect(fiche).toMatch(/Sujets pas encore abordés : |Plus rien de nouveau/);
    // Aucun secret ni savoir caché n'est donné dans le portrait.
    for (const s of hesta.secrets) expect(fiche).not.toContain(dm.faits.get(s.fait)?.texte ?? '§§');
  });

  it('la fiche dit ce que le groupe sait et a fait : faits appris, quêtes closes, choix, disparus', () => {
    const p = depart();
    const fait = [...dm.faits.values()].find((f) => f.fiable)!;
    p.etat.faits.push(fait.id);
    const q = [...dm.quetes.keys()][0]!;
    p.etat.quetes[q] = { statut: 'terminee', actives: [], accomplies: [] };
    p.etat.pnjEtats['hesta-cendrebrune'] = 'mort';
    const fiche = ficheDeTour(moteur, p);
    expect(fiche).toContain('## Ce que le groupe sait et a fait');
    expect(fiche).toContain(fait.texte.slice(0, 40));
    expect(fiche).toContain('Quêtes closes : ');
    expect(fiche).toContain(`${dm.quetes.get(q)!.nom} (accomplie)`);
    expect(fiche).toMatch(/Disparus : Hesta Cendrebrune \(mort\)/);
  });

  it('les faits majeurs (importance 3) restent dans la fiche même noyés sous des faits plus récents ; les ordinaires sont limités', () => {
    const p = depart();
    const faits = [...dm.faits.values()].filter((f) => f.fiable);
    const majeur = faits.find((f) => f.importance >= 3)!;
    const ordinaires = faits.filter((f) => f.importance < 3).slice(0, 25);
    expect(ordinaires.length).toBeGreaterThan(FAITS_RECENTS);
    // Le fait majeur est appris en premier, puis 25 faits ordinaires : avec l'ancienne fenêtre de 12, il aurait disparu.
    p.etat.faits.push(majeur.id, ...ordinaires.map((f) => f.id));
    const fiche = ficheDeTour(moteur, p);
    expect(fiche).toContain('Faits majeurs appris');
    expect(fiche).toContain(majeur.texte.slice(0, 40));
    const dernier = ordinaires.at(-1)!;
    const plusAncien = ordinaires[0]!;
    expect(fiche).toContain(dernier.texte.slice(0, 40)); // le plus récent est là
    expect(fiche).not.toContain(plusAncien.texte.slice(0, 60)); // un ordinaire trop ancien est tombé
    const m = /Faits appris \(les plus récents d'abord, (\d+) sur (\d+)\)/.exec(fiche);
    expect(Number(m?.[1])).toBe(FAITS_RECENTS);
    expect(Number(m?.[2])).toBeGreaterThanOrEqual(25);
  });

  it('le prompt prend le ton du monde et apprend à trier les demandes (action, parole, question, hors jeu)', () => {
    const prompt = promptSysteme(dm, BIBLE);
    expect(prompt).toContain(`ton du monde (${dm.monde.ton.join(', ')})`);
    expect(prompt).toMatch(/Comprends d'abord ce que le joueur demande/);
    expect(prompt).toMatch(/sujet pas encore abordé/);
    expect(prompt).toMatch(/Une question sur le groupe/);
    expect(prompt).toMatch(/uniquement avec ce que la fiche contient/);
  });

  it('la mémoire se reconstruit à partir du journal sauvegardé, par paires complètes', async () => {
    const { llm } = scripte([{ content: 'Un.' }, { content: 'Deux.' }]);
    let partie = depart();
    partie = (await jouerTour({ moteur, partie, texte: 'a', bible: BIBLE, llm })).partie;
    // Une saisie restée sans récit (panne) ne casse pas les paires.
    partie = moteur.executer(partie, { type: 'saisie', texte: 'perdu' }).partie;
    expect(memoireDuJournal(partie).map((m) => m.content)).toEqual(['a', 'Un.']);
    // Sans mémoire passée, le tour suivant la reçoit du journal (elle survit au rechargement).
    const { llm: llm2, recus } = scripte([{ content: 'Trois.' }]);
    await jouerTour({ moteur, partie, texte: 'b', bible: BIBLE, llm: llm2 });
    expect(recus[0]!.slice(1, 3).map((m) => m.content)).toEqual(['a', 'Un.']);
  });
});

describe('conteur : un modèle piégé par le joueur ne sort pas de ses outils', () => {
  /** Une partie où le groupe a une corde dans le sac. */
  const avecCorde = (): Partie => {
    const p = depart();
    return { ...p, etat: { ...p.etat, inventaire: { ...p.etat.inventaire, corde: 1 } } };
  };

  it('un champ « type » glissé dans les arguments ne change pas la commande exécutée (jeterObjet reste interdit)', async () => {
    const { llm } = scripte([
      { content: 'Vous cherchez.', tool_calls: [appel('testLibre', { type: 'jeterObjet', objet: 'corde', quantite: 1, competence: 'perception', dd: 10 })] },
      { content: 'Rien ne se passe.' },
    ]);
    const partie = avecCorde();
    const res = await jouerTour({ moteur, partie, texte: 'cherche', bible: BIBLE, llm });
    expect(res.outils.map((o) => o.nom)).toEqual(['testLibre']);
    expect(res.partie.etat.inventaire['corde']).toBe(1); // la corde est toujours là
  });

  it('un règlement de combat avec des PX choisis, demandé sous le nom d’un outil permis, est ignoré', async () => {
    const { llm } = scripte([
      { content: 'Le combat est fini.', tool_calls: [appel('testLibre', { type: 'reglerRencontre', issue: 'victoire', px: 999999, competence: 'perception', dd: 10 })] },
      { content: 'Fin.' },
    ]);
    const partie = depart();
    const xp = partie.etat.xp;
    const res = await jouerTour({ moteur, partie, texte: 'je gagne', bible: BIBLE, llm });
    expect(res.partie.etat.xp).toBe(xp);
  });

  it('un outil inconnu, ou réservé au jeu, appelé directement par son nom est refusé comme avant', async () => {
    const { llm, recus } = scripte([
      { content: 'Je tente.', tool_calls: [appel('jeterObjet', { objet: 'corde' }), appel('trancher', { dilemme: 'x', choix: 'y' })] },
      { content: 'Rien.' },
    ]);
    const partie = avecCorde();
    const res = await jouerTour({ moteur, partie, texte: 'jette', bible: BIBLE, llm });
    expect(res.outils).toEqual([]); // aucun n'a été exécuté
    expect(res.partie.etat.inventaire['corde']).toBe(1);
    expect(JSON.stringify(recus[1])).toMatch(/n'existe pas/);
  });

  it('des arguments qui ne sont pas un objet (liste, nombre) sont traités comme vides', async () => {
    const { llm } = scripte([{ content: 'Voilà.', tool_calls: [appel('testLibre', [1, 2]), appel('testLibre', '7')] }, { content: 'Fin.' }]);
    const res = await jouerTour({ moteur, partie: depart(), texte: 'x', bible: BIBLE, llm });
    expect(res.erreur).toBeUndefined();
    expect(res.outils.length).toBe(2);
  });
});

describe('détails déjà décrits : le conteur ne répète pas ses gestes', () => {
  const journal = (...recits: string[]) => ({ journal: recits.map((texte) => ({ type: 'recitConteur', texte })) }) as unknown as Pick<Partie, 'journal'>;

  it('signale les mots d’image employés dans au moins deux récits récents', () => {
    const mots = motsDejaDecrits(
      journal(
        'Hesta frappe les dalles de sa canne de fer. La cendre glisse sur les carreaux.',
        'Elle ne quitte pas la fenêtre. Sa canne de fer résonne, la cendre tombe encore aux carreaux.',
        'Un chien aboie dehors, la canne reste immobile.',
      ),
    );
    expect(mots).toEqual(expect.arrayContaining(['canne', 'cendre', 'carreaux']));
    // Un mot qui n'apparaît que dans un seul récit n'est pas signalé.
    expect(mots).not.toContain('chien');
    expect(mots).not.toContain('fenetre');
  });

  it('ignore les mots courants, les accents et la casse, et plafonne la liste', () => {
    const r = 'Pendant ce temps, comme toujours, elle reste là. Cendre, CENDRE, cendré.';
    expect(motsDejaDecrits(journal(r, r))).toEqual(['cendre']);
    const beaucoup = 'argent bronze canne carreaux dalles flamme fenetre foyer lances lampe manteau poing sabre table verre';
    expect(motsDejaDecrits(journal(beaucoup, beaucoup)).length).toBe(10);
  });

  it('ne dit rien avec moins de deux récits, et ne regarde que les quatre derniers', () => {
    expect(motsDejaDecrits(journal('La canne de fer.'))).toEqual([]);
    expect(motsDejaDecrits(journal('canne canne', 'ciel ciel', 'vent vent', 'pluie pluie', 'brume brume'))).toEqual([]);
  });

  it('un personnage qui revient n’est pas une répétition', () => {
    const r = ['Hesta lève la tête.', 'Hesta se tait.'];
    expect(motsDejaDecrits(journal(...r))).toEqual(['hesta']);
    expect(motsDejaDecrits(journal(...r), ['Hesta Cendrebrune'])).toEqual([]);
  });

  it('la fiche de tour porte la liste, et la consigne de ne pas se répéter est dans le prompt', () => {
    expect(promptSysteme(dm, BIBLE)).toContain('Ne te répète pas');
    expect(promptSysteme(dm, BIBLE)).toContain('ni sous une autre forme');
    const p = depart();
    p.journal.push(
      { type: 'saisieJoueur', texte: 'a' } as never,
      { type: 'recitConteur', texte: 'Le fil de bronze glisse entre ses doigts gris.' } as never,
      { type: 'saisieJoueur', texte: 'b' } as never,
      { type: 'recitConteur', texte: 'Elle fait glisser le fil de bronze, lentement.' } as never,
    );
    expect(ficheDeTour(moteur, p)).toMatch(/## Détails déjà décrits dans tes derniers récits .* : .*bronze/);
  });
});

describe('garde-fou : les paroles de PNJ passent par l’outil', () => {
  const chezBertille = (): Partie => {
    let p = depart();
    p = moteur.executer(p, { type: 'aller', vers: 'vei-auberge-dernier-feu' }).partie;
    return moteur.executer(p, { type: 'parler', pnj: 'bertille-dernier-feu' }).partie;
  };
  const REPLIQUE = 'Bertille reprend sa louche. « La Haute-Forge ? Mes poulets, la seule chose que je connaisse de la Haute-Forge, c’est qu’elle a laissé ses cendres sur mon seuil. » Dans la cuisine, une marmite cogne le fourneau.';

  it('une réplique entre guillemets sans l’outil est reprise une fois', async () => {
    const { llm, recus } = scripte([{ content: REPLIQUE }, { content: 'Bertille reprend sa louche et ne répond pas. Dans la cuisine, une marmite cogne le fourneau.' }]);
    const res = await jouerTour({ moteur, partie: chezBertille(), texte: 'Dis-moi la vérité sur la Haute-Forge.', bible: BIBLE, llm });
    expect(recus.length).toBe(2);
    expect(res.appels).toBe(2);
    expect(res.recit).not.toContain('«');
  });

  it('même quand le récit arrive avec l’appel proposer_actions (le cas normal), la réplique sans outil est reprise', async () => {
    const actions = appel(PROPOSER_ACTIONS, { actions: ['Demander à Bertille ce qu’elle sert', 'Quitter l’auberge'] });
    const { llm, recus } = scripte([
      { content: REPLIQUE, tool_calls: [actions] },
      { content: 'Bertille reprend sa louche et ne répond pas. Dans la cuisine, une marmite cogne le fourneau.', tool_calls: [actions] },
    ]);
    const res = await jouerTour({ moteur, partie: chezBertille(), texte: 'Dis-moi la vérité sur la Haute-Forge.', bible: BIBLE, llm });
    expect(recus.length).toBe(2);
    expect(res.recit).not.toContain('«');
    expect(res.actions.length).toBe(2);
  });

  it('une action proposée qui contient un mot tabou d’un fait ignoré du groupe est écartée', async () => {
    const tabou = [...dm.faits.values()].find((f) => f.fiable)!;
    const savoir = {
      pnj: 'bertille-dernier-feu',
      passe: 'Bertille tient l’auberge du Dernier Feu depuis dix-huit ans, héritée de sa mère. '.repeat(6),
      liens: [{ qui: 'Bram', nature: 'mari', opinion: 'Il rentrait toujours du marché à la même heure.' }],
      couleur: [],
      sait: [{ id: 'le-secret', fait: tabou.id, version: 'Elle sait tout.', acces: { attitudeMin: 90 }, evasif: 'Elle esquive.', tabou: ['pierre philosophale'] }],
    };
    const m = creerMoteur({ dm: { ...dm, extensions: { ...(dm.extensions ?? {}), savoirs: [savoir] } }, srd }, MODULES_STANDARD);
    let p = m.executer(m.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
    p = m.executer(p, { type: 'aller', vers: 'vei-auberge-dernier-feu' }).partie;
    const actions = appel(PROPOSER_ACTIONS, { actions: ['Demander à Bertille où est la pierre philosophale', 'Quitter l’auberge', 'Demander à Bertille ce qu’elle sert'] });
    const { llm } = scripte([{ content: 'Bertille essuie une table.', tool_calls: [actions] }]);
    const res = await jouerTour({ moteur: m, partie: p, texte: 'Je regarde autour de moi.', bible: BIBLE, llm });
    expect(res.actions).toEqual(['Quitter l’auberge', 'Demander à Bertille ce qu’elle sert']);
  });

  it('le vocabulaire de machine est repris aussi quand le récit arrive avec proposer_actions', async () => {
    const actions = appel(PROPOSER_ACTIONS, { actions: ['Quitter l’auberge', 'Parler à Bertille'] });
    const { llm, recus } = scripte([
      { content: 'Le moteur refuse votre demande : le système ne le permet pas.', tool_calls: [actions] },
      { content: 'Bertille hausse les épaules et reprend son service.', tool_calls: [actions] },
    ]);
    const res = await jouerTour({ moteur, partie: chezBertille(), texte: 'Fais quelque chose d’impossible.', bible: BIBLE, llm });
    expect(recus.length).toBe(2);
    expect(res.recit).not.toMatch(MACHINE);
  });
});
