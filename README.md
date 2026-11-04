# La Table du Conteur

CRPG narratif illustré (nom de travail : CRPG LLM), animé par un MJ IA (« le conteur »), sur les règles du SRD 5.2.1. Conception : [docs/PRD.md](docs/PRD.md) ; architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```bash
pnpm install
pnpm test        # tests du moteur et validation des données SRD
pnpm typecheck
pnpm jeu         # le jeu : écran titre, histoires, groupe, escarmouche, aide — http://localhost:5173
pnpm simuler 8 normale   # l'IA joue les deux camps sur chaque rencontre
pnpm images lister       # M2 : lot de test des services d'images (voir docs/M2-IMAGES.md)
pnpm monde valider       # valide les mondes (packages/mondes) ; pnpm monde doc <monde> génère le document lisible
```

- `packages/regles` : moteur de règles en TypeScript pur (aucune dépendance graphique ni réseau).
- `packages/donnees/srd` : données du SRD 5.2.1 en JSON, validées par les schémas de `regles/src/schemas.ts`.
- `apps/jeu` : client web (Vite + React) du prototype de combat. Le **guide du joueur** est l'« Aide au jeu » du menu (`src/menu/EcranAide.tsx`, captures dans `src/aide/`) ; le banc d'essai des effets de combat s'ouvre sur `/?effets`.
- `outils/` : scripts (simulation d'équilibre, comparaison des services d'images).
- `packages/mondes` : les mondes (histoires jouables) en JSON, validés par `pnpm monde valider`.
- `.claude/skills/creer-monde` : le skill qui guide la création d'un nouveau monde (`pnpm monde nouveau <id> "<Nom>"`).
- `docs/` : PRD, spécification du combat, du créateur de personnage, format des mondes, journal, inventaire du SRD.

Cette œuvre inclut du matériel issu du System Reference Document 5.2.1 (« SRD 5.2.1 ») de Wizards of the Coast LLC, disponible à l'adresse https://www.dndbeyond.com/srd. Le SRD 5.2.1 est régi par la Licence Creative Commons Attribution 4.0 International, disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.
