import { diffDaysInclusive, enumerateMonths } from './dateUtils.js';

export function calculateTenure(employee, leaveHistory, options = { excludeNonInclusiveLeave: true }) {
  const totalDays = diffDaysInclusive(employee.hireDate, employee.retireDate);
  let excludedDays = 0;
  const logs = [`근속 원천 일수: ${totalDays}일`];

  if (options.excludeNonInclusiveLeave) {
    const leaves = leaveHistory.filter(
      (leave) => leave.employeeId === employee.employeeId && leave.includeInService === false
    );

    for (const leave of leaves) {
      const months = enumerateMonths(leave.startMonth, leave.endMonth);
      const leaveDays = months.length * 30;
      excludedDays += leaveDays;
      logs.push(`- ${leave.leaveType} (${leave.startMonth}~${leave.endMonth}) ${leaveDays}일 제외`);
    }
  }

  const recognizedDays = Math.max(totalDays - excludedDays, 0);
  const yearsWorked = recognizedDays / 365;
  logs.push(`인정 근속일수: ${recognizedDays}일`);
  logs.push(`인정 근속연수: ${yearsWorked.toFixed(4)}년`);

  return {
    totalDays,
    excludedDays,
    recognizedDays,
    yearsWorked,
    logs,
  };
}
