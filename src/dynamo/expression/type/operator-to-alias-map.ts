import { ConditionOperator } from './condition-operator.type'
import { OperatorAlias } from './operator-alias.type'

export const OPERATOR_TO_ALIAS_MAP: { [key in ConditionOperator]: OperatorAlias | OperatorAlias[] } = {
  '=': ['equals', 'eq'],
  '<>': 'ne',
  '<=': 'lte',
  '<': 'lt',
  '>=': 'gte',
  '>': 'gt',
  attribute_not_exists: 'null',
  attribute_exists: 'notNull',
  attribute_type: 'type',
  contains: 'contains',
  IN: 'in',
  begins_with: 'beginsWith',
  BETWEEN: 'between',
}
