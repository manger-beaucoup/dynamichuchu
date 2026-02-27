Attribute VB_Name = "RetirementCalculator"
Option Explicit

' =========================
' Practical Retirement Pay Calculator (VBA)
' =========================
' Required worksheets:
' 1) Employees   : A=EmployeeId, B=Name, C=HireDate, D=RetireDate, E=RetirementReason, F=TargetType
' 2) Payroll     : A=EmployeeId, B=Month(yyyy-mm), C=BaseSalary, D=Allowances, E=Bonus
' 3) LeaveHistory: A=EmployeeId, B=LeaveType, C=StartMonth(yyyy-mm), D=EndMonth(yyyy-mm), E=IncludeInService(TRUE/FALSE), F=CorrectionRuleId
' 4) Rules       : A=RuleId, B=RuleName, C=Strategy(NONE|PRIOR_3M_AVERAGE|FIXED_RATE), D=FixedRate, E=Enabled(TRUE/FALSE)
' 5) Output      : output area for scenarios/logs

Private Type RetirementResult
    RetirementPay As Double
    AverageMonthlyWage As Double
    YearsWorked As Double
    RecognizedDays As Long
    Logs As String
End Type

Public Sub SetupSampleData()
    Dim wsE As Worksheet, wsP As Worksheet, wsL As Worksheet, wsR As Worksheet, wsO As Worksheet

    Set wsE = EnsureSheet("Employees")
    Set wsP = EnsureSheet("Payroll")
    Set wsL = EnsureSheet("LeaveHistory")
    Set wsR = EnsureSheet("Rules")
    Set wsO = EnsureSheet("Output")

    wsE.Cells.Clear
    wsP.Cells.Clear
    wsL.Cells.Clear
    wsR.Cells.Clear
    wsO.Cells.Clear

    wsE.Range("A1:F1").Value = Array("EmployeeId", "Name", "HireDate", "RetireDate", "RetirementReason", "TargetType")
    wsE.Range("A2:F4").Value = Array( _
        Array("E001", "김민준", DateSerial(2018, 1, 15), DateSerial(2025, 6, 30), "정년", "일반"), _
        Array("E002", "박서연", DateSerial(2019, 3, 1), DateSerial(2025, 6, 30), "권고사직", "일반"), _
        Array("E003", "이도윤", DateSerial(2016, 7, 1), DateSerial(2025, 6, 30), "정년", "임금피크") _
    )

    wsP.Range("A1:E1").Value = Array("EmployeeId", "Month", "BaseSalary", "Allowances", "Bonus")
    wsP.Range("A2:E15").Value = Array( _
        Array("E001", "2025-04", 3500000, 300000, 0), _
        Array("E001", "2025-05", 3500000, 300000, 0), _
        Array("E001", "2025-06", 3500000, 300000, 1200000), _
        Array("E001", "2024-12", 3400000, 250000, 2400000), _
        Array("E002", "2025-04", 0, 0, 0), _
        Array("E002", "2025-05", 1500000, 0, 0), _
        Array("E002", "2025-06", 1500000, 0, 300000), _
        Array("E002", "2025-02", 3000000, 200000, 0), _
        Array("E002", "2025-03", 3000000, 200000, 0), _
        Array("E002", "2024-12", 2900000, 200000, 1200000), _
        Array("E003", "2025-04", 2800000, 150000, 0), _
        Array("E003", "2025-05", 2800000, 150000, 0), _
        Array("E003", "2025-06", 2800000, 150000, 1800000), _
        Array("E003", "2024-12", 3000000, 200000, 2400000) _
    )

    wsL.Range("A1:F1").Value = Array("EmployeeId", "LeaveType", "StartMonth", "EndMonth", "IncludeInService", "CorrectionRuleId")
    wsL.Range("A2:F4").Value = Array( _
        Array("E002", "육아휴직", "2025-04", "2025-05", True, "RULE_PRIOR_3M"), _
        Array("E002", "무급휴직", "2023-07", "2023-07", False, ""), _
        Array("E003", "교육휴직", "2022-01", "2022-01", True, "") _
    )

    wsR.Range("A1:E1").Value = Array("RuleId", "RuleName", "Strategy", "FixedRate", "Enabled")
    wsR.Range("A2:E4").Value = Array( _
        Array("RULE_NONE", "보정 없음", "NONE", "", True), _
        Array("RULE_PRIOR_3M", "직전 3개월 평균으로 대체", "PRIOR_3M_AVERAGE", "", True), _
        Array("RULE_FIXED_80", "정상임금의 80% 반영", "FIXED_RATE", 0.8, True) _
    )

    wsO.Range("A1:B1").Value = Array("Input", "Value")
    wsO.Range("A2:B4").Value = Array( _
        Array("EmployeeId", "E002"), _
        Array("UseLeaveCorrection", True), _
        Array("IncludeAllowances", True) _
    )

    wsE.Columns.AutoFit
    wsP.Columns.AutoFit
    wsL.Columns.AutoFit
    wsR.Columns.AutoFit
    wsO.Columns.AutoFit

    MsgBox "샘플 데이터 구성이 완료되었습니다.", vbInformation
