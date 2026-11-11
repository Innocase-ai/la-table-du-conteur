import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Canon, canonDepuisMonde, CANON_VIDE, champsLibres, cleDeRevue, fusionnerCanon, listerRevue, Revue, revoirMonde, sansRejets, trouverMot, type DonneesMonde } from '../src';
import { chargerMonde, listerMondesEcrits, RACINE_MONDES } from '../src/monde/chargeur';

const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

/** Le mini-monde avec deux fiches de savoir : Bertrand (qui parle d'Ysolde) et Ysolde (qui ne parle pas de lui). */
function miniAvecSavoirs(): DonneesMonde {
  const dm = charger(MINI);
  dm.pnj.set('ysolde', { ...structuredClone(dm.pnj.get('bertrand')!), id: 'ysolde', nom: 'Ysolde', age: '40 ans' });
  dm.extensions = {
    ...dm.extensions,
    savoirs: [
      { pnj: 'bertrand', passe: 'Il a servi à boire à tout le pays. Un jour, il a signé le pacte du meunier sans comprendre.', liens: [{ pnj: 'ysolde', nature: 'sa voisine', opinion: 'Il la trouve têtue.' }], couleur: [{ id: 'manie', texte: 'Il essuie le comptoir sans cesse.' }], sait: [] },
      { pnj: 'ysolde', passe: 'Elle vit près du puits depuis toujours.', liens: [], couleur: [], sait: [] },
    ],
  };
  return dm;
}

describe('canon et revue : formats', () => {
  it('accepte un canon complet ou minimal, et refuse un identifiant mal formé', () => {
    expect(Canon.safeParse({}).success).toBe(true);
    expect(Canon.parse({ secrets: [{ id: 's', texte: 'x' }] }).secrets[0]).toEqual({ id: 's', texte: 'x', motsTabou: [], autorise: [] });
    expect(Canon.safeParse({ secrets: [{ id: 'Mauvais', texte: 'x' }] }).success).toBe(false);
    expect(Revue.parse({}).rejets).toEqual([]);
  });

  it('propose un canon depuis le monde : un secret par fait secret (à compléter), les personnages ; la fusion ne touche pas à ce qui existe', () => {
    const dm = charger(MINI);
    dm.faits.set('f-pacte', { id: 'f-pacte', texte: 'Le meunier paie un tribut.', categorie: 'secret', importance: 3, fiable: true });
    const propose = canonDepuisMonde(dm);
    expect(propose.secrets).toEqual([{ id: 'secret-f-pacte', texte: 'Le meunier paie un tribut.', fait: 'f-pacte', motsTabou: [], autorise: [] }]);
    expect(propose.personnages).toEqual([{ id: 'bertrand', nom: 'Bertrand', espece: 'humain' }]);
    const existant = Canon.parse({ secrets: [{ id: 'le-tribut', texte: 'à moi', fait: 'f-pacte', motsTabou: ['tribut'] }], personnages: [{ id: 'bertrand', age: 61 }] });
    const fusion = fusionnerCanon(existant, propose);
    expect(fusion.secrets).toHaveLength(1); // le fait est déjà couvert
    expect(fusion.secrets[0]!.motsTabou).toEqual(['tribut']);
    expect(fusion.personnages).toEqual([{ id: 'bertrand', age: 61 }]);
  });
});

describe('chercher un mot', () => {
  it('ignore accents et casse, accepte le pluriel simple et les expressions, refuse le milieu d’un mot', () => {
    expect(trouverMot('Le Pacte du meunier', 'pacte')?.extrait).toContain('Pacte');
    expect(trouverMot('des tributs lourds', 'tribut')).not.toBeNull();
    expect(trouverMot('Elle écrivit au CAPITAINE', 'capitaine')).not.toBeNull();
    expect(trouverMot('la cote de Hautmarée', 'côte')).not.toBeNull();
    expect(trouverMot('le Cœur de braise', 'cœur de braise')).not.toBeNull();
    expect(trouverMot('un pactole', 'pacte')).toBeNull();
    expect(trouverMot('compacte', 'pacte')).toBeNull();
    expect(trouverMot('rien', '')).toBeNull();
  });

  it('donne un extrait court autour du mot', () => {
    const texte = `${'a '.repeat(60)}pacte${' b'.repeat(60)}`;
    const t = trouverMot(texte, 'pacte')!;
    expect(t.extrait.startsWith('…')).toBe(true);
    expect(t.extrait.endsWith('…')).toBe(true);
    expect(t.extrait.length).toBeLessThan(120);
  });
});

