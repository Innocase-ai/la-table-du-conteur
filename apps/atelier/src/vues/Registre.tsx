import { useMemo, useState } from 'react';
import { idsDeLaBible, promisMaisAbsents, registreIds, type DiagnosticMonde, type DonneesMonde } from '@crpg/regles';
import type { MondeLu } from '../api';
import { chargerDonnees } from '../donnees';

const NOMS: Record<string, string> = { lieux: 'Lieux', pnj: 'PNJ', quetes: 'Quêtes', faits: 'Faits', objets: 'Objets', rencontres: 'Rencontres', fins: 'Fins', jauges: 'Jauges', factions: 'Factions' };
type Filtre = 'tout' | 'jamais-cite' | 'jamais-produit';

/** Le registre des identifiants : pour chaque lieu, PNJ, quête, fait, objet, fin… qui le produit et qui le lit ; ce qui est cité sans exister ; ce que la BIBLE promet. */
export function Registre({ lu, dm, diag }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde }) {
  const registre = useMemo(() => registreIds(dm, diag.index, chargerDonnees()), [dm, diag]);
  const [dossier, setDossier] = useState('pnj');
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [q, setQ] = useState('');
  const lien = (type: string, id: string) => `#/${lu.id}/fiches/${type}/${id}`;

  const lignes = (registre.entites[dossier] ?? []).filter((l) => (filtre === 'tout' || (filtre === 'jamais-cite' ? l.consomme === 0 : l.produit === 0)) && (!q || l.id.includes(q.toLowerCase()) || (l.nom ?? '').toLowerCase().includes(q.toLowerCase())));
  const bible = useMemo(() => (lu.docs.bible ? idsDeLaBible(lu.docs.bible) : null), [lu]);
  const promis = useMemo(() => (bible ? promisMaisAbsents(bible, dm, diag.index) : []), [bible, dm, diag]);

  return (
    <section>
      {registre.inconnus.length > 0 ? (
        <div className="inconnus">
          <h3 className="rouge">{registre.inconnus.length} identifiant(s) cité(s) mais inexistant(s)</h3>
          <ul>
            {registre.inconnus.map((r) => (
              <li key={`${r.genre}:${r.id}`}>
                <code>
                  {r.genre}:{r.id}
                </code>{' '}
                cité par{' '}
                {[...new Map(r.sites.map((s) => [`${s.entite.type}/${s.entite.id}`, s])).values()].slice(0, 6).map((s) => (
                  <a key={`${s.entite.type}/${s.entite.id}`} href={lien(s.entite.type, s.entite.id)} className="puce">
                    {s.entite.id}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="bravo">Tout ce qui est cité existe.</p>
      )}

      <div className="onglets" role="tablist">
        {Object.entries(NOMS).map(([id, nom]) => (
          <button key={id} role="tab" aria-selected={dossier === id} className={dossier === id ? 'actif' : ''} onClick={() => setDossier(id)}>
            {nom} <span className="muet">{registre.entites[id]?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="outils">
        <label>
          Afficher :{' '}
          <select value={filtre} onChange={(e) => setFiltre(e.target.value as Filtre)}>
            <option value="tout">Tout</option>
            <option value="jamais-cite">Jamais cité (rien ne le lit)</option>
            <option value="jamais-produit">Jamais produit (rien ne le pose ou le donne)</option>
          </select>
        </label>
        <input type="search" placeholder="Chercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muet">{lignes.length} ligne(s)</span>
      </div>
      <table className="diagnostics">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Nom</th>
            <th title="Combien d'endroits le produisent : effet, sujet qui le révèle, inventaire, quête…">Produit</th>
            <th title="Combien d'endroits le lisent : conditions, clé de verrou…">Lu</th>
          </tr>
        </thead>
        <tbody>
          {lignes.slice(0, 400).map((l) => (
            <tr key={l.id}>
              <td>
                <a href={lien(dossier, l.id)}>
                  <code>{l.id}</code>
                </a>
              </td>
              <td>{l.nom}</td>
              <td className={l.produit === 0 && (dossier === 'faits' || dossier === 'quetes') ? 'orange' : ''}>{l.produit}</td>
              <td className={l.consomme === 0 && dossier === 'faits' ? 'muet' : ''}>{l.consomme}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lignes.length > 400 && <p className="muet">… {lignes.length - 400} autres : affinez la recherche.</p>}

      <h3>Registre de la BIBLE (§ 7)</h3>
      {bible === null ? (
        <p className="muet">Ce monde n’a pas de BIBLE.md.</p>
      ) : (
        <>
          <p className="muet">
            {bible.size} identifiants cités dans la BIBLE ; <b className={promis.length ? 'orange' : 'bravo'}>{promis.length}</b> n’existent nulle part dans les données (renommés, abandonnés ou oubliés).
          </p>
          {promis.length > 0 && (
            <p className="puces">
              {promis.map((id) => (
                <code key={id} className="puce">
                  {id}
                </code>
              ))}
            </p>
          )}
        </>
      )}
    </section>
  );
}
