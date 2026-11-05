// Module Examens : regarder de près un détail du lieu (une inscription, un objet, une trace). Le texte vient du monde,
// écrit par son auteur : le conteur ne l'invente pas, il appelle `examiner` et le jeu répond. Ce qu'on lit peut changer
// selon ce que le groupe sait déjà (variantes), et la première lecture peut apprendre un fait ou poser un drapeau.
import { z } from 'zod';
import { evaluerCondition } from '../monde/etat';
import { examensDe, LECTURE_DE_BASE, type Examen } from '../monde/examens-donnees';
import { jouerEffets } from '../monde/exploration';
import { nbMots } from '../monde/savoirs-donnees';
import { commande, type ContexteJeu, type Module, type Partie, type Proposition } from '../noyau/types';
import { enExploration, libre, PANNEAUX, partieMonde, verser } from './commun';

export interface EtatExamens {
  /** Les lectures déjà faites : id de l'examen → ids des lectures vues (« base », puis les variantes). */
  vus: Record<string, string[]>;
}

const etat = (p: Partie): EtatExamens => ((p.modules['examens'] ??= { vus: {} }) as EtatExamens);

/** La lecture qu'on obtient maintenant : la dernière variante dont la condition est vraie, sinon la lecture de base. */
export function lectureActuelle(e: Examen, p: Partie): { id: string; texte: string; effets: Examen['effets'] } {
  const v = [...e.variantes].reverse().find((x) => evaluerCondition(x.condition, p.etat));
  return v ? { id: v.id, texte: v.texte, effets: v.effets } : { id: LECTURE_DE_BASE, texte: e.texte, effets: e.effets };
}

/** Les examens qu'on peut faire ici et maintenant. */
export function examensIci(ctx: ContexteJeu, p: Partie): Examen[] {
  return examensDe(ctx.dm).examens.filter((e) => e.lieu === p.etat.lieu && (!e.visible || evaluerCondition(e.visible, p.etat)));
}

/** Cet examen a-t-il déjà donné la lecture qu'il donnerait maintenant ? */
export const dejaLu = (e: Examen, p: Partie): boolean => (etat(p).vus[e.id] ?? []).includes(lectureActuelle(e, p).id);

export const moduleExamens: Module = {
  id: 'examens',
  etatInitial: (): EtatExamens => ({ vus: {} }),
  commandes: {
    examiner: commande({
      description:
        'Regarder de près un détail du lieu (inscription, objet, trace, tapisserie…) : le jeu donne le texte écrit pour ce détail. À appeler dès que le joueur veut examiner, lire, observer de près ou inspecter quelque chose listé dans « À examiner ici » de la fiche, avec son id ; ne décris jamais toi-même ce que ce texte contient.',
      entree: z.object({ examen: z.string().describe('Id du détail, tel que la fiche le donne dans « À examiner ici ».') }),
      disponible: libre,
      executer: (t, e) => {
        const ex = examensDe(t.ctx.dm).examens.find((x) => x.id === e.examen);
        if (!ex) return { refus: `Il n’y a rien de ce nom à examiner. Ne décris pas ce détail : s’il n’est pas dans « À examiner ici », il n’a rien de particulier à révéler.` };
        if (ex.lieu !== t.partie.etat.lieu || (ex.visible && !evaluerCondition(ex.visible, t.partie.etat))) return { refus: `« ${ex.nom} » n’est pas à portée d’examen ici.` };
        const lecture = lectureActuelle(ex, t.partie);
        const vus = (etat(t.partie).vus[ex.id] ??= []);
        const premiere = !vus.includes(lecture.id);
        if (premiere) vus.push(lecture.id);
        const cr = jouerEffets(partieMonde(t), [], premiere ? lecture.effets : []);
        cr.narrations.unshift(lecture.texte);
        for (const r of ex.regards.filter((x) => evaluerCondition(x.condition, t.partie.etat)).slice(0, 2)) cr.narrations.push(r.texte);
        return verser(t, cr);
      },
      propositions: (ctx, p): Proposition[] =>
        enExploration(p)
          ? examensIci(ctx, p).map((x) => {
              const lu = dejaLu(x, p);
              const relire = (etat(p).vus[x.id] ?? []).length > 0 && !lu;
              return {
                groupe: PANNEAUX.objets,
                element: { id: `examen:${x.id}`, titre: x.nom },
                libelle: relire ? 'Examiner de nouveau' : 'Examiner',
                icone: 'base:indice',
                aide: x.apercu,
                style: lu ? 'discret' : 'normal',
                ordre: { type: 'examiner', examen: x.id },
              } satisfies Proposition;
            })
          : [],
    }),
  },
  valider: (ctx) => {
    const { examens, erreurs } = examensDe(ctx.dm);
    const ids = examens.map((e) => e.id);
    for (const id of ids.filter((x, k) => ids.indexOf(x) !== k)) erreurs.push(`Examen « ${id} » : identifiant en double.`);
    for (const e of examens) {
      if (!ctx.dm.lieux.has(e.lieu)) erreurs.push(`Examen « ${e.id} » : lieu inconnu « ${e.lieu} ».`);
      const vs = e.variantes.map((v) => v.id);
      for (const v of vs.filter((x, k) => vs.indexOf(x) !== k || x === LECTURE_DE_BASE)) erreurs.push(`Examen « ${e.id} » : variante « ${v} » en double ou réservée.`);
    }
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    const { examens } = examensDe(ctx.dm);
    for (const e of examens) {
      const n = nbMots(e.texte);
      if (n < 25) avis.push(`Examen « ${e.id} » : ${n} mots ; visez 40 à 110, avec des détails concrets (matière, gravure, trace, odeur).`);
      if (n > 130) avis.push(`Examen « ${e.id} » : ${n} mots ; 110 au plus.`);
      for (const r of e.regards) if (nbMots(r.texte) > 40) avis.push(`Examen « ${e.id} », regard d'origine : plus de 40 mots ; une phrase.`);
      for (const v of e.variantes) if (nbMots(v.texte) > 130) avis.push(`Examen « ${e.id} », variante « ${v.id} » : plus de 130 mots.`);
    }
    const lieux = new Set(examens.map((e) => e.lieu));
    if (examens.length && lieux.size < Math.min(ctx.dm.lieux.size / 3, 20)) avis.push(`Examens : ${lieux.size} lieu(x) sur ${ctx.dm.lieux.size} ont un détail à examiner ; visez au moins un tiers (ou 20 pour un grand monde : inscriptions, objets, traces qui racontent le lieu).`);
    if (!examens.some((e) => e.variantes.length)) avis.push('Examens : aucune variante ; au moins un détail devrait se lire autrement une fois un fait appris (le lore se recoupe).');
    return avis;
  },
};
