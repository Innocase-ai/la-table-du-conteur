const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/sebas/.gemini/antigravity/brain/820dc3c5-5972-4690-8475-f7273af5c9b0/carte_atlas_continentale_clean_1794079559022.jpg';
const imgB64 = fs.readFileSync(imgPath).toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1376 768" width="1376" height="768" style="background:#0d0e12; font-family:'Cinzel', 'Trajan Pro', 'Georgia', serif;">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.95"/>
    </filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff2be"/>
      <stop offset="35%" stop-color="#dfb743"/>
      <stop offset="70%" stop-color="#b88b14"/>
      <stop offset="100%" stop-color="#705203"/>
    </linearGradient>
    <linearGradient id="cartoucheBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181512" stop-opacity="0.96"/>
      <stop offset="50%" stop-color="#0c0a08" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#181512" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0a0c10" stop-opacity="0.1"/>
      <stop offset="15%" stop-color="#11141c" stop-opacity="0.88"/>
      <stop offset="50%" stop-color="#171b26" stop-opacity="0.96"/>
      <stop offset="85%" stop-color="#11141c" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#0a0c10" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <!-- IMAGE DE FOND HAUTE DÉFINITION DU CONTINENT -->
  <image href="data:image/jpeg;base64,${imgB64}" x="0" y="0" width="1376" height="768"/>

  <!-- VIGNETTAGE NATUREL DES BORDS -->
  <rect x="0" y="0" width="1376" height="768" fill="none" stroke="#000000" stroke-width="32" opacity="0.4"/>

  <!-- GRAND CADRE ORNEMENTAL D'ATLAS DE FANTASY -->
  <rect x="18" y="18" width="1340" height="732" fill="none" stroke="url(#goldGrad)" stroke-width="4.5" filter="url(#shadow)"/>
  <rect x="26" y="26" width="1324" height="716" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="10,5" opacity="0.85"/>
  <rect x="32" y="32" width="1312" height="704" fill="none" stroke="#b88b14" stroke-width="0.75" opacity="0.6"/>

  <!-- COINS OUVRAGÉS ET ROSETTES -->
  <!-- Coin Haut-Gauche -->
  <path d="M 18,55 L 55,18 M 18,70 L 70,18 M 28,28 L 50,28 L 28,50 Z" fill="url(#goldGrad)" stroke="url(#goldGrad)" filter="url(#shadow)"/>
  <circle cx="40" cy="40" r="4.5" fill="#fff2be"/>
  <!-- Coin Haut-Droit -->
  <path d="M 1358,55 L 1321,18 M 1358,70 L 1306,18 M 1348,28 L 1326,28 L 1348,50 Z" fill="url(#goldGrad)" stroke="url(#goldGrad)" filter="url(#shadow)"/>
  <circle cx="1336" cy="40" r="4.5" fill="#fff2be"/>
  <!-- Coin Bas-Gauche -->
  <path d="M 18,713 L 55,750 M 18,698 L 70,750 M 28,738 L 50,738 L 28,716 Z" fill="url(#goldGrad)" stroke="url(#goldGrad)" filter="url(#shadow)"/>
  <circle cx="40" cy="728" r="4.5" fill="#fff2be"/>
  <!-- Coin Bas-Droit -->
  <path d="M 1358,713 L 1321,750 M 1358,698 L 1306,750 M 1348,738 L 1326,738 L 1348,716 Z" fill="url(#goldGrad)" stroke="url(#goldGrad)" filter="url(#shadow)"/>
  <circle cx="1336" cy="728" r="4.5" fill="#fff2be"/>

  <!-- ROSE DES VENTS D'ATLAS (Coin Inférieur Gauche) -->
  <g transform="translate(105, 645)" filter="url(#shadow)" opacity="0.95">
    <circle cx="0" cy="0" r="44" fill="#0c0e12" fill-opacity="0.85" stroke="url(#goldGrad)" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="38" fill="none" stroke="#dfb743" stroke-width="0.75" stroke-dasharray="3,2"/>
    <polygon points="0,-42 7,-10 0,0" fill="#fff2be"/>
    <polygon points="0,-42 -7,-10 0,0" fill="#b88b14"/>
    <polygon points="0,42 7,10 0,0" fill="#b88b14"/>
    <polygon points="0,42 -7,10 0,0" fill="#fff2be"/>
    <polygon points="42,0 10,7 0,0" fill="#b88b14"/>
    <polygon points="42,0 10,-7 0,0" fill="#fff2be"/>
    <polygon points="-42,0 -10,7 0,0" fill="#fff2be"/>
    <polygon points="-42,0 -10,-7 0,0" fill="#b88b14"/>
    <circle cx="0" cy="0" r="5.5" fill="url(#goldGrad)"/>
    <text x="0" y="-48" text-anchor="middle" fill="#fff2be" font-size="13" font-weight="bold">N</text>
    <text x="0" y="58" text-anchor="middle" fill="#dfb743" font-size="10">S</text>
    <text x="54" y="4" text-anchor="middle" fill="#dfb743" font-size="10">E</text>
    <text x="-54" y="4" text-anchor="middle" fill="#dfb743" font-size="10">O</text>
  </g>

  <!-- GRAND CARTOUCHE DU TITRE DU MONDE (Haut Centre) -->
  <g transform="translate(688, 56)" filter="url(#shadow)">
    <path d="M -280,-28 L 280,-28 L 302,0 L 280,28 L -280,28 L -302,0 Z" fill="url(#cartoucheBg)" stroke="url(#goldGrad)" stroke-width="2.5"/>
    <path d="M -270,-22 L 270,-22 L 288,0 L 270,22 L -270,22 L -288,0 Z" fill="none" stroke="#dfb743" stroke-width="1" stroke-dasharray="6,3" opacity="0.8"/>
    <circle cx="-294" cy="0" r="4" fill="#fff2be"/>
    <circle cx="294" cy="0" r="4" fill="#fff2be"/>
    <text x="0" y="5" text-anchor="middle" fill="url(#goldGrad)" font-size="22" font-weight="bold" letter-spacing="6" filter="url(#glow)">L'ÉCHIQUIER D'OMBRESANG</text>
    <text x="0" y="21" text-anchor="middle" fill="#d9cbab" font-size="9" font-style="italic" letter-spacing="2.5">LE CONTINENT DES DIEUX DÉCHUS — CARTE DES HUIT PROVINCES</text>
  </g>

  <!-- NOM DE LA CAPITALE IMPÉRIALE : SÉPULCRE-D'OR (AU CENTRE DU MONDE) -->
  <g transform="translate(680, 355)" filter="url(#shadow)">
    <circle cx="0" cy="0" r="28" fill="#dfb743" fill-opacity="0.25" filter="url(#glow)"/>
    <circle cx="0" cy="0" r="7" fill="#fff2be" stroke="#5a4205" stroke-width="2"/>
    <circle cx="0" cy="0" r="12" fill="none" stroke="#fff2be" stroke-width="1.2" stroke-dasharray="2,2"/>
    <rect x="-115" y="14" width="230" height="34" rx="4" fill="url(#cartoucheBg)" stroke="url(#goldGrad)" stroke-width="2"/>
    <text x="0" y="30" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="bold" letter-spacing="2.5">SÉPULCRE-D'OR</text>
    <text x="0" y="42" text-anchor="middle" fill="#fff2be" font-size="8.5" font-style="italic" letter-spacing="1.5">CAPITALE IMPÉRIALE (LE CŒUR)</text>
  </g>

  <!-- BANNIÈRES DES 8 GRANDES RÉGIONS -->

  <!-- 1. NORD : LA CICATRICE BLÊME -->
  <g transform="translate(695, 145)" filter="url(#shadow)">
    <rect x="-125" y="-15" width="250" height="30" rx="4" fill="url(#bannerBg)" stroke="#a5c8ff" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#eaf2ff" font-size="12" font-weight="bold" letter-spacing="2">LA CICATRICE BLÊME</text>
    <text x="0" y="-18" text-anchor="middle" fill="#a5c8ff" font-size="8.5" letter-spacing="1.2">GRAND NORD GLACÉ &amp; CRATÈRE COSMIQUE</text>
  </g>

  <!-- 2. NORD-OUEST : LES CRÊTES DE FER-TITAN -->
  <g transform="translate(285, 215)" filter="url(#shadow)">
    <rect x="-130" y="-15" width="260" height="30" rx="4" fill="url(#bannerBg)" stroke="#d1d5db" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="bold" letter-spacing="1.8">CRÊTES DE FER-TITAN</text>
    <text x="0" y="-18" text-anchor="middle" fill="#d1d5db" font-size="8.5" letter-spacing="1.2">MONTAGNES DU DIEU DE LA GUERRE</text>
  </g>

  <!-- 3. NORD-EST : LES ARCHIPELS D'AÉTHERIA -->
  <g transform="translate(1085, 195)" filter="url(#shadow)">
    <rect x="-135" y="-15" width="270" height="30" rx="4" fill="url(#bannerBg)" stroke="#7dd3fc" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#f0f9ff" font-size="11.5" font-weight="bold" letter-spacing="1.8">ARCHIPELS D'AÉTHERIA</text>
    <text x="0" y="-18" text-anchor="middle" fill="#7dd3fc" font-size="8.5" letter-spacing="1.2">HAUTS PLATEAUX ET ÎLES DU VENT</text>
  </g>

  <!-- 4. CENTRE-OUEST : LES TERRES DU PÉCHÉ D'OR -->
  <g transform="translate(325, 385)" filter="url(#shadow)">
    <rect x="-135" y="-15" width="270" height="30" rx="4" fill="url(#bannerBg)" stroke="#fde047" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#fef9c3" font-size="11.5" font-weight="bold" letter-spacing="1.8">TERRES DU PÉCHÉ D'OR</text>
    <text x="0" y="-18" text-anchor="middle" fill="#fde047" font-size="8.5" letter-spacing="1.2">PLAINES DES SERMENTS BRISÉS</text>
  </g>

  <!-- 5. EST : LA SYLVE DE CHAIR-VERTE -->
  <g transform="translate(1100, 415)" filter="url(#shadow)">
    <rect x="-135" y="-15" width="270" height="30" rx="4" fill="url(#bannerBg)" stroke="#4ade80" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#dcfce7" font-size="11.5" font-weight="bold" letter-spacing="1.8">SYLVE DE CHAIR-VERTE</text>
    <text x="0" y="-18" text-anchor="middle" fill="#4ade80" font-size="8.5" letter-spacing="1.2">JUNGLE DE LA DÉESSE DE LA VIE</text>
  </g>

  <!-- 6. SUD-OUEST : LA MER DE VIF-ARGENT -->
  <g transform="translate(315, 555)" filter="url(#shadow)">
    <rect x="-125" y="-15" width="250" height="30" rx="4" fill="url(#bannerBg)" stroke="#94a3b8" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#f8fafc" font-size="11.5" font-weight="bold" letter-spacing="1.8">MER DE VIF-ARGENT</text>
    <text x="0" y="-18" text-anchor="middle" fill="#94a3b8" font-size="8.5" letter-spacing="1.2">CÔTES ET MIROIRS DE NÉRÉIA</text>
  </g>

  <!-- 7. SUD : LES PLATEAUX D'OS-BLANC -->
  <g transform="translate(680, 565)" filter="url(#shadow)">
    <rect x="-130" y="-15" width="260" height="30" rx="4" fill="url(#bannerBg)" stroke="#f1f5f9" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="bold" letter-spacing="1.8">PLATEAUX D'OS-BLANC</text>
    <text x="0" y="-18" text-anchor="middle" fill="#cbd5e1" font-size="8.5" letter-spacing="1.2">NÉCROPOLE DU DIEU DES MORTS</text>
  </g>

  <!-- 8. SUD-EST : LA CALDEIRA D'IGNIS-VORA -->
  <g transform="translate(1060, 585)" filter="url(#shadow)">
    <rect x="-135" y="-15" width="270" height="30" rx="4" fill="url(#bannerBg)" stroke="#f87171" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" fill="#fee2e2" font-size="11.5" font-weight="bold" letter-spacing="1.8">CALDEIRA D'IGNIS-VORA</text>
    <text x="0" y="-18" text-anchor="middle" fill="#fca5a5" font-size="8.5" letter-spacing="1.2">FORGES ET ARTÈRES DE LAVE</text>
  </g>

</svg>`;

const out1 = 'c:/Users/sebas/Documents/GitHub/D&D/crpg-llm/sorties/images/mondes/ombresang/carte-atlas-legendee.svg';
const out2 = 'c:/Users/sebas/Documents/GitHub/D&D/crpg-llm/packages/mondes/ombresang/images/carte-atlas-legendee.svg';
const out3 = 'C:/Users/sebas/.gemini/antigravity/brain/820dc3c5-5972-4690-8475-f7273af5c9b0/carte-atlas-legendee.svg';

fs.writeFileSync(out1, svg, 'utf8');
fs.writeFileSync(out2, svg, 'utf8');
fs.writeFileSync(out3, svg, 'utf8');
console.log('SVG généré avec succès !');
