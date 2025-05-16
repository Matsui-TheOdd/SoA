/* eslint-disable consistent-return */
/* eslint-disable import/no-unresolved */
import express, { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";

export const getAllExcelController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;
    const excels = await prisma.excelFile.findMany({
      where: {
        ProjectID: String(projectId),
      },
    });
    res.status(200).json(excels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getCurrentExcelController = async (_req: Request, res: Response) => {
  try {
    const { excelId } = _req.params;

    const excel = await prisma.excelFile.findFirst({
      where: {
        id: excelId,
      },
    });
    res.status(200).json(excel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const createExcelController = async (_req: Request, res: Response) => {
  try {
    const body = _req.body;
    const excel = await prisma.excelFile.create({
      data: {
        id: body.id,
        Name: String(body.Name),
        URL: String(body.URL),
        ImportDate: new Date(body.ImportDate),
        ProjectID: String(body.ProjectID),
      },
    });


    res.status(201).json(excel);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to create file' });
  }
};

export const createExcelsController = async (_req: Request, res: Response) => {
  const { excelList } = _req.body;
  if (!Array.isArray(excelList) || excelList.length === 0) {
    return res.status(400).json({ error: 'Invalid input. Expecting an array of SoA entries.' });
  }

  try {
    const createdExcels = await prisma.$transaction(async (prisma) => {
      return prisma.excelFile.createMany({
        data: excelList.map((excel) => ({
          id: excel.id,
          Name: String(excel.Name),
          URL: String(excel.URL),
          ImportDate: new Date(excel.ImportDate),
          ProjectID: String(excel.ProjectID),
        })),
      });
    });

    return res.status(201).json({ createdExcels });
  } catch (error) {
    console.error("Transaction failed: ", error);
    return res.status(500).json({ error: 'Failed to create SOA entries' });
  }
};

export const deleteExcelController = async (_req: Request, res: Response) => {
  try {
    const { excelId } = _req.params;
    const deleted = await prisma.$transaction(async (tx) => {
      const deletedSoAs = await tx.soA.deleteMany({
        where: {
          ExcelID: excelId,
        },
      });
      const deletedExcel = await tx.excelFile.delete({
        where: {
          id: excelId,
        },
      });

      return {
        deletedSoAs,
        deletedExcel,
      };
    });

    res.status(200).json(deleted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete Excel file' });
  }
};

export const deleteExcelsController = async (_req: Request, res: Response) => {
  try {
    const { excelList } = _req.body;
    if (!Array.isArray(excelList) || excelList.length === 0) {
      return res.status(400).json({ error: 'Invalid input. Expecting an array of SoA entries.' });
    }
    const deletedResults = await prisma.$transaction(
      excelList.map((item) => {
        return prisma.excelFile.deleteMany({
          where: {
            id: item.id,
          },
        });
      })
    );

    const deletedCount = deletedResults.reduce((count, result) => count + result.count, 0);
    res.status(200).json({ deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};


