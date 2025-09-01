// e2e-auto/src/db/sql.ts
// 中文注释：定义所有 SQL 查询语句，使用参数化防止注入
export const SQL = {
  suites: `SELECT * FROM dbo.Suites WHERE IsActive=1`,
  cases: `SELECT * FROM dbo.SuiteItems WHERE SuiteId=@sid ORDER BY SortOrder`,
  ddSteps: `SELECT * FROM dbo.DDCase WHERE CaseName=@name ORDER BY Step`,
  ddData: `SELECT * FROM dbo.DDCase_TestData WHERE CaseName=@name ORDER BY LoopOrdinal`,
  kdSteps: `SELECT * FROM dbo.KDCase WHERE CaseName=@name ORDER BY Step`
};
