/* eslint-disable import/no-extraneous-dependencies */
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import prisma from "../lib/db";

export const commitController = async (_req: Request, res: Response) => {
  const { projectId } = _req.params;
  const { ifcFileList, excelList, soaList, importDate } = _req.body;

  if (!projectId || !Array.isArray(ifcFileList) || !Array.isArray(excelList) || !Array.isArray(soaList)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const dataExcel = await prisma.excelFile.findMany({ where: { ProjectID: projectId } });
      const dataIFCFile = await prisma.iFCFile.findMany({ where: { ProjectID: projectId } });

      const existingExcelIds = new Set(dataExcel.map((item) => item.id));
      const existingIFCFileIds = new Set(dataIFCFile.map((item) => item.id));

      // Xử lý tạo mới excel
      const uploadDirectoryPath = '\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database';

      const newExcels = await Promise.all(
        excelList
          .filter((row) => !existingExcelIds.has(row.id))
          .map((excel) =>
            prisma.excelFile.create({
              data: {
                id: excel.id,
                ProjectID: projectId,
                Name: excel.Name,
                ImportDate: new Date(),
                URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, excel.Name),
              },
            })
          )
      );

      // Xử lý xóa excel và các SOA liên quan
      const deletedExcels = await Promise.all(
        dataExcel
          .filter((item) => !excelList.some((excel) => excel.id === item.id))
          .map(async (excel) => {
            await prisma.soA.deleteMany({ where: { ExcelID: excel.id } });
            return prisma.excelFile.delete({ where: { id: excel.id } });
          })
      );

      // Xử lý tạo mới IFC File
      const newIFCFiles = await Promise.all(
        ifcFileList
          .filter((row) => !existingIFCFileIds.has(row.id))
          .map((ifcFile) =>
            prisma.iFCFile.create({
              data: {
                id: ifcFile.id,
                ProjectID: projectId,
                Name: ifcFile.Name,
                ImportDate: new Date(),
                URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, ifcFile.Name),
              },
            })
          )
      );

      // Xử lý xóa IFC File
      const deletedIFCFiles = await Promise.all(
        dataIFCFile
          .filter((item) => !ifcFileList.some((ifcFile) => ifcFile.id === item.id))
          .map((ifcFile) =>
            prisma.iFCFile.delete({ where: { id: ifcFile.id } })
          )
      );

      // Xử lý tạo mới SOA dựa trên các Excel mới
      const newSOAEntries = newExcels.flatMap((newExcel) =>
        soaList
          .filter((soa) => soa.ExcelID === newExcel.id)
          .map((soa) => ({
            id: soa.id,
            RefNo: soa.RefNo,
            Description: soa.Description,
            Rooms: soa.Rooms,
            UnitArea: soa.UnitArea,
            CellularRoom: soa.CellularRoom,
            OpenPlan: soa.OpenPlan,
            SpecialRequirement: soa.SpecialRequirement,
            ExcelID: newExcel.id,
          }))
      );

      if (newSOAEntries.length > 0) {
        await prisma.soA.createMany({
          data: newSOAEntries,
        });
      }

      return {
        newExcels,
        deletedExcels,
        newIFCFiles,
        deletedIFCFiles,
        newSOAEntries,
      };
    });

    return res.status(201).json({
      ...result,
    });
  } catch (error) {
    console.error("Error committing data:", error);
    return res.status(500).json({ error: 'Failed to commit data' });
  }
};

