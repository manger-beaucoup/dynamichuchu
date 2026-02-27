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
const resultBox = document.getElementById('result');
const logBox = document.getElementById('calcLogs');
const scenarioTableBody = document.getElementById('scenarioRows');

const formatter = new Intl.NumberFormat('ko-KR');

function initEmployeeOptions() {
  for (const employee of employeeTable) {
    const option = document.createElement('option');
    option.value = employee.employeeId;
    option.textContent = `${employee.employeeId} - ${employee.name}`;
    employeeSelect.appendChild(option);
  }
}

function renderScenarioTable(rows) {
  scenarioTableBody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.label}</td>
      <td>${formatter.format(Math.round(row.averageMonthlyWage))}원</td>
      <td>${row.yearsWorked.toFixed(2)}년</td>
      <td><strong>${formatter.format(Math.round(row.retirementPay))}원</strong></td>
    `;
    scenarioTableBody.appendChild(tr);
  });
}

function run() {
  const employeeId = employeeSelect.value;
  const employee = employeeTable.find((row) => row.employeeId === employeeId);
  if (!employee) {
    resultBox.textContent = '직원을 선택해주세요.';
    return;
  }

  const useLeaveCorrection = leaveCorrectionToggle.checked;
  const includeAllowances = allowanceToggle.checked;

  const result = calculateRetirementPayEngine({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
    includeAllowances,
    useLeaveCorrection,
  });

  resultBox.innerHTML = `
    <div>최종 퇴직금: <strong>${formatter.format(Math.round(result.retirementPay))}원</strong></div>
    <div class="sub">평균월임금 ${formatter.format(Math.round(result.averageWage.averageMonthlyWage))}원 × 근속 ${result.tenure.yearsWorked.toFixed(4)}년</div>
  `;

  logBox.textContent = result.logs.join('\n');

  const comparison = runScenarioComparison({
    employee,
    payrollTable,
    leaveHistory: leaveHistoryTable,
    correctionRules: correctionRuleTable,
  });
  renderScenarioTable(comparison);
}

initEmployeeOptions();
runButton.addEventListener('click', run);
run();
