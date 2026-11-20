// F2 (20/11/2026) : le gabarit de lieu de départ et le contrôle de densité (`monde/gabarit-depart.ts`, docs/GABARIT-LIEU-DE-DEPART.md).
// Un village d'essai CONFORME (le futur épisode pilote devra lui ressembler) ne produit aucun avis ; un village incomplet en produit ; un monde
// qui ne déclare pas `depart.gabarit` n'est jamais contrôlé (P2) ; rien n'est jamais une erreur (P1) ; les trois histoires livrées restent inchangées.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { verifierCompletude, type EntreesCompletude } from '../src/monde/completude';
import { conseilsEpisode } from '../src/monde/episode';
import { avisGabarit, COUCHES, EMPLACEMENTS, emplacementsDuDepart, GABARIT_DEPART, indexDesCouches } from '../src/monde/gabarit-depart';
import type { DonneesMonde } from '../src/monde/schemas';
import { validerMonde } from '../src/monde/validation';

const SRD = chargerDonneesSrd();

// --- Le village d'essai --------------------------------------------------------------------------------------------------------------

const lieu = (id: string, nom: string, type: string, parent?: string, extra: Record<string, unknown> = {}) => ({
  id, nom, type, ...(parent ? { parent } : {}), resume: `${nom}.`, description: `${nom}, pour le MJ.`, visuel: `${nom}, vu de face.`, ...extra,
});
const pnj = (id: string, nom: string, lieuId: string, extra: Record<string, unknown> = {}) => ({
  id, nom, espece: 'humain', sexe: 'N', role: 'Villageois', lieu: lieuId, apparence: `${nom}, en tablier.`,
  personnalite: { traits: ['calme', 'curieux'], voix: 'douce', desir: 'la paix' }, salutations: { neutre: 'Bonjour.' }, ...extra,
});
const tresor = (id: string, lieuId: string, contenant: string, extra: Record<string, unknown> = {}) => ({
  id, nom: id, lieu: lieuId, contenant, description: `Un ${contenant}.`, contenu: { pieces: { po: 5 } }, ...extra,
});

