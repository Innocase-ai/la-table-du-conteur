// Contenu de la démo : ce que le moteur de jeu fournirait (rencontres composées, événements à choix des points d'intérêt).
// Ici, tout est simulé en texte : la démo montre le moteur de terres, pas le combat.
export interface TexteRencontre {
  titre: string;
  texte: string;
  /** Composition par taille de groupe, pour les combats (le moteur de jeu appellerait composerRencontre). */
  composition?: Record<4 | 6, string>;
}

export const RENCONTRES: Record<string, TexteRencontre> = {
  loups: { titre: 'Meute de loups affamés', texte: 'Des yeux jaunes entre les troncs : la meute vous suit depuis un moment.', composition: { 4: '3 loups et 1 loup sanguinaire', 6: '5 loups et 1 loup sanguinaire' } },
  bandits: { titre: 'Bandits de grand chemin', texte: 'Une charrette barre la piste. Les hommes qui la gardent ne cherchent pas à vendre quoi que ce soit.', composition: { 4: '3 bandits et 1 éclaireur', 6: '5 bandits et leur chef' } },
  'rodeurs-nuit': { titre: 'Rôdeurs de la nuit', texte: 'Quelque chose marche dans le noir, à votre allure, sans jamais se rapprocher.', composition: { 4: '3 squelettes et 1 goule', 6: '5 squelettes et 1 goule' } },
  gobelins: { titre: 'Gobelins en embuscade', texte: 'Des cailloux dévalent le talus. On vous tire dessus.', composition: { 4: '4 gobelins et 1 archer', 6: '6 gobelins et 2 archers' } },
  colporteur: { titre: 'Colporteur pressé', texte: 'Un marchand ambulant ralentit à votre hauteur et propose une rumeur contre une pièce.' },
  'voyageur-egare': { titre: 'Voyageur égaré', texte: 'Un homme tourne en rond depuis le matin. Il connaît peut-être un raccourci, s’il retrouve son chemin.' },
  'chariot-embourbe': { titre: 'Chariot embourbé', texte: 'Un chariot enfoncé jusqu’aux essieux barre le passage. Son conducteur promet de payer.' },
  eboulis: { titre: 'Éboulis instable', texte: 'Le sentier glisse sous vos bottes. Passer vite, ou contourner.' },
};

export interface TextePoi {
  texte: string;
  choix: { libelle: string; resultat: string }[];
}

export const POI: Record<string, TextePoi> = {
  puits: { texte: 'Un puits à demi comblé de pierres. Au fond, quelque chose brille.', choix: [{ libelle: 'Descendre un seau', resultat: 'Vous remontez une bague rouillée et trois pièces. L’eau est saumâtre.' }, { libelle: 'Passer', resultat: 'Vous laissez le puits à ses secrets.' }] },
  cairn: { texte: 'Un cairn ancien. Entre deux pierres, un coin de cuir dépasse.', choix: [{ libelle: 'Écarter les pierres', resultat: 'Un petit coffret, vide, mais gravé d’un symbole que vous ne connaissez pas.' }, { libelle: 'Laisser les morts en paix', resultat: 'Vous posez une pierre de plus sur le tas et repartez.' }] },
  cabane: { texte: 'Une cabane de berger, la porte entrouverte. Une odeur de feu froid.', choix: [{ libelle: 'Entrer', resultat: 'Un lit de paille, des provisions pour deux jours. Quelqu’un revient ici souvent.' }, { libelle: 'Guetter les alentours', resultat: 'Des traces de bottes fraîches mènent vers le nord.' }] },
  ruine: { texte: 'Une ruine envahie de ronces. Un pan de mur tient encore, couvert de signes.', choix: [{ libelle: 'Fouiller les gravats', resultat: 'Sous une dalle : un ancien sceau de marchand.' }, { libelle: 'Relever les signes', resultat: 'Vous recopiez ce que vous pouvez : des noms, une date, et un avertissement.' }] },
  'camp-abandonne': { texte: 'Un camp abandonné à la hâte : une marmite renversée, des couvertures piétinées.', choix: [{ libelle: 'Chercher des indices', resultat: 'Des traces de lutte, et une lettre à demi brûlée.' }, { libelle: 'Récupérer les vivres', resultat: 'Quelques rations encore bonnes. Vous vous sentez observés.' }] },
  'chariot-brise': { texte: 'Un chariot brisé, les chevaux partis. La bâche claque dans le vent.', choix: [{ libelle: 'Fouiller la caisse', resultat: 'Des étoffes pourries, et une bourse oubliée sous le plancher.' }, { libelle: 'Chercher les traces des chevaux', resultat: 'Elles se perdent dans l’herbe, à l’est.' }] },
  'bosquet-sacre': { texte: 'Un bosquet d’arbres aux troncs noués, comme tressés. L’air y est étrangement calme.', choix: [{ libelle: 'Laisser une offrande', resultat: 'Le vent tombe. Vous vous sentez plus léger en repartant.' }, { libelle: 'Cueillir du gui', resultat: 'Une poignée de gui aux baies argentées. Les arbres craquent derrière vous.' }] },
  'tour-de-guet': { texte: 'Une tour de guet délabrée. De son sommet, on doit voir tout le pays.', choix: [{ libelle: 'Monter au sommet', resultat: 'La vue est superbe : vous repérez des routes, une fumée, un campement au loin.' }, { libelle: 'Fouiller la salle du bas', resultat: 'Des flèches rouillées et une carte griffonnée.' }] },
  'pierre-dressee': { texte: 'Une pierre dressée, haute comme trois hommes, couverte de mousse et de signes.', choix: [{ libelle: 'Toucher la pierre', resultat: 'Elle est tiède. Un bourdonnement sourd monte dans vos os.' }, { libelle: 'Faire le tour', resultat: 'Sur la face nord, une inscription presque effacée parle d’un serment.' }] },
  fumee: { texte: 'Vous arrivez à l’origine de la fumée : un foyer de charbonnier, encore chaud.', choix: [{ libelle: 'Attendre son retour', resultat: 'Un charbonnier revient, méfiant, puis vous offre une rumeur contre du pain.' }, { libelle: 'Poursuivre', resultat: 'Vous laissez le foyer fumer derrière vous.' }] },
  'feu-de-camp': { texte: 'Un feu de camp, des voyageurs qui font mine de ne pas vous avoir vus.', choix: [{ libelle: 'Partager le feu', resultat: 'Ils vous racontent la route de nuit, et ce qu’ils y ont croisé.' }, { libelle: 'Passer au large', resultat: 'Vous contournez leur lumière sans un mot.' }] },
};
