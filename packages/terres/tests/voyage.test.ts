import { describe, expect, it } from 'vitest';
import { CARREFOUR_D_ALDRIC, TABLE_EXEMPLE } from '../src/exemples';
import { coutDeplacement, genererCarte } from '../src/generation';
import { alea } from '../src/rng';
import { FACTEUR_PRES_D_UNE_ANCRE, probabiliteRencontre, tirerRencontre } from '../src/rencontres';
import { chargerVoyage, decoderBits, encoderBits, serialiserVoyage } from '../src/sauvegarde';
import { horlogeDepuisMinutes, minutesDepuisHorloge, moment, formatHeure, luminosite } from '../src/terrain';
import { camper, creerVoyage, deplacer, marcher, planifier } from '../src/voyage';
import type { EvenementTerres } from '../src/types';
import { carteManuelle, CTX, TABLE_TOUT } from './aide';

const types = (ev: EvenementTerres[]) => ev.map((e) => e.type);

describe('marcher', () => {
  const c = carteManuelle(40, 30, (x, y) => (x === 11 ? 'foret' : x === 12 ? 'marais' : x === 13 ? 'colline' : x === 14 ? 'montagne' : x === 15 ? 'eau' : undefined));
  c.blocage[10 * c.largeur + 8] = 1;
  c.route[10 * c.largeur + 9] = 1;

  it('coûte du temps selon le terrain', () => {
    let e = creerVoyage(c, { x: 7, y: 10 }, CTX);
    const m0 = e.minutes;
    e = marcher(e, c, { x: 7, y: 11 }, CTX).etat; // plaine
    expect(e.minutes - m0).toBe(5);
    e = creerVoyage(c, { x: 10, y: 10 }, CTX);
    for (const [vers, cout] of [[{ x: 11, y: 10 }, 10], [{ x: 12, y: 10 }, 15], [{ x: 13, y: 10 }, 10], [{ x: 14, y: 10 }, 20]] as const) {
      const avant = e.minutes;
      const r = marcher(e, c, vers, CTX);
      expect(r.arret).toBe('termine');
      expect(r.etat.minutes - avant).toBe(cout);
      e = r.etat;
    }
  });

  it('une route coûte 3 minutes', () => {
    const e = creerVoyage(c, { x: 10, y: 11 }, CTX);
    const r = marcher(creerVoyage(c, { x: 9, y: 11 }, CTX), c, { x: 9, y: 10 }, CTX);
    expect(r.minutes).toBe(3);
    expect(e.minutes).toBe(r.etat.minutes - 3);
  });

  it('refuse l’eau, un décor, le bord et un saut de plusieurs cases sans bouger', () => {
    const e = creerVoyage(c, { x: 14, y: 12 }, CTX);
    const eau = marcher(e, c, { x: 15, y: 12 }, CTX);
    expect(eau.arret).toBe('bloque');
    expect(eau.evenements).toEqual([{ type: 'bloque', raison: 'eau' }]);
    expect(eau.etat).toBe(e);
    const deco = marcher(creerVoyage(c, { x: 7, y: 10 }, CTX), c, { x: 8, y: 10 }, CTX);
    expect(deco.evenements).toEqual([{ type: 'bloque', raison: 'obstacle' }]);
    const bord = marcher(creerVoyage(c, { x: 0, y: 0 }, CTX), c, { x: -1, y: 0 }, CTX);
    expect(bord.evenements).toEqual([{ type: 'bloque', raison: 'bord' }]);
    const saut = marcher(creerVoyage(c, { x: 3, y: 3 }, CTX), c, { x: 5, y: 3 }, CTX);
    expect(saut.arret).toBe('bloque');
  });

  it('ne modifie jamais l’état reçu', () => {
    const e = creerVoyage(c, { x: 3, y: 3 }, CTX);
    const copie = JSON.stringify([e.x, e.y, e.minutes, [...e.explore]]);
    deplacer(e, c, [{ x: 4, y: 3 }, { x: 5, y: 3 }], CTX, TABLE_TOUT);
    expect(JSON.stringify([e.x, e.y, e.minutes, [...e.explore]])).toBe(copie);
  });

  it('annonce un jour nouveau et chaque moment de la journée', () => {
    const k = carteManuelle(60, 10);
    const e = creerVoyage(k, { x: 0, y: 5 }, CTX, { minutes: 18 * 60 + 55 });
    const chemin = Array.from({ length: 50 }, (_, i) => ({ x: i + 1, y: 5 }));
    const r = deplacer(e, k, chemin, CTX);
    const moments = r.evenements.filter((v) => v.type === 'moment').map((v) => (v as { moment: string }).moment);
    expect(moments).toEqual(['crepuscule', 'nuit']);
    const k2 = carteManuelle(60, 10);
    const e2 = creerVoyage(k2, { x: 0, y: 5 }, CTX, { minutes: 23 * 60 + 50 });
    const r2 = deplacer(e2, k2, chemin, CTX);
    expect(types(r2.evenements)).toContain('jour');
  });
});

