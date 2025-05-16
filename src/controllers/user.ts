import express, { Request, Response, NextFunction } from "express";
import path from 'path';
import formatDate from "../util/formatDate";
import prisma from '../lib/db';

export const getCurrentUserController = async (_req: Request, res: Response) => {
  try {
    const { userId } = _req.params;
    const user = await prisma.user.findFirst({
      where: { id: Number(userId) }
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
