import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateProject, typeIds } from './registry.js';
import { presetProject } from './test-fixtures.js';
import { presetIds, presetProject as projectOf } from './presets.js';

// Офіційна схема (schema/) і валідатор у core/ мусять однаково оцінювати проєкти.
const ROOT = join(import.meta.dirname, '../../..');
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

const ajv = new Ajv2020({ allErrors: true });
for (const file of readdirSync(join(ROOT, 'schema/types'))) ajv.addSchema(readJson(join(ROOT, 'schema/types', file)));
const schemaValidate = ajv.compile(readJson(join(ROOT, 'schema/project.v2.schema.json')));

const FIXTURES = join(import.meta.dirname, 'fixtures/validation');
const files = readdirSync(FIXTURES).filter(f => f.endsWith('.json'));

describe('схема ↔ валідатор', () => {
  it('у схемі описано кожен тип реєстру', () => {
    const project = readJson(join(ROOT, 'schema/project.v2.schema.json'));
    expect(project.properties.type.enum).toEqual(typeIds());
    typeIds().forEach(id => expect(readdirSync(join(ROOT, 'schema/types'))).toContain(`${id}.v2.schema.json`));
  });

  it('є і валідні, і невалідні фікстури', () => {
    expect(files.some(f => f.startsWith('valid-'))).toBe(true);
    expect(files.some(f => f.startsWith('invalid-'))).toBe(true);
  });

  it.each(files)('%s', file => {
    const data = readJson(join(FIXTURES, file));
    const expected = file.startsWith('valid-');
    expect(schemaValidate(data), JSON.stringify(schemaValidate.errors)).toBe(expected);
    expect(validateProject(data).ok).toBe(expected);
  });

  it.each(presetIds())('пресет %s відповідає схемі', id => {
    expect(schemaValidate(projectOf(id)), JSON.stringify(schemaValidate.errors)).toBe(true);
  });

  it('нормалізований проєкт з невідомими полями відповідає схемі', () => {
    const p = { ...presetProject('komod'), extra: 1, top: { mount: 'over', junk: true } };
    expect(schemaValidate(p)).toBe(false);
    const res = validateProject(p);
    expect(res.ok && schemaValidate(res.project)).toBe(true);
  });
});
