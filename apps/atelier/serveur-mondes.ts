// Le serveur de l'atelier (développement seulement) : il lit les mondes de packages/mondes pour le navigateur, écrit les fiches
// modifiées (une à la fois, avec toutes les précautions de ecriture.ts) et prévient la page quand un fichier change sur le disque
// (Claude Code et les agents écrivent en parallèle).
//   GET /api/atelier/mondes        les mondes (brouillons compris) : id, nom, statut
//   GET /api/atelier/monde/<id>    monde.json, ses fichiers de données (contenu JSON + empreinte), BIBLE.md et CANON-PERSONNAGES.md
//   PUT /api/atelier/fiche         remplace ou ajoute UNE fiche dans un fichier (voir ecriture.ts : empreinte, schéma, écriture atomique)
// Le navigateur assemble et valide lui-même (le moteur est du TypeScript pur). Les gardes de chemins sont dans chemins.ts.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { corpsJson, DOSSIERS_IGNORES, idMondeValide, origineAutorisee, resoudre } from './chemins';
import { ecrireFiche, type DemandeEcriture } from './ecriture';

interface FichierLu {
  chemin: string;
  contenu: unknown;
  empreinte: string;
}

function repondre(res: ServerResponse, statut: number, corps: unknown): void {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

const sha = (texte: string) => createHash('sha256').update(texte).digest('hex');

/** Un dossier ordinaire (ni lien symbolique, ni fichier). */
function estDossier(chemin: string): boolean {
  const s = lstatSync(chemin);
  return s.isDirectory() && !s.isSymbolicLink();
}

function lireTexte(chemin: string): string | undefined {
  return existsSync(chemin) && lstatSync(chemin).isFile() ? readFileSync(chemin, 'utf8') : undefined;
}

export function lireMondes(racine: string): { id: string; nom: string; statut: string }[] {
  return readdirSync(racine)
    .filter((id) => idMondeValide(id) && estDossier(join(racine, id)) && existsSync(join(racine, id, 'monde.json')))
    .map((id) => {
      try {
        const m = JSON.parse(readFileSync(join(racine, id, 'monde.json'), 'utf8')) as { nom?: string; statut?: string };
        return { id, nom: m.nom ?? id, statut: m.statut ?? 'publie' };
      } catch {
        return { id, nom: id, statut: 'illisible' };
      }
    });
}

export function lireMonde(racine: string, id: string) {
  const dossier = resoudre(racine, id);
  if (!dossier || !existsSync(join(dossier, 'monde.json')) || !estDossier(dossier)) return null;
  const erreursLecture: { fichier: string; message: string }[] = [];
  const fichiers: FichierLu[] = [];
  const lire = (chemin: string, absolu: string): unknown => {
    const texte = readFileSync(absolu, 'utf8');
    try {
      const contenu = JSON.parse(texte) as unknown;
      if (chemin !== 'monde.json') fichiers.push({ chemin, contenu, empreinte: sha(texte) });
      return contenu;
    } catch (e) {
      erreursLecture.push({ fichier: chemin, message: `JSON invalide — ${(e as Error).message}` });
      return undefined;
    }
  };
  const monde = lire('monde.json', join(dossier, 'monde.json'));
  for (const sous of readdirSync(dossier).sort()) {
    const absolu = join(dossier, sous);
    if (sous.startsWith('.') || DOSSIERS_IGNORES.includes(sous) || !estDossier(absolu)) continue;
    for (const f of readdirSync(absolu).filter((x) => x.endsWith('.json')).sort()) {
      const fichier = join(absolu, f);
      if (lstatSync(fichier).isFile()) lire(`${sous}/${f}`, fichier);
    }
  }
  return {
    id,
    monde,
    fichiers,
    erreursLecture,
    docs: { bible: lireTexte(join(dossier, 'BIBLE.md')), canonPersonnages: lireTexte(join(dossier, 'CANON-PERSONNAGES.md')) },
  };
}

export function serveurMondes(dossierMondes: string): Plugin {
  let racine = '';
  return {
    name: 'serveur-mondes',
    apply: 'serve',
    configResolved(config) {
      racine = resolve(config.root, dossierMondes);
    },
    configureServer(serveur) {
      const garde = (req: { method?: string; headers: { origin?: string } }, res: ServerResponse): boolean => {
        if (req.method !== 'GET') return repondre(res, 405, { erreur: 'Lecture seule : GET uniquement.' }), false;
        if (!origineAutorisee(req.headers.origin)) return repondre(res, 403, { erreur: 'Origine refusée : le serveur ne sert que l’atelier.' }), false;
        return true;
      };
      serveur.middlewares.use('/api/atelier/mondes', (req, res) => {
        if (garde(req, res)) repondre(res, 200, lireMondes(racine));
      });
      serveur.middlewares.use('/api/atelier/monde', (req, res) => {
        if (!garde(req, res)) return;
        const id = decodeURIComponent((req.url ?? '').split('?')[0]!.replace(/^\//, ''));
        const monde = lireMonde(racine, id);
        if (!monde) return repondre(res, 404, { erreur: `Monde introuvable : « ${id} ».` });
        repondre(res, 200, monde);
      });

      // Écrire UNE fiche : une requête à la fois (deux écritures simultanées ne se marchent pas dessus).
      let ecritureEnCours = false;
      serveur.middlewares.use('/api/atelier/fiche', (req, res) => {
        if (req.method !== 'PUT') return repondre(res, 405, { erreur: 'PUT seulement.' });
        if (!origineAutorisee(req.headers.origin)) return repondre(res, 403, { erreur: 'Origine refusée : le serveur ne sert que l’atelier.' });
        if (!corpsJson(req.headers['content-type'])) return repondre(res, 415, { erreur: 'Corps JSON attendu.' });
        if (ecritureEnCours) return repondre(res, 429, { erreur: 'Une écriture est déjà en cours.' });
        ecritureEnCours = true;
        let texte = '';
        let trop = false;
        req.on('data', (c: Buffer) => {
          texte += c.toString('utf8');
          if (texte.length > 2_000_000 && !trop) (trop = true), req.destroy();
        });
        req.on('error', () => (ecritureEnCours = false));
        req.on('end', () => {
          try {
            if (trop) return repondre(res, 413, { erreur: 'Requête trop grande.' });
            const d = JSON.parse(texte) as Partial<DemandeEcriture>;
            if (typeof d.monde !== 'string' || typeof d.chemin !== 'string' || (d.empreinteAttendue !== null && typeof d.empreinteAttendue !== 'string'))
              return repondre(res, 400, { erreur: 'Requête invalide.' });
            const r = ecrireFiche(racine, { monde: d.monde, chemin: d.chemin, mode: d.mode as DemandeEcriture['mode'], ...(d.id !== undefined ? { id: String(d.id) } : {}), valeur: d.valeur, empreinteAttendue: d.empreinteAttendue });
            if (r.ok) repondre(res, 200, { empreinte: r.empreinte });
            else repondre(res, r.statut, { erreur: r.erreur, ...(r.empreinteActuelle ? { empreinteActuelle: r.empreinteActuelle } : {}) });
          } catch (e) {
            repondre(res, 400, { erreur: `Requête illisible : ${(e as Error).message}` });
          } finally {
            ecritureEnCours = false;
          }
        });
      });

      // Un fichier du monde change sur le disque (un autre éditeur, Claude Code, un agent) : on prévient la page, qui recharge.
      serveur.watcher.add(racine);
      const attente = new Map<string, ReturnType<typeof setTimeout>>();
      const surChangement = (fichier: string) => {
        const rel = fichier.replace(/\\/g, '/').replace(racine.replace(/\\/g, '/') + '/', '');
        const [monde, dossier] = rel.split('/');
        if (!monde || rel === fichier.replace(/\\/g, '/') || !idMondeValide(monde)) return;
        if (dossier && DOSSIERS_IGNORES.includes(dossier)) return;
        if (!/\.(json|md)$/.test(rel)) return;
        clearTimeout(attente.get(monde));
        attente.set(
          monde,
          setTimeout(() => {
            attente.delete(monde);
            serveur.ws.send({ type: 'custom', event: 'atelier:change', data: { monde } });
          }, 150),
        );
      };
      serveur.watcher.on('add', surChangement).on('change', surChangement).on('unlink', surChangement);
    },
  };
}
