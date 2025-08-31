USE PlaywrightE2E;
GO

;WITH CaseSteps AS (
  SELECT
    c.Id AS CaseId, c.Name AS CaseName, cat.Name AS CategoryName,
    s.Id AS StepId, s.Ordinal AS StepNo, s.StepName
  FROM dbo.TestSteps s
  JOIN dbo.TestCases c ON c.Id=s.CaseId
  JOIN dbo.TestCategories cat ON cat.Id=c.CategoryId
),
Loops AS (
  SELECT ds.CaseId, ds.Id AS DataSetId, ds.Name AS GroupName, ds.Ordinal AS LoopIndex
  FROM dbo.DataSets ds
  UNION ALL
  SELECT c.Id, NULL, N'Default', 1
  FROM dbo.TestCases c
  JOIN dbo.TestCategories cat ON cat.Id=c.CategoryId AND cat.Name='KeywordDriven'
  WHERE NOT EXISTS (SELECT 1 FROM dbo.DataSets d WHERE d.CaseId=c.Id)
),
UnifiedParams AS (
  -- 汇总两大来源为统一三列 (ParamKey, ParamValue, ValueType)
  SELECT
    cs.CaseName, cs.CategoryName,
    l.LoopIndex, l.GroupName, l.DataSetId,
    cs.StepNo, cs.StepName,
    src.ParamKey, src.ParamValue, src.ValueType
  FROM CaseSteps cs
  JOIN Loops l ON l.CaseId=cs.CaseId
  OUTER APPLY (
    SELECT d.ParamKey, ddv.ParamValue, ddv.ValueType
    FROM dbo.StepParamDefs d
    JOIN dbo.TestCases cdd ON cdd.Id=cs.CaseId
    JOIN dbo.TestCategories tdd ON tdd.Id=cdd.CategoryId AND tdd.Name='DataDriven'
    LEFT JOIN dbo.DataDrivenValues ddv ON ddv.DataSetId=l.DataSetId AND ddv.ParamKey=d.ParamKey
    WHERE d.StepId=cs.StepId

    UNION ALL

    SELECT ksv.ParamKey, ksv.ParamValue, ksv.ValueType
    FROM dbo.KeywordStepValues ksv
    JOIN dbo.TestCases ckd ON ckd.Id=cs.CaseId
    JOIN dbo.TestCategories tkd ON tkd.Id=ckd.CategoryId AND tkd.Name='KeywordDriven'
    WHERE ksv.StepId=cs.StepId
      AND ksv.CaseId=cs.CaseId
      AND (
           ksv.DataSetId = l.DataSetId
           OR (ksv.DataSetId IS NULL AND NOT EXISTS (
                 SELECT 1 FROM dbo.KeywordStepValues k2
                 WHERE k2.CaseId=ksv.CaseId AND k2.StepId=ksv.StepId AND k2.DataSetId=l.DataSetId
               ))
          )
  ) src
)
SELECT
  CategoryName AS [Test Category],
  CaseName     AS [Test Case],
  LoopIndex    AS [Loop],
  GroupName    AS [DataSet Name],
  StepNo       AS [Test Step],
  StepName     AS [Step Name],
  ParamKey     AS [Param Key],
  ParamValue   AS [Param Value],
  ValueType    AS [Type]
FROM UnifiedParams
ORDER BY [Test Category], [Test Case], [Loop], [Test Step], [Param Key];