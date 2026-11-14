// Le diagnostic complet d'un monde : le validateur, les modules, l'audit des énigmes (comme `pnpm monde valider`), plus les
// contrôles de l'atelier. `erreurs` et `avertissements` reprennent MOT POUR MOT ce que le CLI affiche ; `diagnostics` les range
// (code, gravité, entité) et y ajoute les contrôles statiques de l'atelier.
import type { Donnees } from '../donnees';
import { MODULES_STANDARD } from '../modules';
import { auditerEnigmes } from '../verification/enigmes';
import { problemesDeChargement } from './assemblage';
import { controlerMonde } from './controles';
import { diagnosticsDeModule, entiteDuMessage, type Diagnostic } from './diagnostics';
import { indexerReferences, type IndexReferences } from './references';
import type { DonneesMonde } from './schemas';
import { validerMonde, type StatsMonde } from './validation';

export interface DiagnosticMonde {
  erreurs: string[];
  avertissements: string[];
  diagnostics: Diagnostic[];
  stats: StatsMonde;
  index: IndexReferences;
}

export function diagnostiquerMonde(dm: DonneesMonde, srd: Donnees): DiagnosticMonde {
  const bilan = validerMonde(dm, srd);
  const erreurs = [...bilan.erreurs];
  const avertissements = [...bilan.avertissements];
  const diagnostics = [...bilan.diagnostics];
  // Les données des modules (scènes narrées, savoirs, dilemmes…) : chaque module vérifie les siennes.
  for (const m of MODULES_STANDARD) {
    const es = m.valider?.({ dm, srd }) ?? [];
    const as = m.conseils?.({ dm, srd }) ?? [];
    erreurs.push(...es.map((e) => `[${m.id}] ${e}`));
    avertissements.push(...as.map((a) => `[${m.id}] ${a}`));
    diagnostics.push(...diagnosticsDeModule(m.id, es, 'erreur'), ...diagnosticsDeModule(m.id, as, 'avis'));
  }
  // Les énigmes se jouent : une énigme qu'on ne peut pas résoudre par ses boutons est une erreur du monde.
  for (const rap of auditerEnigmes(dm, srd)) {
    for (const x of rap.verifications.filter((v) => !v.ok)) {
      const message = `« ${rap.nom} » (${x.id}) : ${x.detail}`;
      (x.gravite === 'erreur' ? erreurs : avertissements).push(`[énigmes] ${message}`);
      diagnostics.push({ code: `enigme.${x.id}`, gravite: x.gravite === 'erreur' ? 'erreur' : 'avis', message, entite: { type: 'enigmes', id: rap.id }, source: 'enigmes' });
    }
  }
  // Ce que le chargement laisse passer : un dossier que le moteur ne connaît pas (tout son contenu est ignoré), une clé de fiche inconnue
  // (faute de frappe : sans effet). Les fiches d'extension invalides sont déjà dites par leur module ci-dessus.
  for (const message of problemesDeChargement(dm).avis) {
    avertissements.push(message);
    const entite = entiteDuMessage(message);
    diagnostics.push({ code: 'chargement.inconnu', gravite: 'avis', message, ...(entite ? { entite } : {}), source: 'validation' });
  }
  const index = indexerReferences(dm);
  diagnostics.push(...controlerMonde(dm, index));
  return { erreurs, avertissements, diagnostics, stats: bilan.stats, index };
}
