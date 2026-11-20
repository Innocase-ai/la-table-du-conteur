// F3 (20/11/2026) : le gabarit de quête (`monde/quete-fiche.ts`), le critère « sait parler » (`monde/parole.ts`), les avis de quêtes
// (`monde/quetes-avis.ts`) et la preuve par le parcours automatique. Un hameau d'essai reçoit quatre quêtes PRODUITES par des fiches (tuer, trouver,
// apporter, libérer) : le monde est valide, ne produit aucun avis de quête, et le joueur automatique termine chacune. Les mondes sans le profil
// « épisode » ne voient aucun nouvel avis (P2) ; rien n'est jamais une erreur (P1).
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { conseilsEpisode } from '../src/monde/episode';
import { alternativesDeParole, estAlternativeDeParole, paroleDeLangues, paroleDeProfil, parolesDeRencontre } from '../src/monde/parole';
import { FicheQuete, genererQuete, lireFiches, type FicheQuete as Fiche } from '../src/monde/quete-fiche';
import { avisQuetes, rencontresExigees } from '../src/monde/quetes-avis';
import type { DonneesMonde } from '../src/monde/schemas';
import { validerMonde } from '../src/monde/validation';
import { explorerParcours } from '../src/verification/parcours';

const SRD = chargerDonneesSrd();

// --- Qui sait parler ? ---------------------------------------------------------------------------------------------------------------------

describe('le critère « sait parler » (champ `langues`, jamais le type de créature)', () => {
  it('lit les formes du SRD : parle, comprend sans parler, muet', () => {
    expect(paroleDeLangues('aucune')).toBe('muet');
    expect(paroleDeLangues('commun, gobelin')).toBe('parle');
    expect(paroleDeLangues('toutes ; télépathie 36 m')).toBe('parle');
    expect(paroleDeLangues('comprend le commun, mais ne parle pas')).toBe('comprend');
    expect(paroleDeLangues('comprend les ordres qu\'on lui donne, quelle que soit la langue, mais ne parle pas')).toBe('comprend');
    // Une langue parlée d'abord, puis ce qu'il comprend : il parle.
    expect(paroleDeLangues('céleste ; comprend le commun, l\'elfique et le sylvestre, mais ne les parle pas')).toBe('parle');
    expect(paroleDeLangues('chien esquiveur ; comprend l\'elfique et le sylvestre, mais ne les parle pas')).toBe('parle');
    // La télépathie le fait comprendre : il parle.
    expect(paroleDeLangues('comprend l\'abyssal, le céleste, l\'infernal et le primordial, mais ne parle pas ; télépathie 36 m')).toBe('parle');
    // Une remarque entre parenthèses ne change rien : le loup-garou parle sous sa forme humanoïde.
    expect(paroleDeLangues('commun (ne parle pas sous forme de loup)')).toBe('parle');
    expect(paroleDeLangues('')).toBe('inconnu');
    expect(paroleDeLangues(undefined)).toBe('inconnu');
  });

  it('classe les 329 profils du SRD : 130 muets, 19 qui comprennent sans parler, 180 qui parlent, aucun inconnu', () => {
    const compte: Record<string, number> = { parle: 0, comprend: 0, muet: 0, inconnu: 0 };
    for (const m of SRD.monstres.values()) compte[paroleDeLangues(m.langues)]!++;
    expect(compte).toEqual({ parle: 180, comprend: 19, muet: 130, inconnu: 0 });
  });

  it('se fonde sur les langues, pas sur le type : un gobelin (« Fée ») et un dragon parlent, un rat est muet, un golem comprend', () => {
    expect(SRD.monstres.get('combattant-gobelin')!.type).toMatch(/Fée/);
    expect(paroleDeProfil(SRD, 'combattant-gobelin')).toBe('parle');
    expect(paroleDeProfil(SRD, 'dragon-blanc-adulte')).toBe('parle');
    expect(paroleDeProfil(SRD, 'rat')).toBe('muet');
    expect(paroleDeProfil(SRD, 'golem-de-fer')).toBe('comprend');
    expect(paroleDeProfil(SRD, 'kraken')).toBe('parle');
    expect(paroleDeProfil(SRD, 'profil-inexistant')).toBe('inconnu');
  });

  it('une rencontre « muette » n\'a que des adversaires muets ; un PNJ nommé parle toujours', () => {
    const r = (monstres: { profil: string; nombre: number; pnj?: string }[]) => ({ monstres }) as never;
    expect(parolesDeRencontre(SRD, r([{ profil: 'rat', nombre: 3 }]))).toMatchObject({ parle: false, muette: true });
    expect(parolesDeRencontre(SRD, r([{ profil: 'rat', nombre: 3 }, { profil: 'combattant-gobelin', nombre: 1 }]))).toMatchObject({ parle: true, muette: false });
    expect(parolesDeRencontre(SRD, r([{ profil: 'golem-de-fer', nombre: 1 }]))).toMatchObject({ parle: false, muette: false }); // zone grise : ni avis dans un sens ni dans l'autre
    expect(parolesDeRencontre(SRD, r([{ profil: 'rat', nombre: 1, pnj: 'ratier' }]))).toMatchObject({ parle: true, muette: false });
  });

  it('reconnaît une alternative de parole : strict pour « négocier », large pour « une issue autre que le combat »', () => {
    const alt = (id: string, nom: string, competence?: string) => ({ id, nom, ...(competence ? { jet: { competence, dd: 12 } } : {}) }) as never;
    expect(estAlternativeDeParole(alt('marchander', 'Marchander le passage', 'persuasion'))).toBe(true);
    expect(estAlternativeDeParole(alt('se-faire-passer', 'Se faire passer pour des colporteurs', 'tromperie'))).toBe(true);
    // Intimider peut se faire par un geste (des torches contre des loups) ; payer ou montrer une lettre n'est une parole que pour un adversaire qui parle.
    expect(estAlternativeDeParole(alt('feu', 'Chasser la meute par le feu', 'intimidation'))).toBe(false);
    expect(estAlternativeDeParole(alt('feu', 'Chasser la meute par le feu', 'intimidation'), true)).toBe(true);
    expect(estAlternativeDeParole(alt('payer', 'Payer le droit de passage'))).toBe(false);
    expect(estAlternativeDeParole(alt('payer', 'Payer le droit de passage'), true)).toBe(true);
    expect(estAlternativeDeParole(alt('grain', 'Les attirer avec du grain', 'survie'), true)).toBe(false);
    expect(alternativesDeParole({ alternatives: [alt('a', 'Négocier', 'persuasion'), alt('b', 'Contourner', 'discretion')] } as never)).toHaveLength(1);
  });
});

