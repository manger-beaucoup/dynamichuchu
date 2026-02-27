/**
 * @typedef {Object} Employee
 * @property {string} employeeId
 * @property {string} name
 * @property {string} hireDate - YYYY-MM-DD
 * @property {string} retireDate - YYYY-MM-DD
 * @property {string} retirementReason
 * @property {string} targetType
 */

/**
 * @typedef {Object} PayrollRecord
 * @property {string} employeeId
 * @property {string} month - YYYY-MM
 * @property {number} baseSalary
 * @property {number} allowances
 * @property {number} bonus
 */

/**
 * @typedef {Object} LeaveRecord
 * @property {string} employeeId
 * @property {string} leaveType
 * @property {string} startMonth - YYYY-MM
 * @property {string} endMonth - YYYY-MM
 * @property {boolean} includeInService
 * @property {string | null} correctionRuleId
 */

/**
 * @typedef {Object} CorrectionRule
 * @property {string} ruleId
 * @property {string} ruleName
 * @property {'NONE' | 'PRIOR_3M_AVERAGE' | 'FIXED_RATE'} strategy
 * @property {number | null} fixedRate
 * @property {boolean} enabled
 */

export const CorrectionStrategies = Object.freeze({
  NONE: 'NONE',
  PRIOR_3M_AVERAGE: 'PRIOR_3M_AVERAGE',
  FIXED_RATE: 'FIXED_RATE',
});
