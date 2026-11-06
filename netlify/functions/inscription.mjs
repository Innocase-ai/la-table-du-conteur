// Reçoit l'inscription du formulaire « Être prévenu de la sortie » et l'écrit dans une feuille AITable.
// Le jeton AITable reste ici, côté serveur : il ne doit JAMAIS apparaître dans la page du site ni dans le dépôt.
//
// Variables d'environnement à définir dans Netlify (Site configuration > Environment variables) :
//   AITABLE_TOKEN                     jeton d'API AITable (secret)
//   AITABLE_INSCRIPTIONS_DATASHEET_ID identifiant de la feuille « Inscriptions La Table du Conteur »
//   AITABLE_BASE_URL                  facultatif (défaut : https://aitable.ai/fusion/v1)
//
// Colonnes de la feuille : Email (principale), Source, Date d'inscription, Consentement.

export const config = { path: '/api/inscription' };

const REPONSE_JSON = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const reponse = (statut, corps) => new Response(JSON.stringify(corps), { status: statut, headers: REPONSE_JSON });
const COURRIEL = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/;

export default async (req) => {
  if (req.method !== 'POST') return reponse(405, { ok: false, message: 'Méthode non autorisée.' });

  let donnees;
  try {
    donnees = await req.json();
  } catch {
    return reponse(400, { ok: false, message: 'Requête illisible.' });
  }

  // Champ-piège : un humain ne le voit pas, un robot le remplit. On répond « ok » sans rien enregistrer.
  if (donnees.site_web) return reponse(200, { ok: true });

  const courriel = String(donnees.courriel ?? '').trim().toLowerCase();
  if (courriel.length > 254 || !COURRIEL.test(courriel)) return reponse(400, { ok: false, message: 'Cette adresse e-mail ne semble pas valide.' });
  if (donnees.consentement !== true) return reponse(400, { ok: false, message: 'Veuillez cocher la case de consentement.' });

  const jeton = process.env.AITABLE_TOKEN;
  const feuille = process.env.AITABLE_INSCRIPTIONS_DATASHEET_ID;
  if (!jeton || !feuille) {
    console.error('inscription : AITABLE_TOKEN ou AITABLE_INSCRIPTIONS_DATASHEET_ID manquant');
    return reponse(503, { ok: false, message: "Les inscriptions ne sont pas disponibles pour le moment." });
  }
  const base = process.env.AITABLE_BASE_URL || 'https://aitable.ai/fusion/v1';
  const entetes = { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };

  try {
    // Déjà inscrit ? On répond pareil (pas de fuite sur les adresses connues).
    const formule = encodeURIComponent(`{Email}="${courriel.replaceAll('"', '')}"`);
    const existant = await fetch(`${base}/datasheets/${feuille}/records?fieldKey=name&pageSize=1&filterByFormula=${formule}`, { headers: entetes });
    const jExistant = await existant.json().catch(() => ({}));
    if (existant.ok && jExistant.success && (jExistant.data?.records?.length ?? 0) > 0) return reponse(200, { ok: true });

    const ajout = await fetch(`${base}/datasheets/${feuille}/records?fieldKey=name`, {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify({
        records: [{ fields: { Email: courriel, Source: 'site', "Date d'inscription": Date.now(), Consentement: true } }],
      }),
    });
    const jAjout = await ajout.json().catch(() => ({}));
    if (!ajout.ok || !jAjout.success) {
      console.error('inscription : AITable a refusé', ajout.status, jAjout.message);
      return reponse(502, { ok: false, message: "L'inscription n'a pas pu être enregistrée. Réessayez dans un moment." });
    }
    return reponse(200, { ok: true });
  } catch (e) {
    console.error('inscription : erreur réseau', e instanceof Error ? e.message : e);
    return reponse(502, { ok: false, message: "L'inscription n'a pas pu être enregistrée. Réessayez dans un moment." });
  }
};