describe('déplacer', () => {
  it('s’arrête sur un obstacle inconnu puis replanifie autour', () => {
    const k = carteManuelle(30, 20, (x, y) => (x === 10 && y >= 5 && y <= 15 ? 'eau' : undefined));
    let e = creerVoyage(k, { x: 5, y: 10 }, CTX);
    const but = { x: 15, y: 10 };
    const chemin = planifier(e, k, but)!;
    expect(chemin.length).toBe(10); // le groupe ne voit pas encore l'eau : il suppose la plaine
    const r = deplacer(e, k, chemin, CTX);
    expect(r.arret).toBe('bloque');
    expect(r.evenements.at(-1)).toEqual({ type: 'bloque', raison: 'eau' });
    // Il replanifie à chaque obstacle découvert (les cases qu'il n'a pas vues restent supposées franchissables) et finit par arriver.
    e = r.etat;
    let replans = 0;
    for (; replans < 30; replans++) {
      const suite = planifier(e, k, but)!;
      expect(suite).not.toBeNull();
      const f = deplacer(e, k, suite, CTX);
      e = f.etat;
      if (f.arret === 'termine') break;
      expect(f.arret).toBe('bloque');
    }
    expect(e).toMatchObject(but);
    expect(replans).toBeLessThan(30);
  });

  it('planifier renvoie null pour une case hors carte ; chemin vide si on y est déjà', () => {
    const k = carteManuelle();
    const e = creerVoyage(k, { x: 3, y: 3 }, CTX);
    expect(planifier(e, k, { x: 99, y: 3 })).toBeNull();
    expect(planifier(e, k, { x: 3, y: 3 })).toEqual([]);
  });

  it('maxPas limite la marche et rend le reste', () => {
    const k = carteManuelle();
    const e = creerVoyage(k, { x: 0, y: 5 }, CTX);
    const chemin = [1, 2, 3, 4].map((x) => ({ x, y: 5 }));
    const r = deplacer(e, k, chemin, CTX, [], { maxPas: 2 });
    expect(r.pas).toBe(2);
    expect(r.arret).toBe('limite');
    expect(r.restant).toEqual(chemin.slice(2));
  });

  it('s’arrête sur un point d’intérêt, une seule fois', () => {
    const k = carteManuelle();
    k.pois = [{ id: 'poi-1', type: 'puits', nom: 'Un puits', x: 4, y: 5 }];
    const e = creerVoyage(k, { x: 0, y: 5 }, CTX);
    const chemin = [1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 5 }));
    const r = deplacer(e, k, chemin, CTX);
    expect(r.arret).toBe('poi');
    expect(r.pas).toBe(4);
    expect(r.etat.pois['poi-1']).toBe('visite');
    expect(r.evenements.at(-1)).toMatchObject({ type: 'poi', poi: { id: 'poi-1' } });
    const retour = deplacer(r.etat, k, [{ x: 3, y: 5 }, { x: 4, y: 5 }], CTX);
    expect(retour.arret).toBe('termine');
    expect(types(retour.evenements)).not.toContain('poi');
  });

  it('arrive sur une ancre : arrêt « ancre » ; la traverser en chemin ne s’arrête pas', () => {
    const k = carteManuelle();
    k.ancres = [{ id: 'a', nom: 'Auberge', x: 3, y: 5 }];
    const e = creerVoyage(k, { x: 0, y: 5 }, CTX);
    const trav = deplacer(e, k, [1, 2, 3, 4, 5].map((x) => ({ x, y: 5 })), CTX);
    expect(trav.arret).toBe('termine');
    expect(types(trav.evenements)).toContain('ancre');
    const arrive = deplacer(e, k, [1, 2, 3].map((x) => ({ x, y: 5 })), CTX);
    expect(arrive.arret).toBe('ancre');
    expect(arrive.etat.ancresVues).toContain('a');
  });

  it('signale un repère une seule fois, avec sa direction', () => {
    const k = carteManuelle(60, 30);
    k.pois = [{ id: 'tour', type: 'tour-de-guet', nom: 'Une tour', x: 30, y: 10, repere: { rayon: 14, nuit: false } }];
    const e = creerVoyage(k, { x: 10, y: 10 }, CTX);
    const r = deplacer(e, k, Array.from({ length: 12 }, (_, i) => ({ x: 11 + i, y: 10 })), CTX);
    const reperes = r.evenements.filter((v) => v.type === 'repere');
    expect(reperes).toHaveLength(1);
    expect(reperes[0]).toMatchObject({ cible: { genre: 'poi', id: 'tour' }, direction: 'à l’est' });
    expect(r.etat.pois['tour']).toBe('vu');
    expect(r.etat.explore[10 * k.largeur + 30]).toBe(1);
  });
});

