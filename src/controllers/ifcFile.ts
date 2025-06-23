/* eslint-disable consistent-return */
/* eslint-disable import/no-unresolved */
import express, { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";

export const getAllIfcFileController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;
    const ifcFiles = await prisma.ifcfile.findMany({
      where: {
        ProjectID: String(projectId),
      },
    });
    res.status(200).json(ifcFiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getCurrentIfcFileController = async (_req: Request, res: Response) => {
  try {
    const { ifcFileId } = _req.params;

    const ifcFile = await prisma.ifcfile.findFirst({
      where: {
        id: ifcFileId,
      },
    });
    res.status(200).json(ifcFile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const createIfcFileController = async (_req: Request, res: Response) => {
  try {
    const body = _req.body;
    const ifcFile = await prisma.ifcfile.create({
      data: {
        id: body.id,
        Name: String(body.Name),
        URL: String(body.URL),
        ImportDate: new Date(body.ImportDate),
        ProjectID: String(body.ProjectID),
      },
    });


    res.status(201).json(ifcFile);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to create file' });
  }
};

export const createIfcFilesController = async (_req: Request, res: Response) => {
  const { ifcFileList } = _req.body;
  if (!Array.isArray(ifcFileList) || ifcFileList.length === 0) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    const createdIFCFiles = await prisma.$transaction(async (prisma) => {
      return prisma.ifcfile.createMany({
        data: ifcFileList.map((ifcFile) => ({
          id: ifcFile.id,
          Name: String(ifcFile.Name),
          URL: String(ifcFile.URL),
          ImportDate: new Date(ifcFile.ImportDate),
          ProjectID: String(ifcFile.ProjectID),
        })),
      });
    });

    res.status(201).json({ createdIFCFiles });
  } catch (error) {
    console.error("Transaction failed: ", error);
    res.status(500).json({ error: 'Failed to create SOA entries' });
  }
};

export const deleteIfcFileController = async (_req: Request, res: Response) => {
  try {
    const { ifcFileId } = _req.params;

    const deletedifcFile = await prisma.ifcfile.delete({
      where: {
        id: ifcFileId,
      }
    });

    res.status(200).json(deletedifcFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update' });
  }
}

export const deleteIfcFilesController = async (_req: Request, res: Response) => {
  try {
    const { listIFCFile } = _req.body;
    if (!Array.isArray(listIFCFile) || listIFCFile.length === 0) {
      return;
    }
    const deletedResults = await prisma.$transaction(
      listIFCFile.map((item) => {
        return prisma.ifcfile.deleteMany({
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