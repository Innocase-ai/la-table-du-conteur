// Une salle où se tient quelqu'un le dit avant d'y entrer : « On y croise : … » sous la sortie. Sans cela, on traverse
// l'auberge (le lieu parent, sans personne) sans jamais savoir que Varek, Silas, Mireille ou Brégor sont dans les salles voisines.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerGenerateur, etatInitial, ficheDeScene, herosPreTires, nouvellePartie, personnageDepuisFiche } from '../src';
import { pnjDansLieu } from '../src/monde/presence';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const groupe = herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: [] }));

describe('signaler les PNJ des lieux voisins', () => {
  it("l'auberge (sans personne) annonce qui l'on croise dans ses salles", () => {
    const p = nouvellePartie(r.monde, etatInitial(r.monde), groupe, creerGenerateur(1));
    p.etat.lieu = 'ald-auberge-de-bregor';
    const sorties = ficheDeScene(p).sorties;
    const salle = sorties.find((s) => s.vers === 'ald-auberge-salle-commune');
    expect(salle?.apercu).toMatch(/On y croise : .*Varek le Brisé.*Silas l.Épieur/);
    expect(sorties.find((s) => s.vers === 'ald-auberge-comptoir-et-cellier')?.apercu).toContain('Brégor le Borgne');
    // l'étage est vide : aucune mention
    expect(sorties.find((s) => s.vers === 'ald-auberge-etage-et-combles')?.apercu).not.toContain('On y croise');
  });

  it('un PNJ qui voyage avec le groupe, ou mort, n’est pas signalé', () => {
    const p = nouvellePartie(r.monde, etatInitial(r.monde), groupe, creerGenerateur(1));
    p.etat.escortes = ['varek-le-brise'];
    expect(pnjDansLieu(p, 'ald-auberge-salle-commune').map((n) => n.id)).not.toContain('varek-le-brise');
    expect(pnjDansLieu(p, 'ald-auberge-salle-commune').map((n) => n.id)).toContain('silas-l-epieur');
    p.etat.pnjEtats['silas-l-epieur'] = 'mort';
    expect(pnjDansLieu(p, 'ald-auberge-salle-commune').map((n) => n.id)).not.toContain('silas-l-epieur');
  });
});
