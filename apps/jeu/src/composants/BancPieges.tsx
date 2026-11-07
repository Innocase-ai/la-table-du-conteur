// Banc d'essai de l'écran de désamorçage (`/?pieges`, en développement seulement) : chaque mécanisme dans chacune de ses trois
// issues (neutralisé, raté, déclenché), avec des données inventées. `?pieges&mecanisme=gaz&issue=declenche` ouvre directement un cas.
import { useState } from 'react';
import { EcranDesamorcage } from '../aventure/EcranDesamorcage';
import type { Desamorcage, IssueDesamorcage, MecanismePiege } from '../desamorcage-regles';

const MECANISMES: { cle: MecanismePiege; piege: string; declenchement: string; type: string }[] = [
  { cle: 'aiguille', piege: 'Aiguille empoisonnée du coffret', declenchement: 'Une aiguille jaillit dans la paume.', type: 'poison' },
  { cle: 'fil', piege: 'Le collet des roseaux', declenchement: 'Le fil se tend : le groupe est happé par le collet.', type: 'perforants' },
  { cle: 'plaque', piege: 'La dalle aux faucilles', declenchement: 'La dalle s’enfonce : deux faucilles balaient la salle.', type: 'tranchants' },
  { cle: 'sol', piege: 'La fosse aux pieux', declenchement: 'Le sol se dérobe sur une fosse hérissée de pieux.', type: 'perforants' },
  { cle: 'chute', piege: 'Le plafond-enclume', declenchement: 'Une dalle de plafond s’écrase sur la rangée de marteaux.', type: 'contondants' },
  { cle: 'gaz', piege: 'Tonneau aux émanations', declenchement: 'Un gaz âcre jaillit du couvercle.', type: 'poison' },
  { cle: 'glyphe', piege: 'Le glyphe de la trempe ratée', declenchement: 'Le glyphe projette une gerbe de flammes.', type: 'feu' },
  { cle: 'rouages', piege: 'Coulée de fonderie', declenchement: 'La cuve bascule et déverse le bronze en fusion.', type: 'feu' },
];
const ISSUES: IssueDesamorcage[] = ['reussi', 'rate', 'declenche'];

function fabriquer(m: (typeof MECANISMES)[number], issue: IssueDesamorcage): Desamorcage {
  const reussite = issue === 'reussi';
  const total = reussite ? 17 : issue === 'rate' ? 11 : 6;
  const jet = { qui: 'bran', nom: 'Bran', test: 'escamotage', dd: 13, des: [total - 4], bonus: 4, total, reussite };
  const declenche = issue === 'declenche';
  return {
    heros: 'bran',
    nomHeros: 'Bran',
    piege: m.piege,
    mecanisme: m.cle,
    issue,
    jet,
    declenchement: declenche ? m.declenchement : undefined,
    sauvegarde: declenche ? { qui: 'bran', nom: 'Bran', test: 'sauvegarde de dex', dd: 13, des: [7], bonus: 2, total: 9, reussite: false } : undefined,
    consequences: declenche ? [`Bran subit 9 dégâts de ${m.type} (PV 3/12).`] : [],
    typesDegats: declenche ? [m.type] : [],
  };
}

export function BancPieges() {
  const params = new URLSearchParams(window.location.search);
  const direct = MECANISMES.find((m) => m.cle === params.get('mecanisme'));
  const issueDirecte = ISSUES.find((i) => i === params.get('issue'));
  const [cas, setCas] = useState<{ m: (typeof MECANISMES)[number]; issue: IssueDesamorcage; n: number } | undefined>(direct && issueDirecte ? { m: direct, issue: issueDirecte, n: 0 } : undefined);
  return (
    <div style={{ padding: 20, color: 'var(--texte)', background: '#14100c', minHeight: '100vh' }}>
      <h2 style={{ color: 'var(--or)' }}>Écran de désamorçage : les mécanismes</h2>
      <table>
        <tbody>
          {MECANISMES.map((m) => (
            <tr key={m.cle}>
              <th style={{ textAlign: 'left', paddingRight: 16 }}>{m.cle}</th>
              {ISSUES.map((i) => (
                <td key={i} style={{ padding: 4 }}>
                  <button type="button" className="bouton-discret" onClick={() => setCas((c) => ({ m, issue: i, n: (c?.n ?? 0) + 1 }))}>
                    {i}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {cas && <EcranDesamorcage key={cas.n} desamorcage={fabriquer(cas.m, cas.issue)} onFin={() => setCas(undefined)} />}
    </div>
  );
}
