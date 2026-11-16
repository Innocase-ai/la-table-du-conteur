import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';
import { convertirForge, ecrireMondeForge, slug, valeurEnPo } from './importer-forge';

const FIXTURE = join(import.meta.dirname, 'fixtures/villambrune.forge.json');
const MODELES = { dossier: join(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: join(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };
const SRD = chargerDonneesSrd();
const profils = [...SRD.monstres.keys()];
const armes = [...SRD.armes.keys()];
const brut = () => JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('import d\'une conception de la Forge', () => {
  it('lit les valeurs et les noms', () => {
    expect(valeurEnPo('8 po')).toBe(8);
    expect(valeurEnPo('15 pa')).toBe(1.5);
    expect(valeurEnPo('—')).toBe(0);
    expect(slug('Sanctuaire de sainte Odile')).toBe('sanctuaire-de-sainte-odile');
    expect(slug('Chaumière de la vieille Mahaut')).toBe('chaumiere-de-la-vieille-mahaut');
  });

  it('convertit l\'histoire d\'exemple : lieux imbriqués, PNJ, trésors, rencontres, quêtes', () => {
    const r = convertirForge(brut(), 'villambrune', { profils, armes });
    const d = r.dossiers;
    const lieu = (id: string) => (d['lieux'] as Record<string, any>[]).find((l) => l['id'] === id)!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(d['lieux']).toHaveLength(8); // racine + village + 4 bâtiments + forêt + ruines
    expect(lieu('villambrune')['type']).toBe('region');
    expect(lieu('villambrune')['parent']).toBeUndefined();
    // Le village est sous la racine ; la taverne, bâtiment du village, loge son tavernier et propose un repos sûr.
    const taverne = lieu('le-sanglier-dore');
    expect(taverne['type']).toBe('batiment');
    expect(taverne['repos']).toBe('sur');
    expect(taverne['services']).toEqual(['auberge', 'repas']);
    // Les chemins du village vers la forêt et les ruines.
    expect(lieu((r.monde['depart'] as { lieu: string }).lieu)['liens']).toHaveLength(2);
    // Le médaillon est dans le cercueil des ruines, gardé par la goule (profil du SRD trouvé par le nom).
    const tresor = (d['tresors'] as Record<string, any>[]).find((t) => t['id'] === 'cercueil-profane')!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(tresor['contenant']).toBe('sarcophage');
    expect(tresor['gardien']).toBe('r-goule-des-cryptes');
    expect(tresor['contenu'].objets).toEqual([{ objet: 'medaillon-de-sainte-odile', quantite: 1 }]);
    const goule = (d['rencontres'] as Record<string, any>[]).find((x) => x['id'] === 'r-goule-des-cryptes')!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(goule['monstres'][0].profil).toBe('goule');
    expect(goule['difficulte']).toBe('moderee');
    // Le sac du bandit contient les 12 po.
    expect((d['tresors'] as Record<string, any>[]).find((t) => t['id'] === 'sac-du-bandit')!['contenu'].pieces).toEqual({ po: 12 }); // eslint-disable-line @typescript-eslint/no-explicit-any
    // Ce que vend le tavernier est en boutique, pas par terre.
    const foulques = (d['pnj'] as Record<string, any>[]).find((p) => p['id'] === 'maitre-foulques')!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(foulques['boutique'].stock).toEqual([{ objet: 'potion-de-soin', quantite: 1, prix: 8 }, { objet: 'epee-de-fer', quantite: 1, prix: 15 }]);
    expect((d['tresors'] as Record<string, any>[]).some((t) => (t['contenu'].objets as { objet: string }[]).some((o) => o.objet === 'potion-de-soin'))).toBe(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    // La quête principale : aller aux ruines, vaincre la goule, trouver le médaillon ; le donneur la propose par un sujet.
    const qp = (d['quetes'] as Record<string, any>[]).find((q) => q['type'] === 'principale')!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((qp['etapes'] as { completion: unknown }[]).map((e) => e.completion)).toEqual([
      { lieu: 'ruines-de-la-chapelle-brulee' },
      { rencontre: { id: 'r-goule-des-cryptes', issue: 'victoire' } },
      { objet: 'medaillon-de-sainte-odile' },
      { flag: 'le-medaillon-vole-rendue' },
    ]);
    expect(qp['donneur']).toBe('sire-bertrand');
    expect(qp['recompenses'].xp).toBe(50);
    expect(qp['recompenses'].pieces).toBe(20);
    const bertrand = (d['pnj'] as Record<string, any>[]).find((p) => p['id'] === 'sire-bertrand')!; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(bertrand['sujets'].map((s: { id: string }) => s.id)).toEqual(['q-le-medaillon-vole', 'rendre-le-medaillon-vole']);
    expect(bertrand['sujets'][0].effets).toEqual([{ quete: { id: 'le-medaillon-vole', statut: 'active' } }]);
    expect(d['fins']).toHaveLength(1);
    expect(r.aEcrire).toBeGreaterThan(0);
  });

  it('écrit un monde brouillon que le moteur charge et que le validateur ne rejette pas sur le format', () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    const { dossier } = ecrireMondeForge(racine, 'villambrune', FIXTURE, brut(), MODELES, { profils, armes });
    for (const f of ['monde.json', 'RAPPORT-FORGE.md', 'conception.forge.json', 'lieux/forge-lieux.json', 'pnj/forge-pnj.json', 'quetes/forge-quetes.json']) expect(existsSync(join(dossier, f))).toBe(true);
    const r = chargerMonde(dossier);
    expect(r.ok, JSON.stringify(r.ok ? [] : r.erreurs)).toBe(true);
    if (!r.ok) return;
    expect(r.monde.monde.statut).toBe('brouillon');
    const bilan = validerMonde(r.monde, SRD);
    // Aucune erreur de référence ou d'accessibilité : tout ce qui manque est du contenu à écrire, pas une cassure.
    expect(bilan.erreurs, bilan.erreurs.join('\n')).toEqual([]);
    const rapport = readFileSync(join(dossier, 'RAPPORT-FORGE.md'), 'utf8');
    expect(rapport).toContain('| P1 | notable | Sire Bertrand |');
  });

  it('donne un monde jouable de bout en bout : le joueur automatique atteint la fin en passant par le gardien du cercueil', () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    const { dossier } = ecrireMondeForge(racine, 'villambrune', FIXTURE, brut(), MODELES, { profils, armes });
    const r = chargerMonde(dossier);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rap = explorerParcours({ dm: r.monde, srd: SRD }, { budgetEtats: 6000, budgetMs: 60_000 });
    expect(rap.finsNonAtteintes).toEqual([]);
    expect(rap.parcours[0]!.etapes.map((e) => e.libelle)).toContain('Parler de « Le médaillon volé »');
    expect(rap.parcours[0]!.etapes.map((e) => e.libelle)).toContain('Rendre compte de « Le médaillon volé »');
  }, 90_000);

  it('refuse un monde existant et une conception sans lieu, sans rien laisser à moitié écrit', () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    ecrireMondeForge(racine, 'villambrune', FIXTURE, brut(), MODELES, { profils, armes });
    expect(() => ecrireMondeForge(racine, 'villambrune', FIXTURE, brut(), MODELES, { profils, armes })).toThrow(/existe déjà/);
    const vide = { version: 1, histoire: { assets: [], liens: [] } };
    expect(() => ecrireMondeForge(racine, 'vide', FIXTURE, vide, MODELES, { profils, armes })).toThrow(/aucun lieu/);
    expect(existsSync(join(racine, 'vide'))).toBe(false);
  });

  it('signale ce qui est deviné ou écarté', () => {
    const f = brut();
    f.histoire.assets.push({ id: 'x1', type: 'monstre', nom: 'Chose informe', x: 0, y: 0, parent: null, props: { danger: 'Mortel' } });
    f.histoire.assets.push({ id: 'x2', type: 'objet_quete', nom: 'Sceau perdu', x: 0, y: 0, parent: null, props: {} });
    const r = convertirForge(f, 'villambrune', { profils, armes });
    const texte = r.avertissements.join('\n');
    expect(texte).toMatch(/Chose informe.*difficulté elevee.*À CHOISIR/);
    expect(texte).toMatch(/Chose informe.*n'est dans aucun lieu/);
    expect(texte).toMatch(/Sceau perdu.*sans emplacement/);
  });
});
