import type { Combattant } from '@crpg/regles';
import { svgDe } from '../icones';
import { imageCombattant } from '../visuels';
import { Jeton } from './Jeton';

/** Grande image du combattant affiché dans la fiche (actif ou survolé) : portrait choisi, ou monstre du bestiaire. */
export function Illustration({ c }: { c: Combattant }) {
  const image = imageCombattant(c);
  const classes = ['illustration', c.camp === 'heros' ? 'illustration-heros' : 'illustration-monstre', c.mort ? 'illustration-mort' : ''];
  // Pour un héros, l'icône de sa classe est posée sur le portrait, comme sur son jeton.
  const icone = c.camp === 'heros' && image ? svgDe(c) : undefined;
  return (
    <div className={classes.join(' ')}>
      {image ? <img key={image} src={image} alt={c.nom} draggable={false} /> : <Jeton c={c} taille={96} />}
      {icone && <span className="illustration-classe" title={c.modele} dangerouslySetInnerHTML={{ __html: icone }} />}
    </div>
  );
}
