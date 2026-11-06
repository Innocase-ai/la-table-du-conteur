import { useEffect, useMemo, useRef, useState } from 'react';
import type { Graphe, MarqueArete, NoeudGraphe } from '@crpg/regles';
import { cheminArete, disposer } from './disposition';

const GLYPHES: Record<MarqueArete, string> = { verrou: '🔒', cache: '👁', condition: '◆', heures: '', 'sens-unique': '' };
const classe = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
const court = (t: string, n = 25) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

interface Vue {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Un graphe en SVG : colonnes, courbes, zoom à la molette, déplacement à la souris, clic sur un nœud. */
export function GrapheSvg({ graphe, racines, selection, onSelect }: { graphe: Graphe; racines?: string[]; selection?: string; onSelect?: (n: NoeudGraphe) => void }) {
  const dispo = useMemo(() => disposer(graphe, racines ? { racines } : {}), [graphe, racines]);
  const ajuste = useMemo<Vue>(() => ({ x: -24, y: -24, w: dispo.largeur + 48, h: dispo.hauteur + 48 }), [dispo]);
  const [vue, setVue] = useState<Vue>(ajuste);
  const zone = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ x: number; y: number; vue: Vue } | null>(null);
  useEffect(() => setVue(ajuste), [ajuste]);

  // La molette zoome autour du curseur (il faut un écouteur non passif pour empêcher le défilement de la page).
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const surMolette = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setVue((v) => {
        const w = Math.min(Math.max(v.w * f, 120), ajuste.w * 6);
        const k = w / v.w;
        const h = v.h * k;
        const px = v.x + ((e.clientX - r.left) / r.width) * v.w;
        const py = v.y + ((e.clientY - r.top) / r.height) * v.h;
        return { x: px - ((px - v.x) * k), y: py - ((py - v.y) * k), w, h };
      });
    };
    el.addEventListener('wheel', surMolette, { passive: false });
    return () => el.removeEventListener('wheel', surMolette);
  }, [ajuste]);

  if (!graphe.noeuds.length) return <p className="muet">Rien à dessiner.</p>;

  return (
    <div
      ref={zone}
      className="grapheZone"
      onPointerDown={(e) => {
        if ((e.target as Element).closest('.noeud')) return;
        glisse.current = { x: e.clientX, y: e.clientY, vue };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const g = glisse.current;
        if (!g || !zone.current) return;
        const r = zone.current.getBoundingClientRect();
        setVue({ ...g.vue, x: g.vue.x - ((e.clientX - g.x) / r.width) * g.vue.w, y: g.vue.y - ((e.clientY - g.y) / r.height) * g.vue.h });
      }}
      onPointerUp={() => (glisse.current = null)}
    >
      <svg viewBox={`${vue.x} ${vue.y} ${vue.w} ${vue.h}`} role="img" aria-label="Graphe">
        <defs>
          <marker id="fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="pointe" />
          </marker>
        </defs>
        {graphe.aretes.map((a, i) => {
          const de = dispo.boites.get(a.de);
          const vers = dispo.boites.get(a.vers);
          if (!de || !vers) return null;
          const { d, milieu } = cheminArete(de, vers);
          const dirigee = a.genre !== 'lien' && a.genre !== 'parent' ? true : !!a.marques?.includes('sens-unique');
          const glyphes = (a.marques ?? []).map((m) => GLYPHES[m]).filter(Boolean).join('');
          return (
            <g key={i} className={`arete a-${classe(a.genre)}${a.marques?.includes('cache') ? ' cache' : ''}`}>
              <path d={d} markerEnd={dirigee ? 'url(#fleche)' : undefined} />
              {glyphes && (
                <text x={milieu.x} y={milieu.y} textAnchor="middle" dominantBaseline="middle" className="glyphe">
                  {glyphes}
                </text>
              )}
            </g>
          );
        })}
        {graphe.noeuds.map((n) => {
          const b = dispo.boites.get(n.id);
          if (!b) return null;
          return (
            <g
              key={n.id}
              className={`noeud g-${classe(n.genre)}${n.etat ? ` ${n.etat}` : ''}${selection === n.id ? ' choisi' : ''}${n.poids && n.poids >= 3 ? ' fort' : ''}`}
              transform={`translate(${b.x} ${b.y})`}
              onClick={() => onSelect?.(n)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect?.(n)}
            >
              <title>{`${n.libelle} — ${n.genre}${n.etat && n.etat !== 'ok' ? ` (${n.etat})` : ''}`}</title>
              <rect width={b.l} height={b.h} rx={7} />
              <text x={b.l / 2} y={b.h / 2} textAnchor="middle" dominantBaseline="central">
                {court(n.libelle)}
              </text>
            </g>
          );
        })}
      </svg>
      <button className="recentrer" onClick={() => setVue(ajuste)}>
        Tout voir
      </button>
      {graphe.tronque && <p className="tronque">Vue coupée : trop de nœuds, les plus lointains ne sont pas dessinés.</p>}
    </div>
  );
}

export function Legende({ elements }: { elements: { classe: string; texte: string }[] }) {
  return (
    <p className="legende">
      {elements.map((e) => (
        <span key={e.texte}>
          <i className={`pastilleLegende ${e.classe}`} /> {e.texte}
        </span>
      ))}
    </p>
  );
}
