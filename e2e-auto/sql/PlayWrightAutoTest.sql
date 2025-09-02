/* ========== 重建数据库（谨慎执行） ========== */
USE master;
IF DB_ID(N'PlaywrightE2E') IS NOT NULL
BEGIN
  ALTER DATABASE PlaywrightE2E SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE PlaywrightE2E;
END;
GO
CREATE DATABASE PlaywrightE2E;
GO
USE PlaywrightE2E;
GO

/* 1) Suite 主表与映射表 */
CREATE TABLE dbo.TestSuite(
  SuiteId   INT IDENTITY(1,1) PRIMARY KEY,
  SuiteName NVARCHAR(200) NOT NULL,
  IsActive  BIT NOT NULL DEFAULT(1)
);
CREATE TABLE dbo.SuiteCases(
  Id           BIGINT IDENTITY(1,1) PRIMARY KEY,
  SuiteId      INT NOT NULL,
  CaseCategory NVARCHAR(20) NOT NULL,   -- 'DD' or 'KD'
  CaseName     NVARCHAR(200) NOT NULL,
  SortOrder    INT NOT NULL DEFAULT(1),
  FOREIGN KEY (SuiteId) REFERENCES dbo.TestSuite(SuiteId)
);

/* 2) DD 用例 */
CREATE TABLE dbo.DDCase(
  CaseName NVARCHAR(200) NOT NULL,
  Step     INT NOT NULL,
  StepName NVARCHAR(200) NOT NULL,
  CONSTRAINT PK_DDCase PRIMARY KEY (CaseName, Step)
);
CREATE TABLE dbo.DDCase_TestData(
  Id          BIGINT IDENTITY(1,1) PRIMARY KEY,
  CaseName    NVARCHAR(200) NOT NULL,
  LoopOrdinal INT NOT NULL,          -- 第几轮
  LoopName    NVARCHAR(200) NULL,    -- 循环显示名
  -- 业务列（可继续加）
  name NVARCHAR(MAX) NULL,
  pwd  NVARCHAR(MAX) NULL,
  prodCode NVARCHAR(MAX) NULL,
  prodName NVARCHAR(MAX) NULL
);

/* 3) KD 用例（balance 拼写已修正） */
CREATE TABLE dbo.KDCase(
  Id        BIGINT IDENTITY(1,1) PRIMARY KEY,
  CaseName  NVARCHAR(200) NOT NULL,
  Step      INT NOT NULL,
  StepName  NVARCHAR(200) NOT NULL,
  -- 业务列（可继续加；框架动态枚举）
  name NVARCHAR(MAX) NULL,
  pwd  NVARCHAR(MAX) NULL,
  numOfMenu NVARCHAR(MAX) NULL,
  balance NVARCHAR(MAX) NULL,       -- ✅ 修正拼写
  prodCode NVARCHAR(MAX) NULL,
  prodName NVARCHAR(MAX) NULL,
  prodSize NVARCHAR(MAX) NULL
);
CREATE INDEX IX_KDCase_Case_Step ON dbo.KDCase(CaseName, Step);
GO

/* 4) 视图（仅供 SELECT） */
IF OBJECT_ID('dbo.vw_DD_Loops') IS NOT NULL DROP VIEW dbo.vw_DD_Loops;
GO
CREATE VIEW dbo.vw_DD_Loops AS
SELECT
  d.Id AS RowId,
  d.CaseName,
  d.LoopOrdinal,
  COALESCE(d.LoopName, CONCAT('Row', d.LoopOrdinal)) AS LoopName
FROM dbo.DDCase_TestData d;
GO