describe('la revue', () => {
  it('liste les textes libres : passé, liens, couleur, salutations, accroches, passages…', () => {
    const champs = champsLibres(miniAvecSavoirs());
    const noms = champs.map((c) => `${c.entite.type}:${c.entite.id}:${c.chemin.join('.')}`);
    expect(noms).toEqual(expect.arrayContaining(['savoirs:bertrand:passe', 'savoirs:bertrand:liens.0.opinion', 'savoirs:bertrand:couleur.0.texte', 'pnj:bertrand:salutations.neutre']));
  });

  it('surveille aussi les sujets ouverts, les salutations amicale et hostile, les ambiances, les visuels, les introductions de rencontre et les narrations d’événement ; jamais la description (pour le MJ) ni un sujet verrouillé', () => {
    const dm = charger(MINI);
    const pnj = dm.pnj.get('bertrand')!;
    pnj.salutations.amical = 'Bonjour, ami.';
    pnj.salutations.hostile = 'Dehors.';
    pnj.sujets = [
      { id: 'ouvert', mots: ['x'], question: 'Que faites-vous ?', reponse: 'Je sers à boire.', revele: [], effets: [], unique: false },
      { id: 'garde', mots: ['y'], condition: { flag: 'confiance' }, reponse: 'Le vrai secret.', revele: [], effets: [], unique: false },
      { id: 'garde-attitude', mots: ['z'], attitudeMin: 40, reponse: 'Un autre secret.', revele: [], effets: [], unique: false },
    ] as typeof pnj.sujets;
    const lieu = [...dm.lieux.values()][0]!;
    lieu.ambiance = 'Une ambiance.';
    const noms = champsLibres(dm).map((c) => `${c.entite.type}:${c.entite.id}:${c.chemin.join('.')}`);
    expect(noms).toEqual(
      expect.arrayContaining([
        'pnj:bertrand:salutations.amical',
        'pnj:bertrand:salutations.hostile',
        'pnj:bertrand:sujets.0.question',
        'pnj:bertrand:sujets.0.reponse',
        `lieux:${lieu.id}:ambiance`,
        `lieux:${lieu.id}:visuel`,
        ...[...dm.rencontres.keys()].map((id) => `rencontres:${id}:intro`),
      ]),
    );
    expect(noms).not.toContain('pnj:bertrand:sujets.1.reponse'); // verrouillé par une condition : c'est là que le secret se dit
    expect(noms).not.toContain('pnj:bertrand:sujets.2.reponse'); // verrouillé par l'attitude
    expect(noms.some((n) => n.endsWith(':description') && n.startsWith('lieux:'))).toBe(false);
  });

  it('un mot tabou dans une réponse de sujet ouvert est signalé', () => {
    const dm = charger(MINI);
    const pnj = dm.pnj.get('bertrand')!;
    pnj.sujets = [{ id: 'ouvert', mots: ['x'], reponse: 'Le pacte du meunier, on n’en parle pas.', revele: [], effets: [], unique: false }] as typeof pnj.sujets;
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'Le meunier a signé un pacte.', motsTabou: ['pacte'] }] });
    const alertes = revoirMonde(dm, canon).filter((a) => a.code === 'revue.secret');
    expect(alertes.some((a) => a.entite?.id === 'bertrand' && (a.chemin ?? []).join('.') === 'sujets.0.reponse')).toBe(true);
  });

  it('un secret qui fuit est signalé avec son extrait, sauf pour une fiche autorisée ; sans mot tabou, rien', () => {
    const dm = miniAvecSavoirs();
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'Le meunier a signé un pacte.', motsTabou: ['pacte'] }] });
    const a = revoirMonde(dm, canon).filter((d) => d.code === 'revue.secret');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ gravite: 'avis', entite: { type: 'savoirs', id: 'bertrand' }, chemin: ['passe'], donnees: { secret: 'pacte', mot: 'pacte' } });
    expect(a[0]!.donnees!['extrait']).toMatch(/pacte du meunier/);
    const autorise = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'], autorise: ['savoirs:bertrand'] }] });
    expect(revoirMonde(dm, autorise).filter((d) => d.code === 'revue.secret')).toEqual([]);
    // Autoriser le PNJ couvre aussi sa fiche de savoir.
    const parPnj = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'], autorise: ['pnj:bertrand'] }] });
    expect(revoirMonde(dm, parPnj).filter((d) => d.code === 'revue.secret')).toEqual([]);
    const typeEntier =Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'], autorise: ['savoirs'] }] });
    expect(revoirMonde(dm, typeEntier).filter((d) => d.code === 'revue.secret')).toEqual([]);
    const inerte = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x' }] });
    expect(revoirMonde(dm, inerte).filter((d) => d.code === 'revue.secret')).toEqual([]);
  });

  it('une confidence verrouillée n’est pas un texte libre ; une confidence sans accès l’est', () => {
    const dm = miniAvecSavoirs();
    (dm.extensions!['savoirs'] as { couleur: unknown[] }[])[0]!.couleur.push({ id: 'secret-intime', texte: 'Il garde le pacte dans sa cave.', acces: { attitudeMin: 50 } });
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'] }] });
    const chemins = revoirMonde(dm, canon).filter((d) => d.code === 'revue.secret').map((d) => d.chemin!.join('.'));
    expect(chemins).toEqual(['passe']);
  });

  it('les personnages du canon concordent avec les fiches : nom, âge, espèce, fiche absente', () => {
    const dm = miniAvecSavoirs();
    const canon = Canon.parse({
      personnages: [{ id: 'bertrand', nom: 'Bertrand', age: 61, espece: 'humain' }, { id: 'ysolde', nom: 'Yseult', age: 40, espece: 'nain' }, { id: 'fantome', nom: 'Fantôme' }],
    });
    const p = revoirMonde(dm, canon).filter((d) => d.code === 'revue.personnage');
    expect(p.map((d) => d.donnees!['champ']).sort()).toEqual(['espece', 'fiche', 'nom']);
    expect(p.find((d) => d.donnees!['champ'] === 'nom')!.donnees).toMatchObject({ attendu: 'Yseult', trouve: 'Ysolde', corrigeable: true });
    dm.pnj.get('bertrand')!.age = '52 ans';
    expect(revoirMonde(dm, canon).filter((d) => d.donnees?.['champ'] === 'age')).toHaveLength(1);
  });

  it('les liens entre PNJ doivent être réciproques', () => {
    const d = revoirMonde(miniAvecSavoirs(), CANON_VIDE).filter((x) => x.code === 'revue.lien-reciproque');
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ gravite: 'conseil', entite: { type: 'savoirs', id: 'ysolde' }, donnees: { de: 'bertrand', vers: 'ysolde' } });
  });

  it('un nom propre qui n’apparaît que dans une fiche est signalé ; il ne l’est pas s’il est un nom du monde, un début de phrase ou dans le lexique', () => {
    const dm = miniAvecSavoirs();
    (dm.extensions!['savoirs'] as { passe: string }[])[1]!.passe = 'Elle vit près du puits. Elle a connu Gorgonzola, le chien de Brindoux, et un certain Aubert de passage. Mardi, elle rit.';
    const noms = (c = CANON_VIDE) => revoirMonde(dm, c).filter((d) => d.code === 'revue.nom-inconnu').map((d) => d.donnees!['mot']);
    // « Brindoux » est le nom du village ; « Mardi » est admis ; « Elle » commence une phrase.
    expect(noms()).toEqual(['Gorgonzola', 'Aubert']);
    expect(noms(Canon.parse({ noms: { lexique: ['Gorgonzola'] } }))).toEqual(['Aubert']);
    // Cité dans une autre fiche : c'est un nom du monde.
    (dm.extensions!['savoirs'] as { passe: string }[])[0]!.passe += ' Il connaît Aubert depuis longtemps.';
    expect(noms()).toEqual(['Gorgonzola']);
  });

  it('une alerte rejetée disparaît, et revient si le texte change', () => {
    const dm = miniAvecSavoirs();
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'] }] });
    const alertes = revoirMonde(dm, canon);
    const secret = alertes.find((d) => d.code === 'revue.secret')!;
    const revue = Revue.parse({ rejets: [cleDeRevue(secret)] });
    expect(sansRejets(alertes, revue).some((d) => d.code === 'revue.secret')).toBe(false);
    // Le texte change (on relit une autre version du monde : les fiches de savoir sont mises en cache par monde).
    const dm2 = miniAvecSavoirs();
    (dm2.extensions!['savoirs'] as { passe: string }[])[0]!.passe = 'Il a signé le pacte, un autre jour, devant témoins, sans rien comprendre à la suite.';
    const apres = revoirMonde(dm2, canon).find((d) => d.code === 'revue.secret')!;
    expect(sansRejets([apres], revue)).toHaveLength(1);
  });

  it('listerRevue : canon et rejets en un appel, sans les alertes rejetées', () => {
    const dm = miniAvecSavoirs();
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'x', motsTabou: ['pacte'] }] });
    const tout = listerRevue(dm, canon, Revue.parse({}));
    expect(tout.some((d) => d.code === 'revue.secret')).toBe(true);
  });
});

describe.each(listerMondesEcrits())('revue de « %s »', (id) => {
  it('sans canon, elle ne plante pas et ne signale que peu de noms inconnus', () => {
    const dm = charger(join(RACINE_MONDES, id));
    const d = revoirMonde(dm, CANON_VIDE);
    expect(d.filter((x) => x.code === 'revue.secret' || x.code === 'revue.personnage')).toEqual([]);
    expect(d.filter((x) => x.code === 'revue.nom-inconnu').length).toBeLessThan(15);
    expect(champsLibres(dm).length).toBeGreaterThan(100);
  });
});
