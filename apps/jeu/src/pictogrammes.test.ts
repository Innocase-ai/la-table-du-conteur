// Les pictogrammes des cartes : chaque carte que peut jouer un héros ou un monstre trouve son dessin, jamais le symbole par
// défaut ; les dessins sont bien formés ; le choix de l'icône (arme, école de magie…) est juste.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, creerCombat, preparerRencontre, RENCONTRES, type CoutCarte } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { DESSIN_DEFAUT, DESSINS, TEINTES } from './pictogrammes';
import { armeDeCarte, cleDeCarte, cleEcole } from './pictogrammes-regles';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const COUTS: CoutCarte[] = ['action', 'bonus', 'reaction', 'gratuit', 'elan'];

describe('les dessins', () => {
  it('chaque dessin a une teinte connue et un corps non vide, aux balises bien fermées et aux classes permises', () => {
    const permises = new Set(['p1', 'p2', 'p3', 't1', 't2', 't3']);
    for (const [cle, d] of Object.entries(DESSINS)) {
      expect(TEINTES[d.teinte], `${cle} : teinte inconnue`).toBeDefined();
      expect(d.corps.length, `${cle} : corps vide`).toBeGreaterThan(20);
      expect((d.corps.match(/<g\b/g) ?? []).length, `${cle} : <g> mal fermés`).toBe((d.corps.match(/<\/g>/g) ?? []).length);
      for (const [, classes] of d.corps.matchAll(/class="([^"]*)"/g)) for (const c of classes!.split(/\s+/)) expect(permises.has(c), `${cle} : classe « ${c} »`).toBe(true);
      expect(d.corps, `${cle} : NaN dans un tracé`).not.toMatch(/NaN|undefined/);
    }
    expect(DESSIN_DEFAUT).toBe(DESSINS['aptitude:defaut']);
  });

  it('les cinq coûts ont leur pictogramme', () => {
    for (const c of COUTS) expect(DESSINS[`cout:${c}`], c).toBeDefined();
  });

  it('les huit écoles de magie ont leur pictogramme de repli', () => {
    for (const e of ['abjuration', 'conjuration', 'divination', 'enchantement', 'evocation', 'illusion', 'necromancie', 'transmutation']) {
      expect(DESSINS[`ecole:${e}`], e).toBeDefined();
    }
  });
});

describe('quelle icône pour quelle carte', () => {
  it('les armes : chaque famille a son dessin, et une arme lancée se reconnaît', () => {
    const cas: Record<string, string> = {
      'epee-longue': 'arme:epee',
      'epee-courte': 'arme:epee-courte',
      rapiere: 'arme:rapiere',
      dague: 'arme:dague',
      hachette: 'arme:hachette',
      'hache-a-deux-mains': 'arme:hache',
      'masse-d-armes': 'arme:masse',
      'baton-de-combat': 'arme:baton',
      javeline: 'arme:javeline',
      'arc-court': 'arme:arc',
      'arc-long': 'arme:arc',
      'arbalete-legere': 'arme:arc',
    };
    for (const [id, attendu] of Object.entries(cas)) expect(armeDeCarte(id).cle, id).toBe(attendu);
    expect(armeDeCarte('dague-lancer')).toEqual({ cle: 'arme:dague', lancer: true });
    expect(armeDeCarte('hachette-lancer')).toEqual({ cle: 'arme:hachette', lancer: true });
    expect(armeDeCarte('javeline-lancer')).toEqual({ cle: 'arme:javeline', lancer: true });
    expect(armeDeCarte('dague').lancer).toBe(false);
  });

  it('un sort a son dessin ; sans lui, celui de son école ; sans école, un signe d’aptitude', () => {
    expect(cleDeCarte({ id: 'sort:soins', categorie: 'sort' }, 'abjuration').cle).toBe('sort:soins');
    expect(cleDeCarte({ id: 'sort:boule-de-feu', categorie: 'sort' }, 'évocation').cle).toBe('ecole:evocation');
    expect(cleDeCarte({ id: 'sort:inconnu', categorie: 'sort' }, 'Nécromancie').cle).toBe('ecole:necromancie');
    expect(cleDeCarte({ id: 'sort:inconnu', categorie: 'sort' }).cle).toBe('aptitude:defaut');
    expect(cleEcole('école inventée')).toBeUndefined();
    // Le SRD français dit « invocation » pour la conjuration.
    expect(cleEcole('invocation')).toBe('ecole:conjuration');
  });

  it('une carte d’élan prend le signe de l’élan', () => {
    expect(cleDeCarte({ id: 'elan:2:coordination', categorie: 'elan' }).cle).toBe('cout:elan');
  });

  it('les sorts jouables en combat (sorts.json) ont chacun un dessin propre ; les autres du SRD tombent sur leur école', () => {
    const jouables = JSON.parse(readFileSync(join(import.meta.dirname, '../../../packages/donnees/srd/sorts/sorts.json'), 'utf8')) as { id: string; ecole: string }[];
    expect(jouables.length).toBeGreaterThanOrEqual(20);
    for (const s of jouables) expect(cleDeCarte({ id: `sort:${s.id}`, categorie: 'sort' }, s.ecole).cle, s.id).toBe(`sort:${s.id}`);
    for (const s of donnees.sorts.values()) expect(cleDeCarte({ id: `sort:${s.id}`, categorie: 'sort' }, s.ecole).cle, s.id).not.toBe('aptitude:defaut');
  });
});

describe('toutes les cartes jouables en combat trouvent un dessin', () => {
  it('héros pré-tirés et monstres de chaque rencontre : aucune ne retombe sur le symbole par défaut', () => {
    const vues = new Map<string, string>();
    for (const rencontre of RENCONTRES) {
      const { grille, combattants } = preparerRencontre(rencontre, donnees);
      const etat = creerCombat(grille, combattants, 1, { elan: true });
      for (const c of etat.combattants)
        for (const k of cartesDisponibles(etat, ctx, c.id)) {
          const { cle } = cleDeCarte(k, k.categorie === 'sort' ? donnees.sorts.get(k.id.slice('sort:'.length))?.ecole : undefined);
          expect(DESSINS[cle], `${k.id} : dessin « ${cle} » inconnu`).toBeDefined();
          vues.set(k.id.replace(/^elan:\d+:/, 'elan:'), cle);
        }
    }
    const defaut = [...vues].filter(([, cle]) => cle === 'aptitude:defaut').map(([id]) => id);
    expect(defaut, `cartes sans dessin : ${defaut.join(', ')}`).toEqual([]);
    expect(vues.size).toBeGreaterThan(30);
  });
});
