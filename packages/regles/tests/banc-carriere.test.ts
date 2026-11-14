// Banc d'essai des « actions de situation » (lot 0, 14/11/2026) : trois gestes écrits pour la Carrière d'Argile Rouge, joués avec le
// moteur tel qu'il est, sans aucun code nouveau (événements à choix à bouton, effets `temps`, `jauge`, `objet`, paliers de jauge).
// Le monde d'essai `carriere-essai` est une copie réduite de la Carrière de La Marche d'Ombrefiel : le canon n'est pas touché.
// Étude du moteur : actions-etude-moteur.md (notes des sessions). Les « limites du lot 0 » ci-dessous sont des tests : ils disent ce
// que le moteur actuel ne sait pas encore faire (jauge cachée, retombée horaire, rejouable, molosse retiré).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, validerMonde, type FicheEvenement, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import type { Interlocuteur } from '../src/modules';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'carriere-essai'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const GRADINS = 'ald-carriere-gradins-d-argile';
const MARE = 'ald-carriere-fond-de-fosse-et-mare';
const PORTILLON = 'ald-carriere-portillon-du-reduit';
const HUTTES = 'ald-carriere-huttes-et-poste-de-commandement';
const RENCONTRE = 'ald-r-demi-dent-et-sa-bande';
const CAMP = 'camp-carriere';

type Origine = { espece: string; classe: string };
const GUERRIERS: Origine[] = [0, 1, 2, 3].map(() => ({ espece: 'humain', classe: 'guerrier' }));

/** Le groupe conseillé de la Marche (4 héros), au niveau 1, à `lieu`, avec les origines données. */
function depart(lieu = GRADINS, origines: Origine[] = GUERRIERS, graine = 11): Partie {
  const g = groupeConseille(1, srd, 4).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const p = moteur.executer(moteur.nouvellePartie(g, { graine, niveau: 1 }), { type: 'commencer' }).partie;
  p.etat.heros = p.groupe.map((_, i) => ({ historique: 'sage', ...(origines[i] ?? GUERRIERS[0]!) }));
  p.etat.lieu = lieu;
  return p;
}

const fiche = (p: Partie) => moteur.vue<FicheEvenement | undefined>('evenementEnCours', p);
const ouvrir = (p: Partie, evenement: string) => moteur.executer(p, { type: 'ouvrirEvenement', evenement });
const choisir = (p: Partie, evenement: string, choix: string) => moteur.executer(p, { type: 'choisirEvenement', evenement, choix });
/** Les actions proposées en bouton dans le panneau Ici. */
const boutons = (p: Partie): string[] => moteur.propositions(p).flatMap((x) => (x.ordre?.type === 'ouvrirEvenement' ? [String(x.ordre.evenement)] : []));

/**
 * Joue une approche en cherchant une graine qui donne le résultat voulu du jet (`reussite`) : les dés viennent de la partie, donc le test
 * reste déterministe. Renvoie la partie après le choix (l'écran du résultat est ouvert).
 */
function tenter(base: Partie, evenement: string, choix: string, reussite?: boolean): Partie {
  for (let graine = 1; graine <= 400; graine++) {
    const p = structuredClone(base);
    p.graine = graine;
    const o = ouvrir(p, evenement);
    expect(o.refus).toBeUndefined();
    const res = choisir(o.partie, evenement, choix);
    expect(res.refus).toBeUndefined();
    const issue = fiche(res.partie)?.resultat?.reussite;
    if (reussite === undefined || issue === reussite) return res.partie;
  }
  throw new Error(`Aucune graine ne donne ${reussite ? 'une réussite' : 'un échec'} pour ${evenement}/${choix}.`);
}

describe('banc d’essai de la Carrière : le monde d’essai', () => {
  it('se charge, se valide sans erreur, et les trois actions sont des événements à bouton', () => {
    expect(validerMonde(dm, srd).erreurs).toEqual([]);
    for (const m of MODULES_STANDARD) expect(m.valider?.({ dm, srd }) ?? []).toEqual([]);
    const evts = (dm.extensions?.['evenements-choix'] ?? []) as { id: string; ouverture: string; choix: unknown[] }[];
    expect(evts.map((e) => e.id).sort()).toEqual(['ecouter-la-hutte-du-chef', 'fouiller-les-carcasses', 'guetter-depuis-le-rebord']);
    expect(evts.every((e) => e.ouverture === 'bouton' && e.choix.length >= 3)).toBe(true);
  });

  it('chaque action n’apparaît qu’à son lieu, et la hutte disparaît quand Demi-Dent est vaincu', () => {
    expect(boutons(depart(GRADINS))).toEqual(['guetter-depuis-le-rebord']);
    expect(boutons(depart(MARE))).toEqual(['fouiller-les-carcasses']);
    expect(boutons(depart(PORTILLON))).toEqual(['ecouter-la-hutte-du-chef']);
    const vaincu = depart(PORTILLON);
    vaincu.etat.flags['z1-demi-dent-vaincu'] = true;
    expect(boutons(vaincu)).toEqual([]);
    expect(ouvrir(vaincu, 'ecouter-la-hutte-du-chef').refus).toMatch(/rien de tel/);
  });
});