End Sub

Public Sub RunRetirementSimulation()
    Dim wsO As Worksheet
    Dim employeeId As String
    Dim useLeaveCorrection As Boolean
    Dim includeAllowances As Boolean
    Dim scenarios(1 To 3) As RetirementResult
    Dim labels(1 To 3) As String
    Dim i As Long, basePay As Double

    Set wsO = EnsureSheet("Output")

    employeeId = CStr(wsO.Range("B2").Value)
    useLeaveCorrection = CBool(wsO.Range("B3").Value)
    includeAllowances = CBool(wsO.Range("B4").Value)

    If Len(employeeId) = 0 Then
        MsgBox "Output!B2에 EmployeeId를 입력하세요.", vbExclamation
        Exit Sub
    End If

    labels(1) = "기본"
    labels(2) = "휴직보정"
    labels(3) = "임금피크"

    scenarios(1) = CalculateRetirementPay(employeeId, includeAllowances, False)
    scenarios(2) = CalculateRetirementPay(employeeId, includeAllowances, True)
    scenarios(3) = CalculateRetirementPay(employeeId, False, True)

    wsO.Range("D1:H1").Value = Array("시나리오", "평균월임금", "근속연수", "퇴직금", "기본 대비")

    basePay = scenarios(1).RetirementPay

    For i = 1 To 3
        wsO.Cells(i + 1, 4).Value = labels(i)
        wsO.Cells(i + 1, 5).Value = scenarios(i).AverageMonthlyWage
        wsO.Cells(i + 1, 6).Value = scenarios(i).YearsWorked
        wsO.Cells(i + 1, 7).Value = scenarios(i).RetirementPay
        wsO.Cells(i + 1, 8).Value = scenarios(i).RetirementPay - basePay
    Next i

    wsO.Range("D7").Value = "선택 옵션 결과"
    wsO.Range("D8").Value = "최종 퇴직금"
    wsO.Range("E8").Value = CalculateRetirementPay(employeeId, includeAllowances, useLeaveCorrection).RetirementPay

    wsO.Range("D10").Value = "중간 산식 로그"
    wsO.Range("D11").Value = CalculateRetirementPay(employeeId, includeAllowances, useLeaveCorrection).Logs
    wsO.Range("D11").WrapText = True

    wsO.Range("E2:E8").NumberFormat = "#,##0"
    wsO.Range("F2:F4").NumberFormat = "0.0000"
    wsO.Range("H2:H4").NumberFormat = "+#,##0;-#,##0;0"

    wsO.Columns("D:H").AutoFit

    MsgBox "퇴직금 시뮬레이션 완료", vbInformation
End Sub

Private Function CalculateRetirementPay(ByVal employeeId As String, ByVal includeAllowances As Boolean, ByVal useLeaveCorrection As Boolean) As RetirementResult
    Dim result As RetirementResult
    Dim tenureYears As Double, recognizedDays As Long, tenureLog As String
    Dim averageWage As Double, averageLog As String

    tenureYears = CalculateTenureYears(employeeId, recognizedDays, tenureLog)
    averageWage = CalculateAverageMonthlyWage(employeeId, includeAllowances, useLeaveCorrection, averageLog)

    result.RetirementPay = averageWage * tenureYears
    result.AverageMonthlyWage = averageWage
    result.YearsWorked = tenureYears
    result.RecognizedDays = recognizedDays
    result.Logs = tenureLog & vbCrLf & averageLog & vbCrLf & _
                  "퇴직금 = 평균월임금(" & Format(averageWage, "#,##0") & ") × 근속연수(" & Format(tenureYears, "0.0000") & ")" & vbCrLf & _
                  "최종 퇴직금: " & Format(result.RetirementPay, "#,##0") & "원"

    CalculateRetirementPay = result
End Function

