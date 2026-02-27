import { calculateTenure } from './tenure.js';
import { calculateAverageMonthlyWage } from './averageWage.js';

export function calculateRetirementPayEngine({
  employee,
  payrollTable,
  leaveHistory,
  correctionRules,
  includeAllowances = true,
  useLeaveCorrection = false,
}) {
  const tenure = calculateTenure(employee, leaveHistory, { excludeNonInclusiveLeave: true });
  const averageWage = calculateAverageMonthlyWage({
    employee,
    payrollTable,
    leaveHistory,
    correctionRules,
    includeAllowances,
    useLeaveCorrection,
  });

  const retirementPay = averageWage.averageMonthlyWage * tenure.yearsWorked;
  const logs = [
    ...tenure.logs,
    ...averageWage.logs,
    `퇴직금 = 평균월임금(${Math.round(averageWage.averageMonthlyWage).toLocaleString()}) × 근속연수(${tenure.yearsWorked.toFixed(4)})`,
    `최종 퇴직금: ${Math.round(retirementPay).toLocaleString()}원`,
  ];

  return {
    retirementPay,
    tenure,
    averageWage,
    logs,
  };
}
