USE PlaywrightE2E;
GO

;WITH ParamRank AS (
  SELECT
    s.Id AS StepId,
    d.ParamKey,
    ROW_NUMBER() OVER (PARTITION BY s.Id ORDER BY d.ParamOrder, d.ParamKey) AS rn
  FROM dbo.TestSteps s
  LEFT JOIN dbo.StepParamDefs d
    ON d.StepId = s.Id
),
Pivot3 AS (
  SELECT
    pr.StepId,
    MAX(CASE WHEN pr.rn = 1 THEN pr.ParamKey END) AS Para1,
    MAX(CASE WHEN pr.rn = 2 THEN pr.ParamKey END) AS Para2,
    MAX(CASE WHEN pr.rn = 3 THEN pr.ParamKey END) AS Para3
  FROM ParamRank pr
  GROUP BY pr.StepId
)
SELECT
  tcg.Name  AS [Test Category],
  tc.Name   AS [Test Case],
  s.Ordinal AS [Test Step],
  s.StepName AS [Step Name],
  p.Para1,
  p.Para2,
  p.Para3
FROM dbo.TestSteps s
JOIN dbo.TestCases tc
  ON tc.Id = s.CaseId
JOIN dbo.TestCategories tcg
  ON tcg.Id = tc.CategoryId
LEFT JOIN Pivot3 p
  ON p.StepId = s.Id
ORDER BY
  [Test Category],
  -- 如果你的 Test Case 是数字编号，下面这一行可以改成 TRY_CAST(tc.Name AS INT)
  tc.Name,
  [Test Step];