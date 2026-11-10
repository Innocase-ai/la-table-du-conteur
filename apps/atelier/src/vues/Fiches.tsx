import { Fragment, useEffect, useMemo, useState } from 'react';
import { champIdentifiant, champsDuSchema, DOSSIERS_EDITABLES, prefixeProbable, problemeIdentifiant, proposerIdentifiant, schemaDuDossier, type DiagnosticMonde, type DonneesMonde } from '@crpg/regles';
import { ecrireFiche, ErreurEcriture, lireMonde, type MondeLu } from '../api';
import { cibleDuTexte, ecrireChemin, textesDeLaFiche, type Chemin } from '../assistant';
import { Assistant } from './Assistant';

interface Fiche {
  id: string;
  nom: string;
  chemin: string;
  objet: Record<string, unknown>;
}

/** Les fiches d'un dossier, avec le fichier qui les contient. */
function fichesDuDossier(lu: MondeLu, dossier: string): Fiche[] {
  const champ = champIdentifiant(dossier);
  return lu.fichiers
    .filter((f) => f.chemin.startsWith(`${dossier}/`))
    .flatMap((f) =>
      (Array.isArray(f.contenu) ? f.contenu : [f.contenu])
        .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && typeof (o as Record<string, unknown>)[champ] === 'string')
        .map((objet) => ({ id: objet[champ] as string, nom: String(objet['nom'] ?? ''), chemin: f.chemin, objet })),
    );
}

const empreinteDuFichier = (lu: MondeLu, chemin: string) => lu.fichiers.find((f) => f.chemin === chemin)?.empreinte ?? null;
const json = (x: unknown) => JSON.stringify(x);

