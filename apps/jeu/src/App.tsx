import { useMemo, useState } from 'react';
import { IA_NORMALE, IA_RAPIDE, type OptionsIA, type Rencontre } from '@crpg/regles';
import { chargerDonnees } from './donnees';
import { Accueil } from './composants/Accueil';
import { Combat } from './composants/Combat';

export interface Reglages {
  rencontre: Rencontre;
  elan: boolean;
  ia: 'normale' | 'facile';
}

export const OPTIONS_IA: Record<Reglages['ia'], OptionsIA> = { normale: IA_NORMALE, facile: IA_RAPIDE };

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

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

  if (!donnees.ok) {
    return (
      <div className="erreur-fatale">
        <h1>Données SRD invalides</h1>
        <pre>{donnees.erreur}</pre>
      </div>
    );
  }
  if (!partie) {
    return (
      <Accueil
        donnees={donnees.donnees}
        initial={derniers}
        onCombattre={(reglages) => {
          setDerniers(reglages);
          setPartie({ reglages, graine: nouvelleGraine() });
        }}
      />
    );
  }
  return (
    <Combat
      key={partie.graine}
      donnees={donnees.donnees}
      reglages={partie.reglages}
      graine={partie.graine}
      onRejouer={() => setPartie({ ...partie, graine: nouvelleGraine() })}
      onRetour={() => setPartie(null)}
    />
  );
}
