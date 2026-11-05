import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  codeDuMessage,
  consommePar,
  diagnosticDeMessage,
  diagnostiquerMonde,
  entiteDuMessage,
  indexerReferences,
  produitPar,
  validerMonde,
  versTexte,
  type DonneesMonde,
} from '../src';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

const DILEMME = {
  id: 'le-pacte',
  titre: 'Le pacte',
  situation: 'Un marché vous est proposé.',
  quand: { flag: 'jamais-pose' },
  options: [
    { id: 'oui', libelle: 'J’accepte.', couts: ['Un prix'], gains: ['Un gain'] },
    { id: 'non', libelle: 'Je refuse.', couts: ['Un prix'], gains: ['Un gain'] },
  ],
  abstention: { couts: ['Le temps passe'] },
};

describe('diagnostics : rangement des phrases du validateur', () => {
  it('retrouve l’entité visée et un code stable', () => {
    expect(entiteDuMessage('Quête « q-loups », étape « x » : suite inconnue « y ».')).toEqual({ type: 'quetes', id: 'q-loups' });
    expect(entiteDuMessage('Fait clé « f-x » : une seule source.')).toEqual({ type: 'faits', id: 'f-x' });
    expect(entiteDuMessage('Aucune fin définie.')).toBeUndefined();
    expect(codeDuMessage('PNJ « a » : lieu inconnu « b ».', 'erreur')).toBe('ref.inconnue');
    expect(codeDuMessage('Fait « f » : personne ne le révèle (PNJ, lieu, trésor ou effet).', 'avis')).toBe('fait.sans-source');
    expect(codeDuMessage('Richesse : 3 lieux pour 1 chapitre(s) (objectif : 30).', 'avis')).toBe('conseil.richesse');
    expect(codeDuMessage('Réactivité : 2 PNJ.', 'avis')).toBe('conseil.reactivite');
    expect(diagnosticDeMessage('Lieu « grotte » : inaccessible depuis le départ (« village »).', 'erreur')).toMatchObject({ code: 'lieu.inaccessible', gravite: 'erreur', entite: { type: 'lieux', id: 'grotte' } });
  });

  it('le diagnostic reprend, mot pour mot, les erreurs et avertissements du validateur', () => {
    const dm = charger(MINI);
    dm.pnj.get('bertrand')!.lieu = 'nulle-part';
    dm.faits.set('f-orphelin', { id: 'f-orphelin', texte: 'x', categorie: 'histoire', importance: 1, fiable: true });
    const bilan = validerMonde(dm, srd);
    expect(bilan.erreurs.length).toBeGreaterThan(0);
    expect(bilan.diagnostics.filter((d) => d.gravite === 'erreur').map((d) => d.message)).toEqual(bilan.erreurs);
    expect(bilan.diagnostics.filter((d) => d.gravite === 'avis').map((d) => d.message)).toEqual(bilan.avertissements);
    expect(bilan.diagnostics.find((d) => d.code === 'ref.inconnue')?.entite).toEqual({ type: 'pnj', id: 'bertrand' });
  });

  it.each([...listerMondes(), 'mini-monde'])('« %s » : le texte du CLI se retrouve dans les diagnostics', (id) => {
    const dm = charger(id === 'mini-monde' ? MINI : join(RACINE_MONDES, id));
    const d = diagnostiquerMonde(dm, srd);
    const legacy = d.diagnostics.filter((x) => x.source !== 'controles');
    expect(legacy.filter((x) => x.gravite === 'erreur').map(versTexte)).toEqual(d.erreurs);
    expect(legacy.filter((x) => x.gravite === 'avis').map(versTexte)).toEqual(d.avertissements);
  });
});

describe('contrôles statiques de l’atelier', () => {
  it('une fin que rien ne peut déclencher est signalée, sauf si un effet « fin » existe', () => {
    const dm = charger(MINI);
    dm.fins.set('fin-morte', { id: 'fin-morte', nom: 'Fin morte', condition: { flag: 'jamais-pose' }, epilogue: 'x', consequences: [] });
    let d = diagnostiquerMonde(dm, srd).diagnostics.filter((x) => x.code === 'fin.inatteignable');
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ gravite: 'avis', entite: { type: 'fins', id: 'fin-morte' }, source: 'controles' });
    // Un effet « fin » quelque part la rend possible.
    dm.quetes.get('q-loups')!.recompenses.effets.push({ fin: 'fin-morte' });
    d = diagnostiquerMonde(dm, srd).diagnostics.filter((x) => x.code === 'fin.inatteignable');
    expect(d).toHaveLength(0);
  });

  it('une fin dont le drapeau est posé quelque part est atteignable', () => {
    const dm = charger(MINI);
    dm.fins.set('fin-flag', { id: 'fin-flag', nom: 'Fin', condition: { flag: 'pose' }, epilogue: 'x', consequences: [] });
    dm.evenements.set('ev-pose', { id: 'ev-pose', declencheur: 'condition', unique: true, narration: 'x', effets: [{ flag: 'pose' }] });
    expect(diagnostiquerMonde(dm, srd).diagnostics.some((x) => x.code === 'fin.inatteignable')).toBe(false);
  });

  it('un dilemme dont la condition ne peut jamais être vraie est signalé', () => {
    const dm = charger(MINI);
    dm.extensions = { ...dm.extensions, dilemmes: [DILEMME] };
    const d = diagnostiquerMonde(dm, srd).diagnostics.filter((x) => x.code === 'dilemme.quand-impossible');
    expect(d).toHaveLength(1);
    expect(d[0]!.entite).toEqual({ type: 'dilemmes', id: 'le-pacte' });
  });

  it('un passage à sens unique sans retour est un conseil, pas un défaut du parent / enfant', () => {
    const dm = charger(MINI);
    expect(diagnostiquerMonde(dm, srd).diagnostics.some((x) => x.code === 'lien.reciproque-manquant')).toBe(false);
    dm.lieux.get('sentier')!.liens.push({ vers: 'auberge', type: 'passage', heures: 0, sens: 'simple' });
    const d = diagnostiquerMonde(dm, srd).diagnostics.filter((x) => x.code === 'lien.reciproque-manquant');
    // « sentier » n'a pas de lien propre avec « auberge » et inversement : un seul sens.
    expect(d.length).toBeLessThanOrEqual(1);
  });
});

