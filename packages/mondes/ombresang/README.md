# Package du Monde : L'Échiquier d'Ombresang

> **Identifiant officiel** : `ombresang`  
> **Type** : Grand Monde Modulaire (Échelle Continentale)  
> **Système** : D&D 5e (SRD 5.2.1)  
> **Structure** : 1 Capitale (4 Districts) + 8 Grandes Régions + 64 Sous-Régions (68 Modules au total)

---

## 1. Contenu du Dossier du Monde / Histoire

| Fichier / Dossier | Rôle |
| :--- | :--- |
| [`BIBLE.md`](./BIBLE.md) | **La Grande Bible du Monde** : cosmologie, Nuit des Sept Lances, cycle de l'Ichor divin, intrigue globale (*Le Réveil des Carcasses*), 4 factions mondiales, 4 PNJ globaux, détail des 4 districts de la capitale et des 64 sous-régions réparties dans les 8 provinces (avec lieux, conflits et monstres SRD). |
| [`monde.json`](./monde.json) | Manifeste racine du monde (nom, accroche, niveaux 1 à 20, direction artistique, palette de couleurs, mots-clés et interdits). |
| [`FIL-ROUGE.md`](./FIL-ROUGE.md) | **Le fil rouge de la campagne** (proposition à valider) : trois actes, un chapitre par région, ce que le groupe apprend du plan du Concile à chaque étape, trois obligations pour chaque module de lieu. |
| [`atlas-visuel/`](./atlas-visuel) | Dossier des 9 fichiers de description détaillée de la capitale et des 8 régions provinciales avec leurs sous-régions, routes et POIs typés. |
| [`PITCH-LAME-ROUSSE.md`](./PITCH-LAME-ROUSSE.md) | Pitch du module d'introduction (niveau 1). |
| [`cartes/`](./cartes) | **Dossier officiel des 10 cartes harmonisées en Style 1 (Parchemin & Encre D&D / Mike Schley)** :<br>• `carte-monde-ombresang` (Carte Maîtresse Continentale corrigée avec fleuve, port et Crâne d'Ivoire)<br>• `carte-capitale-sepulcre-d-or` (Plan urbain détaillé de Sépulcre-d'Or et ses 4 districts)<br>• `carte-region-01` à `08` (Les 8 cartes régionales haute définition). |
| [`images/`](./images) | Variantes de la carte du monde (atlas continental et légendé, isométrique, overworld, ancienne disposition) ; les cartes officielles vivent uniquement dans `cartes/`. |
| [`images.json`](./images.json) | Registre des prompts et descriptions officielles de chaque carte. |

---

## 2. Synthèse Géographique des 8 Provinces

```
                     [Nord]
               LA CICATRICE BLÊME
             (Glaciers & Cratère Cosmique)
                     /       \
[Nord-Ouest]        /         \        [Nord-Est]
CRÊTES DE FER-TITAN (⭐ Départ)        ARCHIPELS D'AÉTHERIA
(Monts de Guerre & Lame-Rousse)        (Îles Célestes Flottantes)
       \                               /
        \       [CENTRE IMPÉRIAL]     /
TERRES DU PÉCHÉ D'OR === SÉPULCRE-D'OR === SYLVE DE CHAIR-VERTE
(Plaines de Blé Doré)    (Le Cœur Divin)    (Jungle Fongique)
        /                               \
       /                                 \
[Sud-Ouest]                             [Sud-Est]
MER DE VIF-ARGENT                       CALDEIRA D'IGNIS-VORA
(Côtes & Mercure Liquide)               (Basalte & Rivières de Lave)
                    \         /
                     \       /
                      [Sud]
               PLATEAUX D'OS-BLANC
            (Nécropole & Canyons Blancs)
```

---

## 3. Prêt pour l'Aventure & l'Atelier
Ce dossier est configuré pour être exploité directement par :
1. **L'atelier de scénarisation** : conception des scènes, dialogues, quêtes et rencontres jouables.
2. **Le moteur de règles D&D 5.2.1** (`packages/regles`) pour les combats et les jets de dés.
3. **Le moteur d'histoire et de voyage** pour la navigation entre sous-régions.
