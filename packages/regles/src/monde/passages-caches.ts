// Les passages cachés entre deux niveaux : un passage secret dont le DD est dans la Perception passive du groupe conseillé se trouve à
// l'arrivée, sans jet. S'il relie deux niveaux différents, le plus profond devient accessible sans passer par ce qui est entre les deux
// (la Tombe des Rois Serpents l'a montré : le niveau 3 à portée du bivouac, audit du moteur du 18/11/2026, M13). Avis, jamais erreur.
import { groupeConseille, bilanPersonnage } from '../creation/groupe';
import type { Donnees } from '../donnees';
import type { DonneesMonde } from './schemas';

/** Les « niveaux » sont ceux des lieux (`Lieu.niveau`) ; un lieu qui n'en a pas ne dit rien : le contrôle le laisse de côté. */
export function avisPassagesCaches(dm: DonneesMonde, srd: Donnees): string[] {
  const avis: string[] = [];
  const passif = new Map<number, number>();
  /** La meilleure Perception passive du groupe conseillé à ce niveau. */
  const perceptionPassive = (niveau: number): number => {
    let v = passif.get(niveau);
    if (v === undefined) {
      v = Math.max(...groupeConseille(niveau, srd).emplacements.map((e) => (e ? bilanPersonnage(e, srd).fiche?.perceptionPassive ?? 0 : 0)));
      passif.set(niveau, v);
    }
    return v;
  };
  for (const de of dm.lieux.values()) {
    for (const lien of de.liens) {
      const vers = dm.lieux.get(lien.vers);
      if (!vers || !de.niveau || !vers.niveau || !lien.cache || lien.cache.competence !== 'perception') continue;
      const [a, b] = [de.niveau.min, vers.niveau.min];
      if (a === b) continue;
      // Une sortie à sens unique vers le niveau le moins profond ne fait sauter aucun niveau : c'est un raccourci de retour.
      if (lien.sens === 'simple' && b < a) continue;
      const passive = perceptionPassive(Math.min(a, b));
      if (lien.cache.dd > passive) continue;
      avis.push(`Passage caché « ${de.id} » → « ${vers.id} » (niveaux ${a} et ${b}) : DD ${lien.cache.dd} dans la Perception passive du groupe conseillé (${passive}), il se trouve à l'arrivée sans jet et fait sauter ce qui sépare les deux niveaux. Relevez le DD au-dessus de ${passive}, ou rendez-le à sens unique du plus profond vers le moins profond (\`sens: "simple"\`).`);
    }
  }
  return avis;
}
