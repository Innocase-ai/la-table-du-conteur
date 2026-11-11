// Correctifs de l'audit de la création (docs/AUDIT-CREATION.md) : la montée de niveau part des choix du joueur (R1, R2), un
// héros resté en arrière rattrape le groupe, un non-lanceur peut lancer le sort de son espèce sans planter le combat (R3).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculerFiche, creationRapide, creerMoteur, exigences, heroDepuisFiche, kitDepuisFiche, MODULES_STANDARD, monterAuNiveau, personnageDepuisFiche, type ChoixPersonnage, type Personnage } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();

/** Tirage pseudo-aléatoire reproductible. */
function hasard(graine: number) {
  let s = graine;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Un héros de niveau 1 dont les compétences de classe sont tirées au hasard (valides), pas celles conseillées. */
function horsConseil(classe: string, historique: string, graine: number): ChoixPersonnage | undefined {
  const c = creationRapide({ classe, espece: 'humain', historique, niveau: 1, nom: 'T' }, srd);
  const ex = exigences(c, srd)!;
  const deja = new Set([...srd.historiques.get(historique)!.competences, ...(c.competencesSupplementaires ?? [])]);
  const r = hasard(graine);
  const dispo = ex.competencesClasse.parmi.filter((k) => !deja.has(k)).sort(() => r() - 0.5);
  const choix: ChoixPersonnage = { ...c, competencesClasse: dispo.slice(0, ex.competencesClasse.nombre), expertises: [] };
  const exp = exigences(choix, srd)!;
  const maitrisees = [...deja, ...choix.competencesClasse];
  for (let i = 0; i < exp.expertises.nombre; i++) {
    const k = maitrisees.find((x) => !choix.expertises!.includes(x) && (i >= exp.expertises.restreintes.length || exp.expertises.restreintes[i]!.includes(x)));
    if (k) choix.expertises!.push(k);
  }
  return calculerFiche(choix, srd).ok ? choix : undefined;
}

describe('R1 : la montée part des compétences du joueur', () => {
  it('de 1 à 20 sans un seul échec, toutes classes, compétences tirées au hasard', () => {
    let essais = 0;
    for (const classe of srd.classes.keys())
      for (const historique of ['acolyte', 'criminel', 'sage', 'soldat'])
        for (let g = 1; g <= 2; g++) {
          let c = horsConseil(classe, historique, g * 31 + historique.length);
          if (!c) continue;
          essais++;
          for (let n = 2; n <= 20; n++) {
            const r = monterAuNiveau(c, n, srd);
            expect(r, `${classe}/${historique}/${g} au niveau ${n}`).toBeDefined();
            c = r!.choix;
          }
        }
    expect(essais).toBeGreaterThan(60);
  });
});

describe('R2 : la montée part des améliorations du joueur', () => {
  it('une amélioration revue au niveau 4 (+2 Dex, puis +2 Cha au 8) ne fait jamais dépasser 20 ensuite', () => {
    for (const classe of srd.classes.keys()) {
      let c = monterAuNiveau(creationRapide({ classe, espece: 'humain', niveau: 3, nom: 'T' }, srd), 4, srd)!.choix;
      c = { ...c, ameliorations: [{ dex: 2 }] };
      if (!calculerFiche(c, srd).ok) continue;
      for (let n = 5; n <= 20; n++) {
        const r = monterAuNiveau(c, n, srd);
        expect(r, `${classe} au niveau ${n}`).toBeDefined();
        c = r!.choix;
        if (n === 8) c = { ...c, ameliorations: [...c.ameliorations!.slice(0, 1), { cha: 2 }] };
        if (n === 8 && !calculerFiche(c, srd).ok) break;
      }
    }
  });
});

describe('un héros resté en arrière rattrape le groupe', () => {
  const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
  if (!r.ok) throw new Error('monde illisible');
  const dm = r.monde;
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const heros = (classe: string, niveau: number, nom: string): Personnage => {
    const choix = creationRapide({ classe, espece: 'humain', niveau, nom }, srd);
    const f = calculerFiche(choix, srd);
    if (!f.ok) throw new Error(f.erreurs.join('\n'));
    return personnageDepuisFiche(f.fiche, { id: nom.toLowerCase(), choix });
  };

  it('à la prochaine occasion, il monte, et les autres ne se voient pas redemander leurs choix', () => {
    const groupe = [heros('magicien', 2, 'Ilse'), heros('barbare', 1, 'Brok')];
    let p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 2 }), { type: 'commencer' }).partie;
    // Le groupe est déjà au niveau 2 (300 PX), Brok est resté au niveau 1.
    p = { ...p, etat: { ...p.etat, niveauGroupe: 2, xp: Math.max(p.etat.xp, 300) }, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
    expect(p.groupe[1]!.choix!.niveau).toBe(1);
    const apres = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 2 }).partie;
    expect(apres.groupe[1]!.choix!.niveau).toBe(2);
    expect(apres.groupe[0]!.monteeEnAttente).toBeUndefined();
    expect(apres.etat.niveauGroupe).toBe(2);
  });
});

describe('R3 : sort d’espèce d’un non-lanceur', () => {
  it('un Guerrier tieffelin a une incantation (meilleure de Int, Sag, Cha) pour ses sorts d’espèce, sans emplacement', () => {
    const choix = creationRapide({ classe: 'guerrier', espece: 'tieffelin', niveau: 1, nom: 'Vex' }, srd);
    const f = calculerFiche(choix, srd);
    if (!f.ok) throw new Error(f.erreurs.join('\n'));
    expect(f.fiche.incantation).toBeUndefined();
    const kit = kitDepuisFiche(f.fiche);
    expect(kit.sorts?.length).toBeGreaterThan(0);
    const c = heroDepuisFiche(f.fiche, kit, srd, { x: 0, y: 0 });
    const mods = (['int', 'sag', 'cha'] as const).map((k) => f.fiche.caracteristiques[k].modificateur);
    expect(c.incantation).toMatchObject({ dd: 8 + f.fiche.bonusMaitrise + Math.max(...mods), bonusAttaque: f.fiche.bonusMaitrise + Math.max(...mods), emplacements: [] });
  });

  it('un Guerrier humain sans sort n’a pas d’incantation', () => {
    const f = calculerFiche(creationRapide({ classe: 'guerrier', espece: 'humain', niveau: 1, nom: 'Bo' }, srd), srd);
    if (!f.ok) throw new Error();
    if (!f.fiche.sortsAccordes.length && !kitDepuisFiche(f.fiche).sorts?.length) expect(heroDepuisFiche(f.fiche, kitDepuisFiche(f.fiche), srd, { x: 0, y: 0 }).incantation).toBeUndefined();
  });
});
