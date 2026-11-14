// Rendu de la démo : tuiles dessinées au canvas, brouillard doux, repères, jeton du groupe. Rien d'ici n'est du moteur : c'est le
// travail d'un client (le vrai jeu dessinerait avec ses textures et ses reliefs).
import { estVisible, fenetre, hash2, luminosite, reperesVisibles, type CarteTerres, type ContexteVoyage, type EtatVoyage, type Terrain } from '../src';

export const T = 40;
export const VW = 17;
export const VH = 11;

export const COULEUR: Record<Terrain, string> = { plaine: '#6a8a3e', foret: '#46682f', colline: '#7f8c4c', montagne: '#7d7f76', marais: '#56633c', eau: '#2f6f8f', gue: '#7fa9bc' };

function clair(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + f))));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function arbre(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, teinte: number): void {
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(x - 1.5, y, 3, r * 0.9);
  ctx.fillStyle = clair('#2f5a26', teinte);
  ctx.beginPath();
  ctx.arc(x, y - r * 0.1, r, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,200,.08)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.5, 0, 7);
  ctx.fill();
}

function dessinerTuile(ctx: CanvasRenderingContext2D, c: CarteTerres, x: number, y: number, px: number, py: number): void {
  const i = y * c.largeur + x;
  const t = c.tuiles[i]!;
  const h = hash2(5, x, y);
  ctx.fillStyle = clair(COULEUR[t], (h - 0.5) * 0.16);
  ctx.fillRect(px, py, T, T);
  const bloquee = c.blocage[i] === 1;
  if (t === 'foret') {
    const n = bloquee ? 4 : 2;
    for (let k = 0; k < n; k++) arbre(ctx, px + 8 + hash2(7, x * 4 + k, y) * 24, py + 12 + hash2(8, x, y * 4 + k) * 20, bloquee ? 9 : 7.5, (hash2(9, x + k, y) - 0.5) * 0.3);
  } else if (t === 'colline') {
    ctx.strokeStyle = 'rgba(40,55,20,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 14, py + 28, 11, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 28, py + 24, 8, Math.PI, 0);
    ctx.stroke();
    if (bloquee) rocher(ctx, px + 20, py + 20, 9);
  } else if (t === 'montagne') {
    ctx.fillStyle = '#5c5f57';
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 34);
    ctx.lineTo(px + 15, py + 8);
    ctx.lineTo(px + 27, py + 34);
    ctx.fill();
    ctx.fillStyle = '#6c6f66';
    ctx.beginPath();
    ctx.moveTo(px + 18, py + 34);
    ctx.lineTo(px + 28, py + 14);
    ctx.lineTo(px + 38, py + 34);
    ctx.fill();
    ctx.fillStyle = '#eef0ec';
    ctx.beginPath();
    ctx.moveTo(px + 11, py + 16);
    ctx.lineTo(px + 15, py + 8);
    ctx.lineTo(px + 19, py + 16);
    ctx.fill();
    if (bloquee) rocher(ctx, px + 20, py + 28, 8);
  } else if (t === 'marais') {
    ctx.fillStyle = 'rgba(30,70,70,.45)';
    ctx.beginPath();
    ctx.ellipse(px + 14 + h * 8, py + 24, 9, 4, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#8fa24f';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      const rx = px + 8 + k * 11 + h * 4;
      ctx.beginPath();
      ctx.moveTo(rx, py + 30);
      ctx.lineTo(rx + 1, py + 15);
      ctx.stroke();
    }
  } else if (t === 'eau' || t === 'gue') {
    ctx.strokeStyle = t === 'eau' ? 'rgba(180,220,240,.35)' : 'rgba(255,255,255,.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 6 + h * 6, py + 14);
    ctx.quadraticCurveTo(px + 14 + h * 6, py + 10, px + 22 + h * 6, py + 14);
    ctx.moveTo(px + 12, py + 28);
    ctx.quadraticCurveTo(px + 20, py + 24, px + 30, py + 28);
    ctx.stroke();
  } else if (hash2(11, x, y) < 0.18) {
    ctx.fillStyle = 'rgba(30,60,20,.35)';
    ctx.fillRect(px + 8 + h * 20, py + 10 + hash2(12, x, y) * 20, 2, 6);
    ctx.fillRect(px + 11 + h * 20, py + 12 + hash2(12, x, y) * 20, 2, 5);
  }
  if (c.route[i]) {
    ctx.fillStyle = t === 'gue' ? '#d9c692' : '#c9b078';
    ctx.fillRect(px + 12, py + 12, T - 24, T - 24);
    const v = (dx: number, dy: number) => x + dx >= 0 && y + dy >= 0 && x + dx < c.largeur && y + dy < c.hauteur && c.route[(y + dy) * c.largeur + x + dx] === 1;
    if (v(1, 0)) ctx.fillRect(px + T - 14, py + 12, 14, T - 24);
    if (v(-1, 0)) ctx.fillRect(px, py + 12, 14, T - 24);
    if (v(0, 1)) ctx.fillRect(px + 12, py + T - 14, T - 24, 14);
    if (v(0, -1)) ctx.fillRect(px + 12, py, T - 24, 14);
  }
}

