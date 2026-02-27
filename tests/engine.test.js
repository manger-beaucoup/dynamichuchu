import test from 'node:test';
import assert from 'node:assert/strict';

import {
  employeeTable,
  payrollTable,
  leaveHistoryTable,
  correctionRuleTable,
} from '../src/data/sampleData.js';
import { calculateTenure } from '../src/engine/tenure.js';
import { calculateAverageMonthlyWage } from '../src/engine/averageWage.js';
import { runScenarioComparison } from '../src/engine/scenarioRunner.js';

test('근속 계산: 비산입 휴직은 근속에서 제외된다', () => {
  const employee = employeeTable.find((e) => e.employeeId === 'E002');
  const tenure = calculateTenure(employee, leaveHistoryTable, { excludeNonInclusiveLeave: true });
  assert.equal(tenure.excludedDays, 30);
  assert.ok(tenure.yearsWorked > 6);
});

test('평균임금 계산: 휴직보정 켜면 평균임금이 증가하거나 유지된다', () => {
  const employee = employeeTable.find((e) => e.employeeId === 'E002');

  const withoutCorrection = calculateAverageMonthlyWage({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
    includeAllowances: true,
    useLeaveCorrection: false,
  });

  const withCorrection = calculateAverageMonthlyWage({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
    includeAllowances: true,
    useLeaveCorrection: true,
  });

  assert.ok(withCorrection.averageMonthlyWage >= withoutCorrection.averageMonthlyWage);
});

test('시나리오 비교: 3개 시나리오가 생성된다', () => {
  const employee = employeeTable.find((e) => e.employeeId === 'E001');
  const rows = runScenarioComparison({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
  });

  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.scenarioId),
    ['BASE', 'LEAVE_CORRECTION', 'WAGE_PEAK']
  );
});