Private Function CalculateTenureYears(ByVal employeeId As String, ByRef recognizedDays As Long, ByRef logText As String) As Double
    Dim wsE As Worksheet, wsL As Worksheet
    Dim hireDate As Date, retireDate As Date
    Dim totalDays As Long, excludedDays As Long
    Dim lastRow As Long, i As Long

    Set wsE = Worksheets("Employees")
    Set wsL = Worksheets("LeaveHistory")

    hireDate = GetEmployeeDate(employeeId, 3)
    retireDate = GetEmployeeDate(employeeId, 4)

    totalDays = DateDiff("d", hireDate, retireDate) + 1
    excludedDays = 0

    lastRow = wsL.Cells(wsL.Rows.Count, "A").End(xlUp).Row
    For i = 2 To lastRow
        If CStr(wsL.Cells(i, 1).Value) = employeeId Then
            If CBool(wsL.Cells(i, 5).Value) = False Then
                excludedDays = excludedDays + MonthsBetween(CStr(wsL.Cells(i, 3).Value), CStr(wsL.Cells(i, 4).Value)) * 30
            End If
        End If
    Next i

    recognizedDays = WorksheetFunction.Max(totalDays - excludedDays, 0)
    CalculateTenureYears = recognizedDays / 365#

    logText = "근속 원천 일수: " & totalDays & "일" & vbCrLf & _
              "비산입 휴직 제외: " & excludedDays & "일" & vbCrLf & _
              "인정 근속일수: " & recognizedDays & "일" & vbCrLf & _
              "인정 근속연수: " & Format(CalculateTenureYears, "0.0000") & "년"
End Function

Private Function CalculateAverageMonthlyWage(ByVal employeeId As String, ByVal includeAllowances As Boolean, ByVal useLeaveCorrection As Boolean, ByRef logText As String) As Double
    Dim wsE As Worksheet, wsP As Worksheet, wsL As Worksheet, wsR As Worksheet
    Dim retireDate As Date, retireMonth As String
    Dim targetMonths(1 To 3) As String
    Dim i As Long, originalAmt As Double, adjustedAmt As Double
    Dim threeMonthSum As Double, bonus12Sum As Double
    Dim row As Long, lastRow As Long
    Dim ruleId As String, ruleStrategy As String, fixedRate As Double
    Dim refAvg As Double

    Set wsE = Worksheets("Employees")
    Set wsP = Worksheets("Payroll")
    Set wsL = Worksheets("LeaveHistory")
    Set wsR = Worksheets("Rules")

    retireDate = GetEmployeeDate(employeeId, 4)
    retireMonth = Format(retireDate, "yyyy-mm")

    targetMonths(1) = ShiftMonth(retireMonth, -2)
    targetMonths(2) = ShiftMonth(retireMonth, -1)
    targetMonths(3) = retireMonth

    logText = "대상 3개월: " & targetMonths(1) & ", " & targetMonths(2) & ", " & targetMonths(3) & vbCrLf

    For i = 1 To 3
        originalAmt = GetPayrollMonthlyWage(employeeId, targetMonths(i), includeAllowances)
        adjustedAmt = originalAmt

        If useLeaveCorrection Then
            ruleId = GetLeaveRuleId(employeeId, targetMonths(i), wsL)
            If Len(ruleId) > 0 Then
                ruleStrategy = GetRuleText(ruleId, 3, wsR)
                fixedRate = Val(GetRuleText(ruleId, 4, wsR))
                refAvg = GetReferenceThreeMonthAverage(employeeId, retireMonth, includeAllowances)

                Select Case UCase$(ruleStrategy)
                    Case "PRIOR_3M_AVERAGE"
                        adjustedAmt = WorksheetFunction.Max(originalAmt, refAvg)
                    Case "FIXED_RATE"
                        adjustedAmt = WorksheetFunction.Max(originalAmt, refAvg * fixedRate)
                    Case Else
                        adjustedAmt = originalAmt
                End Select
            End If
        End If

        threeMonthSum = threeMonthSum + adjustedAmt
        logText = logText & "- " & targetMonths(i) & ": 원본 " & Format(originalAmt, "#,##0") & " / 반영 " & Format(adjustedAmt, "#,##0") & vbCrLf
    Next i

    lastRow = wsP.Cells(wsP.Rows.Count, "A").End(xlUp).Row
    For row = 2 To lastRow
        If CStr(wsP.Cells(row, 1).Value) = employeeId Then
            If MonthsBetween(CStr(wsP.Cells(row, 2).Value), retireMonth) <= 11 Then
                bonus12Sum = bonus12Sum + CDbl(Val(wsP.Cells(row, 5).Value))
            End If
        End If
    Next row

    CalculateAverageMonthlyWage = threeMonthSum / 3# + bonus12Sum / 12#

    logText = logText & "3개월 급여합: " & Format(threeMonthSum, "#,##0") & "원" & vbCrLf & _
              "1년 상여합: " & Format(bonus12Sum, "#,##0") & "원" & vbCrLf & _
              "평균월임금: " & Format(CalculateAverageMonthlyWage, "#,##0") & "원"
End Function

Private Function GetReferenceThreeMonthAverage(ByVal employeeId As String, ByVal retireMonth As String, ByVal includeAllowances As Boolean) As Double
    Dim m1 As String, m2 As String, m3 As String
    m1 = ShiftMonth(retireMonth, -4)
    m2 = ShiftMonth(retireMonth, -5)
    m3 = ShiftMonth(retireMonth, -6)

    GetReferenceThreeMonthAverage = ( _
        GetPayrollMonthlyWage(employeeId, m1, includeAllowances) + _
        GetPayrollMonthlyWage(employeeId, m2, includeAllowances) + _
        GetPayrollMonthlyWage(employeeId, m3, includeAllowances) _
    ) / 3#
