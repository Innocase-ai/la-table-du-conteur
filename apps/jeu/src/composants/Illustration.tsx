import type { Combattant } from '@crpg/regles';
import { imageCombattant } from '../visuels';
import { Jeton } from './Jeton';

/** Grande image du combattant affiché dans la fiche (actif ou survolé) : portrait choisi, ou monstre du bestiaire. */
export function Illustration({ c }: { c: Combattant }) {
  const image = imageCombattant(c);
  const classes = ['illustration', c.camp === 'heros' ? 'illustration-heros' : 'illustration-monstre', c.mort ? 'illustration-mort' : ''];
  return (
    <div className={classes.join(' ')}>
      {image ? <img key={image} src={image} alt={c.nom} draggable={false} /> : <Jeton c={c} taille={96} />}
    </div>
  );
}
