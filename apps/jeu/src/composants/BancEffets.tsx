// Banc d'essai des effets de combat : http://localhost:5173/?effets
// Un plateau vide, un bouton par famille de dégâts. Sert à régler les effets sans lancer un combat.
import { useRef, useState } from 'react';
import { casesZone, ETATS, grilleDepuisTexte, libelleEtat, type Combattant, type Modificateur, type Position } from '@crpg/regles';
import { couleurSort, effetDeSort, effetsDeCoup, type Effet, type EffetSansId } from '../animations';
import { chargerDonnees } from '../donnees';
import { COULEURS_FAMILLES, FAMILLES, LIBELLES_AURAS, LIBELLES_FAMILLES, famille, type Aura, type Famille } from '../effets-visuels';
import { arreterMusique, demarrerMusique } from '../musique';
import { AMBIANCES_MUSIQUE, LIBELLES_MUSIQUES } from '../musique-regles';
import { jouerSon } from '../sons';
import { LIBELLES_SONS, SONS, sonAuLancement, sonDeCoup, sonDeSort } from '../sons-regles';
import { ControleSon } from './ControleSon';
import { EffetsPlateau, type Geometrie } from './Plateau';
import { Illustration } from './Illustration';
import { Jeton } from './Jeton';

/** Une classe jouable, un portrait de la galerie : de quoi montrer le jeton et le médaillon de chaque classe. */
const CLASSES_ESSAI: { classe: string; nom: string; portrait: string }[] = [
  { classe: 'guerrier', nom: 'Guerrier', portrait: 'humain-m-1' },
  { classe: 'barbare', nom: 'Barbare', portrait: 'orc-m-1' },
  { classe: 'roublard', nom: 'Roublard', portrait: 'halfelin-m-1' },
  { classe: 'rodeur', nom: 'Rôdeur', portrait: 'elfe-f-1' },
  { classe: 'clerc', nom: 'Clerc', portrait: 'nain-f-1' },
  { classe: 'magicien', nom: 'Magicien', portrait: 'gnome-m-1' },
  { classe: 'paladin', nom: 'Paladin', portrait: 'humain-f-1' },
  { classe: 'ensorceleur', nom: 'Ensorceleur', portrait: 'tieffelin-f-1' },
  { classe: 'occultiste', nom: 'Occultiste', portrait: 'tieffelin-m-1' },
  { classe: 'druide', nom: 'Druide', portrait: 'elfe-m-1' },
  { classe: 'moine', nom: 'Moine', portrait: 'humain-m-2' },
  { classe: 'barde', nom: 'Barde', portrait: 'drakeide-f-1' },
];

/** Modificateur factice qui déclenche une aura. */
const MODIFICATEURS_AURAS: Record<Exclude<Aura, 'concentration' | 'pvtemp'>, Modificateur> = {
  benediction: { id: 'benediction-a', type: 'de_attaque', de: '1d4', source: 'x' },
  bouclier: { id: 'bouclier-de-la-foi', type: 'bonus_ca', valeur: 2, source: 'x' },
  fleau: { id: 'fleau-a', type: 'de_attaque', de: '-1d4', source: 'x' },
  marque: { id: 'marque-du-chasseur', type: 'bonus_attaque', valeur: 0, source: 'x' },
  givre: { id: 'rayon-de-givre', type: 'vitesse', valeur: -3, source: 'x' },
  trace: { id: 'eclair-tracant', type: 'avantage_contre', source: 'x', usageUnique: true },
  renfort: { id: 'aide-a', type: 'repere', source: 'x' },
};

/** Un combattant minimal pour afficher un jeton d'essai (seuls les champs lus par le jeton comptent). */
function pion(nom: string, extra: Partial<Combattant> = {}): Combattant {
  return {
    id: `essai-${nom}`,
    nom,
    camp: 'heros',
    modele: 'paladin',
    type: 'Humanoïde',
    taille: 'M',
    pv: 20,
    pvMax: 24,
    pvTemp: 0,
    etats: [],
    modificateurs: [],
    mort: false,
    rage: false,
    enFuite: false,
    ...extra,
  } as unknown as Combattant;
}

