import {
  employeeTable,
  payrollTable,
  leaveHistoryTable,
  correctionRuleTable,
} from './data/sampleData.js';
import { calculateRetirementPayEngine } from './engine/retirementPay.js';
import { runScenarioComparison } from './engine/scenarioRunner.js';

const employeeSelect = document.getElementById('employeeSelect');
const leaveCorrectionToggle = document.getElementById('leaveCorrectionToggle');
const allowanceToggle = document.getElementById('allowanceToggle');
const runButton = document.getElementById('runButton');
const copyLogsButton = document.getElementById('copyLogsButton');
const scenarioTableBody = document.getElementById('scenarioRows');
const logBox = document.getElementById('calcLogs');
const kpiRows = document.getElementById('kpiRows');
const resultSummary = document.getElementById('resultSummary');
const employeeMeta = document.getElementById('employeeMeta');
const leaveRows = document.getElementById('leaveRows');
const payrollRows = document.getElementById('payrollRows');

const formatter = new Intl.NumberFormat('ko-KR');

function monthToNumber(month) {
  const [year, mon] = month.split('-').map(Number);
  return year * 100 + mon;
}

function formatWon(value) {
  return `${formatter.format(Math.round(value))}원`;
}

function getEmployee() {
  return employeeTable.find((row) => row.employeeId === employeeSelect.value) ?? null;
}

function renderEmployeeOptions() {
  employeeTable.forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.employeeId;
    option.textContent = `${employee.employeeId} · ${employee.name}`;
    employeeSelect.appendChild(option);
  });
}

function renderMeta(employee) {
  employeeMeta.innerHTML = '';
  const items = [
    `이름: ${employee.name} (${employee.employeeId})`,
    `입사일: ${employee.hireDate}`,
    `퇴사일: ${employee.retireDate}`,
    `퇴직사유: ${employee.retirementReason}`,
    `대상구분: ${employee.targetType}`,
  ];
  items.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    employeeMeta.appendChild(li);
  });
}

function renderLeaveHistory(employee) {
  leaveRows.innerHTML = '';
  const leaves = leaveHistoryTable.filter((row) => row.employeeId === employee.employeeId);
  if (leaves.length === 0) {
    leaveRows.innerHTML = '<tr><td colspan="4" class="muted">휴직/변동 이력 없음</td></tr>';
    return;
  }

  leaves.forEach((leave) => {
    const ruleName = correctionRuleTable.find((rule) => rule.ruleId === leave.correctionRuleId)?.ruleName ?? '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${leave.leaveType}</td>
      <td>${leave.startMonth} ~ ${leave.endMonth}</td>
      <td>${leave.includeInService ? '산입' : '미산입'}</td>
      <td>${ruleName}</td>
    `;
    leaveRows.appendChild(tr);
  });
}

function renderPayroll(employee) {
  payrollRows.innerHTML = '';
  const retireMonth = employee.retireDate.slice(0, 7);
  const retireNo = monthToNumber(retireMonth);

  const rows = payrollTable
    .filter((row) => row.employeeId === employee.employeeId)
    .filter((row) => retireNo - monthToNumber(row.month) <= 11)
    .sort((a, b) => monthToNumber(b.month) - monthToNumber(a.month));

  if (rows.length === 0) {
    payrollRows.innerHTML = '<tr><td colspan="4" class="muted">급여 데이터 없음</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatWon(row.baseSalary)}</td>
      <td>${formatWon(row.allowances)}</td>
      <td>${formatWon(row.bonus)}</td>
    `;
    payrollRows.appendChild(tr);
  });
}

function renderKpis(result) {
  const kpiData = [
    { label: '최종 퇴직금', value: formatWon(result.retirementPay) },
    { label: '평균월임금', value: formatWon(result.averageWage.averageMonthlyWage) },
    { label: '근속연수', value: `${result.tenure.yearsWorked.toFixed(4)}년` },
    { label: '근속인정일수', value: `${result.tenure.recognizedDays.toLocaleString()}일` },
  ];

  kpiRows.innerHTML = '';
  kpiData.forEach((kpi) => {
    const div = document.createElement('div');
    div.className = 'kpi';
    div.innerHTML = `<div class="label">${kpi.label}</div><div class="value">${kpi.value}</div>`;
    kpiRows.appendChild(div);
  });
}

function renderScenarioTable(scenarios) {
  scenarioTableBody.innerHTML = '';
  const base = scenarios.find((row) => row.scenarioId === 'BASE')?.retirementPay ?? 0;
  const best = scenarios.reduce((acc, cur) => (cur.retirementPay > acc.retirementPay ? cur : acc), scenarios[0]);

  scenarios.forEach((row) => {
    const delta = row.retirementPay - base;
    const deltaText = `${delta >= 0 ? '+' : ''}${formatWon(delta)}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="${best.scenarioId === row.scenarioId ? 'scenario-best' : ''}">${row.label}</td>
      <td>${formatWon(row.averageMonthlyWage)}</td>
      <td>${row.yearsWorked.toFixed(4)}년</td>
      <td>${formatWon(row.retirementPay)}</td>
      <td>${deltaText}</td>
    `;
    scenarioTableBody.appendChild(tr);
  });

  resultSummary.textContent = `기본 시나리오 대비 최적 시나리오: ${best.label} (${formatWon(best.retirementPay)})`;
}

function runSimulation() {
  const employee = getEmployee();
  if (!employee) {
    resultSummary.textContent = '직원을 선택해주세요.';
    return;
  }

  renderMeta(employee);
  renderLeaveHistory(employee);
  renderPayroll(employee);

  const result = calculateRetirementPayEngine({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
    includeAllowances: allowanceToggle.checked,
    useLeaveCorrection: leaveCorrectionToggle.checked,
  });

  renderKpis(result);
  logBox.textContent = result.logs.join('\n');

  const scenarios = runScenarioComparison({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
  });
  renderScenarioTable(scenarios);
}

async function copyLogs() {
  try {
    await navigator.clipboard.writeText(logBox.textContent || '');
    copyLogsButton.textContent = '복사 완료';
  } catch {
    copyLogsButton.textContent = '복사 실패';
  } finally {
    setTimeout(() => {
      copyLogsButton.textContent = '로그 복사';
    }, 1200);
  }
}

renderEmployeeOptions();
employeeSelect.addEventListener('change', runSimulation);
runButton.addEventListener('click', runSimulation);
copyLogsButton.addEventListener('click', copyLogs);
runSimulation();
