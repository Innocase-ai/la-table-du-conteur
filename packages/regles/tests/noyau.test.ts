import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { commande, creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche, type Personnage, type EvenementJeu, type Interlocuteur, type Module, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;

function groupe(): Personnage[] {
  return herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: h.fiche.nom === 'Pip' ? ['outils-de-voleur'] : [] }));
}

const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

/** Une rencontre aléatoire (une fois sur trois à l'arrivée) est écartée : le test porte sur autre chose. */
const calme = (p: Partie): Partie => (p.scene.type === 'rencontre' ? moteur.executer(p, { type: 'reglerRencontre', issue: 'fuite' }).partie : p);

function depart(graine = 1234): Partie {
  return moteur.executer(moteur.nouvellePartie(groupe(), { graine, niveau: 3 }), { type: 'commencer' }).partie;
}

const types = (ev: EvenementJeu[]) => ev.map((e) => e.type);

describe('noyau : commandes et transactions', () => {
  it("commencer : l'arrivée au départ produit des textes, des faits appris, et remplit le journal", () => {
    const vierge = moteur.nouvellePartie(groupe(), { graine: 1, niveau: 3 });
    const res = moteur.executer(vierge, { type: 'commencer' });
    expect(res.refus).toBeUndefined();
    expect(types(res.evenements)).toContain('texte');
    expect(types(res.evenements)).toContain('faitAppris');
    expect(res.partie.journal).toEqual(res.evenements);
    expect(vierge.journal).toEqual([]); // l'ancienne partie n'est pas touchée
    expect(moteur.executer(res.partie, { type: 'commencer' }).refus).toMatch(/déjà commencé/);
  });

  it("une action renvoie une nouvelle partie ; l'ancienne reste intacte", () => {
    const p = depart();
    const res = moteur.executer(p, { type: 'aller', vers: 'vei-auberge-dernier-feu' });
    expect(res.partie).not.toBe(p);
    expect(p.etat.lieu).toBe('veillecendre');
    expect(res.partie.etat.lieu).toBe('vei-auberge-dernier-feu');
    expect(res.evenements[0]).toEqual({ type: 'deplacement', de: 'veillecendre', vers: 'vei-auberge-dernier-feu' });
  });

  it('un refus rend la même partie ; une entrée invalide ou une commande inconnue sont refusées', () => {
    const p = depart();
    const loin = moteur.executer(p, { type: 'aller', vers: 'haute-forge' });
    expect(loin.refus).toMatch(/Aucun passage/);
    expect(loin.partie).toBe(p);
    expect(moteur.executer(p, { type: 'aller' }).refus).toMatch(/vers/);
    expect(moteur.executer(p, { type: 'voler' }).refus).toMatch(/inconnue/);
  });

  it('le hasard est dans la partie : une sauvegarde rechargée tire exactement les mêmes dés', () => {
    const p = depart(42);
    const rechargee = moteur.charger(JSON.stringify(p));
    const a = moteur.executer(p, { type: 'fouiller' });
    const b = moteur.executer(rechargee, { type: 'fouiller' });
    expect(b.evenements).toEqual(a.evenements);
    expect(b.partie.graine).toBe(a.partie.graine);
    expect(() => moteur.charger(JSON.stringify({ ...p, version: 99 }))).toThrow(/version/);
  });

  it('une sauvegarde de version 1 (sans ressources) est migrée : potions et emplacements rendus', () => {
    const p = depart(9);
    const v1 = JSON.parse(JSON.stringify(p));
    v1.version = 1;
    for (const a of v1.groupe) {
      delete a.ressources;
      delete a.emplacements;
    }
    const migree = moteur.charger(JSON.stringify(v1));
    expect(migree.version).toBe(p.version);
    expect(migree.groupe.find((a) => a.id === 'bran')!.ressources.potions).toBe(1);
    expect(migree.groupe.find((a) => a.id === 'ambrine')!.emplacements).toEqual(p.groupe.find((a) => a.id === 'ambrine')!.emplacements);
  });

  it("les changements d'état deviennent des événements typés (objets, pièces, découvertes)", () => {
    let p = depart(7);
    const jouer = (o: { type: string } & Record<string, unknown>) => {
      const res = moteur.executer(p, o);
      p = res.partie;
      return res;
    };
    jouer({ type: 'aller', vers: 'vei-halle-du-bailli' });
    // On rend la trappe et le piège visibles, puis on désamorce et on vide le coffret.
    p.etat.exploration.decouverts.push('lien:vei-halle-du-bailli>vei-cellier-du-bailli');
    jouer({ type: 'aller', vers: 'vei-cellier-du-bailli' });
    p.etat.exploration.pieges['vei-p-aiguille-du-coffret'] = 'desarme';
    p.etat.exploration.ouverts.push('tresor:vei-t-plancher-du-bailli');
    const pris = jouer({ type: 'prendre', tresor: 'vei-t-plancher-du-bailli' });
    expect(pris.evenements).toContainEqual({ type: 'pieces', delta: 85, total: 85 });
    expect(pris.evenements).toContainEqual({ type: 'objetObtenu', objet: 'vei-double-registre', quantite: 1 });
  });

  it('deux modules ne peuvent pas déclarer la même commande ; une dépendance manquante est signalée', () => {
    const doublon: Module = { id: 'doublon', commandes: { fouiller: commande({ description: '', entree: z.object({}), executer: () => undefined }) } };
    expect(() => creerMoteur({ dm }, [...MODULES_STANDARD, doublon])).toThrow(/fouiller/);
    expect(() => creerMoteur({ dm }, [MODULES_STANDARD[1]!])).toThrow(/exploration/);
  });
});

