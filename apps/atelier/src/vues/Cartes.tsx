import { useMemo, useState } from 'react';
import type { DonneesMonde, Lieu } from '@crpg/regles';
import { ecrireFiche, ErreurEcriture, lireMonde, type MondeLu } from '../api';

interface Props {
  lu: MondeLu;
  dm: DonneesMonde;
  recharger: () => Promise<void>;
}

/** La fiche brute d'un lieu (telle qu'elle est dans le fichier, sans valeurs par défaut) et le fichier qui la contient. */
function ficheBrute(lu: MondeLu, id: string): { chemin: string; empreinte: string; fiche: Record<string, unknown> } | undefined {
  for (const f of lu.fichiers) {
    if (!f.chemin.startsWith('lieux/')) continue;
    const fiche = (Array.isArray(f.contenu) ? f.contenu : [f.contenu]).find((e) => (e as { id?: string } | null)?.id === id) as Record<string, unknown> | undefined;
    if (fiche) return { chemin: f.chemin, empreinte: f.empreinte, fiche };
  }
  return undefined;
}

/**
 * Poser les lieux sur la carte illustrée de leur parent : on choisit le lieu enfant dans la liste, puis on clique sur l'image
 * à l'endroit où il se trouve ; la position (en % de l'image) s'écrit dans sa fiche (`position`). Ce que le joueur verra : les noms,
 * posés par le jeu sur l'image.
 */
export function Cartes({ lu, dm, recharger }: Props) {
  const parents = useMemo(() => {
    const n = new Map<string, Lieu[]>();
    for (const l of dm.lieux.values()) if (l.parent) n.set(l.parent, [...(n.get(l.parent) ?? []), l]);
    return [...n.entries()].map(([id, fils]) => ({ id, nom: dm.lieux.get(id)?.nom ?? id, fils, image: lu.manifeste?.cartes?.[id] })).sort((a, b) => Number(!!b.image) - Number(!!a.image) || b.fils.length - a.fils.length);
  }, [dm, lu]);
  const [parentId, setParentId] = useState(() => parents.find((p) => p.image)?.id ?? parents[0]?.id ?? '');
  const [enfantId, setEnfantId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const parent = parents.find((p) => p.id === parentId);
  const enfant = parent?.fils.find((l) => l.id === enfantId);

  const poser = async (id: string, position: { x: number; y: number } | undefined) => {
    setMessage(undefined);
    try {
      // On relit le monde pour avoir l'empreinte du fichier à jour : Claude Code ou un agent a pu écrire entre-temps.
      const frais = await lireMonde(lu.id);
      const brut = ficheBrute(frais, id);
      if (!brut) return setMessage(`Fiche du lieu « ${id} » introuvable.`);
      const { position: _ancienne, ...reste } = brut.fiche;
      await ecrireFiche({ monde: lu.id, chemin: brut.chemin, mode: 'remplacer', id, valeur: position ? { ...reste, position } : reste, empreinteAttendue: brut.empreinte });
      await recharger();
    } catch (e) {
      setMessage(e instanceof ErreurEcriture && e.statut === 409 ? 'Le fichier vient de changer sur le disque : réessayez.' : (e as Error).message);
    }
  };

  const surImage = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (!enfant) return setMessage('Choisissez d’abord un lieu dans la liste.');
    const r = ev.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((ev.clientX - r.left) / r.width) * 100)) * 10) / 10;
    const y = Math.round(Math.min(100, Math.max(0, ((ev.clientY - r.top) / r.height) * 100)) * 10) / 10;
    void poser(enfant.id, { x, y });
  };

  if (!parents.length) return <p className="muet">Ce monde n’a aucun lieu qui en contient d’autres.</p>;
  return (
    <section>
      <h2>Cartes</h2>
      <p className="muet">
        Choisissez une carte, un lieu dans la liste, puis cliquez sur l’image à son emplacement. Les noms sont écrits par le jeu : l’image n’en porte pas. Un lieu sans position est placé en anneau.
      </p>
      <label>
        Carte de{' '}
        <select value={parentId} onChange={(e) => (setParentId(e.target.value), setEnfantId(undefined), setMessage(undefined))}>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom} — {p.fils.length} lieux{p.image ? '' : ' (pas d’image)'}
            </option>
          ))}
        </select>
      </label>
      {message && <p className="erreur">{message}</p>}
      {parent && (
        <div className="cartes">
          <ul className="cartes-liste">
            {parent.fils.map((l) => (
              <li key={l.id} className={l.id === enfantId ? 'choisi' : ''}>
                <button type="button" onClick={() => setEnfantId(l.id)}>
                  {l.position ? '●' : '○'} {l.nom}
                </button>
                {l.position && (
                  <button type="button" className="discret" title="Retirer la position" onClick={() => void poser(l.id, undefined)}>
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          {parent.image ? (
            <div className="cartes-image" onClick={surImage} role="presentation" style={{ cursor: enfant ? 'crosshair' : 'default' }}>
              <img src={`/api/atelier/image/${encodeURIComponent(lu.id)}/${encodeURIComponent(parent.image)}`} alt={`Carte : ${parent.nom}`} draggable={false} />
              {parent.fils.map((l) =>
                l.position ? (
                  <span key={l.id} className={`cartes-repere${l.id === enfantId ? ' choisi' : ''}`} style={{ left: `${l.position.x}%`, top: `${l.position.y}%` }} title={l.nom}>
                    <i />
                    <b>{l.nom}</b>
                  </span>
                ) : null,
              )}
            </div>
          ) : (
            <p className="muet">
              Pas encore d’image pour cette carte. Générer : <code>pnpm images cartes {lu.id} --lieu {parent.id} --go</code>, puis{' '}
              <code>uv run --with pillow python outils/images/installer.py monde {lu.id}</code>.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
