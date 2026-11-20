// Le gabarit de quête (F3 du 20/11/2026, docs/PRD-SAGA.md, docs/MONDES.md « Gabarit de quête ») : une FICHE courte (un but, un donneur, une cible, des
// verbes de résolution, un butin annoncé) qui PRODUIT le JSON d'une quête et les sujets de PNJ qui la font vivre.
//
// C'est un GÉNÉRATEUR DE DONNÉES, pas un type vérifié à l'exécution : le moteur ne connaît pas les fiches, il ne lit que le JSON produit, que l'auteur
// retouche à la main comme n'importe quelle quête (P1, P2). Un auteur qui préfère écrire les étapes lui-même ne perd rien. La fiche n'existe que
// pour deux choses : écrire plus vite une quête régulière, et dire tout de suite ce que le monde ne permet pas (un verbe qu'aucun contenant ne
// porte, une négociation contre un adversaire muet).
//
// Les règles du 16/11/2026 sont dans le gabarit : le joueur CHERCHE (aucun `lieu` d'étape sauf si la fiche en demande un par `reperes`) ; le `lieu` de la
// quête est celui où elle est CONFIÉE (celui du donneur) ; chaque quête a un retour au donneur et une `annonce` de récompense.
import { z } from 'zod';
import type { Donnees } from '../donnees';
import { alternativesDeParole, parolesDeRencontre } from './parole';
import { Condition, EffetMonde, Id, Quete, Sujet, type DonneesMonde } from './schemas';

export const BUTS = ['tuer', 'trouver', 'apporter', 'liberer'] as const;
export const VERBES = ['combat', 'negocier', 'fouille', 'crochetage', 'desamorcage', 'enigme', 'discussion'] as const;
export type But = (typeof BUTS)[number];
export type Verbe = (typeof VERBES)[number];

const Texte = z.string().min(1);

export const FicheQuete = z
  .object({
    id: Id,
    nom: Texte,
    type: z.enum(['principale', 'secondaire']).default('secondaire'),
    /** Ce que le groupe doit faire : tuer (un combat), trouver (un objet), apporter (un objet à un PNJ), libérer (un captif). */
    but: z.enum(BUTS),
    /** Le PNJ qui confie la quête et à qui on la rend. */
    donneur: Id,
    /** Le lieu où la quête est confiée ; par défaut celui du donneur (jamais celui de l'objectif). */
    lieu: Id.optional(),
    niveau: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }),
    /** Le texte du journal de quête, côté joueur. */
    resume: Texte,
    cible: z
      .object({
        /** tuer, libérer : la rencontre de combat à régler (victoire ou alternative). */
        rencontre: Id.optional(),
        /** trouver, apporter : l'objet de quête (un objet du monde). */
        objet: Id.optional(),
        /** apporter : le PNJ qui reçoit l'objet. */
        destinataire: Id.optional(),
        /** libérer : le captif. */
        pnj: Id.optional(),
        /** apporter : le donneur remet lui-même l'objet à l'offre (le groupe n'a pas à le trouver). */
        fourni: z.boolean().default(false),
        /** Comment le journal nomme la cible (« la bande du pont ») ; par défaut le nom de la rencontre, de l'objet ou du PNJ. */
        nom: Texte.optional(),
      })
      .default({ fourni: false }),
    /** Comment le groupe peut venir à bout de l'objectif : un ou deux verbes (la fiche vérifie que le monde les permet). */
    resolution: z.array(z.enum(VERBES)).min(1).max(3),
    butin: z.object({
      xp: z.number().int().min(0).default(0),
      pieces: z.number().int().min(0).default(0),
      objets: z.array(Id).default([]),
      effets: z.array(EffetMonde).default([]),
      /** Ce que le donneur promet, en clair (obligatoire : « 75 po et une lettre d'Elara »). */
      annonce: Texte,
    }),
    /** Les mots qui ouvrent le sujet d'offre du donneur (par défaut, ceux du nom de la quête). */
    mots: z.array(Texte).min(1).optional(),
    /** Les textes que l'auteur a déjà écrits ; ce qui manque est produit sous la forme « À écrire : … » (signalé par `pnpm monde manque`). */
    textes: z
      .object({
        question: Texte.optional(),
        offre: Texte.optional(),
        vaincre: Texte.optional(),
        trouver: Texte.optional(),
        obtenir: Texte.optional(),
        livrer: Texte.optional(),
        liberer: Texte.optional(),
        retour: Texte.optional(),
        rendu: Texte.optional(),
        livraison: Texte.optional(),
        liberation: Texte.optional(),
      })
      .default({}),
    /** Un `lieu` d'étape posé exprès (« ◆ » sur la carte et les sorties : le joueur n'a plus à chercher). Clé : le rôle de l'étape. Absent : aucun. */
    reperes: z.record(z.enum(['vaincre', 'trouver', 'obtenir', 'livrer', 'liberer', 'retour']), Id).default({}),
    prerequis: Condition.optional(),
    echec: z.object({ texte: Texte.optional(), effets: z.array(EffetMonde).default([]) }).optional(),
    /** Pour le MJ : ce qui s'ajoute à « Résolution prévue : … » dans `ramifications`. */
    ramifications: z.string().optional(),
  })
  .strict();
