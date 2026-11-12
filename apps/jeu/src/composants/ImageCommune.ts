// Une image commune du moteur (équipement du SRD : armes, armures, potions) : son URL, chargée à la demande. Les images
// pèsent 5 à 11 Ko : on garde l'URL en mémoire pour qu'une carte qui se redessine ne clignote pas.
import { useEffect, useState } from 'react';
import { urlImageCommune } from '../mondes';

const connues = new Map<string, string>();

export function useImageCommune(groupe?: string, id?: string): string | undefined {
  const cle = groupe && id ? `${groupe}/${id}` : undefined;
  const [url, setUrl] = useState<string | undefined>(() => (cle ? connues.get(cle) : undefined));
  useEffect(() => {
    if (!cle || !groupe || !id) {
      setUrl(undefined);
      return;
    }
    const deja = connues.get(cle);
    if (deja) {
      setUrl(deja);
      return;
    }
    let actif = true;
    setUrl(undefined);
    urlImageCommune(groupe, id)?.then((u) => {
      connues.set(cle, u);
      if (actif) setUrl(u);
    });
    return () => {
      actif = false;
    };
  }, [cle, groupe, id]);
  return url;
}
