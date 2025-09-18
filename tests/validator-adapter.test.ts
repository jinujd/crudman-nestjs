import { describe, it, expect } from 'vitest'
import { FastestValidatorAdapter } from '../src/lib/validation/FastestValidatorAdapter'

describe('FastestValidatorAdapter', () => {
  it('generates rules and validates', () => {
    const adapter = new FastestValidatorAdapter()
    const model = { columns: [{ propertyName: 'email', isNullable: false, type: 'varchar', length: 255 }] }
    const rules = adapter.generateSchemaFromModel(model as any, false)
    const ok = adapter.validate({ email: 'a@b.com' }, rules)
    expect(ok.valid).toBe(true)
    const bad = adapter.validate({ email: 1 }, rules)
    expect(bad.valid).toBe(false)
  })
})


