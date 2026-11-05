// La fiche d'un sort pour le joueur (« Informations sur le sort ») : les mêmes champs que le livre de règles, mis en forme.
import type { FicheInfo } from '../noyau/types';
import type { Sort } from '../schemas';

const CARACTERISTIQUES: Record<string, string> = { for: 'Force', dex: 'Dextérité', con: 'Constitution', int: 'Intelligence', sag: 'Sagesse', cha: 'Charisme' };
const INCANTATION: Record<Sort['tempsIncantation'], string> = { action: '1 action', bonus: '1 action bonus', reaction: '1 réaction', gratuit: 'aucun (gratuit)' };
const FORMES: Record<string, string> = { cone: 'cône', sphere: 'sphère', cube: 'cube', ligne: 'ligne', cylindre: 'cylindre', emanation: 'émanation' };

const metres = (n: number) => `${String(n).replace('.', ',')} m`;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function portee(s: Sort): string {
  const p = s.portee;
  if (p.type === 'personnel') return 'personnelle';
  if (p.type === 'contact') return p.allonge ? `contact (${metres(p.allonge)})` : 'contact';
  return p.longue && p.longue !== p.normale ? `${metres(p.normale ?? 0)} (jusqu'à ${metres(p.longue)})` : metres(p.normale ?? 0);
}

function zone(s: Sort): string {
  if (!s.zone) return s.cibles && s.cibles > 1 ? `${s.cibles} créatures au plus` : '1 créature ou 1 point';
  const largeur = s.zone.largeur ? ` sur ${metres(s.zone.largeur)} de large` : '';
  return `${FORMES[s.zone.forme] ?? s.zone.forme} de ${metres(s.zone.taille)}${largeur}`;
}

function sauvegarde(s: Sort): string {
  const r = s.resolution;
  if (!r || r.type === 'automatique') return 'aucun';
  if (r.type === 'attaque') return `jet d'attaque de sort (${r.mode === 'corps-a-corps' ? 'corps à corps' : 'à distance'})`;
  return `${CARACTERISTIQUES[r.caracteristique] ?? r.caracteristique}${r.moitieSiReussite ? ', moitié des dégâts si réussi' : ''}`;
}

/** La fiche d'information d'un sort : niveau, école, portée, durée, incantation, zone, composantes, sauvegarde, dégâts, description. */
export function ficheDeSort(s: Sort): FicheInfo {
  const proprietes = [
    { libelle: 'Niveau', valeur: s.niveau === 0 ? 'mineur (0)' : String(s.niveau) },
    { libelle: 'Portée', valeur: portee(s) },
    { libelle: 'Durée', valeur: `${s.duree}${s.concentration ? ' (concentration)' : ''}` },
    { libelle: "Temps d'incantation", valeur: INCANTATION[s.tempsIncantation] },
    { libelle: "Zone d'effet", valeur: zone(s) },
    { libelle: 'Composantes', valeur: s.composantes },
    { libelle: 'Jet de sauvegarde', valeur: sauvegarde(s) },
  ];
  if (s.degats.length) proprietes.push({ libelle: 'Dégâts', valeur: s.degats.map((d) => `${d.des}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : String(d.bonus)) : ''} ${d.type}`).join(' + ') });
  if (s.soins) proprietes.push({ libelle: 'Soins', valeur: `${s.soins.des}${s.soins.ajouterModificateur ? ' + modificateur de caractéristique' : ''}` });
  return {
    rubrique: 'Informations sur le sort',
    titre: s.nom,
    sousTitre: `${majuscule(s.ecole)}${s.classes.length ? ` · ${s.classes.map(majuscule).join(', ')}` : ''}`,
    proprietes,
    texte: s.resume,
  };
}
