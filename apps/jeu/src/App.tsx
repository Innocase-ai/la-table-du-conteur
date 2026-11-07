import { useEffect, useMemo, useState } from 'react';
import { IA_NORMALE, IA_RAPIDE, adapterRencontre, heroCombatDe, type EtatCombat, type Groupe, type HeroCombat, type OptionsIA, type Partie, type PersonnageCree, type Rencontre } from '@crpg/regles';
import { chargerDonnees } from './donnees';
import { Accueil } from './composants/Accueil';
import { Combat } from './composants/Combat';
import { Createur } from './createur/Createur';
import { EcranGroupe } from './groupe/EcranGroupe';
import { chargerGroupe, herosDuGroupe, sauverGroupe } from './groupe/stockage';
import { EcranAide } from './menu/EcranAide';
import { EcranAventure } from './aventure/EcranAventure';
import { demarrerAventure, partieSauvegardee, rencontreDeMonde, reprendreAventure, sauverPartie, type Aventure } from './aventure/partie';
import { chargerHistoire } from './mondes';
import { definirSceneMusique } from './musique';
import type { SceneMusique } from './musique-regles';
import { EcranHistoires } from './menu/EcranHistoires';
import { EcranTitre } from './menu/EcranTitre';

export interface Reglages {
  rencontre: Rencontre;
  elan: boolean;
  ia: 'normale' | 'facile';
  /** Héros du combat : les six pré-tirés ou les personnages complets du groupe. */
  heros: 'pretires' | 'groupe';
  /** Personnages du groupe prêts pour le combat (quand `heros` vaut « groupe »). */
  herosCombat?: HeroCombat[];
}

export const OPTIONS_IA: Record<Reglages['ia'], OptionsIA> = {
  normale: IA_NORMALE,
  facile: IA_RAPIDE,
};

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

type Ecran = 'titre' | 'histoires' | 'escarmouche' | 'aide' | 'aventure';
type Vue =
  | { nom: Ecran }
  | { nom: 'groupe'; retour: Ecran }
  | {
      nom: 'createur';
      index: number;
      personnage?: PersonnageCree;
      retour: Ecran;
    };

