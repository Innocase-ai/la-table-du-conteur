---
name: auditer-coherence-monde
description: Déclenche systématiquement un sous-agent d'audit croisé pour vérifier la cohérence narrative, géographique, routière et technique (identifiants SRD des Boss, coordonnées {x, y}, symétrie des routes inter-régionales et présence des 5 POI) à chaque fois qu'un fichier de monde est écrit ou modifié.
---

# Auditer la Cohérence d'un Monde (Vérification Croisée par Sous-Agent)

Ce skill codifie la règle d'or d'assurance qualité des mondes CRPG : **aucune description de région, de sous-région, de carte ou de fichier `monde.json` n'est considérée comme terminée tant qu'un sous-agent auditeur indépendant ne l'a pas vérifiée par rapport au reste du monde.**

---

## 1. Quand déclencher ce Skill ?

Vous **DEVEZ** invoquer le sous-agent `auditeur-coherence-monde` (via `invoke_subagent`) **à chaque fois** que vous terminez :
1. La rédaction ou la mise à jour d'une **Bible de Monde** (`BIBLE.md`) ;
2. La rédaction ou la mise à jour d'une ou plusieurs **fiches d'Atlas Visuel & Topographique** (`atlas-visuel/00-*.md` à `08-*.md`) ;
3. La création ou la modification du fichier technique **`monde.json`** ;
4. Le détail des **scènes, quêtes ou rencontres** d'une sous-région.

---

## 2. Procédure d'Exécution

### Étape 1 : Invocation du Sous-Agent Auditeur
Appelez `invoke_subagent` avec :
- `TypeName`: `"auditeur-coherence-monde"` (ou `"research"` si le type personnalisé n'est pas encore défini dans la session)
- `Role`: `"Auditeur de Cohérence du Monde"`
- `Prompt`: Demandez-lui de contrôler les fichiers nouvellement écrits par rapport à `BIBLE.md`, `monde.json`, aux régions adjacentes et au dossier `packages/donnees/srd/monstres/`.

### Étape 2 : Les 6 Contrôles Croisés Exigés du Sous-Agent
Le sous-agent vérifie sans complaisance :
1. **Bible ↔ Atlas** : Les noms des 8 régions et 64 sous-régions, les paliers de niveaux et le lore sont-ils 100 % identiques ?
2. **Validité des Boss SRD (`packages/donnees/srd/monstres/*.json`)** : Tous les slugs de monstres (`id`) utilisés pour les Boss de Région et Sous-Boss existent-ils *réellement* dans le dossier SRD ? (Ex: détecter si un fichier utilise un pluriel ou une variante d'orthographe absente du dossier SRD).
3. **Graphe Mermaid ↔ Texte des Sous-Régions** : Les routes, verrous (`🔒`) et temps de trajet en heures (`Xh`) du diagramme Mermaid sont-ils strictement identiques à ceux listés dans chaque sous-région ?
4. **Réciprocité Inter-Régionale** : Si la Région A indique une route vers la Région B (ex: *Col du Titan Fendu, 8h*), la Région B indique-t-elle bien la même route et la même durée vers la Région A ?
5. **Coordonnées `{ x, y }` & Frontières** : Les positions sont-elles géographiquement cohérentes et synchronisées avec `monde.json` ?
6. **Complétude des 5 POI** : Chaque sous-région possède-t-elle bien ses 5 POI typés (🏘️, 🏰, 🕳️, ⛩️, 🗿) et son Boss ?

### Étape 3 : Correction Immédiate des Écarts
Dès que le sous-agent renvoie son rapport d'audit :
- Si des anomalies (même mineures : un slug de monstre SRD légèrement différent, une durée de route de `8h` d'un côté et `9h` de l'autre, un nom de sous-région divergent de `monde.json`) sont signalées, **corrigez-les immédiatement** dans les fichiers concernés avant de présenter le résultat final à l'utilisateur.

---

## 4. Mode histoire (Claude Code) : fiches de lieux, pitch, contenu

Pour tout ce qui est écrit **dans** une histoire (pitch `PITCH-*.md`, fiches `lieux/SR-*.md`, PNJ, rencontres, scènes), le sous-agent à lancer est **`auditeur-coherence-histoire`** (`.claude/agents/auditeur-coherence-histoire.md`, modèle Haiku, lecture seule). Il compare le texte à la sous-région, à la région et au monde (Bible, fil rouge validé, atlas, `monde.json`, profils du SRD) et rend un verdict et un tableau d'anomalies.

- **Avec l'outil `Agent`** : `subagent_type: "auditeur-coherence-histoire"` (disponible au démarrage d'une session) ; sinon `general-purpose` avec `model: "haiku"` en lui donnant à lire la fiche de mission, la liste des fichiers à auditer et celle des sources.
- **Quand** : avant chaque page présentée à l'utilisateur (points V1 à V8), puis après chaque correction.
- **Ce qui est gelé ne se corrige pas en silence** : un écart avec une fiche validée est signalé à l'utilisateur, avec la correction proposée.
- **Claude arbitre** : l'auditeur propose, Claude vérifie lui-même chaque anomalie avant de corriger (un auditeur Haiku peut se tromper).
