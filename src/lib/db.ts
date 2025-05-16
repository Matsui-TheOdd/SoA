import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;

export const PORT = typeof process !== "undefined" ? process.env.PORT || 3000 : 3000;
;
