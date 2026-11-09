import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, ficheDeTour, groupeConseille, jouerTour, MODULES_STANDARD, personnageDepuisFiche, type LLM, type MessageLLM, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { savoirsDe } from '../src/monde/savoirs-donnees';
import type { EtatSavoirs } from '../src/modules/savoirs';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm0 = r.monde;

// Deux faits réels du monde : l'un que Hesta dit librement, l'autre qu'elle garde jusqu'à une certaine confiance.
const [FAIT_LIBRE, FAIT_SECRET] = [...dm0.faits.values()].filter((f) => f.fiable).slice(0, 2).map((f) => f.id) as [string, string];

const SAVOIR = {
  pnj: 'hesta-cendrebrune',
  passe: 'Hesta a grandi dans les cendres, à l’ombre de la Lanterne, et elle y a passé quarante hivers à compter les flammes. '.repeat(5),
  liens: [
    { pnj: 'rolf-garde-capitaine', nature: 'ami de la veille', opinion: 'Un têtu qui sert la soupe sans jamais la goûter.' },
    { qui: 'son père', nature: 'défunt', opinion: 'Il lui a appris à ne pas regarder la flamme en face.' },
  ],
  couleur: [
    { id: 'tisane-de-braise', texte: 'Elle boit une tisane de braise grise le soir, sans sucre, en regardant la Lanterne.' },
    { id: 'le-vieux-banc', texte: 'Elle s’assied sur un banc de pierre usé que son père a taillé.' },
  ],
  sait: [
    { id: 'ce-qu-elle-dit', fait: FAIT_LIBRE, version: 'Elle en parle sans détour, car tout le village le sait.', acces: {}, tabou: [] },
    { id: 'ce-qu-elle-cache', fait: FAIT_SECRET, version: 'Elle sait la vérité depuis des années et se tait.', acces: { attitudeMin: 60 }, evasif: 'elle serre sa tasse et regarde ailleurs', tabou: ['Mot-Secret'] },
  ],
};

const dm = { ...dm0, extensions: { ...(dm0.extensions ?? {}), savoirs: [SAVOIR] } };
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });

/** Le groupe chez Hesta, la conversation ouverte. */
function chezHesta(attitude = 10): Partie {
  let p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
  p = moteur.executer(p, { type: 'parler', pnj: 'hesta-cendrebrune' }).partie;
  p.etat.attitudes['hesta-cendrebrune'] = attitude;
  return p;
}

const repondre = (p: Partie, e: Record<string, unknown>) => moteur.executer(p, { type: 'repondreEnPersonnage', pnj: 'hesta-cendrebrune', ...e } as never);