describe('banc d’essai : « Guetter » depuis le rebord', () => {
  it('le jet réussi donne le fait sans alerter ; un jet raté le donne aussi mais le camp se méfie ; dans les deux cas une heure passe', () => {
    const base = depart(GRADINS);
    const bon = tenter(base, 'guetter-depuis-le-rebord', 'plat-ventre', true);
    expect(bon.etat.faits).toContain('f-ald-carriere-fosses-reperees');
    expect(bon.etat.jauges[CAMP]).toBe(0);
    expect(bon.etat.heure).toBe(9);
    const rate = tenter(base, 'guetter-depuis-le-rebord', 'plat-ventre', false);
    expect(rate.etat.faits).toContain('f-ald-carriere-fosses-reperees');
    expect(rate.etat.jauges[CAMP]).toBe(1);
    expect(rate.etat.heure).toBe(9);
    expect(fiche(rate)?.resultat?.texte).toMatch(/pierre roule/);
  });

  it('« Descendre sans attendre » : aucun jet, aucun temps, mais le camp s’en aperçoit un peu ; le choix se retrouve dans la mémoire du jeu', () => {
    const p = tenter(depart(GRADINS), 'guetter-depuis-le-rebord', 'descendre');
    expect(fiche(p)?.resultat?.jets).toEqual([]);
    expect(p.etat.jauges[CAMP]).toBe(1);
    expect(p.etat.heure).toBe(8);
    expect(p.etat.faits).not.toContain('f-ald-carriere-fosses-reperees');
    expect(p.etat.flags['evt-guetter-depuis-le-rebord']).toBe(true);
    expect(p.etat.flags['evt-guetter-depuis-le-rebord-descendre']).toBe(true);
  });

  it('l’approche du rôdeur n’existe que si le groupe compte un rôdeur ; son échec met le camp sur ses gardes (palier 2)', () => {
    const sans = ouvrir(depart(GRADINS), 'guetter-depuis-le-rebord').partie;
    expect(fiche(sans)?.choix.map((c) => c.id)).toEqual(['plat-ventre', 'descendre']);
    const avec = depart(GRADINS, [{ espece: 'humain', classe: 'rodeur' }, ...GUERRIERS.slice(1)]);
    expect(fiche(ouvrir(avec, 'guetter-depuis-le-rebord').partie)?.choix.map((c) => c.id)).toEqual(['plat-ventre', 'eclaireur', 'descendre']);
    const rate = tenter(avec, 'guetter-depuis-le-rebord', 'eclaireur', false);
    expect(fiche(rate)?.resultat?.heros).toBeDefined();
    expect(rate.etat.jauges[CAMP]).toBe(2);
    expect(rate.etat.flags['z1-carriere-en-alerte']).toBe(true);
    expect(fiche(rate)?.resultat?.constats.join(' ')).toMatch(/Le camp se tient prêt/);
  });
});

describe('banc d’essai : « Fouiller » les carcasses', () => {
  it('jeter une ration au molosse la consomme, quoi qu’il arrive, et pose le drapeau du molosse apaisé', () => {
    const base = depart(MARE);
    const avant = base.etat.inventaire['rations'] ?? 0;
    expect(avant).toBeGreaterThan(0);
    const p = tenter(base, 'fouiller-les-carcasses', 'vivres');
    expect(p.etat.inventaire['rations']).toBe(avant - 1);
    expect(p.etat.flags['z1-molosse-apaise']).toBe(true);
    expect(p.etat.faits).toContain('f-ald-carriere-caisses-cirees');
    expect(p.etat.heure).toBe(9);
  });

  it('sans ration, l’approche s’affiche grisée et le moteur la refuse', () => {
    const base = depart(MARE);
    delete base.etat.inventaire['rations'];
    const o = ouvrir(base, 'fouiller-les-carcasses').partie;
    const vivres = fiche(o)?.choix.find((c) => c.id === 'vivres');
    expect(vivres?.desactivee).toMatch(/ration/);
    expect(choisir(o, 'fouiller-les-carcasses', 'vivres').refus).toMatch(/ration/);
  });

  it('l’approche du druide n’est offerte qu’à un druide, et il a le jet : le résultat le nomme', () => {
    expect(fiche(ouvrir(depart(MARE), 'fouiller-les-carcasses').partie)?.choix.map((c) => c.id)).toEqual(['rive-nord', 'vivres']);
    const druide = depart(MARE, [GUERRIERS[0]!, { espece: 'humain', classe: 'druide' }, ...GUERRIERS.slice(2)]);
    const p = tenter(druide, 'fouiller-les-carcasses', 'druide');
    expect(fiche(p)?.resultat?.heros).toBeDefined();
    expect(p.etat.flags['z1-molosse-apaise']).toBe(true);
  });
});

