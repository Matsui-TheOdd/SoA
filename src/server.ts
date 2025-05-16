import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import userRouter from "./routes/user";
import projectsRouter from "./routes/project";
import excelsRouter from "./routes/excel";
import soasRouter from "./routes/soa";
import ifcFilesRouter from "./routes/ifcFile";
import functionsRouter from "./routes/function";

const app = express();

app.use(morgan("dev"));
// app.use(express.json());
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

// #region User
app.use('/api/user', userRouter);
// #endregion

// #region Projects
app.use('/api/projects', projectsRouter);
// #endregion

// #region Excels
app.use('/api', excelsRouter);
// #endregion

// #region SoAs
app.use('/api', soasRouter);
// #endregion

// #region IfcFile
app.use('/api', ifcFilesRouter);
// #endregion

// #region Function
app.use('/api/function', functionsRouter);
// #endregion

export default app;