export function App() {
  const donnees = useMemo(() => {
    try {
      return { ok: true as const, donnees: chargerDonnees() };
    } catch (e) {
      return {
        ok: false as const,
        erreur: e instanceof Error ? e.message : String(e),
      };
    }
  }, []);
  const [partie, setPartie] = useState<{
    reglages: Reglages;
    graine: number;
  } | null>(null);
  const [derniers, setDerniers] = useState<Reglages | undefined>();
  // Le joueur arrive sur l'écran titre.
  const [vue, setVue] = useState<Vue>({ nom: 'titre' });
  const [groupe, setGroupe] = useState<Groupe>(() => chargerGroupe());
  const [aventure, setAventure] = useState<Aventure | null>(null);
  const [combatHistoire, setCombatHistoire] = useState<{
    reglages: Reglages;
    graine: number;
  } | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);

  // Sauvegarde automatique du groupe.
  useEffect(() => sauverGroupe(groupe), [groupe]);

  // La musique suit la scène : celle des menus, ou le fond d'une histoire en cours (un combat de l'histoire en garde la musique
  // de combat, puis le fond reprend). Une escarmouche libre n'a que la musique de son combat.
  const sceneMusique: SceneMusique = partie ? undefined : (combatHistoire && aventure) || vue.nom === 'aventure' ? 'histoire' : 'accueil';
  useEffect(() => definirSceneMusique(sceneMusique), [sceneMusique]);

  if (!donnees.ok) {
    return (
      <div className="erreur-fatale">
        <h1>Données SRD invalides</h1>
        <pre>{donnees.erreur}</pre>
      </div>
    );
  }
  const d = donnees.donnees;

  /** Nouvelle partie du moteur : on la garde et on la sauvegarde. */
  const suite = (p: Partie) => {
    if (!aventure) return;
    setAventure({ ...aventure, partie: p });
    sauverPartie(p);
  };

  if (combatHistoire && aventure) {
    const finCombat = (etat: EtatCombat) => {
      // L'état des héros revient à l'histoire : PV (un héros tombé est relevé à 1 PV), potions bues, usages et emplacements dépensés.
      const heros = Object.fromEntries(
        etat.combattants
          .filter((c) => c.camp === 'heros')
          .map((c) => [c.id, { pv: Math.max(1, c.pv), ressources: c.ressources, emplacements: c.incantation?.emplacements }]),
      );
      const victoire = etat.vainqueur === 'heros';
      const px = etat.combattants.filter((c) => c.camp === 'monstres' && (c.mort || c.enFuite)).reduce((s, c) => s + c.px, 0);
      // Une défaite (tout le groupe à terre) a un prix ; une retraite non.
      const issue = victoire ? 'victoire' : etat.vainqueur === 'monstres' ? 'defaite' : 'fuite';
      const r = aventure.moteur.executer(aventure.partie, { type: 'reglerRencontre', issue, ...(victoire ? { px } : {}), heros });
      suite(r.partie);
      setCombatHistoire(null);
    };
    return (
      <Combat
        key={combatHistoire.graine}
        donnees={d}
        reglages={combatHistoire.reglages}
        graine={combatHistoire.graine}
        onRejouer={() => undefined}
        onRetour={() => setCombatHistoire(null)}
        onFinHistoire={finCombat}
      />
    );
  }
  if (vue.nom === 'aventure' && aventure) {
    return (
      <EcranAventure
        aventure={aventure}
        onPartie={suite}
        onMenu={() => setVue({ nom: 'titre' })}
        onCombat={() => {
          const p = aventure.partie;
          if (p.scene.type !== 'rencontre') return;
          setCombatHistoire({
            graine: nouvelleGraine(),
            reglages: {
              rencontre: adapterRencontre(rencontreDeMonde(aventure.moteur.ctx.dm, p.scene.rencontre), p.groupe.length),
              elan: true,
              ia: 'normale',
              heros: 'groupe',
              herosCombat: p.groupe.map(heroCombatDe),
            },
          });
        }}
      />
    );
  }
  if (partie) {
    return (
      <Combat
        key={partie.graine}
        donnees={d}
        reglages={partie.reglages}
        graine={partie.graine}
        onRejouer={() => setPartie({ ...partie, graine: nouvelleGraine() })}
        onRetour={() => setPartie(null)}
      />
    );
  }
  if (vue.nom === 'groupe') {
    return (
      <EcranGroupe
        groupe={groupe}
        donnees={d}
        onChange={setGroupe}
        onCreer={(index) => setVue({ nom: 'createur', index, retour: vue.retour })}
        onModifier={(index) =>
          setVue({
            nom: 'createur',
            index,
            personnage: groupe.emplacements[index] ?? undefined,
            retour: vue.retour,
          })
        }
        onRetour={() => setVue({ nom: vue.retour })}
      />
    );
  }
  if (vue.nom === 'createur') {
    return (
      <Createur
        key={`${vue.index}-${vue.personnage?.id ?? 'nouveau'}`}
        donnees={d}
        personnage={vue.personnage}
        niveauGroupe={groupe.niveau}
        onQuitter={() => setVue({ nom: 'groupe', retour: vue.retour })}
        onTerminer={(p) => {
          setGroupe((g) => ({
            ...g,
            emplacements: g.emplacements.map((x, i) => (i === vue.index ? p : x)),
          }));
          setVue({ nom: 'groupe', retour: vue.retour });
        }}
      />
    );
  }
  if (vue.nom === 'histoires') {
    return (
      <>
        <EcranHistoires
          donnees={d}
          groupe={groupe}
          onGroupe={() => setVue({ nom: 'groupe', retour: 'histoires' })}
          onRetour={() => setVue({ nom: 'titre' })}
          onCommencer={(monde) => {
            setChargement('Ouverture du livre…');
            chargerHistoire(monde)
              .then((dm) => {
                const a = demarrerAventure(dm, groupe, d);
                sauverPartie(a.partie);
                setAventure(a);
                setVue({ nom: 'aventure' });
              })
              .catch((e: unknown) => alert(e instanceof Error ? e.message : String(e)))
              .finally(() => setChargement(null));
          }}
        />
        {chargement && <div className="chargement">{chargement}</div>}
      </>
    );
  }
  if (vue.nom === 'aide') return <EcranAide onRetour={() => setVue({ nom: 'titre' })} />;
  if (vue.nom === 'titre') {
    const sauvegarde = aventure ? undefined : partieSauvegardee();
    return (
      <>
        {chargement && <div className="chargement">{chargement}</div>}
        <EcranTitre
          donnees={d}
          groupe={groupe}
          onHistoires={() => setVue({ nom: 'histoires' })}
          onGroupe={() => setVue({ nom: 'groupe', retour: 'titre' })}
          onEscarmouche={() => setVue({ nom: 'escarmouche' })}
          onAide={() => setVue({ nom: 'aide' })}
          enCours={
            aventure
              ? {
                  nom: `${aventure.moteur.ctx.dm.monde.nom} — ${aventure.moteur.ctx.dm.lieux.get(aventure.partie.etat.lieu)?.nom ?? ''}`,
                  onReprendre: () => setVue({ nom: 'aventure' }),
                }
              : sauvegarde
                ? {
                    nom: 'Partie sauvegardée',
                    onReprendre: () => {
                      setChargement('Ouverture du livre…');
                      chargerHistoire(sauvegarde.monde)
                        .then((dm) => {
                          const a = reprendreAventure(dm, d);
                          if (a) {
                            setAventure(a);
                            setVue({ nom: 'aventure' });
                          }
                        })
                        .catch((e: unknown) => alert(e instanceof Error ? e.message : String(e)))
                        .finally(() => setChargement(null));
                    },
                  }
                : undefined
          }
        />
      </>
    );
  }
  return (
    <Accueil
      donnees={d}
      groupe={groupe}
      initial={derniers}
      onRetour={() => setVue({ nom: 'titre' })}
      onGerer={() => setVue({ nom: 'groupe', retour: 'escarmouche' })}
      onCombattre={(reglages) => {
        setDerniers(reglages);
        setPartie({ reglages, graine: nouvelleGraine() });
      }}
    />
  );
}