describe('rencontres en chemin', () => {
  const fortDanger = (() => {
    const k = carteManuelle(60, 10);
    k.danger = 10;
    return k;
  })();
  const chemin = Array.from({ length: 50 }, (_, i) => ({ x: i + 1, y: 5 }));

  it('stoppent la marche et rendent le reste du chemin', () => {
    let vu = 0;
    for (let g = 1; g <= 25; g++) {
      const e = creerVoyage(fortDanger, { x: 0, y: 5 }, CTX, { graine: g });
      const r = deplacer(e, fortDanger, chemin, CTX, TABLE_TOUT);
      if (r.arret !== 'rencontre') continue;
      vu++;
      expect(r.restant.length).toBe(chemin.length - r.pas);
      const ev = r.evenements.at(-1)!;
      expect(ev).toMatchObject({ type: 'rencontre', rencontre: { entree: { id: 'tout' }, x: r.etat.x, y: r.etat.y, terrain: 'plaine', surRoute: false } });
      expect(r.pas % 6).toBe(r.pas === 0 ? 0 : r.pas % 6); // jamais avant 30 minutes de marche
      expect(r.minutes).toBeGreaterThanOrEqual(30);
    }
    expect(vu).toBeGreaterThan(15);
  });

  it('sont identiques pour le même état, et après une sauvegarde rechargée', () => {
    const e = creerVoyage(fortDanger, { x: 0, y: 5 }, CTX, { graine: 9 });
    const a = deplacer(e, fortDanger, chemin, CTX, TABLE_TOUT);
    const b = deplacer(e, fortDanger, chemin, CTX, TABLE_TOUT);
    expect(JSON.stringify(a.evenements)).toBe(JSON.stringify(b.evenements));
    const recharge = chargerVoyage(serialiserVoyage(a.etat), fortDanger);
    const suite1 = deplacer(a.etat, fortDanger, a.restant, CTX, TABLE_TOUT);
    const suite2 = deplacer(recharge, fortDanger, a.restant, CTX, TABLE_TOUT);
    expect(JSON.stringify(suite2.evenements)).toBe(JSON.stringify(suite1.evenements));
    expect(suite2.etat.tirages).toBe(suite1.etat.tirages);
  });

  it('suivent la probabilité annoncée (3000 tirages)', () => {
    const k = carteManuelle(60, 10);
    const base = creerVoyage(k, { x: 30, y: 5 }, CTX, { graine: 5 });
    const q = probabiliteRencontre(k, base);
    let rencontres = 0;
    let e = base;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      const t = tirerRencontre(e, k, e, TABLE_TOUT, CTX);
      e = t.etat;
      if (t.resultat.genre === 'rencontre') rencontres++;
    }
    expect(Math.abs(rencontres / N - q)).toBeLessThan(0.03);
  });

  it('sont plus rares sur la route, près d’une ancre et de jour ; plus fréquentes la nuit et en forêt', () => {
    const k = carteManuelle(60, 10, (x) => (x >= 40 ? 'foret' : undefined));
    k.route[5 * k.largeur + 10] = 1;
    k.ancres = [{ id: 'a', nom: 'A', x: 25, y: 5 }];
    const e = (x: number, minutes: number) => ({ x, y: 5, minutes });
    const jour = 12 * 60;
    const plaine = probabiliteRencontre(k, e(33, jour));
    expect(probabiliteRencontre(k, e(10, jour))).toBeLessThan(plaine);
    expect(probabiliteRencontre(k, e(26, jour))).toBeCloseTo(plaine * FACTEUR_PRES_D_UNE_ANCRE, 5);
    expect(probabiliteRencontre(k, e(33, 23 * 60))).toBeGreaterThan(plaine);
    expect(probabiliteRencontre(k, e(45, jour))).toBeGreaterThan(plaine);
    expect(probabiliteRencontre(k, e(33, jour), { facteurRencontre: 0.5 })).toBeCloseTo(plaine / 2, 5);
    expect(probabiliteRencontre(k, e(33, jour))).toBeLessThanOrEqual(0.85);
  });

  it('choisissent selon le terrain, le moment et le niveau', () => {
    const k = carteManuelle(60, 10, (x) => (x >= 30 ? 'foret' : undefined));
    k.route[5 * k.largeur + 5] = 1;
    const table = [
      { id: 'loups', poids: 1, terrains: ['foret' as const], genre: 'combat' },
      { id: 'colporteur', poids: 1, terrains: ['route' as const], genre: 'social' },
      { id: 'spectres', poids: 1, moments: ['nuit' as const], genre: 'combat' },
      { id: 'ogre', poids: 1, niveauMin: 5, genre: 'combat' },
    ];
    const ids = (x: number, minutes: number, niveau = 3) => {
      const out = new Set<string>();
      for (let g = 0; g < 200; g++) {
        const e = { ...creerVoyage(k, { x, y: 5 }, { ...CTX, niveauGroupe: niveau }, { graine: g, minutes }), tirages: 0 };
        const c = { ...e, minutesDepuisTirage: 0 };
        const kk = { ...k, danger: 50 };
        const t = tirerRencontre(c, kk, c, table, { ...CTX, niveauGroupe: niveau });
        if (t.resultat.genre === 'rencontre') out.add(t.resultat.entree.id);
      }
      return [...out].sort();
    };
    expect(ids(40, 12 * 60)).toEqual(['loups']);
    expect(ids(5, 12 * 60)).toEqual(['colporteur']);
    expect(ids(20, 23 * 60)).toEqual(['spectres']);
    expect(ids(20, 12 * 60, 6)).toEqual(['ogre']);
  });

  it('ne tirent rien quand aucune ligne ne convient', () => {
    const k = carteManuelle(60, 10);
    k.danger = 50;
    const e = creerVoyage(k, { x: 30, y: 5 }, CTX);
    const t = tirerRencontre(e, k, e, [{ id: 'x', poids: 1, terrains: ['marais'], genre: 'combat' }], CTX);
    expect(t.resultat.genre).not.toBe('rencontre');
    expect(t.etat.tirages).toBe(e.tirages + 3);
  });

  it('une table de la démo ne plante jamais sur la vraie carte, sur 30 graines', () => {
    for (let g = 1; g <= 30; g++) {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine: g });
      let e = creerVoyage(c, c.ancres[0]!.id, CTX, { graine: g });
      for (const a of c.ancres.slice(1)) {
        const ch = planifier(e, c, a)!;
        expect(ch).not.toBeNull();
        let reste = ch;
        for (let garde = 0; garde < 400 && reste.length; garde++) {
          const r = deplacer(e, c, reste, CTX, TABLE_EXEMPLE);
          e = r.etat;
          reste = r.arret === 'bloque' ? (planifier(e, c, a) ?? []) : r.restant;
          if (r.arret === 'ancre') break;
        }
        expect(e.x === a.x && e.y === a.y, `graine ${g}, vers ${a.id}`).toBe(true);
        e = creerVoyage(c, c.ancres[0]!.id, CTX, { graine: g + 1000 });
      }
    }
  });
});