function rocher(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#6b6d65';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.75, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.25, 0, 0, 7);
  ctx.fill();
}

/** Les dessins des points d'intérêt, centrés en (cx, cy). */
export function icone(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number): void {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2a1a05';
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx + x, cy + y, w, h);
    ctx.strokeRect(cx + x, cy + y, w, h);
  };
  switch (type) {
    case 'tour-de-guet':
      rect(-6, -14, 12, 26, '#a39a88');
      rect(-8, -18, 4, 6, '#a39a88');
      rect(-2, -18, 4, 6, '#a39a88');
      rect(4, -18, 4, 6, '#a39a88');
      break;
    case 'pierre-dressee':
      rect(-4, -14, 8, 26, '#9a9a94');
      break;
    case 'fumee':
      ctx.strokeStyle = 'rgba(220,220,220,.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.bezierCurveTo(cx - 8, cy, cx + 8, cy - 8, cx, cy - 18);
      ctx.stroke();
      break;
    case 'feu-de-camp':
      ctx.fillStyle = 'rgba(255,170,40,.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#f08a1a';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 8);
      ctx.quadraticCurveTo(cx - 8, cy - 4, cx, cy - 12);
      ctx.quadraticCurveTo(cx + 8, cy - 4, cx + 6, cy + 8);
      ctx.fill();
      break;
    case 'puits':
      ctx.fillStyle = '#8d8578';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1d2a33';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, 7);
      ctx.fill();
      break;
    case 'cairn':
      for (const [dx, dy, r] of [[0, 6, 8], [0, -2, 6], [0, -8, 4]] as const) {
        ctx.fillStyle = '#8f8c84';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy + dy, r, r * 0.6, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'cabane':
      rect(-9, -2, 18, 12, '#8b5e34');
      ctx.fillStyle = '#5a3a1e';
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 2);
      ctx.lineTo(cx, cy - 12);
      ctx.lineTo(cx + 12, cy - 2);
      ctx.fill();
      break;
    case 'ruine':
      rect(-10, 0, 7, 10, '#9a9486');
      rect(-2, -8, 6, 18, '#9a9486');
      rect(6, 4, 6, 6, '#9a9486');
      break;
    case 'camp-abandonne':
      ctx.fillStyle = '#b6a27a';
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 9);
      ctx.lineTo(cx, cy - 10);
      ctx.lineTo(cx + 11, cy + 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'chariot-brise':
      rect(-10, -4, 20, 9, '#7a5530');
      ctx.fillStyle = '#3b2a18';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 7, 4, 0, 7);
      ctx.arc(cx + 7, cy + 8, 4, 0, 7);
      ctx.fill();
      break;
    case 'bosquet-sacre':
      for (const [dx, dy] of [[-7, 2], [7, 2], [0, -6]] as const) arbre(ctx, cx + dx, cy + dy, 7, 0.2);
      break;
    default:
      rect(-6, -6, 12, 12, '#d8c07a');
  }
}