// --- Le hameau d'essai ---------------------------------------------------------------------------------------------------------------------

const lieu = (id: string, nom: string, type: string, parent?: string, extra: Record<string, unknown> = {}) => ({
  id, nom, type, ...(parent ? { parent } : {}), resume: `${nom}.`, description: `${nom}, pour le MJ.`, visuel: `${nom}, vu de face.`, ...extra,
});
const pnj = (id: string, nom: string, lieuId: string, extra: Record<string, unknown> = {}) => ({
  id, nom, espece: 'humain', sexe: 'N', role: 'Villageois', lieu: lieuId, apparence: `${nom}, en tablier.`,
  personnalite: { traits: ['calme', 'curieux'], voix: 'douce', desir: 'la paix' }, salutations: { neutre: 'Bonjour.' }, ...extra,
});
const objetQuete = (id: string, nom: string) => ({ id, nom, categorie: 'quete', valeurPo: 0, resume: `${nom}.` });
const rencontre = (id: string, lieuId: string, monstres: { profil: string; nombre: number }[], alternatives: unknown[] = []) => ({
  id, nom: `Rencontre ${id}`, type: 'combat', lieu: lieuId, difficulte: 'faible', intro: 'Une rencontre.', monstres, alternatives,
});

/** Le monde du hameau, sans quête ; `plus` ajoute des quêtes et des sujets de PNJ (ceux que les fiches produisent). */
function hameau(plus: { quetes?: unknown[]; sujets?: Record<string, unknown[]> } = {}) {
  const sujets = plus.sujets ?? {};
  return {
    monde: {
      id: 'hameau-essai', version: 1, nom: 'Hameau d’essai', resume: 'Un hameau.', accroche: 'Un hameau.', ton: ['simple'], niveaux: { min: 1, max: 2 },
      depart: { lieu: 'place', intro: 'Vous arrivez sur la place.' }, direction: { style: 'peinture', palette: ['vert', 'gris'] },
      chapitres: [{ id: 'ch1', nom: 'Chapitre 1', niveaux: { min: 1, max: 2 }, resume: 'Tout.', lieux: ['place'] }],
    },
    lieux: [
      lieu('place', 'La place', 'village'),
      lieu('forge', 'La forge', 'batiment', 'place'),
      lieu('moulin', 'Le moulin', 'batiment', 'place'),
      lieu('grenier', 'Le grenier', 'batiment', 'place'),
      lieu('cave', 'La cave', 'salle', 'place', { rencontres: [{ id: 'r-geoliers', declencheur: 'entree' }] }),
      lieu('tanniere', 'La tanière', 'salle', 'place', { rencontres: [{ id: 'r-bandits', declencheur: 'entree' }] }),
    ],
    pnj: [
      pnj('hector', 'Hector le chef', 'place', { sujets: sujets['hector'] ?? [] }),
      pnj('brun', 'Brun le forgeron', 'forge', { sujets: sujets['brun'] ?? [] }),
      pnj('lise', 'Lise la captive', 'cave', { sujets: sujets['lise'] ?? [] }),
    ],
    objets: [objetQuete('sceau-du-chef', 'Le sceau du chef'), objetQuete('colis-de-brun', 'Le colis de Brun')],
    tresors: [
      { id: 't-sceau', nom: 'Coffre du moulin', lieu: 'moulin', contenant: 'coffre', description: 'Un coffre.', contenu: { objets: [{ objet: 'sceau-du-chef' }] }, acces: { verrou: { dd: 10 } } },
      { id: 't-colis', nom: 'Cachette du grenier', lieu: 'grenier', contenant: 'cache', description: 'Une cachette.', contenu: { objets: [{ objet: 'colis-de-brun' }] }, acces: { cache: { dd: 10 } } },
    ],
    rencontres: [
      rencontre('r-bandits', 'tanniere', [{ profil: 'combattant-gobelin', nombre: 2 }], [{ id: 'marchander-le-passage', nom: 'Marchander le passage', jet: { competence: 'persuasion', dd: 10 }, resume: 'Ils vous laissent passer.', effets: [] }]),
      rencontre('r-geoliers', 'cave', [{ profil: 'combattant-gobelin', nombre: 1 }], [{ id: 'payer-les-geoliers', nom: 'Payer les geôliers', resume: 'Ils s’écartent.', effets: [] }]),
      rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }]),
    ],
    quetes: plus.quetes ?? [],
  };
}
type Hameau = ReturnType<typeof hameau>;

