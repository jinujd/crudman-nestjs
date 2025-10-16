/**
 * Validation rule types for fastest-validator schema.
 * These types represent the structure expected by the validation engine.
 */

/**
 * Base validation rule properties common to all field types
 */
export interface BaseValidationRule {
  /** Field type - defaults to 'string' if not provided */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'uuid' | 'array' | 'object' | 'any' | 'enum' | 'custom'
  /** Whether the field is optional (can be omitted from input) */
  optional?: boolean
  /** Whether the field can be null */
  nullable?: boolean
  /** Custom error messages */
  messages?: Record<string, string>
  /** Custom validation function */
  custom?: (value: any, errors: any[], schema: any, name: string, parent: any, context: any) => any
}

/**
 * String field validation rule
 */
export interface StringValidationRule extends BaseValidationRule {
  type: 'string'
  /** Minimum length */
  min?: number
  /** Maximum length */
  max?: number
  /** Exact length */
  length?: number
  /** Pattern to match (RegExp) */
  pattern?: string | RegExp
  /** Whether to allow empty strings */
  empty?: boolean
  /** Whether to trim the value before validation */
  trim?: boolean
  /** Convert to lowercase */
  lowercase?: boolean
  /** Convert to uppercase */
  uppercase?: boolean
  /** Allowed values (enum) */
  enum?: string[]
}

/**
 * Number field validation rule
 */
export interface NumberValidationRule extends BaseValidationRule {
  type: 'number'
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Must be an integer */
  integer?: boolean
  /** Must be positive */
  positive?: boolean
  /** Must be negative */
  negative?: boolean
  /** Allowed values (enum) */
  enum?: number[]
  /** Convert string to number */
  convert?: boolean
}

/**
 * Boolean field validation rule
 */
export interface BooleanValidationRule extends BaseValidationRule {
  type: 'boolean'
  /** Convert truthy/falsy values to boolean */
  convert?: boolean
}

/**
 * Date field validation rule
 */
export interface DateValidationRule extends BaseValidationRule {
  type: 'date'
  /** Convert string/number to Date */
  convert?: boolean
}

/**
 * Email field validation rule
 */
export interface EmailValidationRule extends BaseValidationRule {
  type: 'email'
  /** Normalize email (lowercase, trim) */
  normalize?: boolean
  /** Empty is allowed */
  empty?: boolean
  /** Minimum length */
  min?: number
  /** Maximum length */
  max?: number
}

/**
 * Array field validation rule
 */
export interface ArrayValidationRule extends BaseValidationRule {
  type: 'array'
  /** Minimum number of items */
  min?: number
  /** Maximum number of items */
  max?: number
  /** Exact number of items */
  length?: number
  /** Whether to allow empty arrays */
  empty?: boolean
  /** Validation rules for array items */
  items?: ValidationRule
}

/**
 * Object field validation rule
 */
export interface ObjectValidationRule extends BaseValidationRule {
  type: 'object'
  /** Whether to allow strict mode (no extra properties) */
  strict?: boolean | 'remove'
  /** Validation rules for object properties */
  props?: ValidationSchema
}

/**
 * Enum field validation rule
 */
export interface EnumValidationRule extends BaseValidationRule {
  type: 'enum'
  /** Allowed values */
  values: any[]
}

/**
 * Any type field validation rule (accepts any value)
 */
export interface AnyValidationRule extends BaseValidationRule {
  type: 'any'
}

/**
 * Union of all possible validation rules
 */
export type ValidationRule = 
  | StringValidationRule
  | NumberValidationRule
  | BooleanValidationRule
  | DateValidationRule
  | EmailValidationRule
  | ArrayValidationRule
  | ObjectValidationRule
  | EnumValidationRule
  | AnyValidationRule
  | BaseValidationRule

/**
 * Validation schema - a map of field names to their validation rules
 */
export interface ValidationSchema {
  [fieldName: string]: ValidationRule | any // 'any' for backward compatibility and special keys like $$strict
  /** Special key to control strict mode */
  $$strict?: boolean | 'remove'
}

/**
 * Type for getFinalValidationRules return value
 */
export type FinalValidationRules = ValidationSchema
