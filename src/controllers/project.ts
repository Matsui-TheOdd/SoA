import express, { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import path from 'path';
import formatDate from "../util/formatDate";
import prisma from '../lib/db';

export const getProjectAllController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    const projects = await prisma.project.findMany({
      where: {
        UserId: Number(userId),
      },
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectActiveController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    console.log(userId);
    const projects = await prisma.project.findMany({
      where: {
        UserId: Number(userId),
        isDelete: false
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getProjectFinishController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    const projects = await prisma.project.findMany({
      where: {
        UserId: Number(userId),
        isDelete: true
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getCurrentProjectController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      }
    });

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}

export const getCheckProjectController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    const projects = await prisma.project.findMany({
      where: {
        UserId: Number(userId),
      },
    });

    const filteredProjects = await Promise.all(
      projects.map(async (project) => {
        const [excels, ifcFiles] = await Promise.all([
          prisma.excelFile.findMany({ where: { ProjectID: project.id } }),
          prisma.iFCFile.findMany({ where: { ProjectID: project.id } }),
        ]);

        return excels.length > 0 && ifcFiles.length > 0 ? project : null;
      })
    );

    // Lọc bỏ giá trị null
    const validProjects = filteredProjects.filter((p) => p !== null);

    res.status(200).json(validProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch" });
  }
};

export const createProjectController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    const body = _req.body;

    const project = await prisma.project.create({
      data: {
        id: body.id,
        Name: body.Name,
        Description: body.Description,
        CreateDate: new Date(),
        ModifyDate: new Date(),
        isDelete: false,
        Status: "Not Comply",
        UserId: Number(userId),
      },
    });
    const uploadDirectory = `\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database`;
    const logFilePath = path.join(uploadDirectory, 'log.txt');
    // Nội dung log
    const logMessage = `--Action: create, Time: ${formatDate(project.CreateDate ?? new Date())}, Project Name: ${project.Name}, Folder Name: ${project.id}\n`;

    await fs.promises.mkdir(uploadDirectory, { recursive: true });
    // Ghi vào file log
    await fs.promises.appendFile(logFilePath, logMessage, 'utf8');
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
}

export const updateProjectController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;

    const body = _req.body;

    if (projectId) {
      const projectExit = await prisma.project.findFirst({
        where: {
          id: projectId
        }
      })

      const project = await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          Name: body.Name,
          Description: body.Description,
          CreateDate: new Date(body.CreateDate),
          ModifyDate: new Date(),
          isDelete: body.isDelete,
        },
      })

      const uploadDirectory = `\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database`;
      const logFilePath = path.join(uploadDirectory, 'log.txt');
      // Nội dung log

      let projetName = "";
      if (projectExit?.Name === project.Name) {
        projetName = `${project.Name}`;
      }
      else {
        projetName = `from ${projectExit?.Name} to ${project.Name}`;
      }
      const logMessage = `--Action: update, Time: ${formatDate(project.ModifyDate ?? new Date())}, Project Name: ${projetName}, Folder Name: ${projectId}\n`;

      await fs.promises.mkdir(uploadDirectory, { recursive: true });
      // Ghi vào file log
      await fs.promises.appendFile(logFilePath, logMessage, 'utf8');
      res.status(200).json(project);
    }
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
}

export const isDeleteProjectController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;

    const { status } = _req.body;

    if (projectId) {
      const project = await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          ModifyDate: new Date(),
          isDelete: Boolean(status),
        },
      })

      const uploadDirectory = `\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database`;
      const logFilePath = path.join(uploadDirectory, 'log.txt');
      // Nội dung log
      let actionDelete = "";
      if (project.isDelete === true) {
        actionDelete = "finish";
      }
      else {
        actionDelete = "active";
      }
      const logMessage = `--Action: ${actionDelete}, Time: ${formatDate(project.ModifyDate ?? new Date())}, Project Name: ${project.Name}, Folder Name: ${projectId}\n`;

      await fs.promises.mkdir(uploadDirectory, { recursive: true });
      // Ghi vào file log
      await fs.promises.appendFile(logFilePath, logMessage, 'utf8');
      res.status(200).json(project);
    }
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
}

export const updateStatusProjectController = async (_req: Request, res: Response) => {
  try {
    const { projectId } = _req.params;
    const { comply } = _req.body;

    if (projectId) {
      const project = await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          ModifyDate: new Date(),
          Status: comply,
        },
      })

      const uploadDirectory = `\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database`;
      const logFilePath = path.join(uploadDirectory, 'log.txt');

      const logMessage = `--Action: ${comply}, Time: ${formatDate(project.ModifyDate ?? new Date())}, Project Name: ${project.Name}, Folder Name: ${projectId}\n`;

      await fs.promises.mkdir(uploadDirectory, { recursive: true });
      // Ghi vào file log
      await fs.promises.appendFile(logFilePath, logMessage, 'utf8');
      res.status(200).json(project);
    }
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
}
