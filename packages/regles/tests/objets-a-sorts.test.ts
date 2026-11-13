// Les objets à sorts et à charges (lot 2, 13/11/2026) : parchemins de sorts précis, baguettes et bâtons à charges. Données, confier / rendre
// (charges gardées, harmonisation), cartes de combat (sort joué sans emplacement, au DD de l'objet), recharge à l'aube.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat } from '../src/combat/moteur';
import { embarquerDepuis, PREFIXE_CHARGES, PREFIXE_OBJET } from '../src/combat/objets';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { SORTS_JOUABLES_EN_COMBAT } from '../src/combat/sorts';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const ctx = { sorts: srd.sorts };
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const depart = (graine = 5): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau: 3 }), { type: 'commencer' }).partie;
};
const embarque = (id: string) => embarquerDepuis(srd.objets.get(id)!.nom, srd.objets.get(id)!.usage, (s) => srd.sorts.get(s)?.niveau ?? 1);

const parchemins = [...srd.objets.values()].filter((o) => o.usage?.sorts?.length && o.categorie === 'parchemin');
const baguettes = [...srd.objets.values()].filter((o) => o.usage?.sorts?.length && o.usage.charges);

describe('les données', () => {
  it('21 parchemins de sorts précis et 6 objets à charges lancent des sorts', () => {
    expect(parchemins).toHaveLength(21);
    expect(baguettes.map((o) => o.id).sort()).toEqual(['baguette-d-eclairs', 'baguette-de-boules-de-feu', 'baguette-de-projectiles-magiques', 'baguette-des-entraves', 'baton-de-feu', 'baton-de-guerison']);
  });

  it('chaque sort d’objet existe, se joue en combat, et ne coûte pas plus de charges que l’objet n’en a ; un parchemin se détruit à l’usage', () => {
    for (const o of [...parchemins, ...baguettes]) {
      for (const s of o.usage!.sorts) {
        expect(srd.sorts.has(s.sort), `${o.id} : ${s.sort}`).toBe(true);
        expect(SORTS_JOUABLES_EN_COMBAT.has(s.sort), `${o.id} : ${s.sort} se joue en combat`).toBe(true);
        if (o.usage!.charges) expect(s.charges ?? 1).toBeLessThanOrEqual(o.usage!.charges.max);
      }
      if (o.categorie === 'parchemin') expect(o.usage!.type).toBe('consommable');
      else expect(o.usage!.type).toBe('charges');
    }
  });
});