End Function

Private Function GetPayrollMonthlyWage(ByVal employeeId As String, ByVal monthKey As String, ByVal includeAllowances As Boolean) As Double
    Dim wsP As Worksheet
    Dim lastRow As Long, i As Long
    Dim basePay As Double, allowances As Double

    Set wsP = Worksheets("Payroll")
    lastRow = wsP.Cells(wsP.Rows.Count, "A").End(xlUp).Row

    For i = 2 To lastRow
        If CStr(wsP.Cells(i, 1).Value) = employeeId And CStr(wsP.Cells(i, 2).Value) = monthKey Then
            basePay = CDbl(Val(wsP.Cells(i, 3).Value))
            allowances = CDbl(Val(wsP.Cells(i, 4).Value))
            If includeAllowances Then
                GetPayrollMonthlyWage = basePay + allowances
            Else
                GetPayrollMonthlyWage = basePay
            End If
            Exit Function
        End If
    Next i

    GetPayrollMonthlyWage = 0
End Function

Private Function GetLeaveRuleId(ByVal employeeId As String, ByVal monthKey As String, ByVal wsL As Worksheet) As String
    Dim lastRow As Long, i As Long
    Dim startM As String, endM As String

    lastRow = wsL.Cells(wsL.Rows.Count, "A").End(xlUp).Row
    For i = 2 To lastRow
        If CStr(wsL.Cells(i, 1).Value) = employeeId Then
            startM = CStr(wsL.Cells(i, 3).Value)
            endM = CStr(wsL.Cells(i, 4).Value)
            If IsMonthInRange(monthKey, startM, endM) Then
                GetLeaveRuleId = CStr(wsL.Cells(i, 6).Value)
                Exit Function
            End If
        End If
    Next i

    GetLeaveRuleId = ""
End Function

Private Function GetRuleText(ByVal ruleId As String, ByVal colIndex As Long, ByVal wsR As Worksheet) As String
    Dim lastRow As Long, i As Long
    lastRow = wsR.Cells(wsR.Rows.Count, "A").End(xlUp).Row

    For i = 2 To lastRow
        If CStr(wsR.Cells(i, 1).Value) = ruleId And CBool(wsR.Cells(i, 5).Value) = True Then
            GetRuleText = CStr(wsR.Cells(i, colIndex).Value)
            Exit Function
        End If
    Next i

    GetRuleText = ""
End Function

Private Function GetEmployeeDate(ByVal employeeId As String, ByVal colIndex As Long) As Date
    Dim wsE As Worksheet
    Dim lastRow As Long, i As Long

    Set wsE = Worksheets("Employees")
    lastRow = wsE.Cells(wsE.Rows.Count, "A").End(xlUp).Row

    For i = 2 To lastRow
        If CStr(wsE.Cells(i, 1).Value) = employeeId Then
            GetEmployeeDate = CDate(wsE.Cells(i, colIndex).Value)
            Exit Function
        End If
    Next i

    Err.Raise vbObjectError + 510, , "Employee not found: " & employeeId
End Function

Private Function ShiftMonth(ByVal monthKey As String, ByVal offset As Long) As String
    Dim d As Date
    d = DateSerial(CInt(Left$(monthKey, 4)), CInt(Right$(monthKey, 2)), 1)
    d = DateAdd("m", offset, d)
    ShiftMonth = Format(d, "yyyy-mm")
End Function

Private Function MonthsBetween(ByVal fromMonth As String, ByVal toMonth As String) As Long
    Dim fromDate As Date, toDate As Date
    fromDate = DateSerial(CInt(Left$(fromMonth, 4)), CInt(Right$(fromMonth, 2)), 1)
    toDate = DateSerial(CInt(Left$(toMonth, 4)), CInt(Right$(toMonth, 2)), 1)
    MonthsBetween = DateDiff("m", fromDate, toDate)
End Function

Private Function IsMonthInRange(ByVal m As String, ByVal startM As String, ByVal endM As String) As Boolean
    IsMonthInRange = (MonthsBetween(startM, m) >= 0 And MonthsBetween(m, endM) >= 0)
End Function

Private Function EnsureSheet(ByVal sheetName As String) As Worksheet
    On Error Resume Next
    Set EnsureSheet = Worksheets(sheetName)
    On Error GoTo 0

    If EnsureSheet Is Nothing Then
        Set EnsureSheet = Worksheets.Add(After:=Worksheets(Worksheets.Count))
        EnsureSheet.Name = sheetName
    End If
End Function
