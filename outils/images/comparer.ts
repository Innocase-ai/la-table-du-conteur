// Page HTML de comparaison : une ligne par image du lot, une colonne par service.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Element } from './charte';
import type { Service } from './services';

interface MetaLue {
  dureeMs: number;
  coutUsd?: number;
  modele: string;
}

function echapper(t: string): string {
  return t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function construirePageComparaison(dossier: string, elements: Element[], services: Service[]): string {
  const presents = services.filter((s) => elements.some((e) => existsSync(join(dossier, s.id, `${e.id}.png`))));
  const colonnes = presents.length ? presents : services;
  const entete = colonnes.map((s) => `<th>${echapper(s.nom)}</th>`).join('');
  const lignes = elements
    .map((e) => {
      const cellules = colonnes
        .map((s) => {
          const png = join(dossier, s.id, `${e.id}.png`);
          if (!existsSync(png)) return '<td class="vide">—</td>';
          const jsonChemin = join(dossier, s.id, `${e.id}.json`);
          const meta: MetaLue | undefined = existsSync(jsonChemin) ? (JSON.parse(readFileSync(jsonChemin, 'utf8')) as MetaLue) : undefined;
          const info = meta ? `${(meta.dureeMs / 1000).toFixed(1)} s${meta.coutUsd === undefined ? '' : ` · ${meta.coutUsd.toFixed(3)} $`} · ${echapper(meta.modele)}` : '';
          return `<td><a href="${s.id}/${e.id}.png"><img src="${s.id}/${e.id}.png" alt="${echapper(e.nom)} — ${echapper(s.nom)}" loading="lazy"></a><div class="info">${info}</div></td>`;
        })
        .join('');
      const refs = e.references.length ? `<div class="info">références : ${e.references.map((r) => r.replace('portrait-', '')).join(', ')}</div>` : '';
      return `<tr><th scope="row">${echapper(e.nom)}<div class="info">${e.groupe === 'portraits' ? 'portrait' : 'scène'}</div>${refs}</th>${cellules}</tr>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comparaison des services d'images</title>
<style>
:root{color-scheme:dark}body{margin:0;padding:24px;background:#14110e;color:#e8dfd0;font:15px/1.5 system-ui,sans-serif}
h1{font-weight:500;color:#d4ae66;margin:0 0 4px}p{color:#a89d8a;margin:0 0 20px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #3a3228;padding:8px;vertical-align:top;text-align:left}
thead th{position:sticky;top:0;background:#1d1812}tbody th{width:170px;font-weight:500;background:#1a1612}
td img{display:block;width:100%;height:auto;border-radius:4px}.info{font-size:12px;color:#a89d8a;margin-top:4px;font-weight:400}.vide{color:#6b6253;text-align:center}
</style></head><body>
<h1>Comparaison des services d'images</h1>
<p>Même charte graphique et mêmes fiches pour tous. Les scènes reçoivent les portraits du service comme références : cherche si les héros restent reconnaissables.</p>
<table><thead><tr><th></th>${entete}</tr></thead><tbody>
${lignes}
</tbody></table></body></html>
`;
}
