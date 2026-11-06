// Les éléments posés sur les cases du plateau : arbres et rochers, dessinés en vecteur (sans fond, donc sur n'importe quel
// sol), chacun un peu différent de son voisin ; l'eau, la boue et la neige sont des plaques de terrain, dessinées par
// `Plateau.tsx` (textures peintes si elles existent, sinon un dégradé).
import type { Relief, Terrain } from '@crpg/regles';

/** Un nombre entre 0 et 1, toujours le même pour une case et une graine : chaque arbre garde son visage d'un rendu à l'autre. */
export function alea(x: number, y: number, graine = 0): number {
  let h = Math.imul(x * 374761393 + y * 668265263 + graine * 2147483647, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface Props {
  x: number;
  y: number;
  /** Ambiance du plateau : de la neige se pose sur les arbres et les rochers d'un plateau enneigé. */
  terrain?: Terrain;
}

const FEUILLAGES = [
  { sombre: '#27441f', moyen: '#3a6a2e', clair: '#5f9446' },
  { sombre: '#2d4a24', moyen: '#476f31', clair: '#7aa24c' },
  { sombre: '#33411f', moyen: '#56702c', clair: '#8aa646' },
  { sombre: '#2a3f2c', moyen: '#3d6149', clair: '#5f9068' },
];

/** Un arbre vu de dessus et un peu de côté : ombre au sol, tronc, couronne en lobes éclairés par le haut. */
export function Arbre({ x, y, terrain }: Props) {
  const a = (n: number) => alea(x, y, n);
  const neige = terrain === 'neige';
  const pin = !neige && a(1) > 0.72;
  const f = FEUILLAGES[Math.floor(a(2) * FEUILLAGES.length)]!;
  const id = `arbre-${x}-${y}`;
  const lobes = Array.from({ length: 5 }, (_, i) => ({
    cx: 50 + (a(10 + i) - 0.5) * 34,
    cy: 52 + (a(20 + i) - 0.5) * 26,
    r: 19 + a(30 + i) * 11,
  }));
  return (
    <svg viewBox="0 0 100 120" className="relief-svg" aria-hidden style={{ transform: `rotate(${((a(3) - 0.5) * 8).toFixed(1)}deg) scale(${(0.93 + a(4) * 0.14).toFixed(2)})` }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor={neige ? '#cfe0d8' : f.clair} />
          <stop offset="0.55" stopColor={neige ? '#6d8a76' : f.moyen} />
          <stop offset="1" stopColor={f.sombre} />
        </radialGradient>
      </defs>
      <ellipse cx="52" cy="104" rx="38" ry="11" fill="rgba(0,0,0,0.38)" />
      <rect x="45" y="82" width="11" height="22" rx="3" fill="#4a3322" />
      <rect x="45" y="82" width="4" height="22" rx="2" fill="#6b4a31" />
      {pin ? (
        <>
          <polygon points="50,6 78,52 22,52" fill={`url(#${id}-g)`} stroke={f.sombre} strokeWidth="1.2" />
          <polygon points="50,28 84,76 16,76" fill={`url(#${id}-g)`} stroke={f.sombre} strokeWidth="1.2" />
          <polygon points="50,50 90,98 10,98" fill={`url(#${id}-g)`} stroke={f.sombre} strokeWidth="1.2" />
        </>
      ) : (
        lobes.map((l, i) => <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill={`url(#${id}-g)`} stroke={f.sombre} strokeWidth="1.2" />)
      )}
      {neige && lobes.slice(0, 3).map((l, i) => <ellipse key={`n${i}`} cx={l.cx - 2} cy={l.cy - l.r * 0.45} rx={l.r * 0.6} ry={l.r * 0.28} fill="rgba(255,255,255,0.85)" />)}
      {!neige && lobes.slice(0, 3).map((l, i) => <ellipse key={`h${i}`} cx={l.cx - l.r * 0.3} cy={l.cy - l.r * 0.4} rx={l.r * 0.35} ry={l.r * 0.18} fill="rgba(255,255,230,0.18)" />)}
    </svg>
  );
}

const PIERRES = [
  { clair: '#a29b8e', moyen: '#7d766b', sombre: '#4f4a43' },
  { clair: '#9aa0a3', moyen: '#767c80', sombre: '#4a4f53' },
  { clair: '#a89a86', moyen: '#85765f', sombre: '#544a3b' },
];

/** Un rocher à facettes : une face éclairée en haut à gauche, une face dans l'ombre à droite, de la mousse ou de la neige dessus. */
export function Rocher({ x, y, terrain }: Props) {
  const a = (n: number) => alea(x, y, 100 + n);
  const p = PIERRES[Math.floor(a(1) * PIERRES.length)]!;
  const neige = terrain === 'neige';
  const mousse = terrain === 'foret' && a(2) > 0.35;
  const j = (n: number, amp: number) => (a(n) - 0.5) * amp;
  // Contour irrégulier, haut et large.
  const pts = [
    [18 + j(3, 8), 86 + j(4, 6)],
    [10 + j(5, 8), 58 + j(6, 10)],
    [28 + j(7, 8), 26 + j(8, 8)],
    [52 + j(9, 8), 12 + j(10, 8)],
    [76 + j(11, 8), 28 + j(12, 8)],
    [92 + j(13, 6), 58 + j(14, 10)],
    [84 + j(15, 8), 86 + j(16, 6)],
  ] as const;
  const poly = pts.map(([px, py]) => `${px!.toFixed(1)},${py!.toFixed(1)}`).join(' ');
  const [, , c2, c3, c4] = pts;
  const facetteClaire = `${pts[1]![0].toFixed(1)},${pts[1]![1].toFixed(1)} ${c2![0].toFixed(1)},${c2![1].toFixed(1)} ${c3![0].toFixed(1)},${c3![1].toFixed(1)} 50,52`;
  const facetteSombre = `${c3![0].toFixed(1)},${c3![1].toFixed(1)} ${c4![0].toFixed(1)},${c4![1].toFixed(1)} ${pts[5]![0].toFixed(1)},${pts[5]![1].toFixed(1)} ${pts[6]![0].toFixed(1)},${pts[6]![1].toFixed(1)} 56,76 50,52`;
  return (
    <svg viewBox="0 0 100 100" className="relief-svg relief-rocher" aria-hidden style={{ transform: `scale(${(0.9 + a(17) * 0.16).toFixed(2)})` }}>
      <ellipse cx="52" cy="90" rx="42" ry="9" fill="rgba(0,0,0,0.38)" />
      <polygon points={poly} fill={p.moyen} stroke={p.sombre} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={facetteClaire} fill={p.clair} opacity="0.9" />
      <polygon points={facetteSombre} fill={p.sombre} opacity="0.6" />
      {mousse && <ellipse cx={36 + j(18, 14)} cy={30 + j(19, 6)} rx="16" ry="6" fill="#5f8a3d" opacity="0.8" />}
      {neige && <path d={`M${pts[2]![0].toFixed(1)} ${pts[2]![1].toFixed(1)} Q50 ${(2 + a(20) * 6).toFixed(1)} ${pts[4]![0].toFixed(1)} ${pts[4]![1].toFixed(1)} Q58 38 ${pts[2]![0].toFixed(1)} ${pts[2]![1].toFixed(1)}Z`} fill="rgba(255,255,255,0.9)" />}
    </svg>
  );
}

/** Un rocher bas : le même rocher, tassé (on tire par-dessus). */
export function RocherBas({ x, y, terrain }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', transform: 'scale(1.05, 0.62)', transformOrigin: '50% 92%' }}>
      <Rocher x={x} y={y} terrain={terrain} />
    </div>
  );
}

/** Un tronc couché : écorce sombre, bout scié aux cernes clairs, posé de travers selon la case. */
export function Tronc({ x, y, terrain }: Props) {
  const a = (n: number) => alea(x, y, 200 + n);
  const angle = [-32, 0, 0, 28][Math.floor(a(1) * 4)]!;
  const neige = terrain === 'neige';
  const mousse = terrain === 'foret' && a(2) > 0.4;
  return (
    <svg viewBox="0 0 100 100" className="relief-svg" aria-hidden>
      <ellipse cx="52" cy="66" rx="44" ry="13" fill="rgba(0,0,0,0.35)" />
      <g transform={`rotate(${angle} 50 52)`}>
        <rect x="8" y="38" width="80" height="26" rx="12" fill="#5d4129" stroke="#2e1f12" strokeWidth="1.5" />
        <path d="M14 44 Q40 41 70 45 M12 52 Q44 49 78 53 M16 59 Q42 57 72 60" stroke="#3b2817" strokeWidth="2" fill="none" opacity="0.8" />
        <rect x="10" y="39" width="76" height="7" rx="4" fill="rgba(255,230,190,0.12)" />
        <ellipse cx="86" cy="51" rx="7" ry="13" fill="#c79d6c" stroke="#2e1f12" strokeWidth="1.2" />
        <ellipse cx="86" cy="51" rx="4.2" ry="8" fill="none" stroke="#8a6440" strokeWidth="1.2" />
        <ellipse cx="86" cy="51" rx="1.6" ry="3" fill="#8a6440" />
        {mousse && <ellipse cx={30 + a(3) * 24} cy="41" rx="12" ry="4" fill="#5f8a3d" opacity="0.85" />}
        {neige && <rect x="12" y="35" width="70" height="7" rx="4" fill="rgba(255,255,255,0.9)" />}
      </g>
    </svg>
  );
}

/** Une caisse de bois : planches, renfort en croix, un peu de travers. */
export function Caisse({ x, y, terrain }: Props) {
  const a = (n: number) => alea(x, y, 300 + n);
  const angle = ((a(1) - 0.5) * 14).toFixed(1);
  const neige = terrain === 'neige';
  return (
    <svg viewBox="0 0 100 100" className="relief-svg" aria-hidden>
      <ellipse cx="54" cy="86" rx="36" ry="9" fill="rgba(0,0,0,0.38)" />
      <g transform={`rotate(${angle} 50 54)`}>
        <rect x="18" y="22" width="64" height="62" rx="3" fill="#94683a" stroke="#3f2914" strokeWidth="2" />
        <path d="M18 43 H82 M18 63 H82" stroke="#6d4a26" strokeWidth="2" />
        <path d="M22 26 L78 80 M78 26 L22 80" stroke="#6d4a26" strokeWidth="4" opacity="0.85" />
        <rect x="18" y="22" width="64" height="62" rx="3" fill="none" stroke="#3f2914" strokeWidth="5" opacity="0.55" />
        <rect x="20" y="24" width="60" height="6" fill="rgba(255,235,200,0.18)" />
        {neige && <rect x="18" y="20" width="64" height="9" rx="3" fill="rgba(255,255,255,0.9)" />}
      </g>
    </svg>
  );
}

/** Taille d'un élément dessiné, en cases (largeur, hauteur) : un arbre déborde, un obstacle bas reste dans sa case. */
export const TAILLE_SPRITE: Record<Relief, readonly [number, number]> = {
  arbre: [1.35, 1.55],
  rocher: [1.05, 1.05],
  'rocher-bas': [1, 0.95],
  tronc: [1.15, 1],
  caisse: [0.95, 0.95],
  eau: [1, 1],
  boue: [1, 1],
  neige: [1, 1],
};

/** Le dessin d'un élément (rien pour une plaque : elle est dessinée par la case elle-même). */
export function DessinRelief({ relief, x, y, terrain }: Props & { relief: Relief }) {
  switch (relief) {
    case 'arbre':
      return <Arbre x={x} y={y} terrain={terrain} />;
    case 'rocher':
      return <Rocher x={x} y={y} terrain={terrain} />;
    case 'rocher-bas':
      return <RocherBas x={x} y={y} terrain={terrain} />;
    case 'tronc':
      return <Tronc x={x} y={y} terrain={terrain} />;
    case 'caisse':
      return <Caisse x={x} y={y} terrain={terrain} />;
    default:
      return null;
  }
}