describe('noyau : modules et réactions', () => {
  it('un module réagit aux événements des autres sans que personne ne l’appelle', () => {
    // Un petit module « chroniqueur » : il compte les faits appris et le dit.
    const chroniqueur: Module = {
      id: 'chroniqueur',
      etatInitial: () => ({ faits: 0 }),
      reactions: {
        faitAppris: (t) => {
          const etat = t.partie.modules['chroniqueur'] as { faits: number };
          etat.faits += 1;
          t.emettre({ type: 'constat', texte: `Fait noté (${etat.faits}).` });
        },
      },
    };
    const m = creerMoteur({ dm }, [...MODULES_STANDARD, chroniqueur]);
    const p = m.executer(m.nouvellePartie(groupe(), { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
    const appris = p.journal.filter((e) => e.type === 'faitAppris').length;
    expect(appris).toBeGreaterThan(0);
    expect((p.modules['chroniqueur'] as { faits: number }).faits).toBe(appris);
    expect(p.journal.filter((e) => e.type === 'constat' && e.texte.startsWith('Fait noté'))).toHaveLength(appris);
  });

  it('dialogue : la conversation est une scène ; la vue donne les sujets ; un sujet parle dans la voix du PNJ', () => {
    let p = calme(moteur.executer(depart(), { type: 'aller', vers: 'vei-auberge-dernier-feu' }).partie);
    const salut = moteur.executer(p, { type: 'parler', pnj: 'vei-nerio-braisemolle' });
    p = salut.partie;
    expect(p.scene).toEqual({ type: 'dialogue', pnj: 'vei-nerio-braisemolle' });
    expect(salut.evenements.some((e) => e.type === 'constat')).toBe(false); // la liste des sujets n'est pas dans le récit
    const vue = moteur.vue<Interlocuteur>('interlocuteur', p);
    expect(vue.sujets.map((s) => s.id)).toContain('les-accusations');
    const sujet = moteur.executer(p, { type: 'parler', pnj: 'vei-nerio-braisemolle', sujet: 'les-accusations' });
    expect(sujet.evenements).toContainEqual(expect.objectContaining({ type: 'texte', voix: 'Nerio Braisemolle' }));
    expect(sujet.evenements).toContainEqual({ type: 'faitAppris', fait: 'f-vei-tieffelins-accuses' });
    p = moteur.executer(sujet.partie, { type: 'quitterDialogue' }).partie;
    expect(p.scene).toEqual({ type: 'exploration' });
  });

  it('rencontre : elle bloque l’exploration jusqu’à son règlement ; la victoire rend PV, PX et la main', () => {
    let p = moteur.executer(depart(), { type: 'aller', vers: 'le-gue' }).partie;
    p = moteur.executer(p, { type: 'aller', vers: 'gue-gue-a-gue' }).partie;
    expect(p.scene).toEqual({ type: 'rencontre', rencontre: 'gue-embuscade-au-gue' });
    expect(moteur.executer(p, { type: 'fouiller' }).refus).toMatch(/rencontre attend/);
    expect(moteur.commandes(p).find((c) => c.type === 'fouiller')!.disponible).not.toBe(true);
    const fin = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 150, heros: { bran: { pv: 10, ressources: { potions: 0 } } } });
    expect(fin.partie.scene).toEqual({ type: 'exploration' });
    expect(fin.partie.groupe.find((a) => a.id === 'bran')!.pv).toBe(10);
    // L'XP d'un combat se partage entre les héros (SRD 5.2.1).
    expect(fin.evenements).toContainEqual(expect.objectContaining({ type: 'xp', delta: Math.floor(150 / p.groupe.length) }));
    expect(fin.evenements).toContainEqual(expect.objectContaining({ type: 'pvChange', personnage: 'bran', apres: 10 }));
    expect(fin.evenements).toContainEqual({ type: 'ressourceChange', personnage: 'bran', ressource: 'potions', avant: 1, apres: 0 });
  });

  it('chaque commande a une description et un schéma : de quoi générer boutons et outils du conteur', () => {
    const cmds = moteur.commandes();
    expect(cmds.length).toBeGreaterThanOrEqual(14);
    for (const c of cmds) {
      expect(c.description.length).toBeGreaterThan(10);
      expect(typeof c.commande.entree.safeParse).toBe('function');
    }
  });
});

describe('noyau : propositions (boutons générés depuis les commandes)', () => {
  it('au départ : partir, fouiller, se reposer ; les panneaux sont rangés', () => {
    const props = moteur.propositions(depart());
    const groupes = [...new Set(props.map((x) => x.groupe.id))];
    expect(groupes).toContain('partir');
    expect(groupes).toContain('ici');
    expect(props.map((x) => x.groupe.ordre)).toEqual([...props.map((x) => x.groupe.ordre)].sort((a, b) => a - b));
    expect(props.find((x) => x.ordre?.type === 'aller' && x.ordre.vers === 'vei-auberge-dernier-feu')).toBeDefined();
  });

  it('en conversation, seuls les sujets, l’influence et « terminer » ; pendant une rencontre, seulement la rencontre', () => {
    let p = calme(moteur.executer(depart(), { type: 'aller', vers: 'vei-auberge-dernier-feu' }).partie);
    p = moteur.executer(p, { type: 'parler', pnj: 'vei-nerio-braisemolle' }).partie;
    const dialogue = moteur.propositions(p);
    // La boutique et les services du PNJ s'affichent aussi pendant la conversation.
    expect(new Set(dialogue.filter((x) => !x.groupe.onglet).map((x) => x.groupe.id).filter((g) => !['boutique', 'rachat', 'services'].includes(g)))).toEqual(new Set(['dialogue']));
    expect(dialogue.some((x) => x.ordre?.type === 'parler' && x.ordre.sujet === 'les-accusations')).toBe(true);

    let r = moteur.executer(depart(), { type: 'aller', vers: 'le-gue' }).partie;
    r = moteur.executer(r, { type: 'aller', vers: 'gue-gue-a-gue' }).partie;
    const rencontre = moteur.propositions(r);
    expect(new Set(rencontre.map((x) => x.groupe.id))).toEqual(new Set(['rencontre']));
    expect(rencontre[0]).toMatchObject({ libelle: 'Combattre', intention: 'combattre' });
    // Le panneau de la rencontre présente ses monstres (image par profil, nom, nombre, description).
    expect(rencontre[0]!.groupe.monstres?.length).toBeGreaterThan(0);
    for (const m of rencontre[0]!.groupe.monstres ?? []) expect(m).toMatchObject({ profil: expect.any(String), nom: expect.any(String), nombre: expect.any(Number) });
  });

  it('une énigme propose une réponse à saisir et des indices de plus en plus clairs, retenus dans la partie', () => {
    let p = depart();
    p = { ...p, etat: { ...p.etat, lieu: 'cry-caserne' } };
    const props = moteur.propositions(p).filter((x) => x.groupe.id === 'enigme:cry-e-le-mot-d-ordre');
    expect(props.find((x) => x.saisie)?.saisie).toEqual({ champ: 'reponse', indication: 'Votre réponse' });
    const indice = props.find((x) => x.ordre?.type === 'indiceEnigme')!;
    p = moteur.executer(p, indice.ordre!).partie;
    const suivant = moteur.propositions(p).find((x) => x.ordre?.type === 'indiceEnigme' && x.groupe.id === 'enigme:cry-e-le-mot-d-ordre')!;
    expect(suivant.ordre).toMatchObject({ niveau: 2 });
  });

  it('chaque bouton proposé est jouable : une marche au hasard de 300 actions sans aucun refus', () => {
    let p = depart(77);
    let hasard = 0.123;
    // Un bouton à choix se joue avec sa première option disponible.
    const jouable = (x: { ordre?: Record<string, unknown>; choix?: { champ: string; options: { valeur: string; desactivee?: string }[] } }) =>
      ({ ...x.ordre, ...(x.choix ? { [x.choix.champ]: x.choix.options.find((o) => !o.desactivee)?.valeur } : {}) }) as { type: string };
    const suivant = () => (hasard = (hasard * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 300; i++) {
      const jouables = moteur.propositions(p).filter((x) => x.ordre && !x.saisie && !x.formulaire && !x.desactivee);
      // Une rencontre se règle comme après un combat gagné.
      const choix =
        p.scene.type === 'rencontre'
          ? ({ type: 'reglerRencontre', issue: 'victoire' } as const)
          : jouable(jouables[Math.floor(suivant() * jouables.length)]!);
      const res = moteur.executer(p, choix);
      expect(res.refus, `${JSON.stringify(choix)} à ${p.etat.lieu}`).toBeUndefined();
      p = res.partie;
      if (p.scene.type === 'fin') break;
    }
    expect(p.etat.lieuxVisites.length).toBeGreaterThan(4);
  });
});