export type FicheQuete = z.infer<typeof FicheQuete>;

export interface QueteGeneree {
  /** Le JSON de la quête, à écrire dans `quetes/` ; absent si la fiche est inutilisable (voir `erreurs`). */
  quete?: z.input<typeof Quete>;
  /** Les sujets à ajouter aux PNJ (l'offre et le rendu du donneur, la livraison du destinataire, la libération du captif). */
  sujets: { pnj: string; sujet: z.input<typeof Sujet> }[];
  /** Les drapeaux que la quête pose ou attend. */
  drapeaux: string[];
  /** Les textes produits sous la forme « À écrire : … ». */
  textesAEcrire: string[];
  /** Ce qui empêche de produire la quête (référence inconnue, champ manquant pour ce but). */
  erreurs: string[];
  /** Ce que le monde ne permet pas, ou permet mal (jamais bloquant). */
  avis: string[];
}

const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lit une fiche (ou une liste de fiches) en JSON ; les erreurs sont des phrases lisibles. */
export function lireFiches(json: unknown): { fiches: FicheQuete[]; erreurs: string[] } {
  const liste = Array.isArray(json) ? json : [json];
  const fiches: FicheQuete[] = [];
  const erreurs: string[] = [];
  liste.forEach((brut, i) => {
    const r = FicheQuete.safeParse(brut);
    if (r.success) fiches.push(r.data);
    else {
      const nom = typeof (brut as { id?: unknown } | null)?.id === 'string' ? (brut as { id: string }).id : `n° ${i + 1}`;
      for (const p of r.error.issues) erreurs.push(`Fiche « ${nom} » : ${p.path.join('.') || '(racine)'} — ${p.message}`);
    }
  });
  return { fiches, erreurs };
}

/**
 * Produit la quête d'une fiche. Sans monde (`dm`), seule la structure est produite et vérifiée ; avec lui (et le SRD), le générateur lit le lieu du
 * donneur, les noms, et dit ce que le monde ne permet pas.
 */