/** Un village qui suit le gabarit : 10 pièces, taverne de 2 pièces avec une chambre, sanctuaire et soigneuse, maison du chef de 2 pièces, un marchand, 4 bâtiments. */
function village() {
  return {
    monde: {
      id: 'village-essai', version: 1, nom: 'Village d’essai', resume: 'Un village.', accroche: 'Un village.', ton: ['simple'], niveaux: { min: 1, max: 2 },
      depart: { lieu: 'place', intro: 'Vous arrivez sur la place.', gabarit: {} }, direction: { style: 'peinture', palette: ['vert', 'gris'] },
      chapitres: [{ id: 'ch1', nom: 'Chapitre 1', niveaux: { min: 1, max: 2 }, resume: 'Tout.', lieux: ['place'] }],
    },
    lieux: [
      lieu('place', 'La place', 'village'),
      lieu('taverne', 'La taverne du Héron', 'batiment', 'place', { services: ['repas', 'chambre'], repos: 'sur' }),
      lieu('taverne-cave', 'La cave de la taverne', 'salle', 'taverne', { rencontres: [{ id: 'r-rats', declencheur: 'entree' }] }),
      lieu('sanctuaire', 'Le sanctuaire', 'batiment', 'place'),
      lieu('maison-du-chef', 'La maison du chef', 'batiment', 'place'),
      lieu('chef-cabinet', 'Le cabinet du chef', 'salle', 'maison-du-chef'),
      lieu('forge', 'La forge', 'batiment', 'place'),
      lieu('moulin', 'Le moulin', 'batiment', 'place'),
      lieu('grenier', 'Le grenier', 'batiment', 'place'),
      lieu('echoppe', 'L’échoppe', 'batiment', 'place'),
    ],
    pnj: [
      pnj('ysolde', 'Ysolde la crieuse', 'place'),
      pnj('gaspard', 'Gaspard le tavernier', 'taverne', { services: [{ id: 'chambre-commune', nom: 'Une chambre', resume: 'Une nuit.', prix: 2, type: 'nuit' }] }),
      pnj('lucie', 'Lucie la soigneuse', 'sanctuaire', { services: [{ id: 'benediction-de-soins', nom: 'Soins', resume: 'Remise sur pied.', prix: 5, type: 'soins' }] }),
      pnj('hector', 'Hector le chef', 'maison-du-chef'),
      pnj('brun', 'Brun le forgeron', 'forge', { boutique: { stock: [{ objet: 'dague', quantite: 2 }], rachat: 0.5 } }),
      pnj('meunier', 'Le meunier', 'moulin'),
      pnj('colporteuse', 'La colporteuse', 'echoppe'),
    ],
    tresors: [
      tresor('t-puits', 'place', 'cache', { acces: { cache: { dd: 12 } } }),
      tresor('t-tonneau', 'taverne-cave', 'coffre', { acces: { verrou: { dd: 12 } } }),
      tresor('t-secretaire', 'chef-cabinet', 'coffre', { acces: { verrou: { dd: 13 } } }),
      tresor('t-armoire', 'maison-du-chef', 'etagere'),
      tresor('t-sac-de-farine', 'moulin', 'sol'),
      tresor('t-coffre-du-grenier', 'grenier', 'coffre', { acces: { piege: 'p-grenier' } }),
      tresor('t-etagere', 'echoppe', 'etagere'),
    ],
    pieges: [{ id: 'p-grenier', nom: 'Aiguille', lieu: 'grenier', resume: 'Une aiguille.', detection: { dd: 12 }, desarmement: { dd: 12 }, declenchement: 'Une piqûre.' }],
    rencontres: [{ id: 'r-rats', nom: 'Rats', type: 'combat', lieu: 'taverne-cave', difficulte: 'faible', intro: 'Des rats.', monstres: [{ profil: 'rat', nombre: 3 }] }],
  };
}
type Village = ReturnType<typeof village>;

/** Écrit le village dans un dossier temporaire et le charge comme `pnpm monde` le fait. */
function ecrire(v: Village): DonneesMonde {
  const dossier = mkdtempSync(join(tmpdir(), 'gabarit-depart-'));
  writeFileSync(join(dossier, 'monde.json'), JSON.stringify(v.monde));
  for (const nom of ['lieux', 'pnj', 'tresors', 'pieges', 'rencontres'] as const) {
    mkdirSync(join(dossier, nom));
    writeFileSync(join(dossier, nom, `${nom}.json`), JSON.stringify(v[nom]));
  }
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
  return r.monde;
}

const entrees = (dm: DonneesMonde): EntreesCompletude => ({
  dm, manifeste: { lieux: {}, pnj: {}, monstres: {}, objets: {}, cartes: {} }, imagesCommunes: new Set(), idImageCommune: (id) => id, scenes: [], voix: new Set(), estimationPresente: false,
});
const densite = (dm: DonneesMonde) => avisGabarit(dm).filter((a) => a.categorie === 'densite');
/** Une copie du village sans un PNJ, un trésor… (retrait par id). */
const sans = (v: Village, groupe: 'pnj' | 'tresors' | 'lieux', ...ids: string[]): Village => ({ ...v, [groupe]: v[groupe].filter((x: { id: string }) => !ids.includes(x.id)) } as Village);

// --- Le gabarit ----------------------------------------------------------------------------------------------------------------------

