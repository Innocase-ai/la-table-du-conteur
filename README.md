# CRPG LLM (nom de travail)

CRPG narratif illustré, animé par un MJ IA, sur les règles du SRD 5.2.1. Conception : [docs/PRD.md](docs/PRD.md).

```bash
pnpm install
pnpm test        # tests du moteur et validation des données SRD
pnpm typecheck
pnpm jeu         # prototype du combat de cartes : http://localhost:5173
pnpm simuler 8 normale   # l'IA joue les deux camps sur chaque rencontre
```

- `packages/regles` : moteur de règles en TypeScript pur (aucune dépendance graphique ni réseau).
- `packages/donnees/srd` : données du SRD 5.2.1 en JSON, validées par les schémas de `regles/src/schemas.ts`.
- `apps/jeu` : client web (Vite + React) du prototype de combat.
- `outils/` : scripts (simulation d'équilibre).
- `docs/` : PRD, spécification du combat, journal, inventaire du SRD.

Cette œuvre inclut du matériel issu du System Reference Document 5.2.1 (« SRD 5.2.1 ») de Wizards of the Coast LLC, disponible à l'adresse https://www.dndbeyond.com/srd. Le SRD 5.2.1 est régi par la Licence Creative Commons Attribution 4.0 International, disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.