export const backupController = async (_req: Request, res: Response) => {
  const { projectId } = _req.params;
  const { ifcFileList, excelList, soaList, importDate } = _req.body;

  if (!projectId || !Array.isArray(excelList) || !Array.isArray(soaList)) {
    return res.status(400).json({ error: 'Invalid input: projectId, excelList, ifcFileList, and soaList must be arrays.' });
  }

  if (excelList.length === 0 || soaList.length === 0) {
    return res.status(400).json({ error: 'Invalid input: Lists cannot be empty.' });
  }

  try {
    const backupReq = await prisma.$transaction(async (prisma) => {
      const backupFile = await prisma.backUpFile.create({
        data: {
          id: crypto.randomUUID(),
          ProjectID: String(projectId),
          ImportDate: new Date(),
        },
      });

      if (!backupFile) {
        throw new Error('Failed to create backupFile');
      }

      const excelIdMap: Record<string, string> = {};

      const uploadDirectoryPath = '\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database';

      for (const excel of excelList) {
        const newExcelFile = await prisma.excelFileBackUp.create({
          data: {
            id: crypto.randomUUID(),
            Name: String(excel.Name),
            URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, excel.Name),
            BackUpFileID: backupFile.id,
          },
        });
        excelIdMap[excel.id] = newExcelFile.id;
      }

      console.log("Excel ID Map:", excelIdMap);

      if (Array.isArray(ifcFileList) && ifcFileList.length > 0) {
        await prisma.iFCFileBackUp.createMany({
          data: ifcFileList.map((ifcFile) => ({
            id: crypto.randomUUID(),
            Name: String(ifcFile.Name),
            URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, ifcFile.Name),
            BackUpFileID: backupFile.id,
          })),
        });
      }

      const newSOAEntries = soaList.map((soa) => {
        const excelID = excelIdMap[soa.ExcelID];
        if (!excelID) {
          console.warn(`Không tìm thấy ExcelID cho mục SOA có ExcelID: ${soa.ExcelID}`);
        }
        return {
          id: crypto.randomUUID(),
          RefNo: String(soa.RefNo),
          Description: String(soa.Description),
          Rooms: String(soa.Rooms),
          UnitArea: String(soa.UnitArea),
          CellularRoom: String(soa.CellularRoom),
          OpenPlan: String(soa.OpenPlan),
          SpecialRequirement: String(soa.SpecialRequirement),
          ExcelID: excelID,
        };
      });


      if (newSOAEntries.length > 0) {
        await prisma.soABackUp.createMany({
          data: newSOAEntries,
        });
      }

      return backupFile;
    });

    return res.status(201).json({ backupReq });
  } catch (error) {
    console.error('Transaction failed: ', error);
    return res.status(500).json({ error: `Failed to create backup entries: ${(error as Error).message}` });
  }
};

