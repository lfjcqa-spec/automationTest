USE PlaywrightE2E;
GO

;WITH CaseSteps AS (
  SELECT
    c.Id           AS CaseId,
    c.Name         AS CaseName,
    cat.Name       AS CategoryName,
    s.Id           AS StepId,
    s.Ordinal      AS StepNo,
    s.StepName
  FROM dbo.TestSteps s
  JOIN dbo.TestCases c   ON c.Id = s.CaseId
  JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
),
Loops AS (
  -- 每个 Case 的 DataSets；KeywordDriven 无 DataSet 的也给虚拟 Default
  SELECT ds.CaseId, ds.Id AS DataSetId, ds.Name AS GroupName, ds.Ordinal AS LoopIndex
  FROM dbo.DataSets ds
  UNION ALL
  SELECT c.Id AS CaseId, NULL AS DataSetId, N'Default' AS GroupName, 1 AS LoopIndex
  FROM dbo.TestCases c
  JOIN dbo.TestCategories cat ON cat.Id=c.CategoryId AND cat.Name='KeywordDriven'
  WHERE NOT EXISTS (SELECT 1 FROM dbo.DataSets d WHERE d.CaseId=c.Id)
),
Params AS (
  -- 统一取出每个 Case × Loop × Step 的参数键值
  SELECT
    cs.CaseId, cs.CaseName, cs.CategoryName,
    l.DataSetId, l.GroupName, l.LoopIndex,
    cs.StepId, cs.StepNo, cs.StepName,
    -- 参数键值对拼成 JSON 片段
    JSON_QUERY(
      CASE 
        WHEN COUNT(*) = 0 THEN '{}'
        ELSE '{' + STRING_AGG('"' + REPLACE(src.ParamKey,'"','\"') + '":' + dbo.fn_FormatJsonValue(src.ParamValue, src.ValueType), ',') + '}'
      END
    ) AS ParamsJson
  FROM CaseSteps cs
  JOIN Loops l ON l.CaseId = cs.CaseId
  OUTER APPLY (
    -- DataDriven：按步骤需要的键，从该 DataSet 行取值
    SELECT d.ParamKey, ddv.ParamValue, ddv.ValueType
    FROM dbo.StepParamDefs d
    JOIN dbo.TestCases cdd ON cdd.Id = cs.CaseId
    JOIN dbo.TestCategories catdd ON catdd.Id = cdd.CategoryId AND catdd.Name='DataDriven'
    LEFT JOIN dbo.DataDrivenValues ddv ON ddv.DataSetId = l.DataSetId AND ddv.ParamKey = d.ParamKey
    WHERE d.StepId = cs.StepId

    UNION ALL

    -- KeywordDriven：该 Step 的参数；优先匹配同 DataSetId（如果该 Case 有 DataSet）
    SELECT ksv.ParamKey, ksv.ParamValue, ksv.ValueType
    FROM dbo.KeywordStepValues ksv
    JOIN dbo.TestCases ckd ON ckd.Id = cs.CaseId
    JOIN dbo.TestCategories catkd ON catkd.Id = ckd.CategoryId AND catkd.Name='KeywordDriven'
    WHERE ksv.StepId = cs.StepId
      AND ksv.CaseId = cs.CaseId
      AND (
           ksv.DataSetId = l.DataSetId
           OR (ksv.DataSetId IS NULL AND NOT EXISTS (
                 SELECT 1 FROM dbo.KeywordStepValues k2
                 WHERE k2.CaseId=ksv.CaseId AND k2.StepId=ksv.StepId AND k2.DataSetId = l.DataSetId
               ))
          )
  ) src
  GROUP BY
    cs.CaseId, cs.CaseName, cs.CategoryName,
    l.DataSetId, l.GroupName, l.LoopIndex,
    cs.StepId, cs.StepNo, cs.StepName
)
SELECT
  CategoryName      AS [Test Category],
  CaseName          AS [Test Case],
  LoopIndex         AS [Loop],
  GroupName         AS [DataSet Name],
  StepNo            AS [Test Step],
  StepName          AS [Step Name],
  ParamsJson        AS [Params]   -- 如 {"name":"aa","pwd":"aaPwd"} 或 {}
FROM Params
ORDER BY [Test Category], [Test Case], [Loop], [Test Step];