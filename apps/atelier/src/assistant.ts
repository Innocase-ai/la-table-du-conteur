// L'assistant d'écriture de l'atelier : ce qu'on demande au modèle (consignes, contexte du monde, cible de longueur) et ce qu'on
// vérifie sur sa proposition avant que l'auteur l'applique (mots tabou du canon, longueur). Fonctions pures ; l'appel passe par le
// relais du serveur de l'atelier (`relais-ia.ts`), qui garde la clé. Le modèle propose, l'auteur décide : rien n'est écrit sans
// « Appliquer », puis « Enregistrer ».
import { trouverMot, type Canon, type DonneesMonde } from '@crpg/regles';

export type Chemin = (string | number)[];

export interface MessageIa {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ActionAssistant = 'rediger' | 'ameliorer' | 'clarifier' | 'developper' | 'raccourcir';

export const ACTIONS: { id: ActionAssistant; libelle: string; consigne: string }[] = [
  { id: 'rediger', libelle: 'Rédiger', consigne: 'Écris ce texte d’après la fiche et le monde (le texte actuel, s’il existe, n’est qu’une indication).' },
  { id: 'ameliorer', libelle: 'Améliorer', consigne: 'Réécris ce texte en mieux : plus précis, plus concret, plus vivant, fidèle à la fiche ; garde ce qu’il dit.' },
  { id: 'clarifier', libelle: 'Clarifier', consigne: 'Réécris ce texte pour qu’il se comprenne du premier coup : phrases plus simples, ce qui compte dit franchement, rien de vague ; garde le ton.' },
  { id: 'developper', libelle: 'Développer', consigne: 'Développe ce texte jusqu’à la longueur visée : ajoute des détails précis et utiles (sens, gestes, indices), sans remplissage.' },
  { id: 'raccourcir', libelle: 'Raccourcir', consigne: 'Resserre ce texte : garde l’essentiel et les meilleurs détails, coupe le reste.' },
];

/** Les champs qui identifient ou relient (jamais de la prose) : l'assistant ne les propose pas. */
const CLES_TECHNIQUES = new Set(['id', 'pnj', 'lieu', 'parent', 'type', 'donneur', 'fait', 'profil', 'competence', 'declencheur', 'moment', 'statut', 'image', 'groupe', 'debut', 'cible', 'quete', 'objet', 'rencontre', 'faction', 'jauge', 'vers', 'contenant', 'difficulte', 'terrain', 'genre', 'categorie', 'espece', 'age', 'nom', 'mots', 'traits', 'valeurs']);
/** Les champs de prose qu'on peut rédiger même vides. */
const CLES_TEXTE = new Set(['arrivee', 'description', 'resume', 'ambiance', 'accroche', 'visuel', 'intro', 'narration', 'reponse', 'question', 'texte', 'retour', 'enonce', 'passe', 'evasif', 'epilogue']);

export interface TexteDeFiche {
  chemin: Chemin;
  libelle: string;
  texte: string;
}

export const libelleChemin = (chemin: Chemin): string => chemin.map((c, i) => (typeof c === 'number' ? `[${c}]` : i ? `.${c}` : c)).join('');

/** Les textes d'une fiche que l'assistant peut écrire : les feuilles en prose (cinq mots au moins) et les champs de texte connus, même vides. */
export function textesDeLaFiche(objet: unknown): TexteDeFiche[] {
  const res: TexteDeFiche[] = [];
  const parcourir = (x: unknown, chemin: Chemin) => {
    if (typeof x === 'string') {
      const cle = [...chemin].reverse().find((c): c is string => typeof c === 'string') ?? '';
      if (CLES_TECHNIQUES.has(cle)) return;
      if (compterMots(x) >= 5 || CLES_TEXTE.has(cle)) res.push({ chemin, libelle: libelleChemin(chemin), texte: x });
      return;
    }
    if (Array.isArray(x)) x.forEach((v, i) => parcourir(v, [...chemin, i]));
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) parcourir(v, [...chemin, k]);
  };
  parcourir(objet, []);
  return res;
}

export function lireChemin(objet: unknown, chemin: Chemin): unknown {
  let x = objet;
  for (const c of chemin) x = x && typeof x === 'object' ? (x as Record<string | number, unknown>)[c] : undefined;
  return x;
}

/** Une copie de l'objet avec la valeur posée au chemin (les intermédiaires sont copiés, le reste partagé). */
export function ecrireChemin<T>(objet: T, chemin: Chemin, valeur: unknown): T {
  if (!chemin.length) return valeur as T;
  const [tete, ...reste] = chemin;
  const copie = (Array.isArray(objet) ? [...objet] : { ...(objet as object) }) as Record<string | number, unknown>;
  copie[tete!] = ecrireChemin(copie[tete!], reste, valeur);
  return copie as T;
}