function ecrire(h: Hameau): DonneesMonde {
  const dossier = mkdtempSync(join(tmpdir(), 'quete-fiche-'));
  writeFileSync(join(dossier, 'monde.json'), JSON.stringify(h.monde));
  for (const nom of ['lieux', 'pnj', 'objets', 'tresors', 'rencontres', 'quetes'] as const) {
    mkdirSync(join(dossier, nom));
    writeFileSync(join(dossier, nom, `${nom}.json`), JSON.stringify(h[nom]));
  }
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
  return r.monde;
}

const TEXTES = { vaincre: 'Venez à bout des bandits de la tanière.', trouver: 'Retrouvez le sceau du chef.', obtenir: 'Retrouvez le colis caché.', livrer: 'Portez le colis à Brun.', liberer: 'Libérez Lise.', retour: 'Retournez voir Hector.', offre: 'Hector vous confie la tâche.', rendu: 'Hector tient parole.', livraison: 'Brun prend le colis.', liberation: 'Lise vous remercie.' };

/** Quatre fiches qui couvrent les quatre buts, tous textes écrits, sur le hameau. */
function fiches(): Fiche[] {
  const base = { donneur: 'hector', niveau: { min: 1, max: 2 }, textes: TEXTES };
  const f = (x: Record<string, unknown>) => FicheQuete.parse({ ...base, ...x });
  return [
    f({ id: 'q-les-bandits', nom: 'Les bandits de la tanière', but: 'tuer', resume: 'Des bandits tiennent la tanière.', cible: { rencontre: 'r-bandits' }, resolution: ['combat', 'negocier'], butin: { xp: 50, annonce: '30 po de la caisse du village.', pieces: 30 }, mots: ['bandits', 'taniere'] }),
    f({ id: 'q-le-sceau', nom: 'Le sceau du chef', but: 'trouver', resume: 'Le sceau du chef a disparu.', cible: { objet: 'sceau-du-chef' }, resolution: ['crochetage'], butin: { xp: 40, annonce: 'La reconnaissance du chef.' }, mots: ['sceau'] }),
    f({ id: 'q-le-colis', nom: 'Le colis de Brun', but: 'apporter', resume: 'Un colis attend à la forge.', cible: { objet: 'colis-de-brun', destinataire: 'brun' }, resolution: ['fouille'], butin: { xp: 40, annonce: 'Une dague de la forge.' }, mots: ['colis'] }),
    f({ id: 'q-lise-la-captive', nom: 'Lise la captive', but: 'liberer', resume: 'Lise est retenue dans la cave.', cible: { pnj: 'lise', rencontre: 'r-geoliers' }, resolution: ['combat', 'negocier'], butin: { xp: 60, annonce: 'Les remerciements de Lise.' }, mots: ['lise', 'captive'] }),
  ];
}

