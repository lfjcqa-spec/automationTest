USE PlaywrightE2E;
GO

-- ========= Case4：KeywordDriven =========
BEGIN TRAN;
BEGIN TRY
DECLARE
@suiteId BIGINT = (SELECT Id FROM dbo.Suites WHERE Name=N'Demo'),
@catKD BIGINT = (SELECT Id FROM dbo.TestCategories WHERE Name=N'KeywordDriven'),
@c4 BIGINT, @c4s1 BIGINT, @c4s2 BIGINT, @c4s3 BIGINT, @c4s4 BIGINT;

-- 若存在同名用例，删除（级联清理相关子表）
IF EXISTS (SELECT 1 FROM dbo.TestCases WHERE Name=N'Case4' AND SuiteId=@suiteId)
BEGIN
DELETE FROM dbo.TestCases WHERE Name=N'Case4' AND SuiteId=@suiteId;
END

INSERT INTO dbo.TestCases(SuiteId, CategoryId, Name, IsActive, Description)
VALUES (@suiteId, @catKD, N'Case4', 1, N'新增用户并授权后校验');

SET @c4 = SCOPE_IDENTITY();

-- 步骤：Login → createUser → grantRole → verifyUser → Logout
INSERT INTO dbo.TestSteps(CaseId, Ordinal, StepName) VALUES
(@c4,1,N'Login'),
(@c4,2,N'createUser'),
(@c4,3,N'grantRole'),
(@c4,4,N'verifyUser'),
(@c4,5,N'Logout');

SELECT
@c4s1=Id FROM dbo.TestSteps WHERE CaseId=@c4 AND Ordinal=1;
SELECT
@c4s2=Id FROM dbo.TestSteps WHERE CaseId=@c4 AND Ordinal=2;
SELECT
@c4s3=Id FROM dbo.TestSteps WHERE CaseId=@c4 AND Ordinal=3;
SELECT
@c4s4=Id FROM dbo.TestSteps WHERE CaseId=@c4 AND Ordinal=4;

-- 参数定义
INSERT INTO dbo.StepParamDefs(StepId, ParamKey, ParamOrder) VALUES
(@c4s1,N'name',1),
(@c4s1,N'pwd',2),
(@c4s2,N'newUser',1),
(@c4s2,N'newPwd',2),
(@c4s3,N'role',1),
(@c4s4,N'expected',1);

-- Keyword 参数值（默认 DataSetId = NULL）
INSERT INTO dbo.KeywordStepValues(CaseId,StepId,DataSetId,ParamKey,ParamValue,ValueType) VALUES
(@c4,@c4s1,NULL,N'name',N'admin',N'string'),
(@c4,@c4s1,NULL,N'pwd',N'adminPwd',N'string'),

(@c4,@c4s2,NULL,N'newUser',N'u001',N'string'),
(@c4,@c4s2,NULL,N'newPwd',N'P@ssw0rd',N'string'),

(@c4,@c4s3,NULL,N'role',N'Approver',N'string'),

(@c4,@c4s4,NULL,N'expected',N'User u001 exists and role=Approver',N'string');

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK TRAN;
THROW;
END CATCH
GO

-- ========= Case5：DataDriven =========
BEGIN TRAN;
BEGIN TRY
DECLARE
@suiteId5 BIGINT = (SELECT Id FROM dbo.Suites WHERE Name=N'Demo'),
@catDD5 BIGINT = (SELECT Id FROM dbo.TestCategories WHERE Name=N'DataDriven'),
@c5 BIGINT,
@c5s1 BIGINT, @c5s2 BIGINT, @c5s3 BIGINT, @c5s4 BIGINT,
@c5ds1 BIGINT, @c5ds2 BIGINT;

-- 若存在同名用例，删除（级联清理相关子表）
IF EXISTS (SELECT 1 FROM dbo.TestCases WHERE Name=N'Case5' AND SuiteId=@suiteId5)
BEGIN
DELETE FROM dbo.TestCases WHERE Name=N'Case5' AND SuiteId=@suiteId5;
END