describe('camper', () => {
  it('fait passer le temps et annonce la nuit', () => {
    const k = carteManuelle();
    const e = creerVoyage(k, { x: 5, y: 5 }, CTX, { minutes: 18 * 60 });
    const r = camper(e, k, 12 * 60, CTX, []);
    expect(r.minutes).toBe(12 * 60);
    expect(r.etat.minutes).toBe(30 * 60);
    expect(r.arret).toBe('termine');
    expect(types(r.evenements)).toContain('jour');
    expect(r.evenements.filter((v) => v.type === 'moment').map((v) => (v as { moment: string }).moment)).toEqual(['crepuscule', 'nuit', 'aube']);
  });

  it('une rencontre interrompt le repos : seul le temps écoulé compte', () => {
    const k = carteManuelle();
    k.danger = 50;
    let interrompu = 0;
    for (let g = 1; g <= 20; g++) {
      const e = creerVoyage(k, { x: 5, y: 5 }, CTX, { minutes: 22 * 60, graine: g });
      const r = camper(e, k, 8 * 60, CTX, TABLE_TOUT);
      if (r.arret === 'rencontre') {
        interrompu++;
        expect(r.minutes).toBeLessThan(8 * 60);
        expect(r.etat.minutes).toBe(e.minutes + r.minutes);
      }
    }
    expect(interrompu).toBeGreaterThan(10);
  });
});