/** Génère les quatre quêtes sur le hameau nu, et l'écrit avec leurs quêtes et leurs sujets. */
function hameauAvecQuetes(): { dm: DonneesMonde; quetes: unknown[]; sujets: Record<string, unknown[]> } {
  const nu = ecrire(hameau());
  const quetes: unknown[] = [];
  const sujets: Record<string, unknown[]> = {};
  for (const fiche of fiches()) {
    const r = genererQuete(fiche, nu, SRD);
    expect(r.erreurs, fiche.id).toEqual([]);
    quetes.push(r.quete);
    for (const s of r.sujets) (sujets[s.pnj] ??= []).push(s.sujet);
  }
  return { dm: ecrire(hameau({ quetes, sujets })), quetes, sujets };
}

// --- La fiche -------------------------------------------------------------------------------------------------------------------------------

describe('la fiche de quête produit le JSON des étapes', () => {
  let nu: DonneesMonde;
  beforeAll(() => {
    nu = ecrire(hameau());
  });

  it('tuer : combattre, puis retour au donneur ; aucun `lieu` d\'étape ; le lieu de la quête est celui du donneur', () => {
    const r = genererQuete(fiches()[0]!, nu, SRD);
    const q = r.quete!;
    expect(q.etapes.map((e) => e.id)).toEqual(['vaincre', 'retour']);
    expect(q.etapes[0]!.completion).toEqual({ rencontre: { id: 'r-bandits' } });
    expect(q.etapes[1]).toMatchObject({ completion: { flag: 'les-bandits-rendue' }, termine: true, suivantes: [] });
    expect(q.etapes.some((e) => 'lieu' in e)).toBe(false);
    expect(q.lieu).toBe('place'); // le lieu du donneur, pas celui de la tanière
    expect(q.donneur).toBe('hector');
    expect(q.recompenses).toMatchObject({ xp: 50, pieces: 30, annonce: '30 po de la caisse du village.' });
    expect(q.ramifications).toContain('combat, negocier');
    expect(r.drapeaux).toEqual(['les-bandits-rendue']);
  });

  it('trouver : l\'objet, puis le retour', () => {
    const q = genererQuete(fiches()[1]!, nu, SRD).quete!;
    expect(q.etapes.map((e) => [e.id, e.completion])).toEqual([['trouver', { objet: 'sceau-du-chef' }], ['retour', { flag: 'le-sceau-rendue' }]]);
  });

  it('apporter : se procurer l\'objet, le livrer au destinataire (son sujet pose le drapeau), puis le retour ; `fourni` saute la première étape', () => {
    const r = genererQuete(fiches()[2]!, nu, SRD);
    expect(r.quete!.etapes.map((e) => e.id)).toEqual(['obtenir', 'livrer', 'retour']);
    const livraison = r.sujets.find((s) => s.pnj === 'brun')!.sujet;
    expect(livraison).toMatchObject({ condition: { etape: { quete: 'q-le-colis', etape: 'livrer' } }, effets: [{ flag: 'le-colis-livree' }, { objet: { id: 'colis-de-brun', retirer: true } }] });
    const fourni = genererQuete({ ...fiches()[2]!, cible: { objet: 'colis-de-brun', destinataire: 'brun', fourni: true }, resolution: ['discussion'] }, nu, SRD);
    expect(fourni.quete!.etapes.map((e) => e.id)).toEqual(['livrer', 'retour']);
    expect(fourni.sujets.find((s) => s.sujet.id === 'le-colis-offre')!.sujet.effets).toContainEqual({ objet: { id: 'colis-de-brun' } }); // le donneur remet l'objet à l'offre
  });

  it('libérer : vaincre la garde, libérer (le sujet du captif pose le drapeau), puis le retour', () => {
    const r = genererQuete(fiches()[3]!, nu, SRD);
    expect(r.quete!.etapes.map((e) => e.id)).toEqual(['vaincre', 'liberer', 'retour']);
    expect(r.sujets.find((s) => s.pnj === 'lise')!.sujet).toMatchObject({ id: 'lise-la-captive-liberation', effets: [{ flag: 'lise-la-captive-liberee' }] });
  });

  it('le donneur reçoit deux sujets : l\'offre (quête proposée) et le rendu (étape de retour active, drapeau « rendue »)', () => {
    const r = genererQuete(fiches()[0]!, nu, SRD);
    const sujets = r.sujets.filter((s) => s.pnj === 'hector').map((s) => s.sujet);
    expect(sujets.map((s) => s.id)).toEqual(['les-bandits-offre', 'les-bandits-rendu']);
    expect(sujets[0]).toMatchObject({ effets: [{ quete: { id: 'q-les-bandits', statut: 'proposee' } }], unique: true, mots: ['bandits', 'taniere'] });
    expect(sujets[1]).toMatchObject({ effets: [{ flag: 'les-bandits-rendue' }] });
    expect(JSON.stringify(sujets[1]!.condition)).toContain('"retour"');
  });

  it('un `lieu` d\'étape n\'est posé que si la fiche le demande (`reperes`)', () => {
    const q = genererQuete({ ...fiches()[0]!, reperes: { vaincre: 'tanniere' } }, nu, SRD).quete!;
    expect(q.etapes[0]).toMatchObject({ id: 'vaincre', lieu: 'tanniere' });
    expect(q.etapes[1]!).not.toHaveProperty('lieu');
  });

  it('sans texte écrit, produit « À écrire : … » et le dit ; la quête produite est une quête valide du schéma', () => {
    const f = FicheQuete.parse({ id: 'q-nu', nom: 'Les bandits sans texte', but: 'tuer', donneur: 'hector', niveau: { min: 1, max: 1 }, resume: 'Des bandits.', cible: { rencontre: 'r-bandits' }, resolution: ['combat'], butin: { annonce: 'Un merci.' } });
    const r = genererQuete(f, nu, SRD);
    expect(r.quete!.etapes[0]!.texte).toMatch(/^À écrire/);
    expect(r.sujets[0]!.sujet.reponse).toMatch(/^À écrire/);
    expect(r.textesAEcrire).toEqual(['etape vaincre', 'etape retour', 'sujet offre', 'sujet rendu']);
    expect(r.avis.join('\n')).toContain('4 texte(s) à écrire');
  });

  it('le modèle de fiche du skill creer-intrigue est une fiche valide', () => {
    const modele = JSON.parse(readFileSync(join(import.meta.dirname, '../../../.claude/skills/creer-intrigue/assets/fiche-quete.exemple.json'), 'utf8'));
    const { fiches, erreurs } = lireFiches(modele);
    expect(erreurs).toEqual([]);
    expect(fiches.map((f) => f.but)).toEqual(['tuer', 'apporter']);
  });

  it('refuse une fiche mal formée : annonce absente, champ inconnu, verbe inconnu, but sans sa cible', () => {
    const ok = { id: 'q-x', nom: 'X', but: 'tuer', donneur: 'hector', niveau: { min: 1, max: 1 }, resume: 'r', cible: { rencontre: 'r-bandits' }, resolution: ['combat'], butin: { annonce: 'a' } };
    expect(lireFiches(ok).erreurs).toEqual([]);
    expect(lireFiches({ ...ok, butin: { xp: 10 } }).erreurs.join(' ')).toContain('butin.annonce');
    expect(lireFiches({ ...ok, extra: 1 }).erreurs.join(' ')).toContain('extra');
    expect(lireFiches({ ...ok, resolution: ['voler'] }).erreurs.join(' ')).toContain('resolution');
    expect(lireFiches([ok, ok]).fiches).toHaveLength(2);
    const sansCible = genererQuete(FicheQuete.parse({ ...ok, cible: {} }));
    expect(sansCible.erreurs.join(' ')).toContain('cible.rencontre');
    expect(sansCible.quete).toBeUndefined();
  });

  it('refuse ce que le monde ne connaît pas : donneur, rencontre, objet, quête déjà existante', () => {
    const f = fiches()[0]!;
    expect(genererQuete({ ...f, donneur: 'personne' }, nu, SRD).erreurs.join(' ')).toContain('donneur « personne »');
    expect(genererQuete({ ...f, cible: { fourni: false, rencontre: 'r-inconnue' } }, nu, SRD).erreurs.join(' ')).toContain('r-inconnue');
    expect(genererQuete({ ...fiches()[1]!, cible: { fourni: false, objet: 'pas-un-objet' } }, nu, SRD).erreurs.join(' ')).toContain('pas-un-objet');
    const { dm } = hameauAvecQuetes();
    expect(genererQuete(f, dm, SRD).erreurs.join(' ')).toContain('existe déjà');
  });

  it('un lieu de quête qui n\'est pas celui du donneur est signalé (la quête se confie où est son donneur)', () => {
    const r = genererQuete({ ...fiches()[0]!, lieu: 'tanniere' }, nu, SRD);
    expect(r.quete!.lieu).toBe('tanniere');
    expect(r.avis.join(' ')).toContain('une quête se confie où se trouve son donneur');
  });
});

