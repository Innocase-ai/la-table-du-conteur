import { useEffect, useMemo, useState } from 'react';
import { IA_NORMALE, IA_RAPIDE, type Groupe, type HeroCombat, type OptionsIA, type PersonnageCree, type Rencontre } from '@crpg/regles';
import { chargerDonnees } from './donnees';
import { Accueil } from './composants/Accueil';
import { Combat } from './composants/Combat';
import { Createur } from './createur/Createur';
import { EcranGroupe } from './groupe/EcranGroupe';
import { chargerGroupe, sauverGroupe } from './groupe/stockage';

export interface Reglages {
  rencontre: Rencontre;
  elan: boolean;
  ia: 'normale' | 'facile';
  /** Héros du combat : les six pré-tirés ou les personnages complets du groupe. */
  heros: 'pretires' | 'groupe';
  /** Personnages du groupe prêts pour le combat (quand `heros` vaut « groupe »). */
  herosCombat?: HeroCombat[];
}

export const OPTIONS_IA: Record<Reglages['ia'], OptionsIA> = { normale: IA_NORMALE, facile: IA_RAPIDE };

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

type Vue = { nom: 'accueil' } | { nom: 'groupe' } | { nom: 'createur'; index: number; personnage?: PersonnageCree };

export function App() {
  const donnees = useMemo(() => {
    try {
      return { ok: true as const, donnees: chargerDonnees() };
    } catch (e) {
      return { ok: false as const, erreur: e instanceof Error ? e.message : String(e) };
    }
  }, []);
  const [partie, setPartie] = useState<{ reglages: Reglages; graine: number } | null>(null);
  const [derniers, setDerniers] = useState<Reglages | undefined>();
  const [vue, setVue] = useState<Vue>({ nom: 'accueil' });
  const [groupe, setGroupe] = useState<Groupe>(() => chargerGroupe());

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
        onCreer={(index) => setVue({ nom: 'createur', index })}
        onModifier={(index) => setVue({ nom: 'createur', index, personnage: groupe.emplacements[index] ?? undefined })}
        onRetour={() => setVue({ nom: 'accueil' })}
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
        onQuitter={() => setVue({ nom: 'groupe' })}
        onTerminer={(p) => {
          setGroupe((g) => ({ ...g, emplacements: g.emplacements.map((x, i) => (i === vue.index ? p : x)) }));
          setVue({ nom: 'groupe' });
        }}
      />
    );
  }
  return (
    <Accueil
      donnees={d}
      groupe={groupe}
      initial={derniers}
      onGerer={() => setVue({ nom: 'groupe' })}
      onCombattre={(reglages) => {
        setDerniers(reglages);
        setPartie({ reglages, graine: nouvelleGraine() });
      }}
    />
  );
}