INSERT INTO dbo.TestCases(SuiteId, CategoryId, Name, IsActive, Description)
VALUES (@suiteId5, @catDD5, N'Case5', 1, N'下单流程（数据驱动）');

SET @c5 = SCOPE_IDENTITY();

-- 步骤：Login → searchProduct → addToCart → checkout → Logout
INSERT INTO dbo.TestSteps(CaseId, Ordinal, StepName) VALUES
(@c5,1,N'Login'),
(@c5,2,N'searchProduct'),
(@c5,3,N'addToCart'),
(@c5,4,N'checkout'),
(@c5,5,N'Logout');

SELECT @c5s1=Id FROM dbo.TestSteps WHERE CaseId=@c5 AND Ordinal=1;
SELECT @c5s2=Id FROM dbo.TestSteps WHERE CaseId=@c5 AND Ordinal=2;
SELECT @c5s3=Id FROM dbo.TestSteps WHERE CaseId=@c5 AND Ordinal=3;
SELECT @c5s4=Id FROM dbo.TestSteps WHERE CaseId=@c5 AND Ordinal=4;

-- 参数定义
INSERT INTO dbo.StepParamDefs(StepId, ParamKey, ParamOrder) VALUES
(@c5s1,N'name',1),
(@c5s1,N'pwd',2),
(@c5s2,N'prodCode',1),
(@c5s3,N'qty',1),
(@c5s4,N'payMethod',1),
(@c5s4,N'address',2);

-- 两个数据集
INSERT INTO dbo.DataSets(CaseId, Name, Ordinal) VALUES
(@c5,N'Row1',1),
(@c5,N'Row2',2);

SELECT @c5ds1=Id FROM dbo.DataSets WHERE CaseId=@c5 AND Ordinal=1;
SELECT @c5ds2=Id FROM dbo.DataSets WHERE CaseId=@c5 AND Ordinal=2;

-- DataDriven 值（每个数据集一组）
INSERT INTO dbo.DataDrivenValues(DataSetId,ParamKey,ParamValue,ValueType) VALUES
-- Row1
(@c5ds1,N'name',N'dd',N'string'),
(@c5ds1,N'pwd',N'ddPwd',N'string'),
(@c5ds1,N'prodCode',N'P100',N'string'),
(@c5ds1,N'qty',N'2',N'number'),
(@c5ds1,N'payMethod',N'CreditCard',N'string'),
(@c5ds1,N'address',N'Beijing Road 1',N'string'),

-- Row2
(@c5ds2,N'name',N'ee',N'string'),
(@c5ds2,N'pwd',N'eePwd',N'string'),
(@c5ds2,N'prodCode',N'P200',N'string'),
(@c5ds2,N'qty',N'1',N'number'),
(@c5ds2,N'payMethod',N'Alipay',N'string'),
(@c5ds2,N'address',N'Shanghai Road 2',N'string');

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK TRAN;
THROW;
END CATCH
GO

-- 简要校验 Case4/Case5 是否写入成功
SELECT Name, Id FROM dbo.TestCases WHERE Name IN (N'Case4', N'Case5');
SELECT * FROM dbo.TestSteps WHERE CaseId IN (SELECT Id FROM dbo.TestCases WHERE Name IN (N'Case4',N'Case5')) ORDER BY CaseId, Ordinal;
SELECT ds.*
FROM dbo.DataSets ds
WHERE ds.CaseId IN (SELECT Id FROM dbo.TestCases WHERE Name=N'Case5')
ORDER BY ds.Ordinal;
SELECT v.*
FROM dbo.DataDrivenValues v
WHERE v.DataSetId IN (SELECT Id FROM dbo.DataSets WHERE CaseId IN (SELECT Id FROM dbo.TestCases WHERE Name=N'Case5'))
ORDER BY v.DataSetId, v.ParamKey;