/** Les fiches du monde : on les lit, on les modifie avec leur schéma sous les yeux, on enregistre dans le fichier (seule la fiche change). */
export function Fiches({ lu, dm, diag, dossier, ident, recharger }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde; dossier: string; ident: string; recharger: () => Promise<void> }) {
  const dossiers = useMemo(() => DOSSIERS_EDITABLES.map((d) => ({ id: d, n: fichesDuDossier(lu, d).length })).filter((d) => d.n > 0), [lu]);
  const courant = dossiers.find((d) => d.id === dossier)?.id ?? dossiers[0]?.id ?? '';
  const fiches = useMemo(() => fichesDuDossier(lu, courant), [lu, courant]);
  const [recherche, setRecherche] = useState('');
  const q = recherche.trim().toLowerCase();
  const visibles = fiches.filter((f) => !q || f.id.includes(q) || f.nom.toLowerCase().includes(q));
  const fiche = fiches.find((f) => f.id === ident);

  const aller = (d: string, id = '') => (window.location.hash = `#/${lu.id}/fiches/${d}${id ? `/${id}` : ''}`);

  return (
    <section>
      <div className="outils">
        <label>
          Dossier :{' '}
          <select value={courant} onChange={(e) => aller(e.target.value)}>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} ({d.n})
              </option>
            ))}
          </select>
        </label>
        <input type="search" placeholder="Chercher (id ou nom)…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <span className="muet">{visibles.length} fiche(s)</span>
      </div>
      <div className="fiches">
        <ul className="listeFiches">
          {visibles.map((f) => (
            <li key={f.id}>
              <button className={f.id === ident ? 'actif' : ''} onClick={() => aller(courant, f.id)} title={f.chemin}>
                <code>{f.id}</code>
                {f.nom && <span className="muet">{f.nom}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="editeur">
          {fiche ? (
            <Editeur key={`${courant}/${fiche.id}`} lu={lu} dm={dm} diag={diag} dossier={courant} fiche={fiche} fiches={fiches} recharger={recharger} aller={aller} />
          ) : (
            <p className="muet">Choisissez une fiche à gauche pour la lire et la modifier. L’enregistrement ne touche que cette fiche : le reste du fichier reste identique, et rien n’est écrit si le fichier a changé entre-temps.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Editeur({ lu, dm, diag, dossier, fiche, fiches, recharger, aller }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde; dossier: string; fiche: Fiche; fiches: Fiche[]; recharger: () => Promise<void>; aller: (d: string, id?: string) => void }) {
  const origine = useMemo(() => json(fiche.objet), [fiche]);
  const [brouillon, setBrouillon] = useState<Record<string, unknown>>(() => structuredClone(fiche.objet));
  const [depart, setDepart] = useState(origine);
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<{ ton: 'ok' | 'erreur'; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  /** Le texte ouvert dans l'assistant d'écriture (`null` : fermé). */
  const [assistant, setAssistant] = useState<Chemin | null>(null);

  const modifie = json(brouillon) !== depart;
  const externe = origine !== depart; // la fiche a changé sur le disque pendant qu'on l'avait ouverte

  // Sans modification en cours, la fiche suit le disque (Claude Code a pu l'écrire entre-temps).
  useEffect(() => {
    if (!modifie && externe) {
      setBrouillon(structuredClone(fiche.objet));
      setDepart(origine);
      setVersion((v) => v + 1);
    }
  }, [modifie, externe, fiche, origine]);

  const schema = schemaDuDossier(dossier);
  const validation = useMemo(() => schema?.safeParse(brouillon), [schema, brouillon]);
  const problemes = validation && !validation.success ? validation.error.issues.slice(0, 4) : [];
  const champs = champsDuSchema(dossier);
  const manquants = champs.filter((c) => !(c in brouillon));
  const diagnostics = diag.diagnostics.filter((d) => d.entite?.type === dossier && d.entite.id === fiche.id);

  const changer = (cle: string, valeur: unknown) => setBrouillon((b) => ({ ...b, [cle]: valeur }));
  // Une proposition de l'assistant appliquée au brouillon : les champs se réaffichent (un texte imbriqué vit dans l'éditeur JSON).
  const appliquer = (chemin: Chemin, texte: string) => {
    setBrouillon((b) => ecrireChemin(b, chemin, texte));
    setVersion((v) => v + 1);
  };
  /** Le texte qu'ouvre l'assistant pour un champ : le champ lui-même s'il est du texte, sinon le premier texte à cible (une réponse de PNJ…) qu'il contient, ou `null`. */
  const texteDuChamp = (cle: string, valeur: unknown): Chemin | null => {
    if (cle === champIdentifiant(dossier)) return null;
    if (typeof valeur === 'string') return [cle];
    const textes = textesDeLaFiche({ [cle]: valeur });
    return (textes.find((t) => cibleDuTexte(dossier, t.chemin)) ?? textes[0])?.chemin ?? null;
  };
  const retirer = (cle: string) =>
    setBrouillon((b) => {
      const { [cle]: _, ...reste } = b;
      return reste;
    });
  const annuler = () => {
    setBrouillon(structuredClone(fiche.objet));
    setDepart(origine);
    setVersion((v) => v + 1);
    setMessage(null);
  };

  const enregistrer = async () => {
    setEnCours(true);
    setMessage(null);
    const envoyer = (empreinteAttendue: string | null) => ecrireFiche({ monde: lu.id, chemin: fiche.chemin, mode: 'remplacer', id: fiche.id, valeur: brouillon, empreinteAttendue });
    try {
      try {
        await envoyer(empreinteDuFichier(lu, fiche.chemin));
      } catch (e) {
        if (!(e instanceof ErreurEcriture) || e.statut !== 409) throw e;
        // Le fichier a changé sur le disque : si c'est une AUTRE fiche, on réessaie avec la nouvelle empreinte ; si c'est la nôtre, on refuse.
        const frais = await lireMonde(lu.id);
        const autre = fichesDuDossier(frais, dossier).find((f) => f.id === fiche.id);
        if (!autre || json(autre.objet) !== depart) throw new ErreurEcriture('La fiche a été modifiée sur le disque pendant que vous l’éditiez : rien n’a été écrit. Annulez vos modifications pour recharger la version du disque.', 409);
        await envoyer(empreinteDuFichier(frais, fiche.chemin));
      }
      setDepart(json(brouillon));
      setMessage({ ton: 'ok', texte: 'Enregistré dans ' + fiche.chemin });
      await recharger();
    } catch (e) {
      setMessage({ ton: 'erreur', texte: (e as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  const ids = new Set(fiches.map((f) => f.id));
  const prefixe = prefixeProbable([...ids]);
  const peutCopier = dossier !== 'savoirs';

  const copier = async () => {
    if (!copie) return;
    const probleme = problemeIdentifiant(copie);
    if (probleme) return setMessage({ ton: 'erreur', texte: `Identifiant « ${copie} » : ${probleme}.` });
    setEnCours(true);
    try {
      const nouvelle = { ...structuredClone(fiche.objet), id: copie, ...(typeof fiche.objet['nom'] === 'string' ? { nom: `${String(fiche.objet['nom'])} (copie)` } : {}) };
      await ecrireFiche({ monde: lu.id, chemin: fiche.chemin, mode: 'ajouter', valeur: nouvelle, empreinteAttendue: empreinteDuFichier(lu, fiche.chemin) });
      await recharger();
      setCopie(null);
      aller(dossier, copie);
    } catch (e) {
      setMessage({ ton: 'erreur', texte: (e as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div>
      <div className="titre">
        <h2>
          <code>{fiche.id}</code>
        </h2>
        <span className="muet">{fiche.chemin}</span>
      </div>
      {externe && modifie && <p className="avertit">La fiche a changé sur le disque pendant que vous l’éditiez. Enregistrer sera refusé : annulez vos modifications pour recharger la version du disque.</p>}
      {diagnostics.length > 0 && (
        <ul className="diagFiche">
          {diagnostics.map((d, i) => (
            <li key={i} className={d.gravite}>
              <b>{d.gravite}</b> {d.message}
            </li>
          ))}
        </ul>
      )}

      <div className="champs">
        {Object.entries(brouillon).map(([cle, valeur]) => {
          const texte = texteDuChamp(cle, valeur);
          return (
            // L'assistant reste monté quand on applique une proposition (le champ, lui, se réaffiche) : la conversation continue.
            <Fragment key={cle}>
              <Champ key={`${cle}-${version}`} cle={cle} valeur={valeur} identifiant={cle === champIdentifiant(dossier)} onChange={(v) => changer(cle, v)} onRetirer={() => retirer(cle)} onAssistant={texte ? () => setAssistant(texte) : undefined} />
              {assistant && assistant[0] === cle && <Assistant lu={lu} dm={dm} dossier={dossier} id={fiche.id} brouillon={brouillon} cheminInitial={assistant} appliquer={appliquer} fermer={() => setAssistant(null)} />}
            </Fragment>
          );
        })}
      </div>
      {manquants.length > 0 && (
        <label className="ajoutChamp">
          Ajouter un champ :{' '}
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) changer(e.target.value, '');
            }}
          >
            <option value="">— choisir —</option>
            {manquants.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {problemes.length > 0 && (
        <ul className="problemes">
          {problemes.map((p, i) => (
            <li key={i}>
              <code>{p.path.join('.') || 'fiche'}</code> — {p.message}
            </li>
          ))}
        </ul>
      )}
      {message && <p className={message.ton === 'ok' ? 'bravo' : 'erreur'}>{message.texte}</p>}

      <div className="barreEdition">
        <button className="bouton principal" disabled={!modifie || problemes.length > 0 || enCours} onClick={enregistrer}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button className="bouton" disabled={!modifie || enCours} onClick={annuler}>
          Annuler les modifications
        </button>
        {modifie && <span className="avertit">modifications non enregistrées</span>}
        {peutCopier && (
          <button className="bouton" disabled={enCours} onClick={() => setCopie(copie === null ? proposerIdentifiant(`${fiche.id}-bis`, ids, '') : null)}>
            Dupliquer…
          </button>
        )}
      </div>

      {copie !== null && (
        <div className="copie">
          <p className="muet">La copie reprend tous les champs de cette fiche dans le même fichier : relisez-la (liens, faits, secrets) avant de l’utiliser.</p>
          <label>
            Nouvel identifiant :{' '}
            <input value={copie} onChange={(e) => setCopie(e.target.value)} spellCheck={false} />
          </label>
          {copie && ids.has(copie) && <span className="erreur"> existe déjà</span>}
          {copie && !ids.has(copie) && problemeIdentifiant(copie) && <span className="erreur"> {problemeIdentifiant(copie)}</span>}
          {prefixe && !copie.startsWith(prefixe) && <span className="avertit"> préfixe habituel : {prefixe}</span>}
          <button className="bouton principal" disabled={!copie || ids.has(copie) || !!problemeIdentifiant(copie) || enCours} onClick={copier}>
            Créer la copie
          </button>
        </div>
      )}
    </div>
  );
}

function Champ({ cle, valeur, identifiant, onChange, onRetirer, onAssistant }: { cle: string; valeur: unknown; identifiant: boolean; onChange: (v: unknown) => void; onRetirer: () => void; onAssistant: (() => void) | undefined }) {
  return (
    <div className="champ">
      <label>
        <code>{cle}</code>
        {onAssistant && (
          <button className="lien assistantOuvrir" onClick={onAssistant} title="Rédiger, améliorer ou clarifier ce texte avec l’assistant (appel payant)">
            assistant
          </button>
        )}
        {!identifiant && (
          <button className="lien retirer" onClick={onRetirer} title="Retirer ce champ de la fiche">
            retirer
          </button>
        )}
      </label>
      <Saisie valeur={valeur} lectureSeule={identifiant} onChange={onChange} />
    </div>
  );
}

function Saisie({ valeur, lectureSeule, onChange }: { valeur: unknown; lectureSeule: boolean; onChange: (v: unknown) => void }) {
  if (typeof valeur === 'string') {
    return valeur.length > 90 || valeur.includes('\n') ? (
      <textarea value={valeur} rows={Math.min(12, Math.max(3, Math.ceil(valeur.length / 90) + valeur.split('\n').length - 1))} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input value={valeur} readOnly={lectureSeule} onChange={(e) => onChange(e.target.value)} spellCheck={!lectureSeule} />
    );
  }
  if (typeof valeur === 'number') return <input type="number" value={valeur} onChange={(e) => e.target.value !== '' && onChange(Number(e.target.value))} />;
  if (typeof valeur === 'boolean') return <input type="checkbox" checked={valeur} onChange={(e) => onChange(e.target.checked)} />;
  return <EditeurJson valeur={valeur} onChange={onChange} />;
}

/** Une valeur imbriquée (liste, objet, condition, effets) en JSON : on la modifie en texte, elle n'est prise en compte que si le JSON est valide. */
function EditeurJson({ valeur, onChange }: { valeur: unknown; onChange: (v: unknown) => void }) {
  const [texte, setTexte] = useState(() => JSON.stringify(valeur, null, 2) ?? 'null');
  const [erreur, setErreur] = useState('');
  return (
    <>
      <textarea
        className="json"
        value={texte}
        rows={Math.min(18, Math.max(3, texte.split('\n').length))}
        spellCheck={false}
        onChange={(e) => {
          setTexte(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setErreur('');
          } catch (err) {
            setErreur((err as Error).message);
          }
        }}
      />
      {erreur && <span className="erreur">JSON invalide : {erreur}</span>}
    </>
  );
}