const COLONNES = 9;
const LIGNES = 5;
// `?effets&cote=72` règle la taille d'une case (utile pour les captures du guide) ; 96 par défaut.
const COTE = Math.min(160, Math.max(40, Number(new URLSearchParams(window.location.search).get('cote')) || 96));
const G: Geometrie = { cote: COTE, hc: COTE, marge: 0 };
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
  { id: 'contact-glacial', libelle: 'Contact glacial' },
  { id: 'blessure', libelle: 'Blessure' },
  { id: 'immobilisation-de-personne', libelle: 'Immobilisation de personne' },
  { id: 'arme-spirituelle', libelle: 'Arme spirituelle' },
  { id: 'fleau', libelle: 'Imprécation (malédiction)' },
  { id: 'marque-du-chasseur', libelle: 'Marque du chasseur' },
  { id: 'aide', libelle: 'Aide (renforcement)' },
  { id: 'benediction', libelle: 'Bénédiction (protection)' },
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
    // Un sort de soutien (bouclier, aide, marque, malédiction) joue son bruit au lancement et ne lance rien sur le plateau.
    const soutien = sonAuLancement(id);
    if (soutien) {
      apres(300, () => jouerSon(soutien));
      return;
    }
    const son = sonDeSort(id, fam);
    if (sort.zone) {
      const personnel = sort.portee.type === 'personnel';
      const origine = personnel ? LANCEUR : cible;
      const cases = casesZone(GRILLE, sort.zone.forme, sort.zone.taille, origine, cible);
      const rayon = Math.max(0, ...cases.map((p) => Math.max(Math.abs(p.x - origine.x), Math.abs(p.y - origine.y))));
      apres(300, () => {
        if (son) jouerSon(son);
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
        if (son) jouerSon(son);
        poser(effetDeSort(donnees, id, LANCEUR, cible, 280));
        apres(300, () => coup(cible));
      });
    }
  };

  const lancer = (famille: Famille, position: Position = cible) => {
    const valeur = reaction === 'immunise' ? 0 : 9;
    // L'attaquant est à gauche de la cible (le coup part vers la droite).
    for (const e of effetsDeCoup({ famille, position, angle: 0, valeur, critique, reaction: reaction || undefined }, reduit)) poser(e);
    // Le bruit d'un coup d'arme de cette famille (le bouton « Tranchant » donne un coup d'épée).
    const son = valeur > 0 ? sonDeCoup({ famille }) : undefined;
    if (son) jouerSon(son);
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
        <strong>Écouter les bruitages :</strong>
        {SONS.map((s) => (
          <button key={s} type="button" onClick={() => jouerSon(s)} style={STYLE_BOUTON} title={`sons/${s}.mp3`}>
            {LIBELLES_SONS[s]}
          </button>
        ))}
        <ControleSon />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <strong>Écouter les musiques d'ambiance (en boucle) :</strong>
        {AMBIANCES_MUSIQUE.map((m) => (
          <button key={m} type="button" onClick={() => demarrerMusique(m)} style={STYLE_BOUTON} title={`musique/${m}.mp3`}>
            {LIBELLES_MUSIQUES[m]}
          </button>
        ))}
        <button type="button" onClick={() => arreterMusique(1)} style={{ ...STYLE_BOUTON, fontWeight: 700 }}>
          Arrêter
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
      <h3 style={{ margin: '12px 0 4px' }}>Classes : jeton et portrait en combat</h3>
      <div id="classes-essai" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 24px 22px' }}>
        {CLASSES_ESSAI.map((k) => (
          <figure key={k.classe} style={{ margin: 0, textAlign: 'center', width: 108 }}>
            <div style={{ height: 108, display: 'flex', justifyContent: 'center' }}>
              <Illustration c={pion(k.nom, { modele: k.classe, portrait: k.portrait })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 2px' }}>
              <Jeton c={pion(k.nom, { modele: k.classe, portrait: k.portrait })} taille={44} />
            </div>
            <figcaption style={{ fontSize: 12 }}>{k.nom}</figcaption>
          </figure>
        ))}
      </div>
      <h3 style={{ margin: '12px 0 4px' }}>Auras et états (jetons sur le plateau)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, padding: '14px 24px 22px' }}>
        {(Object.keys(MODIFICATEURS_AURAS) as (keyof typeof MODIFICATEURS_AURAS)[]).map((a) => (
          <figure key={a} style={{ margin: 0, textAlign: 'center', width: 70 }}>
            <Jeton c={pion(a, { modificateurs: [MODIFICATEURS_AURAS[a]] })} taille={56} details />
            <figcaption style={{ fontSize: 11, marginTop: 6 }}>{LIBELLES_AURAS[a]}</figcaption>
          </figure>
        ))}
        <figure style={{ margin: 0, textAlign: 'center', width: 70 }}>
          <Jeton c={pion('conc', { concentration: { sort: 'benediction', cibles: [] } })} taille={56} details />
          <figcaption style={{ fontSize: 11, marginTop: 6 }}>{LIBELLES_AURAS.concentration}</figcaption>
        </figure>
        <figure style={{ margin: 0, textAlign: 'center', width: 70 }}>
          <Jeton c={pion('pvt', { pvTemp: 5 })} taille={56} details />
          <figcaption style={{ fontSize: 11, marginTop: 6 }}>PV temporaires</figcaption>
        </figure>
        <figure style={{ margin: 0, textAlign: 'center', width: 70 }}>
          <Jeton
            c={pion('trio', { modificateurs: [MODIFICATEURS_AURAS.benediction, MODIFICATEURS_AURAS.bouclier, MODIFICATEURS_AURAS.marque] })}
            taille={56}
            details
          />
          <figcaption style={{ fontSize: 11, marginTop: 6 }}>trois auras</figcaption>
        </figure>
        {ETATS.map((e) => (
          <figure key={e} style={{ margin: 0, textAlign: 'center', width: 70 }}>
            <Jeton c={pion(e, { etats: [{ etat: e }], camp: 'monstres', modele: 'ogre' })} taille={56} details />
            <figcaption style={{ fontSize: 11, marginTop: 6 }}>{libelleEtat(e)}</figcaption>
          </figure>
        ))}
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
