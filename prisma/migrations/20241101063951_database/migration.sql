BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ExcelFile] (
    [id] VARCHAR(50) NOT NULL,
    [Name] VARCHAR(max) NOT NULL,
    [URL] TEXT,
    [ImportDate] DATETIME,
    [ModifyDate] DATETIME,
    [isDelete] BIT,
    [ProjectID] VARCHAR(50),
    CONSTRAINT [PK__ExcelFil__3213E83FD9ABB621] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[IFCFile] (
    [id] VARCHAR(50) NOT NULL,
    [Name] VARCHAR(max) NOT NULL,
    [URL] TEXT,
    [ImportDate] DATETIME,
    [ModifyDate] DATETIME,
    [isDelete] BIT,
    [ProjectID] VARCHAR(50),
    CONSTRAINT [PK__IFCFile__3213E83FD8E48958] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] VARCHAR(50) NOT NULL,
    [Name] VARCHAR(max) NOT NULL,
    [Description] TEXT,
    [CreateDate] DATETIME,
    [ModifyDate] DATETIME,
    [isDelete] BIT,
    CONSTRAINT [PK__Project__3213E83F052635CF] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SoA] (
    [id] VARCHAR(50) NOT NULL,
    [RefNo] VARCHAR(max),
    [Description] TEXT,
    [Rooms] VARCHAR(max),
    [UnitArea] VARCHAR(max),
    [CellularRoom] VARCHAR(max),
    [OpenPlan] VARCHAR(max),
    [SpecialRequirement] TEXT,
    [ExcelID] VARCHAR(50),
    CONSTRAINT [PK__SoA__3213E83F02989253] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B61DAD1B28E] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- AddForeignKey
ALTER TABLE [dbo].[ExcelFile] ADD CONSTRAINT [FK__ExcelFile__Proje__5BE2A6F2] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IFCFile] ADD CONSTRAINT [FK__IFCFile__Project__5EBF139D] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SoA] ADD CONSTRAINT [FK__SoA__ExcelID__619B8048] FOREIGN KEY ([ExcelID]) REFERENCES [dbo].[ExcelFile]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
