import Validator from 'fastest-validator';
export class FastestValidatorAdapter {
    constructor() {
        this.validator = new Validator();
    }
    generateSchemaFromModel(model, isUpdate, exclude = ['created_at', 'modified_at', 'deleted_at']) {
        const rules = {};
        const columns = (model?.columns || model?.prototype?._columns || []);
        if (Array.isArray(columns) && columns.length) {
            for (const col of columns) {
                const field = col.propertyName;
                if (!field)
                    continue;
                if (exclude.includes(field))
                    continue;
                if (!isUpdate && field === 'id')
                    continue;
                const rule = {};
                if (col.isNullable === false && (!isUpdate || field === 'id'))
                    rule.nullable = false;
                if (col.isNullable === true) {
                    rule.nullable = true;
                    rule.optional = true;
                }
                const typ = (typeof col.type === 'string' ? col.type.toLowerCase() : col.type);
                if (typ === 'varchar' || typ === 'text' || typ === String) {
                    rule.type = 'string';
                    if (col.length)
                        rule.max = Number(col.length);
                }
                else if (typ === 'int' || typ === 'integer' || typ === Number) {
                    rule.type = 'number';
                    rule.integer = true;
                }
                else if (typ === 'float' || typ === 'double' || typ === 'decimal') {
                    rule.type = 'number';
                }
                else if (typ === 'date' || typ === 'datetime' || typ === 'timestamp' || typ === Date) {
                    rule.type = 'date';
                }
                else if (typ === 'boolean' || typ === Boolean) {
                    rule.type = 'boolean';
                }
                else {
                    rule.type = 'any';
                }
                if (isUpdate && field !== 'id')
                    rule.optional = true;
                rules[field] = rule;
            }
        }
        rules.$$strict = true;
        return rules;
    }
    validate(input, schema) {
        const result = this.validator.validate(input, schema);
        return result === true ? { valid: true, errors: [] } : { valid: false, errors: result };
    }
}
