/* 0) 重建数据库：若存在则先删除 */
USE master;
GO
IF DB_ID(N'PlaywrightE2E') IS NOT NULL
BEGIN
ALTER DATABASE PlaywrightE2E SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE PlaywrightE2E;
END
GO
CREATE DATABASE PlaywrightE2E;
GO
USE PlaywrightE2E;
GO

/* 1) 表结构 */
CREATE TABLE dbo.TestCategories (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
Name NVARCHAR(50) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.Suites (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
Name NVARCHAR(200) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.TestCases (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
SuiteId BIGINT NOT NULL,
CategoryId BIGINT NOT NULL,
Name NVARCHAR(200) NOT NULL,
IsActive BIT NOT NULL DEFAULT(1),
Description NVARCHAR(1000) NULL,
CONSTRAINT FK_TestCases_Suite FOREIGN KEY (SuiteId) REFERENCES dbo.Suites(Id) ON DELETE CASCADE,
CONSTRAINT FK_TestCases_Category FOREIGN KEY (CategoryId) REFERENCES dbo.TestCategories(Id)
);
GO

/* 同一 Suite 下 Case 名称唯一 */
ALTER TABLE dbo.TestCases
ADD CONSTRAINT UQ_TestCases UNIQUE (SuiteId, Name);
GO

CREATE INDEX IX_TestCases_Suite ON dbo.TestCases(SuiteId);
GO

CREATE TABLE dbo.TestSteps (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
CaseId BIGINT NOT NULL,
Ordinal INT NOT NULL,
StepName NVARCHAR(200) NOT NULL,
CONSTRAINT FK_TestSteps_Case FOREIGN KEY (CaseId) REFERENCES dbo.TestCases(Id) ON DELETE CASCADE,
CONSTRAINT UQ_TestSteps_Case_Ordinal UNIQUE (CaseId, Ordinal)
);
GO
CREATE INDEX IX_TestSteps_Case ON dbo.TestSteps(CaseId);
GO

CREATE TABLE dbo.StepParamDefs (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
StepId BIGINT NOT NULL,
ParamKey NVARCHAR(200) NOT NULL,
ParamOrder INT NOT NULL DEFAULT(1),
CONSTRAINT FK_StepParamDefs_Step FOREIGN KEY (StepId) REFERENCES dbo.TestSteps(Id) ON DELETE CASCADE,
CONSTRAINT UQ_StepParamDefs UNIQUE (StepId, ParamKey)
);
GO
CREATE INDEX IX_StepParamDefs_Step ON dbo.StepParamDefs(StepId);
GO

CREATE TABLE dbo.DataSets (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
CaseId BIGINT NOT NULL,
Name NVARCHAR(200) NULL,
Ordinal INT NOT NULL,
CONSTRAINT FK_DataSets_Case FOREIGN KEY (CaseId) REFERENCES dbo.TestCases(Id) ON DELETE CASCADE,
CONSTRAINT UQ_DataSets_Case_Ordinal UNIQUE (CaseId, Ordinal)
);
GO
CREATE INDEX IX_DataSets_Case ON dbo.DataSets(CaseId);
GO

CREATE TABLE dbo.DataDrivenValues (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
DataSetId BIGINT NOT NULL,
ParamKey NVARCHAR(200) NOT NULL,
ParamValue NVARCHAR(MAX) NULL,
ValueType NVARCHAR(20) NOT NULL DEFAULT(N'string'),
CONSTRAINT FK_DDV_DataSet FOREIGN KEY (DataSetId) REFERENCES dbo.DataSets(Id) ON DELETE CASCADE,
CONSTRAINT CK_DDV_ValueType CHECK (ValueType IN (N'string',N'number',N'bool',N'json')),
CONSTRAINT UQ_DDV UNIQUE (DataSetId, ParamKey)
);
GO
CREATE INDEX IX_DDV_DataSet ON dbo.DataDrivenValues(DataSetId);
GO

CREATE TABLE dbo.KeywordStepValues (
Id BIGINT IDENTITY(1,1) PRIMARY KEY,
CaseId BIGINT NOT NULL,
StepId BIGINT NOT NULL,
DataSetId BIGINT NULL, -- 可为空（默认循环）
DataSetIdNorm AS (ISNULL(DataSetId, 0)) PERSISTED,
ParamKey NVARCHAR(200) NOT NULL,
ParamValue NVARCHAR(MAX) NULL,
ValueType NVARCHAR(20) NOT NULL DEFAULT(N'string'),
CONSTRAINT FK_KSV_Case FOREIGN KEY (CaseId) REFERENCES dbo.TestCases(Id) ON DELETE CASCADE,
CONSTRAINT FK_KSV_Step FOREIGN KEY (StepId) REFERENCES dbo.TestSteps(Id) ON DELETE NO ACTION,
CONSTRAINT FK_KSV_DataSet FOREIGN KEY (DataSetId) REFERENCES dbo.DataSets(Id) ON DELETE NO ACTION,
CONSTRAINT CK_KSV_ValueType CHECK (ValueType IN (N'string',N'number',N'bool',N'json')),
CONSTRAINT UQ_KSV UNIQUE (CaseId, StepId, DataSetIdNorm, ParamKey)
);
GO
CREATE INDEX IX_KSV_Step ON dbo.KeywordStepValues(StepId);
CREATE INDEX IX_KSV_DataSet ON dbo.KeywordStepValues(DataSetId);
GO

/* 2) 清理触发器：删除 Step 或 DataSet 时，清理其在 KeywordStepValues 的行 */
CREATE TRIGGER dbo.trg_TestSteps_Delete_Cleanup
ON dbo.TestSteps
AFTER DELETE
AS
BEGIN
SET NOCOUNT ON;
DELETE k
FROM dbo.KeywordStepValues k
JOIN deleted d ON d.Id = k.StepId;
END;
GO

CREATE TRIGGER dbo.trg_DataSets_Delete_Cleanup
ON dbo.DataSets
AFTER DELETE
AS
BEGIN
SET NOCOUNT ON;
DELETE k
FROM dbo.KeywordStepValues k
JOIN deleted d ON d.Id = k.DataSetId;
END;
GO

/* 3) JSON 值格式函数（调试/导出可用） */
CREATE FUNCTION dbo.fn_FormatJsonValue(@value NVARCHAR(MAX), @valueType NVARCHAR(20))
RETURNS NVARCHAR(MAX)
AS
BEGIN
DECLARE @out NVARCHAR(MAX);
IF @valueType IN (N'number', N'bool') SET @out=@value;
ELSE IF @valueType=N'json' SET @out=@value;
ELSE SET @out = '"' + REPLACE(REPLACE(@value, '"','"'), CHAR(13)+CHAR(10), '\n') + '"';
RETURN @out;
END;
GO

/* 4) 基础数据与示例用例 */
DECLARE
@suiteId BIGINT,
@catDD BIGINT, @catKD BIGINT,
@c1 BIGINT, @c1s1 BIGINT, @c1s2 BIGINT, @c1s3 BIGINT, @c1s4 BIGINT,
@c1ds1 BIGINT, @c1ds2 BIGINT, @c1ds3 BIGINT,
@k2 BIGINT, @k2s1 BIGINT, @k2s2 BIGINT, @k2s3 BIGINT,
@k3 BIGINT, @k3s1 BIGINT, @k3s2 BIGINT, @k3s3 BIGINT, @k3s4 BIGINT;

-- 分类与套件
INSERT INTO dbo.TestCategories(Name) VALUES (N'DataDriven'), (N'KeywordDriven');
INSERT INTO dbo.Suites(Name) VALUES (N'Demo');

SELECT @suiteId = Id FROM dbo.Suites WHERE Name=N'Demo';
SELECT @catDD = Id FROM dbo.TestCategories WHERE Name=N'DataDriven';
SELECT @catKD = Id FROM dbo.TestCategories WHERE Name=N'KeywordDriven';

-- Case1（DataDriven）
INSERT INTO dbo.TestCases(SuiteId, CategoryId, Name, IsActive) VALUES (@suiteId, @catDD, N'Case1', 1);
SET @c1 = SCOPE_IDENTITY();

-- 步骤：Login → goToProdSection → createProd → Logout
INSERT INTO dbo.TestSteps(CaseId, Ordinal, StepName) VALUES
(@c1,1,N'Login'),
(@c1,2,N'goToProdSection'),
(@c1,3,N'createProd'),
(@c1,4,N'Logout');

SELECT @c1s1 = Id FROM dbo.TestSteps WHERE CaseId=@c1 AND Ordinal=1;
SELECT @c1s2 = Id FROM dbo.TestSteps WHERE CaseId=@c1 AND Ordinal=2;
SELECT @c1s3 = Id FROM dbo.TestSteps WHERE CaseId=@c1 AND Ordinal=3;
SELECT @c1s4 = Id FROM dbo.TestSteps WHERE CaseId=@c1 AND Ordinal=4;

-- 参数键
INSERT INTO dbo.StepParamDefs(StepId, ParamKey, ParamOrder) VALUES
(@c1s1, N'name', 1),
(@c1s1, N'pwd', 2),
(@c1s3, N'prodCode', 1),
(@c1s3, N'prodName', 2);

-- 三个数据集
INSERT INTO dbo.DataSets(CaseId, Name, Ordinal) VALUES
(@c1,N'Row1',1),
(@c1,N'Row2',2),
(@c1,N'Row3',3);

SELECT @c1ds1=Id FROM dbo.DataSets WHERE CaseId=@c1 AND Ordinal=1;
SELECT @c1ds2=Id FROM dbo.DataSets WHERE CaseId=@c1 AND Ordinal=2;
SELECT @c1ds3=Id FROM dbo.DataSets WHERE CaseId=@c1 AND Ordinal=3;

-- 每个数据集的参数值
INSERT INTO dbo.DataDrivenValues(DataSetId,ParamKey,ParamValue,ValueType) VALUES
(@c1ds1,N'name',N'aa',N'string'),
(@c1ds1,N'pwd',N'aaPwd',N'string'),
(@c1ds1,N'prodCode',N'P001',N'string'),
(@c1ds1,N'prodName',N'Alpha',N'string'),

(@c1ds2,N'name',N'bb',N'string'),
(@c1ds2,N'pwd',N'bbPwd',N'string'),
(@c1ds2,N'prodCode',N'P002',N'string'),
(@c1ds2,N'prodName',N'Beta',N'string'),

(@c1ds3,N'name',N'cc',N'string'),
(@c1ds3,N'pwd',N'ccPwd',N'string'),
(@c1ds3,N'prodCode',N'P003',N'string'),
(@c1ds3,N'prodName',N'Gamma',N'string');

-- Case2（KeywordDriven）
INSERT INTO dbo.TestCases(SuiteId, CategoryId, Name, IsActive) VALUES (@suiteId, @catKD, N'Case2', 1);
SET @k2 = SCOPE_IDENTITY();

INSERT INTO dbo.TestSteps(CaseId, Ordinal, StepName) VALUES
(@k2,1,N'Login'),
(@k2,2,N'checkBalance'),
(@k2,3,N'Logout');

SELECT @k2s1=Id FROM dbo.TestSteps WHERE CaseId=@k2 AND Ordinal=1;
SELECT @k2s2=Id FROM dbo.TestSteps WHERE CaseId=@k2 AND Ordinal=2;
SELECT @k2s3=Id FROM dbo.TestSteps WHERE CaseId=@k2 AND Ordinal=3;

-- 参数键与默认值（DataSetId=NULL）
INSERT INTO dbo.StepParamDefs(StepId, ParamKey, ParamOrder) VALUES
(@k2s1,N'name',1),
(@k2s1,N'pwd',2),
(@k2s2,N'balance',1);

INSERT INTO dbo.KeywordStepValues(CaseId,StepId,DataSetId,ParamKey,ParamValue,ValueType) VALUES
(@k2,@k2s1,NULL,N'name',N'bb',N'string'),
(@k2,@k2s1,NULL,N'pwd',N'bbPwd',N'string'),
(@k2,@k2s2,NULL,N'balance',N'100',N'number');

-- Case3（KeywordDriven）
INSERT INTO dbo.TestCases(SuiteId, CategoryId, Name, IsActive) VALUES (@suiteId, @catKD, N'Case3', 1);
SET @k3 = SCOPE_IDENTITY();

INSERT INTO dbo.TestSteps(CaseId, Ordinal, StepName) VALUES
(@k3,1,N'Login'),
(@k3,2,N'searchProduct'),
(@k3,3,N'checkProductInfo'),
(@k3,4,N'Logout');

SELECT @k3s1=Id FROM dbo.TestSteps WHERE CaseId=@k3 AND Ordinal=1;
SELECT @k3s2=Id FROM dbo.TestSteps WHERE CaseId=@k3 AND Ordinal=2;
SELECT @k3s3=Id FROM dbo.TestSteps WHERE CaseId=@k3 AND Ordinal=3;
SELECT @k3s4=Id FROM dbo.TestSteps WHERE CaseId=@k3 AND Ordinal=4;

INSERT INTO dbo.StepParamDefs(StepId, ParamKey, ParamOrder) VALUES
(@k3s1,N'name',1),
(@k3s1,N'pwd',2),
(@k3s2,N'prodCode',1),
(@k3s3,N'prodName',1),
(@k3s3,N'prodSize',2),
(@k3s3,N'prodPrice',3);

INSERT INTO dbo.KeywordStepValues(CaseId,StepId,DataSetId,ParamKey,ParamValue,ValueType) VALUES
(@k3,@k3s1,NULL,N'name',N'cc',N'string'),
(@k3,@k3s1,NULL,N'pwd',N'ccPwd',N'string'),
(@k3,@k3s2,NULL,N'prodCode',N'P003',N'string'),
(@k3,@k3s3,NULL,N'prodName',N'Gamma',N'string'),
(@k3,@k3s3,NULL,N'prodSize',N'12',N'number'),
(@k3,@k3s3,NULL,N'prodPrice',N'999',N'number');
GO

-- 5) 快速验证
-- 同一 Suite 内 Case 名称唯一
SELECT SuiteId, Name, COUNT(*) AS Cnt
FROM dbo.TestCases
GROUP BY SuiteId, Name
HAVING COUNT(*) > 1;

-- 列出当前用例
SELECT c.Id, s.Name AS SuiteName, cat.Name AS CategoryName, c.Name, c.IsActive
FROM dbo.TestCases c
JOIN dbo.Suites s ON s.Id=c.SuiteId
JOIN dbo.TestCategories cat ON cat.Id=c.CategoryId
ORDER BY c.Id;

-- DataDriven：Case1 的 DataSet 和 Values
DECLARE @c1Id BIGINT = (
SELECT TOP 1 c.Id
FROM dbo.TestCases c
JOIN dbo.TestCategories cat ON cat.Id=c.CategoryId AND cat.Name=N'DataDriven'
WHERE c.Name=N'Case1'
);
SELECT * FROM dbo.TestSteps WHERE CaseId=@c1Id ORDER BY Ordinal;
SELECT * FROM dbo.DataSets WHERE CaseId=@c1Id ORDER BY Ordinal;
SELECT v.*
FROM dbo.DataDrivenValues v
JOIN dbo.DataSets ds ON ds.Id=v.DataSetId
WHERE ds.CaseId=@c1Id
ORDER BY ds.Ordinal, v.ParamKey;

-- KeywordDriven：Case2/Case3 的参数
SELECT ksv.*
FROM dbo.KeywordStepValues ksv
JOIN dbo.TestCases c ON c.Id=ksv.CaseId
WHERE c.Name IN (N'Case2', N'Case3')
ORDER BY c.Name, ksv.StepId, ISNULL(ksv.DataSetId,0), ksv.ParamKey;