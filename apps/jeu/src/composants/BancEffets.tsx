// Banc d'essai des effets de combat : http://localhost:5173/?effets
// Un plateau vide, un bouton par famille de dégâts. Sert à régler les effets sans lancer un combat.
import { useRef, useState } from 'react';
import type { Position } from '@crpg/regles';
import { effetsDeCoup, type Effet } from '../animations';
import { COULEURS_FAMILLES, FAMILLES, LIBELLES_FAMILLES, type Famille } from '../effets-visuels';
import { EffetsPlateau, type Geometrie } from './Plateau';

const COLONNES = 7;
const LIGNES = 3;
const G: Geometrie = { cote: 96, hc: 96, marge: 0 };
const STYLE_BOUTON = { padding: '6px 10px', background: '#2a221a', color: '#f6ecd8', border: '1px solid #5a4a36', borderRadius: 4, cursor: 'pointer' } as const;

export function BancEffets() {
  const [effets, setEffets] = useState<Effet[]>([]);
  const [cible, setCible] = useState<Position>({ x: 3, y: 1 });
  const [critique, setCritique] = useState(false);
  const [reaction, setReaction] = useState<'' | 'resiste' | 'vulnerable' | 'immunise'>('');
  const [reduit, setReduit] = useState(false);
  const prochain = useRef(1);

  const poser = (e: ReturnType<typeof effetsDeCoup>[number]) => {
    const id = prochain.current++;
    setEffets((liste) => [...liste, { ...e, id } as Effet]);
    window.setTimeout(() => setEffets((liste) => liste.filter((x) => x.id !== id)), e.duree + 80);
  };

  const lancer = (famille: Famille, position: Position = cible) => {
    const valeur = reaction === 'immunise' ? 0 : 9;
    // L'attaquant est à gauche de la cible (le coup part vers la droite).
    for (const e of effetsDeCoup({ famille, position, angle: 0, valeur, critique, reaction: reaction || undefined }, reduit)) poser(e);
  };

  const enchainer = () => {
    FAMILLES.forEach((f, i) => window.setTimeout(() => lancer(f, { x: i % COLONNES, y: Math.floor(i / COLONNES) * 1 }), i * 450));
  };

  const secousse = effets.find((e) => e.type === 'secousse');

  return (
    <div style={{ padding: 16, color: '#f6ecd8', background: '#14100c', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 8px' }}>Banc d'essai des effets de combat</h2>
      <p style={{ margin: '0 0 12px', opacity: 0.8 }}>Cliquez une case pour choisir la cible, puis une famille de dégâts. Le coup arrive de la gauche.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {FAMILLES.map((f) => (
          <button key={f} type="button" onClick={() => lancer(f)} style={{ ...STYLE_BOUTON, borderLeft: `6px solid ${COULEURS_FAMILLES[f]}` }}>
            {LIBELLES_FAMILLES[f]}
          </button>
        ))}
        <button type="button" onClick={enchainer} style={{ ...STYLE_BOUTON, fontWeight: 700 }}>
          Tout enchaîner
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <label>
          <input type="checkbox" checked={critique} onChange={(e) => setCritique(e.target.checked)} /> Coup critique
        </label>
        <label>
          Réaction{' '}
          <select value={reaction} onChange={(e) => setReaction(e.target.value as typeof reaction)}>
            <option value="">aucune</option>
            <option value="resiste">résiste</option>
            <option value="vulnerable">vulnérable</option>
            <option value="immunise">immunisé</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={reduit} onChange={(e) => setReduit(e.target.checked)} /> Mouvement réduit (texte seul)
        </label>
      </div>
      <div style={{ overflow: 'auto', padding: 24 }}>
        <div
          className={`plateau${secousse ? (secousse.fort ? ' plateau-secoue plateau-secoue-fort' : ' plateau-secoue') : ''}`}
          style={{
            width: COLONNES * G.cote,
            height: LIGNES * G.hc,
            margin: 0,
            ['--cote' as string]: `${G.cote}px`,
            ...(secousse ? { transformOrigin: `${(secousse.position.x + 0.5) * G.cote}px ${(secousse.position.y + 0.5) * G.hc}px`, animationDuration: `${secousse.duree}ms` } : {}),
          }}
        >
          {Array.from({ length: COLONNES * LIGNES }, (_, i) => {
            const x = i % COLONNES;
            const y = Math.floor(i / COLONNES);
            const choisie = x === cible.x && y === cible.y;
            return (
              <div
                key={i}
                className="case case-sol"
                onClick={() => setCible({ x, y })}
                style={{ left: x * G.cote, top: y * G.hc, width: G.cote, height: G.hc, outline: choisie ? '2px solid #f0cd84' : undefined, outlineOffset: -2, cursor: 'pointer' }}
              />
            );
          })}
          {/* Une cible factice : un disque aux couleurs des monstres, sous les effets. */}
          <div
            style={{
              position: 'absolute',
              left: cible.x * G.cote + G.cote * 0.05,
              top: cible.y * G.hc + G.hc * 0.05,
              width: G.cote * 0.9,
              height: G.hc * 0.9,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #d7685c, #9c3329 45%, #571b15)',
              border: '2px solid #2a0d0a',
              pointerEvents: 'none',
              zIndex: 11,
            }}
          />
          <EffetsPlateau effets={effets} g={G} vitesse={1} />
        </div>
      </div>
    </div>
  );
}
