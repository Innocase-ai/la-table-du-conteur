// `pnpm monde calibrer <temps-de-jeu.json>` : compare le temps de jeu MESURÉ (export de l'écran Options) à la durée ESTIMÉE
// de chaque histoire (`estimerCampagne`), et dit quels réglages de `RYTHME` (packages/regles/src/monde/estimation.ts) il faudrait
// pour que l'estimation tombe juste. Une mesure ne vaut que si l'histoire a été jouée jusqu'à une fin, par un joueur qui joue
// comme les autres : une seule partie est un point, pas une loi.
import { RYTHME, type Estimation } from '../../packages/regles/src/monde/estimation';

export interface LigneCalibrage {
  monde: string;
  heuresMesurees: number;
  actions: number;
  sessions: number;
  heuresEstimees: number;
  toursEstimes: number;
  /** Mesuré / estimé : 1 = juste, 1,5 = la partie a duré une fois et demie l'estimation. */
  rapport: number;
  /** Secondes de jeu par action mesurée, lecture comprise (pour information : la formule compte la lecture à part). */
  secondesParAction: number | undefined;
  /** `RYTHME.secondesParAction` qui aurait donné l'estimation juste pour cette partie (lecture et combats retirés du temps mesuré). */
  secondesParActionConseille: number;
}

export interface ResultatCalibrage {
  lignes: LigneCalibrage[];
  /** Histoires de l'export sans estimation connue (monde absent, supprimé…). */
  inconnues: string[];
  erreur?: string;
}

export function calibrer(texteExport: string, estimations: Map<string, Estimation>): ResultatCalibrage {
  let brut: unknown;
  try {
    brut = JSON.parse(texteExport);
  } catch {
    return { lignes: [], inconnues: [], erreur: "Le fichier n'est pas un JSON lisible." };
  }
  const mesures = brut && typeof brut === 'object' ? (brut as { mesures?: unknown }).mesures : undefined;
  if (!mesures || typeof mesures !== 'object') return { lignes: [], inconnues: [], erreur: "Ce n'est pas un export du temps de jeu (clé « mesures » absente)." };
  const lignes: LigneCalibrage[] = [];
  const inconnues: string[] = [];
  for (const [monde, v] of Object.entries(mesures as Record<string, unknown>)) {
    const o = v as { secondes?: unknown; actions?: unknown; sessions?: unknown } | null;
    if (!o || typeof o.secondes !== 'number' || typeof o.actions !== 'number' || o.secondes <= 0) continue;
    const e = estimations.get(monde);
    if (!e) {
      inconnues.push(monde);
      continue;
    }
    const heures = o.secondes / 3600;
    lignes.push({
      monde,
      heuresMesurees: heures,
      actions: o.actions,
      sessions: typeof o.sessions === 'number' ? o.sessions : 0,
      heuresEstimees: e.heures.total,
      toursEstimes: e.tours,
      // Une estimation à 0 h (un monde minuscule) ne doit pas donner un rapport infini : on la compte pour un quart d'heure.
      rapport: heures / Math.max(e.heures.total, 0.25),
      secondesParAction: o.actions > 0 ? o.secondes / o.actions : undefined,
      // La lecture et les combats sont comptés à part dans l'estimation : on les retire du temps mesuré pour retrouver le temps par action.
      secondesParActionConseille: Math.max(1, Math.round((o.secondes - (e.motsLus / RYTHME.motsParMinute) * 60 - e.heures.combats * 3600) / Math.max(1, e.tours))),
    });
  }
  return { lignes, inconnues };
}

/** Le rapport lisible de la commande. */
export function texteCalibrage(r: ResultatCalibrage): string {
  if (r.erreur) return `❌ ${r.erreur}`;
  const sortie: string[] = [];
  for (const l of r.lignes) {
    const sens = l.rapport > 1.15 ? 'plus long que prévu' : l.rapport < 0.85 ? 'plus court que prévu' : "conforme à l'estimation";
    sortie.push(
      `${l.monde} : ${l.heuresMesurees.toFixed(1)} h mesurées pour ${l.heuresEstimees} h estimées (${l.rapport.toFixed(2)} fois : ${sens}) ; ${l.actions} actions pour ${l.toursEstimes} tours estimés` +
        (l.secondesParAction !== undefined ? `, ${Math.round(l.secondesParAction)} s par action, lecture comprise` : '') +
        `. Il aurait fallu secondesParAction = ${l.secondesParActionConseille} (actuel : ${RYTHME.secondesParAction}, lecture à ${RYTHME.motsParMinute} mots par minute).`,
    );
  }
  for (const m of r.inconnues) sortie.push(`${m} : histoire inconnue, ignorée.`);
  if (!r.lignes.length && !r.inconnues.length) sortie.push('Aucune mesure exploitable dans ce fichier.');
  if (r.lignes.length) sortie.push('', "Une mesure ne vaut que pour une histoire jouée jusqu'à une fin ; plusieurs parties de plusieurs joueurs valent mieux qu'une seule avant de toucher à `RYTHME`.");
  return sortie.join('\n');
}