// --- Les verbes de résolution : ce que le monde permet --------------------------------------------------------------------------------------

describe('les verbes de résolution et l\'adversaire qui parle', () => {
  let nu: DonneesMonde;
  beforeAll(() => {
    nu = ecrire(hameau());
  });
  const avis = (x: Record<string, unknown>, base = 0) => genererQuete({ ...fiches()[base]!, ...x } as Fiche, nu, SRD).avis.join('\n');

  it('les fiches du hameau sont conformes : aucun avis', () => {
    for (const f of fiches()) expect(genererQuete(f, nu, SRD).avis, f.id).toEqual([]);
  });

  it('tuer un adversaire qui parle sans alternative : avis ; avec une alternative de parole, plus d\'avis', () => {
    expect(avis({ cible: { fourni: false, rencontre: 'r-rats' }, resolution: ['combat'] })).not.toContain('parlent');
    const sansSortie = ecrire({ ...hameau(), rencontres: [rencontre('r-bandits', 'tanniere', [{ profil: 'combattant-gobelin', nombre: 2 }]), rencontre('r-geoliers', 'cave', [{ profil: 'bandit', nombre: 1 }]), rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }])] });
    const r = genererQuete({ ...fiches()[0]!, resolution: ['combat'] }, sansSortie, SRD);
    expect(r.avis.join('\n')).toContain('parlent (combattant-gobelin)');
    expect(r.avis.join('\n')).toContain('aucune alternative de parole');
  });

  it('une négociation annoncée contre un adversaire qui ne parle pas : avis', () => {
    const rats = { cible: { fourni: false, rencontre: 'r-rats' }, resolution: ['combat', 'negocier'] };
    expect(avis(rats)).toContain('ne parlent pas');
    expect(avis({ ...rats, resolution: ['combat'] })).toBe('');
  });

  it('« négocier » annoncé alors que la rencontre n\'offre aucune négociation : avis ; une négociation offerte et non annoncée : avis', () => {
    const sans = ecrire({ ...hameau(), rencontres: [rencontre('r-bandits', 'tanniere', [{ profil: 'combattant-gobelin', nombre: 2 }], [{ id: 'fuir', nom: 'Fuir', jet: { competence: 'discretion', dd: 10 }, resume: 'Vous filez.', effets: [] }]), rencontre('r-geoliers', 'cave', [{ profil: 'rat', nombre: 1 }]), rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }])] });
    expect(genererQuete(fiches()[0]!, sans, SRD).avis.join('\n')).toContain('aucune alternative de négociation');
    expect(avis({ resolution: ['combat'] })).toContain('ajoutez « negocier »');
  });

  it('les créatures qui comprennent sans parler sont une zone grise : aucun avis, ni pour tuer sans sortie, ni pour négocier', () => {
    const golems = ecrire({ ...hameau(), rencontres: [rencontre('r-bandits', 'tanniere', [{ profil: 'golem-de-fer', nombre: 1 }], [{ id: 'ordonner', nom: 'Ordonner', jet: { competence: 'persuasion', dd: 15 }, resume: 'Il obéit.', effets: [] }]), rencontre('r-geoliers', 'cave', [{ profil: 'golem-de-fer', nombre: 1 }]), rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }])] });
    expect(genererQuete({ ...fiches()[0]!, resolution: ['combat', 'negocier'] }, golems, SRD).avis).toEqual([]);
    expect(genererQuete({ ...fiches()[0]!, cible: { fourni: false, rencontre: 'r-geoliers' }, resolution: ['combat'] }, golems, SRD).avis).toEqual([]);
  });

  it('crocheter, fouiller : le contenant de l\'objet doit être verrouillé, caché', () => {
    expect(avis({ resolution: ['fouille'] }, 1)).toContain('aucun contenant de « sceau-du-chef » n\'est caché');
    expect(avis({ resolution: ['desamorcage'] }, 1)).toContain('n\'est piégé');
    expect(avis({ resolution: ['crochetage'] }, 2)).toContain('n\'est verrouillé');
    expect(avis({ resolution: ['discussion'] }, 1)).toContain('aucun sujet de PNJ ne donne');
    expect(avis({ resolution: ['enigme'] }, 1)).toContain('aucune énigme');
  });

  it('un objet qu\'aucun trésor ni PNJ ne porte est signalé', () => {
    const sans = ecrire({ ...hameau(), tresors: [] });
    expect(genererQuete(fiches()[1]!, sans, SRD).avis.join('\n')).toContain('ne se trouve nulle part');
  });
});

