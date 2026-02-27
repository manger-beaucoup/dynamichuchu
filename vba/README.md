# VBA 버전 사용법

## 1) 가져오기
1. Excel에서 `Alt + F11`로 VBA 편집기 실행
2. `File > Import File...`에서 `vba/RetirementCalculator.bas` 가져오기

## 2) 초기 데이터 구성
- `SetupSampleData` 매크로 실행
- 다음 시트가 자동 생성/초기화됩니다.
  - `Employees`
  - `Payroll`
  - `LeaveHistory`
  - `Rules`
  - `Output`

## 3) 계산 실행
- `Output` 시트에서 입력:
  - `B2`: EmployeeId (예: `E002`)
  - `B3`: UseLeaveCorrection (`TRUE/FALSE`)
  - `B4`: IncludeAllowances (`TRUE/FALSE`)
- `RunRetirementSimulation` 매크로 실행

## 4) 출력
- 시나리오 3종 비교표(기본/휴직보정/임금피크): `Output!D1:H4`
- 선택 옵션 최종 퇴직금: `Output!E8`
- 중간 산식 로그: `Output!D11`
