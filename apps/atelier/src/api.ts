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
