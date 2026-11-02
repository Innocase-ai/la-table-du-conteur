// Document lisible d'un monde, généré depuis ses données (la source de vérité reste le JSON).
import type { Donnees, DonneesMonde, Lieu } from '../../packages/regles/src';
import type { BilanMonde } from '../../packages/regles/src';

const TYPES_AFFICHAGE: Record<string, string> = {
  region: 'région', ville: 'ville', village: 'village', hameau: 'hameau', camp: 'camp', route: 'route', grotte: 'grotte', donjon: 'donjon',
  niveau: 'niveau', salle: 'salle', ruine: 'ruine', batiment: 'bâtiment', quartier: 'quartier', 'lieu-dit': 'lieu-dit',
};

function arbre(dm: DonneesMonde, parent: string | undefined, profondeur: number, sortie: string[]): void {
  const enfants = [...dm.lieux.values()].filter((l) => l.parent === parent).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  for (const l of enfants) {
    const pnj = [...dm.pnj.values()].filter((p) => p.lieu === l.id).length;
    const tresors = [...dm.tresors.values()].filter((t) => t.lieu === l.id).length;
    const details = [pnj ? `${pnj} PNJ` : '', tresors ? `${tresors} trésor(s)` : ''].filter(Boolean).join(', ');
    sortie.push(`${'  '.repeat(profondeur)}- **${l.nom}** (${TYPES_AFFICHAGE[l.type]})${details ? ` — ${details}` : ''} — ${l.resume}`);
    arbre(dm, l.id, profondeur + 1, sortie);
  }
}

