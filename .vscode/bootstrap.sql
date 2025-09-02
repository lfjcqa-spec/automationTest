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

/* ========== 1) 重建数据库（谨慎执行，会清空旧数据） ========== */
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

/* ========== 2) 配置表：定义测试套件/用例/步骤 ========== */

-- 套件主表
CREATE TABLE dbo.TestSuite(
  SuiteId     INT IDENTITY(1,1) PRIMARY KEY,
  SuiteName   NVARCHAR(200) NOT NULL,
  IsActive    BIT NOT NULL DEFAULT(1),
  BrowserType NVARCHAR(50) NULL   -- 'chromium'/'chrome'/'edge'
);

-- 套件与用例映射
CREATE TABLE dbo.SuiteCases(
  Id           BIGINT IDENTITY(1,1) PRIMARY KEY,
  SuiteId      INT NOT NULL,
  CaseCategory NVARCHAR(20) NOT NULL,   -- 'DD' or 'KD'
  CaseName     NVARCHAR(200) NOT NULL,
  SortOrder    INT NOT NULL DEFAULT(1),
  FOREIGN KEY (SuiteId) REFERENCES dbo.TestSuite(SuiteId)
);

-- 数据驱动用例
CREATE TABLE dbo.DDCase(
  CaseName NVARCHAR(200) NOT NULL,
  Step     INT NOT NULL,
  StepName NVARCHAR(200) NOT NULL,
  CONSTRAINT PK_DDCase PRIMARY KEY (CaseName, Step)
);

-- 数据驱动测试数据
CREATE TABLE dbo.DDCase_TestData(
  Id          BIGINT IDENTITY(1,1) PRIMARY KEY,
  CaseName    NVARCHAR(200) NOT NULL,
  LoopOrdinal INT NOT NULL,
  LoopName    NVARCHAR(200) NULL,
  name        NVARCHAR(MAX) NULL,
  pwd         NVARCHAR(MAX) NULL,
  prodCode    NVARCHAR(MAX) NULL,
  prodName    NVARCHAR(MAX) NULL
);

-- 关键字驱动用例
CREATE TABLE dbo.KDCase(
  Id        BIGINT IDENTITY(1,1) PRIMARY KEY,
  CaseName  NVARCHAR(200) NOT NULL,
  Step      INT NOT NULL,
  StepName  NVARCHAR(200) NOT NULL,
  name      NVARCHAR(MAX) NULL,
  pwd       NVARCHAR(MAX) NULL,
  numOfMenu NVARCHAR(MAX) NULL,
  balance   NVARCHAR(MAX) NULL,
  prodCode  NVARCHAR(MAX) NULL,
  prodName  NVARCHAR(MAX) NULL,
  prodSize  NVARCHAR(MAX) NULL
);
CREATE INDEX IX_KDCase_Case_Step ON dbo.KDCase(CaseName, Step);

/* ========== 3) 执行结果表 ========== */

CREATE TABLE dbo.SuiteResults (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ExecutionNo BIGINT NOT NULL,
  SuiteName NVARCHAR(200),
  BrowserType NVARCHAR(50),
  Status NVARCHAR(20),
  StartedAt DATETIME DEFAULT GETDATE(),
  FinishedAt DATETIME NULL
);

CREATE TABLE dbo.CaseResults (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ExecutionNo BIGINT NOT NULL,
  SuiteName NVARCHAR(200),
  CaseName NVARCHAR(200),
  Status NVARCHAR(20),
  StartedAt DATETIME DEFAULT GETDATE(),
  FinishedAt DATETIME NULL
);

CREATE TABLE dbo.StepResults (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ExecutionNo BIGINT NOT NULL,
  SuiteName NVARCHAR(200),
  CaseName NVARCHAR(200),
  StepName NVARCHAR(200),
  Status NVARCHAR(20),
  ErrorMessage NVARCHAR(MAX) NULL,
  CreatedAt DATETIME DEFAULT GETDATE()
);
GO

/* ========== 4) 插入示例数据 ========== */

-- Suite 1: SmokeSuite
INSERT INTO dbo.TestSuite(SuiteName, IsActive, BrowserType) VALUES (N'SmokeSuite', 1, N'chrome');
DECLARE @sid1 INT = SCOPE_IDENTITY();

INSERT INTO dbo.SuiteCases(SuiteId,CaseCategory,CaseName,SortOrder) VALUES
(@sid1,N'DD',N'createProd',1),
(@sid1,N'KD',N'checkMenu',2),
(@sid1,N'KD',N'checkBalance',3),
(@sid1,N'KD',N'searchProduct',4);

-- DDCase 步骤
INSERT INTO dbo.DDCase(CaseName,Step,StepName) VALUES
(N'createProd',1,N'Login'),
(N'createProd',2,N'goToProdSection'),
(N'createProd',3,N'createProd'),
(N'createProd',4,N'Logout');