/* 5) 兼容视图：让旧代码可查 dbo.Suites / dbo.SuiteItems（只读） */
IF OBJECT_ID('dbo.Suites', 'V') IS NOT NULL DROP VIEW dbo.Suites;
IF OBJECT_ID('dbo.SuiteItems', 'V') IS NOT NULL DROP VIEW dbo.SuiteItems;
GO
CREATE VIEW dbo.Suites AS
SELECT ts.SuiteId AS Id, ts.SuiteName AS Name, ts.IsActive
FROM dbo.TestSuite ts;
GO
CREATE VIEW dbo.SuiteItems AS
SELECT sc.Id, sc.SuiteId, sc.CaseCategory, sc.CaseName, sc.SortOrder
FROM dbo.SuiteCases sc;
GO

/* 6) 示例数据 */

/* Suite 1: SmokeSuite */
INSERT INTO dbo.TestSuite(SuiteName, IsActive) VALUES (N'SmokeSuite', 1);
DECLARE @sid1 INT = SCOPE_IDENTITY();

INSERT INTO dbo.SuiteCases(SuiteId,CaseCategory,CaseName,SortOrder) VALUES
(@sid1,N'DD',N'createProd',1),
(@sid1,N'KD',N'checkMenu',2),
(@sid1,N'KD',N'checkBalance',3),      -- ✅ 拼写已修正
(@sid1,N'KD',N'searchProduct',4);

/* DD: 步骤 */
INSERT INTO dbo.DDCase(CaseName,Step,StepName) VALUES
(N'createProd',1,N'Login'),
(N'createProd',2,N'goToProdSection'),
(N'createProd',3,N'createProd'),
(N'createProd',4,N'Logout');

/* DD: 数据（4 行 = 4 轮） */
INSERT INTO dbo.DDCase_TestData(CaseName,LoopOrdinal,LoopName,name,pwd,prodCode,prodName) VALUES
(N'createProd',1,N'Row1',N'aa',N'aaPwd',N'pp1',N'ppName1'),
(N'createProd',2,N'Row2',N'bb',N'bbPwd',N'pp2',N'ppName2'),
(N'createProd',3,N'Row3',N'cc',N'ccPwd',N'pp3',N'ppName3'),
(N'createProd',4,N'Row4',N'dd',N'ccPwd',N'pp4',N'ppName4'); -- ✅ 新增第4轮

/* KD: checkMenu */
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'checkMenu',1,N'Login',N'aa',N'aaPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,numOfMenu,prodCode) VALUES
(N'checkMenu',2,N'checkMenu',N'5',N'pp1');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'checkMenu',3,N'Logout');

/* KD: checkBalance */
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'checkBalance',1,N'Login',N'bb',N'bbPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodCode) VALUES
(N'checkBalance',2,N'searchProduct',N'pp2');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,balance) VALUES
(N'checkBalance',3,N'checkBalance',N'9999');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'checkBalance',4,N'Logout');

/* KD: searchProduct */
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'searchProduct',1,N'Login',N'cc',N'ccPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodCode) VALUES
(N'searchProduct',2,N'searchProduct',N'pp3');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodName,prodSize) VALUES
(N'searchProduct',3,N'checkProductInfor',N'ppName3',N'120');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'searchProduct',4,N'Logout');

/* KD: knowProduct (新用例) */
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'knowProduct',1,N'Login',N'cc',N'ccPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodCode) VALUES
(N'knowProduct',2,N'searchProduct',N'pp3');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,balance) VALUES
(N'knowProduct',3,N'checkBalance',N'8888');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodName,prodSize) VALUES
(N'knowProduct',4,N'checkProductInfor',N'ppName3',N'120');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'knowProduct',5,N'Logout');

/* Suite 2: RegressionSuite (新增) */
INSERT INTO dbo.TestSuite(SuiteName, IsActive) VALUES (N'RegressionSuite', 1);
DECLARE @sid2 INT = SCOPE_IDENTITY();

INSERT INTO dbo.SuiteCases(SuiteId,CaseCategory,CaseName,SortOrder) VALUES
(@sid2,N'DD',N'createProd',1),
(@sid2,N'KD',N'checkMenu',2),
(@sid2,N'KD',N'checkBalance',3),
(@sid2,N'KD',N'searchProduct',4),
(@sid2,N'KD',N'knowProduct',5);
GO