// Lecture de la réponse d'OpenRouter pour un morceau : un flux d'événements « data: {json} » (obligatoire pour la
// sortie audio) qui apportent l'audio en base64, un éventuel texte, et le coût. Logique pure, testée.

export interface Reponse {
  /** Les octets audio, dans l'ordre (un fichier mp3 ou wav, selon le format demandé). */
  audio: Buffer;
  /** Le texte joint par le modèle (titre, description de la musique), s'il y en a. */
  texte: string;
  /** Coût facturé annoncé par OpenRouter, en dollars. */
  cout?: number;
  /** Erreur annoncée dans le flux, s'il y en a une. */
  erreur?: string;
  /** Nombre d'événements lus (pour le diagnostic). */
  evenements: number;
}

interface Morceau {
  choices?: {
    delta?: { content?: string; audio?: { data?: string; transcript?: string } };
    message?: { content?: string; audio?: { data?: string; transcript?: string } };
  }[];
  usage?: { cost?: number };
  error?: { message?: string } | string;
}

/** Lit les lignes d'un flux d'événements. Les lignes qui ne sont pas des « data: » sont ignorées. */
export function lireFlux(lignes: Iterable<string>): Reponse {
  const octets: Buffer[] = [];
  let texte = '';
  let cout: number | undefined;
  let erreur: string | undefined;
  let evenements = 0;
  for (const ligne of lignes) {
    if (!ligne.startsWith('data:')) continue;
    const charge = ligne.slice(5).trim();
    if (!charge || charge === '[DONE]') continue;
    let json: Morceau;
    try {
      json = JSON.parse(charge) as Morceau;
    } catch {
      continue;
    }
    evenements++;
    if (json.error) erreur = typeof json.error === 'string' ? json.error : (json.error.message ?? 'erreur sans message');
    const choix = json.choices?.[0];
    const audio = choix?.delta?.audio ?? choix?.message?.audio;
    if (audio?.data) octets.push(Buffer.from(audio.data, 'base64'));
    if (audio?.transcript) texte += audio.transcript;
    const contenu = choix?.delta?.content ?? choix?.message?.content;
    if (contenu) texte += contenu;
    if (json.usage?.cost !== undefined) cout = json.usage.cost;
  }
  return { audio: Buffer.concat(octets), texte, cout, erreur, evenements };
}

/** Un fichier mp3 commence par une étiquette « ID3 » ou par un en-tête de trame (0xFF 0xFB/0xF3/0xF2) ; un wav par « RIFF ». */
export function formatAudio(octets: Buffer): 'mp3' | 'wav' | 'inconnu' {
  if (octets.length < 4) return 'inconnu';
  if (octets.subarray(0, 3).toString('latin1') === 'ID3') return 'mp3';
  if (octets[0] === 0xff && ((octets[1] ?? 0) & 0xe0) === 0xe0) return 'mp3';
  if (octets.subarray(0, 4).toString('latin1') === 'RIFF') return 'wav';
  return 'inconnu';
}