export const commitAndBackupController = async (_req: Request, res: Response) => {
  const { projectId } = _req.params;
  const { ifcFileList, excelList, soaList, importDate } = _req.body;

  if (!projectId || !Array.isArray(ifcFileList) || !Array.isArray(excelList) || !Array.isArray(soaList)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const uploadDirectoryPath = '\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database';

  try {
    const [commitResult, backupFile] = await Promise.all([
      prisma.$transaction(async (prisma) => {
        const dataExcel = await prisma.excelFile.findMany({ where: { ProjectID: projectId } });
        const dataIFCFile = await prisma.iFCFile.findMany({ where: { ProjectID: projectId } });

        const existingExcelIds = new Set(dataExcel.map((item) => item.id));
        const existingIFCFileIds = new Set(dataIFCFile.map((item) => item.id));

        // Handle new Excel files
        const newExcels = await Promise.all(
          excelList
            .filter((row) => !existingExcelIds.has(row.id))
            .map((excel) =>
              prisma.excelFile.create({
                data: {
                  id: excel.id,
                  ProjectID: projectId,
                  Name: excel.Name,
                  ImportDate: new Date(),
                  URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "excel", excel.Name),
                },
              })
            )
        );

        const exitsExcels = await Promise.all(
          excelList
            .filter((row) => existingExcelIds.has(row.id))
            .map((excel) =>
              prisma.excelFile.update({
                where: {
                  id: excel.id
                },
                data: {
                  URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "excel", excel.Name),
                },
              })
            )
        );

        // Handle deleted Excel files and related SOAs
        const deletedExcels = await Promise.all(
          dataExcel
            .filter((item) => !excelList.some((excel) => excel.id === item.id))
            .map(async (excel) => {
              await prisma.soA.deleteMany({ where: { ExcelID: excel.id } });
              return prisma.excelFile.delete({ where: { id: excel.id } });
            })
        );

        // Handle new IFC files
        const newIFCFiles = await Promise.all(
          ifcFileList
            .filter((row) => !existingIFCFileIds.has(row.id))
            .map((ifcFile) =>
              prisma.iFCFile.create({
                data: {
                  id: ifcFile.id,
                  ProjectID: projectId,
                  Name: ifcFile.Name,
                  ImportDate: new Date(),
                  URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "ifc", ifcFile.Name),
                },
              })
            )
        );

        const exitsIFCFiles = await Promise.all(
          ifcFileList
            .filter((row) => existingIFCFileIds.has(row.id))
            .map((ifcFile) =>
              prisma.iFCFile.update({
                where: { id: ifcFile.id },
                data: {
                  URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "ifc", ifcFile.Name),
                },
              })
            )
        );

        // Handle deleted IFC files
        const deletedIFCFiles = await Promise.all(
          dataIFCFile
            .filter((item) => !ifcFileList.some((ifcFile) => ifcFile.id === item.id))
            .map((ifcFile) =>
              prisma.iFCFile.delete({ where: { id: ifcFile.id } })
            )
        );

        // Handle new SOA entries for new Excels
        const newSOAEntries = newExcels.flatMap((newExcel) =>
          soaList
            .filter((soa) => soa.ExcelID === newExcel.id)
            .map((soa) => ({
              id: soa.id,
              RefNo: soa.RefNo,
              Description: soa.Description,
              Rooms: soa.Rooms,
              UnitArea: soa.UnitArea,
              CellularRoom: soa.CellularRoom,
              OpenPlan: soa.OpenPlan,
              SpecialRequirement: soa.SpecialRequirement,
              ExcelID: newExcel.id,
            }))
        );

        if (newSOAEntries.length > 0) {
          await prisma.soA.createMany({ data: newSOAEntries });
        }

        return { newExcels, deletedExcels, newIFCFiles, deletedIFCFiles, newSOAEntries };
      }),

      prisma.$transaction(async (prisma) => {
        const backupFile = await prisma.backUpFile.create({
          data: {
            id: crypto.randomUUID(),
            ProjectID: String(projectId),
            ImportDate: new Date(),
          },
        });

        const excelIdMap: Record<string, string> = {};

        for (const excel of excelList) {
          const newExcelFile = await prisma.excelFileBackUp.create({
            data: {
              id: crypto.randomUUID(),
              Name: String(excel.Name),
              URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "excel", excel.Name),
              BackUpFileID: backupFile.id,
            },
          });
          excelIdMap[excel.id] = newExcelFile.id;
        }

        if (Array.isArray(ifcFileList) && ifcFileList.length > 0) {
          await prisma.iFCFileBackUp.createMany({
            data: ifcFileList.map((ifcFile) => ({
              id: crypto.randomUUID(),
              Name: String(ifcFile.Name),
              URL: path.join(uploadDirectoryPath, projectId, "Backup", importDate, "ifc", ifcFile.Name),
              BackUpFileID: backupFile.id,
            })),
          });
        }

        const newSOAEntries = soaList.map((soa) => {
          const excelID = excelIdMap[soa.ExcelID];
          if (!excelID) {
            console.warn(`Không tìm thấy ExcelID cho mục SOA có ExcelID: ${soa.ExcelID}`);
          }
          return {
            id: crypto.randomUUID(),
            RefNo: String(soa.RefNo),
            Description: String(soa.Description),
            Rooms: String(soa.Rooms),
            UnitArea: String(soa.UnitArea),
            CellularRoom: String(soa.CellularRoom),
            OpenPlan: String(soa.OpenPlan),
            SpecialRequirement: String(soa.SpecialRequirement),
            ExcelID: excelID,
          };
        });

        if (newSOAEntries.length > 0) {
          await prisma.soABackUp.createMany({ data: newSOAEntries });
        }

        return backupFile;
      })
    ]);

    return res.status(201).json({ commitResult, backupFile });
  } catch (error) {
    console.error('Transaction failed: ', error);
    return res.status(500).json({ error: `Failed to commit and backup data: ${(error as Error).message}` });
  }
};

export const getBackUpViewController = async (_req: Request, res: Response) => {
  const { projectId } = _req.params;
  if (!projectId) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  try {
    const backupFile = await prisma.backUpFile.findMany({
      where: { ProjectID: projectId },
      orderBy: { ImportDate: 'desc' }
    });

    return res.status(200).json({ backupFile });
  } catch (error) {
    console.error("Transaction failed: ", error);
    return res.status(500).json({ error: 'Failed to restore backup entries' });
  }
};

export const restoreViewController = async (_req: Request, res: Response) => {
  const { backupFileId } = _req.params;

  try {
    const restoreReq = await prisma.$transaction(async (prisma) => {
      const backupFile = await prisma.backUpFile.findFirst({
        where: { id: backupFileId },
      });

      if (!backupFile) {
        return res.status(400).json({ error: 'Invalid input' });
      }
      const excelNewRecords = await prisma.excelFileBackUp.findMany({
        where: { BackUpFileID: backupFileId },
      });

      const soaNewRecords = await prisma.soABackUp.findMany({
        where: {
          ExcelID: {
            in: excelNewRecords.map((excel) => excel.id),
          },
        },
      });

      const ifcNewRecords = await prisma.iFCFileBackUp.findMany({
        where: { BackUpFileID: backupFileId },
      });

      return {
        backupFile,
        excelNewRecords,
        soaNewRecords,
        ifcNewRecords,
      };
    });

    return res.status(200).json({ restoreReq });
  } catch (error) {
    console.error("Transaction failed: ", error);
    return res.status(500).json({ error: 'Failed to restore backup entries' });
  }
};

