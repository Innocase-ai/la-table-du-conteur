# Rythme de progression d'Ombresang (XP et niveaux)

**Statut :** plan d'XP et plafond par chapitre **validés par l'utilisateur le 08/11/2026**.
**Principe :** le niveau 20 ne doit arriver qu'à la fin du monde. On monte vite de 1 à 3, puis de plus en plus lentement : c'est la courbe du SRD 5.2.1 (seuils de PX : 300, 900, 2 700, 6 500, 14 000, 23 000, 34 000, 48 000, 64 000, 85 000, 100 000, 120 000, 140 000, 165 000, 195 000, 225 000, 265 000, 305 000, 355 000), à condition que l'XP distribuée par les histoires la suive.

## Plan d'XP cible (total cumulé en fin de chapitre)

| Chapitre | XP cumulé | Niveau | Palier du chapitre (`niveaux`) |
| :--- | ---: | :---: | :---: |
| Prologue (Lame-Rousse, SR 1.1) | 900 | 3 | 1-3 |
| Région 1, Crêtes de Fer-Titan | 6 500 | 5 | 1-4 |
| Région 2, Sylve de Chair-Verte | 14 000 | 6 | 3-6 |
| Région 3, Mer de Vif-Argent | 34 000 | 8 | 5-8 |
| Région 4, Plateaux d'Os-Blanc | 64 000 | 10 | 7-10 |
| Région 5, Caldeira d'Ignis-Vora | 100 000 | 12 | 9-12 |
| Région 6, Archipels d'Aétheria | 140 000 | 14 | 11-14 |
| Région 7, Terres du Péché d'Or | 165 000 | 15 | 13-15 |
| Région 8, Cicatrice Blême | 305 000 | 19 | 16-19 |
| Finale | 355 000 | 20 | 20 |

## Les contrôles dans le moteur (faits le 08/11/2026)

1. **Plafond de niveau par chapitre** (`plafondDeNiveau`, `monde/etat.ts`) : le groupe ne dépasse pas `niveaux.max` du chapitre **le plus avancé où il est déjà allé** (un lieu appartient à un chapitre si lui ou un ancêtre figure dans `chapitre.lieux`). L'XP en trop **reste en réserve** et devient des niveaux en entrant dans un chapitre plus avancé (réaction du module `progression` à l'XP et au déplacement). Sans chapitre correspondant : niveau maximal du monde. **Conséquence d'écriture : `chapitres[].niveaux.max` d'un monde est une vraie limite, pas une indication.**
2. **XP une seule fois par rencontre** (`monde/exploration.ts`) : une rencontre qui revient (aléatoire, répétable) ne rapporte pas de PX une seconde fois, donc pas de farm. Les escarmouches libres sont un mode à part, sans lien avec la partie.

## Constats non traités

- Le `px` d'une victoire est calculé par le client (`apps/jeu/src/App.tsx`) et le moteur le prend tel quel, sans le recalculer d'après la rencontre. Sans risque pour un jeu solo honnête ; à recalculer si on veut un jeu à l'épreuve des modifications.
- Le validateur contrôle le budget de PX d'**une** rencontre selon le niveau, pas le total d'XP d'un chapitre. **Outil prévu** : `pnpm monde xp <monde>`, qui additionne l'XP disponible par chapitre (rencontres, quêtes, effets) et signale l'écart avec ce plan. À écrire quand les lieux d'Ombresang existeront en données.
- Lame-Rousse : le pitch gelé dit « niveau 1 à niveau 2 à la fin » ; le plan vise 900 PX (niveau 3). À corriger avec l'accord de l'utilisateur.