-- DDCase 测试数据
INSERT INTO dbo.DDCase_TestData(CaseName,LoopOrdinal,LoopName,name,pwd,prodCode,prodName) VALUES
(N'createProd',1,N'Row1',N'aa',N'aaPwd',N'pp1',N'ppName1'),
(N'createProd',2,N'Row2',N'bb',N'bbPwd',N'pp2',N'ppName2'),
(N'createProd',3,N'Row3',N'cc',N'ccPwd',N'pp3',N'ppName3'),
(N'createProd',4,N'Row4',N'dd',N'ccPwd',N'pp4',N'ppName4');

-- KD: checkMenu
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'checkMenu',1,N'Login',N'aa',N'aaPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,numOfMenu,prodCode) VALUES
(N'checkMenu',2,N'checkMenu',N'5',N'pp1');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'checkMenu',3,N'Logout');

-- KD: checkBalance
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'checkBalance',1,N'Login',N'bb',N'bbPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodCode) VALUES
(N'checkBalance',2,N'searchProduct',N'pp2');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,balance) VALUES
(N'checkBalance',3,N'checkBalance',N'9999');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'checkBalance',4,N'Logout');

-- KD: searchProduct
INSERT INTO dbo.KDCase(CaseName,Step,StepName,name,pwd) VALUES
(N'searchProduct',1,N'Login',N'cc',N'ccPwd');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodCode) VALUES
(N'searchProduct',2,N'searchProduct',N'pp3');
INSERT INTO dbo.KDCase(CaseName,Step,StepName,prodName,prodSize) VALUES
(N'searchProduct',3,N'checkProductInfor',N'ppName3',N'120');
INSERT INTO dbo.KDCase(CaseName,Step,StepName) VALUES
(N'searchProduct',4,N'Logout');

-- KD: knowProduct
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

-- Suite 2: RegressionSuite
INSERT INTO dbo.TestSuite(SuiteName, IsActive, BrowserType) VALUES (N'RegressionSuite', 1, N'edge');
DECLARE @sid2 INT = SCOPE_IDENTITY();

INSERT INTO dbo.SuiteCases(SuiteId,CaseCategory,CaseName,SortOrder) VALUES
(@sid2,N'DD',N'createProd',1),
(@sid2,N'KD',N'checkMenu',2),
(@sid2,N'KD',N'checkBalance',3),
(@sid2,N'KD',N'searchProduct',4),
(@sid2,N'KD',N'knowProduct',5);
GO

/* ========== View ========== */
IF OBJECT_ID('dbo.SuiteItems', 'V') IS NOT NULL
    DROP VIEW dbo.SuiteItems;
GO
CREATE VIEW dbo.SuiteItems AS
SELECT 
    sc.Id,
    sc.SuiteId,
    sc.CaseCategory,
    sc.CaseName,
    sc.SortOrder
FROM dbo.SuiteCases sc;
GO

IF OBJECT_ID('dbo.Suites', 'V') IS NOT NULL
    DROP VIEW dbo.Suites;
GO
CREATE VIEW dbo.Suites AS
SELECT 
    ts.SuiteId   AS Id,
    ts.SuiteName AS Name,
    ts.IsActive,
    ts.BrowserType
FROM dbo.TestSuite ts;
GO

/* ========== 5) 查询示例 ========== */

-- 查询所有 ExecutionNo 历史
SELECT ExecutionNo, COUNT(*) AS Records
FROM dbo.StepResults
GROUP BY ExecutionNo
ORDER BY ExecutionNo DESC;

-- 某次执行的所有 Case + Step
DECLARE @ExecutionNo BIGINT = 1756824143407;
SELECT
  sr.ExecutionNo,
  sr.SuiteName,
  sr.BrowserType,
  cr.CaseName,
  cr.Status AS CaseStatus,
  st.StepName,
  st.Status AS StepStatus,
  st.ErrorMessage,
  st.CreatedAt
FROM dbo.SuiteResults sr
JOIN dbo.CaseResults cr
  ON sr.ExecutionNo = cr.ExecutionNo AND sr.SuiteName = cr.SuiteName
JOIN dbo.StepResults st
  ON cr.ExecutionNo = st.ExecutionNo
 AND cr.SuiteName   = st.SuiteName
 AND cr.CaseName    = st.CaseName
WHERE sr.ExecutionNo = @ExecutionNo
ORDER BY sr.SuiteName, cr.CaseName, st.CreatedAt;

-- 某次执行的 Suite 执行情况汇总
SELECT
  sr.ExecutionNo,
  sr.SuiteName,
  sr.BrowserType,
  sr.Status,
  sr.StartedAt,
  sr.FinishedAt
FROM dbo.SuiteResults sr
WHERE sr.ExecutionNo = @ExecutionNo
ORDER BY sr.SuiteName;