describe('le gabarit (gabarit-depart.json)', () => {
  it('liste les six emplacements du PRD et les six couches', () => {
    expect(EMPLACEMENTS).toEqual(['batiments', 'taverne', 'chambre', 'sanctuaire', 'maison-du-chef', 'marchand']);
    expect(COUCHES).toEqual(['pnj', 'contenant', 'obstacle', 'adversaire', 'service', 'objet']);
    expect(GABARIT_DEPART.couches).toMatchObject({ min: 2, max: 4 });
  });

  it('chaque emplacement et chaque couche est décrit dans le fichier de référence des auteurs', () => {
    const doc = readFileSync(join(import.meta.dirname, '../../../docs/GABARIT-LIEU-DE-DEPART.md'), 'utf8');
    for (const id of [...EMPLACEMENTS, ...COUCHES]) expect(doc, id).toContain(`\`${id}\``);
    expect(doc).toContain('depart.gabarit');
  });
});

// --- Un village conforme : aucun avis ------------------------------------------------------------------------------------------------

describe('un village qui suit le gabarit', () => {
  let dm: DonneesMonde;
  beforeAll(() => {
    dm = ecrire(village());
  });

  it('est un monde valide, sans erreur', () => {
    expect(validerMonde(dm, SRD).erreurs).toEqual([]);
  });

  it('ne produit aucun avis de densité ni de gabarit', () => {
    expect(avisGabarit(dm)).toEqual([]);
  });

  it('ne produit aucun écart dans `pnpm monde manque` pour ces rubriques', () => {
    const ecarts = verifierCompletude(entrees(dm)).filter((e) => e.categorie === 'densite' || e.categorie === 'gabarit');
    expect(ecarts).toEqual([]);
  });

  it('reconnaît chaque emplacement, sans déclaration de l’auteur', () => {
    const { lieux, declaresInvalides } = emplacementsDuDepart(dm);
    expect(declaresInvalides).toEqual([]);
    expect(lieux.get('taverne')).toEqual(['taverne']);
    expect(lieux.get('sanctuaire')).toEqual(['sanctuaire']);
    expect(lieux.get('maison-du-chef')).toEqual(['maison-du-chef']);
    expect(lieux.get('marchand')).toEqual(['forge']);
    expect([...(lieux.get('batiments') ?? [])].sort()).toEqual(['echoppe', 'forge', 'grenier', 'moulin']);
  });

  it('range chaque pièce dans 2 à 4 couches, pas dans toutes', () => {
    const index = indexDesCouches(dm);
    const nombres = [...dm.lieux.keys()].map((id) => index.get(id)?.size ?? 0);
    expect(Math.min(...nombres)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...nombres)).toBeLessThanOrEqual(4);
    expect([...index.get('taverne-cave')!].sort()).toEqual(['adversaire', 'contenant', 'obstacle']);
    expect([...index.get('moulin')!].sort()).toEqual(['objet', 'pnj']);
  });

  it('avec le profil « épisode » aussi (10 pièces) : le validateur ne répète pas l’avis grossier « pièces vides »', () => {
    const v = village();
    (v.monde as Record<string, unknown>)['format'] = 'episode';
    const avis = conseilsEpisode(ecrire(v), SRD).filter((a) => a.includes('pièces'));
    expect(avis).toEqual([]);
  });
});

// --- Un village incomplet : des avis -------------------------------------------------------------------------------------------------

