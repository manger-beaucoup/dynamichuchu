import { calculateRetirementPayEngine } from './retirementPay.js';

export function runScenarioComparison({ employee, payrollTable, leaveHistory, correctionRules }) {
  const scenarios = [
    {
      scenarioId: 'BASE',
      label: '기본',
      options: { includeAllowances: true, useLeaveCorrection: false },
    },
    {
      scenarioId: 'LEAVE_CORRECTION',
      label: '휴직보정',
      options: { includeAllowances: true, useLeaveCorrection: true },
    },
    {
      scenarioId: 'WAGE_PEAK',
      label: '임금피크',
      options: { includeAllowances: false, useLeaveCorrection: true },
    },
  ];

  return scenarios.map((scenario) => {
    const result = calculateRetirementPayEngine({
      employee,
      payrollTable,
      leaveHistory,
      correctionRules,
      ...scenario.options,
    });

    return {
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      options: scenario.options,
      retirementPay: result.retirementPay,
      averageMonthlyWage: result.averageWage.averageMonthlyWage,
      yearsWorked: result.tenure.yearsWorked,
      logs: result.logs,
    };
  });
}