export const compterMots = (t: string): number => t.split(/\s+/).filter(Boolean).length;

export interface Cible {
  min: number;
  max: number;
  /** Ce qu'est ce texte, pour le modèle. */
  nature: string;
}

/** La cible d'un texte lu par le joueur (cibles validées le 10/11/2026), ou `undefined` : alors on garde à peu près la longueur actuelle. */
export function cibleDuTexte(dossier: string, chemin: Chemin): Cible | undefined {
  const cle = [...chemin].reverse().find((c): c is string => typeof c === 'string') ?? '';
  const dans = (k: string) => chemin.includes(k);
  if (dossier === 'lieux' && (cle === 'arrivee' || (dans('arriveeVariantes') && cle === 'texte')))
    return { min: 130, max: 170, nature: 'le récit d’arrivée : ce que le joueur lit en entrant, au présent, à la deuxième personne du pluriel (« vous »), plusieurs sens, deux ou trois détails précis, sans secret, sans mécanique et sans dire ce qu’on peut trouver' };
  if (dossier === 'lieux' && cle === 'description') return { min: 100, max: 150, nature: 'la description du lieu pour le conteur (factuelle : ce qu’on y trouve, qui s’y tient, ce qui peut s’y passer)' };
  if (dossier === 'rencontres' && cle === 'intro') return { min: 70, max: 110, nature: 'l’introduction de la rencontre, lue par le joueur : la scène au moment où elle commence, au présent, « vous »' };
  if (dossier === 'rencontres' && dans('alternatives') && cle === 'resume') return { min: 50, max: 80, nature: 'le texte d’une issue de la rencontre (ce qui se passe quand le groupe la dénoue de cette façon)' };
  if (dossier === 'pnj' && dans('sujets') && cle === 'reponse')
    return { min: 75, max: 115, nature: 'la réplique du PNJ telle que le joueur la lit : un geste bref, puis le discours direct entre « », à la première personne, dans sa voix ; d’abord une réponse franche, puis un détail concret, si possible une piste ; jamais « Il dit que… »' };
  return undefined;
}

/** Un secret ne fuit pas : les mots tabou du canon qui s'appliquent à cette fiche (ceux des secrets qui ne l'autorisent pas). */
export function tabousPour(canon: Canon, dossier: string, id: string): { secret: string; mot: string }[] {
  const autorise = (a: string) => a === `${dossier}:${id}` || a === dossier || (dossier === 'savoirs' && a === `pnj:${id}`);
  return canon.secrets.filter((s) => !s.autorise.some(autorise)).flatMap((s) => s.motsTabou.map((mot) => ({ secret: s.id, mot })));
}

/** Les mots tabou présents dans une proposition, avec leur extrait. */
export function fuites(texte: string, tabous: { secret: string; mot: string }[]): { secret: string; mot: string; extrait: string }[] {
  const res: { secret: string; mot: string; extrait: string }[] = [];
  for (const t of tabous) {
    const m = trouverMot(texte, t.mot);
    if (m) res.push({ ...t, extrait: m.extrait });
  }
  return res;
}

