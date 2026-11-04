// Pictogrammes des cartes : sorts, écoles de magie, coûts (action, bonus, réaction, élan), actions de base, armes.
// Dessins maison (voir icones/CREDITS.md), en SVG 64 × 64, deux tons : `p1` clair, `p2` teinte du sujet, `p3` ombre ; `t1`/`t2`/`t3`
// sont les mêmes en trait. Les couleurs viennent du CSS (`.pic`), la teinte de chaque pictogramme de `TEINTES`.
//
// Inspiration : les écoles de magie du SRD 5.2.1 (chaque sort en porte une, `ecole` dans les données) et les conventions du
// monde D&D pour l'économie d'actions (un rond pour l'action, un triangle pour l'action bonus, une flèche en boucle pour la
// réaction). Le SRD lui-même ne contient pas d'images.

export interface Teinte {
  /** Couleur vive du sujet. */
  clair: string;
  /** Fond sombre du médaillon. */
  fonce: string;
}

export const TEINTES = {
  feu: { clair: '#ffa347', fonce: '#4b1c0a' },
  froid: { clair: '#92deff', fonce: '#0e3047' },
  foudre: { clair: '#ffe85e', fonce: '#403506' },
  radiant: { clair: '#ffeaa6', fonce: '#4d3b0f' },
  force: { clair: '#cba8ff', fonce: '#2c1852' },
  soin: { clair: '#74e6a4', fonce: '#0b3b25' },
  protection: { clair: '#86b8ff', fonce: '#102c55' },
  charme: { clair: '#f4a6e4', fonce: '#401a43' },
  malediction: { clair: '#a4e36d', fonce: '#1f3b10' },
  divination: { clair: '#e4ecf8', fonce: '#27303f' },
  necro: { clair: '#8fe3b0', fonce: '#12301f' },
  transmutation: { clair: '#ffbd70', fonce: '#4a2a08' },
  acier: { clair: '#d5dce4', fonce: '#242c36' },
  sang: { clair: '#ff8f80', fonce: '#4a1410' },
  or: { clair: '#f0cd84', fonce: '#3d2c0c' },
  action: { clair: '#e8a24d', fonce: '#4a2e0a' },
  bonus: { clair: '#5fc293', fonce: '#0f3a29' },
  reaction: { clair: '#74a8e6', fonce: '#13304f' },
  elan: { clair: '#b894f0', fonce: '#2d1a52' },
  gratuit: { clair: '#b4bbc2', fonce: '#2b3035' },
} satisfies Record<string, Teinte>;
export type NomTeinte = keyof typeof TEINTES;

export interface Dessin {
  teinte: NomTeinte;
  /** Le contenu du SVG (viewBox 0 0 64 64). */
  corps: string;
}

// ---------------------------------------------------------------------------
// Pièces communes
// ---------------------------------------------------------------------------

const g = (transform: string, corps: string) => `<g transform="${transform}">${corps}</g>`;
const trait = (d: string, classe = 't2', largeur?: number) => `<path class="${classe}" d="${d}"${largeur ? ` stroke-width="${largeur}"` : ''}/>`;
const rond = (x: number, y: number, r: number, classe = 'p1') => `<circle cx="${x}" cy="${y}" r="${r}" class="${classe}"/>`;

/** Une étincelle à quatre branches, centrée en (x, y), de rayon 10 × s. */
const etoile = (x: number, y: number, s = 1, classe = 'p1') =>
  `<path class="${classe}" transform="translate(${x} ${y}) scale(${s})" d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z"/>`;

/** Une flamme, pointe en haut, hauteur 50. */
const FLAMME =
  '<path class="p2" d="M32 6 C37 16 49 22 46 38 C44 49 37 56 30 56 C21 56 15 49 16 40 C17 33 22 30 24 24 C26 28 29 29 29 24 C29 17 31 11 32 6Z"/>' +
  '<path class="p1" d="M32 28 C36 33 42 36 40 43 C39 48 35 52 31 52 C26 52 23 48 24 43 C25 39 29 36 32 28Z"/>';

/** Une boule de feu qui file vers le haut à droite : une tête ronde et trois langues de flamme derrière elle. */
const BOULE =
  '<path class="p2" d="M34 36 C22 34 10 42 2 60 C14 52 26 54 38 47Z"/>' +
  '<path class="p2" d="M29 27 C19 25 9 29 1 38 C12 35 22 39 32 35Z"/>' +
  '<path class="p2" d="M45 40 C42 51 35 59 24 63 C35 61 45 57 51 46Z"/>' +
  '<circle cx="42" cy="24" r="16" class="p2"/>' +
  '<circle cx="43.5" cy="22.5" r="9.5" class="p1"/>' +
  '<circle cx="40" cy="26" r="4" class="p2" opacity=".45"/>';

const ECLAIR =
  '<path class="p2" d="M38 4 L14 36 H29 L24 60 L50 26 H35Z"/><path class="p1" d="M37 14 L24 32 H34 L31 46 L42 30 H33Z"/>';

