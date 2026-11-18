import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';
import { convertirForge, ecrireMondeForge, inventaireAEcrire, messagePourClaude, REGLES_ECRITURE, slug, valeurEnPo } from './importer-forge';

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
    expect(slug('Le Médaillon de la Sœur Endormie')).toBe('le-medaillon-de-la-soeur-endormie');
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

  describe('champs de F1 à F4 (obstacles, niveau, raretés, types de quête)', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const par = (f: Record<string, any>, nom: string) => f['histoire'].assets.find((a: { nom: string }) => a.nom === nom);
    const lire = (dossier: string, chemin: string) => JSON.parse(readFileSync(join(dossier, chemin), 'utf8')) as Record<string, any>[];
    const ecrire = (f: Record<string, unknown>, options: Record<string, unknown> = {}) => {
      const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
      const r = ecrireMondeForge(racine, 'villambrune', FIXTURE, f, MODELES, { profils, armes, ...options });
      return { ...r, charge: chargerMonde(r.dossier) };
    };

    it("verrou, cache et piège du contenant : le trésor porte l'accès, une fiche de piège est créée, le monde reste valide et jouable", () => {
      const f = brut();
      Object.assign(par(f, 'Cercueil profané').props, { verrou: 15, cache: 12, piege: true, piegeDetection: 14, piegeDesarmement: 16, piegeDegats: '2d6 poison' });
      const { dossier, resultat, charge } = ecrire(f);
      const tresor = lire(dossier, 'tresors/forge-tresors.json').find((t) => t['id'] === 'cercueil-profane')!;
      expect(tresor['acces']).toEqual({ verrou: { dd: 15 }, cache: { dd: 12, competence: 'perception' }, piege: 'piege-cercueil-profane' });
      const [piege] = lire(dossier, 'pieges/forge-pieges.json');
      expect(piege).toMatchObject({ id: 'piege-cercueil-profane', lieu: 'ruines-de-la-chapelle-brulee', detection: { dd: 14 }, desarmement: { dd: 16 }, degats: [{ des: '2d6', type: 'poison' }] });
      expect(resultat.avertissements.join('\n')).not.toMatch(/Piège de « Cercueil/);
      expect(charge.ok, JSON.stringify(charge.ok ? [] : charge.erreurs)).toBe(true);
      if (!charge.ok) return;
      expect(validerMonde(charge.monde, SRD).erreurs, 'erreurs').toEqual([]);
      const rap = explorerParcours({ dm: charge.monde, srd: SRD }, { budgetEtats: 6000, budgetMs: 60_000 });
      expect(rap.finsNonAtteintes).toEqual([]);
    }, 90_000);

    it('un piège sans DD ni dégâts lisibles prend 13 par défaut et le dit', () => {
      const f = brut();
      Object.assign(par(f, 'Armoire de Mahaut').props, { piege: true, piegeDegats: 'beaucoup' });
      const a = ecrire(f).resultat.avertissements.join('\n');
      expect(a).toMatch(/Piège de « Armoire de Mahaut ».*13 par défaut/);
      expect(a).toMatch(/dégâts « beaucoup » illisibles/);
    });

    it("rareté de l'objet, niveaux de l'histoire (sauf si l'appel les impose)", () => {
      const f = brut();
      par(f, 'Médaillon de sainte Odile').props.rarete = 'rare';
      f['histoire'].niveaux = { min: 2, max: 4 };
      const a = ecrire(f);
      expect(lire(a.dossier, 'objets/forge-objets.json').find((o) => o['id'] === 'medaillon-de-sainte-odile')!['rarete']).toBe('rare');
      expect(JSON.parse(readFileSync(join(a.dossier, 'monde.json'), 'utf8')).niveaux).toEqual({ min: 2, max: 4 });
      expect(lire(a.dossier, 'quetes/forge-quetes.json')[0]!['niveau']).toEqual({ min: 2, max: 4 });
      const b = ecrire(f, { niveaux: { min: 1, max: 5 } });
      expect(JSON.parse(readFileSync(join(b.dossier, 'monde.json'), 'utf8')).niveaux).toEqual({ min: 1, max: 5 });
      // Des niveaux invalides dans le fichier sont ignorés (1 à 2).
      f['histoire'].niveaux = { min: 9, max: 3 };
      expect(convertirForge(f, 'x', { profils, armes }).monde['niveaux']).toEqual({ min: 1, max: 2 });
    });

    it("un adversaire humanoïde a une alternative « Négocier » ; la quête qui le vise s'accomplit aussi par elle ; un monstre n'en a pas", () => {
      const f = brut();
      const qa = par(f, 'Herbes pour la soupe');
      qa.props.verbe = 'tuer';
      f['histoire'].liens.push({ id: 'zz', from: qa.id, to: par(f, 'Bandit estropié').id, type: 'requiert' });
      const { dossier, charge } = ecrire(f);
      const rencontres = lire(dossier, 'rencontres/forge-rencontres.json');
      expect(rencontres.find((r) => r['id'] === 'r-bandit-estropie')!['alternatives'][0]).toMatchObject({ id: 'negocier', jet: { competence: 'persuasion', dd: 12 } });
      expect(rencontres.find((r) => r['id'] === 'r-goule-des-cryptes')!['alternatives']).toEqual([]);
      const etape = lire(dossier, 'quetes/forge-quetes.json').find((q) => q['id'] === 'herbes-pour-la-soupe')!['etapes'].find((e: { id: string }) => e.id.startsWith('vaincre-'));
      expect(etape.completion).toEqual({ ou: [{ rencontre: { id: 'r-bandit-estropie', issue: 'victoire' } }, { rencontre: { id: 'r-bandit-estropie', issue: 'alternative' } }] });
      expect(charge.ok).toBe(true);
      if (charge.ok) expect(validerMonde(charge.monde, SRD).erreurs, 'erreurs').toEqual([]);
    });

    it("quête « apporter » : étape de remise, sujet du destinataire qui retire l'objet, retour au donneur", () => {
      const f = brut();
      const qa = par(f, 'Herbes pour la soupe');
      qa.props.verbe = 'apporter';
      qa.props.destinataire = par(f, 'Maître Foulques').id;
      const { dossier, charge } = ecrire(f);
      const q = lire(dossier, 'quetes/forge-quetes.json').find((x) => x['id'] === 'herbes-pour-la-soupe')!;
      expect((q['etapes'] as { completion: unknown }[]).map((e) => e.completion)).toEqual([
        { lieu: 'bois-des-chenes-pales' },
        { objet: 'herbes-de-velours' },
        { flag: 'herbes-pour-la-soupe-livre' },
        { flag: 'herbes-pour-la-soupe-rendue' },
      ]);
      const foulques = lire(dossier, 'pnj/forge-pnj.json').find((p) => p['id'] === 'maitre-foulques')!;
      const s = (foulques['sujets'] as Record<string, any>[]).find((x) => x['id'] === 'livraison-herbes-pour-la-soupe')!;
      expect(s['condition']).toEqual({ objet: 'herbes-de-velours' });
      expect(s['effets']).toEqual([{ objet: { id: 'herbes-de-velours', retirer: true } }, { flag: 'herbes-pour-la-soupe-livre' }]);
      expect(charge.ok).toBe(true);
      if (charge.ok) expect(validerMonde(charge.monde, SRD).erreurs, 'erreurs').toEqual([]);
    });

    it('quête « libérer » : aller au captif, le délivrer par un sujet, retour au donneur', () => {
      const f = brut();
      const qa = par(f, 'Herbes pour la soupe');
      qa.props.verbe = 'liberer';
      qa.props.captif = par(f, 'Jorane la ménestrière').id;
      f['histoire'].liens = f['histoire'].liens.filter((l: { from: string; type: string }) => !(l.from === qa.id && l.type === 'requiert'));
      const { dossier, charge } = ecrire(f);
      const q = lire(dossier, 'quetes/forge-quetes.json').find((x) => x['id'] === 'herbes-pour-la-soupe')!;
      expect((q['etapes'] as { completion: unknown }[]).map((e) => e.completion)).toEqual([{ lieu: 'bois-des-chenes-pales' }, { lieu: 'le-sanglier-dore' }, { flag: 'herbes-pour-la-soupe-libere' }, { flag: 'herbes-pour-la-soupe-rendue' }]);
      const jorane = lire(dossier, 'pnj/forge-pnj.json').find((p) => p['id'] === 'jorane-la-menestriere')!;
      expect((jorane['sujets'] as { id: string; effets: unknown }[]).find((x) => x.id === 'delivrer-herbes-pour-la-soupe')!.effets).toEqual([{ flag: 'herbes-pour-la-soupe-libere' }]);
      expect(charge.ok).toBe(true);
      if (charge.ok) expect(validerMonde(charge.monde, SRD).erreurs, 'erreurs').toEqual([]);
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  describe("brief d'écriture pour Claude", () => {
    const creer = () => {
      const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
      return ecrireMondeForge(racine, 'villambrune', FIXTURE, brut(), MODELES, { profils, armes });
    };

    it("écrit BRIEF-ECRITURE.md avec le contexte, les règles, la méthode et l'inventaire des champs, chemin compris", () => {
      const { dossier, resultat } = creer();
      const brief = readFileSync(join(dossier, 'BRIEF-ECRITURE.md'), 'utf8');
      expect(brief).toContain('# Brief d\'écriture : Le Médaillon de la Sœur Endormie');
      expect(brief).toContain('validé par l\'utilisateur');
      expect(brief).toContain('agents Haiku');
      expect(brief).toContain('auditeur-coherence-episode');
      expect(brief).toContain('RAPPORT-FORGE.md');
      for (const r of REGLES_ECRITURE) expect(brief).toContain(r);
      // L'inventaire : une ligne par champ, avec le chemin dans la fiche.
      // L'inventaire part du monde.json tel qu'écrit (direction artistique et ton du squelette compris) et compte aussi les « à définir ».
      const mondeFinal = JSON.parse(readFileSync(join(dossier, 'monde.json'), 'utf8')) as Record<string, unknown>;
      const champs = inventaireAEcrire(resultat.dossiers, mondeFinal);
      expect(champs.length).toBeGreaterThan(resultat.aEcrire);
      expect(brief).toContain(`${champs.length} champ(s)`);
      expect(brief).toMatch(/### monde\.json/);
      expect(brief).toMatch(/`direction\.style` : À écrire/);
      expect(brief).toMatch(/`ton\[0\]` : à définir/);
      expect(brief).toMatch(/`direction\.palette\[1\]` : à définir/);
      // (le village s'appelle comme le monde : la région racine a pris `villambrune`, le village `villambrune-2`)
      expect(brief).toMatch(/- \*\*Villambrune\*\* \(`villambrune-2`, lieux\/forge-lieux\.json\)\n(?: {2}- `[^`]+` : À écrire[^\n]*\n)*? {2}- `visuel` : À écrire/);
      expect(brief).toMatch(/`personnalite\.desir` : À écrire/);
      expect(brief).toMatch(/`alternatives\[0\]\.resume` : À écrire/);
      // Rien d'autre que du « À écrire » ou du « à définir » dans l'inventaire.
      expect(champs.every((c) => c.consigne.startsWith('À écrire') || c.consigne === 'à définir')).toBe(true);
    });

    it("le message pour Claude est une ligne qui pointe vers le brief", () => {
      expect(messagePourClaude('villambrune')).toContain('packages/mondes/villambrune/BRIEF-ECRITURE.md');
      expect(messagePourClaude('villambrune')).not.toContain('\n');
    });

    it("les règles d'écriture du brief et la consigne de l'Export IA de la Forge disent les mêmes longueurs", () => {
      const forge = readFileSync(join(import.meta.dirname, '../../apps/atelier/public/forge/index.html'), 'utf8');
      const reglesTexte = REGLES_ECRITURE.join(' ');
      for (const n of ['130 à 170 mots', '75 à 115 mots', '70 à 110 mots']) {
        expect(reglesTexte, `brief : ${n}`).toContain(n);
        expect(forge, `Forge : ${n}`).toContain(n);
      }
    });
  });

  it("ne pose aucun repère de lieu sur les étapes de quête par défaut (le joueur cherche) ; l'option `reperes` les rétablit", () => {
    const sans = convertirForge(brut(), 'villambrune', { profils, armes });
    const etapes = (r: typeof sans) => (r.dossiers['quetes'] as { etapes: { lieu?: string }[] }[]).flatMap((q) => q.etapes);
    expect(etapes(sans).length).toBeGreaterThan(0);
    expect(etapes(sans).some((e) => 'lieu' in e)).toBe(false);
    const avec = convertirForge(brut(), 'villambrune', { profils, armes, reperes: true });
    expect(etapes(avec).some((e) => typeof e.lieu === 'string')).toBe(true);
  });

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
