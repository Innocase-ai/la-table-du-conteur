import { useMemo, useState } from 'react';
import { grapheAutour, grapheDependancesFin, grapheLieux, grapheQuete, lieuxParents, statutDrapeaux, type DiagnosticMonde, type DonneesMonde, type NoeudGraphe, type RefEntite } from '@crpg/regles';
import type { MondeLu } from '../api';
import { GrapheSvg, Legende } from '../graphe/GrapheSvg';
import { Detail } from './Detail';

type Mode = 'lieux' | 'fin' | 'drapeaux' | 'quetes';
const MODES: { id: Mode; nom: string }[] = [
  { id: 'lieux', nom: 'Carte des lieux' },
  { id: 'fin', nom: 'Dépendances d’une fin' },
  { id: 'drapeaux', nom: 'Drapeaux' },
  { id: 'quetes', nom: 'Quêtes' },
];

/** Les graphes du monde : lieux, dépendances d'une fin, drapeaux, étapes d'une quête. Un clic sur un nœud ouvre son détail. */
export function Graphes({ lu, dm, diag }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde }) {
  const [mode, setMode] = useState<Mode>('lieux');
  const [noeud, setNoeud] = useState<NoeudGraphe | null>(null);
  const [entite, setEntite] = useState<RefEntite | null>(null);
  const choisir = (n: NoeudGraphe) => (setNoeud(n), setEntite(null));
  const voir = (e: RefEntite) => setEntite(e);

  return (
    <section>
      <div className="onglets" role="tablist">
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'actif' : ''} onClick={() => (setMode(m.id), setNoeud(null), setEntite(null))}>
            {m.nom}
          </button>
        ))}
      </div>
      <div className="mise">
        <div className="principal">
          {mode === 'lieux' && <VueLieux dm={dm} selection={noeud?.id} onSelect={choisir} />}
          {mode === 'fin' && <VueFin dm={dm} diag={diag} selection={noeud?.id} onSelect={choisir} />}
          {mode === 'drapeaux' && <VueDrapeaux dm={dm} diag={diag} selection={noeud?.id} onSelect={choisir} />}
          {mode === 'quetes' && <VueQuetes dm={dm} selection={noeud?.id} onSelect={choisir} />}
        </div>
        <Detail noeud={noeud} entite={entite} lu={lu} dm={dm} idx={diag.index} onVoir={voir} />
      </div>
    </section>
  );
}

interface Commun {
  dm: DonneesMonde;
  selection?: string;
  onSelect: (n: NoeudGraphe) => void;
}

function VueLieux({ dm, selection, onSelect }: Commun) {
  const parents = useMemo(() => lieuxParents(dm), [dm]);
  // Par défaut : le plus grand lieu qui reste lisible (60 nœuds au plus).
  const defaut = parents.find((p) => p.descendants <= 60)?.id ?? parents[parents.length - 1]?.id ?? '';
  const [racine, setRacine] = useState(defaut);
  const g = useMemo(() => grapheLieux(dm, racine || undefined), [dm, racine]);
  const nbInacc = g.noeuds.filter((n) => n.etat === 'inaccessible').length;
  return (
    <>
      <div className="outils">
        <label>
          Vue :{' '}
          <select value={racine} onChange={(e) => setRacine(e.target.value)}>
            <option value="">Tout le monde ({dm.lieux.size} lieux — dense)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.descendants + 1} lieux)
              </option>
            ))}
          </select>
        </label>
        <span className="muet">{g.noeuds.length} lieux · {g.aretes.length} passages{nbInacc ? ` · ${nbInacc} inaccessible(s)` : ''}</span>
      </div>
      <GrapheSvg graphe={g} racines={racine ? [racine] : undefined} selection={selection} onSelect={onSelect} />
      <Legende elements={[{ classe: 'ok', texte: 'lieu' }, { classe: 'externe', texte: 'lieu hors de la vue' }, { classe: 'inaccessible', texte: 'inaccessible depuis le départ' }]} />
      <p className="muet">🔒 verrou · 👁 passage caché · ◆ condition · flèche : sens unique · pointillé : lien parent / enfant sans passage.</p>
    </>
  );
}

