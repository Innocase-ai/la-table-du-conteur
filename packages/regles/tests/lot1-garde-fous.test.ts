// Lot 1, groupe 4 (docs/FICHES-LOT-1.md, 18/11/2026) : J4 (garde-fous du validateur pour les futurs épisodes, M22), C5 (contrôles des défauts
// de texte de PNJ trouvés à la relecture de la Tombe) et le classement de C1 (défauts de jeu / conseils). Chaque test a été écrit avant le code.
// Le monde d'essai est le mini-monde des tests (`fixtures/mini-monde`), cassé en mémoire un défaut à la fois.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { diagnostiquerMonde } from '../src/monde/diagnostiquer';
import type { DonneesMonde } from '../src/monde/schemas';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function mini(): DonneesMonde {
  const r = chargerMonde(MINI);
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;
  dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ objet: { id: 'croc-de-loup' } }, { flag: 'croc-remis' });
  return dm;
}

/** Ce que le validateur dit en plus après la modification : les erreurs et les avis qui n'étaient pas là. */
function nouveaux(modif: (dm: DonneesMonde) => void): { erreurs: string[]; avis: string[] } {
  const base = validerMonde(mini(), srd);
  const dm = mini();
  modif(dm);
  const b = validerMonde(dm, srd);
  return { erreurs: b.erreurs.filter((x) => !base.erreurs.includes(x)), avis: b.avertissements.filter((x) => !base.avertissements.includes(x)) };
}
const un = (liste: string[], re: RegExp) => liste.filter((x) => re.test(x));

