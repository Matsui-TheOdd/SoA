/* eslint-disable consistent-return */
/* eslint-disable import/no-unresolved */
import express, { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";

export const getAllSoAController = async (_req: Request, res: Response) => {
  try {
    const { excelId } = _req.params;
    const soas = await prisma.soA.findMany({
      where: {
        ExcelID: String(excelId),
      },
    });
    res.status(200).json(soas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getCurrentSoAController = async (_req: Request, res: Response) => {
  try {
    const { soaId } = _req.params;

    const soa = await prisma.soA.findFirst({
      where: {
        id: soaId,
      },
    });
    res.status(200).json(soa);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const createSoAController = async (_req: Request, res: Response) => {
  try {
    const body = _req.body;
    const soa = await prisma.soA.create({
      data: {
        id: body.id,
        RefNo: String(body.RefNo),
        Description: String(body.Description),
        Rooms: String(body.Rooms),
        UnitArea: String(body.UnitArea),
        CellularRoom: String(body.CellularRoom),
        OpenPlan: String(body.OpenPlan),
        SpecialRequirement: String(body.SpecialRequirement),
        ExcelID: String(body.ExcelID),
      },
    });

    res.status(201).json(soa);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create' });
  }
};

export const createSoAsController = async (_req: Request, res: Response) => {
  const { soaList } = _req.body;
  if (!Array.isArray(soaList) || soaList.length === 0) {
    return res.status(400).json({ error: 'Invalid input. Expecting an array of SoA entries.' });
  }

  try {
    const createdSoAs = await prisma.$transaction(async (prisma) => {
      return prisma.soA.createMany({
        data: soaList.map((soa) => ({
          id: soa.id,
          RefNo: String(soa.RefNo),
          Description: String(soa.Description),
          Rooms: String(soa.Rooms),
          UnitArea: String(soa.UnitArea),
          CellularRoom: String(soa.CellularRoom),
          OpenPlan: String(soa.OpenPlan),
          SpecialRequirement: String(soa.SpecialRequirement),
          ExcelID: String(soa.ExcelID),
        })),
      });
    });

    res.status(201).json({ createdSoAs });
  } catch (error) {
    console.error("Transaction failed: ", error);
    res.status(500).json({ error: 'Failed to create SOA entries' });
  }
};

export const deleteSoAController = async (_req: Request, res: Response) => {
  try {
    const { excelId } = _req.params;
    const deleteSoA = await prisma.$transaction(async (prisma) => {
      return prisma.soA.deleteMany({
        where: {
          ExcelID: excelId,
        },
      });
    });

    res.status(200).json({ deletedCount: deleteSoA.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete' });
  }
}