function VueFin({ dm, diag, selection, onSelect }: Commun & { diag: DiagnosticMonde }) {
  const fins = [...dm.fins.values()];
  const [fin, setFin] = useState(fins[0]?.id ?? '');
  const [profondeur, setProfondeur] = useState(2);
  const g = useMemo(() => (fin ? grapheDependancesFin(dm, diag.index, fin, { profondeur }) : { noeuds: [], aretes: [] }), [dm, diag, fin, profondeur]);
  if (!fins.length) return <p className="muet">Ce monde n’a aucune fin.</p>;
  return (
    <>
      <div className="outils">
        <label>
          Fin :{' '}
          <select value={fin} onChange={(e) => setFin(e.target.value)}>
            {fins.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Profondeur : {profondeur}{' '}
          <input type="range" min={1} max={5} value={profondeur} onChange={(e) => setProfondeur(Number(e.target.value))} />
        </label>
        <span className="muet">{g.noeuds.length} nœuds</span>
      </div>
      <GrapheSvg graphe={g} racines={[`fins:${fin}`]} selection={selection} onSelect={onSelect} />
      <Legende elements={[{ classe: 'g-fins', texte: 'la fin' }, { classe: 'g-fait', texte: 'fait' }, { classe: 'g-flag', texte: 'drapeau' }, { classe: 'g-objet', texte: 'objet' }, { classe: 'orphelin', texte: 'rien ne le produit' }]} />
      <p className="muet">Lecture : une flèche va de ce qui exige vers ce qui est exigé, puis vers ce qui le produit.</p>
    </>
  );
}

function VueDrapeaux({ dm, diag, selection, onSelect }: Commun & { diag: DiagnosticMonde }) {
  const tous = useMemo(() => statutDrapeaux(diag.index), [diag]);
  const [problemes, setProblemes] = useState(true);
  const [q, setQ] = useState('');
  const [choisi, setChoisi] = useState('');
  const liste = tous.filter((d) => (!problemes || d.etat === 'lu-jamais-pose' || d.etat === 'pose-jamais-lu') && (!q || d.id.includes(q.toLowerCase())));
  const courant = choisi && tous.some((d) => d.id === choisi) ? choisi : (liste[0]?.id ?? '');
  const g = useMemo(() => (courant ? grapheAutour(dm, diag.index, 'flag', courant) : { noeuds: [], aretes: [] }), [dm, diag, courant]);
  const nb = { rouge: tous.filter((d) => d.etat === 'lu-jamais-pose').length, orange: tous.filter((d) => d.etat === 'pose-jamais-lu').length };
  return (
    <>
      <div className="outils">
        <label>
          <input type="checkbox" checked={problemes} onChange={(e) => setProblemes(e.target.checked)} /> Problèmes seulement
        </label>
        <input type="search" placeholder="Chercher un drapeau…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muet">
          {tous.length} drapeaux · <b className="rouge">{nb.rouge}</b> lus jamais posés · <b className="orange">{nb.orange}</b> posés jamais lus · {tous.filter((d) => d.etat === 'choix').length} posés par des choix de dilemme
        </span>
      </div>
      <div className="drapeaux">
        <ul className="listeDrapeaux">
          {liste.map((d) => (
            <li key={d.id}>
              <button className={`${d.id === courant ? 'actif ' : ''}${d.etat}`} onClick={() => setChoisi(d.id)}>
                <code>{d.id}</code>
                <span className="muet">
                  {d.produit} → {d.consomme}
                </span>
              </button>
            </li>
          ))}
          {liste.length === 0 && <li className="muet">Aucun drapeau.</li>}
        </ul>
        <div className="principal">
          <GrapheSvg graphe={g} selection={selection} onSelect={onSelect} />
          <p className="muet">À gauche ce qui pose le drapeau, à droite ce qui le lit. Rouge : lu mais jamais posé (sauf par le MJ) ; orange : posé mais que rien ne lit.</p>
        </div>
      </div>
    </>
  );
}

function VueQuetes({ dm, selection, onSelect }: Commun) {
  const quetes = [...dm.quetes.values()];
  const [quete, setQuete] = useState(quetes[0]?.id ?? '');
  const g = useMemo(() => grapheQuete(dm, quete), [dm, quete]);
  const q = dm.quetes.get(quete);
  if (!quetes.length) return <p className="muet">Ce monde n’a aucune quête.</p>;
  return (
    <>
      <div className="outils">
        <label>
          Quête :{' '}
          <select value={quete} onChange={(e) => setQuete(e.target.value)}>
            {quetes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom} ({x.type})
              </option>
            ))}
          </select>
        </label>
        {q && <span className="muet">{q.etapes.length} étapes · début : <code>{q.debut}</code></span>}
      </div>
      <GrapheSvg graphe={g} racines={q ? [q.debut] : undefined} selection={selection} onSelect={onSelect} />
      <Legende elements={[{ classe: 'g-etape-debut', texte: 'étape de départ' }, { classe: 'g-etape', texte: 'étape' }, { classe: 'g-etape-finale', texte: 'étape finale' }, { classe: 'inaccessible', texte: 'inatteignable' }]} />
    </>
  );
}