// --- Les avis de quêtes ---------------------------------------------------------------------------------------------------------------------

describe('les avis de quêtes (quetes-avis.ts)', () => {
  it('un monde dont les quêtes viennent de fiches conformes ne produit aucun avis, aucune erreur', () => {
    const { dm } = hameauAvecQuetes();
    expect(validerMonde(dm, SRD).erreurs).toEqual([]);
    expect(avisQuetes(dm, SRD)).toEqual([]);
  });

  it('rencontresExigees : un `ou` n\'exige que ce que toutes ses branches exigent', () => {
    expect(rencontresExigees({ rencontre: { id: 'a' } })).toEqual(['a']);
    expect(rencontresExigees({ et: [{ rencontre: { id: 'a' } }, { flag: 'x' }, { rencontre: { id: 'b' } }] })).toEqual(['a', 'b']);
    expect(rencontresExigees({ ou: [{ rencontre: { id: 'a' } }, { flag: 'x' }] })).toEqual([]);
    expect(rencontresExigees({ ou: [{ rencontre: { id: 'a' } }, { et: [{ rencontre: { id: 'a' } }, { flag: 'x' }] }] })).toEqual(['a']);
    expect(rencontresExigees({ non: { rencontre: { id: 'a' } } })).toEqual([]);
  });

  it('une quête qui exige un combat contre des adversaires qui parlent, sans alternative de parole', () => {
    const { quetes, sujets } = hameauAvecQuetes();
    const dm = ecrire({ ...hameau({ quetes, sujets }), rencontres: [rencontre('r-bandits', 'tanniere', [{ profil: 'combattant-gobelin', nombre: 2 }]), rencontre('r-geoliers', 'cave', [{ profil: 'combattant-gobelin', nombre: 1 }], [{ id: 'montrer-la-lettre', nom: 'Montrer la lettre du chef', resume: 'Ils s’écartent.', effets: [] }]), rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }])] });
    const a = avisQuetes(dm, SRD).filter((x) => x.code === 'quete.tue-qui-parle');
    expect(a.map((x) => x.quete)).toEqual(['q-les-bandits']); // « montrer la lettre » est une issue pour la libération des geôliers
    expect(a[0]!.message).toContain('combattant-gobelin');
  });

  it('une alternative de négociation contre des adversaires muets', () => {
    const { quetes, sujets } = hameauAvecQuetes();
    const dm = ecrire({ ...hameau({ quetes, sujets }), rencontres: [rencontre('r-bandits', 'tanniere', [{ profil: 'rat', nombre: 2 }], [{ id: 'marchander-le-passage', nom: 'Marchander le passage', jet: { competence: 'persuasion', dd: 10 }, resume: 'Ils filent.', effets: [] }]), rencontre('r-geoliers', 'cave', [{ profil: 'combattant-gobelin', nombre: 1 }]), rencontre('r-rats', 'grenier', [{ profil: 'rat', nombre: 3 }], [{ id: 'attirer-avec-du-grain', nom: 'Les attirer avec du grain', jet: { competence: 'survie', dd: 10 }, resume: 'Ils suivent le grain.', effets: [] }])] });
    const a = avisQuetes(dm, SRD).filter((x) => x.code === 'rencontre.parole-muette');
    expect(a).toHaveLength(1);
    expect(a[0]!.message).toContain('Rencontre « r-bandits », alternative « marchander-le-passage »');
  });

  it('pas d\'annonce de récompense ; pas de retour au donneur ; étape qui ne peut jamais s\'accomplir ; prérequis qui ne peut jamais être vrai', () => {
    const { quetes, sujets: sujetsBase } = hameauAvecQuetes();
    const q = (i: number) => JSON.parse(JSON.stringify(quetes[i])) as Record<string, any>;
    const sansAnnonce = q(0);
    delete sansAnnonce['recompenses'].annonce;
    const sansRetour = q(1);
    sansRetour['etapes'][1].completion = { objet: 'sceau-du-chef' }; // la dernière étape ne se rend à personne
    const impossible = q(2);
    impossible['etapes'][1].completion = { flag: 'drapeau-que-rien-ne-pose' };
    const prerequis = q(3);
    prerequis['prerequis'] = { flag: 'drapeau-que-rien-ne-pose' };
    const dm = ecrire(hameau({ quetes: [sansAnnonce, sansRetour, impossible, prerequis], sujets: sujetsBase }));
    const par = (code: string) => avisQuetes(dm, SRD).filter((x) => x.code === code).map((x) => x.quete);
    expect(par('quete.sans-annonce')).toEqual(['q-les-bandits']);
    expect(par('quete.sans-retour')).toContain('q-le-sceau');
    expect(par('quete.etape-impossible')).toEqual(['q-le-colis', 'q-lise-la-captive']); // l'étape impossible, puis le prérequis impossible
  });
});

