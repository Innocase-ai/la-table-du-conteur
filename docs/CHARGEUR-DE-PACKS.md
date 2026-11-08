# Chargeur de packs : conception

**Statut :** proposition à valider (08/11/2026). Aucun code écrit. Fait suite à `docs/PARTIE-UNIQUE.md`.
**But :** vendre Ombresang par packs de région (5 à 10 €, 8 sous-régions chacun, 1 à 2 sous-régions publiées par semaine) dans **une seule partie** qui traverse tout le monde, sans jamais charger tout le monde en mémoire.

## 1. Ce qu'on mesure et ce qu'on estime

| Monde existant | JSON (texte) | Images | Voix |
| :--- | ---: | ---: | ---: |
| Val des Cendres | 1,6 Mo | 15 Mo | 4,4 Mo |
| Citadelle des Marées | 0,8 Mo | 7,3 Mo | 3,7 Mo |
| Port-Sillage | 0,35 Mo | 3 Mo | 3 Mo |

*Estimation, non mesurée sur Ombresang* : 64 sous-régions au niveau de détail du Val des Cendres feraient 60 à 120 Mo de JSON. Les modules de lieu seront plus légers, mais on se fixe un budget : **base ≤ 2 Mo, pack de région ≤ 8 Mo de JSON**, soit au plus ≈ 26 Mo de JSON actifs (base + 3 packs), de l'ordre de 100 Mo une fois transformé en objets (à mesurer avant de promettre).

## 2. Le principe

- **Texte** : seuls la *base* et les packs « actifs » (région en cours, plus les voisines directes) sont en mémoire. Les autres restent sur le disque.
- **Images et voix** : jamais en mémoire d'avance. Chargées à la demande, par URL (déjà le cas dans `apps/jeu/src/mondes.ts`) ; on précharge la sous-région en cours et ses sorties.
- **Sauvegarde** : l'état seulement (groupe, drapeaux, quêtes, inventaire, journal borné). Elle ne dépend pas de ce qui est chargé ; `completerEtat` (fait) gère un pack ajouté plus tard.

## 3. Le format d'un pack

Un pack est **un dossier ou une archive** qui reprend la forme d'un monde : `lieux/`, `pnj/`, `quetes/`, `rencontres/`… et `images/`, `voix/`, plus :

- **`pack.json` (manifeste)** : `id`, `region`, `version`, `moteur` (version de compatibilité du moteur et du catalogue SRD), `depend` (toujours `["base"]`), `niveaux`, `sousRegions[]`, empreinte SHA-256 de chaque fichier, tailles.
- **`index.json` (léger, ~quelques dizaines de Ko)** : titres des quêtes, noms des lieux et des PNJ du pack. Il reste chargé même quand le pack est déchargé, pour que le journal de quêtes et la carte puissent afficher des titres.

**La base (`ombresang-base`)** : `monde.json`, factions, jauges globales (dont « Battement du Cœur »), faits globaux du fil rouge, capitale, objets propres au monde. **Le pack d'entrée** (région 1, avec Lame-Rousse) est la première région ; offert ou non, c'est une décision commerciale.

### Règle de dépendance (la plus importante)
Un pack **ne cite que ses propres identifiants ou ceux de la base**. Les liens entre régions passent par des **drapeaux et faits globaux déclarés dans la base**, jamais par l'identifiant d'un PNJ d'une autre région. Ainsi, un pack absent ou déchargé ne casse jamais un autre pack.

## 4. Côté moteur (`packages/regles`)

- `assemblerPack(manifeste, fichiers)` : valide les fichiers d'un pack et renvoie ses entités avec la **liste de ses identifiants**.
- `fusionnerPack(dm, pack)` et `decharger(dm, idPack)` : ajoute ou retire les entités d'un pack sans revalider le reste (`assemblerMonde` existe déjà et valide tout ; on garde cette voie pour les outils et les tests).
- **Gestionnaire de packs** : garde au plus N packs actifs (défaut : région en cours + 2 voisines), charge à l'entrée d'une sous-région, précharge ses sorties en tâche de fond, décharge le plus ancien. Un écran de chargement couvre le premier chargement d'une région.
- **Un pack non possédé** : la sous-région apparaît verrouillée sur la carte (« pack non installé ») ; le trajet est refusé avec un message, sans erreur.
- **Validation isolée** : `pnpm monde valider` (à étendre) valide *base + chaque pack seul*, pour garantir la règle de dépendance.

## 5. Côté application

Une interface `SourceDePacks` à deux réalisations :

1. **Développement et tests** : lecture par `import.meta.glob` (comme aujourd'hui), pour ne rien changer au flux de travail.
2. **Application de bureau (Tauri)** : deux commandes Rust (`packs_installes`, `lire_pack`) qui lisent le dossier `packs/` dans les données de l'application, sans donner au WebView un accès libre au disque. Les images et voix passent par le protocole d'actifs de Tauri (URL, pas de copie en mémoire).

## 6. Distribution et protection

- **Recommandé** : chaque région est un **contenu additionnel de la boutique** (Steam ou itch.io) livré par ses mises à jour dans le dossier de l'application. Pas de serveur à écrire ni à payer au départ, et le paiement est géré par la boutique.
- **Droit d'accès** : au départ, la présence du pack installé vaut droit d'accès (la boutique ne le télécharge que pour l'acheteur). Si l'on sort de la boutique plus tard : fichier de licence signé.
- **Limite assumée** : un contrôle côté client reste contournable ; on le dit et on ne s'en occupe pas davantage. Les packs n'embarquent jamais `BIBLE`, canon des personnages ni guides de zone (ils contiennent les secrets).

## 7. Ordre de travail

1. Schéma du manifeste et de l'index (`packages/regles`), avec tests.
2. `assemblerPack`, `fusionnerPack`, `decharger`, avec tests (dont « un pack déchargé ne laisse aucune entité »).
3. Validation isolée dans l'outil `monde`.
4. `SourceDePacks` (Vite) et gestionnaire de packs.
5. Commandes Tauri et lecture du dossier `packs/`.
6. Carte : sous-régions verrouillées.
7. Outil `pnpm monde empaqueter` (manifeste, empreintes, archive).
8. Mesure réelle de la mémoire sur un pack de la taille cible.

## 8. Décisions à prendre

1. **Distribution** : boutique (Steam ou itch.io) plutôt que serveur maison ? *(recommandé : boutique)*
2. **Pack d'entrée** : la région 1 est-elle offerte ou payante ?
3. **Nombre de packs actifs** : région en cours + 2 voisines (à ajuster après mesure) ?
