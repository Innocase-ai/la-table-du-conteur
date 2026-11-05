// Le client du serveur de l'atelier (voir serveur-mondes.ts). Lecture seule pour l'instant.
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
