// Module Codex : ce que le groupe sait, rangé par rubrique avec sa source (où, quand, auprès de qui), et les questions
// que le monde lui pose (en suspens, puis éclaircies). Remplace la liste plate des notes du journal : un joueur qui revient
// à la partie après une semaine retrouve le fil, et le conteur répond « que savons-nous ? » d'après les mêmes fiches.
import { questionsDe, type Question } from '../monde/codex-donnees';
import { evaluerCondition } from '../monde/etat';
import type { Fait } from '../monde/schemas';
import type { ContexteJeu, Encart, FicheInfo, Module, Partie } from '../noyau/types';

export interface SourceFait {
  lieu: string;
  jour: number;
  /** L'interlocuteur, si le fait a été appris en conversation. */
  par?: string;
}
export interface EtatCodex {
  /** D'où vient chaque fait appris. */
  sources: Record<string, SourceFait>;
}

const etat = (p: Partie): EtatCodex => ((p.modules['codex'] ??= { sources: {} }) as EtatCodex);

/** Les rubriques, dans l'ordre d'affichage. */
const RUBRIQUES: { id: string; titre: string; categories: Fait['categorie'][] }[] = [
  { id: 'histoire', titre: 'Ce que nous savons de l’histoire', categories: ['histoire', 'secret'] },
  { id: 'indices', titre: 'Indices', categories: ['indice'] },
  { id: 'lieux', titre: 'Lieux', categories: ['lieu'] },
  { id: 'personnes', titre: 'Personnes', categories: ['pnj'] },
  { id: 'factions', titre: 'Factions', categories: ['faction'] },
  { id: 'rumeurs', titre: 'Rumeurs', categories: ['rumeur'] },
];

/** Les questions que le groupe se pose maintenant, et celles qu'il a éclaircies. */
export function questions(ctx: ContexteJeu, p: Partie): { ouvertes: Question[]; eclaircies: Question[] } {
  const ouvertes: Question[] = [];
  const eclaircies: Question[] = [];
  for (const q of questionsDe(ctx.dm).questions) {
    if (!evaluerCondition(q.quand, p.etat) && !evaluerCondition(q.resolue, p.etat)) continue;
    (evaluerCondition(q.resolue, p.etat) ? eclaircies : ouvertes).push(q);
  }
  return { ouvertes, eclaircies };
}

const premiereFrase = (t: string): string => {
  const f = t.split(/(?<=[.!?])\s/)[0] ?? t;
  return f.length > 70 ? `${f.slice(0, 67).trimEnd()}…` : f;
};

function ficheDeFait(ctx: ContexteJeu, f: Fait, s: SourceFait | undefined, rubrique: string): FicheInfo {
  const proprietes: FicheInfo['proprietes'] = [{ libelle: 'Rubrique', valeur: rubrique }];
  if (f.categorie === 'rumeur') proprietes.push({ libelle: 'Fiabilité', valeur: f.fiable ? 'recoupée' : 'non vérifiée' });
  if (s) {
    const lieu = ctx.dm.lieux.get(s.lieu)?.nom;
    if (lieu) proprietes.push({ libelle: 'Appris à', valeur: lieu });
    proprietes.push({ libelle: 'Jour', valeur: String(s.jour) });
    const par = s.par ? ctx.dm.pnj.get(s.par)?.nom : undefined;
    if (par) proprietes.push({ libelle: 'Auprès de', valeur: par });
  }
  return { rubrique: 'Ce que nous savons', titre: premiereFrase(f.texte), sousTitre: rubrique, proprietes, texte: f.texte };
}

export const moduleCodex: Module = {
  id: 'codex',
  etatInitial: (): EtatCodex => ({ sources: {} }),
  reactions: {
    faitAppris: (t, e) => {
      const es = etat(t.partie);
      if (es.sources[e.fait]) return;
      const scene = t.partie.scene;
      es.sources[e.fait] = { lieu: t.partie.etat.lieu, jour: t.partie.etat.jour, ...(scene.type === 'dialogue' ? { par: scene.pnj } : {}) };
    },
  },
  encarts: (ctx, p): Encart[] => {
    const sources = etat(p).sources;
    const res: Encart[] = [];
    const { ouvertes, eclaircies } = questions(ctx, p);
    res.push({
      onglet: 'Journal',
      id: 'codex-questions',
      titre: 'Questions en suspens',
      ordre: 2,
      texte: ouvertes.length ? undefined : 'Aucune question pour l’instant : le monde vous en posera.',
      lignes: ouvertes.map((q) => ({ libelle: q.texte, detail: q.piste, ton: 'fort' as const })),
    });
    // Les faits connus, du plus récent au plus ancien, par rubrique. Une rumeur non vérifiée y figure, marquée comme telle.
    const connus = [...p.etat.faits].reverse().map((id) => ctx.dm.faits.get(id)).filter((f): f is Fait => !!f);
    RUBRIQUES.forEach((r, i) => {
      const lignes = connus.filter((f) => r.categories.includes(f.categorie));
      if (!lignes.length) return;
      res.push({
        onglet: 'Journal',
        id: `codex-${r.id}`,
        titre: r.titre,
        ordre: 3 + i,
        lignes: lignes.map((f) => {
          const s = sources[f.id];
          const lieu = s ? ctx.dm.lieux.get(s.lieu)?.nom : undefined;
          const par = s?.par ? ctx.dm.pnj.get(s.par)?.nom : undefined;
          const origine = s && lieu ? `Appris à ${lieu}, jour ${s.jour}${par ? `, auprès de ${par}` : ''}.` : undefined;
          const detail = [f.categorie === 'rumeur' && !f.fiable ? 'Rumeur non vérifiée.' : undefined, origine].filter(Boolean).join(' ') || undefined;
          return {
            libelle: f.texte,
            detail,
            ton: f.categorie === 'rumeur' && !f.fiable ? ('faible' as const) : f.importance >= 3 ? ('fort' as const) : undefined,
            fiche: ficheDeFait(ctx, f, s, r.titre),
          };
        }),
      });
    });
    if (eclaircies.length)
      res.push({
        onglet: 'Journal',
        id: 'codex-eclaircies',
        titre: 'Questions éclaircies',
        ordre: 10,
        lignes: eclaircies.map((q) => ({ libelle: q.texte, detail: q.reponse, ton: 'succes' as const })),
      });
    return res;
  },
  valider: (ctx) => {
    const { questions: qs, erreurs } = questionsDe(ctx.dm);
    const ids = qs.map((q) => q.id);
    for (const id of ids.filter((x, k) => ids.indexOf(x) !== k)) erreurs.push(`Question « ${id} » : identifiant en double.`);
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    const { questions: qs } = questionsDe(ctx.dm);
    if (qs.length > 0 && qs.length < 10) avis.push(`Codex : ${qs.length} question(s) ; visez 10 à 15, chacune fermée par un fait que le groupe peut apprendre.`);
    for (const q of qs) {
      if (!q.piste) avis.push(`Question « ${q.id} » : sans piste ; dites où chercher, sans révéler la réponse.`);
      if (q.texte.split(/\s+/).length > 20) avis.push(`Question « ${q.id} » : plus de 20 mots ; une question courte.`);
    }
    return avis;
  },
};
