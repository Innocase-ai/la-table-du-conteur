// Ce que montre la boîte de dialogue : tout l'échange de la conversation en cours (et non la seule dernière réplique du
// personnage), et le texte d'un jet d'influence annoncé sur son bouton. Fichier pur, testé à part.
import type { EvenementJeu, Proposition } from '@crpg/regles';
import { NOMS_COMPETENCES } from '../createur/libelles';

/** Au-delà, l'échange le plus ancien sort de la boîte (une conversation très longue reste lisible et légère). */
export const ENTREES_MAX = 120;

const estParole = (e: EvenementJeu, pnj: string) => e.type === 'texte' && e.voix === pnj;

/**
 * Tout l'échange de la conversation en cours : de la première parole du personnage (sa salutation) jusqu'à la fin du journal,
 * avec ce qui s'est dit, appris et joué depuis (réponses, jets d'influence, faits). `debut` est l'indice du journal où la
 * conversation s'est ouverte, quand l'écran le sait ; sans lui (partie rechargée en pleine conversation), on remonte la
 * fin du journal jusqu'à l'arrivée au lieu, à une saisie du joueur, au récit du conteur ou à la parole d'un autre personnage.
 */
export function entreesDeConversation(journal: EvenementJeu[], pnj: string, debut?: number): EvenementJeu[] {
  if (debut !== undefined && debut >= 0 && debut <= journal.length) {
    const depuis = journal.slice(debut);
    if (depuis.some((e) => estParole(e, pnj))) return plafonner(depuis);
  }
  let premiere = -1;
  for (let i = journal.length - 1; i >= 0; i--) {
    const e = journal[i]!;
    if (e.type === 'arrivee' || e.type === 'deplacement' || e.type === 'saisieJoueur' || e.type === 'recitConteur') break;
    if (e.type === 'texte' && e.voix && e.voix !== pnj) break;
    if (estParole(e, pnj)) premiere = i;
    if (journal.length - i > ENTREES_MAX * 2) break;
  }
  // Sans parole du personnage (cas limite), on garde la fin du journal jusqu'à une rupture, comme avant.
  if (premiere < 0) {
    const res: EvenementJeu[] = [];
    for (let i = journal.length - 1; i >= 0 && res.length < 12; i--) {
      const e = journal[i]!;
      if (e.type === 'arrivee' || e.type === 'deplacement' || e.type === 'saisieJoueur' || e.type === 'recitConteur') break;
      if (e.type === 'texte' && e.voix && e.voix !== pnj) break;
      res.unshift(e);
    }
    return res;
  }
  return plafonner(journal.slice(premiere));
}

const plafonner = (entrees: EvenementJeu[]) => (entrees.length > ENTREES_MAX ? entrees.slice(-ENTREES_MAX) : entrees);

/** L'indice de la dernière parole du personnage dans l'échange : la réponse mise en avant ; −1 s'il n'a encore rien dit. */
export function indiceDerniereParole(entrees: EvenementJeu[], pnj: string): number {
  for (let i = entrees.length - 1; i >= 0; i--) if (estParole(entrees[i]!, pnj)) return i;
  return -1;
}

/** Les lignes que montre un bouton d'influence : « Persuasion · DD 15 », « Hilda +4 » et l'éventuel Avantage ou Désavantage. */
export interface JetAnnonce {
  competence: string;
  dd?: number;
  qui?: string;
  bonus?: string;
  mode?: 'Avantage' | 'Désavantage';
  /** Tout sur une ligne : « Persuasion DD 15 · Hilda +4 (Avantage) ». */
  texte: string;
}

const signe = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export function jetAnnonce(jet: NonNullable<Proposition['jet']>): JetAnnonce {
  const competence = NOMS_COMPETENCES[jet.test as keyof typeof NOMS_COMPETENCES] ?? jet.test;
  const mode = jet.mode === 'avantage' ? 'Avantage' : jet.mode === 'desavantage' ? 'Désavantage' : undefined;
  const bonus = jet.bonus === undefined ? undefined : signe(jet.bonus);
  const orateur = jet.qui ? `${jet.qui}${bonus ? ` ${bonus}` : ''}` : bonus;
  const texte = `${competence}${jet.dd !== undefined ? ` DD ${jet.dd}` : ''}${orateur ? ` · ${orateur}` : ''}${mode ? ` (${mode})` : ''}`;
  return { competence, dd: jet.dd, qui: jet.qui, bonus, mode, texte };
}
