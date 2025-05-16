DROP DATABASE ArchSD;

CREATE DATABASE ArchSD;
USE ArchSD;


DROP TABLE Project;
CREATE TABLE Project (
	id varchar(50) PRIMARY KEY,
	[Name] varchar(max) NOT NULL,
	[Description] text,
	CreateDate datetime,
	ModifyDate datetime,
	isDelete bit,
);

DROP TABLE ExcelFile;
CREATE TABLE ExcelFile (
	id varchar(50) PRIMARY KEY,
	[Name] varchar(max) NOT NULL,
	[URL] text,
	ImportDate datetime,
	ModifyDate datetime,
	isDelete bit,
	ProjectID varchar(50),
    FOREIGN KEY (ProjectID) REFERENCES Project(id)
);

DROP TABLE IFCFile;
CREATE TABLE IFCFile (
	id varchar(50) PRIMARY KEY,
	[Name] varchar(max) NOT NULL,
	[URL] text,
	ImportDate datetime,
	ModifyDate datetime,
	isDelete bit,
	ProjectID varchar(50),
    FOREIGN KEY (ProjectID) REFERENCES Project(id)
);

DROP TABLE SoA;
CREATE TABLE SoA (
	id varchar(50) PRIMARY KEY,
	RefNo varchar(max),
	[Description] text,
	Rooms varchar(max),
	UnitArea varchar(max),
	CellularRoom varchar(max),
	OpenPlan varchar(max),
	SpecialRequirement text,
	ExcelID varchar(50),
    FOREIGN KEY (ExcelID) REFERENCES ExcelFile(id)
);

CREATE TRIGGER trg_ProjectModifyDate
ON Project
AFTER UPDATE
AS
BEGIN
    UPDATE Project
    SET ModifyDate = GETDATE()
    FROM Project
    INNER JOIN inserted ON Project.id = inserted.id;
END;

CREATE TRIGGER trg_ProjectCreateDate
ON Project
AFTER INSERT
AS
BEGIN
    UPDATE Project
    SET CreateDate = GETDATE()
    FROM Project
    INNER JOIN inserted ON Project.id = inserted.id;
END;

CREATE TRIGGER trg_ExcelFileModifyDate
ON ExcelFile
AFTER UPDATE
AS
BEGIN
    UPDATE ExcelFile
    SET ModifyDate = GETDATE()
    FROM ExcelFile
    INNER JOIN inserted ON ExcelFile.id = inserted.id;
END;

CREATE TRIGGER trg_ExcelFileImportDate
ON ExcelFile
AFTER INSERT
AS
BEGIN
    UPDATE ExcelFile
    SET ImportDate = GETDATE()
    FROM ExcelFile
    INNER JOIN inserted ON ExcelFile.id = inserted.id;
END;

CREATE TRIGGER trg_IFCFileModifyDate
ON IFCFile
AFTER UPDATE
AS
BEGIN
    UPDATE IFCFile
    SET ModifyDate = GETDATE()
    FROM IFCFile
    INNER JOIN inserted ON IFCFile.id = inserted.id;
END;

CREATE TRIGGER trg_IFCFileImportDate
ON IFCFile
AFTER INSERT
AS
BEGIN
    UPDATE IFCFile
    SET ImportDate = GETDATE()
    FROM IFCFile
    INNER JOIN inserted ON IFCFile.id = inserted.id;
END;

USE [ArchSD]
GO

INSERT INTO [dbo].[Project]
           ([id]
           ,[Name]
           ,[Description]
           ,[CreateDate]
           ,[ModifyDate]
           ,[isDelete])
     VALUES
           (NEWID(), 'First Project', 'First Project Description', '2023-10-30 14:30:00', '2023-10-30 14:30:00', 0)
GO

