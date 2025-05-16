/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
import express, { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { commitController, backupController, commitAndBackupController, getBackUpViewController, restoreViewController, restoreCommitController } from "../controllers/function";
import formatDate from "../util/formatDate";

const router = Router();

router.post('/commit/:projectId', commitController);
router.post('/backup/:projectId', backupController);
router.post('/conbine/:projectId', commitAndBackupController);
router.get('/backup/get/:projectId', getBackUpViewController);
router.get('/restore/view/:backupFileId', restoreViewController);
router.post('/restore/commit/:backupFileId', restoreCommitController);


const uploadDirectory = '\\\\192.168.0.10\\1-Engineering\\1.3-Engineering_Department\\1.3.2-Projects\\Kevin Wong\\ArchSD SoA\\02-Database';

// Kiểm tra xem thư mục `uploads` có tồn tại không, nếu không thì tạo nó
fs.promises.mkdir(uploadDirectory, { recursive: true }).catch(console.error);

// Config
// Cài đặt multer để xác định thư mục và tên tệp tải lên
const multerStorage = multer.diskStorage({

});

const upload = multer({ storage: multerStorage });

// Middleware kiểm tra tính hợp lệ của file
const checkFileValidVM = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).send("No files uploaded.");
    return;
  }
  next();
};

// Routes
router.post('/upload/:projectId', upload.any(), checkFileValidVM, async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const projectId = req.params.projectId;
    const folderDate = String(req.body.date);

    if (!files || files.length === 0) {
      res.status(400).send("Failed Upload");
      return;
    }

    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const folderType = fileExtension.includes("ifc") ? "ifc" : "excel";
      const backupPath = path.join(uploadDirectory, projectId, "Backup", folderDate, folderType, file.originalname);
      // Tạo thư mục backup nếu chưa có
      await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
      // Sao chép tệp vào thư mục backup
      await fs.promises.copyFile(file.path, backupPath);
    }

    const logFilePath = path.join(uploadDirectory, projectId, "log.txt");
    const backupDirectory = path.join(uploadDirectory, projectId, "Backup", folderDate);
    const logMessage = `--Action: commit, Time: ${formatDate(new Date())}, Folder Name: ${folderDate}, Url: ${backupDirectory}\n`;
    // Tạo thư mục chính nếu chưa tồn tại
    await fs.promises.mkdir(path.dirname(logFilePath), { recursive: true });
    // Ghi vào file log
    await fs.promises.appendFile(logFilePath, logMessage, 'utf8');

    res.send("Successfully!");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error");
  }
});

router.get('/upload', async (_req: Request, res: Response) => {
  const uploadDirectoryPath = _req.query.path as string;
  const filename = String(uploadDirectoryPath.split("\\").pop());
  const filePath = path.join(uploadDirectoryPath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(400).send(`Unable to find: ${filename}`);
      return;
    }
    res.sendFile(filePath);
  });
});


export default router;