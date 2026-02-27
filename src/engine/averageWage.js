import { CorrectionStrategies } from '../data/models.js';
import { enumerateMonths } from './dateUtils.js';

function monthBefore(targetMonth, n) {
  const [year, month] = targetMonth.split('-').map(Number);
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`);
  date.setMonth(date.getMonth() - n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function sumPayroll(records, includeAllowances) {
  return records.reduce((sum, row) => sum + row.baseSalary + (includeAllowances ? row.allowances : 0), 0);
}

function getRule(correctionRules, ruleId) {
  if (!ruleId) return null;
  return correctionRules.find((rule) => rule.ruleId === ruleId && rule.enabled) ?? null;
}

function getReferenceThreeMonthAverage(employeeId, payrollTable, retireMonth, includeAllowances) {
  const priorMonths = [monthBefore(retireMonth, 4), monthBefore(retireMonth, 5), monthBefore(retireMonth, 6)];
  const records = payrollTable.filter((row) => row.employeeId === employeeId && priorMonths.includes(row.month));
  if (records.length === 0) return 0;
  return sumPayroll(records, includeAllowances) / 3;
}

function adjustPayrollForLeave(baseAmount, leaveInfo, context) {
  if (!leaveInfo?.isLeaveMonth || !context.useLeaveCorrection) {
    return { amount: baseAmount, reason: '보정 미적용' };
  }

  const rule = context.rule;
  if (!rule) {
    return { amount: baseAmount, reason: '연결된 규칙 없음' };
  }

  if (rule.strategy === CorrectionStrategies.NONE) {
    return { amount: baseAmount, reason: `${rule.ruleName} 적용` };
  }

  if (rule.strategy === CorrectionStrategies.PRIOR_3M_AVERAGE) {
    const referenceAvg = getReferenceThreeMonthAverage(
      context.employeeId,
      context.payrollTable,
      context.retireMonth,
      context.includeAllowances
    );
    return { amount: Math.max(baseAmount, referenceAvg), reason: `${rule.ruleName} 적용` };
  }

  if (rule.strategy === CorrectionStrategies.FIXED_RATE && rule.fixedRate) {
    const referenceAvg = getReferenceThreeMonthAverage(
      context.employeeId,
      context.payrollTable,
      context.retireMonth,
      context.includeAllowances
    );
    return { amount: Math.max(baseAmount, referenceAvg * rule.fixedRate), reason: `${rule.ruleName} 적용` };
  }

  return { amount: baseAmount, reason: '규칙 불일치로 보정 미적용' };
}

export function calculateAverageMonthlyWage({
  employee,
  payrollTable,
  leaveHistory,
  correctionRules,
  includeAllowances = true,
  useLeaveCorrection = false,
}) {
  const retireMonth = employee.retireDate.slice(0, 7);
  const target3Months = [monthBefore(retireMonth, 2), monthBefore(retireMonth, 1), retireMonth];
  const last12Months = Array.from({ length: 12 }, (_, i) => monthBefore(retireMonth, i));

  const base3Months = [];
  const logs = [`대상 3개월: ${target3Months.join(', ')}`];

  for (const month of target3Months) {
    const record =
      payrollTable.find((row) => row.employeeId === employee.employeeId && row.month === month) ??
      { baseSalary: 0, allowances: 0, bonus: 0 };

    const leaveRecord = leaveHistory.find(
      (leave) =>
        leave.employeeId === employee.employeeId &&
        enumerateMonths(leave.startMonth, leave.endMonth).includes(month)
    );

    const originalAmount = record.baseSalary + (includeAllowances ? record.allowances : 0);
    const rule = getRule(correctionRules, leaveRecord?.correctionRuleId ?? null);
    const adjusted = adjustPayrollForLeave(originalAmount, { isLeaveMonth: Boolean(leaveRecord) }, {
      employeeId: employee.employeeId,
      payrollTable,
      retireMonth,
      includeAllowances,
      useLeaveCorrection,
      rule,
    });

    base3Months.push(adjusted.amount);
    logs.push(`- ${month}: 원본 ${originalAmount.toLocaleString()} / 반영 ${Math.round(adjusted.amount).toLocaleString()} (${adjusted.reason})`);
  }

  const threeMonthWage = base3Months.reduce((a, b) => a + b, 0);

  const bonus12Month = payrollTable
    .filter((row) => row.employeeId === employee.employeeId && last12Months.includes(row.month))
    .reduce((sum, row) => sum + row.bonus, 0);

  const averageMonthlyWage = threeMonthWage / 3 + bonus12Month / 12;

  logs.push(`3개월 급여합: ${Math.round(threeMonthWage).toLocaleString()}원`);
  logs.push(`1년 상여합: ${bonus12Month.toLocaleString()}원`);
  logs.push(`평균월임금: ${Math.round(averageMonthlyWage).toLocaleString()}원`);

  return {
    averageMonthlyWage,
    threeMonthWage,
    bonus12Month,
    logs,
  };
}