describe('J4 : le validateur voit les mondes cassés que les auteurs d’épisodes risquent d’écrire', () => {
  it('le mini-monde de départ est sain : aucune erreur', () => {
    expect(validerMonde(mini(), srd).erreurs).toEqual([]);
  });

  it('A. `debloquer` vers un lieu inexistant est une erreur', () => {
    const n = nouveaux((dm) => dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ debloquer: 'lieu-fantome' }));
    expect(un(n.erreurs, /lieu inconnu « lieu-fantome »/)).toHaveLength(1);
  });

  it('A bis. `debloquer` vers un lieu qui existe : rien de plus', () => {
    const n = nouveaux((dm) => dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ debloquer: 'grotte' }));
    expect(n.erreurs).toEqual([]);
  });

  describe('B. lieu sans chemin de retour vers un lieu sûr', () => {
    const cul = (dm: DonneesMonde) => {
      dm.lieux.get('grotte')!.liens.push({ vers: 'puits', type: 'chemin', heures: 1, sens: 'simple' } as never);
      dm.lieux.set('puits', { ...structuredClone(dm.lieux.get('grotte')!), id: 'puits', nom: 'Puits sans fond', liens: [], faits: [], rencontres: [] });
    };
    it('un lien à sens unique vers un lieu sans sortie : avis', () => {
      const n = nouveaux(cul);
      expect(un(n.avis, /Lieu « puits » : sans chemin de retour/)).toHaveLength(1);
      expect(n.erreurs).toEqual([]);
    });
    it('le même lieu avec une sortie qui ramène : rien', () => {
      const n = nouveaux((dm) => {
        cul(dm);
        dm.lieux.get('puits')!.liens.push({ vers: 'grotte', type: 'chemin', heures: 1, sens: 'simple' } as never);
      });
      expect(un(n.avis, /sans chemin de retour/)).toEqual([]);
    });
    it('un lieu à l’intérieur d’un autre (parent) a toujours sa sortie : rien', () => {
      const n = nouveaux((dm) => dm.lieux.set('cave', { ...structuredClone(dm.lieux.get('auberge')!), id: 'cave', nom: 'Cave', parent: 'auberge', repos: 'dangereux' }));
      expect(un(n.avis, /sans chemin de retour/)).toEqual([]);
    });
  });

  describe('C. conditions statiquement impossibles', () => {
    const finPaix = (dm: DonneesMonde) => dm.fins.get('fin-paix')!;
    it('F. une jauge exigée au-delà de son maximum', () => {
      const j = [...mini().jauges.values()][0]!;
      const n = nouveaux((dm) => (finPaix(dm).condition = { et: [finPaix(dm).condition, { jauge: { id: j.id, min: j.max + 5 } }] }));
      expect(un(n.avis, /impossible/)).toHaveLength(1);
      expect(un(n.avis, /impossible/)[0]).toContain(`« ${j.id} »`);
    });
    it('F bis. une jauge exigée dans ses bornes : rien', () => {
      const j = [...mini().jauges.values()][0]!;
      const n = nouveaux((dm) => (finPaix(dm).condition = { et: [finPaix(dm).condition, { jauge: { id: j.id, min: j.max } }] }));
      expect(un(n.avis, /impossible/)).toEqual([]);
    });
    it('G. un `et` qui exige une chose et son contraire', () => {
      const n = nouveaux((dm) => (finPaix(dm).condition = { et: [{ flag: 'croc-remis' }, { non: { flag: 'croc-remis' } }] }));
      expect(un(n.avis, /impossible/)).toHaveLength(1);
    });
    it('G bis. un `ou` qui propose une chose ou son contraire : rien', () => {
      const n = nouveaux((dm) => (finPaix(dm).condition = { ou: [{ flag: 'croc-remis' }, { non: { flag: 'croc-remis' } }] }));
      expect(un(n.avis, /impossible/)).toEqual([]);
    });
    it('H. un niveau de groupe exigé au-delà du niveau maximum du monde', () => {
      const n = nouveaux((dm) => (finPaix(dm).condition = { et: [finPaix(dm).condition, { niveauGroupe: { min: 15 } }] }));
      expect(un(n.avis, /impossible/)).toHaveLength(1);
      expect(un(n.avis, /impossible/)[0]).toMatch(/niveau/);
    });
    it('M. un verrou au-delà de DD 30 sans clé', () => {
      const n = nouveaux((dm) => (dm.lieux.get('sentier')!.liens[0]!.verrou = { dd: 40 } as never));
      expect(un(n.avis, /verrou/i)).toHaveLength(1);
    });
    it('M bis. le même verrou avec une clé : rien', () => {
      const n = nouveaux((dm) => (dm.lieux.get('sentier')!.liens[0]!.verrou = { dd: 40, cle: 'croc-de-loup' } as never));
      expect(un(n.avis, /verrou/i)).toEqual([]);
    });
  });

  describe('I. quête sautable : la condition du passage est évaluée sans la quête', () => {
    const objectifGrotte = (dm: DonneesMonde) => (dm.quetes.get('q-loups')!.etapes[0]!.completion = { lieu: 'grotte' } as never);
    const sautable = (n: { avis: string[] }) => un(n.avis, /sautable/);
    it('le témoin : aucun passage protégé, la quête est sautable', () => {
      expect(sautable(nouveaux(objectifGrotte))).toHaveLength(1);
    });
    it('un passage protégé par « la quête est active » : rien', () => {
      const n = nouveaux((dm) => {
        objectifGrotte(dm);
        dm.lieux.get('sentier')!.liens[0]!.condition = { quete: { id: 'q-loups', statut: 'active' } };
      });
      expect(sautable(n)).toEqual([]);
    });
    it('un passage « protégé » par { non: la quête est active } ne protège rien : avis', () => {
      const n = nouveaux((dm) => {
        objectifGrotte(dm);
        dm.lieux.get('sentier')!.liens[0]!.condition = { non: { quete: { id: 'q-loups', statut: 'active' } } };
      });
      expect(sautable(n)).toHaveLength(1);
    });
    it('un `ou` qu’un drapeau suffit à ouvrir ne protège rien : avis', () => {
      const n = nouveaux((dm) => {
        objectifGrotte(dm);
        dm.lieux.get('sentier')!.liens[0]!.condition = { ou: [{ quete: { id: 'q-loups', statut: 'active' } }, { flag: 'croc-remis' }] };
      });
      expect(sautable(n)).toHaveLength(1);
    });
    it('un `et` qui exige la quête protège encore : rien', () => {
      const n = nouveaux((dm) => {
        objectifGrotte(dm);
        dm.lieux.get('sentier')!.liens[0]!.condition = { et: [{ quete: { id: 'q-loups', statut: 'active' } }, { flag: 'croc-remis' }] };
      });
      expect(sautable(n)).toEqual([]);
    });
  });

  it('les cas déjà vus restent vus : objet, fait, étape, quête et départ inexistants', () => {
    expect(nouveaux((dm) => (dm.quetes.get('q-loups')!.etapes[1]!.completion = { objet: 'epee-longue' })).avis.some((a) => /exigé mais ne se trouve nulle part/.test(a))).toBe(true);
    expect(nouveaux((dm) => (dm.quetes.get('q-loups')!.etapes[0]!.suivantes = ['etape-fantome'])).erreurs.length).toBeGreaterThan(0);
    expect(nouveaux((dm) => dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ quete: { id: 'q-fantome', statut: 'active' } })).erreurs.length).toBeGreaterThan(0);
    expect(nouveaux((dm) => (dm.monde.depart.lieu = 'nulle-part')).erreurs.length).toBeGreaterThan(0);
  });

  it('les classements : chaque défaut de jeu a son code (ils feront échouer `verifier`)', () => {
    const codes = (modif: (dm: DonneesMonde) => void) => {
      const dm = mini();
      modif(dm);
      return new Set(diagnostiquerMonde(dm, srd).diagnostics.map((d) => d.code));
    };
    expect(codes((dm) => (dm.quetes.get('q-loups')!.etapes[1]!.completion = { objet: 'epee-longue' })).has('objet.introuvable')).toBe(true);
    expect(codes((dm) => (dm.quetes.get('q-loups')!.etapes[0]!.completion = { lieu: 'grotte' } as never)).has('quete.sautable')).toBe(true);
    expect(codes((dm) => (dm.fins.get('fin-paix')!.condition = { et: [{ flag: 'croc-remis' }, { non: { flag: 'croc-remis' } }] })).has('condition.impossible')).toBe(true);
    expect(codes((dm) => {
      dm.lieux.get('grotte')!.liens.push({ vers: 'puits', type: 'chemin', heures: 1, sens: 'simple' } as never);
      dm.lieux.set('puits', { ...structuredClone(dm.lieux.get('grotte')!), id: 'puits', liens: [], faits: [], rencontres: [] });
    }).has('lieu.sans-retour')).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// C5 : cinq contrôles pour les défauts de texte de PNJ trouvés à la relecture de la Tombe du 18/11/2026
// ---------------------------------------------------------------------------------------------------------------------------------------
import { Canon } from '../src/monde/canon';
import { RACINE_MONDES } from '../src/monde/chargeur';
import { revoirMonde } from '../src/monde/revue';

/** Un PNJ de plus dans le mini-monde, copié sur Bertrand (qui parle de loups). */
function ajouterPnj(dm: DonneesMonde, id: string, nom: string, modif: (p: DonneesMonde['pnj'] extends Map<string, infer P> ? P : never) => void = () => {}): void {
  const p = structuredClone(dm.pnj.get('bertrand')!);
  p.id = id;
  p.nom = nom;
  p.sujets = [];
  p.savoir = [];
  p.services = [];
  p.boutique = undefined;
  modif(p);
  dm.pnj.set(id, p);
}
const compagnon = { classe: 'guerrier', espece: 'humain', niveau: 1, repliques: [], opinions: [] };
const sujetSimple = (id: string, extra: Record<string, unknown> = {}) => ({ id, mots: ['avis'], reponse: 'Je ne sais rien.', variantes: [], revele: [], effets: [], unique: false, ...extra });

describe('C5 (a) : un renvoi « demandez à X » vers un PNJ sans aucun sujet', () => {
  const dire = (texte: string) => (dm: DonneesMonde) => {
    ajouterPnj(dm, 'odile', 'Odile');
    dm.pnj.get('bertrand')!.sujets[0]!.reponse = texte;
  };
  it('signalé comme conseil (heuristique de langage)', () => {
    const n = nouveaux(dire('Ils descendent depuis une semaine. Demandez à Odile, elle les a vus.'));
    const a = un(n.avis, /renvoie vers « odile »/);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatch(/aucun sujet/);
  });
  it('le même renvoi vers un PNJ qui a un sujet : rien', () => {
    const n = nouveaux((dm) => {
      dire('Ils descendent depuis une semaine. Demandez à Odile, elle les a vus.')(dm);
      dm.pnj.get('odile')!.sujets = [sujetSimple('odile-loups')] as never;
    });
    expect(un(n.avis, /renvoie vers/)).toEqual([]);
  });
  it('un verbe sans renvoi, ou un nom qui n’est pas un PNJ : rien', () => {
    expect(un(nouveaux(dire('Odile et moi, nous avons peur des loups.')).avis, /renvoie vers/)).toEqual([]);
    expect(un(nouveaux(dire('Demandez à Brindoux ce qu’on y pense, tout le monde sait.')).avis, /renvoie vers/)).toEqual([]);
  });
});

describe('C5 (b) : une interjection de compagnon qui en nomme un autre sans condition de présence', () => {
  const avecDeuxCompagnons = (quand: unknown) => (dm: DonneesMonde) => {
    dm.pnj.get('bertrand')!.compagnon = structuredClone(compagnon) as never;
    ajouterPnj(dm, 'odile', 'Odile', (p) => {
      p.compagnon = structuredClone(compagnon) as never;
      p.sujets = [sujetSimple('odile-loups')] as never;
    });
    (dm.extensions ??= {})['interjections'] = [{ id: 'i-grotte', pnj: 'bertrand', quand, texte: 'Odile, restez derrière moi dans cette grotte !', effets: [] }];
  };
  it('signalé quand la condition ne parle d’aucun drapeau', () => {
    const a = un(nouveaux(avecDeuxCompagnons({ lieu: 'grotte' })).avis, /nomme « odile » sans condition de présence/);
    expect(a).toHaveLength(1);
    expect(a[0]).toContain('Interjection « i-grotte »');
  });
  it('rien avec un drapeau de recrutement dans la condition', () => {
    expect(un(nouveaux(avecDeuxCompagnons({ et: [{ lieu: 'grotte' }, { flag: 'odile-recrutee' }] })).avis, /sans condition de présence/)).toEqual([]);
  });
});

describe('C5 (c) : une variante hostile sur un sujet fermé aux hostiles (texte mort)', () => {
  const variante = (max: number, porte: { attitudeMin?: number; condition?: unknown }) => (dm: DonneesMonde) => {
    const s = dm.pnj.get('bertrand')!.sujets[0]!;
    Object.assign(s, porte);
    s.variantes = [{ condition: { pnj: { id: 'bertrand', attitudeMax: max } }, reponse: 'Allez-vous-en, étrangers, ou vous le regretterez.' }];
  };
  it('signalé : la variante n’est lue qu’à −20 ou moins, le sujet exige 20', () => {
    const a = un(nouveaux(variante(-20, { attitudeMin: 20 })).avis, /texte mort/);
    expect(a).toHaveLength(1);
    expect(a[0]).toContain('« bertrand »');
  });
  it('signalé aussi quand la porte est une condition d’attitude', () => {
    expect(un(nouveaux(variante(-20, { condition: { pnj: { id: 'bertrand', attitudeMin: 10 } } })).avis, /texte mort/)).toHaveLength(1);
  });
  it('rien : le sujet est ouvert à cette attitude, ou n’a aucune porte', () => {
    expect(un(nouveaux(variante(40, { attitudeMin: 20 })).avis, /texte mort/)).toEqual([]);
    expect(un(nouveaux(variante(-20, {})).avis, /texte mort/)).toEqual([]);
  });
});

describe('C5 (d) : un drapeau lu qui diffère d’un caractère d’un drapeau posé', () => {
  const lire = (flag: string) => (dm: DonneesMonde) => {
    dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ flag: 'mireille-recruite' });
    ajouterPnj(dm, 'odile', 'Odile', (p) => {
      p.sujets = [sujetSimple('avis', { condition: { flag } })] as never;
    });
  };
  it('signale le drapeau voisin', () => {
    const a = un(nouveaux(lire('mireille-recrute')).avis, /« mireille-recrute » est lu mais jamais posé/);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatch(/Vouliez-vous dire « mireille-recruite »/);
  });
  it('un drapeau lu sans voisin proche : l’avis reste, sans suggestion', () => {
    const a = un(nouveaux(lire('tout-autre-drapeau')).avis, /« tout-autre-drapeau » est lu mais jamais posé/);
    expect(a).toHaveLength(1);
    expect(a[0]).not.toMatch(/Vouliez-vous dire/);
  });
});