describe('en combat', () => {
  const fiche = (nom: string) => {
    const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
    const f = calculerFiche(h.choix, srd);
    if (!f.ok) throw new Error(f.erreurs.join());
    return f.fiche;
  };
  const arene = grilleDepuisTexte(Array.from({ length: 6 }, () => '................'));
  /** Bran (guerrier : aucun sort à lui) porte l'objet ; un allié blessé à côté, un gobelin en face. */
  function combat(id: string, charges?: number, ennemi = { x: 5, y: 1 }): EtatCombat {
    const bran: Combattant = heroDepuisFiche(fiche('Bran'), { armes: [{ id: 'epee-longue' }] }, srd, { x: 1, y: 1 });
    bran.objetsEmbarques = { [id]: embarque(id) };
    bran.ressources[PREFIXE_OBJET + id] = 1;
    const o = srd.objets.get(id)!;
    if (o.usage!.charges) bran.ressources[PREFIXE_CHARGES + id] = charges ?? o.usage!.charges.max;
    const grukk = heroDepuisFiche(fiche('Grukk'), { armes: [{ id: 'hache-d-armes' }] }, srd, { x: 2, y: 1 });
    grukk.pv = grukk.pvMax - 4;
    const gob = monstreDepuisProfil(srd.monstres.get('combattant-gobelin')!, 'gob', ennemi);
    gob.type = 'Humanoïde';
    const etat = creerCombat(arene, [bran, grukk, gob].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
    return etat;
  }
  const cartes = (etat: EtatCombat) => cartesDisponibles(etat, ctx, 'bran').filter((k) => k.id.startsWith('base:objet-'));

  it('chaque parchemin se lit sans emplacement, détruit le parchemin, et le héros retrouve son incantation intacte', () => {
    for (const o of parchemins) {
      const etat = combat(o.id, undefined, { x: 1, y: 2 });
      const bran = combattant(etat, 'bran');
      const avant = bran.incantation;
      const [k] = cartes(etat);
      expect(k, o.id).toBeDefined();
      expect(k!.jouable, `${o.id} : ${k!.raison}`).toBe(true);
      const cibles = k!.ciblage === 'ennemi' ? ['gob'] : k!.ciblage === 'allie' ? ['grukk'] : [];
      const point = k!.ciblage === 'point' ? combattant(etat, 'gob').position : undefined;
      const res = executer(etat, ctx, { type: 'jouer', carte: k!.id, cibles, point });
      expect(res, `${o.id} : ${JSON.stringify(res)}`).toEqual({ ok: true });
      expect(bran.ressources[PREFIXE_OBJET + o.id], `${o.id} détruit`).toBe(0);
      expect(bran.incantation).toBe(avant);
    }
  });

  it('la baguette de boules de feu : trois niveaux, 1 à 3 charges, au DD de la baguette ; plus assez de charges, la carte est refusée', () => {
    const etat = combat('baguette-de-boules-de-feu');
    const bran = combattant(etat, 'bran');
    expect(cartes(etat).map((k) => [k.id, k.nom])).toEqual([
      ['base:objet-baguette-de-boules-de-feu~boule-de-feu~3', 'Baguette de boules de feu : Boule de feu'],
      ['base:objet-baguette-de-boules-de-feu~boule-de-feu~4', 'Baguette de boules de feu : Boule de feu (niveau 4)'],
      ['base:objet-baguette-de-boules-de-feu~boule-de-feu~5', 'Baguette de boules de feu : Boule de feu (niveau 5)'],
    ]);
    const k3 = cartes(etat)[0]!;
    expect(k3.stats?.sauvegarde).toEqual({ caracteristique: 'dex', dd: 15 });
    expect(executer(etat, ctx, { type: 'jouer', carte: k3.id, point: combattant(etat, 'gob').position }).ok).toBe(true);
    expect(bran.ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']).toBe(6);
    expect(bran.ressources[PREFIXE_OBJET + 'baguette-de-boules-de-feu']).toBe(1);
    expect(etat.journal.some((e) => /Boule de feu/.test(e.texte))).toBe(true);
    const pauvre = combat('baguette-de-boules-de-feu', 2);
    expect(cartes(pauvre).map((k) => k.jouable)).toEqual([true, true, false]);
    expect(cartes(pauvre)[2]!.raison).toBe('Plus assez de charges.');
    expect(combattant(combat('baguette-de-boules-de-feu', 0), 'bran').ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']).toBe(0);
    expect(cartes(combat('baguette-de-boules-de-feu', 0)).every((k) => !k.jouable)).toBe(true);
  });

  it('le bâton de guérison soigne un allié à son niveau, sans modificateur d’incantation', () => {
    const etat = combat('baton-de-guerison');
    const grukk = combattant(etat, 'grukk');
    const avant = grukk.pv;
    const k = cartes(etat).find((x) => x.id.endsWith('~soins~1'))!;
    expect(k.cibles).toContain('grukk');
    expect(executer(etat, ctx, { type: 'jouer', carte: k.id, cibles: ['grukk'] }).ok).toBe(true);
    expect(grukk.pv).toBeGreaterThan(avant);
    expect(combattant(etat, 'bran').ressources[PREFIXE_CHARGES + 'baton-de-guerison']).toBe(9);
  });

  it('un héros sans formation à l’armure ou en rage ne lit pas de parchemin', () => {
    const etat = combat('parchemin-de-sort-projectile-magique');
    combattant(etat, 'bran').rage = true;
    expect(cartes(etat)[0]).toMatchObject({ jouable: false, raison: 'Impossible en rage.' });
  });
});

describe('dans le sac et chez les héros', () => {
  it('on ne lit pas un parchemin ni on ne lève une baguette hors combat : il faut le confier', () => {
    const p = depart();
    p.etat.inventaire = { 'parchemin-de-sort-soins': 1, 'baguette-de-boules-de-feu': 1 };
    for (const objet of ['parchemin-de-sort-soins', 'baguette-de-boules-de-feu']) expect(moteur.executer(p, { type: 'utiliserObjet', objet }).refus, objet).toMatch(/se sert en combat/);
  });

  it('confier une baguette lui donne toutes ses charges ; en la rendant, les charges restantes restent avec elle', () => {
    let p = depart();
    const id = p.groupe[0]!.id;
    p.etat.inventaire = { 'baguette-de-boules-de-feu': 1 };
    p = moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).partie;
    const h = () => p.groupe[0]!;
    expect(h().ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']).toBe(7);
    expect(h().embarques!['baguette-de-boules-de-feu']!.sorts).toHaveLength(3);
    // Deux charges dépensées au combat : elle revient dans le sac avec 5.
    h().ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu'] = 5;
    // L'objet porté montre ses charges.
    const porte = moteur.encarts(p).find((e) => e.id === 'sac-objets')!.grille!.elements.find((e) => e.id === `porte:${id}:baguette-de-boules-de-feu`)!;
    expect(porte.proprietes!.find((x) => x.libelle === 'Charges')!.valeur).toMatch(/^5 \/ 7/);
    p = moteur.executer(p, { type: 'rendreObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).partie;
    expect(h().ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']).toBeUndefined();
    const sac = moteur.encarts(p).find((e) => e.id === 'sac-objets')!.grille!.elements.find((e) => e.id === 'baguette-de-boules-de-feu')!;
    expect(sac.proprietes!.find((x) => x.libelle === 'Charges')!.valeur).toMatch(/^5 \/ 7/);
    p = moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).partie;
    expect(h().ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']).toBe(5);
  });

  it('une même baguette ne se confie pas deux fois au même héros', () => {
    let p = depart();
    const id = p.groupe[0]!.id;
    p.etat.inventaire = { 'baguette-de-boules-de-feu': 2 };
    p = moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).partie;
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).refus).toMatch(/porte déjà/);
  });

  it('trois objets harmonisés au plus, ceux qu’on emporte comptent comme ceux qu’on porte', () => {
    let p = depart();
    const id = p.groupe[0]!.id;
    p.etat.inventaire = { 'baguette-de-boules-de-feu': 1, 'baguette-d-eclairs': 1, 'baton-de-feu': 1, 'baguette-des-entraves': 1, 'baguette-de-projectiles-magiques': 1 };
    for (const objet of ['baguette-de-boules-de-feu', 'baguette-d-eclairs', 'baton-de-feu']) p = moteur.executer(p, { type: 'confierObjet', objet, personnage: id }).partie;
    expect(Object.keys(p.groupe[0]!.embarques!)).toHaveLength(3);
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'baguette-des-entraves', personnage: id }).refus).toMatch(/harmonisé à 3/);
    // La baguette de projectiles magiques n'a pas besoin d'harmonisation.
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-projectiles-magiques', personnage: id }).refus).toBeUndefined();
  });

  it('à l’aube, les charges reviennent (dés + bonus de l’objet), sans dépasser le maximum, au sac comme chez les héros ; une baguette qui ne se recharge pas reste vide', () => {
    const sur = [...r.monde.lieux.values()].find((l) => l.repos === 'sur')!;
    for (let graine = 1; graine < 40; graine++) {
      let p = depart(graine);
      const id = p.groupe[0]!.id;
      p.etat.inventaire = { 'baguette-de-boules-de-feu': 1, 'baton-de-feu': 1 };
      p = moteur.executer(p, { type: 'confierObjet', objet: 'baguette-de-boules-de-feu', personnage: id }).partie;
      p.groupe[0]!.ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu'] = 0;
      (p.modules['inventaire'] as { charges?: Record<string, number> }).charges = { 'baton-de-feu': 0 };
      p = { ...p, scene: { type: 'exploration' }, etat: { ...p.etat, lieu: sur.id } };
      const jour = p.etat.jour;
      const res = moteur.executer(p, { type: 'seReposer', duree: 'long' });
      if (res.partie.etat.jour === jour) continue; // une rencontre a interrompu la nuit : on essaie une autre graine
      const q = res.partie;
      const boules = q.groupe[0]!.ressources[PREFIXE_CHARGES + 'baguette-de-boules-de-feu']!;
      const baton = (q.modules['inventaire'] as { charges: Record<string, number> }).charges['baton-de-feu']!;
      expect(boules).toBeGreaterThanOrEqual(2); // 1d6 + 1
      expect(boules).toBeLessThanOrEqual(7);
      expect(baton).toBeGreaterThanOrEqual(5); // 1d6 + 4
      expect(baton).toBeLessThanOrEqual(10);
      return;
    }
    throw new Error('aucune nuit complète en 40 essais');
  });
});
