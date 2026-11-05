// Contrôles statiques de l'atelier : ce que le validateur historique ne dit pas, tiré de l'index des références.
// Ils ne s'ajoutent PAS aux erreurs et avertissements du CLI (dont la sortie reste inchangée) : ils vont dans `diagnostics`.
import type { Diagnostic } from './diagnostics';
import { conditionSatisfiable, produitPar, type IndexReferences } from './references';
import { dilemmesDe } from './dilemmes-donnees';
import type { DonneesMonde } from './schemas';

export function controlerMonde(dm: DonneesMonde, idx: IndexReferences): Diagnostic[] {
  const res: Diagnostic[] = [];
  const noter = (code: string, gravite: Diagnostic['gravite'], message: string, type: string, id: string, chemin?: (string | number)[]) =>
    res.push({ code, gravite, message, entite: { type, id }, ...(chemin ? { chemin } : {}), source: 'controles' });

  // Une fin se déclenche quand sa condition devient vraie, ou par un effet « fin ». Si ni l'un ni l'autre n'est possible, elle n'arrivera jamais.
  for (const f of dm.fins.values()) {
    if (!conditionSatisfiable(f.condition, idx, dm) && !produitPar(idx, 'fin', f.id).length)
      noter('fin.inatteignable', 'avis', `Fin « ${f.id} » : sa condition ne peut jamais être vraie (un drapeau, un fait ou un objet qu'elle exige n'est produit nulle part) et aucun effet « fin » ne la déclenche.`, 'fins', f.id, ['condition']);
  }
  // Un dilemme dont la condition `quand` ne peut jamais être vraie ne s'ouvre jamais.
  for (const d of dilemmesDe(dm).dilemmes) {
    if (!conditionSatisfiable(d.quand, idx, dm)) noter('dilemme.quand-impossible', 'avis', `Dilemme « ${d.id} » : sa condition « quand » ne peut jamais être vraie (un drapeau, un fait ou un objet exigé n'est produit nulle part) : il ne s'ouvrira jamais.`, 'dilemmes', d.id, ['quand']);
  }
  // Un passage à sens unique sans aucun autre chemin de retour : le groupe ne pourra pas revenir par là.
  for (const l of dm.lieux.values()) {
    l.liens.forEach((k, i) => {
      if (k.sens !== 'simple') return;
      const but = dm.lieux.get(k.vers);
      if (!but || but.parent === l.id || l.parent === but.id) return; // l'arbre parent / enfant donne déjà le chemin du retour
      if (but.liens.some((r) => r.vers === l.id)) return;
      noter('lien.reciproque-manquant', 'conseil', `Lieu « ${l.id} », lien vers « ${k.vers} » : sens unique, et « ${k.vers} » n'a aucun passage vers « ${l.id} » (le groupe ne pourra pas y revenir par là).`, 'lieux', l.id, ['liens', i]);
    });
  }
  return res;
}
