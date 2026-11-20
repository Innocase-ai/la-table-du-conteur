// F6 (PRD-SAGA), lot 5 — les réactions de monstres « +N à la CA contre cette attaque » (Parade du chef de bande, du vétéran, du gladiateur…, Tourbillon de
// sable de la momie). Le monstre n'utilise sa réaction que si elle fait rater un coup qui touchait, une fois par round.
import { describe, expect, it } from 'vitest';
import { monstreDepuisProfil } from '../src/combat/creation';
import { creerCombat, jetAttaque } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import type { Combattant, EtatCombat } from '../src/combat/etat';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function duel(profil: string): { etat: EtatCombat; monstre: Combattant; heros: Combattant } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'reaction-essai', nom: 'Réaction (essai)', monstres: [{ profil, nombre: 1 }] };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, 3);
  return { etat, monstre: etat.combattants.find((c) => c.camp === 'monstres')!, heros: etat.combattants.find((c) => c.camp === 'heros')! };
}

/** Une attaque dont le d20 est imposé et dont le total vaut exactement `visee` (la CA du monstre plus `ecart`). */
function attaquer(etat: EtatCombat, heros: Combattant, monstre: Combattant, d: number, ecart: number, mode: 'corps-a-corps' | 'distance' = 'corps-a-corps') {
  etat.desImposes = [d, d];
  // Pas de bonus de situation : on neutralise l'avantage, le total visé est atteint par le bonus d'attaque.
  const caNue = monstre.caBase + (monstre.modificateurs.filter((m) => m.type === 'bonus_ca').reduce((s, m) => s + (m.valeur ?? 0), 0));
  return jetAttaque(etat, heros, monstre, caNue + ecart - d, mode);
}

describe('la donnée', () => {
  it('17 réactions de monstre portent `reaction` (Parade ×6, Tourbillon de sable, puis celles des lots 7 et 8), et ce sont toutes des réactions', () => {
    const trouvees: string[] = [];
    for (const m of donnees.monstres.values()) {
      for (const a of m.actions) {
        if (!a.reaction) continue;
        trouvees.push(`${m.id}/${a.id}`);
        expect(a.cout, `${m.id}/${a.id}`).toBe('reaction');
        expect(a.reaction.ca ?? a.reaction.redirige ?? a.reaction.reduitDegats ?? a.reaction.sauvegarde ?? a.reaction.division ?? a.reaction.regard ?? a.reaction.poursuite).toBeTruthy();
      }
    }
    // Les six Parade et le Tourbillon de sable du lot 5 ; les autres sont celles du lot 7 (`combat-reactions-monstres-2.test.ts`).
    expect(trouvees.filter((t) => t.endsWith('/parade') || t.endsWith('/tourbillon-de-sable')).sort()).toEqual(['chef-de-bande/parade', 'erinye/parade', 'gladiateur/parade', 'marilith/parade', 'momie-auguste/tourbillon-de-sable', 'noble/parade', 'veteran/parade']);
    expect(trouvees).toHaveLength(17);
  });
});

describe('Parade du chef de bande (+2 CA contre une attaque de corps à corps)', () => {
  it('un coup qui touche de justesse rate : la réaction est dépensée et le journal le dit', () => {
    const { etat, monstre, heros } = duel('chef-de-bande');
    expect(monstre.ressources.reaction).toBe(1);
    const jet = attaquer(etat, heros, monstre, 12, 0);
    expect(jet.touche).toBe(false);
    expect(jet.ca).toBe(monstre.caBase + 2);
    expect(monstre.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /réagit \(Parade\) : \+2 à sa CA/.test(e.texte))).toBe(true);
  });

  it('une fois par round : la deuxième attaque, de justesse elle aussi, touche', () => {
    const { etat, monstre, heros } = duel('chef-de-bande');
    attaquer(etat, heros, monstre, 12, 0);
    expect(attaquer(etat, heros, monstre, 12, 0).touche).toBe(true);
  });

  it('un coup qui touche de 2 ou plus au-dessus de la CA passe : la réaction est gardée', () => {
    const { etat, monstre, heros } = duel('chef-de-bande');
    expect(attaquer(etat, heros, monstre, 12, 2).touche).toBe(true);
    expect(monstre.ressources.reaction).toBe(1);
  });

  it('un coup qui rate déjà ne dépense rien ; un 20 naturel touche toujours', () => {
    const { etat, monstre, heros } = duel('chef-de-bande');
    expect(attaquer(etat, heros, monstre, 12, -1).touche).toBe(false);
    expect(monstre.ressources.reaction).toBe(1);
    const jet = attaquer(etat, heros, monstre, 20, -30);
    expect(jet.touche).toBe(true);
    expect(monstre.ressources.reaction).toBe(1);
  });

  it('elle ne vaut que contre le corps à corps (« contre » : corps-a-corps) : une attaque à distance de justesse touche', () => {
    const { etat, monstre, heros } = duel('chef-de-bande');
    expect(attaquer(etat, heros, monstre, 12, 0, 'distance').touche).toBe(true);
    expect(monstre.ressources.reaction).toBe(1);
  });

  it('sans réaction disponible (déjà dépensée) ou sans pouvoir agir, elle ne se joue pas', () => {
    const a = duel('chef-de-bande');
    a.monstre.ressources.reaction = 0;
    expect(attaquer(a.etat, a.heros, a.monstre, 12, 0).touche).toBe(true);
    const b = duel('chef-de-bande');
    b.monstre.etats.push({ etat: 'paralyse' } as Combattant['etats'][number]);
    expect(attaquer(b.etat, b.heros, b.monstre, 12, 0).touche).toBe(true);
  });
});

describe('Tourbillon de sable de la momie (+2 CA contre toute attaque)', () => {
  it('vaut aussi contre une attaque à distance', () => {
    const { etat, monstre, heros } = duel('momie-auguste');
    expect(attaquer(etat, heros, monstre, 12, 0, 'distance').touche).toBe(false);
    expect(monstre.ressources.reaction).toBe(0);
  });
});

describe('les autres monstres ne sont pas concernés', () => {
  it('un monstre sans `reaction` (ogre) est touché de justesse comme avant, sa réaction reste intacte', () => {
    const { etat, monstre, heros } = duel('ogre');
    expect(attaquer(etat, heros, monstre, 12, 0).touche).toBe(true);
    expect(monstre.ressources.reaction).toBe(1);
  });

  it('le profil se construit sans réserve nouvelle : la réaction reste la ressource commune `reaction`', () => {
    const c = monstreDepuisProfil(donnees.monstres.get('chef-de-bande')!, 'x', { x: 0, y: 0 });
    expect(Object.keys(c.ressources)).toEqual(['reaction']);
  });
});