describe('banc d’essai : « Écouter » la hutte de Demi-Dent', () => {
  it('la vigilance de la jauge change ce qu’on lit à l’ouverture (la condition se lit en direct, sans drapeau)', () => {
    const calme = ouvrir(depart(PORTILLON), 'ecouter-la-hutte-du-chef').partie;
    expect(fiche(calme)?.narration).toMatch(/voix de Demi-Dent qui compte/);
    const alerte = depart(PORTILLON);
    alerte.etat.jauges[CAMP] = 2;
    expect(fiche(ouvrir(alerte, 'ecouter-la-hutte-du-chef').partie)?.narration).toMatch(/accroupis derrière les fascines/);
  });

  it('attendre le soir coûte six heures (un nouveau jour commence) mais fait retomber la vigilance', () => {
    const base = depart(PORTILLON);
    base.etat.jauges[CAMP] = 2;
    base.etat.heure = 20;
    const p = tenter(base, 'ecouter-la-hutte-du-chef', 'soir', true);
    expect(p.etat.jour).toBe(2);
    expect(p.etat.heure).toBe(2);
    expect(p.etat.jauges[CAMP]).toBe(0);
    expect(p.etat.faits).toContain('f-ald-demi-dent-recoit-ses-ordres-par-ecrit');
  });

  it('le faux papier réussi : Demi-Dent parle au lieu de combattre ; sans cela, entrer dans les huttes lance le combat', () => {
    const sans = moteur.executer(depart(PORTILLON), { type: 'aller', vers: HUTTES }).partie;
    expect(sans.scene).toEqual({ type: 'rencontre', rencontre: RENCONTRE });

    const p = tenter(depart(PORTILLON), 'ecouter-la-hutte-du-chef', 'faux-papier', true);
    expect(p.etat.flags['z1-demi-dent-parle-sans-combat']).toBe(true);
    const quitte = moteur.executer(p, { type: 'quitterEvenement', evenement: 'ecouter-la-hutte-du-chef' }).partie;
    const dedans = moteur.executer(quitte, { type: 'aller', vers: HUTTES }).partie;
    expect(dedans.scene.type).toBe('exploration');
    const cause = moteur.executer(dedans, { type: 'parler', pnj: 'demi-dent' }).partie;
    expect(cause.scene).toEqual({ type: 'dialogue', pnj: 'demi-dent' });
    expect(moteur.vue<Interlocuteur>('interlocuteur', cause).sujets.map((s) => s.id)).toContain('le-papier-et-le-coffre');
  });

  it('le faux papier raté : la vigilance monte au maximum, le camp se jette sur le groupe, et la rencontre existante se lance (après l’écran)', () => {
    const p = tenter(depart(PORTILLON), 'ecouter-la-hutte-du-chef', 'faux-papier', false);
    expect(p.etat.flags['z1-carriere-embuscade']).toBe(true);
    expect(p.scene).toEqual({ type: 'rencontre', rencontre: RENCONTRE });
    // L'écran du résultat reste ouvert : l'écran de rencontre ne s'affiche qu'une fois qu'on a quitté l'événement.
    expect(fiche(p)?.resultat).toBeDefined();
    // La jauge est remise à zéro par le palier lui-même : la rencontre n'est pas rejouée par la suite.
    expect(p.etat.jauges[CAMP]).toBe(0);
    const apres = moteur.executer(p, { type: 'quitterEvenement', evenement: 'ecouter-la-hutte-du-chef' }).partie;
    expect(fiche(apres)).toBeUndefined();
    expect(apres.scene).toEqual({ type: 'rencontre', rencontre: RENCONTRE });
  });
});

describe('banc d’essai : limites du lot 0 (ce que le moteur actuel ne sait pas encore)', () => {
  it('une action ne se rejoue pas : une fois tentée, son bouton disparaît (rejouable : lot 2)', () => {
    const p = moteur.executer(tenter(depart(GRADINS), 'guetter-depuis-le-rebord', 'plat-ventre'), { type: 'quitterEvenement', evenement: 'guetter-depuis-le-rebord' }).partie;
    expect(boutons(p)).toEqual([]);
    expect(ouvrir(p, 'guetter-depuis-le-rebord').refus).toBeDefined();
  });

  it('la jauge de vigilance est visible de tout le monde (joueur et conteur) : `cachee` arrive au lot 1', () => {
    const f = moteur.vue<{ jauges: { id: string }[] }>('scene', depart(GRADINS));
    expect(f.jauges.map((j) => j.id)).toContain(CAMP);
  });

  it('la vigilance ne retombe que par jour : un « toutes les N heures » n’existe pas (lot 1)', () => {
    const jauge = dm.jauges.get(CAMP)!;
    expect(jauge.evolution).toEqual([{ declencheur: 'jour', delta: -1 }]);
  });

  it('le molosse reste dans la rencontre même apaisé : les monstres n’ont pas de condition (lot 1b)', () => {
    const rencontre = dm.rencontres.get(RENCONTRE)!;
    expect(rencontre.monstres.some((m) => m.profil === 'molosse')).toBe(true);
    expect(JSON.stringify(rencontre.monstres)).not.toMatch(/sauf|condition/);
  });

  it('les actions sont des événements pour le conteur : il ne les ouvre pas (outil `agir` : lot 3)', () => {
    const outils = moteur.commandes().map((c) => c.type);
    expect(outils).not.toContain('agir');
  });
});