export const restoreCommitController = async (_req: Request, res: Response) => {
  const { backupFileId } = _req.params;

  try {
    const restoreReq = await prisma.$transaction(async (prisma) => {
      // 1. Lấy file sao lưu (backupFile) theo backupFileId
      const backupFile = await prisma.backUpFile.findFirst({
        where: { id: backupFileId },
      });

      if (!backupFile) {
        return res.status(400).json({ error: 'Invalid input' });
      }

      // 2. Lấy tất cả các bản ghi file cũ từ các bảng hiện tại (excelFile, soA, iFCFile)
      const excelOldRecords = await prisma.excelFile.findMany({
        where: { ProjectID: backupFile.ProjectID },
      });

      const soaOldRecords = await prisma.soA.findMany({
        where: {
          ExcelID: {
            in: excelOldRecords.map((excel) => excel.id),
          },
        },
      });

      const ifcOldRecords = await prisma.iFCFile.findMany({
        where: { ProjectID: backupFile.ProjectID },
      });

      // 3. Xóa các bản ghi soA có khóa ngoại ExcelID phụ thuộc vào excelFile
      await prisma.soA.deleteMany({
        where: {
          ExcelID: {
            in: excelOldRecords.map((excel) => excel.id),
          },
        },
      });

      // 4. Xóa các bản ghi excelFile có ProjectID phụ thuộc vào backupFile
      await prisma.excelFile.deleteMany({
        where: { ProjectID: backupFile.ProjectID },
      });

      // 5. Xóa các bản ghi soABackUp có khóa ngoại ExcelID phụ thuộc vào excelFileBackUp
      const excelNewRecords = await prisma.excelFileBackUp.findMany({
        where: { BackUpFileID: backupFileId },
      });

      await prisma.soABackUp.deleteMany({
        where: {
          ExcelID: {
            in: excelNewRecords.map((excel) => excel.id),
          },
        },
      });

      // 6. Xóa các bản ghi excelFileBackUp (sao lưu) liên quan đến backupFileId
      await prisma.excelFileBackUp.deleteMany({
        where: { BackUpFileID: backupFileId },
      });

      // 7. Tạo các bản ghi mới từ backup vào bảng hiện tại
      await prisma.iFCFile.deleteMany({
        where: { ProjectID: backupFile.ProjectID },
      });

      await prisma.iFCFile.createMany({
        data: (await prisma.iFCFileBackUp.findMany({
          where: { BackUpFileID: backupFileId },
        })).map((ifcFile) => ({
          id: ifcFile.id,
          Name: ifcFile.Name,
          URL: ifcFile.URL,
          ProjectID: backupFile.ProjectID,
        })),
      });

      await prisma.soA.createMany({
        data: (await prisma.soABackUp.findMany({
          where: {
            ExcelID: {
              in: excelNewRecords.map((excel) => excel.id),
            },
          },
        })).map((soa) => ({
          id: soa.id,
          RefNo: soa.RefNo,
          Description: soa.Description,
          Rooms: soa.Rooms,
          UnitArea: soa.UnitArea,
          CellularRoom: soa.CellularRoom,
          OpenPlan: soa.OpenPlan,
          SpecialRequirement: soa.SpecialRequirement,
          ExcelID: soa.ExcelID,
        })),
      });

      await prisma.excelFile.createMany({
        data: excelNewRecords.map((excel) => ({
          id: excel.id,
          Name: excel.Name,
          URL: excel.URL,
          ProjectID: backupFile.ProjectID,
        })),
      });

      // 8. Xóa các bản ghi trong bảng sao lưu sau khi đã sao chép sang bảng hiện tại
      await prisma.iFCFileBackUp.deleteMany({
        where: { BackUpFileID: backupFileId },
      });

      return {
        backupFile,
        excelNewRecords,
        soaNewRecords: await prisma.soA.findMany({
          where: {
            ExcelID: {
              in: excelNewRecords.map((excel) => excel.id),
            },
          },
        }),
        ifcNewRecords: await prisma.iFCFile.findMany({
          where: { ProjectID: backupFile.ProjectID },
        }),
      };
    });

    return res.status(200).json({ restoreReq });
  } catch (error) {
    console.error("Transaction failed: ", error);
    return res.status(500).json({ error: 'Failed to restore and commit backup entries' });
  }
};