describe('C5 (e) : un fait de secret détenu par un PNJ que le canon n’autorise pas', () => {
  const canon = (autorise: string[]) => Canon.parse({ secrets: [{ id: 'secret-loups', texte: 'Les loups viennent de la grotte.', fait: 'f-taniere', motsTabou: [], autorise }], noms: { lexique: [] }, personnages: [] });
  const avecDetenteur = (via: 'savoir' | 'secret') => {
    const dm = mini();
    ajouterPnj(dm, 'odile', 'Odile', (p) => {
      if (via === 'secret') p.secrets = [{ fait: 'f-taniere' }];
      p.sujets = [sujetSimple('avis')] as never;
    });
    if (via === 'savoir') (dm.extensions ??= {})['savoirs'] = [{ pnj: 'odile', passe: 'Une vie simple.', sait: [{ id: 'sait-taniere', fait: 'f-taniere', version: 'Elle sait où est la tanière.' }] }];
    return dm;
  };
  const alertes = (dm: DonneesMonde, autorise: string[]) => revoirMonde(dm, canon(autorise)).filter((d) => d.code === 'revue.fait-non-autorise');
  it('signalé, que le PNJ le détienne par son savoir ou par un secret', () => {
    for (const via of ['savoir', 'secret'] as const) {
      const a = alertes(avecDetenteur(via), []);
      expect(a, via).toHaveLength(1);
      expect(a[0]!.message).toContain('« odile »');
      expect(a[0]!.entite).toEqual({ type: 'pnj', id: 'odile' });
    }
  });
  it('rien quand le canon l’autorise (par son PNJ, ou par sa fiche de savoir)', () => {
    expect(alertes(avecDetenteur('savoir'), ['pnj:odile'])).toEqual([]);
    expect(alertes(avecDetenteur('secret'), ['savoirs:odile'])).toEqual([]);
  });
});

describe('C5 sur les histoires publiées', () => {
  const charge = (id: string) => {
    const r = chargerMonde(join(RACINE_MONDES, id));
    if (!r.ok) throw new Error(id);
    return r.monde;
  };
  const textes = (dm: DonneesMonde) => validerMonde(dm, srd).avertissements.filter((a) => /renvoie vers|sans condition de présence|texte mort|Vouliez-vous dire/.test(a));
  it('la Tombe : aucun des contrôles du validateur (les défauts de la relecture sont corrigés)', () => {
    expect(textes(charge('tombe-des-rois-serpents'))).toEqual([]);
  });
  it('la Dîme et la Marche : aucun faux positif', () => {
    expect(textes(charge('dime-des-roseaux'))).toEqual([]);
    expect(textes(charge('marche-d-ombrefiel'))).toEqual([]);
  });
});
