// La bibliothèque de salutations communes livrée (`salutations-communes.json`) : partagée par TOUTES les histoires et dite par les 12 voix, ses lignes
// doivent aller à n'importe quel PNJ du registre : neutres en genre, sans lieu, sans moment, sans mécanique, toutes différentes.
import { describe, expect, it } from 'vitest';
import { FichierSalutationsCommunes, Pnj, SALUTATIONS_COMMUNES, TONS_SALUTATION, ligneCommune } from '../src';

const mots = (t: string) => t.replace(/[«»]/g, ' ').split(/\s+/).filter(Boolean).length;
const toutes = SALUTATIONS_COMMUNES.registres.flatMap((r) => TONS_SALUTATION.flatMap((ton) => r.lignes[ton].map((texte) => ({ registre: r.id, ton, texte }))));

// Mots qui s'accordent avec le genre de celui qui parle, ou qui genrent ceux qu'on salue.
const GENRE = /\b(content|contente|ravi|ravie|désolé|désolée|prêt|prête|fatigué|fatiguée|seul|seule|occupé|occupée|sûr|sûre|heureux|heureuse|étonné|étonnée|surpris|surprise|certain|certaine|décidé|décidée|obligé|obligée|libre)\b/i;
const ADRESSE = /\b(mon ami|mon brave|ma belle|madame|monsieur|messire|seigneur|dame|étranger|étrangère|voyageur|voyageurs|voyageuse|mes amis|mon cher|ma chère|compagnon)\b/i;
const LIEU = /\b(village|ville|auberge|forge|boutique|port|route|poste|château|cour|rue|quartier|temple|bibliothèque|champ|ferme|marché|taverne|donjon|royaume)\b/i;
const TEMPS = /\b(ce matin|ce soir|aujourd’hui|aujourd'hui|cette nuit|demain|hier|hiver|été|printemps|automne|pluie|neige|soleil)\b/i;
const MECANIQUE = /\b(DD|PV|XP|niveau|jet|points? de vie|pièces?)\b/;

describe('la bibliothèque de salutations communes', () => {
  it('suit son format : six registres au moins, trois lignes au moins par ton', () => {
    expect(FichierSalutationsCommunes.safeParse(SALUTATIONS_COMMUNES).success).toBe(true);
    expect(SALUTATIONS_COMMUNES.registres.length).toBeGreaterThanOrEqual(6);
    for (const r of SALUTATIONS_COMMUNES.registres) for (const ton of TONS_SALUTATION) expect(r.lignes[ton].length, `${r.id} ${ton}`).toBeGreaterThanOrEqual(3);
  });

  it('chaque ligne est une parole de 10 à 28 mots, sans point de suspension', () => {
    for (const l of toutes) {
      expect(l.texte, `${l.registre} ${l.ton}`).toMatch(/^« [\s\S]+ »$/);
      expect(mots(l.texte), l.texte).toBeGreaterThanOrEqual(10);
      expect(mots(l.texte), l.texte).toBeLessThanOrEqual(28);
      expect(l.texte).not.toMatch(/…|\.\.\./);
    }
  });

  it('les lignes sont neutres en genre, sans lieu, sans moment ni météo, sans mécanique de jeu', () => {
    for (const l of toutes) {
      expect(l.texte, `genre : ${l.texte}`).not.toMatch(GENRE);
      expect(l.texte, `adresse : ${l.texte}`).not.toMatch(ADRESSE);
      expect(l.texte, `lieu : ${l.texte}`).not.toMatch(LIEU);
      expect(l.texte, `temps : ${l.texte}`).not.toMatch(TEMPS);
      expect(l.texte, `mécanique : ${l.texte}`).not.toMatch(MECANIQUE);
    }
  });

  it('aucune ligne n’est répétée, dans la bibliothèque entière', () => {
    const textes = toutes.map((l) => l.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });

  it('un PNJ qui nomme un registre reçoit ses trois salutations, passe la validation, et en garde les textes', () => {
    for (const r of SALUTATIONS_COMMUNES.registres) {
      const fiche = {
        id: `pnj-${r.id}`, nom: 'Un PNJ', espece: 'humain', sexe: 'M', role: r.libelle, lieu: 'un-lieu', apparence: 'quelqu’un',
        personnalite: { traits: ['calme', 'sobre'], voix: 'posée', desir: 'qu’on le laisse travailler' },
        salutations: { commune: r.id },
      };
      const p = Pnj.safeParse(fiche);
      expect(p.success, r.id).toBe(true);
      if (!p.success) continue;
      expect(p.data.salutations.neutre).toBe(ligneCommune(r, 'neutre', fiche.id));
      expect(p.data.salutations.amical).toBe(ligneCommune(r, 'amical', fiche.id));
      expect(p.data.salutations.hostile).toBe(ligneCommune(r, 'hostile', fiche.id));
      expect(r.lignes.neutre).toContain(p.data.salutations.neutre);
    }
  });
});