export function genererQuete(fiche: FicheQuete, dm?: DonneesMonde, srd?: Donnees): QueteGeneree {
  const sortie: QueteGeneree = { sujets: [], drapeaux: [], textesAEcrire: [], erreurs: [], avis: [] };
  const { cible, but } = fiche;
  const slug = fiche.id.replace(/^q-/, '');
  const drapeau = (suffixe: string) => `${slug}-${suffixe}`;
  const rendue = drapeau('rendue');
  const livree = drapeau('livree');
  const liberee = drapeau('liberee');

  // --- Ce qu'il faut pour ce but -----------------------------------------------------------------------------------------------------
  const exige = (ok: boolean, champ: string) => {
    if (!ok) sortie.erreurs.push(`Fiche « ${fiche.id} » : un but « ${but} » demande \`cible.${champ}\`.`);
  };
  if (but === 'tuer') exige(!!cible.rencontre, 'rencontre');
  if (but === 'trouver') exige(!!cible.objet, 'objet');
  if (but === 'apporter') {
    exige(!!cible.objet, 'objet');
    exige(!!cible.destinataire, 'destinataire');
  }
  if (but === 'liberer') exige(!!cible.pnj, 'pnj');

  // --- Ce que le monde sait (facultatif) -----------------------------------------------------------------------------------------------
  const donneur = dm?.pnj.get(fiche.donneur);
  const rencontre = cible.rencontre ? dm?.rencontres.get(cible.rencontre) : undefined;
  const nomDe = (id: string | undefined, genre: 'pnj' | 'objets' | 'rencontres'): string | undefined => {
    if (!id || !dm) return undefined;
    return genre === 'pnj' ? dm.pnj.get(id)?.nom : genre === 'objets' ? dm.objets.get(id)?.nom : dm.rencontres.get(id)?.nom;
  };
  if (dm) {
    if (!donneur) sortie.erreurs.push(`Fiche « ${fiche.id} » : le donneur « ${fiche.donneur} » n'existe pas dans le monde « ${dm.monde.id} ».`);
    if (dm.quetes.has(fiche.id)) sortie.erreurs.push(`Fiche « ${fiche.id} » : une quête « ${fiche.id} » existe déjà dans le monde « ${dm.monde.id} » (elle ne serait pas remplacée).`);
    if (cible.rencontre && !rencontre) sortie.erreurs.push(`Fiche « ${fiche.id} » : la rencontre « ${cible.rencontre} » n'existe pas.`);
    if (cible.objet && !dm.objets.has(cible.objet)) sortie.erreurs.push(`Fiche « ${fiche.id} » : l'objet « ${cible.objet} » n'est pas un objet du monde (un objet de quête se déclare dans objets/).`);
    if (cible.destinataire && !dm.pnj.has(cible.destinataire)) sortie.erreurs.push(`Fiche « ${fiche.id} » : le destinataire « ${cible.destinataire} » n'existe pas.`);
    if (cible.pnj && !dm.pnj.has(cible.pnj)) sortie.erreurs.push(`Fiche « ${fiche.id} » : le captif « ${cible.pnj} » n'existe pas.`);
    for (const [role, l] of Object.entries(fiche.reperes)) if (!dm.lieux.has(l)) sortie.erreurs.push(`Fiche « ${fiche.id} » : le repère « ${role} » vise un lieu inconnu « ${l} ».`);
  }
  if (sortie.erreurs.length) return sortie;

  // Le lieu de la quête : celui où elle est confiée (le donneur), jamais celui de l'objectif.
  const lieu = fiche.lieu ?? donneur?.lieu;
  if (dm && donneur && fiche.lieu) {
    const lieuxDuDonneur = [donneur.lieu, ...donneur.presences.map((x) => x.lieu)];
    if (!lieuxDuDonneur.includes(fiche.lieu)) sortie.avis.push(`Fiche « ${fiche.id} » : le lieu « ${fiche.lieu} » n'est pas celui du donneur (${lieuxDuDonneur.join(', ')}) : une quête se confie où se trouve son donneur.`);
  }

  // --- Les textes : ce que l'auteur a écrit, le reste est « À écrire » -----------------------------------------------------------------------
  const aEcrire = (cle: string, consigne: string): string => {
    sortie.textesAEcrire.push(cle);
    return `À écrire : ${consigne}`;
  };
  const t = fiche.textes;
  const donneurNom = donneur?.nom ?? fiche.donneur;
  const objetNom = cible.nom ?? nomDe(cible.objet, 'objets') ?? cible.objet ?? 'l’objet';
  const rencontreNom = cible.nom ?? nomDe(cible.rencontre, 'rencontres') ?? cible.rencontre ?? 'l’adversaire';
  const captifNom = cible.nom ?? nomDe(cible.pnj, 'pnj') ?? cible.pnj ?? 'le captif';
  const destNom = nomDe(cible.destinataire, 'pnj') ?? cible.destinataire ?? 'le destinataire';

  // --- Les étapes --------------------------------------------------------------------------------------------------------------------
  type Etape = NonNullable<z.input<typeof Quete>['etapes']>[number];
  const etapes: Etape[] = [];
  const etape = (id: keyof typeof fiche.reperes, texte: string, completion: z.input<typeof Condition>, suivante: string | undefined, extra: Partial<Etape> = {}) => {
    const repere = fiche.reperes[id];
    etapes.push({ id, texte, completion, suivantes: suivante ? [suivante] : [], ...(repere ? { lieu: repere } : {}), ...extra } as Etape);
  };
  if (but === 'tuer') {
    etape('vaincre', t.vaincre ?? aEcrire('etape vaincre', `ce que le groupe doit faire contre ${rencontreNom}`), { rencontre: { id: cible.rencontre! } }, 'retour');
  } else if (but === 'trouver') {
    etape('trouver', t.trouver ?? aEcrire('etape trouver', `ce que le groupe doit retrouver (${objetNom})`), { objet: cible.objet! }, 'retour');
  } else if (but === 'apporter') {
    if (!cible.fourni) etape('obtenir', t.obtenir ?? aEcrire('etape obtenir', `ce que le groupe doit se procurer (${objetNom})`), { objet: cible.objet! }, 'livrer');
    etape('livrer', t.livrer ?? aEcrire('etape livrer', `à qui porter ${objetNom} (${destNom})`), { flag: livree }, 'retour');
  } else {
    if (cible.rencontre) etape('vaincre', t.vaincre ?? aEcrire('etape vaincre', `ce qui garde ${captifNom} (${rencontreNom})`), { rencontre: { id: cible.rencontre } }, 'liberer');
    etape('liberer', t.liberer ?? aEcrire('etape liberer', `libérer ${captifNom}`), { flag: liberee }, 'retour');
  }
  etape('retour', t.retour ?? aEcrire('etape retour', `l'étape du journal qui renvoie le groupe voir ${donneurNom} (nommez-le : « Retournez voir ${donneurNom}… »)`), { flag: rendue }, undefined, { termine: true });

  const debut = etapes[0]!.id;

  // --- La quête ----------------------------------------------------------------------------------------------------------------------
  const resolution = `Résolution prévue : ${fiche.resolution.join(', ')}.${fiche.ramifications ? ` ${fiche.ramifications}` : ''}`;
  sortie.quete = {
    id: fiche.id,
    nom: fiche.nom,
    type: fiche.type,
    donneur: fiche.donneur,
    ...(lieu ? { lieu } : {}),
    resume: fiche.resume,
    niveau: fiche.niveau,
    ...(fiche.prerequis ? { prerequis: fiche.prerequis } : {}),
    debut,
    etapes,
    recompenses: { xp: fiche.butin.xp, pieces: fiche.butin.pieces, objets: fiche.butin.objets, effets: fiche.butin.effets, annonce: fiche.butin.annonce },
    ...(fiche.echec ? { echec: fiche.echec } : {}),
    ramifications: resolution,
  };

  // --- Les sujets que la quête demande aux PNJ ---------------------------------------------------------------------------------------
  const motsParDefaut = [...new Set(sansAccents(fiche.nom).split(/[^a-z0-9]+/).filter((m) => m.length > 3))].slice(0, 3);
  const donne = but === 'apporter' && cible.fourni ? [{ objet: { id: cible.objet! } }] : [];
  sortie.sujets.push({
    pnj: fiche.donneur,
    sujet: {
      id: `${slug}-offre`,
      mots: fiche.mots ?? (motsParDefaut.length ? motsParDefaut : ['travail']),
      ...(t.question ? { question: t.question } : {}),
      reponse: t.offre ?? aEcrire('sujet offre', `${donneurNom} confie « ${fiche.nom} » : ce qu'il demande, pourquoi, ce qu'il promet (${fiche.butin.annonce})`),
      effets: [{ quete: { id: fiche.id, statut: 'proposee' } }, ...donne],
      unique: true,
    },
  });
  sortie.sujets.push({
    pnj: fiche.donneur,
    sujet: {
      id: `${slug}-rendu`,
      mots: fiche.mots ?? (motsParDefaut.length ? motsParDefaut : ['travail']),
      condition: { et: [{ etape: { quete: fiche.id, etape: 'retour' } }, { non: { flag: rendue } }] },
      question: 'Nous avons terminé.',
      reponse: t.rendu ?? aEcrire('sujet rendu', `${donneurNom} reçoit le rapport et tient sa promesse (${fiche.butin.annonce})`),
      effets: [{ flag: rendue }],
      unique: true,
    },
  });
  sortie.drapeaux.push(rendue);
  if (but === 'apporter') {
    sortie.sujets.push({
      pnj: cible.destinataire!,
      sujet: {
        id: `${slug}-livraison`,
        mots: fiche.mots ?? (motsParDefaut.length ? motsParDefaut : ['livraison']),
        condition: { etape: { quete: fiche.id, etape: 'livrer' } },
        question: `Remettre ${objetNom}.`,
        reponse: t.livraison ?? aEcrire('sujet livraison', `${destNom} reçoit ${objetNom}`),
        effets: [{ flag: livree }, { objet: { id: cible.objet!, retirer: true } }],
        unique: true,
      },
    });
    sortie.drapeaux.push(livree);
  }
  if (but === 'liberer') {
    sortie.sujets.push({
      pnj: cible.pnj!,
      sujet: {
        id: `${slug}-liberation`,
        mots: fiche.mots ?? (motsParDefaut.length ? motsParDefaut : ['liberer']),
        condition: { etape: { quete: fiche.id, etape: 'liberer' } },
        question: 'Vous êtes libre.',
        reponse: t.liberation ?? aEcrire('sujet liberation', `${captifNom} est libéré et remercie le groupe`),
        effets: [{ flag: liberee }],
        unique: true,
      },
    });
    sortie.drapeaux.push(liberee);
  }

  // La quête produite doit être une quête valide du monde : la validation de schéma le garantit avant d'en parler à l'auteur.
  const valide = Quete.safeParse(sortie.quete);
  if (!valide.success) {
    sortie.erreurs.push(...valide.error.issues.map((p) => `Fiche « ${fiche.id} » : la quête produite est invalide (${p.path.join('.')} — ${p.message}).`));
    delete sortie.quete;
    return sortie;
  }
  for (const s of sortie.sujets) {
    const v = Sujet.safeParse(s.sujet);
    if (!v.success) sortie.erreurs.push(...v.error.issues.map((p) => `Fiche « ${fiche.id} » : le sujet « ${s.sujet.id} » de « ${s.pnj} » est invalide (${p.path.join('.')} — ${p.message}).`));
  }
  if (sortie.textesAEcrire.length) sortie.avis.push(`Fiche « ${fiche.id} » : ${sortie.textesAEcrire.length} texte(s) à écrire (« À écrire : … ») : ${sortie.textesAEcrire.join(', ')}.`);

  if (dm && srd) sortie.avis.push(...avisDeLaFiche(fiche, dm, srd));
  return sortie;
}

