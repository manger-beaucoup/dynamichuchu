# 퇴직금 시뮬레이터 명세 (SPEC)

## 1) 목적
실무용 퇴직금 시뮬레이터를 제공한다. 목표는 **정확성**, **재현성**, **감사 대응성**이다.

## 2) 핵심 출력
1. 최종 퇴직금
2. 중간 산식 로그
   - 근속 계산 과정
   - 평균임금 계산 과정
3. 시나리오 3종 비교표
   - 기본
   - 휴직보정
   - 임금피크

## 3) 평균임금 기본식 (회사 내규)
평균월임금 = (직전 3개월 급여 / 3) + (직전 1년 상여 / 12) + (수당 규정 반영 옵션)

## 4) 데이터 모델(테이블)
### 4.1 인적/기본정보
- employeeId
- name
- hireDate
- retireDate
- retirementReason
- targetType

### 4.2 급여지급내역
- employeeId
- month (YYYY-MM)
- baseSalary
- allowances
- bonus

### 4.3 휴직/변동이력
- employeeId
- leaveType
- startMonth
- endMonth
- includeInService (근속 산입 여부)
- correctionRuleId (보정 규칙 식별자)

### 4.4 휴직 보정 규칙 테이블
- ruleId
- ruleName
- strategy (NONE, PRIOR_3M_AVERAGE, FIXED_RATE)
- fixedRate (strategy가 FIXED_RATE인 경우)
- enabled

## 5) 계산 엔진 모듈 분리
- `tenure` 모듈: 근속기간 산출(휴직 산입 여부 반영)
- `averageWage` 모듈: 평균월임금 산출(3개월 급여 + 1년 상여 + 수당 옵션)
- `retirementPay` 모듈: 퇴직금 산출 및 로그 생성
- `scenarioRunner` 모듈: 기본/휴직보정/임금피크 시나리오 비교

## 6) 휴직 보정 요구사항
- 급여가 비어 있거나 급감한 휴직 구간을 처리해야 한다.
- 보정 규칙 테이블 기반으로 동작한다.
- UI에서 휴직 보정 토글이 가능해야 한다.

## 7) 샘플/검증 데이터
- 샘플 직원 3명 제공
- 케이스별 급여/휴직 이력 포함
- 계산 검증용 테스트 케이스 제공
