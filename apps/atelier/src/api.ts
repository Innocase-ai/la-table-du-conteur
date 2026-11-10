// Le client du serveur de l'atelier (voir serveur-mondes.ts) : lire les mondes, écrire une fiche.
export interface ResumeMonde {
  id: string;
  nom: string;
  statut: string;
}

export interface MondeLu {
  id: string;
  monde: unknown;
  fichiers: { chemin: string; contenu: unknown; empreinte: string }[];
  erreursLecture: { fichier: string; message: string }[];
  docs: { bible?: string; canonPersonnages?: string };
  /** `images/manifeste.json` du monde (`null` : pas d'image installée) : les cartes y sont sous `cartes.<id du lieu>`. */
  manifeste: { cartes?: Record<string, string> } | null;
  /** canon.json et revue.json de la racine du monde (`null` : absents). */
  canon: { contenu: unknown; empreinte: string } | null;
  revue: { contenu: unknown; empreinte: string } | null;
}

async function obtenir<T>(url: string): Promise<T> {
  const rep = await fetch(url, { cache: 'no-store' });
  if (!rep.ok) throw new Error(((await rep.json().catch(() => ({}))) as { erreur?: string }).erreur ?? `Erreur ${rep.status}`);
  return (await rep.json()) as T;
}

export const listerMondes = () => obtenir<ResumeMonde[]>('/api/atelier/mondes');
export const lireMonde = (id: string) => obtenir<MondeLu>(`/api/atelier/monde/${encodeURIComponent(id)}`);

export interface DemandeFiche {
  monde: string;
  chemin: string;
  mode: 'remplacer' | 'ajouter';
  id?: string;
  valeur: unknown;
  empreinteAttendue: string | null;
}

/** Une écriture refusée : `statut` 409 = le fichier a changé sur le disque depuis qu'on l'a lu. */
export class ErreurEcriture extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

/** Remplace ou ajoute UNE fiche dans un fichier du monde ; renvoie la nouvelle empreinte du fichier. */
export async function ecrireFiche(d: DemandeFiche): Promise<{ empreinte: string }> {
  const rep = await fetch('/api/atelier/fiche', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  const corps = (await rep.json().catch(() => ({}))) as { erreur?: string; empreinte?: string };
  if (!rep.ok) throw new ErreurEcriture(corps.erreur ?? `Erreur ${rep.status}`, rep.status);
  return { empreinte: corps.empreinte! };
}

/** Écrit canon.json ou revue.json (écrits en entier : l'atelier en est le seul auteur) ; renvoie la nouvelle empreinte. */
export async function ecrireDocument(d: { monde: string; nom: 'canon' | 'revue'; contenu: unknown; empreinteAttendue: string | null }): Promise<{ empreinte: string }> {
  const rep = await fetch('/api/atelier/document', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  const corps = (await rep.json().catch(() => ({}))) as { erreur?: string; empreinte?: string };
  if (!rep.ok) throw new ErreurEcriture(corps.erreur ?? `Erreur ${rep.status}`, rep.status);
  return { empreinte: corps.empreinte! };
}

/** L'assistant d'écriture (relais-ia.ts) : clé présente sur le serveur ?, modèle, dépense de la session et plafond, en dollars. */
export interface EtatAssistant {
  disponible: boolean;
  modele: string;
  depense: number;
  plafond: number;
}

export const etatAssistant = () => obtenir<EtatAssistant>('/api/atelier/ia-etat');

/** Une demande à l'assistant (appel payant, plafonné par le serveur) : sa proposition, le coût de l'appel et la dépense totale. */
export async function demanderAssistant(messages: { role: string; content: string }[]): Promise<{ texte: string; cout: number; depense: number; plafond: number }> {
  const rep = await fetch('/api/atelier/ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
  const corps = (await rep.json().catch(() => ({}))) as { erreur?: string; texte?: string; cout?: number; depense?: number; plafond?: number };
  if (!rep.ok) throw new Error(corps.erreur ?? `Erreur ${rep.status}`);
  return { texte: corps.texte!, cout: corps.cout ?? 0, depense: corps.depense ?? 0, plafond: corps.plafond ?? 0 };
}