const BOUCLIER =
  '<path class="p2" d="M32 5 L53 13 V31 C53 45 44 55 32 60 C20 55 11 45 11 31 V13Z"/>' +
  '<path class="p3" d="M32 5 L53 13 V31 C53 45 44 55 32 60Z"/>' +
  '<path class="t1" stroke-width="2" d="M32 11 L47 17 V31 C47 41 41 49 32 54 C23 49 17 41 17 31 V17Z"/>';

const CROIX = '<path class="p2" d="M25 8 H39 V25 H56 V39 H39 V56 H25 V39 H8 V25 H25Z"/><path class="p1" d="M28 12 H36 V28 H52 V36 H36 V52 H28 V36 H12 V28 H28Z"/>';

/** Rayons réguliers autour d'un centre. */
function rayons(cx: number, cy: number, r1: number, r2: number, n: number, classe = 't2'): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    d += `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)} L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)} `;
  }
  return trait(d, classe);
}

/** Étoile à `n` pointes. */
function polygoneEtoile(cx: number, cy: number, rExt: number, rInt: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 === 0 ? rExt : rInt;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Spirale hypnotique. */
function spirale(): string {
  let d = 'M32 32';
  for (let a = 0.3; a < 4.2 * Math.PI; a += 0.25) {
    const r = 1.2 + a * 2.1;
    d += ` L${(32 + r * Math.cos(a)).toFixed(1)} ${(32 + r * Math.sin(a)).toFixed(1)}`;
  }
  return trait(d, 't2', 4.2);
}

// Flèches en boucle : deux arcs de cercle de rayon 20 autour de (32, 32).
const FLECHES_BOUCLE =
  trait('M13.2 25.2 A20 20 0 0 1 50.8 25.2', 't2', 5.5) +
  '<path class="p2" d="M56 34 L43 32 L52 21Z"/>' +
  trait('M50.8 38.8 A20 20 0 0 1 13.2 38.8', 't2', 5.5) +
  '<path class="p2" d="M8 30 L21 32 L12 43Z"/>';

// ---------------------------------------------------------------------------
// Armes
// ---------------------------------------------------------------------------

const LAME_LONGUE =
  '<path class="p2" d="M32 2 L39 10 L37 40 H27 L25 10Z"/><path class="p1" d="M32 2 L32 40 H27 L25 10Z"/>' +
  '<path class="p1" d="M14 40 H50 L47 47 H17Z"/><path class="p3" d="M20 43 H44 V47 H20Z"/>' +
  '<path class="p2" d="M29 47 H35 V57 H29Z"/>' +
  rond(32, 60, 3.6, 'p1');

const RAPIERE =
  '<path class="p2" d="M32 2 L35 8 L34 42 H30 L29 8Z"/><path class="p1" d="M32 2 L32 42 H30 L29 8Z"/>' +
  trait('M16 44 C20 36 44 36 48 44', 't1', 4) +
  rond(32, 41, 4, 'p1') +
  '<path class="p2" d="M30 46 H34 V57 H30Z"/>' +
  rond(32, 60, 3.2, 'p1');

const DAGUE =
  '<path class="p2" d="M32 6 L38 14 L36 34 H28 L26 14Z"/><path class="p1" d="M32 6 L32 34 H28 L26 14Z"/>' +
  '<path class="p1" d="M20 34 H44 L42 40 H22Z"/><path class="p2" d="M29 40 H35 V54 H29Z"/>' +
  rond(32, 57, 3.4, 'p1');

const HACHE =
  '<path class="p2" d="M29 6 H35 V60 H29Z"/><path class="p3" d="M33 6 H35 V60 H33Z"/>' +
  '<path class="p1" d="M35 8 C56 6 60 28 52 40 C50 32 44 28 35 28Z"/>' +
  '<path class="p3" d="M35 28 C44 28 50 32 52 40 C50 34 44 31 35 31Z"/>';

const HACHETTE =
  '<path class="p2" d="M30 18 H35 V60 H30Z"/>' +
  '<path class="p1" d="M35 14 C52 12 56 30 48 38 C46 31 41 28 35 28Z"/>' +
  '<path class="p3" d="M35 28 C41 28 46 31 48 38 C45 33 41 31 35 31Z"/>';

const MASSE =
  '<path class="p2" d="M29 28 H35 V60 H29Z"/>' +
  `<polygon class="p1" points="${polygoneEtoile(32, 17, 15, 9.5, 8)}"/>` +
  rond(32, 17, 7, 'p2');

const BATON =
  '<path class="p2" d="M29 4 H35 V60 H29Z"/><path class="p1" d="M27 4 H37 V12 H27Z"/><path class="p1" d="M27 52 H37 V60 H27Z"/>' +
  '<path class="p3" d="M33 12 H35 V52 H33Z"/>' +
  trait('M29 28 H35 M29 34 H35', 't1', 2.5);

const ARC =
  trait('M18 4 C54 12 54 52 18 60', 't1', 6) +
  trait('M18 4 L18 60', 't2', 1.8) +
  trait('M6 32 H50', 't1', 3.2) +
  '<path class="p1" d="M52 32 L42 26 L42 38Z"/>' +
  '<path class="p2" d="M6 32 L12 27 M6 32 L12 37" stroke-width="2.5" fill="none"/>';

const JAVELINE =
  trait('M8 56 L44 20', 't1', 3.5) +
  '<path class="p2" d="M42 12 L56 8 L52 22 L46 18Z"/><path class="p1" d="M42 12 L56 8 L48 16Z"/>' +
  trait('M12 50 L16 54 M16 46 L20 50', 't2', 3);

/** Traînées d'une arme lancée. */
export const LANCER = trait('M2 18 H15 M0 30 H13 M3 42 H16', 't2', 3);

const CIMETERRE =
  '<path class="p2" d="M18 4 C46 8 60 30 52 52 C50 40 38 22 18 14Z"/><path class="p1" d="M18 4 C46 8 60 30 52 52 C56 30 44 14 18 6Z"/>' +
  '<path class="p1" d="M10 12 L26 20 L23 25 L7 17Z"/><path class="p2" d="M10 20 L16 28 L10 34 L4 26Z"/>' +
  rond(8, 38, 3.5, 'p1');

// ---------------------------------------------------------------------------
// Le catalogue
// ---------------------------------------------------------------------------

export const DESSINS: Record<string, Dessin> = {
  // ---- Sorts jouables ----------------------------------------------------
  'sort:trait-de-feu': { teinte: 'feu', corps: BOULE + etoile(55, 8, 0.6) },
  'sort:rayon-de-givre': {
    teinte: 'froid',
    corps:
      g(
        'rotate(38 32 32)',
        '<path class="p2" d="M32 3 L45 26 L32 61 L19 26Z"/><path class="p1" d="M32 3 L45 26 L32 31Z"/><path class="p3" d="M32 31 L45 26 L32 61Z"/><path class="p3" opacity=".5" d="M32 3 L19 26 L32 31Z"/>',
      ) +
      '<path class="p2" d="M9 24 L16 34 L8 40Z"/><path class="p2" d="M54 38 L52 52 L44 44Z"/>' +
      etoile(50, 12, 0.6),
  },
  'sort:poigne-electrique': {
    teinte: 'foudre',
    corps:
      g('translate(10 -4) scale(.82)', ECLAIR) +
      trait('M7 12 Q1 24 7 36 M57 12 Q63 24 57 36', 't2', 3.5) +
      trait('M13 8 Q9 14 13 20 M51 8 Q55 14 51 20', 't2', 2.5) +
      // Un poing serré : la paume, quatre phalanges, les doigts repliés.
      '<rect x="13" y="42" width="38" height="19" rx="8" class="p1"/>' +
      [20, 28.5, 37, 45].map((x) => `<circle cx="${x}" cy="42" r="6" class="p1"/>`).join('') +
      trait('M24 45 V54 M32.5 44 V54 M41 45 V54', 't3', 2.2) +
      '<rect x="13" y="55" width="38" height="6" rx="3" class="p3"/>',
  },
  'sort:flamme-sacree': {
    teinte: 'radiant',
    corps: rayons(32, 32, 22, 30, 12, 't2') + trait('M32 32 m-19 0 a19 19 0 1 0 38 0 a19 19 0 1 0 -38 0', 't1', 2) + g('translate(12 13) scale(.62)', FLAMME),
  },
  'sort:projectile-magique': {
    teinte: 'force',
    // Trois fléchettes d'énergie qui partent d'un même point en éventail, chacune avec sa traînée.
    corps:
      [18, 52, 86]
        .map((a) => {
          const r = (a * Math.PI) / 180;
          const [s, c] = [Math.sin(r), Math.cos(r)];
          const [x, y] = [16 + 34 * s, 50 - 34 * c];
          return (
            g(`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})`, '<path class="p2" d="M0 -15 L5.5 -3 L0 12 L-5.5 -3Z"/><path class="p1" d="M0 -15 L5.5 -3 L0 -1Z"/>') +
            trait(`M${(x - 14 * s).toFixed(1)} ${(y + 14 * c).toFixed(1)} L${(16 + 7 * s).toFixed(1)} ${(50 - 7 * c).toFixed(1)}`, 't2', 3)
          );
        })
        .join('') + etoile(12, 54, 0.55),
  },
  'sort:bouclier': { teinte: 'protection', corps: BOUCLIER + etoile(32, 32, 1.1) + trait('M32 32 m-29 0 a29 29 0 1 0 58 0 a29 29 0 1 0 -58 0', 't2', 1.5) },
  'sort:mains-brulantes': {
    teinte: 'feu',
    corps:
      g('translate(32 58) rotate(-40) scale(.66) translate(-32 -56)', FLAMME) +
      g('translate(32 58) rotate(40) scale(.66) translate(-32 -56)', FLAMME) +
      g('translate(32 58) scale(.82) translate(-32 -56)', FLAMME) +
      '<path class="p1" d="M14 62 C14 54 22 50 32 50 C42 50 50 54 50 62Z"/>',
  },
  'sort:sommeil': {
    teinte: 'charme',
    corps:
      '<path class="p2" d="M36 6 C21 8 10 19 10 33 C10 47 21 58 36 60 C27 54 22 45 22 33 C22 21 27 12 36 6Z"/>' +
      trait('M38 14 H50 L38 28 H50', 't1', 4) +
      trait('M46 36 H55 L46 47 H55', 't1', 3.4) +
      etoile(54, 12, 0.5) +
      etoile(36, 50, 0.45),
  },
  'sort:soins': {
    teinte: 'soin',
    corps:
      '<path class="p2" d="M32 58 C8 42 4 26 11 17 C18 9 28 12 32 21 C36 12 46 9 53 17 C60 26 56 42 32 58Z"/>' +
      '<path class="p1" d="M29 25 H35 V32 H42 V38 H35 V45 H29 V38 H22 V32 H29Z"/>' +
      etoile(54, 10, 0.55),
  },
  'sort:mot-de-guerison': {
    teinte: 'soin',
    corps: g('translate(32 32) scale(.78) translate(-32 -32)', CROIX) + trait('M8 22 Q2 32 8 42 M56 22 Q62 32 56 42', 't2', 3.5) + trait('M14 16 Q8 32 14 48', 't2', 2.5) + trait('M50 16 Q56 32 50 48', 't2', 2.5) + etoile(32, 6, 0.5),
  },
  'sort:benediction': {
    teinte: 'radiant',
    corps: etoile(32, 32, 2.7, 'p2') + etoile(32, 32, 1.3) + etoile(11, 13, 0.7) + etoile(54, 50, 0.6) + etoile(52, 10, 0.4, 'p2') + trait('M32 32 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0', 't1', 1.6),
  },
  'sort:fleau': {
    teinte: 'malediction',
    corps:
      '<path class="p2" d="M3 34 C14 16 50 16 61 34 C50 52 14 52 3 34Z"/><path class="p1" d="M11 34 C22 22 42 22 53 34 C42 46 22 46 11 34Z"/>' +
      '<ellipse cx="32" cy="34" rx="4.5" ry="11" class="p3"/>' +
      trait('M32 4 V12 M14 9 L18 16 M50 9 L46 16', 't2', 3.5) +
      trait('M20 56 V62 M32 56 V62 M44 56 V62', 't2', 3),
  },
  'sort:eclair-tracant': {
    teinte: 'radiant',
    corps:
      '<path class="p2" d="M4 56 L9 61 L52 18 L47 13Z"/><path class="p1" d="M6 56 L9 59 L50 18 L47 15Z"/>' +
      etoile(48, 16, 2.1, 'p2') +
      etoile(48, 16, 1.1) +
      trait('M16 40 L22 46 M26 30 L32 36 M36 20 L42 26', 't3', 3),
  },
  'sort:bouclier-de-la-foi': {
    teinte: 'protection',
    corps:
      '<ellipse cx="32" cy="9" rx="16" ry="5" class="t1" fill="none" stroke-width="3"/>' +
      g('translate(32 36) scale(.86) translate(-32 -34)', BOUCLIER) +
      '<path class="p1" d="M29 24 H35 V31 H42 V37 H35 V47 H29 V37 H22 V31 H29Z"/>',
  },
  'sort:marque-du-chasseur': {
    teinte: 'divination',
    corps:
      trait('M32 32 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', 't1', 3.4) +
      trait('M32 32 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', 't2', 3) +
      trait('M32 2 V14 M32 50 V62 M2 32 H14 M50 32 H62', 't1', 3.4) +
      rond(32, 32, 3.6, 'p2') +
      trait('M44 12 L54 22 M48 10 L58 20', 't2', 2.4),
  },
  'sort:rayon-ardent': {
    teinte: 'feu',
    // Trois traits de feu, trois comètes qui filent côte à côte.
    corps: g('translate(31 0) scale(.5)', BOULE) + g('translate(33 31) scale(.5)', BOULE) + g('translate(1 16) scale(.5)', BOULE),
  },
  'sort:arme-spirituelle': {
    teinte: 'force',
    corps:
      g('rotate(28 32 32)', LAME_LONGUE.replace(/class="p3"/g, 'class="p3"')) +
      etoile(10, 14, 0.7) +
      etoile(54, 48, 0.6) +
      etoile(50, 12, 0.4, 'p2') +
      trait('M10 52 Q16 46 12 40 M54 24 Q48 20 52 14', 't2', 2.2),
  },
  'sort:aide': {
    teinte: 'soin',
    corps:
      '<path class="p2" d="M10 30 L32 8 L54 30 L46 38 L32 24 L18 38Z"/><path class="p1" d="M10 30 L32 8 L32 24 L18 38Z"/>' +
      '<path class="p2" d="M12 52 L32 32 L52 52 L45 59 L32 46 L19 59Z"/><path class="p1" d="M12 52 L32 32 L32 46 L19 59Z"/>' +
      etoile(54, 10, 0.55) +
      etoile(10, 12, 0.4, 'p2'),
  },
  'sort:immobilisation-de-personne': {
    teinte: 'charme',
    corps:
      '<ellipse cx="8" cy="42" rx="7" ry="4.5" class="t2" fill="none" stroke-width="3.5"/><ellipse cx="56" cy="42" rx="7" ry="4.5" class="t2" fill="none" stroke-width="3.5"/>' +
      trait('M23 28 V20 C23 6 41 6 41 20 V28', 't1', 5) +
      '<rect x="15" y="28" width="34" height="28" rx="5" class="p2"/>' +
      '<rect x="15" y="28" width="34" height="9" rx="4" class="p1" opacity=".35"/>' +
      '<circle cx="32" cy="41" r="4.5" class="p3"/><path class="p3" d="M30 43 H34 L35 51 H29Z"/>',
  },
  'sort:restauration-partielle': {
    teinte: 'soin',
    corps: FLECHES_BOUCLE + '<path class="p1" d="M29 22 H35 V29 H42 V35 H35 V42 H29 V35 H22 V29 H29Z"/>',
  },

  // ---- Écoles de magie (repli pour un sort sans dessin propre) -----------
  'ecole:abjuration': { teinte: 'protection', corps: BOUCLIER + trait('M32 20 V44 M20 32 H44', 't1', 3.4) },
  'ecole:conjuration': {
    teinte: 'radiant',
    corps:
      '<ellipse cx="32" cy="34" rx="22" ry="26" class="p2"/><ellipse cx="32" cy="34" rx="15" ry="19" class="p3"/><ellipse cx="32" cy="34" rx="8" ry="11" class="p1"/>' +
      trait('M32 34 m-27 0 a27 31 0 1 0 54 0', 't1', 2.4) +
      etoile(54, 10, 0.55) +
      etoile(10, 58, 0.4, 'p2'),
  },
  'ecole:divination': {
    teinte: 'divination',
    corps:
      '<path class="p2" d="M3 32 C14 12 50 12 61 32 C50 52 14 52 3 32Z"/><path class="p1" d="M10 32 C20 19 44 19 54 32 C44 45 20 45 10 32Z"/>' +
      rond(32, 32, 9.5, 'p2') +
      rond(32, 32, 4.5, 'p3') +
      rond(28.5, 28.5, 2.2, 'p1') +
      trait('M32 2 V8 M12 8 L15 13 M52 8 L49 13', 't2', 3),
  },
  'ecole:enchantement': { teinte: 'charme', corps: spirale() + etoile(52, 12, 0.55) + etoile(12, 54, 0.45, 'p2') },
  'ecole:evocation': {
    teinte: 'feu',
    corps: `<polygon class="p2" points="${polygoneEtoile(32, 32, 30, 15, 10)}"/>` + rond(32, 32, 11, 'p1') + rond(32, 32, 5, 'p2'),
  },
  'ecole:illusion': {
    teinte: 'force',
    corps:
      '<path class="p2" d="M12 12 C12 4 52 4 52 12 C52 36 46 56 32 60 C18 56 12 36 12 12Z"/><path class="p3" d="M32 4 C52 4 52 12 52 12 C52 36 46 56 32 60Z"/>' +
      '<path class="p1" d="M18 24 Q24 18 30 26 Q24 30 18 24Z"/><path class="p1" d="M46 24 Q40 18 34 26 Q40 30 46 24Z"/>' +
      trait('M22 42 Q32 52 42 42', 't1', 3.4) +
      etoile(54, 54, 0.5),
  },
  'ecole:necromancie': {
    teinte: 'necro',
    corps:
      '<path class="p1" d="M32 4 C15 4 8 17 10 30 C11 37 17 39 19 43 V54 H45 V43 C47 39 53 37 54 30 C56 17 49 4 32 4Z"/>' +
      '<path class="p3" d="M32 4 C49 4 56 17 54 30 C53 37 47 39 45 43 V54 H32Z"/>' +
      '<circle cx="22" cy="29" r="7.5" class="p2"/><circle cx="42" cy="29" r="7.5" class="p2"/>' +
      '<path class="p2" d="M32 36 L28 44 H36Z"/>' +
      trait('M26 54 V46 M32 54 V46 M38 54 V46', 't2', 2.5),
  },
  'ecole:transmutation': { teinte: 'transmutation', corps: FLECHES_BOUCLE + '<path class="p1" d="M32 20 L42 32 L32 44 L22 32Z"/><path class="p3" d="M32 20 L42 32 L32 32Z"/>' },

  // ---- Coûts d'une carte (pastilles, lues à 12 px : formes pleines et simples) ----
  'cout:action': {
    teinte: 'action',
    corps: '<circle cx="32" cy="32" r="28" class="p2"/><circle cx="32" cy="32" r="18" class="p3"/><circle cx="32" cy="32" r="11" class="p1"/>',
  },
  'cout:bonus': { teinte: 'bonus', corps: '<path class="p2" d="M32 3 L61 56 H3Z"/><path class="p1" d="M32 24 L46 49 H18Z"/>' },
  'cout:reaction': {
    teinte: 'reaction',
    corps: trait('M44.9 16.7 A20 20 0 1 0 47.3 44.9', 't2', 10) + '<path class="p2" d="M55 36 L51 52 L38 42Z"/>',
  },
  'cout:elan': { teinte: 'elan', corps: etoile(32, 32, 3, 'p2') + etoile(32, 32, 1.4) },
  'cout:gratuit': { teinte: 'gratuit', corps: trait('M32 32 m-23 0 a23 23 0 1 0 46 0 a23 23 0 1 0 -46 0', 't2', 9) + rond(32, 32, 6) },

  // ---- Actions de base ---------------------------------------------------
  // Désamorcer : un engrenage de mécanisme, barré (neutralisé).
  'base:desamorcer': {
    teinte: 'sang',
    corps:
      [0, 1, 2, 3, 4, 5, 6, 7].map((k) => g(`rotate(${k * 45} 32 32)`, '<rect x="27.5" y="4" width="9" height="13" rx="2.5" class="p2"/>')).join('') +
      rond(32, 32, 19, 'p2') +
      rond(32, 32, 8, 'p3') +
      trait('M10 54 L54 10', 't3', 10) +
      trait('M10 54 L54 10', 't1', 5.5),
  },
  // Crocheter : un cadenas et un crochet de serrurier dans la serrure.
  'base:crocheter': {
    teinte: 'acier',
    corps:
      trait('M20 28 V19 C20 5 40 5 40 19 V28', 't1', 5) +
      '<rect x="10" y="27" width="40" height="28" rx="6" class="p2"/>' +
      rond(30, 38, 4.2, 'p3') +
      '<path class="p3" d="M27.6 40 H32.4 L33.6 49 H26.4Z"/>' +
      trait('M61 60 L40 45', 't3', 6) +
      trait('M61 60 L40 45', 't1', 3.4) +
      trait('M40 45 L35 46.5', 't1', 3.4),
  },
  // Forcer : un pied-de-biche qui fait levier, des éclats autour.
  'base:forcer': {
    teinte: 'acier',
    corps:
      trait('M12 55 L46 21', 't3', 9) +
      trait('M12 55 L46 21', 't1', 6) +
      trait('M46 21 C50 14 57 13 60 17', 't3', 9) +
      trait('M46 21 C50 14 57 13 60 17', 't1', 6) +
      trait('M8 26 L17 30', 't2', 3.4) +
      trait('M14 12 L21 20', 't2', 3.4) +
      trait('M27 6 L29 15', 't2', 3.4),
  },
  // Clé : un anneau, une tige et deux dents.
  'base:cle': {
    teinte: 'or',
    corps:
      rond(18, 22, 14, 'p2') +
      rond(18, 22, 6, 'p3') +
      trait('M28 32 L55 59', 't3', 9) +
      trait('M28 32 L55 59', 't1', 6) +
      trait('M44 47 L51 40', 't1', 5) +
      trait('M51 54 L58 47', 't1', 5),
  },
  // Prendre : un sac de butin noué au col, une pièce dessus.
  'base:prendre': {
    teinte: 'or',
    corps:
      '<path class="p2" d="M22 25 C9 35 8 49 15 56 C22 62 42 62 49 56 C56 49 55 35 42 25Z"/>' +
      '<path class="p2" d="M24 22 C20 11 29 12 32 17 C35 12 44 11 40 22Z"/>' +
      '<rect x="22" y="22" width="20" height="6" rx="2.5" class="p1"/>' +
      rond(32, 45, 7, 'p1') +
      trait('M32 40.5 V49.5', 't3', 2.4) +
      etoile(52, 12, 0.7),
  },
  // Répondre (énigme) : une bulle de parole avec un point d'interrogation.
  'base:repondre': {
    teinte: 'divination',
    corps:
      '<path class="p2" d="M10 8 H54 a5 5 0 0 1 5 5 V38 a5 5 0 0 1 -5 5 H31 L17 56 V43 H10 a5 5 0 0 1 -5 -5 V13 a5 5 0 0 1 5 -5Z"/>' +
      trait('M24 21 C24 11 40 11 40 21 C40 28 32 28 32 34', 't3', 4.6) +
      rond(32, 39, 2.8, 'p3'),
  },
  // Chercher un indice : une bougie allumée, ses rayons.
  'base:indice': {
    teinte: 'radiant',
    corps:
      '<path class="p2" d="M32 4 C37 12 41 17 39 23 C37 28 27 28 25 23 C23 17 27 12 32 4Z"/>' +
      '<path class="p1" d="M32 14 C34 18 36 20 35 23 C34 25 30 25 29 23 C28 20 30 18 32 14Z"/>' +
      trait('M32 28 V33', 't3', 2.6) +
      '<rect x="24" y="32" width="16" height="25" rx="2.5" class="p1"/>' +
      '<path class="p3" d="M32 32 H40 V57 H36Z"/>' +
      '<ellipse cx="32" cy="58" rx="13" ry="3.6" class="p3"/>' +
      trait('M12 16 L18 20 M52 16 L46 20 M7 30 L14 30 M57 30 L50 30', 't2', 3),
  },
  // Halte : un feu de camp, deux bûches croisées.
  'base:halte': {
    teinte: 'feu',
    corps: g('translate(8 -3) scale(.84)', FLAMME) + trait('M8 58 L56 45', 't3', 9) + trait('M8 58 L56 45', 't1', 6) + trait('M8 45 L56 58', 't3', 9) + trait('M8 45 L56 58', 't1', 6),
  },
  // Dormir : un croissant de lune et des z.
  'base:dormir': {
    teinte: 'protection',
    corps:
      '<path class="p2" d="M36 5 C20 7 8 20 8 36 C8 51 21 61 36 61 C44 61 51 58 56 52 C40 53 29 43 29 30 C29 20 32 11 36 5Z"/>' +
      trait('M42 12 H52 L42 24 H52', 't1', 4.2) +
      trait('M51 33 H58 L51 42 H58', 't1', 3.4),
  },
  // Combattre : deux épées croisées.
  'base:combattre': {
    teinte: 'acier',
    corps: g('rotate(40 32 32)', LAME_LONGUE) + g('rotate(-40 32 32)', LAME_LONGUE),
  },
  // Revoir une scène : une flèche qui reboucle autour d'un triangle de lecture.
  'base:revoir': {
    teinte: 'gratuit',
    corps: trait('M52 34 A20 20 0 1 1 44 17', 't1', 5) + '<path class="p1" d="M34 7 L49 16 L35 26Z"/>' + '<path class="p2" d="M26 22 L44 33 L26 44Z"/>',
  },
  // Persuader : une bulle de parole et un cœur.
  'base:persuader': {
    teinte: 'charme',
    corps:
      '<path class="p2" d="M10 8 H54 a5 5 0 0 1 5 5 V38 a5 5 0 0 1 -5 5 H31 L17 56 V43 H10 a5 5 0 0 1 -5 -5 V13 a5 5 0 0 1 5 -5Z"/>' +
      '<path class="p3" d="M32 35 C17 26 21 11 32 20 C43 11 47 26 32 35Z"/>',
  },
  // Intimider : un crâne.
  'base:intimider': {
    teinte: 'sang',
    corps:
      rond(32, 28, 21, 'p2') +
      '<rect x="21" y="38" width="22" height="19" rx="5" class="p2"/>' +
      rond(23.5, 29, 5.6, 'p3') +
      rond(40.5, 29, 5.6, 'p3') +
      '<path class="p3" d="M32 35 L28 43 H36Z"/>' +
      trait('M27 49 V56 M32 49 V56 M37 49 V56', 't3', 2.2),
  },
  // Tromper : un masque de théâtre, les yeux en biais, le sourire en coin.
  'base:tromper': {
    teinte: 'malediction',
    corps:
      '<path class="p2" d="M9 10 H55 V30 C55 47 44 59 32 59 C20 59 9 47 9 30Z"/>' +
      '<path class="p3" d="M15 25 C20 20 29 23 29 30 C24 35 17 33 15 25Z"/>' +
      '<path class="p3" d="M49 25 C44 20 35 23 35 30 C40 35 47 33 49 25Z"/>' +
      trait('M20 43 C27 51 37 51 44 43', 't3', 3.6),
  },
  // Une loupe : verre cerclé d'un reflet, manche épais.
  'base:fouiller': {
    teinte: 'or',
    corps:
      '<circle cx="26" cy="26" r="17" class="p3"/>' +
      '<circle cx="26" cy="26" r="13" class="p2" opacity=".22"/>' +
      trait('M26 26 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0', 't1', 4.5) +
      trait('M15 23 C16 18 20 14 26 13', 't1', 3) +
      trait('M40 40 L55 55', 't2', 9) +
      trait('M52 52 L57 57', 't1', 9),
  },
  'base:foncer': {
    teinte: 'action',
    corps: [4, 20, 36].map((x, i) => `<path class="${i === 2 ? 'p1' : 'p2'}" opacity="${0.5 + i * 0.25}" d="M${x} 10 L${x + 22} 32 L${x} 54 L${x} 43 L${x + 11} 32 L${x} 21Z"/>`).join('') + trait('M2 8 H12 M2 56 H12', 't2', 3),
  },
  'base:desengager': {
    teinte: 'action',
    corps:
      '<circle cx="18" cy="38" r="13" class="p3"/>' +
      trait('M18 38 m-13 0 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0', 't2', 3) +
      '<circle cx="14" cy="35" r="2.6" class="p2"/><circle cx="22" cy="35" r="2.6" class="p2"/>' +
      trait('M34 44 C46 46 56 38 56 24', 't1', 4.5) +
      '<path class="p1" d="M56 8 L63 24 L49 24Z"/>' +
      trait('M34 52 L44 52', 't2', 3),
  },
  'base:esquiver': {
    teinte: 'action',
    corps: g('translate(32 34) scale(.74) translate(-32 -34)', BOUCLIER) + trait('M2 44 C18 30 38 32 62 20', 't1', 4) + trait('M6 56 C22 46 40 48 60 36', 't2', 3),
  },
  'base:potion': {
    teinte: 'soin',
    corps:
      '<path class="p2" d="M16 42 H48 L54 52 C56 58 52 61 46 61 H18 C12 61 8 58 10 52Z"/>' +
      '<path class="t1" stroke-width="3.4" d="M26 8 H38 V26 L55 52 C58 58 53 61 47 61 H17 C11 61 6 58 9 52 L26 26Z"/>' +
      '<rect x="23" y="2" width="18" height="8" rx="2.5" class="p1"/>' +
      rond(26, 50, 3, 'p1') +
      rond(38, 46, 2.2, 'p1'),
  },

  // ---- Armes (la teinte est celle de l'acier) ----------------------------
  'arme:epee': { teinte: 'acier', corps: g('rotate(40 32 32)', LAME_LONGUE) },
  'arme:epee-courte': { teinte: 'acier', corps: g('rotate(40 32 32) translate(0 4) scale(.92)', LAME_LONGUE) },
  'arme:rapiere': { teinte: 'acier', corps: g('rotate(40 32 32)', RAPIERE) },
  'arme:dague': { teinte: 'acier', corps: g('rotate(40 32 32)', DAGUE) },
  'arme:hache': { teinte: 'acier', corps: g('rotate(32 32 32)', HACHE) },
  'arme:hachette': { teinte: 'acier', corps: g('rotate(32 32 32)', HACHETTE) },
  'arme:masse': { teinte: 'acier', corps: g('rotate(30 32 32)', MASSE) },
  'arme:baton': { teinte: 'acier', corps: g('rotate(40 32 32)', BATON) },
  'arme:arc': { teinte: 'acier', corps: ARC },
  'arme:javeline': { teinte: 'acier', corps: JAVELINE },
  'arme:cimeterre': { teinte: 'sang', corps: g('translate(2 2)', CIMETERRE) },

  // ---- Monstres et aptitudes ---------------------------------------------
  'monstre:morsure': {
    teinte: 'sang',
    corps:
      '<path class="p1" d="M6 8 C22 16 42 16 58 8 C58 22 48 30 32 30 C16 30 6 22 6 8Z"/>' +
      '<path class="p2" d="M6 56 C22 48 42 48 58 56 C58 42 48 34 32 34 C16 34 6 42 6 56Z"/>' +
      '<path class="p1" d="M14 16 L19 30 L24 17Z"/><path class="p1" d="M40 17 L45 30 L50 16Z"/>' +
      '<path class="p1" d="M18 50 L24 36 L28 48Z"/><path class="p1" d="M36 48 L40 36 L46 50Z"/>',
  },
  'monstre:attaques-multiples': {
    teinte: 'sang',
    corps: trait('M10 6 L34 58', 't2', 7) + trait('M26 4 L50 56', 't2', 7) + trait('M42 8 L60 50', 't2', 7) + trait('M10 6 L34 58', 't1', 2) + trait('M26 4 L50 56', 't1', 2) + trait('M42 8 L60 50', 't1', 2),
  },
  'aptitude:defaut': {
    teinte: 'or',
    corps: `<polygon class="p2" points="${polygoneEtoile(32, 32, 28, 22, 8)}"/>` + '<path class="p1" d="M32 12 L46 32 L32 52 L18 32Z"/><path class="p3" d="M32 12 L46 32 L32 32Z"/>' + etoile(32, 32, 0.55, 'p2'),
  },
  'aptitude:rage': {
    teinte: 'sang',
    corps: `<polygon class="p2" points="${polygoneEtoile(32, 32, 30, 14, 9)}"/>` + '<path class="p1" d="M18 26 L28 30 M46 26 L36 30" stroke-width="5" fill="none" stroke="#fff3d6" stroke-linecap="round"/>' + '<path class="p3" d="M22 44 Q32 36 42 44 L40 48 Q32 42 24 48Z"/>',
  },
  'aptitude:second-souffle': {
    teinte: 'soin',
    corps: '<path class="p2" d="M32 58 C8 42 4 26 11 17 C18 9 28 12 32 21 C36 12 46 9 53 17 C60 26 56 42 32 58Z"/>' + trait('M14 30 H34 C40 30 40 22 34 22 M14 38 H40 C46 38 46 46 40 46', 't1', 3.4),
  },
  'aptitude:preservation': { teinte: 'radiant', corps: rayons(32, 32, 24, 31, 8, 't2') + g('translate(32 32) scale(.74) translate(-32 -32)', CROIX) },
  'aptitude:visee-appliquee': {
    teinte: 'divination',
    corps: trait('M32 32 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', 't1', 3.4) + trait('M32 4 V18 M32 46 V60 M4 32 H18 M46 32 H60', 't1', 3.4) + rond(32, 32, 4.5, 'p2'),
  },
};

/** Un dessin qui n'existe pas se remplace par un autre, jamais par un trou. */
export const DESSIN_DEFAUT = DESSINS['aptitude:defaut']!;