describe('un village incomplet', () => {
  it('une pièce vide est signalée, avec les couches qui manquent', () => {
    const v = village();
    v.lieux.push(lieu('lavoir', 'Le lavoir', 'lieu-dit', 'place'));
    const a = densite(ecrire(v));
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ cible: 'lavoir' });
    expect(a[0]!.detail).toContain('est vide');
  });

  it('une pièce à une seule couche est signalée comme pauvre', () => {
    const a = densite(ecrire(sans(village(), 'tresors', 't-etagere')));
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ cible: 'echoppe' });
    expect(a[0]!.detail).toContain("n'a qu'une couche (un PNJ)");
  });

  it('un monde dont le lieu de départ n’existe pas ne plante pas : un seul avis', () => {
    const v = village();
    v.monde.depart.lieu = 'nulle-part';
    const a = avisGabarit(ecrire(v));
    expect(a).toEqual([expect.objectContaining({ categorie: 'gabarit', cible: 'nulle-part' })]);
  });

  it('un emplacement qui manque est signalé : sanctuaire, soigneuse, maison du chef, marchand, chambre', () => {
    const cible = (v: Village) => avisGabarit(ecrire(v)).filter((a) => a.categorie === 'gabarit');
    // Sans la soigneuse, le sanctuaire n'est plus reconnu comme tel par ses services, mais par son nom : il reste, sans soigneur.
    expect(cible(sans(village(), 'pnj', 'lucie')).map((a) => a.detail).join('\n')).toContain('n\'a pas de soigneur');
    // Sans le sanctuaire du tout (lieu, PNJ et trésors rattachés retirés), l'emplacement manque.
    const sansSanctuaire = sans(sans(village(), 'pnj', 'lucie'), 'lieux', 'sanctuaire');
    expect(cible(sansSanctuaire).some((a) => a.cible === 'sanctuaire' && a.detail.includes('aucun sanctuaire trouvé'))).toBe(true);
    // Sans le chef, la maison est signalée sans PNJ.
    expect(cible(sans(village(), 'pnj', 'hector')).some((a) => a.cible === 'maison-du-chef' && a.detail.includes("n'a aucun PNJ"))).toBe(true);
    // Sans forgeron, plus de marchand.
    expect(cible(sans(village(), 'pnj', 'brun')).some((a) => a.cible === 'marchand')).toBe(true);
    // Sans le service de nuit du tavernier, ni la mention « chambre » du lieu : pas de chambre.
    const v = village();
    (v.pnj.find((p) => p.id === 'gaspard') as Record<string, unknown>)['services'] = [];
    (v.lieux.find((l) => l.id === 'taverne') as Record<string, unknown>)['services'] = ['repas'];
    expect(cible(v).some((a) => a.cible === 'chambre')).toBe(true);
  });

  it('une taverne ou une maison du chef d’une seule pièce, un village de trop peu de pièces, trop peu de bâtiments', () => {
    const v = sans(sans(village(), 'lieux', 'taverne-cave', 'chef-cabinet'), 'tresors', 't-tonneau', 't-secretaire');
    const detail = avisGabarit(ecrire(v)).map((a) => a.detail).join('\n');
    expect(detail).toContain('Taverne « taverne » : 1 pièce (visé : 2 à 3)');
    expect(detail).toContain('Maison du chef « maison-du-chef » : 1 pièce (visé : 2 à 3)');
    expect(detail).toContain('le lieu de départ compte 8 pièces (visé : 10 à 13');
    const sansBatiments = avisGabarit(ecrire(sans(sans(village(), 'lieux', 'grenier', 'echoppe'), 'tresors', 't-coffre-du-grenier', 't-etagere'))).map((a) => a.detail).join('\n');
    expect(sansBatiments).toContain('2 bâtiments d\'une pièce reconnus');
  });

  it('une pièce chargée de toutes les couches n’est jamais signalée (le maximum est un conseil, pas une règle)', () => {
    const v = village();
    v.pnj.push(pnj('rat-de-cave', 'Un fermier', 'taverne-cave', { boutique: { stock: [], rachat: 0 } }));
    v.tresors.push(tresor('t-sol-cave', 'taverne-cave', 'sol'));
    const dm = ecrire(v);
    expect(indexDesCouches(dm).get('taverne-cave')!.size).toBe(6);
    expect(avisGabarit(dm)).toEqual([]);
  });
});

// --- L'opt-in (P1, P2) ---------------------------------------------------------------------------------------------------------------