export function genererDocMonde(dm: DonneesMonde, srd: Donnees, bilan: BilanMonde): string {
  const m = dm.monde;
  const nomLieu = (id: string) => dm.lieux.get(id)?.nom ?? id;
  const nomPnj = (id: string) => dm.pnj.get(id)?.nom ?? id;
  const L: string[] = [];
  L.push(`# ${m.nom}`, '', `> Document généré depuis \`packages/mondes/${m.id}\` (commande \`pnpm monde doc ${m.id}\`). Ne pas modifier à la main : éditer les données.`, '');
  L.push(m.resume, '', `**Accroche.** ${m.accroche}`, '', `**Ton.** ${m.ton.join(', ')}.  **Niveaux.** ${m.niveaux.min} à ${m.niveaux.max}.`, '');
  L.push(`**Départ.** ${nomLieu(m.depart.lieu)} — ${m.depart.intro}`, '');
  L.push('## Direction artistique', '', `${m.direction.style}`, '', `Palette : ${m.direction.palette.join(', ')}.${m.direction.motsCles.length ? ` Mots-clés : ${m.direction.motsCles.join(', ')}.` : ''}${m.direction.interdits.length ? ` À éviter : ${m.direction.interdits.join(', ')}.` : ''}`, '');
  if (m.regles.length) L.push('## Règles du monde pour le MJ', '', ...m.regles.map((r) => `- ${r}`), '');

  L.push('## Chiffres', '');
  const s = bilan.stats;
  L.push(`- Lieux : ${Object.entries(s.lieux).map(([k, v]) => `${v} ${TYPES_AFFICHAGE[k] ?? k}`).join(', ')}`);
  L.push(`- ${s.pnj} PNJ (${s.sujets} sujets de conversation, ${s.pnjAvecBoutique} marchands, ${s.compagnons} compagnons recrutables)`);
  L.push(`- Quêtes : ${Object.entries(s.quetes).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  L.push(`- ${s.rencontres} rencontres, ${s.pieges} pièges, ${s.enigmes} énigmes`);
  L.push(`- ${s.tresors} trésors (valeur totale ≈ ${s.valeurTresorsPo.toLocaleString('fr-FR')} po), ${s.objetsUniques} objets propres au monde`);
  L.push(`- ${s.factions} factions, ${s.faits} faits, ${dm.jauges.size} jauge(s), ${dm.fins.size} fin(s)`, '');
  if (bilan.erreurs.length || bilan.avertissements.length) {
    L.push('## Validation', '', ...bilan.erreurs.map((e) => `- ❌ ${e}`), ...bilan.avertissements.map((a) => `- ⚠️ ${a}`), '');
  }

  L.push('## Chapitres', '');
  for (const c of m.chapitres) {
    L.push(`### ${c.nom} (niveaux ${c.niveaux.min} à ${c.niveaux.max})`, '', c.resume, '', `Lieux : ${c.lieux.map(nomLieu).join(', ')}.`, '');
    if (c.quetes.length) L.push(`Quêtes : ${c.quetes.map((q) => dm.quetes.get(q)?.nom ?? q).join(', ')}.`, '');
  }

  L.push('## Carte des lieux', '');
  const sortie: string[] = [];
  arbre(dm, undefined, 0, sortie);
  L.push(...sortie, '');

  L.push('## Factions', '');
  for (const f of dm.factions.values()) {
    L.push(`### ${f.nom}`, '', f.resume, '', ...f.objectifs.map((o) => `- ${o}`));
    if (f.chef) L.push(`- Chef : ${nomPnj(f.chef)}`);
    for (const r of f.relations) L.push(`- Relation avec ${dm.factions.get(r.faction)?.nom ?? r.faction} : ${r.attitude > 0 ? '+' : ''}${r.attitude}`);
    L.push('');
  }

  if (dm.jauges.size) {
    L.push('## Jauges', '');
    for (const j of dm.jauges.values()) {
      L.push(`### ${j.nom} (${j.min} à ${j.max}, départ ${j.initial})`, '', j.resume, '', ...j.paliers.map((p) => `- À partir de ${p.seuil} — **${p.nom}** : ${p.narration}`), ...j.evolution.map((e) => `- Évolution : ${e.delta > 0 ? '+' : ''}${e.delta} (${e.declencheur})`), '');
    }
  }

  L.push('## Personnages', '', '| PNJ | Espèce, rôle | Lieu | Faction | Attitude | Particularités |', '| --- | --- | --- | --- | --- | --- |');
  for (const p of [...dm.pnj.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))) {
    const part = [p.compagnon ? `compagnon (${p.compagnon.classe} niv. ${p.compagnon.niveau})` : '', p.boutique ? 'marchand' : '', p.services.length ? `${p.services.length} service(s)` : '', p.secrets.length ? `${p.secrets.length} secret(s)` : '', p.profilCombat ? `combat : ${p.profilCombat}` : ''].filter(Boolean).join(', ');
    L.push(`| ${p.nom}${p.titre ? ` (${p.titre})` : ''} | ${p.espece}, ${p.role} | ${nomLieu(p.lieu)} | ${p.faction ? dm.factions.get(p.faction)?.nom ?? p.faction : '—'} | ${p.attitude} | ${part} |`);
  }
  L.push('');

  L.push('## Quêtes', '');
  for (const q of dm.quetes.values()) {
    L.push(`### ${q.nom} — ${q.type}, niveaux ${q.niveau.min} à ${q.niveau.max}`, '', q.resume, '', `${q.donneur ? `Donneur : ${nomPnj(q.donneur)}. ` : ''}Récompenses : ${q.recompenses.xp} PX, ${q.recompenses.pieces} po${q.recompenses.objets.length ? `, ${q.recompenses.objets.map((o) => dm.objets.get(o)?.nom ?? srd.objets.get(o)?.nom ?? srd.armes.get(o)?.nom ?? srd.armures.get(o)?.nom ?? o).join(', ')}` : ''}.`, '');
    for (const e of q.etapes) L.push(`${e.id === q.debut ? '1.' : '-'} \`${e.id}\` — ${e.texte}${e.suivantes.length ? ` → ${e.suivantes.map((x) => `\`${x}\``).join(', ')}` : ' (fin)'}`);
    if (q.ramifications) L.push('', `*Ramifications : ${q.ramifications}*`);
    L.push('');
  }

  if (dm.fins.size) {
    L.push('## Fins', '');
    for (const f of dm.fins.values()) L.push(`### ${f.nom}`, '', f.epilogue, '', ...f.consequences.map((c) => `- ${c}`), '');
  }

  L.push('## Rencontres', '', '| Rencontre | Lieu | Type | Difficulté | Adversaires | PX |', '| --- | --- | --- | --- | --- | --- |');
  for (const r of dm.rencontres.values()) {
    const px = r.monstres.reduce((n, mo) => n + (srd.monstres.get(mo.profil)?.px ?? 0) * mo.nombre, 0);
    L.push(`| ${r.nom} | ${r.lieu ? nomLieu(r.lieu) : '—'} | ${r.type} | ${r.difficulte} | ${r.monstres.map((mo) => `${mo.nombre} × ${srd.monstres.get(mo.profil)?.nom ?? mo.profil}`).join(', ') || '—'} | ${px || '—'} |`);
  }
  L.push('');

  if (dm.enigmes.size || dm.pieges.size) {
    L.push('## Énigmes et pièges', '');
    for (const e of dm.enigmes.values()) L.push(`- **${e.nom}** (énigme, ${nomLieu(e.lieu)}, ${e.solution.type}) — ${e.indices.length} indice(s)`);
    for (const p of dm.pieges.values()) L.push(`- **${p.nom}** (piège, ${nomLieu(p.lieu)}) — détection DD ${p.detection.dd}, désarmement DD ${p.desarmement.dd}`);
    L.push('');
  }

  L.push('## Trésors', '', '| Trésor | Lieu | Contenant | Contenu | Accès |', '| --- | --- | --- | --- | --- |');
  for (const t of dm.tresors.values()) {
    const contenu = [t.contenu.pieces?.po ? `${t.contenu.pieces.po} po` : '', ...t.contenu.objets.map((o) => `${o.quantite > 1 ? `${o.quantite} × ` : ''}${dm.objets.get(o.objet)?.nom ?? srd.objets.get(o.objet)?.nom ?? srd.armes.get(o.objet)?.nom ?? srd.armures.get(o.objet)?.nom ?? o.objet}`), ...t.contenu.tables.map((x) => `table ${x.table}`)].filter(Boolean).join(', ');
    const acces = [t.acces.cache ? `caché DD ${t.acces.cache.dd}` : '', t.acces.verrou ? `verrou DD ${t.acces.verrou.dd}` : '', t.acces.piege ? 'piégé' : '', t.gardien ? 'gardé' : ''].filter(Boolean).join(', ');
    L.push(`| ${t.nom} | ${nomLieu(t.lieu)} | ${t.contenant} | ${contenu || '—'} | ${acces || 'libre'} |`);
  }
  L.push('');

  if (dm.objets.size) {
    L.push('## Objets propres au monde', '', '| Objet | Catégorie | Rareté | Valeur | Effet |', '| --- | --- | --- | --- | --- |');
    for (const o of [...dm.objets.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))) L.push(`| ${o.nom} | ${o.categorie} | ${o.rarete} | ${o.valeurPo} po | ${o.resume} |`);
    L.push('');
  }
  return L.join('\n');
}

export type { Lieu };
