import { useEffect, useMemo, useState } from "react";
import {
  IA_NORMALE,
  IA_RAPIDE,
  issueRencontre,
  type EtatCombat,
  type Groupe,
  type HeroCombat,
  type OptionsIA,
  type PersonnageCree,
  type Rencontre,
} from "@crpg/regles";
import { chargerDonnees } from "./donnees";
import { Accueil } from "./composants/Accueil";
import { Combat } from "./composants/Combat";
import { Createur } from "./createur/Createur";
import { EcranGroupe } from "./groupe/EcranGroupe";
import { chargerGroupe, herosDuGroupe, sauverGroupe } from "./groupe/stockage";
import { EcranAide } from "./menu/EcranAide";
import { EcranAventure } from "./aventure/EcranAventure";
import {
  aventureSauvegardee,
  demarrerAventure,
  journaliser,
  rencontreDeMonde,
  restaurerAventure,
  sauverAventure,
  type Aventure,
} from "./aventure/partie";
import { chargerHistoire } from "./mondes";
import { EcranHistoires } from "./menu/EcranHistoires";
import { EcranTitre } from "./menu/EcranTitre";

export interface Reglages {
  rencontre: Rencontre;
  elan: boolean;
  ia: "normale" | "facile";
  /** Héros du combat : les six pré-tirés ou les personnages complets du groupe. */
  heros: "pretires" | "groupe";
  /** Personnages du groupe prêts pour le combat (quand `heros` vaut « groupe »). */
  herosCombat?: HeroCombat[];
  /** PV de départ des héros (combat d'une histoire), par id de combattant. */
  pvHeros?: Record<string, number>;
}

export const OPTIONS_IA: Record<Reglages["ia"], OptionsIA> = {
  normale: IA_NORMALE,
  facile: IA_RAPIDE,
};

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