// --- Le profil « épisode » ------------------------------------------------------------------------------------------------------------------

describe('les avis de quêtes dans le profil « épisode » (opt-in)', () => {
  it('un monde qui ne déclare pas `format: episode` ne voit aucun de ces avis dans `valider` ; avec le profil, ils s\'ajoutent', () => {
    const { quetes, sujets } = hameauAvecQuetes();
    const sansAnnonce = JSON.parse(JSON.stringify(quetes)) as Record<string, any>[];
    delete sansAnnonce[0]!['recompenses'].annonce;
    const h = hameau({ quetes: sansAnnonce, sujets });
    const ordinaire = ecrire(h);
    expect(validerMonde(ordinaire, SRD).avertissements.join('\n')).not.toContain('annonce');
    const episode = ecrire({ ...h, monde: { ...h.monde, format: 'episode' } } as Hameau);
    expect(validerMonde(episode, SRD).avertissements.join('\n')).toContain('Quête « q-les-bandits » : pas d\'`annonce`');
    expect(validerMonde(episode, SRD).erreurs).toEqual([]);
    // 4 quêtes : dans la fourchette de 3 à 8, aucun avis sur leur nombre.
    expect(conseilsEpisode(episode, SRD).filter((a) => /^Épisode : \d+ quêtes/.test(a))).toEqual([]);
  });

  it('les avis de quêtes ne sont jamais des erreurs, même sur les jeux d\'essai (P1)', () => {
    for (const dossier of ['dime-des-roseaux', 'marche-d-ombrefiel', 'tombe-des-rois-serpents']) {
      const r = chargerMonde(join(RACINE_MONDES, dossier));
      if (!r.ok) throw new Error(dossier);
      expect(Array.isArray(avisQuetes(r.monde, SRD))).toBe(true);
    }
  });
});

