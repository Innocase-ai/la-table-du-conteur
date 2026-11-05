// Les images communes à tous les mondes : l'équipement et les objets du catalogue SRD sont dessinés une fois, pas par
// histoire. Les variantes d'un même objet (+1, +2, +3, les six ceintures de géant, les dix parchemins de sort) partagent
// une image ; une arme ou une armure magique de base connue prend l'image de sa base (l'épée longue +1 est une épée longue).

/** Les familles de variantes : l'id d'un objet qui correspond prend l'image de la famille. */
const FAMILLES: [RegExp, string][] = [
  [/^(arme|armure|bouclier)-magique-plus-\d$/, '$1-magique'],
  [/^(projectile|baguette-du-mage-de-guerre)-plus-\d$/, '$1'],
  [/^ceinturon-de-force-de-geant-.*$/, 'ceinturon-de-force-de-geant'],
  [/^cor-du-valhalla-.*$/, 'cor-du-valhalla'],
  [/^parchemin-de-sort-.*$/, 'parchemin-de-sort'],
  [/^pierre-de-ioun-.*$/, 'pierre-de-ioun'],
  [/^potion-de-force-de-geant-.*$/, 'potion-de-force-de-geant'],
  [/^potion-de-guerison(-.*)?$/, 'potion-de-guerison'],
];

/**
 * L'id de l'image commune d'un objet du catalogue : son id, ou celui de sa base (une arme ou une armure), ou celui de sa
 * famille de variantes.
 */
export function idImageCommune(id: string): string {
  for (const [motif, famille] of FAMILLES) if (motif.test(id)) return id.replace(motif, famille);
  return id;
}
