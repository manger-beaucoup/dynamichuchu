import { CorrectionStrategies } from './models.js';

export const employeeTable = [
  {
    employeeId: 'E001',
    name: '김민준',
    hireDate: '2018-01-15',
    retireDate: '2025-06-30',
    retirementReason: '정년',
    targetType: '일반',
  },
  {
    employeeId: 'E002',
    name: '박서연',
    hireDate: '2019-03-01',
    retireDate: '2025-06-30',
    retirementReason: '권고사직',
    targetType: '일반',
  },
  {
    employeeId: 'E003',
    name: '이도윤',
    hireDate: '2016-07-01',
    retireDate: '2025-06-30',
    retirementReason: '정년',
    targetType: '임금피크',
  },
];

export const payrollTable = [
  { employeeId: 'E001', month: '2025-04', baseSalary: 3500000, allowances: 300000, bonus: 0 },
  { employeeId: 'E001', month: '2025-05', baseSalary: 3500000, allowances: 300000, bonus: 0 },
  { employeeId: 'E001', month: '2025-06', baseSalary: 3500000, allowances: 300000, bonus: 1200000 },
  { employeeId: 'E001', month: '2024-12', baseSalary: 3400000, allowances: 250000, bonus: 2400000 },

  { employeeId: 'E002', month: '2025-04', baseSalary: 0, allowances: 0, bonus: 0 },
  { employeeId: 'E002', month: '2025-05', baseSalary: 1500000, allowances: 0, bonus: 0 },
  { employeeId: 'E002', month: '2025-06', baseSalary: 1500000, allowances: 0, bonus: 300000 },
  { employeeId: 'E002', month: '2025-02', baseSalary: 3000000, allowances: 200000, bonus: 0 },
  { employeeId: 'E002', month: '2025-03', baseSalary: 3000000, allowances: 200000, bonus: 0 },
  { employeeId: 'E002', month: '2024-12', baseSalary: 2900000, allowances: 200000, bonus: 1200000 },

  { employeeId: 'E003', month: '2025-04', baseSalary: 2800000, allowances: 150000, bonus: 0 },
  { employeeId: 'E003', month: '2025-05', baseSalary: 2800000, allowances: 150000, bonus: 0 },
  { employeeId: 'E003', month: '2025-06', baseSalary: 2800000, allowances: 150000, bonus: 1800000 },
  { employeeId: 'E003', month: '2024-12', baseSalary: 3000000, allowances: 200000, bonus: 2400000 },
];

export const leaveHistoryTable = [
  {
    employeeId: 'E002',
    leaveType: '육아휴직',
    startMonth: '2025-04',
    endMonth: '2025-05',
    includeInService: true,
    correctionRuleId: 'RULE_PRIOR_3M',
  },
  {
    employeeId: 'E002',
    leaveType: '무급휴직',
    startMonth: '2023-07',
    endMonth: '2023-07',
    includeInService: false,
    correctionRuleId: null,
  },
  {
    employeeId: 'E003',
    leaveType: '교육휴직',
    startMonth: '2022-01',
    endMonth: '2022-01',
    includeInService: true,
    correctionRuleId: null,
  },
];

export const correctionRuleTable = [
  {
    ruleId: 'RULE_NONE',
    ruleName: '보정 없음',
    strategy: CorrectionStrategies.NONE,
    fixedRate: null,
    enabled: true,
  },
  {
    ruleId: 'RULE_PRIOR_3M',
    ruleName: '직전 3개월 평균으로 대체',
    strategy: CorrectionStrategies.PRIOR_3M_AVERAGE,
    fixedRate: null,
    enabled: true,
  },
  {
    ruleId: 'RULE_FIXED_80',
    ruleName: '정상임금의 80% 반영',
    strategy: CorrectionStrategies.FIXED_RATE,
    fixedRate: 0.8,
    enabled: true,
  },
];
