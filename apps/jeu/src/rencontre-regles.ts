// Règles pures de l'écran de rencontre : ce qu'on dit du danger, d'un jet annoncé, et ce qui s'est passé depuis que la
// rencontre s'est montrée (une issue tentée et ratée). Sans React : testé à part (`rencontre-regles.test.ts`).
import type { EvenementJeu, PresentationRencontre, Proposition } from '@crpg/regles';
import { nomDuTest } from './evenement-regles';

export const DANGERS: Record<PresentationRencontre['difficulte'], { libelle: string; ton: 'faible' | 'modere' | 'eleve' }> = {
  faible: { libelle: 'Danger faible', ton: 'faible' },
  moderee: { libelle: 'Danger modéré', ton: 'modere' },
  elevee: { libelle: 'Danger élevé', ton: 'eleve' },
};

/** « Persuasion DD 13 · Hilda +5 » : la compétence, le DD et qui le tenterait. */
export function libelleJetAnnonce(jet: NonNullable<Proposition['jet']>): string {
  const signe = (n: number) => (n >= 0 ? `+${n}` : String(n));
  return [`${nomDuTest(jet.test)}${jet.dd !== undefined ? ` DD ${jet.dd}` : ''}`, jet.qui ? `${jet.qui}${jet.bonus !== undefined ? ` ${signe(jet.bonus)}` : ''}` : ''].filter(Boolean).join(' · ');
}

/**
 * Ce qui s'est passé depuis que la rencontre s'est montrée (« Rencontre : <nom>. ») : jets et constats d'une issue tentée,
 * pour que le joueur voie pourquoi la rencontre attend encore. Vide au premier regard.
 */
export function suitesDeRencontre(journal: EvenementJeu[], nom: string): string[] {
  const debut = journal.map((e) => e.type === 'constat' && e.texte === `Rencontre : ${nom}.`).lastIndexOf(true);
  if (debut < 0) return [];
  const res: string[] = [];
  for (const e of journal.slice(debut + 1)) {
    if (e.type === 'jet') res.push(`${e.jet.nom} — ${nomDuTest(e.jet.test)} : ${e.jet.total}${e.jet.ddSecret ? '' : ` contre DD ${e.jet.dd}`}, ${e.jet.reussite ? 'réussi' : 'raté'}`);
    else if (e.type === 'constat') res.push(e.texte);
  }
  return res.slice(-4);
}

/** L'ordre de lecture des boutons : « Combattre » d'abord, les autres issues, puis « Se replier ». */
export function ordreDesChoix(propositions: Proposition[]): Proposition[] {
  const rang = (p: Proposition) => (p.intention === 'combattre' ? 0 : p.ordre?.type === 'reglerRencontre' && (p.ordre as { issue?: string }).issue === 'fuite' ? 2 : 1);
  return [...propositions].sort((a, b) => rang(a) - rang(b));
}