/** La section du canon des personnages qui parle de ce PNJ (titre `##` ou `###` qui contient son nom). */
export function sectionDuCanon(markdown: string | undefined, nom: string): string | undefined {
  if (!markdown || !nom.trim()) return undefined;
  const sections = markdown.split(/\n(?=#{2,3} )/);
  const premier = nom.trim().split(/\s+/)[0]!.toLowerCase();
  const trouve = sections.find((s) => s.split('\n')[0]!.toLowerCase().includes(nom.toLowerCase())) ?? sections.find((s) => premier.length > 3 && s.split('\n')[0]!.toLowerCase().includes(premier));
  return trouve?.slice(0, 4000);
}

/** Ce qui entoure la fiche dans le monde : son lieu (et le parent d'un lieu), son PNJ. Quelques lignes, pour situer. */
export function contexteDeLaFiche(dm: DonneesMonde, dossier: string, objet: Record<string, unknown>): string {
  const lignes: string[] = [];
  const lieu = (id: unknown, titre: string) => {
    const l = typeof id === 'string' ? dm.lieux.get(id) : undefined;
    if (l) lignes.push(`${titre} : ${l.nom} (${l.type}) — ${l.resume}`);
  };
  if (dossier === 'lieux') {
    lieu(objet['parent'], 'Lieu parent');
    const enfants = [...dm.lieux.values()].filter((l) => l.parent === objet['id']).map((l) => l.nom);
    if (enfants.length) lignes.push(`Lieux à l’intérieur : ${enfants.join(', ')}`);
    const pnj = [...dm.pnj.values()].filter((p) => p.lieu === objet['id']).map((p) => `${p.nom} (${p.role})`);
    if (pnj.length) lignes.push(`PNJ présents : ${pnj.join(', ')}`);
  } else lieu(objet['lieu'], 'Lieu');
  const idPnj = dossier === 'savoirs' ? objet['pnj'] : undefined;
  const p = typeof idPnj === 'string' ? dm.pnj.get(idPnj) : undefined;
  if (p) lignes.push(`PNJ : ${p.nom}, ${p.role}`);
  return lignes.join('\n');
}

export interface DemandeInitiale {
  nomMonde: string;
  bible?: string;
  canonDuPnj?: string;
  contexte: string;
  dossier: string;
  fiche: Record<string, unknown>;
  chemin: Chemin;
  texte: string;
  tabous: { secret: string; mot: string }[];
  action?: ActionAssistant;
  consigne?: string;
}

const BIBLE_MAX = 12_000;
const FICHE_MAX = 8_000;

export const SYSTEME = `Tu es l'assistant d'écriture de l'auteur de « La Table du Conteur », un RPG textuel en français sur les règles du SRD 5.2.1. Le joueur lit beaucoup : les textes doivent être riches, précis et clairs.
Règles :
1. Respecte la bible et la fiche : noms, âges, lieux, faits, relations. N'invente aucun nom propre important (personnage, lieu, faction, objet unique) qui n'y figure pas, sauf si l'auteur le demande.
2. Aucune mécanique de jeu dans un texte lu par le joueur : ni DD, ni jet, ni PV, ni niveau, ni PX, ni jauge.
3. Ne révèle aucun secret ; n'emploie jamais les mots interdits qu'on te donne.
4. Français soigné : concret, sensoriel, phrases claires, verbes justes. Pas de clichés (« un frisson parcourt… », « le temps semble suspendu »), pas d'emphase creuse, pas de points de suspension en série.
5. Réponds uniquement par le texte proposé, prêt à être collé dans la fiche : sans titre, sans commentaire, sans guillemets autour (les guillemets « » d'un discours direct restent). Si l'auteur te pose une question au lieu de demander un texte, réponds-lui brièvement.`;

const consigneDeLongueur = (cible: Cible | undefined, texte: string) =>
  cible ? `Longueur visée : ${cible.min} à ${cible.max} mots.` : texte.trim() ? `Longueur : à peu près celle du texte actuel (${compterMots(texte)} mots), sauf demande contraire.` : 'Longueur : celle qui convient à ce champ, sans délayer.';

/** La première demande : le monde (bible), la fiche, le champ, le texte actuel et l'action. */
export function messagesInitiaux(d: DemandeInitiale): MessageIa[] {
  const cible = cibleDuTexte(d.dossier, d.chemin);
  const action = ACTIONS.find((a) => a.id === d.action);
  const fiche = JSON.stringify(d.fiche, null, 1);
  const parties = [
    `# Monde : ${d.nomMonde}`,
    d.bible ? `## Bible du monde\n${d.bible.slice(0, BIBLE_MAX)}${d.bible.length > BIBLE_MAX ? '\n[…]' : ''}` : '',
    d.canonDuPnj ? `## Canon du personnage\n${d.canonDuPnj}` : '',
    d.contexte ? `## Autour de la fiche\n${d.contexte}` : '',
    `## La fiche (dossier « ${d.dossier} »)\n${fiche.slice(0, FICHE_MAX)}${fiche.length > FICHE_MAX ? '\n[…]' : ''}`,
    `## Le champ à écrire : ${libelleChemin(d.chemin)}`,
    cible ? `C'est ${cible.nature}.` : '',
    consigneDeLongueur(cible, d.texte),
    d.tabous.length ? `Mots interdits dans ce texte (secrets) : ${[...new Set(d.tabous.map((t) => `« ${t.mot} »`))].join(', ')}.` : '',
    `## Texte actuel\n${d.texte.trim() || '(vide)'}`,
    `## Demande\n${[action?.consigne, d.consigne?.trim()].filter(Boolean).join('\n') || ACTIONS[1]!.consigne}`,
  ];
  return [
    { role: 'system', content: SYSTEME },
    { role: 'user', content: parties.filter(Boolean).join('\n\n') },
  ];
}

/** Une demande de suite dans la même conversation (« plus sombre », « Raccourcir »…). */
export function messageDeSuite(action: ActionAssistant | undefined, consigne: string): MessageIa {
  const a = ACTIONS.find((x) => x.id === action);
  return { role: 'user', content: [a ? `${a.consigne} (Pars de ta dernière proposition.)` : '', consigne.trim()].filter(Boolean).join('\n') };
}

/** La proposition du modèle, sans bloc de code ni guillemets droits autour. */
export function nettoyerProposition(t: string): string {
  let x = t.trim();
  const bloc = /^```[a-z]*\n([\s\S]*?)\n```$/.exec(x);
  if (bloc) x = bloc[1]!.trim();
  if (/^"[^"]*"$/.test(x)) x = x.slice(1, -1).trim();
  return x;
}