// --- Le parcours automatique prouve chaque quête --------------------------------------------------------------------------------------------

describe('le parcours automatique joue chaque quête de bout en bout', () => {
  it('les quatre quêtes produites par des fiches (tuer, trouver, apporter, libérer) sont terminées par le joueur automatique', () => {
    const { dm } = hameauAvecQuetes();
    const rap = explorerParcours({ dm, srd: SRD }, { quetes: true, budgetEtats: 4000, budgetMs: 90_000 });
    expect(rap.quetes?.nonProuvees).toEqual([]);
    expect(rap.quetes?.prouvees.map((p) => p.fin).sort()).toEqual(['q-le-colis', 'q-le-sceau', 'q-les-bandits', 'q-lise-la-captive']);
    for (const p of rap.quetes!.prouvees) expect(p.etapes.length, p.fin).toBeGreaterThan(2);
  }, 120_000);

  it('une quête qu\'aucun parcours ne peut terminer est dite non prouvée (étape impossible)', () => {
    const { quetes } = hameauAvecQuetes();
    const casse = JSON.parse(JSON.stringify(quetes)) as Record<string, any>[];
    casse[1]!['etapes'][0].completion = { flag: 'drapeau-que-rien-ne-pose' };
    const dm = ecrire(hameau({ quetes: casse, sujets: hameauSujets(quetes) }));
    const rap = explorerParcours({ dm, srd: SRD }, { quetes: true, budgetEtats: 300, budgetMs: 20_000 });
    expect(rap.quetes?.nonProuvees).toEqual(['q-le-sceau']);
    expect(rap.quetes?.prouvees).toHaveLength(3);
  }, 90_000);

  it('sans l\'option `quetes`, le rapport est celui d\'avant (aucun champ `quetes`)', () => {
    const { dm } = hameauAvecQuetes();
    expect(explorerParcours({ dm, srd: SRD }, { budgetEtats: 50, budgetMs: 5_000 })).not.toHaveProperty('quetes');
  });
});

/** Les sujets produits par les fiches, rangés par PNJ (pour reconstruire un hameau à partir de quêtes modifiées). */
function hameauSujets(_quetes: unknown[]): Record<string, unknown[]> {
  const nu = ecrire(hameau());
  const sujets: Record<string, unknown[]> = {};
  for (const fiche of fiches()) for (const s of genererQuete(fiche, nu, SRD).sujets) (sujets[s.pnj] ??= []).push(s.sujet);
  return sujets;
}
