// Le sens en jeu d'un service de PNJ (soins, nuit, identification). Le champ `type` du service le dit ; sans lui, on devine d'après
// l'identifiant (ancienne détection, gardée en repli : P1 du PRD de la saga). Partagé par le module Commerce et le validateur.

export type TypeService = 'soins' | 'nuit' | 'identification';

const SOINS = /soin|guerison|purge|veillee-des-malades/;
const NUIT = /chambre|dortoir|hospitalite|abri|refuge/;
const IDENTIFICATION = /identification/;

/** Ce que fait le service : son `type` s'il en a un, sinon ce que laisse deviner son identifiant (`undefined` : seulement ses effets). */
export function typeDeService(s: { id: string; type?: TypeService }): TypeService | undefined {
  if (s.type) return s.type;
  // Même ordre qu'avant : la nuit passe avant les soins, puis l'identification.
  if (NUIT.test(s.id)) return 'nuit';
  if (SOINS.test(s.id)) return 'soins';
  if (IDENTIFICATION.test(s.id)) return 'identification';
  return undefined;
}