function lieu(ctx: CanvasRenderingContext2D, cx: number, cy: number, nom: string, label: boolean, gros: boolean): void {
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#2a1a05';
  ctx.fillStyle = '#e4d6ae';
  ctx.fillRect(cx - 11, cy - 3, 22, 15);
  ctx.strokeRect(cx - 11, cy - 3, 22, 15);
  ctx.fillStyle = '#a2412b';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 3);
  ctx.lineTo(cx, cy - 15);
  ctx.lineTo(cx + 14, cy - 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (gros) {
    ctx.strokeStyle = 'rgba(245,200,90,.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - T / 2 + 3, cy - T / 2 + 3, T - 6, T - 6);
  }
  if (label) etiquette(ctx, cx, cy - 22, nom);
}

function etiquette(ctx: CanvasRenderingContext2D, cx: number, y: number, texte: string): void {
  ctx.font = '600 12px system-ui, sans-serif';
  const w = ctx.measureText(texte).width;
  const x = Math.max(4, Math.min(VW * T - w - 10, cx - w / 2 - 3));
  ctx.fillStyle = 'rgba(20,16,10,.78)';
  ctx.fillRect(x, y - 11, w + 6, 16);
  ctx.fillStyle = '#f3ead2';
  ctx.fillText(texte, x + 3, y + 1);
}

export interface OptionsRendu {
  brouillard: boolean;
  ctx: ContexteVoyage;
  /** Ancres connues d'avance (dessinées en losange même dans le brouillard). */
  connus: ReadonlySet<string>;
  pulsation: number;
}

