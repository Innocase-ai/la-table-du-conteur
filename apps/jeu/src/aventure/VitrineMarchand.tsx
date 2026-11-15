// La vitrine d'un marchand : un tiroir « Boutique » à côté de la boîte de dialogue. Chaque article y a son image (celle du monde, sinon
// celle du catalogue SRD), son résumé (dégâts, CA, effet), son prix et la liste de ceux du groupe qui peuvent le porter ; un clic
// ouvre sa fiche complète. Acheter, vendre et payer un service jouent les mêmes ordres du moteur que les anciens boutons : cet
// écran ne fait que les présenter (`vitrine` du module Commerce).
import { useEffect, useMemo, useState } from 'react';
import type { ArticleVitrine, ContexteJeu, Ordre, Personnage, ServiceVitrine, Vitrine } from '@crpg/regles';
import { Portrait } from '../createur/ui';
import { Icone, LIBELLE_RARETE } from './icones';
import { useImageElement } from './GrilleElements';
import { compatibilite, resumeCompatibilite, type Compatibilite } from './vitrine-regles';

type Onglet = 'acheter' | 'vendre' | 'services';

interface Props {
  vitrine: Vitrine;
  ctx: ContexteJeu;
  monde: string;
  groupe: Personnage[];
  jouer: (o: Ordre) => void;
  fermer: () => void;
}

const LIBELLES_ETAT = { oui: 'peut le porter', 'sans-formation': 'peut le porter, sans formation', non: 'ne peut pas le porter' } as const;