/** Toutes les valeurs d'un champ de ce nom, dans un objet quelconque (Map comprises). */
function valeursDe(x: unknown, cle: string, sortie: unknown[] = []): unknown[] {
  if (x instanceof Map) return valeursDe([...x.values()], cle, sortie);
  if (Array.isArray(x)) {
    x.forEach((y) => valeursDe(y, cle, sortie));
    return sortie;
  }
  if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (k === cle) sortie.push(v);
      valeursDe(v, cle, sortie);
    }
  }
  return sortie;
}

describe('index des références : garde-fou contre un site oublié', () => {
  // Les dossiers d'extension lus par l'index (les scènes citent une `fin` comme déclencheur : autre chose).
  const lus = (dm: DonneesMonde) => ({ ...dm, extensions: Object.fromEntries(Object.entries(dm.extensions ?? {}).filter(([k]) => ['dilemmes', 'examens', 'codex', 'interjections', 'savoirs'].includes(k))) });

  it.each([...listerMondes(), 'mini-monde'])('« %s » : chaque drapeau, fait et objet cité dans les données est dans l’index', (id) => {
    const dm = charger(id === 'mini-monde' ? MINI : join(RACINE_MONDES, id));
    const idx = indexerReferences(dm);
    const donnees = lus(dm);
    const absents: string[] = [];
    for (const f of valeursDe(donnees, 'flag')) if (typeof f === 'string' && !idx.produit.has(`flag:${f}`) && !idx.consomme.has(`flag:${f}`)) absents.push(`flag:${f}`);
    for (const f of valeursDe(donnees, 'fait')) if (typeof f === 'string' && !idx.produit.has(`fait:${f}`) && !idx.consomme.has(`fait:${f}`)) absents.push(`fait:${f}`);
    for (const o of valeursDe(donnees, 'objet')) {
      const cle = typeof o === 'string' ? o : (o as { id?: string })?.id;
      if (cle && !idx.produit.has(`objet:${cle}`) && !idx.consomme.has(`objet:${cle}`)) absents.push(`objet:${cle}`);
    }
    expect([...new Set(absents)]).toEqual([]);
  });

  it('dit qui produit et qui consomme un drapeau, un fait et un objet', () => {
    const dm = charger(MINI);
    dm.evenements.set('ev-x', { id: 'ev-x', declencheur: 'condition', unique: true, narration: 'x', condition: { flag: 'porte-ouverte' }, effets: [{ flag: 'cloche-sonnee' }, { fait: 'f-cloche' }] });
    dm.fins.set('fin-x', { id: 'fin-x', nom: 'X', condition: { et: [{ flag: 'cloche-sonnee' }, { non: { fait: 'f-cloche' } }] }, epilogue: 'x', consequences: [] });
    const idx = indexerReferences(dm);
    expect(produitPar(idx, 'flag', 'cloche-sonnee')).toEqual([{ entite: { type: 'evenements', id: 'ev-x' }, chemin: ['effets', 0], role: 'effet' }]);
    expect(consommePar(idx, 'flag', 'cloche-sonnee')).toEqual([{ entite: { type: 'fins', id: 'fin-x' }, chemin: ['condition'], role: 'condition' }]);
    expect(consommePar(idx, 'fait', 'f-cloche').map((s) => s.entite.id)).toEqual(['fin-x']);
    expect(consommePar(idx, 'flag', 'porte-ouverte').map((s) => s.entite.id)).toEqual(['ev-x']);
    expect(produitPar(idx, 'flag', 'porte-ouverte')).toEqual([]);
  });

  it('retirer un objet le consomme, le poser le produit', () => {
    const dm = charger(MINI);
    dm.evenements.set('ev-o', { id: 'ev-o', declencheur: 'condition', unique: true, narration: 'x', effets: [{ objet: { id: 'cle-x' } }, { objet: { id: 'cle-y', retirer: true } }] });
    const idx = indexerReferences(dm);
    expect(produitPar(idx, 'objet', 'cle-x')).toHaveLength(1);
    expect(consommePar(idx, 'objet', 'cle-y')).toHaveLength(1);
    expect(produitPar(idx, 'objet', 'cle-y')).toHaveLength(0);
  });

  it('un dilemme pose les drapeaux de ses choix', () => {
    const dm = charger(MINI);
    dm.extensions = { ...dm.extensions, dilemmes: [DILEMME] };
    const idx = indexerReferences(dm);
    expect(produitPar(idx, 'flag', 'choix-le-pacte-oui')).toHaveLength(1);
    expect(produitPar(idx, 'flag', 'choix-le-pacte-abstention')).toHaveLength(1);
    expect(consommePar(idx, 'flag', 'jamais-pose')[0]!.entite).toEqual({ type: 'dilemmes', id: 'le-pacte' });
  });
});