/** Ce que le monde ne permet pas de ce que la fiche annonce : les verbes de résolution, l'adversaire qui parle ou non. */
function avisDeLaFiche(fiche: FicheQuete, dm: DonneesMonde, srd: Donnees): string[] {
  const avis: string[] = [];
  const { cible, but, resolution } = fiche;
  const dit = (m: string) => avis.push(`Fiche « ${fiche.id} » : ${m}`);
  const rencontre = cible.rencontre ? dm.rencontres.get(cible.rencontre) : undefined;
  const parRencontre = but === 'tuer' || (but === 'liberer' && !!cible.rencontre);

  if (rencontre) {
    if (rencontre.type !== 'combat' && rencontre.type !== 'mixte') dit(`la rencontre « ${rencontre.id} » est de type « ${rencontre.type} » : un but « ${but} » attend un combat.`);
    const p = parolesDeRencontre(srd, rencontre);
    const parole = alternativesDeParole(rencontre);
    const issues = alternativesDeParole(rencontre, true);
    if (p.parle && !issues.length) dit(`les adversaires de « ${rencontre.id} » parlent (${[...new Set(p.adversaires.filter((a) => a.parole === 'parle').map((a) => a.profil))].join(', ')}) et la rencontre n'a aucune alternative de parole : PRD-SAGA décision 4, une porte de sortie (négocier, payer, ruser) quand l'adversaire parle.`);
    if (resolution.includes('negocier')) {
      if (p.muette) dit(`« négocier » est annoncé, mais les adversaires de « ${rencontre.id} » ne parlent pas (langues « aucune ») : ruser, fuir ou apaiser conviendraient mieux.`);
      else if (!issues.length) dit(`« négocier » est annoncé, mais « ${rencontre.id} » n'a aucune alternative de négociation (jet de Persuasion ou de Tromperie, ou un marché : payer, offrir) : ajoutez-la.`);
    } else if ((parole.length || issues.length) && p.parle) {
      dit(`« ${rencontre.id} » offre une négociation que la fiche ne mentionne pas : ajoutez « negocier » à \`resolution\`.`);
    }
    if (resolution.includes('combat') && !rencontre.monstres.length) dit(`« combat » est annoncé, mais « ${rencontre.id} » n'a aucun monstre.`);
    if (!resolution.includes('combat') && but === 'tuer') dit(`un but « tuer » sans le verbe « combat » : la rencontre « ${rencontre.id} » se réglera par une alternative seulement.`);
  }
  if (parRencontre && !rencontre && cible.rencontre === undefined) dit('un but de combat sans rencontre.');

  if (cible.objet) {
    const contenants = [...dm.tresors.values()].filter((x) => x.contenu.objets.some((o) => o.objet === cible.objet));
    const donneObjet = [...dm.pnj.values()].some((p) => p.sujets.some((s) => s.effets.some((e) => 'objet' in e && !e.objet.retirer && e.objet.id === cible.objet)));
    const veut = (v: Verbe) => resolution.includes(v);
    if (cible.fourni) {
      if (resolution.some((v) => v !== 'discussion')) dit(`l'objet « ${cible.objet} » est remis par le donneur (\`fourni\`) : seul le verbe « discussion » a un sens pour l'obtenir.`);
    } else {
      if (!contenants.length && !donneObjet && !dm.enigmes.size) dit(`l'objet « ${cible.objet} » ne se trouve nulle part : aucun trésor ne le contient, aucun PNJ ne le donne.`);
      else if (!contenants.length && !donneObjet) dit(`aucun trésor ne contient « ${cible.objet} » et aucun sujet de PNJ ne le donne (seule une énigme pourrait) : vérifiez.`);
      if (veut('fouille') && !contenants.some((c) => c.acces.cache)) dit(`« fouille » est annoncé, mais aucun contenant de « ${cible.objet} » n'est caché (\`acces.cache\`).`);
      if (veut('crochetage') && !contenants.some((c) => c.acces.verrou)) dit(`« crochetage » est annoncé, mais aucun contenant de « ${cible.objet} » n'est verrouillé (\`acces.verrou\`).`);
      if (veut('desamorcage') && !contenants.some((c) => c.acces.piege)) dit(`« desamorcage » est annoncé, mais aucun contenant de « ${cible.objet} » n'est piégé (\`acces.piege\`).`);
      if (veut('enigme') && !([...dm.enigmes.values()].some((e) => contenants.some((c) => e.recompense.tresor === c.id) || JSON.stringify(e.recompense.effets).includes(`"${cible.objet}"`)))) dit(`« enigme » est annoncé, mais aucune énigme ne donne « ${cible.objet} » (ni son contenant).`);
      if (veut('discussion') && !donneObjet) dit(`« discussion » est annoncé, mais aucun sujet de PNJ ne donne « ${cible.objet} ».`);
    }
  } else {
    const sansObjet = resolution.filter((v) => ['fouille', 'crochetage', 'desamorcage', 'enigme'].includes(v));
    if (sansObjet.length && but !== 'liberer') dit(`les verbes « ${sansObjet.join(', ')} » demandent un objet à trouver (\`cible.objet\`).`);
  }
  return avis;
}