/** Les pastilles des héros : qui peut porter l'article (vert), le peut sans formation (ambre), ne le peut pas (gris). */
function Porteurs({ c, groupe, detail = false }: { c: Compatibilite; groupe: Personnage[]; detail?: boolean }) {
  if (!c.equipable) return null;
  return (
    <ul className={`vitrine-porteurs${detail ? ' detail' : ''}`} aria-label={resumeCompatibilite(c)}>
      {c.heros.map((h) => {
        const heros = groupe.find((x) => x.id === h.heros);
        return (
          <li key={h.heros} className={`vitrine-porteur vitrine-porteur-${h.etat}${h.ameliore ? ' mieux' : ''}`} title={`${h.nom} ${LIBELLES_ETAT[h.etat]}${h.detail ? ` — ${h.detail}` : ''}`}>
            {heros && <Portrait id={heros.portrait} espece={heros.fiche.espece} classe={heros.fiche.classe} taille={detail ? 30 : 24} />}
            {detail && (
              <span className="vitrine-porteur-texte">
                <strong>{h.nom}</strong>
                <small>{h.etat === 'non' ? (h.detail ?? 'ne peut pas le porter') : (h.detail ?? LIBELLES_ETAT[h.etat])}</small>
              </span>
            )}
            {!detail && h.ameliore && <span className="vitrine-mieux" aria-hidden>▲</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Carte({ a, mode, monde, ctx, groupe, jouer, ouvert, basculer }: { a: ArticleVitrine; mode: 'acheter' | 'vendre'; monde: string; ctx: ContexteJeu; groupe: Personnage[]; jouer: (o: Ordre) => void; ouvert: boolean; basculer: () => void }) {
  const url = useImageElement(monde, a.image, a.imageCommune);
  const c = useMemo(() => (a.inconnu ? { equipable: false, heros: [] } : compatibilite(ctx, groupe, a.objet)), [ctx, groupe, a.objet, a.inconnu]);
  const [aConfirmer, setAConfirmer] = useState(false);
  useEffect(() => {
    if (!aConfirmer) return;
    const t = window.setTimeout(() => setAConfirmer(false), 3000);
    return () => window.clearTimeout(t);
  }, [aConfirmer]);
  const court = a.proprietes.slice(0, 2);
  return (
    <li className={`vitrine-carte${a.desactivee ? ' indisponible' : ''}${a.magique ? ' magique' : ''}${ouvert ? ' ouverte' : ''}`}>
      <div className="vitrine-carte-haut">
        <button type="button" className="vitrine-fiche-bouton" aria-expanded={ouvert} onClick={basculer} title="Voir la fiche de l'objet">
          <span className="vitrine-image" style={url ? { backgroundImage: `url(${url})` } : undefined} aria-hidden>
            {!url && <Icone id={a.categorie} taille={26} />}
          </span>
          <span className="vitrine-corps">
            <strong className="vitrine-nom">
              {a.nom}
              {a.quantite > 1 && <small> × {a.quantite}</small>}
            </strong>
            <span className="vitrine-resume">{a.resume}</span>
            {court.length > 0 && (
              <span className="vitrine-traits">
                {court.map((t) => (
                  <span key={t.libelle} className="vitrine-trait">
                    <small>{t.libelle}</small> {t.valeur}
                  </span>
                ))}
              </span>
            )}
          </span>
        </button>
        <div className="vitrine-achat">
          <span className="vitrine-prix">{a.prixTexte}</span>
          <button
            type="button"
            className={`bouton-discret vitrine-bouton${aConfirmer ? ' bouton-confirmer' : ''}`}
            disabled={!!a.desactivee}
            title={a.desactivee ?? (mode === 'acheter' ? `Acheter pour ${a.prixTexte}` : `Vendre pour ${a.prixTexte}`)}
            onClick={() => {
              if (a.confirmer && !aConfirmer) return setAConfirmer(true);
              setAConfirmer(false);
              jouer(a.ordre);
            }}
          >
            {aConfirmer ? 'Confirmer ?' : mode === 'acheter' ? 'Acheter' : 'Vendre'}
          </button>
        </div>
      </div>
      <Porteurs c={c} groupe={groupe} />
      {a.desactivee && <p className="vitrine-raison">{a.desactivee}</p>}
      {ouvert && (
        <div className="vitrine-fiche">
          <p className="vitrine-fiche-sous">
            {LIBELLE_RARETE[a.rarete as keyof typeof LIBELLE_RARETE] ?? ''}
            {a.magique ? ' · objet magique' : ''}
          </p>
          {a.proprietes.length > 0 && (
            <dl className="vitrine-proprietes">
              {a.proprietes.map((t) => (
                <div key={t.libelle}>
                  <dt>{t.libelle}</dt>
                  <dd>{t.valeur}</dd>
                </div>
              ))}
            </dl>
          )}
          {c.equipable && (
            <>
              <h5>Qui peut le porter</h5>
              <Porteurs c={c} groupe={groupe} detail />
            </>
          )}
          {!c.equipable && !a.inconnu && <p className="vitrine-sac">Se range dans le sac.</p>}
        </div>
      )}
    </li>
  );
}

function LigneService({ s, jouer }: { s: ServiceVitrine; jouer: (o: Ordre) => void }) {
  return (
    <li className={`vitrine-carte vitrine-service${s.desactivee ? ' indisponible' : ''}`}>
      <div className="vitrine-carte-haut">
        <div className="vitrine-corps">
          <strong className="vitrine-nom">{s.nom}</strong>
          <span className="vitrine-resume">{s.resume}</span>
          {s.desactivee && <span className="vitrine-raison">{s.desactivee}</span>}
        </div>
        <div className="vitrine-achat">
          <span className="vitrine-prix">{s.prixTexte}</span>
          <button type="button" className="bouton-discret vitrine-bouton" disabled={!!s.desactivee} title={s.desactivee} onClick={() => jouer(s.ordre)}>
            Payer
          </button>
        </div>
      </div>
    </li>
  );
}

/** Ce que la vitrine dit après un ordre : « Acheté : Bouclier (10 po). » (l'ordre lui-même est celui du moteur, le texte ne fait que le confirmer). */
function confirmation(vitrine: Vitrine, ordre: Ordre): string | undefined {
  if (ordre.type === 'acheter') {
    const a = vitrine.articles.find((x) => x.objet === ordre.objet);
    return a && `Acheté : ${a.nom} (${a.prixTexte}).`;
  }
  if (ordre.type === 'vendre') {
    const a = vitrine.rachats.find((x) => x.objet === ordre.objet);
    return a && `Vendu : ${a.nom} (${a.prixTexte}).`;
  }
  const s = vitrine.services.find((x) => x.id === ordre.service);
  return s && `Service payé : ${s.nom} (${s.prixTexte}).`;
}

export function VitrineMarchand({ vitrine, ctx, monde, groupe, jouer: jouerOrdre, fermer }: Props) {
  const [message, setMessage] = useState<string>();
  const jouer = (o: Ordre) => {
    setMessage(confirmation(vitrine, o));
    jouerOrdre(o);
  };
  const onglets = ([
    ['acheter', `À vendre (${vitrine.articles.length})`, vitrine.articles.length],
    ['vendre', `Vous vendez (${vitrine.rachats.length})`, vitrine.rachats.length],
    ['services', `Services (${vitrine.services.length})`, vitrine.services.length],
  ] as [Onglet, string, number][]).filter(([, , n]) => n > 0);
  const [onglet, setOnglet] = useState<Onglet>(onglets[0]?.[0] ?? 'acheter');
  const [ouvert, setOuvert] = useState<string>();
  const actif = onglets.some(([id]) => id === onglet) ? onglet : (onglets[0]?.[0] ?? 'acheter');
  const liste = actif === 'acheter' ? vitrine.articles : vitrine.rachats;
  return (
    <section className="vitrine" aria-label={`Boutique de ${vitrine.nom}`}>
      <header className="vitrine-entete">
        <div>
          <h4>Boutique de {vitrine.nom}</h4>
          <small>Bourse du groupe : {vitrine.bourseTexte}</small>
        </div>
        <button type="button" className="boite-fin" onClick={fermer} title="Échap">
          Retour au dialogue
        </button>
      </header>
      {onglets.length > 1 && (
        <nav className="vitrine-onglets" aria-label="Rayons">
          {onglets.map(([id, libelle]) => (
            <button key={id} type="button" className={id === actif ? 'actif' : ''} aria-current={id === actif} onClick={() => setOnglet(id)}>
              {libelle}
            </button>
          ))}
        </nav>
      )}
      {actif !== 'services' && (
        <p className="vitrine-legende">
          Portraits : <span className="vitrine-legende-oui">contour vert</span> = peut le porter, <span className="vitrine-legende-demi">orange</span> = sans formation, grisé = impossible. Cliquez un article pour sa fiche.
        </p>
      )}
      <p className="vitrine-message" role="status" aria-live="polite">
        {message}
      </p>
      <ul className="vitrine-liste">
        {actif === 'services'
          ? vitrine.services.map((s) => <LigneService key={s.id} s={s} jouer={jouer} />)
          : liste.map((a) => <Carte key={`${actif}:${a.objet}`} a={a} mode={actif} monde={monde} ctx={ctx} groupe={groupe} jouer={jouer} ouvert={ouvert === `${actif}:${a.objet}`} basculer={() => setOuvert(ouvert === `${actif}:${a.objet}` ? undefined : `${actif}:${a.objet}`)} />)}
        {actif !== 'services' && liste.length === 0 && <li className="vitrine-vide">{actif === 'acheter' ? 'Il ne reste plus rien à acheter.' : 'Votre sac ne contient rien qu’il rachète.'}</li>}
      </ul>
    </section>
  );
}