describe('module Savoirs : un PNJ parle librement, le jeu vérifie chaque réplique', () => {
  it('une réplique qui puise dans la fiche est dite avec la voix du PNJ, et un fait révélé est appris', () => {
    const p = chezHesta();
    const res = repondre(p, { texte: 'Le fait, tout le village le sait. Et le banc, c’est mon père qui l’a taillé.', utilise: ['le-vieux-banc', 'ce-qu-elle-dit'], revele: [FAIT_LIBRE] });
    expect(res.refus).toBeUndefined();
    expect(res.evenements).toContainEqual(expect.objectContaining({ type: 'texte', voix: 'Hesta Cendrebrune', texte: expect.stringContaining('le banc') }));
    expect(res.evenements).toContainEqual({ type: 'faitAppris', fait: FAIT_LIBRE });
    expect(res.partie.etat.faits).toContain(FAIT_LIBRE);
    expect((res.partie.modules['savoirs'] as EtatSavoirs).dits['hesta-cendrebrune']).toEqual(['le-vieux-banc', 'ce-qu-elle-dit']);
  });

  it('un élément qui n’est pas dans la fiche est refusé : le PNJ n’invente rien', () => {
    const res = repondre(chezHesta(), { texte: 'Mon frère a disparu dans la neige.', utilise: ['le-frere-disparu'] });
    expect(res.refus).toMatch(/« le-frere-disparu » n’est pas dans la fiche de Hesta Cendrebrune/);
    expect(res.partie.etat.faits).not.toContain(FAIT_SECRET);
  });

  it('un fait dont l’accès est fermé ne se révèle pas tant que la confiance manque, puis se révèle', () => {
    const faible = repondre(chezHesta(10), { texte: 'La vérité, la voici.', utilise: ['ce-qu-elle-cache'], revele: [FAIT_SECRET] });
    expect(faible.refus).toMatch(/ne peut pas encore révéler.*assez confiance.*évasif : elle serre sa tasse/);
    expect(faible.partie.etat.faits).not.toContain(FAIT_SECRET);
    const confiante = repondre(chezHesta(70), { texte: 'La vérité, la voici.', utilise: ['ce-qu-elle-cache'], revele: [FAIT_SECRET] });
    expect(confiante.refus).toBeUndefined();
    expect(confiante.partie.etat.faits).toContain(FAIT_SECRET);
  });

  it('un mot tabou trahit un secret que le groupe ne connaît pas : réplique refusée, sauf s’il est révélé légitimement', () => {
    const faible = repondre(chezHesta(10), { texte: 'Je ne dirai rien sur le Mot-Secret.', utilise: [] });
    expect(faible.refus).toMatch(/le mot « Mot-Secret » trahit un secret/);
    // Une fois le fait appris par le groupe, le mot n'est plus tabou.
    const p = chezHesta(10);
    p.etat.faits.push(FAIT_SECRET);
    expect(repondre(p, { texte: 'Vous connaissez déjà le Mot-Secret.', utilise: [] }).refus).toBeUndefined();
    // Et il est permis dans la réplique même qui révèle le fait (si l'accès est ouvert).
    expect(repondre(chezHesta(70), { texte: 'Eh bien : le Mot-Secret.', utilise: ['ce-qu-elle-cache'], revele: [FAIT_SECRET] }).refus).toBeUndefined();
  });

  it('refuse un élément verrouillé « utilisé » sans être révélé, un fait inconnu du PNJ, une réplique trop longue, un PNJ absent ou sans fiche', () => {
    const p = chezHesta(10);
    expect(repondre(p, { texte: 'Hum.', utilise: ['ce-qu-elle-cache'] }).refus).toMatch(/« ce-qu-elle-cache » est verrouillé/);
    expect(repondre(p, { texte: 'Hum.', revele: ['f-inconnu'] }).refus).toMatch(/ne connaît pas le fait « f-inconnu »/);
    expect(repondre(p, { texte: 'mot '.repeat(131) }).refus).toMatch(/131 mots : 130 au plus/);
    expect(moteur.executer(p, { type: 'repondreEnPersonnage', pnj: 'kor-varnak', texte: 'Salut.' }).refus).toMatch(/n’est pas ici/);
    const autre = [...dm.pnj.values()].find((x) => x.id !== 'hesta-cendrebrune' && x.lieu === 'vei-maison-des-gardiens');
    if (autre) expect(moteur.executer(p, { type: 'repondreEnPersonnage', pnj: autre.id, texte: 'Salut.' }).refus).toMatch(/pas de fiche de savoir/);
  });

  it('le portrait du PNJ présent donne au LLM le passé, les liens, les souvenirs et ce qu’il sait (verrouillé ou révélable)', () => {
    const fiche = ficheDeTour(moteur, chezHesta(10));
    expect(fiche).toContain('Passé (pour nourrir ses répliques, jamais à réciter');
    expect(fiche).toMatch(/Liens : .*\(ami de la veille\)/);
    expect(fiche).toContain('[tisane-de-braise]');
    expect(fiche).toContain('[ce-qu-elle-dit] (fait ' + FAIT_LIBRE + ', révélable');
    expect(fiche).toMatch(/\[ce-qu-elle-cache\] VERROUILLÉ \(il ne fait pas assez confiance au groupe\) — s'il est pressé, il reste évasif : elle serre sa tasse/);
    // Le texte du secret n'est pas donné tant qu'il est verrouillé.
    expect(fiche).not.toContain('Elle sait la vérité depuis des années et se tait.');
    expect(ficheDeTour(moteur, chezHesta(70))).toContain('Elle sait la vérité depuis des années et se tait.');
  });

  it('un fait révélable qu’aucun sujet écrit ne dit est marqué : seule la parole du PNJ peut le donner', () => {
    const fiche = ficheDeTour(moteur, chezHesta(10));
    expect(fiche).toContain('[ce-qu-elle-dit] (fait ' + FAIT_LIBRE + ', révélable — aucun sujet écrit ne le dit : par repondreEnPersonnage, avec revele: ["' + FAIT_LIBRE + '"] (l\'id du fait, pas celui de l\'élément))');
  });

  it('un fait que dira un sujet écrit encore à aborder n’est pas marqué, et le sujet annonce ce qu’il révèle', () => {
    // « la-lanterne » (Hesta) révèle f-lanterne-etincelle, et n’est pas encore abordé.
    const avecSujet = { ...dm0, extensions: { ...(dm0.extensions ?? {}), savoirs: [{ ...SAVOIR, sait: [{ id: 'la-flamme', fait: 'f-lanterne-etincelle', version: 'Elle sait d’où vient la flamme.', acces: {}, tabou: [] }] }] } };
    const m = creerMoteur({ dm: avecSujet, srd }, MODULES_STANDARD);
    let p = m.executer(m.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
    p = m.executer(p, { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
    p = m.executer(p, { type: 'parler', pnj: 'hesta-cendrebrune' }).partie;
    const fiche = ficheDeTour(m, p);
    expect(fiche).toContain('[la-flamme] (fait f-lanterne-etincelle, révélable)');
    // Le sujet montre sa question (de quoi juger si le joueur la pose) et ce qu'il révèle.
    expect(fiche).toMatch(/la-lanterne — « [^»]+ » \([^)]*\)/);
    // Les identifiants des faits qu'un sujet révèle ne sont jamais montrés au conteur : ils disent souvent le secret.
    expect(fiche).not.toMatch(/révèle f-/);
  });

  it('un refus dit quoi mettre dans revele quand le modèle donne l’id d’un élément à la place de celui du fait', () => {
    const res = repondre(chezHesta(10), { texte: 'Je le dis sans détour.', utilise: ['ce-qu-elle-dit'], revele: ['ce-qu-elle-dit'] });
    expect(res.refus).toContain('est l’identifiant d’un élément de sa fiche, pas d’un fait');
    expect(res.refus).toContain('« ' + FAIT_LIBRE + ' »');
    // Un identifiant qui n'existe nulle part reste un refus sec.
    expect(repondre(chezHesta(10), { texte: 'Oui.', revele: ['n-importe-quoi'] }).refus).toMatch(/ne connaît pas le fait « n-importe-quoi »/);
  });

  it('un souvenir déjà dit est signalé, pour que le PNJ ne se répète pas', () => {
    const p = repondre(chezHesta(), { texte: 'Le banc, c’est mon père qui l’a taillé.', utilise: ['le-vieux-banc'] }).partie;
    expect(ficheDeTour(moteur, p)).toContain('[le-vieux-banc] (déjà dit)');
  });

  it('la validation des données : référence inconnue, accès plus ouvert que le secret de la fiche, conseils de profondeur', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'savoirs')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    const casse = { ...dm0, extensions: { savoirs: [{ ...SAVOIR, pnj: 'personne', liens: [{ pnj: 'inconnu', nature: 'x', opinion: 'y' }], sait: [{ id: 'a', fait: 'f-inconnu', version: 'x' }, { id: 'a', fait: FAIT_LIBRE, version: 'y' }] }] } };
    const erreurs = module.valider!({ dm: casse, srd }).join('\n');
    expect(erreurs).toMatch(/PNJ inconnu/);
    expect(erreurs).toMatch(/lien vers un PNJ inconnu « inconnu »/);
    expect(erreurs).toMatch(/fait inconnu « f-inconnu »/);
    expect(erreurs).toMatch(/identifiant « a » en double/);
    // Un secret verrouillé dans la fiche de dialogue ne peut pas être libre dans le savoir.
    const hesta = dm0.pnj.get('hesta-cendrebrune')!;
    const secret = hesta.secrets.find((s) => s.attitudeMin !== undefined && !s.jet);
    if (secret) {
      const fuite = { ...dm0, extensions: { savoirs: [{ ...SAVOIR, sait: [{ id: 'fuite', fait: secret.fait, version: 'x', acces: {} }] }] } };
      expect(module.valider!({ dm: fuite, srd }).join('\n')).toMatch(/plus ouvert que le secret de la fiche/);
    }
    const mince = { ...dm0, extensions: { savoirs: [{ pnj: 'hesta-cendrebrune', passe: 'Court.', sait: [{ id: 'x', fait: FAIT_LIBRE, version: 'v' }] }] } };
    const avis = module.conseils!({ dm: mince, srd }).join('\n');
    expect(avis).toMatch(/passé de 1 mots/);
    expect(avis).toMatch(/0 lien/);
    expect(avis).toMatch(/0 souvenir/);
    expect(avis).toMatch(/aucun fait verrouillé/);
    expect(savoirsDe(dm).savoirs).toHaveLength(1);
  });
});

/** Un modèle scripté, comme dans conteur.test.ts. */
function scripte(reponses: Partial<MessageLLM>[]): { llm: LLM; recus: MessageLLM[][] } {
  const recus: MessageLLM[][] = [];
  let i = 0;
  const llm: LLM = async ({ messages }) => {
    recus.push(structuredClone(messages));
    const rep = reponses[Math.min(i++, reponses.length - 1)]!;
    return { message: { role: 'assistant', content: null, ...rep }, usage: { entree: 1, cache: 0, sortie: 1, cout: 0.001 } };
  };
  return { llm, recus };
}
const appel = (nom: string, args: unknown, id = `c-${nom}`) => ({ id, type: 'function' as const, function: { name: nom, arguments: JSON.stringify(args) } });

describe('le LLM du jeu parle par l’outil repondreEnPersonnage, et le jeu le renvoie quand il cite autre chose', () => {
  it('l’outil est proposé au modèle, une réplique refusée lui est renvoyée comme un fait du monde, la corrigée passe', async () => {
    const { llm, recus } = scripte([
      { tool_calls: [appel('repondreEnPersonnage', { pnj: 'hesta-cendrebrune', texte: 'Mon frère est mort là-haut.', utilise: ['le-frere-mort'] }, 'a1')] },
      { tool_calls: [appel('repondreEnPersonnage', { pnj: 'hesta-cendrebrune', texte: 'Le banc, c’est mon père qui l’a taillé.', utilise: ['le-vieux-banc'] }, 'a2')] },
      { content: 'Hesta caresse la pierre usée du banc, sans plus rien dire.' },
    ]);
    const res = await jouerTour({ moteur, partie: chezHesta(), texte: 'Parlez-moi de votre famille.', bible: 'BIBLE', llm });
    expect(res.erreur).toBeUndefined();
    expect(res.outils.map((o) => !!o.refus)).toEqual([true, false]);
    const retour = recus[1]!.filter((m) => m.role === 'tool').map((m) => String(m.content));
    expect(retour[0]).toMatch(/^IMPOSSIBLE POUR L'INSTANT : Réplique refusée : « le-frere-mort » n’est pas dans la fiche/);
    expect(res.partie.journal.some((e) => e.type === 'texte' && (e as { voix?: string }).voix === 'Hesta Cendrebrune')).toBe(true);
  });

  it('une narration qui met des paroles de PNJ entre guillemets sans passer par l’outil est reprise une fois : la réplique passe par l’outil', async () => {
    const { llm, recus } = scripte([
      { content: 'Hesta murmure : « Le banc, c’est mon père qui l’a taillé, et personne ne le sait. » Elle regarde la flamme.' },
      { tool_calls: [appel('repondreEnPersonnage', { pnj: 'hesta-cendrebrune', texte: 'Le banc, c’est mon père qui l’a taillé.', utilise: ['le-vieux-banc'] }, 'b1')] },
      { content: 'Hesta regarde la flamme, la main posée sur la pierre usée.' },
    ]);
    const res = await jouerTour({ moteur, partie: chezHesta(), texte: 'Parlez-moi du banc.', bible: 'BIBLE', llm });
    expect(res.appels).toBe(3);
    expect(String(recus[1]!.at(-1)!.content)).toMatch(/sans passer par l'outil repondreEnPersonnage/);
    expect(res.recit).toBe('Hesta regarde la flamme, la main posée sur la pierre usée.');
    expect(res.partie.journal.some((e) => e.type === 'texte' && (e as { voix?: string }).voix === 'Hesta Cendrebrune')).toBe(true);
  });

  it('des guillemets sans PNJ présent nommé (une inscription), ou après une réplique vérifiée, ne déclenchent rien', async () => {
    const { llm } = scripte([{ content: 'Sur le linteau, vous lisez : « Ici veille la flamme des anciens gardiens du col. »' }]);
    const sansPnj = await jouerTour({ moteur, partie: moteur.executer(moteur.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie, texte: 'Je lis le linteau.', bible: 'BIBLE', llm });
    expect(sansPnj.appels).toBe(1);
    const { llm: llm2 } = scripte([
      { tool_calls: [appel('repondreEnPersonnage', { pnj: 'hesta-cendrebrune', texte: 'Le banc, c’est mon père qui l’a taillé.', utilise: ['le-vieux-banc'] }, 'c1')] },
      { content: 'Hesta ajoute, plus bas : « Je ne l’ai jamais dit à personne, pas même à Rolf. »' },
    ]);
    const apres = await jouerTour({ moteur, partie: chezHesta(), texte: 'Le banc ?', bible: 'BIBLE', llm: llm2 });
    expect(apres.appels).toBe(2);
  });
});
