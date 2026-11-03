// Les schémas Zod des commandes deviennent les schémas JSON des outils du conteur. Seul le sous-ensemble de Zod que les
// commandes du jeu utilisent est géré (objets, chaînes, nombres, booléens, énumérations, listes, unions, dictionnaires).
import type { ZodTypeAny } from 'zod';

export type SchemaJson = Record<string, unknown>;

interface Def {
  typeName?: string;
  description?: string;
  innerType?: ZodTypeAny;
  schema?: ZodTypeAny;
  shape?: () => Record<string, ZodTypeAny>;
  values?: string[] | Record<string, string>;
  value?: unknown;
  type?: ZodTypeAny;
  options?: ZodTypeAny[];
  valueType?: ZodTypeAny;
  checks?: { kind: string; value?: number }[];
  defaultValue?: () => unknown;
}

const def = (s: ZodTypeAny) => (s as unknown as { _def: Def })._def;

/** Une propriété est facultative si Zod l'accepte absente (`optional`, `default`). */
function facultative(s: ZodTypeAny): boolean {
  const t = def(s).typeName;
  return t === 'ZodOptional' || t === 'ZodDefault' || (t === 'ZodNullable' && facultative(def(s).innerType!));
}

export function versSchemaJson(s: ZodTypeAny): SchemaJson {
  const d = def(s);
  const decrire = (j: SchemaJson): SchemaJson => (d.description ? { ...j, description: d.description } : j);
  switch (d.typeName) {
    case 'ZodString':
      return decrire({ type: 'string' });
    case 'ZodNumber':
      return decrire({
        type: d.checks?.some((c) => c.kind === 'int') ? 'integer' : 'number',
        ...Object.fromEntries((d.checks ?? []).flatMap((c) => (c.kind === 'min' ? [['minimum', c.value]] : c.kind === 'max' ? [['maximum', c.value]] : []))),
      });
    case 'ZodBoolean':
      return decrire({ type: 'boolean' });
    case 'ZodLiteral':
      return decrire({ const: d.value });
    case 'ZodEnum':
      return decrire({ type: 'string', enum: Array.isArray(d.values) ? d.values : Object.values(d.values ?? {}) });
    case 'ZodArray':
      return decrire({ type: 'array', items: versSchemaJson(d.type!) });
    case 'ZodRecord':
      return decrire({ type: 'object', additionalProperties: versSchemaJson(d.valueType!) });
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion':
      return decrire({ anyOf: (d.options ?? []).map(versSchemaJson) });
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return decrire(versSchemaJson(d.innerType!));
    case 'ZodEffects':
      return decrire(versSchemaJson(d.schema!));
    case 'ZodObject': {
      const forme = d.shape!();
      return decrire({
        type: 'object',
        properties: Object.fromEntries(Object.entries(forme).map(([k, v]) => [k, versSchemaJson(v)])),
        required: Object.entries(forme)
          .filter(([, v]) => !facultative(v))
          .map(([k]) => k),
        additionalProperties: false,
      });
    }
    default:
      return decrire({});
  }
}
