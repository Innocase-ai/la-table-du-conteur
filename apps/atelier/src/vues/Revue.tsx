import { useMemo, useState } from 'react';
import { Canon, canonDepuisMonde, CANON_VIDE, cleDeRevue, fusionnerCanon, Revue as RevueDoc, revoirMonde, trouverMot, type Diagnostic, type DiagnosticMonde, type DonneesMonde } from '@crpg/regles';
import { ecrireDocument, ecrireFiche, ErreurEcriture, type MondeLu } from '../api';
import { trouverBrut } from './Detail';

const TITRES: Record<string, string> = {
  'revue.secret': 'Secret qui fuit',
  'revue.personnage': 'Personnage et canon',
  'revue.lien-reciproque': 'Lien non réciproque',
  'revue.nom-inconnu': 'Nom propre isolé',
};

/** Le texte avec le mot cherché surligné. */
function Surligne({ texte, mot }: { texte: string; mot: string }) {
  const t = trouverMot(texte, mot);
  if (!t) return <>{texte}</>;
  return (
    <>
      {texte.slice(0, t.index)}
      <mark>{texte.slice(t.index, t.index + mot.length)}</mark>
      {texte.slice(t.index + mot.length)}
    </>
  );
}

/** La revue de cohérence : ce que l'auteur relit à la main après les agents, en contrôles. Le jugement reste le sien : on lit, on rejette, on corrige. */
export function Revue({ lu, dm, diag: _diag, recharger }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde; recharger: () => Promise<void> }) {
  const canon = useMemo(() => {
    const r = Canon.safeParse(lu.canon?.contenu ?? {});
    return r.success ? r.data : CANON_VIDE;
  }, [lu]);
  const rejets = useMemo(() => (RevueDoc.safeParse(lu.revue?.contenu ?? {}).success ? RevueDoc.parse(lu.revue?.contenu ?? {}).rejets : []), [lu]);
  const alertes = useMemo(() => revoirMonde(dm, canon), [dm, canon]);
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [montrerRejets, setMontrerRejets] = useState(false);
  const [message, setMessage] = useState<{ ton: 'ok' | 'erreur'; texte: string } | null>(null);
  const [brouillonCanon, setBrouillonCanon] = useState<string | null>(null);

  const rejetes = new Set(rejets);
  const visibles = alertes.filter((d) => rejetes.has(cleDeRevue(d)) === montrerRejets && (!code || d.code === code) && (!q || `${d.message} ${d.entite?.id ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  const parCode = alertes.filter((d) => !rejetes.has(cleDeRevue(d))).reduce<Record<string, number>>((n, d) => ({ ...n, [d.code]: (n[d.code] ?? 0) + 1 }), {});
  const nbRejetees = alertes.filter((d) => rejetes.has(cleDeRevue(d))).length;
  const lien = (type: string, id: string) => `#/${lu.id}/fiches/${type}/${id}`;

  const agir = async (f: () => Promise<unknown>, ok: string) => {
    setMessage(null);
    try {
      await f();
      await recharger();
      setMessage({ ton: 'ok', texte: ok });
    } catch (e) {
      setMessage({ ton: 'erreur', texte: e instanceof ErreurEcriture || e instanceof Error ? e.message : String(e) });
    }
  };
  const sauverCanon = (c: unknown) => ecrireDocument({ monde: lu.id, nom: 'canon', contenu: c, empreinteAttendue: lu.canon?.empreinte ?? null });
  const sauverRevue = (r: string[]) => ecrireDocument({ monde: lu.id, nom: 'revue', contenu: { rejets: r }, empreinteAttendue: lu.revue?.empreinte ?? null });

  const rejeter = (d: Diagnostic) => agir(() => sauverRevue([...rejets, cleDeRevue(d)]), 'Alerte rejetée (revue.json).');
  const retablir = (d: Diagnostic) => agir(() => sauverRevue(rejets.filter((k) => k !== cleDeRevue(d))), 'Alerte rétablie.');
  const aLexique = (d: Diagnostic) => agir(() => sauverCanon({ ...canon, noms: { lexique: [...new Set([...canon.noms.lexique, String(d.donnees?.['mot'])])] } }), 'Nom ajouté au lexique du canon.');
  const autoriser = (d: Diagnostic) =>
    agir(
      () => sauverCanon({ ...canon, secrets: canon.secrets.map((s) => (s.id === d.donnees?.['secret'] ? { ...s, autorise: [...new Set([...s.autorise, `${d.entite!.type}:${d.entite!.id}`])] } : s)) }),
      'Fiche autorisée à parler de ce secret.',
    );
  const corriger = (d: Diagnostic) =>
    agir(async () => {
      const brut = d.entite ? trouverBrut(lu, d.entite) : undefined;
      if (!brut || !d.donnees) throw new Error('Fiche introuvable.');
      const fichier = lu.fichiers.find((f) => f.chemin === brut.chemin);
      await ecrireFiche({ monde: lu.id, chemin: brut.chemin, mode: 'remplacer', id: d.entite!.id, valeur: { ...(brut.objet as Record<string, unknown>), [String(d.donnees['champ'])]: d.donnees['attendu'] }, empreinteAttendue: fichier?.empreinte ?? null });
    }, 'Fiche corrigée.');

  // --- Le canon -------------------------------------------------------------
  const secretsSurveilles = canon.secrets.filter((s) => s.motsTabou.length).length;
  const texteCanon = brouillonCanon ?? JSON.stringify(canon, null, 2);
  let canonValide = true;
  let erreurCanon = '';
  try {
    const r = Canon.safeParse(JSON.parse(texteCanon));
    if (!r.success) (canonValide = false), (erreurCanon = `${r.error.issues[0]?.path.join('.')} — ${r.error.issues[0]?.message}`);
  } catch (e) {
    canonValide = false;
    erreurCanon = (e as Error).message;
  }

  return (
    <section>
      <details className="canon" open={!lu.canon}>
        <summary>
          Canon (<code>canon.json</code>) : {lu.canon ? `${canon.secrets.length} secrets dont ${secretsSurveilles} surveillés, ${canon.personnages.length} personnages, ${canon.noms.lexique.length} noms admis` : 'absent'}
        </summary>
        <p className="muet">
          Ce que la BIBLE dit en prose, vérifiable à la machine. Un <b>secret</b> a des <b>mots tabou</b> que vous choisissez (peu, précis : « pacte », « registre » ; pas « village ») : s’ils apparaissent dans un texte lu librement (passé, liens, couleur, salutations, accroches, examens),
          c’est une fuite. <code>autorise</code> : les fiches qui ont le droit d’en parler (<code>pnj:anselme-roux</code>, ou un dossier entier). Les <b>personnages</b> fixent nom, âge et espèce. Sans mot tabou, un secret n’est pas surveillé.
        </p>
        <div className="barreEdition">
          <button className="bouton" onClick={() => setBrouillonCanon(JSON.stringify(fusionnerCanon(canon, canonDepuisMonde(dm)), null, 2))}>
            Compléter depuis le monde
          </button>
          <button
            className="bouton principal"
            disabled={!canonValide || brouillonCanon === null}
            onClick={() =>
              agir(async () => {
                await sauverCanon(JSON.parse(texteCanon));
                setBrouillonCanon(null);
              }, 'canon.json enregistré.')
            }
          >
            Enregistrer le canon
          </button>
          {brouillonCanon !== null && (
            <button className="bouton" onClick={() => setBrouillonCanon(null)}>
              Annuler
            </button>
          )}
          {brouillonCanon !== null && <span className="avertit">modifications non enregistrées</span>}
        </div>
        <textarea className="json canonTexte" rows={14} spellCheck={false} value={texteCanon} onChange={(e) => setBrouillonCanon(e.target.value)} />
        {!canonValide && <p className="erreur">canon.json invalide : {erreurCanon}</p>}
      </details>

      {message && <p className={message.ton === 'ok' ? 'bravo' : 'erreur'}>{message.texte}</p>}

      <div className="compteurs">
        {Object.entries(TITRES).map(([c, titre]) => (
          <button key={c} className={`compteur ${parCode[c] ? 'avis' : ''}${code === c ? ' actif' : ''}`} onClick={() => setCode(code === c ? '' : c)} aria-pressed={code === c}>
            <strong>{parCode[c] ?? 0}</strong> {titre}
          </button>
        ))}
        <input type="search" placeholder="Chercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label>
          <input type="checkbox" checked={montrerRejets} onChange={(e) => setMontrerRejets(e.target.checked)} /> Voir les {nbRejetees} rejetée(s)
        </label>
      </div>

      {visibles.length === 0 && <p className="bravo">{montrerRejets ? 'Aucune alerte rejetée.' : 'Rien à relire avec ces filtres.'}</p>}
      <div className="alertes">
        {visibles.slice(0, 150).map((d, i) => {
          const secret = d.code === 'revue.secret' ? canon.secrets.find((s) => s.id === d.donnees?.['secret']) : undefined;
          return (
            <article key={`${cleDeRevue(d)}-${i}`} className={`alerte ${d.gravite}`}>
              <header>
                <span className="gravite">{TITRES[d.code] ?? d.code}</span>
                {d.entite && (
                  <a href={lien(d.entite.type, d.entite.id)}>
                    <code>{d.entite.id}</code> <span className="muet">{d.entite.type}</span>
                  </a>
                )}
              </header>
              {d.code === 'revue.secret' ? (
                <div className="cote">
                  <div>
                    <h4>Secret « {String(d.donnees?.['secret'])} »</h4>
                    <p>{secret?.texte}</p>
                    <p className="muet">
                      mot tabou : <code>{String(d.donnees?.['mot'])}</code>
                    </p>
                  </div>
                  <div>
                    <h4>Lu librement : {String(d.donnees?.['champ'])}</h4>
                    <p>
                      <Surligne texte={String(d.donnees?.['extrait'])} mot={String(d.donnees?.['mot'])} />
                    </p>
                  </div>
                </div>
              ) : d.code === 'revue.nom-inconnu' ? (
                <p>
                  <b>{String(d.donnees?.['mot'])}</b> n’apparaît nulle part ailleurs dans le monde ({String(d.donnees?.['champ'])}) :{' '}
                  <em>
                    <Surligne texte={String(d.donnees?.['extrait'])} mot={String(d.donnees?.['mot'])} />
                  </em>
                </p>
              ) : (
                <p>{d.message}</p>
              )}
              <footer>
                {!montrerRejets && d.code === 'revue.secret' && (
                  <button className="bouton" onClick={() => autoriser(d)} title="Cette fiche a le droit d’en parler">
                    Autoriser cette fiche
                  </button>
                )}
                {!montrerRejets && d.code === 'revue.nom-inconnu' && (
                  <button className="bouton" onClick={() => aLexique(d)} title="Le nom est voulu : l’admettre dans le canon">
                    Ajouter au lexique
                  </button>
                )}
                {!montrerRejets && d.code === 'revue.personnage' && !!d.donnees?.['corrigeable'] && (
                  <button className="bouton" onClick={() => corriger(d)} title="Écrit la valeur du canon dans la fiche">
                    Corriger la fiche ({String(d.donnees?.['champ'])} → {String(d.donnees?.['attendu'])})
                  </button>
                )}
                {montrerRejets ? (
                  <button className="bouton" onClick={() => retablir(d)}>
                    Rétablir
                  </button>
                ) : (
                  <button className="bouton" onClick={() => rejeter(d)} title="Faux positif : ne plus le signaler (tant que le texte ne change pas)">
                    Rejeter
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>
      {visibles.length > 150 && <p className="muet">… {visibles.length - 150} autres : affinez.</p>}
    </section>
  );
}
