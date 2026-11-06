// Un pictogramme de carte : dessin SVG (voir `pictogrammes.ts`), nu ou dans un médaillon aux couleurs de son sujet.
import type { CSSProperties } from 'react';
import { DESSIN_DEFAUT, DESSINS, LANCER, TEINTES } from '../pictogrammes';

interface Props {
  /** La clé du dessin : `sort:soins`, `cout:action`, `arme:epee`… (voir `DESSINS`). */
  cle: string;
  /** Côté en pixels. */
  taille?: number;
  /** Dans un médaillon rond, sur un fond sombre de la couleur du sujet. */
  medaillon?: boolean;
  /** Sur un fond de couleur (pastille de coût) : le dessin passe en foncé. */
  surFond?: boolean;
  /** Arme lancée : des traînées devant le dessin. */
  lancer?: boolean;
  titre?: string;
}

export function Pictogramme({ cle, taille = 24, medaillon = false, surFond = false, lancer = false, titre }: Props) {
  const dessin = DESSINS[cle] ?? DESSIN_DEFAUT;
  const t = TEINTES[dessin.teinte];
  const style = { width: taille, height: taille, ['--pic-taille' as string]: `${taille}px`, ['--pic-clair' as string]: t.clair, ['--pic-fonce' as string]: t.fonce } as CSSProperties;
  const svg = `<svg viewBox="0 0 64 64" stroke-width="3.2" aria-hidden="true" focusable="false">${dessin.corps}${lancer ? LANCER : ''}</svg>`;
  return (
    <span
      className={`pic${medaillon ? ' pic-medaillon' : ''}${surFond ? ' pic-sur-fond' : ''}`}
      style={style}
      title={titre}
      // Dessins écrits dans `pictogrammes.ts` : du contenu statique du projet, jamais une saisie.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