export function dessiner(canvas: HTMLCanvasElement, carte: CarteTerres, etat: EtatVoyage, opts: OptionsRendu): { ox: number; oy: number } {
  const g = canvas.getContext('2d')!;
  const o = fenetre(etat, VW, VH, carte.largeur, carte.hauteur);
  g.fillStyle = '#000';
  g.fillRect(0, 0, VW * T, VH * T);
  const explore = (x: number, y: number) => !opts.brouillard || etat.explore[y * carte.largeur + x] === 1;

  for (let vy = 0; vy < VH; vy++) for (let vx = 0; vx < VW; vx++) {
    const x = o.x + vx;
    const y = o.y + vy;
    if (explore(x, y)) dessinerTuile(g, carte, x, y, vx * T, vy * T);
  }
  // Points d'intérêt déjà aperçus (ou tous, sans brouillard), et lieux écrits.
  const enVue = new Set(reperesVisibles(carte, etat).map((r) => r.id));
  const centre = (x: number, y: number) => [(x - o.x) * T + T / 2, (y - o.y) * T + T / 2] as const;
  const dansFenetre = (x: number, y: number) => x >= o.x && y >= o.y && x < o.x + VW && y < o.y + VH;
  for (const p of carte.pois) {
    if (!dansFenetre(p.x, p.y) || !explore(p.x, p.y) || enVue.has(p.id)) continue;
    const [cx, cy] = centre(p.x, p.y);
    icone(g, p.type, cx, cy);
    if (etat.pois[p.id] === 'visite') {
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(cx - T / 2, cy - T / 2, T, T);
    }
  }
  for (const a of carte.ancres) {
    if (!dansFenetre(a.x, a.y) || !explore(a.x, a.y)) continue;
    const [cx, cy] = centre(a.x, a.y);
    lieu(g, cx, cy, a.nom, true, true);
  }

  // Ambiance horaire.
  const sombre = 1 - luminosite(etat.minutes);
  if (sombre > 0) {
    g.fillStyle = `rgba(8,16,48,${(0.5 * sombre).toFixed(3)})`;
    g.fillRect(0, 0, VW * T, VH * T);
  } else if (luminosite(etat.minutes) < 1) {
    g.fillStyle = 'rgba(255,130,40,.1)';
    g.fillRect(0, 0, VW * T, VH * T);
  }

  // Brouillard : un pixel par case, agrandi avec lissage (bords doux). Inconnu = noir, déjà vu = assombri, visible = clair.
  if (opts.brouillard) {
    const mw = VW + 2;
    const mh = VH + 2;
    const masque = document.createElement('canvas');
    masque.width = mw;
    masque.height = mh;
    const m = masque.getContext('2d')!;
    for (let my = 0; my < mh; my++) for (let mx = 0; mx < mw; mx++) {
      const x = o.x + mx - 1;
      const y = o.y + my - 1;
      let a = 1;
      if (x >= 0 && y >= 0 && x < carte.largeur && y < carte.hauteur) a = estVisible(carte, etat, x, y, opts.ctx) ? 0 : etat.explore[y * carte.largeur + x] ? 0.55 : 1;
      if (a > 0) {
        m.fillStyle = `rgba(10,8,7,${a})`;
        m.fillRect(mx, my, 1, 1);
      }
    }
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(masque, -T, -T, mw * T, mh * T);
  }

  // Au-dessus du brouillard : les repères visibles de loin (on les voit, on ne voit pas ce qu'il y a entre eux et nous).
  for (const r of reperesVisibles(carte, etat)) {
    if (!dansFenetre(r.x, r.y)) {
      // Hors de la fenêtre : une flèche sur le bord, avec le nom.
      const dx = r.x - etat.x;
      const dy = r.y - etat.y;
      const k = Math.min(((VW / 2 - 1) * T) / Math.max(1, Math.abs(dx) * T), ((VH / 2 - 1) * T) / Math.max(1, Math.abs(dy) * T));
      const ax = (VW * T) / 2 + dx * T * k;
      const ay = (VH * T) / 2 + dy * T * k;
      g.fillStyle = 'rgba(127,176,216,.95)';
      g.beginPath();
      g.arc(ax, ay, 6 + opts.pulsation * 2, 0, 7);
      g.fill();
      etiquette(g, ax, ay - 12, `${r.nom} (${r.distance})`);
      continue;
    }
    const [cx, cy] = centre(r.x, r.y);
    if (r.genre === 'poi') {
      const poi = carte.pois.find((p) => p.id === r.id)!;
      icone(g, poi.type, cx, cy);
      g.strokeStyle = 'rgba(127,176,216,.9)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, 20 + opts.pulsation * 3, 0, 7);
      g.stroke();
    } else {
      lieu(g, cx, cy, r.nom, true, true);
    }
  }
  // Lieux écrits connus d'avance, encore dans le brouillard : un losange et une direction.
  for (const a of carte.ancres) {
    if (!opts.connus.has(a.id) || explore(a.x, a.y)) continue;
    if (!dansFenetre(a.x, a.y)) continue;
    const [cx, cy] = centre(a.x, a.y);
    g.strokeStyle = '#f3ead2';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx, cy - 8);
    g.lineTo(cx + 8, cy);
    g.lineTo(cx, cy + 8);
    g.lineTo(cx - 8, cy);
    g.closePath();
    g.stroke();
  }

  // Le groupe.
  const [px, py] = centre(etat.x, etat.y);
  g.fillStyle = 'rgba(232,163,23,.28)';
  g.beginPath();
  g.arc(px, py, 15 + opts.pulsation * 2, 0, 7);
  g.fill();
  g.fillStyle = '#e8a317';
  g.strokeStyle = '#2a1a05';
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(px, py, 8, 0, 7);
  g.fill();
  g.stroke();
  return { ox: o.x, oy: o.y };
}

export function dessinerMini(canvas: HTMLCanvasElement, carte: CarteTerres, etat: EtatVoyage, brouillard: boolean, ox: number, oy: number): void {
  const g = canvas.getContext('2d')!;
  const s = canvas.width / carte.largeur;
  g.fillStyle = '#0b0907';
  g.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < carte.hauteur; y++) for (let x = 0; x < carte.largeur; x++) {
    const i = y * carte.largeur + x;
    if (brouillard && !etat.explore[i]) continue;
    g.fillStyle = carte.route[i] ? '#c9b078' : COULEUR[carte.tuiles[i]!];
    g.fillRect(x * s, y * s, Math.ceil(s), Math.ceil(s));
  }
  for (const a of carte.ancres) {
    if (brouillard && !etat.explore[a.y * carte.largeur + a.x]) continue;
    g.fillStyle = '#a2412b';
    g.fillRect(a.x * s - 2, a.y * s - 2, 5, 5);
  }
  g.strokeStyle = 'rgba(255,255,255,.7)';
  g.lineWidth = 1;
  g.strokeRect(ox * s, oy * s, VW * s, VH * s);
  g.fillStyle = '#e8a317';
  g.fillRect(etat.x * s - 2, etat.y * s - 2, 5, 5);
}
