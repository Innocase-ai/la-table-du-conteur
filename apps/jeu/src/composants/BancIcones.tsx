// Banc d'essai des pictogrammes (`/?icones`, en développement seulement) : tous les dessins, à plusieurs tailles, avec leur clé.
import { DESSINS } from '../pictogrammes';
import { Pictogramme } from './Pictogramme';

const GROUPES: { titre: string; prefixe: string; medaillon: boolean }[] = [
  { titre: 'Sorts', prefixe: 'sort:', medaillon: true },
  { titre: 'Écoles de magie (repli)', prefixe: 'ecole:', medaillon: true },
  { titre: 'Motifs de sorts (dégâts, soin)', prefixe: 'motif:', medaillon: true },
  { titre: 'Actions de base', prefixe: 'base:', medaillon: true },
  { titre: 'Armes', prefixe: 'arme:', medaillon: true },
  { titre: 'Monstres et aptitudes', prefixe: 'monstre:', medaillon: true },
  { titre: '', prefixe: 'aptitude:', medaillon: true },
];

export function BancIcones() {
  const params = new URLSearchParams(window.location.search);
  // `?icones&grand=120` : les dessins en grand, pour juger leurs détails ; `&prefixe=sort:` pour n'en voir qu'un groupe.
  const grand = Number(params.get('grand') ?? 0);
  const prefixe = params.get('prefixe') ?? '';
  const cles = Object.keys(DESSINS).filter((c) => c.startsWith(prefixe));
  return (
    <div style={{ padding: 20, color: 'var(--texte)', background: '#14100c', minHeight: '100vh', fontFamily: 'var(--texte-police)' }}>
      <h2 style={{ fontFamily: 'var(--titre)', color: 'var(--or)' }}>Pictogrammes des cartes</h2>
      <h3 style={{ color: 'var(--or)' }}>Coûts (pastilles)</h3>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
        {['action', 'bonus', 'reaction', 'elan', 'gratuit'].map((c) => (
          <div key={c} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`cout cout-${c}`} style={{ fontSize: 11 }}>
              <Pictogramme cle={`cout:${c}`} taille={13} surFond />
              {c}
            </span>
            <span className={`rt dispo rt-${c === 'bonus' || c === 'action' || c === 'elan' ? c : 'reaction'}`}>
              <Pictogramme cle={`cout:${c}`} taille={12} surFond />
              {c}
            </span>
            <Pictogramme cle={`cout:${c}`} taille={48} />
          </div>
        ))}
      </div>
      {GROUPES.map((gr) => (
        <section key={gr.prefixe}>
          {gr.titre && <h3 style={{ color: 'var(--or)' }}>{gr.titre}</h3>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
            {cles
              .filter((c) => c.startsWith(gr.prefixe))
              .map((c) => (
                <div key={c} style={{ width: grand ? grand + 20 : 150, textAlign: 'center', fontSize: 11, color: 'var(--texte-doux)' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                    <Pictogramme cle={c} taille={grand || 72} medaillon={gr.medaillon} />
                    {!grand && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <Pictogramme cle={c} taille={34} medaillon={gr.medaillon} />
                        <Pictogramme cle={c} taille={22} medaillon={gr.medaillon} />
                      </div>
                    )}
                  </div>
                  {c.replace(/^[a-z]+:/, '')}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
