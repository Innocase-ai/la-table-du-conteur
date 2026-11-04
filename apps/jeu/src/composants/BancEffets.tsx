// Banc d'essai des effets de combat : http://localhost:5173/?effets
// Un plateau vide, un bouton par famille de dégâts. Sert à régler les effets sans lancer un combat.
import { useRef, useState } from 'react';
import { casesZone, grilleDepuisTexte, type Position } from '@crpg/regles';
import { couleurSort, effetDeSort, effetsDeCoup, type Effet, type EffetSansId } from '../animations';
import { chargerDonnees } from '../donnees';
import { COULEURS_FAMILLES, FAMILLES, LIBELLES_FAMILLES, famille, type Famille } from '../effets-visuels';
import { EffetsPlateau, type Geometrie } from './Plateau';

const COLONNES = 9;
const LIGNES = 5;
const G: Geometrie = { cote: 96, hc: 96, marge: 0 };
/** Le lanceur des sorts d'essai, fixe à gauche du plateau (la cible se choisit en cliquant une case). */
const LANCEUR: Position = { x: 1, y: 2 };
const GRILLE = grilleDepuisTexte(Array.from({ length: LIGNES }, () => '.'.repeat(COLONNES)));

const SORTS: { id: string; libelle: string }[] = [
  { id: 'trait-de-feu', libelle: 'Trait de feu' },
  { id: 'rayon-de-givre', libelle: 'Rayon de givre' },
  { id: 'eclair-tracant', libelle: 'Éclair traçant' },
  { id: 'rayon-ardent', libelle: 'Rayon ardent' },
  { id: 'flamme-sacree', libelle: 'Flamme sacrée' },
  { id: 'projectile-magique', libelle: 'Projectile magique ×3' },
  { id: 'aspersion-acide', libelle: "Aspersion d'acide" },
  { id: 'bouffee-de-poison', libelle: 'Bouffée de poison' },
  { id: 'mains-brulantes', libelle: 'Mains brûlantes (cône)' },
  { id: 'sommeil', libelle: 'Sommeil (sphère)' },
  { id: 'vague-tonnante', libelle: 'Vague tonnante (cube)' },
];
const STYLE_BOUTON = { padding: '6px 10px', background: '#2a221a', color: '#f6ecd8', border: '1px solid #5a4a36', borderRadius: 4, cursor: 'pointer' } as const;

export function BancEffets() {
  const [effets, setEffets] = useState<Effet[]>([]);
  const [cible, setCible] = useState<Position>({ x: 6, y: 2 });
  const [critique, setCritique] = useState(false);
  const [reaction, setReaction] = useState<'' | 'resiste' | 'vulnerable' | 'immunise'>('');
  const [reduit, setReduit] = useState(false);
  const prochain = useRef(1);

  const poser = (e: EffetSansId) => {
    const id = prochain.current++;
    setEffets((liste) => [...liste, { ...e, id } as Effet]);
    window.setTimeout(() => setEffets((liste) => liste.filter((x) => x.id !== id)), e.duree + 80);
  };

  /** Rejoue un sort comme le combat : cercle d'incantation, puis projectile, rayon ou zone, puis impact sur la ou les cibles. */
  const lancerSort = (id: string) => {
    const donnees = chargerDonnees();
    const sort = donnees.sorts.get(id);
    if (!sort) return;
    const couleur = couleurSort(donnees, id);
    const typeDegats = sort.degats[0]?.type;
    const fam: Famille = famille(typeDegats);
    const apres = (ms: number, f: () => void) => window.setTimeout(f, ms);
    const coup = (position: Position, angle = 0) => {
      if (typeDegats) for (const e of effetsDeCoup({ famille: fam, position, angle, valeur: 9, critique, reaction: reaction || undefined }, reduit)) poser(e);
    };
    poser(reduit ? { type: 'lueur', position: LANCEUR, couleur, duree: 600 } : { type: 'cercle', position: LANCEUR, couleur, duree: 850 });
    if (sort.zone) {
      const personnel = sort.portee.type === 'personnel';
      const origine = personnel ? LANCEUR : cible;
      const cases = casesZone(GRILLE, sort.zone.forme, sort.zone.taille, origine, cible);
      const rayon = Math.max(0, ...cases.map((p) => Math.max(Math.abs(p.x - origine.x), Math.abs(p.y - origine.y))));
      apres(300, () => {
        poser({ type: 'zone', cases, couleur, duree: 520 + (reduit ? 0 : rayon * 60), origine, delai: reduit ? 0 : 60 });
        if (!reduit && typeDegats && !personnel) poser({ type: 'impact', position: origine, famille: fam, gros: true, duree: 900 });
        // Les cibles de la zone encaissent quand la vague les atteint.
        cases.filter((p) => p.x !== LANCEUR.x || p.y !== LANCEUR.y).forEach((p) => {
          const d = Math.max(Math.abs(p.x - origine.x), Math.abs(p.y - origine.y));
          if (cases.length <= 6 || (p.x + p.y) % 2 === 0) apres(d * 60 + 150, () => coup(p));
        });
      });
      return;
    }
    const n = id === 'projectile-magique' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      apres(300 + i * 160, () => {
        poser(effetDeSort(donnees, id, LANCEUR, cible, 280));
        apres(300, () => coup(cible));
      });
    }
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <strong>Sorts (lancés depuis le disque bleu) :</strong>
        {SORTS.map((s) => (
          <button key={s.id} type="button" onClick={() => lancerSort(s.id)} style={STYLE_BOUTON}>
            {s.libelle}
          </button>
        ))}
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
          {/* Le lanceur des sorts d'essai : un disque aux couleurs des héros. */}
          <div
            style={{
              position: 'absolute',
              left: LANCEUR.x * G.cote + G.cote * 0.05,
              top: LANCEUR.y * G.hc + G.hc * 0.05,
              width: G.cote * 0.9,
              height: G.hc * 0.9,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #6fa4d2, #4d86b8 45%, #1e3a55)',
              border: '2px solid #d4ae66',
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