type Ecran = "titre" | "histoires" | "escarmouche" | "aide" | "aventure";
type Vue =
  | { nom: Ecran }
  | { nom: "groupe"; retour: Ecran }
  | {
      nom: "createur";
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
  const [vue, setVue] = useState<Vue>({ nom: "titre" });
  const [groupe, setGroupe] = useState<Groupe>(() => chargerGroupe());
  const [aventure, setAventure] = useState<Aventure | null>(null);
  const [combatHistoire, setCombatHistoire] = useState<{
    reglages: Reglages;
    graine: number;
  } | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);

  // Sauvegarde automatique du groupe.
  useEffect(() => sauverGroupe(groupe), [groupe]);

  if (!donnees.ok) {
    return (
      <div className="erreur-fatale">
        <h1>Données SRD invalides</h1>
        <pre>{donnees.erreur}</pre>
      </div>
    );
  }
  const d = donnees.donnees;

  if (combatHistoire && aventure) {
    const finCombat = (etat: EtatCombat) => {
      const rencontre = combatHistoire.reglages.rencontre.id;
      const p = aventure.partie;
      // Les PV du combat reviennent au groupe ; un héros tombé est relevé à 1 PV une fois le combat fini.
      for (const c of etat.combattants) {
        const a = p.groupe.find((x) => x.id === c.id);
        if (a) a.pv = Math.max(etat.vainqueur === "heros" ? 1 : 0, c.pv);
      }
      if (etat.vainqueur === "heros") {
        const px = etat.combattants
          .filter((c) => c.camp === "monstres" && (c.mort || c.enFuite))
          .reduce((s, c) => s + c.px, 0);
        journaliser(
          aventure,
          issueRencontre(p, rencontre, { type: "victoire", px }),
        );
      } else {
        for (const a of p.groupe) a.pv = Math.max(1, a.pv);
        aventure.journal.push({
          type: "constat",
          texte: etat.vainqueur
            ? "Le groupe est vaincu et doit battre en retraite, à bout de forces."
            : "Le groupe rompt le combat et se replie.",
        });
        journaliser(aventure, issueRencontre(p, rencontre, { type: "fuite" }));
      }
      aventure.combatEnAttente = undefined;
      sauverAventure(aventure);
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
  if (vue.nom === "aventure" && aventure) {
    sauverAventure(aventure);
    return (
      <EcranAventure
        aventure={aventure}
        onMenu={() => setVue({ nom: "titre" })}
        onCombat={(id) => {
          const p = aventure.partie;
          setCombatHistoire({
            graine: nouvelleGraine(),
            reglages: {
              rencontre: rencontreDeMonde(aventure.dm, id),
              elan: true,
              ia: "normale",
              heros: "groupe",
              herosCombat: herosDuGroupe(groupe, d),
              pvHeros: Object.fromEntries(p.groupe.map((a) => [a.id, a.pv])),
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
  if (vue.nom === "groupe") {
    return (
      <EcranGroupe
        groupe={groupe}
        donnees={d}
        onChange={setGroupe}
        onCreer={(index) =>
          setVue({ nom: "createur", index, retour: vue.retour })
        }
        onModifier={(index) =>
          setVue({
            nom: "createur",
            index,
            personnage: groupe.emplacements[index] ?? undefined,
            retour: vue.retour,
          })
        }
        onRetour={() => setVue({ nom: vue.retour })}
      />
    );
  }
  if (vue.nom === "createur") {
    return (
      <Createur
        key={`${vue.index}-${vue.personnage?.id ?? "nouveau"}`}
        donnees={d}
        personnage={vue.personnage}
        niveauGroupe={groupe.niveau}
        onQuitter={() => setVue({ nom: "groupe", retour: vue.retour })}
        onTerminer={(p) => {
          setGroupe((g) => ({
            ...g,
            emplacements: g.emplacements.map((x, i) =>
              i === vue.index ? p : x,
            ),
          }));
          setVue({ nom: "groupe", retour: vue.retour });
        }}
      />
    );
  }
  if (vue.nom === "histoires") {
    return (
      <>
        <EcranHistoires
          donnees={d}
          groupe={groupe}
          onGroupe={() => setVue({ nom: "groupe", retour: "histoires" })}
          onRetour={() => setVue({ nom: "titre" })}
          onCommencer={(monde) => {
            setChargement("Ouverture du livre…");
            chargerHistoire(monde)
              .then((dm) => {
                setAventure(demarrerAventure(dm, groupe, d));
                setVue({ nom: "aventure" });
              })
              .catch((e: unknown) =>
                alert(e instanceof Error ? e.message : String(e)),
              )
              .finally(() => setChargement(null));
          }}
        />
        {chargement && <div className="chargement">{chargement}</div>}
      </>
    );
  }
  if (vue.nom === "aide")
    return <EcranAide onRetour={() => setVue({ nom: "titre" })} />;
  if (vue.nom === "titre") {
    const sauvegarde = aventure ? undefined : aventureSauvegardee();
    return (
      <>
        {chargement && <div className="chargement">{chargement}</div>}
        <EcranTitre
          donnees={d}
          groupe={groupe}
          onHistoires={() => setVue({ nom: "histoires" })}
          onGroupe={() => setVue({ nom: "groupe", retour: "titre" })}
          onEscarmouche={() => setVue({ nom: "escarmouche" })}
          onAide={() => setVue({ nom: "aide" })}
          enCours={
            aventure
              ? {
                  nom: `${aventure.dm.monde.nom} — ${aventure.dm.lieux.get(aventure.partie.etat.lieu)?.nom ?? ""}`,
                  onReprendre: () => setVue({ nom: "aventure" }),
                }
              : sauvegarde
                ? {
                    nom: "Partie sauvegardée",
                    onReprendre: () => {
                      setChargement("Ouverture du livre…");
                      chargerHistoire(sauvegarde.monde)
                        .then((dm) => {
                          const a = restaurerAventure(dm, groupe, d);
                          if (a) {
                            setAventure(a);
                            setVue({ nom: "aventure" });
                          }
                        })
                        .catch((e: unknown) =>
                          alert(e instanceof Error ? e.message : String(e)),
                        )
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
      onRetour={() => setVue({ nom: "titre" })}
      onGerer={() => setVue({ nom: "groupe", retour: "escarmouche" })}
      onCombattre={(reglages) => {
        setDerniers(reglages);
        setPartie({ reglages, graine: nouvelleGraine() });
      }}
    />
  );
}