describe('opt-in par les données', () => {
  it('sans `depart.gabarit`, rien n’est contrôlé, même un village vide', () => {
    const v = village();
    delete (v.monde.depart as Record<string, unknown>)['gabarit'];
    v.lieux.push(lieu('lavoir', 'Le lavoir', 'lieu-dit', 'place'));
    const dm = ecrire(v);
    expect(avisGabarit(dm)).toEqual([]);
    expect(verifierCompletude(entrees(dm)).filter((e) => e.categorie === 'densite' || e.categorie === 'gabarit')).toEqual([]);
    // … sauf si l'on force le contrôle, pour auditer un monde existant : la pièce vide apparaît.
    expect(avisGabarit(dm, { forcer: true }).some((a) => a.cible === 'lavoir')).toBe(true);
  });

  it('les avis de gabarit ne sont jamais des « manque » (code de sortie 0) ni des erreurs de validation', () => {
    const v = village();
    v.lieux.push(lieu('lavoir', 'Le lavoir', 'lieu-dit', 'place'));
    const dm = ecrire(sans(v, 'pnj', 'lucie', 'hector'));
    const ecarts = verifierCompletude(entrees(dm)).filter((e) => e.categorie === 'densite' || e.categorie === 'gabarit');
    expect(ecarts.length).toBeGreaterThan(0);
    expect(ecarts.every((e) => e.gravite === 'avis')).toBe(true);
    expect(validerMonde(dm, SRD).erreurs).toEqual([]);
  });

  it('l’auteur peut déclarer un emplacement que le contrôle ne reconnaît pas ; un emplacement mal déclaré est un avis', () => {
    const v = village();
    // Le « sanctuaire » est une cabane sans nom évocateur ni service typé : on la déclare.
    v.lieux.find((l) => l.id === 'sanctuaire')!.nom = 'La cabane du fond';
    v.lieux.find((l) => l.id === 'sanctuaire')!.id = 'cabane';
    v.pnj.find((p) => p.id === 'lucie')!.lieu = 'cabane';
    (v.monde.depart as Record<string, unknown>)['gabarit'] = { emplacements: { sanctuaire: 'cabane', taverna: 'taverne', marchand: 'fantome' } };
    const a = avisGabarit(ecrire(v)).map((x) => x.detail).join('\n');
    expect(emplacementsDuDepart(ecrire(v)).lieux.get('sanctuaire')).toEqual(['cabane']);
    expect(a).toContain("« taverna » n'est pas un emplacement du gabarit");
    expect(a).toContain('« marchand » : lieu inconnu fantome');
    expect(a).not.toContain('aucun sanctuaire');
  });

  it('`depart.gabarit` est accepté par le schéma de monde.json et ne change pas ce qu’on lit à l’arrivée', () => {
    const dm = ecrire(village());
    expect(dm.monde.depart.gabarit).toEqual({ emplacements: {} });
    expect(dm.monde.depart.lieu).toBe('place');
  });
});

// --- Les trois histoires livrées : inchangées ----------------------------------------------------------------------------------------

describe('les histoires livrées', () => {
  for (const id of ['tombe-des-rois-serpents', 'marche-d-ombrefiel', 'dime-des-roseaux']) {
    it(`${id} ne déclare pas le gabarit : aucun avis de densité ni de gabarit, aucune modification`, () => {
      const r = chargerMonde(join(RACINE_MONDES, id));
      if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
      expect(r.monde.monde.depart.gabarit).toBeUndefined();
      expect(avisGabarit(r.monde)).toEqual([]);
      expect(verifierCompletude(entrees(r.monde)).filter((e) => e.categorie === 'densite' || e.categorie === 'gabarit')).toEqual([]);
    });
  }

  it('la Dîme des Roseaux, si on forçait le contrôle, aurait des avis (jamais d’erreur) : la halle du conseil et le sanctuaire', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'dime-des-roseaux'));
    if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
    const a = avisGabarit(r.monde, { forcer: true });
    expect(a.some((x) => x.categorie === 'densite' && x.cible === 'mir-halle-du-conseil')).toBe(true);
    expect(a.some((x) => x.cible === 'sanctuaire')).toBe(true);
  });
});