describe('temps et sauvegarde', () => {
  it('lit l’horloge du moteur de jeu et la lui rend', () => {
    expect(minutesDepuisHorloge(1, 8)).toBe(480);
    expect(minutesDepuisHorloge(3, 14.5)).toBe(2 * 1440 + 870);
    expect(horlogeDepuisMinutes(2 * 1440 + 870)).toEqual({ jour: 3, heure: 14.5 });
    expect(formatHeure(870)).toBe('14h30');
    expect(moment(6 * 60)).toBe('aube');
    expect(moment(20 * 60)).toBe('crepuscule');
    expect(luminosite(12 * 60)).toBe(1);
    expect(luminosite(2 * 60)).toBe(0);
  });

  it('les bits aller-retour sont exacts', () => {
    for (const taille of [1, 7, 8, 9, 100, 9600]) {
      const g = new Uint8Array(taille);
      for (let i = 0; i < taille; i++) g[i] = alea(3, i) < 0.4 ? 1 : 0;
      expect([...decoderBits(encoderBits(g), taille)]).toEqual([...g]);
    }
  });

  it('une sauvegarde se relit à l’identique et tient en peu de place', () => {
    const c = genererCarte(CARREFOUR_D_ALDRIC);
    let e = creerVoyage(c, c.ancres[0]!.id, CTX);
    const ch = planifier(e, c, c.ancres[1]!)!;
    e = deplacer(e, c, ch, CTX, TABLE_EXEMPLE).etat;
    const json = serialiserVoyage(e);
    const relu = chargerVoyage(json, c);
    expect([...relu.explore]).toEqual([...e.explore]);
    expect({ ...relu, explore: null }).toEqual({ ...e, explore: null });
    expect(json.length).toBeLessThan(5000);
  });

  it('refuse une sauvegarde d’une autre carte, d’une autre version ou abîmée', () => {
    const c = genererCarte(CARREFOUR_D_ALDRIC);
    const e = creerVoyage(c, c.ancres[0]!.id, CTX);
    const json = serialiserVoyage(e);
    expect(() => chargerVoyage(json, { ...c, id: 'autre' })).toThrow(/autre/);
    expect(() => chargerVoyage(json, { ...c, graine: 5 })).toThrow(/graine/);
    expect(() => chargerVoyage(json, { ...c, versionGenerateur: 99 })).toThrow(/autre version/);
    expect(() => chargerVoyage('pas du json', c)).toThrow(/pas du JSON/);
    expect(() => chargerVoyage(JSON.stringify({ ...JSON.parse(json), version: 7 }), c)).toThrow(/version 7/);
    expect(() => chargerVoyage(JSON.stringify({ ...JSON.parse(json), x: 9999 }), c)).toThrow(/hors de la carte/);
    expect(() => chargerVoyage(JSON.stringify({ ...JSON.parse(json), explore: 'AAAA' }), c)).toThrow(/illisibles/);
    expect(() => chargerVoyage(JSON.stringify({ ...JSON.parse(json), explore: '!!!!' + 'A'.repeat(100) }), { ...c })).toThrow();
  });

  it('refuse un groupe sauvegardé dans l’eau', () => {
    const c = genererCarte(CARREFOUR_D_ALDRIC);
    const e = creerVoyage(c, c.ancres[0]!.id, CTX);
    const i = c.tuiles.findIndex((t) => t === 'eau');
    const j = JSON.parse(serialiserVoyage(e)) as Record<string, unknown>;
    j.x = i % c.largeur;
    j.y = Math.floor(i / c.largeur);
    expect(() => chargerVoyage(JSON.stringify(j), c)).toThrow(/dans l’eau/);
  });

  it('coût de déplacement : l’eau et les décors sont infranchissables', () => {
    const c = genererCarte(CARREFOUR_D_ALDRIC);
    const cout = coutDeplacement(c);
    expect(Number.isFinite(cout(c.ancres[0]!.y * c.largeur + c.ancres[0]!.x))).toBe(true);
    const eau = c.tuiles.findIndex((t) => t === 'eau');
    expect(cout(eau)).toBe(Infinity);
    const bloc = c.blocage.findIndex((v) => v === 1);
    expect(cout(bloc)).toBe(Infinity);
  });
});
