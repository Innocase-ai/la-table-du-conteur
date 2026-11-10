import { useEffect, useMemo, useState } from 'react';
import { Canon, CANON_VIDE, type DonneesMonde } from '@crpg/regles';
import { demanderAssistant, etatAssistant, type EtatAssistant, type MondeLu } from '../api';
import {
  ACTIONS,
  cibleDuTexte,
  compterMots,
  contexteDeLaFiche,
  fuites,
  libelleChemin,
  lireChemin,
  messageDeSuite,
  messagesInitiaux,
  nettoyerProposition,
  sectionDuCanon,
  tabousPour,
  textesDeLaFiche,
  type ActionAssistant,
  type Chemin,
  type MessageIa,
} from '../assistant';

const dollars = (n: number) => `${n.toFixed(4).replace('.', ',')} $`;

/**
 * L'assistant d'écriture d'une fiche : on choisit un texte de la fiche, on demande (Rédiger, Améliorer, Clarifier… ou une consigne
 * libre), on lit la proposition avec sa longueur et les mots tabou qu'elle contiendrait, puis on l'applique au brouillon — ou on
 * continue la conversation (« plus sombre », « sans la cloche »). Rien n'est écrit sur le disque avant « Enregistrer ».
 */
export function Assistant({ lu, dm, dossier, id, brouillon, cheminInitial, appliquer, fermer }: { lu: MondeLu; dm: DonneesMonde; dossier: string; id: string; brouillon: Record<string, unknown>; cheminInitial: Chemin; appliquer: (chemin: Chemin, texte: string) => void; fermer: () => void }) {
  const textes = useMemo(() => textesDeLaFiche(brouillon), [brouillon]);
  const [chemin, setChemin] = useState<Chemin>(cheminInitial);
  const cle = libelleChemin(chemin);
  const actuel = String(lireChemin(brouillon, chemin) ?? '');
  const cible = cibleDuTexte(dossier, chemin);

  const canon = useMemo(() => {
    const r = Canon.safeParse(lu.canon?.contenu ?? {});
    return r.success ? r.data : CANON_VIDE;
  }, [lu]);
  const tabous = useMemo(() => tabousPour(canon, dossier, id), [canon, dossier, id]);

  const [etat, setEtat] = useState<EtatAssistant | null>(null);
  const [conversation, setConversation] = useState<MessageIa[]>([]);
  const [consigne, setConsigne] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [dernierCout, setDernierCout] = useState<number | null>(null);

  useEffect(() => {
    // Un serveur démarré avant l'ajout de l'assistant renvoie la page HTML au lieu de l'état : le dire simplement.
    etatAssistant().then(setEtat, () => setErreur('Le serveur de l’atelier ne connaît pas l’assistant : relancez pnpm atelier (il a été démarré avant son ajout).'));
  }, []);
  // Un autre texte : nouvelle conversation.
  useEffect(() => {
    setConversation([]);
    setErreur('');
  }, [cle]);

  const nomPnj = dossier === 'pnj' ? String(brouillon['nom'] ?? '') : dossier === 'savoirs' ? (dm.pnj.get(String(brouillon['pnj'] ?? ''))?.nom ?? '') : '';

  const demander = async (action: ActionAssistant | undefined) => {
    if (!action && !consigne.trim()) return;
    const messages: MessageIa[] = conversation.length
      ? [...conversation, messageDeSuite(action, consigne)]
      : messagesInitiaux({
          nomMonde: String((lu.monde as { nom?: string } | null)?.nom ?? lu.id),
          bible: lu.docs.bible,
          canonDuPnj: sectionDuCanon(lu.docs.canonPersonnages, nomPnj),
          contexte: contexteDeLaFiche(dm, dossier, brouillon),
          dossier,
          fiche: brouillon,
          chemin,
          texte: actuel,
          tabous,
          ...(action ? { action } : {}),
          consigne,
        });
    setEnCours(true);
    setErreur('');
    try {
      const r = await demanderAssistant(messages);
      setConversation([...messages, { role: 'assistant', content: nettoyerProposition(r.texte) }]);
      setConsigne('');
      setDernierCout(r.cout);
      setEtat((e) => (e ? { ...e, depense: r.depense, plafond: r.plafond } : e));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  // Les échanges visibles : la consigne de l'auteur (sans le contexte du premier message) et chaque proposition.
  const echanges = conversation.slice(1).map((m, i) => ({ ...m, i: i + 1 }));
  const derniere = [...conversation].reverse().find((m) => m.role === 'assistant')?.content;
  const pasDeCle = !etat || !etat.disponible;
  const plafondAtteint = etat && etat.depense >= etat.plafond;

  return (
    <div className="assistant">
      <div className="assistantTete">
        <b>Assistant d’écriture</b>
        <select value={cle} onChange={(e) => setChemin(textes.find((t) => t.libelle === e.target.value)?.chemin ?? chemin)} aria-label="Texte à écrire">
          {!textes.some((t) => t.libelle === cle) && <option value={cle}>{cle}</option>}
          {textes.map((t) => (
            <option key={t.libelle} value={t.libelle}>
              {t.libelle} ({compterMots(t.texte)} mots)
            </option>
          ))}
        </select>
        <span className="muet">
          {compterMots(actuel)} mots{cible ? ` · visé ${cible.min} à ${cible.max}` : ''}
        </span>
        <span className="muet assistantCout">
          {etat ? `${etat.modele.replace(/^.*\//, '')} · dépensé ${dollars(etat.depense)} sur ${dollars(etat.plafond)}` : '…'}
          {dernierCout !== null && ` · dernier appel ${dollars(dernierCout)}`}
        </span>
        <button className="lien" onClick={fermer}>
          fermer
        </button>
      </div>
      {etat && !etat.disponible && <p className="erreur">Pas de clé sur le serveur de l’atelier (OPENROUTER_API_KEY dans le .env du projet) : relancez pnpm atelier après l’avoir ajoutée.</p>}
      {plafondAtteint && <p className="erreur">Plafond de dépense atteint pour cette session du serveur (ATELIER_PLAFOND_USD dans le .env ; relancer l’atelier remet le compteur à zéro).</p>}

      {echanges.length > 0 && (
        <div className="assistantFil">
          {echanges.map((m) =>
            m.role === 'user' ? (
              <p key={m.i} className="assistantDemande">
                {m.i === 1 ? (m.content.split('## Demande\n')[1] ?? m.content) : m.content}
              </p>
            ) : (
              <Proposition key={m.i} texte={m.content} cible={cible} tabous={tabous} derniere={m.content === derniere} appliquer={() => appliquer(chemin, m.content)} />
            ),
          )}
        </div>
      )}

      <div className="assistantActions">
        {ACTIONS.map((a) => (
          <button key={a.id} className="bouton" disabled={enCours || !!pasDeCle || !!plafondAtteint} title={a.consigne} onClick={() => demander(a.id)}>
            {a.libelle}
          </button>
        ))}
        {conversation.length > 0 && (
          <button className="lien" disabled={enCours} onClick={() => setConversation([])}>
            nouvelle conversation
          </button>
        )}
      </div>
      <div className="assistantLibre">
        <textarea
          rows={2}
          value={consigne}
          placeholder={conversation.length ? 'Une retouche : « plus sombre », « sans la cloche », « qu’il hésite avant de répondre »… (Ctrl+Entrée)' : 'Une consigne libre (facultatif) : ce que le texte doit dire, le ton… Avec un bouton, elle s’ajoute à l’action. (Ctrl+Entrée)'}
          onChange={(e) => setConsigne(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && void demander(undefined)}
        />
        <button className="bouton principal" disabled={enCours || !consigne.trim() || !!pasDeCle || !!plafondAtteint} onClick={() => demander(undefined)}>
          {enCours ? 'L’assistant écrit…' : 'Envoyer'}
        </button>
      </div>
      {erreur && <p className="erreur">{erreur}</p>}
      <p className="muet petit">Chaque demande est un appel payant (Claude Haiku 5.5, de l’ordre de 0,002 $ avec la bible du monde). La proposition ne touche que le brouillon : relisez, puis « Enregistrer ».</p>
    </div>
  );
}

function Proposition({ texte, cible, tabous, derniere, appliquer }: { texte: string; cible: ReturnType<typeof cibleDuTexte>; tabous: { secret: string; mot: string }[]; derniere: boolean; appliquer: () => void }) {
  const n = compterMots(texte);
  const f = fuites(texte, tabous);
  const horsCible = cible && (n < cible.min || n > cible.max);
  return (
    <div className={`assistantProposition${derniere ? ' derniere' : ''}`}>
      <p>{texte}</p>
      <div className="assistantVerif">
        <span className={horsCible ? 'avertit' : 'muet'}>
          {n} mots{cible ? (horsCible ? ` (visé ${cible.min} à ${cible.max})` : ' ✓') : ''}
        </span>
        {f.map((x) => (
          <span key={x.secret + x.mot} className="erreur">
            {' '}
            · secret « {x.secret} » : « {x.mot} » (« {x.extrait} »)
          </span>
        ))}
        <button className="bouton principal" onClick={appliquer} title={f.length ? 'Attention : un mot tabou est dans le texte' : 'Remplacer le texte du brouillon par cette proposition'}>
          Appliquer{f.length ? ' malgré tout' : ''}
        </button>
      </div>
    </div>
  );
}
