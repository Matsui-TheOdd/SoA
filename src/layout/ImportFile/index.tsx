/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable import/extensions */
/* eslint-disable no-alert */
/* eslint-disable import/no-unresolved */
/* eslint-disable prefer-template */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
import ExcelJS from "exceljs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as CUI from "@thatopen/ui-obc";
import * as BUI from "@thatopen/ui";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import {
  _isColumnsSortingCoupledToGroup,
  ColDef,
  ColGroupDef,
  ValueGetterParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import axios from "axios";
import Paper from "@mui/material/Paper";
import ModalJoy from "@mui/joy/Modal";
import DeleteIcon from "@mui/icons-material/Delete";
import { ProjectModel } from "@model/ProjectModel";
import { ExcelModel } from "@model/ExcelModel";
import { SoAModel } from "@model/SoAModel";
import { PORT } from "@lib/db";
import { useNavigate } from "react-router-dom";
import { IFCFileModel } from "@model/IFCFileModel";
import { BackUpModel } from "@model/BackUpModel";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { AlertColor } from "@mui/material";
import FileUpload from "./FileUpLoad";
import { FragmentIdMap, FragmentsGroup } from "@thatopen/fragments";
import { isBlank } from "../../util/isBlank";

interface StateSnackBar extends SnackbarOrigin {
  open: boolean;
  type: number;
  message: string;
}

interface IFCNameArea {
  IFCName: string;
  IFCArea: string;
}

interface IFCItemOld {
  IFCRefNo: string;
  IFCNameArea: IFCNameArea;
  IFCNoRoom: number;
  modelID: string | undefined;
}

interface IFCItemNew {
  IFCRefNo: string;
  IFCNameList: IFCNameArea[];
  IFCNoRoom: number;
  modelID: string | undefined;
}

const ImportFile = (props: {
  userId: number;
  projectId: string;
  selectedBackupID: string;
}) => {
  const components = new OBC.Components();
  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stateSnackBar, setStateSnackBar] = React.useState<StateSnackBar>({
    open: false,
    message: "",
    type: 0,
    vertical: "top",
    horizontal: "center",
  });

  const navigate = useNavigate();

  const { vertical, horizontal, open, message, type } = stateSnackBar;

  const getSeverity = (type: number): AlertColor => {
    switch (type) {
      case 0:
        return "success";
      case 1:
        return "error";
      case 2:
        return "warning";
      default:
        return "info";
    }
  };

  const handleSnackBarClick =
    (newState: SnackbarOrigin, status: string, typeInput: number) => () => {
      setStateSnackBar({
        ...newState,
        open: true,
        message: status,
        type: typeInput,
      });
    };

  const handleSnackBarClose = () => {
    setStateSnackBar({ ...stateSnackBar, open: false });
  };

  const [excelFileUpload, setExcelFileUpload] = useState<File[]>([]);
  const [ifcFileUpload, setIfcFileUpload] = useState<File[]>([]);

  const [project, setProject] = useState<ProjectModel>();

  const [excel, setExcel] = useState<ExcelModel[]>([]);
  const [deleteExcel, setDeleteExcel] = useState<ExcelModel[]>([]);

  const [soaBefore, setSoABefore] = useState<SoAModel[]>([]);

  const [ifcFile, setIFCFile] = useState<IFCFileModel[]>([]);
  const [deleteIFCFile, setDeleteIFCFile] = useState<IFCFileModel[]>([]);

  const [backup, setBackUp] = useState<BackUpModel[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackUpModel | null>(
    null
  );

  const [openModalExport, setOpenModalExport] = useState<boolean>(false);
  const [checkOnClick, setCheckOnClick] = useState<boolean>(false);

  const ActionExcelDelete = (params: ValueGetterParams<ExcelModel>) => {
    return (
      <Box sx={{ display: "flex", gap: 1, m: 1, position: "relative" }}>
        <Tooltip title="Delete Excel" arrow>
          <Fab
            color="error"
            sx={{ width: 40, height: 40 }}
            onClick={() => handleDeleteExcel(params.data as ExcelModel)}
          >
            <DeleteIcon />
          </Fab>
        </Tooltip>
      </Box>
    );
  };

  const ActionIFCDelete = (params: ValueGetterParams<IFCFileModel>) => {
    return (
      <Box sx={{ display: "flex", gap: 1, m: 1, position: "relative" }}>
        <Tooltip title="Delete IFC" arrow>
          <Fab
            color="error"
            sx={{ width: 40, height: 40 }}
            onClick={() => handleDeleteIFCFile(params.data as IFCFileModel)}
          >
            <DeleteIcon />
          </Fab>
        </Tooltip>
      </Box>
    );
  };

  const [columnExcelDefs, setColumnExcelDefs] = useState<
    (ColDef<any, any> | ColGroupDef<any>)[]
  >([
    {
      headerName: "Name",
      field: "Name",
      autoHeight: true,
      width: 550,
    },
    {
      field: "Action",
      cellRenderer: ActionExcelDelete,
      autoHeight: true,
      width: 150,
    },
  ]);

  const [columnIFCDefs, setColumnIFCDefs] = useState<
    (ColDef<any, any> | ColGroupDef<any>)[]
  >([
    {
      headerName: "Name",
      field: "Name",
      autoHeight: true,
      width: 550,
    },
    {
      field: "Action",
      cellRenderer: ActionIFCDelete,
      autoHeight: true,
      width: 150,
    },
  ]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      editable: true,
      filter: true,
    };
  }, []);

  // #region useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (props.projectId && props.userId !== 0) {
        try {
          const response = await fetch(
            `http://localhost:${PORT}/api/projects/${props.userId}/${props.projectId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok)
            throw new Error(
              `Network response was not ok: ${response.statusText}`
            );
          const obj = await response.json();
          if (obj) {
            const ex: ProjectModel = {
              id: obj.id,
              Name: obj.Name,
              Description: obj.Description,
              CreateDate: new Date(obj.CreateDate),
              ModifyDate: new Date(obj.ModifyDate),
              isDelete: obj.isDelete,
              Status: "",
            };
            setProject(ex);
            return ex;
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          return null;
        }
      }
      return null;
    };

    fetchData();
  }, [props.projectId, props.userId]);

  useEffect(() => {
    if (props.selectedBackupID) {
      if (!isBlank(props.selectedBackupID)) {
        if (props.selectedBackupID === "new") {
          const fetchData = async () => {
            try {
              if (project && project.id) {
                setIsLoading(true);

                // Fetch Excel data
                const dataExcel = await getExcelDb(project.id);
                if (dataExcel) {
                  setExcel(dataExcel);

                  // Fetch SoA data
                  const dataSoA: SoAModel[] = [];
                  for (const item of dataExcel) {
                    const soaRows = await getSoADb(item.id);
                    if (soaRows && soaRows.length > 0) {
                      dataSoA.push(...soaRows);
                    }
                  }
                  setSoABefore(dataSoA);

                  // Fetch Excel files
                  const excelFiles = await Promise.all(
                    dataExcel.map(async (item) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.xlsx");
                    })
                  );
                  setExcelFileUpload(excelFiles);
                }

                // Fetch IFC files
                const dataIFCFile = await getIFCFileDb(project.id);
                if (dataIFCFile) {
                  setIFCFile(dataIFCFile);
                  const ifcFiles = await Promise.all(
                    dataIFCFile.map(async (item) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.ifc");
                    })
                  );
                  setIfcFileUpload(ifcFiles);
                }

                // Fetch Backup data
                const dataBackUp = await getBackUpDb(props.projectId);
                if (dataBackUp) {
                  setBackUp(dataBackUp);
                }
              }
            } catch (error) {
              console.error("Error in fetchData:", error);
            } finally {
              setIsLoading(false);
            }
          };

          fetchData();
        } else if (props.selectedBackupID === "back") {
          const fetchData = async () => {
            try {
              if (project && project.id) {
                setIsLoading(true);

                // Fetch Excel data
                const dataExcel = await getExcelDb(project.id);
                if (dataExcel) {
                  setExcel(dataExcel);

                  // Fetch SoA data
                  const dataSoA: SoAModel[] = [];
                  for (const item of dataExcel) {
                    const soaRows = await getSoADb(item.id);
                    if (soaRows && soaRows.length > 0) {
                      dataSoA.push(...soaRows);
                    }
                  }
                  setSoABefore(dataSoA);

                  // Fetch Excel files
                  const excelFiles = await Promise.all(
                    dataExcel.map(async (item) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.xlsx");
                    })
                  );
                  setExcelFileUpload(excelFiles);
                }

                // Fetch IFC files
                const dataIFCFile = await getIFCFileDb(project.id);
                if (dataIFCFile) {
                  setIFCFile(dataIFCFile);
                  const ifcFiles = await Promise.all(
                    dataIFCFile.map(async (item) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.ifc");
                    })
                  );
                  setIfcFileUpload(ifcFiles);
                }

                // Fetch Backup data
                const dataBackUp = await getBackUpDb(props.projectId);
                if (dataBackUp) {
                  setBackUp(dataBackUp);
                }
              }
            } catch (error) {
              console.error("Error in fetchData:", error);
            } finally {
              setIsLoading(false);
              setCheckOnClick(true);
            }
          };

          fetchData();
        } else if (props.selectedBackupID === "clear") {
          handleDeleteAllExcel();
          handleDeleteAllIFCFile();
        } else {
          const fetchData = async () => {
            try {
              if (project && project.id) {
                setIsLoading(true);

                const restoreData = await getRestoreDb(props.selectedBackupID);
                if (restoreData) {
                  const {
                    backupFile,
                    excelNewRecords,
                    soaNewRecords,
                    ifcNewRecords,
                  } = restoreData;

                  // Set new data for Excel and IFC
                  setExcel(excelNewRecords);
                  setSoABefore(soaNewRecords);
                  setIFCFile(ifcNewRecords);

                  // Fetch Excel files and update the state for excelFileUpload
                  const excelFiles = await Promise.all(
                    excelNewRecords.map(async (item: ExcelModel) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.xlsx");
                    })
                  );
                  setExcelFileUpload(excelFiles);

                  // Fetch IFC files and update the state for ifcFileUpload
                  const ifcFiles = await Promise.all(
                    ifcNewRecords.map(async (item: IFCFileModel) => {
                      const filename = item.URL.split("\\").pop();
                      const encodedPath = encodeURIComponent(item.URL);
                      const response = await fetch(
                        `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
                      );
                      if (!response.ok)
                        throw new Error(`Error fetching file: ${filename}`);
                      const blob = await response.blob();
                      return new File([blob], filename || "unknownFile.ifc");
                    })
                  );
                  setIfcFileUpload(ifcFiles);
                }
              }
            } catch (error) {
              console.error("Error in fetchData:", error);
            } finally {
              setIsLoading(false);
            }
          };

          fetchData();
        }
      }
    }
  }, [project, props.selectedBackupID]);

  useEffect(() => {}, []);

  // #endregion

  // #region Function
  const getExcelDb = async (
    projectId: string
  ): Promise<ExcelModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/${projectId}/excels`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.statusText}`);

      const obj = await response.json();
      const list: ExcelModel[] = [];

      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (
            typeof item.id === "string" &&
            typeof item.Name === "string" &&
            typeof item.URL === "string" &&
            typeof item.ImportDate === "string" &&
            typeof item.ProjectID === "string"
          ) {
            const ex: ExcelModel = {
              id: item.id,
              Name: item.Name,
              URL: item.URL,
              ImportDate: new Date(item.ImportDate),
              ProjectID: item.ProjectID,
            };
            list.push(ex);
          } else {
            console.warn("Invalid item format", item);
          }
        });
      } else {
        console.warn("Expected an array response, got:", obj);
      }

      return list;
    } catch (error) {
      console.error("Error fetching data:", error);
      return undefined;
    }
  };

  const getIFCFileDb = async (
    projectId: string
  ): Promise<IFCFileModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/${projectId}/ifcFiles`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.statusText}`);

      const obj = await response.json();
      const list: IFCFileModel[] = [];

      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (
            typeof item.id === "string" &&
            typeof item.Name === "string" &&
            typeof item.URL === "string" &&
            typeof item.ImportDate === "string" &&
            typeof item.ProjectID === "string"
          ) {
            const ifc: IFCFileModel = {
              id: item.id,
              Name: item.Name,
              URL: item.URL,
              ImportDate: new Date(item.ImportDate),
              ProjectID: item.ProjectID,
            };
            list.push(ifc);
          } else {
            console.warn("Invalid item format", item);
          }
        });
      } else {
        console.warn("Expected an array response, got:", obj);
      }

      return list;
    } catch (error) {
      console.error("Error fetching data:", error);
      return undefined;
    }
  };

  const getSoADb = async (excelId: string): Promise<SoAModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/${excelId}/soas`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.statusText}`);

      const obj = await response.json();
      const list: SoAModel[] = [];

      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (
            typeof item.id === "string" &&
            typeof item.RefNo === "string" &&
            typeof item.Description === "string" &&
            typeof item.Rooms === "string" &&
            typeof item.UnitArea === "string" &&
            typeof item.CellularRoom === "string" &&
            typeof item.OpenPlan === "string" &&
            typeof item.SpecialRequirement === "string" &&
            typeof item.ExcelID === "string"
          ) {
            const s: SoAModel = {
              id: item.id,
              RefNo: item.RefNo,
              Description: item.Description,
              Rooms: item.Rooms,
              UnitArea: item.UnitArea,
              CellularRoom: item.CellularRoom,
              OpenPlan: item.OpenPlan,
              SpecialRequirement: item.SpecialRequirement,
              ExcelID: item.ExcelID,
            };
            list.push(s);
          } else {
            console.warn("Invalid item format", item);
          }
        });
      } else {
        console.warn("Expected an array response, got:", obj);
      }

      return list;
    } catch (error) {
      console.error("Error fetching data:", error);
      return undefined;
    }
  };

  const getBackUpDb = async (
    projectId: string
  ): Promise<BackUpModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/function/backup/get/${projectId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const obj = await response.json();
      const list: BackUpModel[] = [];

      if (Array.isArray(obj.backupFile)) {
        obj.backupFile.forEach((item: BackUpModel) => {
          if (
            typeof item.id === "string" &&
            typeof item.ImportDate === "string" &&
            typeof item.ProjectID === "string"
          ) {
            const bk: BackUpModel = {
              id: item.id,
              ImportDate: new Date(item.ImportDate),
              ProjectID: item.ProjectID,
            };
            list.push(bk);
          } else {
            console.warn("Invalid item format", item);
          }
        });
      } else {
        console.warn("Expected an array response, got:", obj);
      }
      return list;
    } catch (error) {
      console.error("Error fetching data:", error);
      return undefined;
    }
  };

  const getRestoreDb = async (backupFileId: string) => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/function/restore/view/${backupFileId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const { restoreReq } = await response.json();

      const list = {
        backupFile: restoreReq.backupFile,
        excelNewRecords: restoreReq.excelNewRecords,
        soaNewRecords: restoreReq.soaNewRecords,
        ifcNewRecords: restoreReq.ifcNewRecords,
      };
      return list;
    } catch (error) {
      console.error("Error fetching data:", error);
      return undefined;
    }
  };

  const loadIfcModel = async (): Promise<FragmentsGroup[]> => {
    try {
      // Get the IFC file data
      if (!ifcFile || !ifcFile.length) {
        console.error("IFC file data is missing or invalid.");
        return [];
      }

      // Initialize the list of models
      const listModels: FragmentsGroup[] = [];

      // Process each IFC file
      for (const item of ifcFile) {
        try {
          const filename = item.URL.split("\\").pop();
          const encodedPath = encodeURIComponent(item.URL);

          // Fetch the file from the server
          const response = await fetch(
            `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
          );
          if (!response.ok) {
            throw new Error(`Error fetching file: ${filename}`);
          }

          // Convert the response to an ArrayBuffer
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Load the IFC model using the loader
          const ifcLoader = components.get(OBC.IfcLoader);
          await ifcLoader.setup(); // Ensure the loader is set up before loading
          const model = await ifcLoader.load(uint8Array);
          model.name = String(filename);

          // Add the loaded model to the list
          const fragmentsGroup = new FragmentsGroup();
          fragmentsGroup.add(model);

          listModels.push(fragmentsGroup);
        } catch (error) {
          console.error(`Error processing file ${item.URL}:`, error);
          // Optionally continue processing other files even if one fails
        }
      }

      return listModels;
    } catch (error) {
      console.error("Error loading IFC model:", error);
      return [];
    }
  };

  function processExcelFile(
    file: File,
    index: number
  ): Promise<{ processedDataBefore: SoAModel[]; fileInfo: ExcelModel }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const dataURL = event.target?.result;

        if (typeof dataURL === "string") {
          // Tách phần base64 từ data URL
          const base64Data = dataURL.split(",")[1];

          // Sử dụng thư viện XLSX để đọc dữ liệu từ base64
          const workbook = XLSX.read(base64Data, { type: "base64" });
          const sheetName = workbook.SheetNames[index];
          const sheet = workbook.Sheets[sheetName];

          const localURL = URL.createObjectURL(file);
          const fileInfo: ExcelModel = {
            id: crypto.randomUUID(),
            Name: file.name,
            URL: localURL,
            ImportDate: new Date(),
            ProjectID: String(props.projectId),
          };

          const rawData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          }) as unknown as string[][];

          const cleanedData = rawData.filter(
            (row) => row[0]?.toString().trim() !== ""
          );

          const dataToProcess = cleanedData.slice(2);

          let start = false;
          let end = false;
          const processedDataBefore = dataToProcess.flatMap((row) => {
            if (!isBlank(row[0]) && !isBlank(row[1]) && !isBlank(row[2])) {
              if (row[0]?.toString().includes("Part")) {
                start = true;
              }
              if (row[0] === "For Use by Government Property Agency Only:") {
                end = true;
              }

              if (
                !row[0]?.toString().includes("Part") &&
                start === true &&
                end === false
              ) {
                const id = crypto.randomUUID();
                let descriptionTail = "";
                if (!isBlank(row[3])) {
                  descriptionTail = ` (${row[3]})`;
                }
                const baseRow: Omit<SoAModel, "id"> = {
                  RefNo: String(row[0]) || "",
                  Rooms: String(row[4]) || "-",
                  Description: String(row[2] + descriptionTail) || "",
                  UnitArea: String(row[5]) || "",
                  CellularRoom: String(row[6]) || "",
                  OpenPlan: String(row[7]) || "",
                  SpecialRequirement: row[10] || "",
                  ExcelID: fileInfo.id,
                };

                return [
                  {
                    ...baseRow,
                    id: `${id}`,
                  },
                ];
              }
            }
            return [];
          });

          resolve({ processedDataBefore, fileInfo });
        } else {
          reject(new Error("Invalid file format: data is not a string."));
        }
      };

      reader.onerror = (error) => reject(error);
    });
  }

  const handleExcelFileUpload = async (files: FileList) => {
    if (!files) return;

    const fileArray = Array.from(files);
    setExcelFileUpload((prevFiles) => [...prevFiles, ...fileArray]);

    // const promiseSheet1 = Array.from(files).map((file) =>
    //   processExcelFile(file, 0)
    // );

    const promiseSheet2 = Array.from(files).map((file) =>
      processExcelFile(file, 1)
    );

    const promises = [...promiseSheet2];

    Promise.all(promises)
      .then((results) => {
        const beforeData = results.flatMap(
          (result) => result.processedDataBefore
        );

        const fileInfo = results.map((result) => result.fileInfo);

        setExcel((prevData) => {
          const newData = [...prevData];

          fileInfo.forEach((item) => {
            const index = newData.findIndex(
              (existingItem) => existingItem.Name === item.Name
            );

            if (index !== -1) {
              setDeleteExcel((prevData) => {
                const obj = [...prevData];
                obj.push(newData[index]);
                return obj;
              });
              newData[index] = {
                id: item.id,
                Name: item.Name,
                URL: item.URL,
                ImportDate: item.ImportDate,
                ProjectID: item.ProjectID,
              };
            } else {
              newData.push({
                id: item.id,
                Name: item.Name,
                URL: item.URL,
                ImportDate: item.ImportDate,
                ProjectID: item.ProjectID,
              });
            }
          });
          return newData;
        });

        setSoABefore((prevData) => {
          const newData = [...prevData];

          beforeData.forEach((item) => {
            const index = newData.findIndex(
              (existingItem) =>
                existingItem.id === item.id ||
                (existingItem.ExcelID !== item.ExcelID &&
                  existingItem.RefNo === item.RefNo)
            );

            if (index !== -1) {
              newData[index] = item;
            } else {
              newData.push(item);
            }
          });

          return newData;
        });

        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Upload files success!",
          0
        )();
      })
      .catch((error) => {
        console.error("Error processing files:", error);
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Upload files failed!",
          1
        )();
      });
  };

  const handleIFCFileUpload = async (fileList: FileList) => {
    if (fileList && fileList.length > 0) {
      try {
        const fileArray = Array.from(fileList);
        setIfcFileUpload((prevFiles) => [...prevFiles, ...fileArray]);

        const newIFCFiles: IFCFileModel[] = Array.from(fileList).map(
          (file) => ({
            id: crypto.randomUUID(),
            Name: file.name,
            URL: URL.createObjectURL(file),
            ImportDate: new Date(),
            ProjectID: props.projectId,
          })
        );

        setIFCFile((prevIFCFiles) => {
          const updatedIFCFiles = [...prevIFCFiles];

          newIFCFiles.forEach((newFile) => {
            const existingIndex = updatedIFCFiles.findIndex(
              (existingFile) => existingFile.Name === newFile.Name
            );

            if (existingIndex !== -1) {
              setDeleteIFCFile((prevDeleteIFCFiles) => [
                ...prevDeleteIFCFiles,
                updatedIFCFiles[existingIndex],
              ]);

              updatedIFCFiles[existingIndex] = newFile;
            } else {
              updatedIFCFiles.push(newFile);
            }
          });

          return updatedIFCFiles;
        });

        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Upload files success!",
          0
        )();
      } catch (error) {
        console.error("Error processing files:", error);
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Upload files failed!",
          1
        )();
      }
    }
  };

  const handleDeleteExcel = (row: ExcelModel) => {
    try {
      setExcel((prev) => prev.filter((item) => item.id !== row.id));

      setDeleteExcel((prevData) => {
        const newData = [...prevData];
        newData.push(row);
        return newData;
      });

      console.log(excelFileUpload);
      setExcelFileUpload((prevSelected) => {
        if (prevSelected) {
          return prevSelected.filter((file) => file.name !== row.Name);
        }
        return prevSelected;
      });

      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Delete excel success!",
        2
      )();
    } catch (error) {
      console.error("Error processing files:", error);
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Delete excel failed!",
        1
      )();
    }
  };

  const handleDeleteAllExcel = () => {
    try {
      setExcel([]);

      setDeleteExcel((prevData) => {
        const newData = [...prevData];
        excel.forEach((item) => {
          newData.push(item);
        });
        return newData;
      });

      setExcelFileUpload([]);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  const handleDeleteIFCFile = (row: IFCFileModel) => {
    try {
      setIFCFile((prev) => prev.filter((item) => item.id !== row.id));

      setDeleteIFCFile((prevData) => {
        const newData = [...prevData];
        newData.push(row);
        return newData;
      });

      setIfcFileUpload((prevSelected) => {
        if (prevSelected) {
          return prevSelected.filter((file) => file.name !== row.Name);
        }
        return prevSelected;
      });

      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Delete ifc file success!",
        2
      )();
    } catch (error) {
      console.error("Error processing files:", error);
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Delete ifc file failed!",
        1
      )();
    }
  };

  const handleDeleteAllIFCFile = () => {
    try {
      setIFCFile([]);

      setDeleteIFCFile((prevData) => {
        const newData = [...prevData];
        ifcFile.forEach((item) => {
          newData.push(item);
        });
        return newData;
      });

      setIfcFileUpload([]);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  const handleBackUpSelection = async (selectedBackupID: string) => {
    try {
      const restoreData = await getRestoreDb(selectedBackupID);
      if (restoreData) {
        const { backupFile, excelNewRecords, soaNewRecords, ifcNewRecords } =
          restoreData;

        // Set new data for Excel and IFC
        setExcel(excelNewRecords);
        setSoABefore(soaNewRecords);
        setIFCFile(ifcNewRecords);

        // Fetch Excel files and update the state for excelFileUpload
        const excelFiles = await Promise.all(
          excelNewRecords.map(async (item: ExcelModel) => {
            const filename = item.URL.split("\\").pop();
            const encodedPath = encodeURIComponent(item.URL);
            const response = await fetch(
              `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
            );
            if (!response.ok)
              throw new Error(`Error fetching file: ${filename}`);
            const blob = await response.blob();
            return new File([blob], filename || "unknownFile.xlsx");
          })
        );
        setExcelFileUpload(excelFiles);

        // Fetch IFC files and update the state for ifcFileUpload
        const ifcFiles = await Promise.all(
          ifcNewRecords.map(async (item: IFCFileModel) => {
            const filename = item.URL.split("\\").pop();
            const encodedPath = encodeURIComponent(item.URL);
            const response = await fetch(
              `http://localhost:${PORT}/api/function/upload?path=${encodedPath}`
            );
            if (!response.ok)
              throw new Error(`Error fetching file: ${filename}`);
            const blob = await response.blob();
            return new File([blob], filename || "unknownFile.ifc");
          })
        );
        setIfcFileUpload(ifcFiles);
      }
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Restore files success!",
        3
      )();
    } catch (error) {
      console.error("Error processing files:", error);
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        "Restore files failed!",
        1
      )();
    }
  };

  function hasValue(field: any) {
    return field && !isBlank(field);
  }

  const handleCommitFile = async () => {
    if (props.projectId) {
      setIsLoading(true);

      const formData = new FormData();

      // Append files to formData
      excelFileUpload.forEach((file) => formData.append("excel", file));
      ifcFileUpload.forEach((file) => formData.append("ifc", file));

      const commitTime = new Date();
      const date = commitTime.toISOString().slice(0, 19).replace(/[:.]/g, "-");
      formData.append("date", date);

      try {
        // Upload files
        const responseUpload = await axios.post(
          `http://localhost:${PORT}/api/function/upload/${props.projectId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        // Prepare data for commit
        const soaRows = excel.flatMap((newExcel) =>
          soaBefore
            .filter((item) => item.ExcelID === newExcel.id)
            .map((item) => ({
              id: item.id,
              RefNo: item.RefNo,
              Description: item.Description,
              Rooms: item.Rooms,
              UnitArea: item.UnitArea,
              CellularRoom: item.CellularRoom,
              OpenPlan: item.OpenPlan,
              SpecialRequirement: item.SpecialRequirement,
              ExcelID: newExcel.id,
            }))
        );

        // Commit data
        const responseCommit = await fetch(
          `http://localhost:${PORT}/api/function/conbine/${props.projectId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ifcFileList: ifcFile,
              excelList: excel,
              soaList: soaRows,
              importDate: date,
            }),
          }
        );

        if (!responseCommit.ok || responseUpload.status !== 200) {
          throw new Error("Failed to submit");
        }

        await responseCommit.json();
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Commit success!",
          0
        )();
      } catch (error) {
        console.error("Error occurred:", error);
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Commit Failed",
          1
        )();
      } finally {
        setIsLoading(false);
        navigate(
          `/${props.userId}/Projects/${props.projectId}/ImportFile/back`
        );
      }
    }
  };

  const provisionNumbers = (percentageDifference: number): string => {
    if (
      (percentageDifference < 0 && percentageDifference >= -10) ||
      (percentageDifference > 0 && percentageDifference <= 10)
    ) {
      return "Under-provision";
    }

    if (percentageDifference === 0) {
      return "Under-provision";
    }

    return "Over-provision";
  };

  const handleExportValue = async (
    exportTable: IFCItemNew[],
    soaBefore: SoAModel[]
  ) => {
    try {
      const newData: SoAModel[] = soaBefore
        .map((row) => {
          const baseRow: SoAModel = {
            id: row.id,
            RefNo: row.RefNo,
            Rooms: String(row.Rooms),
            Description: row.Description,
            UnitArea: String(row.UnitArea),
            CellularRoom: String(row.CellularRoom),
            OpenPlan: String(row.OpenPlan),
            SpecialRequirement: row.SpecialRequirement,
            ExcelID: row.ExcelID,
          };

          const generatedRows: SoAModel[] = [];
          generatedRows.push(baseRow);

          return generatedRows;
        })
        .flat();

      if (newData.length > 0) {
        try {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet("SOA Data");

          // Định nghĩa tiêu đề
          const columns = [
            { header: "SoA_Ref. No.", key: "RefNo", width: 15 },
            {
              header: "Name",
              key: "Description",
              width: 25,
            },
            { header: "No. of Rooms.", key: "Rooms", width: 15 },
            { header: "Unit Area", key: "UnitArea", width: 20 },
            { header: "Cellular Room", key: "CellularRoom", width: 15 },
            { header: "Open Plan", key: "OpenPlan", width: 15 },
            {
              header: "Other Requirement",
              key: "SpecialRequirement",
              width: 40,
            },
            { header: "Room Name in BIM Model", key: "roomName", width: 15 },
            { header: "Provied Area", key: "area", width: 15 },
            { header: "Diff", key: "minus", width: 15 },
            { header: "% Diff", key: "percent", width: 15 },
            {
              header: "Total Area of Multi-Room Required",
              key: "TotalAreaRequired",
              width: 15,
            },
            {
              header: "Total Area of Multi-Room Provided",
              key: "TotalAreaProvided",
              width: 15,
            },
            {
              header: "Total Diff (Multi-Room)",
              key: "TotalMinus",
              width: 15,
            },
            {
              header: "Total % Diff (Multi-Room)",
              key: "TotalPercent",
              width: 15,
            },
            {
              header: "No. of Rooms Required",
              key: "TotalRoomRequired",
              width: 15,
            },
            {
              header: "No. of Rooms Provided",
              key: "TotalRoomProvided",
              width: 15,
            },
          ];

          worksheet.columns = columns;

          // Sắp xếp dữ liệu theo RefNo
          const sortedData = newData.sort((a: any, b: any) => {
            const soaRefNoA = a.RefNo.split(".");
            const soaRefNoB = b.RefNo.split(".");

            for (
              let i = 0;
              i < Math.max(soaRefNoA.length, soaRefNoB.length);
              i++
            ) {
              const partA = soaRefNoA[i] || "";
              const partB = soaRefNoB[i] || "";

              // So sánh chuỗi, trả về thứ tự tương ứng
              if (partA !== partB) {
                return partA.localeCompare(partB, undefined, {
                  numeric: true,
                });
              }
            }
            return 0;
          });

          const rowList: any[] = [];

          // Ghi dữ liệu vào sheet
          sortedData.forEach((rowSoA) => {
            exportTable.forEach((rowIFC: IFCItemNew) => {
              if (rowSoA.RefNo === rowIFC.IFCRefNo) {
                if (Number(rowSoA.Rooms) === rowIFC.IFCNoRoom) {
                  let count = 0;
                  for (let i = 0; i < rowIFC.IFCNoRoom; i++) {
                    if (
                      rowSoA.UnitArea !== "" &&
                      rowIFC.IFCNameList[i].IFCArea !== ""
                    ) {
                      if (
                        !Number.isNaN(Number(rowSoA.UnitArea)) &&
                        !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
                      ) {
                        const percentString =
                          Number(rowSoA.UnitArea) !== 0
                            ? Number(
                                (
                                  ((Number(rowIFC.IFCNameList[i].IFCArea) -
                                    Number(rowSoA.UnitArea)) /
                                    Number(rowSoA.UnitArea)) *
                                  100
                                ).toFixed(2)
                              )
                            : "0";
                        if (count === 0) {
                          const toltalPercent = Number(
                            (
                              ((Number(
                                rowIFC.IFCNameList.reduce(
                                  (sum, item) =>
                                    sum + Number(item.IFCArea || 0),
                                  0
                                )
                              ) -
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) /
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) *
                              100
                            ).toFixed(2)
                          );
                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired:
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalAreaProvided: rowIFC.IFCNameList.reduce(
                              (sum, item) => sum + Number(item.IFCArea || 0),
                              0
                            ),
                            TotalMinus:
                              rowIFC.IFCNameList.reduce(
                                (sum, item) => sum + Number(item.IFCArea || 0),
                                0
                              ) -
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalPercent: String(`${toltalPercent}%`),
                            TotalRoomRequired: rowSoA.Rooms,
                            TotalRoomProvided: rowIFC.IFCNoRoom,
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 1,
                          };

                          rowList.push(newRow);
                        } else {
                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired: "",
                            TotalAreaProvided: "",
                            TotalMinus: "",
                            TotalPercent: "",
                            TotalRoomRequired: "",
                            TotalRoomProvided: "",
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 1,
                          };

                          rowList.push(newRow);
                        }
                      } else {
                        const newRow = {
                          RefNo: rowSoA.RefNo,
                          Description: rowSoA.Description,
                          Rooms: rowSoA.Rooms,
                          UnitArea: rowIFC.IFCNameList[i].IFCArea,
                          CellularRoom: rowSoA.CellularRoom,
                          OpenPlan: rowSoA.OpenPlan,
                          SpecialRequirement: rowSoA.SpecialRequirement,
                          roomName: rowIFC.IFCNameList[i].IFCName,
                          area: rowIFC.IFCNameList[i].IFCArea,
                          minus: 0,
                          percent: "0%",
                          TotalAreaRequired:
                            Number(rowIFC.IFCNameList[i].IFCArea) *
                            Number(rowSoA.Rooms),
                          TotalAreaProvided: rowIFC.IFCNameList.reduce(
                            (sum, item) => sum + Number(item.IFCArea || 0),
                            0
                          ),
                          TotalMinus: 0,
                          TotalPercent: "0%",
                          TotalRoomRequired: rowSoA.Rooms,
                          TotalRoomProvided: rowIFC.IFCNoRoom,
                          provision: provisionNumbers(0),
                          isRoomNumber: 1,
                        };

                        rowList.push(newRow);
                      }
                    }
                    count++;
                  }
                } else if (Number(rowSoA.Rooms) < rowIFC.IFCNoRoom) {
                  let count = 0;
                  for (let i = 0; i < Number(rowSoA.Rooms); i++) {
                    if (
                      rowSoA.UnitArea !== "" &&
                      rowIFC.IFCNameList[i].IFCArea !== ""
                    ) {
                      if (
                        !Number.isNaN(Number(rowSoA.UnitArea)) &&
                        !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
                      ) {
                        const percentString =
                          Number(rowSoA.UnitArea) !== 0
                            ? Number(
                                (
                                  ((Number(rowIFC.IFCNameList[i].IFCArea) -
                                    Number(rowSoA.UnitArea)) /
                                    Number(rowSoA.UnitArea)) *
                                  100
                                ).toFixed(2)
                              )
                            : "0";
                        if (count === 0) {
                          const totalPercent = Number(
                            (
                              ((Number(
                                rowIFC.IFCNameList.reduce(
                                  (sum, item) =>
                                    sum + Number(item.IFCArea || 0),
                                  0
                                )
                              ) -
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) /
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) *
                              100
                            ).toFixed(2)
                          );
                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired:
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalAreaProvided: rowIFC.IFCNameList.reduce(
                              (sum, item) => sum + Number(item.IFCArea || 0),
                              0
                            ),
                            TotalMinus:
                              rowIFC.IFCNameList.reduce(
                                (sum, item) => sum + Number(item.IFCArea || 0),
                                0
                              ) -
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalPercent: String(`${totalPercent}%`),
                            TotalRoomRequired: rowSoA.Rooms,
                            TotalRoomProvided: rowIFC.IFCNoRoom,
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 0,
                          };

                          rowList.push(newRow);
                        } else {
                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired: "",
                            TotalAreaProvided: "",
                            TotalMinus: "",
                            TotalPercent: "",
                            TotalRoomRequired: "",
                            TotalRoomProvided: "",
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 0,
                          };

                          rowList.push(newRow);
                        }
                      } else {
                        const totalPercent = Number(
                          (
                            ((Number(
                              rowIFC.IFCNameList.reduce(
                                (sum, item) => sum + Number(item.IFCArea || 0),
                                0
                              )
                            ) -
                              Number(
                                Number(rowIFC.IFCNameList[i].IFCArea) *
                                  Number(rowSoA.Rooms)
                              )) /
                              Number(
                                Number(rowIFC.IFCNameList[i].IFCArea) *
                                  Number(rowSoA.Rooms)
                              )) *
                            100
                          ).toFixed(2)
                        );

                        const newRow = {
                          RefNo: rowSoA.RefNo,
                          Description: rowSoA.Description,
                          Rooms: rowSoA.Rooms,
                          UnitArea: rowIFC.IFCNameList[i].IFCArea,
                          CellularRoom: rowSoA.CellularRoom,
                          OpenPlan: rowSoA.OpenPlan,
                          SpecialRequirement: rowSoA.SpecialRequirement,
                          roomName: rowIFC.IFCNameList[i].IFCName,
                          area: rowIFC.IFCNameList[i].IFCArea,
                          minus: 0,
                          percent: "0%",
                          TotalAreaRequired:
                            Number(rowIFC.IFCNameList[i].IFCArea) *
                            Number(rowSoA.Rooms),
                          TotalAreaProvided: rowIFC.IFCNameList.reduce(
                            (sum, item) => sum + Number(item.IFCArea || 0),
                            0
                          ),
                          TotalMinus:
                            rowIFC.IFCNameList.reduce(
                              (sum, item) => sum + Number(item.IFCArea || 0),
                              0
                            ) -
                            Number(rowIFC.IFCNameList[i].IFCArea) *
                              Number(rowSoA.Rooms),
                          TotalPercent: String(`${totalPercent}%`),
                          TotalRoomRequired: rowSoA.Rooms,
                          TotalRoomProvided: rowIFC.IFCNoRoom,
                          provision: provisionNumbers(0),
                          isRoomNumber: 0,
                        };

                        rowList.push(newRow);
                      }
                    }
                    count++;
                  }
                  for (
                    let i = Number(rowSoA.Rooms);
                    i < rowIFC.IFCNoRoom;
                    i++
                  ) {
                    if (rowIFC.IFCNameList[i].IFCArea !== "") {
                      const newRow = {
                        RefNo: "",
                        Description: "",
                        Rooms: "",
                        UnitArea: "",
                        CellularRoom: "",
                        OpenPlan: "",
                        SpecialRequirement: "",
                        roomName: rowIFC.IFCNameList[i].IFCName,
                        area: rowIFC.IFCNameList[i].IFCArea,
                        minus: "",
                        percent: "",
                        TotalAreaRequired: "",
                        TotalAreaProvided: "",
                        TotalMinus: "",
                        TotalPercent: "",
                        TotalRoomRequired: "",
                        TotalRoomProvided: "",
                        provision: provisionNumbers(0),
                        isRoomNumber: 0,
                      };

                      rowList.push(newRow);
                    }
                  }
                } else if (Number(rowSoA.Rooms) > rowIFC.IFCNoRoom) {
                  let count = 0;
                  for (let i = 0; i < rowIFC.IFCNoRoom; i++) {
                    if (
                      rowSoA.UnitArea !== "" &&
                      rowIFC.IFCNameList[i].IFCArea !== ""
                    ) {
                      if (
                        !Number.isNaN(Number(rowSoA.UnitArea)) &&
                        !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
                      ) {
                        const percentString =
                          Number(rowSoA.UnitArea) !== 0
                            ? Number(
                                (
                                  ((Number(rowIFC.IFCNameList[i].IFCArea) -
                                    Number(rowSoA.UnitArea)) /
                                    Number(rowSoA.UnitArea)) *
                                  100
                                ).toFixed(2)
                              )
                            : "0";
                        if (count === 0) {
                          const totalPercent = Number(
                            (
                              ((Number(
                                rowIFC.IFCNameList.reduce(
                                  (sum, item) =>
                                    sum + Number(item.IFCArea || 0),
                                  0
                                )
                              ) -
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) /
                                Number(
                                  Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)
                                )) *
                              100
                            ).toFixed(2)
                          );

                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired:
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalAreaProvided: rowIFC.IFCNameList.reduce(
                              (sum, item) => sum + Number(item.IFCArea || 0),
                              0
                            ),
                            TotalMinus:
                              rowIFC.IFCNameList.reduce(
                                (sum, item) => sum + Number(item.IFCArea || 0),
                                0
                              ) -
                              Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
                            TotalPercent: String(`${totalPercent}%`),
                            TotalRoomRequired: rowSoA.Rooms,
                            TotalRoomProvided: rowIFC.IFCNoRoom,
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 0,
                          };

                          rowList.push(newRow);
                        } else {
                          const newRow = {
                            RefNo: rowSoA.RefNo,
                            Description: rowSoA.Description,
                            Rooms: rowSoA.Rooms,
                            UnitArea: rowSoA.UnitArea,
                            CellularRoom: rowSoA.CellularRoom,
                            OpenPlan: rowSoA.OpenPlan,
                            SpecialRequirement: rowSoA.SpecialRequirement,
                            roomName: rowIFC.IFCNameList[i]?.IFCName,
                            area: rowIFC.IFCNameList[i]?.IFCArea,
                            minus:
                              Number(rowIFC.IFCNameList[i].IFCArea) -
                              Number(rowSoA.UnitArea),
                            percent: String(`${percentString}%`),
                            TotalAreaRequired: "",
                            TotalAreaProvided: "",
                            TotalMinus: "",
                            TotalPercent: "",
                            TotalRoomRequired: "",
                            TotalRoomProvided: "",
                            provision: provisionNumbers(Number(percentString)),
                            isRoomNumber: 0,
                          };

                          rowList.push(newRow);
                        }
                      } else {
                        const totalPercent = Number(
                          (
                            ((Number(
                              rowIFC.IFCNameList.reduce(
                                (sum, item) => sum + Number(item.IFCArea || 0),
                                0
                              )
                            ) -
                              Number(
                                Number(rowIFC.IFCNameList[i].IFCArea) *
                                  Number(rowSoA.Rooms)
                              )) /
                              Number(
                                Number(rowIFC.IFCNameList[i].IFCArea) *
                                  Number(rowSoA.Rooms)
                              )) *
                            100
                          ).toFixed(2)
                        );
                        const newRow = {
                          RefNo: rowSoA.RefNo,
                          Description: rowSoA.Description,
                          Rooms: rowSoA.Rooms,
                          UnitArea: rowIFC.IFCNameList[i].IFCArea,
                          CellularRoom: rowSoA.CellularRoom,
                          OpenPlan: rowSoA.OpenPlan,
                          SpecialRequirement: rowSoA.SpecialRequirement,
                          roomName: rowIFC.IFCNameList[i].IFCName,
                          area: rowIFC.IFCNameList[i].IFCArea,
                          minus: 0,
                          percent: "0%",
                          TotalAreaRequired:
                            Number(rowIFC.IFCNameList[i].IFCArea) *
                            Number(rowSoA.Rooms),
                          TotalAreaProvided: rowIFC.IFCNameList.reduce(
                            (sum, item) => sum + Number(item.IFCArea || 0),
                            0
                          ),
                          TotalMinus:
                            rowIFC.IFCNameList.reduce(
                              (sum, item) => sum + Number(item.IFCArea || 0),
                              0
                            ) -
                            Number(rowIFC.IFCNameList[i].IFCArea) *
                              Number(rowSoA.Rooms),
                          TotalPercent: String(`${totalPercent}%`),
                          TotalRoomRequired: rowSoA.Rooms,
                          TotalRoomProvided: rowIFC.IFCNoRoom,
                          provision: provisionNumbers(0),
                          isRoomNumber: 0,
                        };

                        rowList.push(newRow);
                      }
                    }
                    count++;
                  }

                  for (
                    let i = rowIFC.IFCNoRoom;
                    i < Number(rowSoA.Rooms);
                    i++
                  ) {
                    if (rowSoA.UnitArea !== "") {
                      const newRow = {
                        RefNo: rowSoA.RefNo,
                        Description: rowSoA.Description,
                        Rooms: rowSoA.Rooms,
                        UnitArea: rowSoA.UnitArea,
                        CellularRoom: rowSoA.CellularRoom,
                        OpenPlan: rowSoA.OpenPlan,
                        SpecialRequirement: rowSoA.SpecialRequirement,
                        roomName: "",
                        area: "",
                        minus: "",
                        percent: "",
                        TotalAreaRequired: "",
                        TotalAreaProvided: "",
                        TotalMinus: "",
                        TotalPercent: "",
                        TotalRoomRequired: "",
                        TotalRoomProvided: "",
                        provision: provisionNumbers(0),
                        isRoomNumber: 0,
                      };

                      rowList.push(newRow);
                    }
                  }
                }
              }
            });
          });

          rowList.forEach((item) => {
            if (hasValue(item.CellularRoom) && !hasValue(item.OpenPlan)) {
              const baseRow = {
                RefNo: item.RefNo,
                Description: item.Description,
                Rooms: 1,
                UnitArea: item.UnitArea,
                CellularRoom: item.UnitArea,
                OpenPlan: "",
                SpecialRequirement: item.SpecialRequirement,
                roomName: item.roomName,
                area: item.area,
                minus: item.minus,
                percent: item.percent,
                TotalAreaRequired: item.TotalAreaRequired,
                TotalAreaProvided: item.TotalAreaProvided,
                TotalMinus: item.TotalMinus,
                TotalPercent: item.TotalPercent,
                TotalRoomRequired: item.TotalRoomRequired,
                TotalRoomProvided: item.TotalRoomProvided,
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              if (isBlank(baseRow.roomName) && isBlank(baseRow.area)) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FF7600BC" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 0 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF5B00" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF0000" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Under-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "90EE90" },
                    };
                  }
                });
              } else if (item.isRoomNumber === 0) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FF7600BC" },
                    };
                  }
                });
              }
            } else if (
              hasValue(item.OpenPlan) &&
              !hasValue(item.CellularRoom)
            ) {
              const baseRow = {
                RefNo: item.RefNo,
                Description: item.Description,
                Rooms: 1,
                UnitArea: item.UnitArea,
                CellularRoom: "",
                OpenPlan: item.UnitArea,
                SpecialRequirement: item.SpecialRequirement,
                roomName: item.roomName,
                area: item.area,
                minus: item.minus,
                percent: item.percent,
                TotalAreaRequired: item.TotalAreaRequired,
                TotalAreaProvided: item.TotalAreaProvided,
                TotalMinus: item.TotalMinus,
                TotalPercent: item.TotalPercent,
                TotalRoomRequired: item.TotalRoomRequired,
                TotalRoomProvided: item.TotalRoomProvided,
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              if (isBlank(baseRow.roomName) && isBlank(baseRow.area)) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FF7600BC" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 0 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF5B00" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF0000" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Under-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "90EE90" },
                    };
                  }
                });
              } else if (item.isRoomNumber === 0) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FF7600BC" },
                    };
                  }
                });
              }
            } else if (hasValue(item.CellularRoom) && hasValue(item.OpenPlan)) {
              const baseRow = {
                RefNo: item.RefNo,
                Description: item.Description,
                Rooms: 1,
                UnitArea: item.UnitArea,
                CellularRoom: item.CellularRoom,
                OpenPlan: item.OpenPlan,
                SpecialRequirement: item.SpecialRequirement,
                roomName: item.roomName,
                area: item.area,
                minus: item.minus,
                percent: item.percent,
                TotalAreaRequired: item.TotalAreaRequired,
                TotalAreaProvided: item.TotalAreaProvided,
                TotalMinus: item.TotalMinus,
                TotalPercent: item.TotalPercent,
                TotalRoomRequired: item.TotalRoomRequired,
                TotalRoomProvided: item.TotalRoomProvided,
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              if (isBlank(baseRow.roomName) && isBlank(baseRow.area)) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FF7600BC" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 0 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF5B00" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Over-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFF0000" },
                    };
                  }
                });
              } else if (
                item.isRoomNumber === 1 &&
                item.provision === "Under-provision"
              ) {
                newRow.eachCell((cell, colNumber) => {
                  if (colNumber <= 11) {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "90EE90" },
                    };
                  }
                });
              }
            } else {
              const baseRow = {
                RefNo: "",
                Description: "",
                Rooms: "",
                UnitArea: "",
                CellularRoom: "",
                OpenPlan: "",
                SpecialRequirement: "",
                roomName: item.roomName,
                area: item.area,
                minus: "",
                percent: "",
                TotalAreaRequired: "",
                TotalAreaProvided: "",
                TotalMinus: "",
                TotalPercent: "",
                TotalRoomRequired: "",
                TotalRoomProvided: "",
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              newRow.eachCell((cell, colNumber) => {
                if (colNumber <= 11) {
                  cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF7600BC" },
                  };
                }
              });
            }
          });

          const missingExcelItems: any[] = [];
          sortedData.forEach((rowSoA) => {
            const exists = rowList.some((row) => row.RefNo === rowSoA.RefNo);
            if (!exists) {
              if (!Number.isNaN(Number(rowSoA.Rooms))) {
                for (let i = 0; i < Number(rowSoA.Rooms); i++) {
                  const newRow = {
                    RefNo: rowSoA.RefNo,
                    Description: rowSoA.Description,
                    Rooms: rowSoA.Rooms,
                    UnitArea: rowSoA.UnitArea,
                    CellularRoom: rowSoA.CellularRoom,
                    OpenPlan: rowSoA.OpenPlan,
                    SpecialRequirement: rowSoA.SpecialRequirement,
                    roomName: "",
                    area: "",
                    minus: "",
                    percent: "",
                    TotalAreaRequired: "",
                    TotalAreaProvided: "",
                    TotalMinus: "",
                    TotalPercent: "",
                    TotalRoomRequired: "",
                    TotalRoomProvided: "",
                    provision: provisionNumbers(0),
                    isRoomNumber: 0,
                  };
                  missingExcelItems.push(newRow);
                }
              }
            }
          });
          missingExcelItems.sort((a: any, b: any) => {
            const soaRefNoA = a.RefNo.split(".");
            const soaRefNoB = b.RefNo.split(".");

            for (
              let i = 0;
              i < Math.max(soaRefNoA.length, soaRefNoB.length);
              i++
            ) {
              const partA = soaRefNoA[i] || "";
              const partB = soaRefNoB[i] || "";

              if (partA !== partB) {
                return partA.localeCompare(partB, undefined, {
                  numeric: true,
                });
              }
            }

            return a.Description.localeCompare(b.Description, undefined, {
              numeric: true,
            });
          });
          missingExcelItems.forEach((item) => {
            if (item.CellularRoom && !isBlank(item.CellularRoom)) {
              const baseRow = {
                RefNo: item.RefNo,
                Description: item.Description,
                Rooms: 1,
                UnitArea: item.UnitArea,
                CellularRoom: item.UnitArea,
                OpenPlan: "",
                SpecialRequirement: item.SpecialRequirement,
                roomName: item.roomName,
                area: item.area,
                minus: "",
                percent: "",
                TotalAreaRequired: "",
                TotalAreaProvided: "",
                TotalMinus: "",
                TotalPercent: "",
                TotalRoomRequired: "",
                TotalRoomProvided: "",
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              newRow.eachCell((cell, colNumber) => {
                if (colNumber <= 11) {
                  cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF7600BC" },
                  };
                }
              });
            } else if (item.OpenPlan && !isBlank(item.OpenPlan)) {
              const baseRow = {
                RefNo: item.RefNo,
                Description: item.Description,
                Rooms: 1,
                UnitArea: item.UnitArea,
                CellularRoom: "",
                OpenPlan: item.UnitArea,
                SpecialRequirement: item.SpecialRequirement,
                roomName: item.roomName,
                area: item.area,
                minus: item.minus,
                percent: item.percent,
                TotalAreaRequired: "",
                TotalAreaProvided: "",
                TotalMinus: "",
                TotalPercent: "",
                TotalRoomRequired: "",
                TotalRoomProvided: "",
              };

              const newRow = worksheet.addRow(baseRow);
              const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
              newRow.height = Math.max(20, lineCount * 15);
              newRow.eachCell((cell, colNumber) => {
                if (colNumber <= 11) {
                  cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF7600BC" },
                  };
                }
              });
            }
          });

          const missingIFCItems: any[] = [];
          exportTable.forEach((rowIFC: IFCItemNew) => {
            const exists = rowList.some(
              (row) => row.roomName === rowIFC.IFCNameList?.[0]?.IFCName
            );
            if (!exists) {
              const newRow = {
                RefNo: "",
                Description: "",
                Rooms: "",
                UnitArea: "",
                CellularRoom: "",
                OpenPlan: "",
                SpecialRequirement: "",
                roomName: rowIFC.IFCNameList[0]?.IFCName,
                area: rowIFC.IFCNameList[0]?.IFCArea,
                minus: "",
                percent: "",
                TotalAreaRequired: "",
                TotalAreaProvided: "",
                TotalMinus: "",
                TotalPercent: "",
                TotalRoomRequired: "",
                TotalRoomProvided: "",
                provision: provisionNumbers(0),
                isRoomNumber: 0,
              };
              missingIFCItems.push(newRow);
            }
          });
          missingIFCItems.sort((a: any, b: any) => {
            return a.roomName.localeCompare(b.roomName, undefined, {
              numeric: true,
            });
          });
          missingIFCItems.forEach((item) => {
            const baseRow = {
              RefNo: "",
              Description: "",
              Rooms: "",
              UnitArea: "",
              CellularRoom: "",
              OpenPlan: "",
              SpecialRequirement: "",
              roomName: item.roomName,
              area: item.area,
              minus: "",
              percent: "",
              TotalAreaRequired: "",
              TotalAreaProvided: "",
              TotalRoomRequired: "",
              TotalRoomProvided: "",
              TotalMinus: "",
              TotalPercent: "",
            };

            const newRow = worksheet.addRow(baseRow);
            const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
            newRow.height = Math.max(20, lineCount * 15);
            newRow.eachCell((cell, colNumber) => {
              if (colNumber <= 11) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFD700" },
                };
              }
            });
          });

          worksheet.eachRow((row) => {
            row.eachCell((cell) => {
              cell.alignment = {
                vertical: "middle",
              };
            });
          });

          // Bật chế độ wrapText cho cột "Special Requirement"
          worksheet.getColumn("SpecialRequirement").alignment = {
            wrapText: true,
          };

          const worksheetLegend = workbook.addWorksheet("Legend");
          worksheetLegend.getCell("C2").value = ": SoA Compliant";
          worksheetLegend.getCell("B2").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF90EE90" },
          };
          worksheetLegend.getCell("C3").value = ": Area Incompliant";
          worksheetLegend.getCell("B3").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF0000" },
          };
          worksheetLegend.getCell("C4").value = ": No. if Room(s) Incompliant";
          worksheetLegend.getCell("B4").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF7600BC" },
          };
          worksheetLegend.getCell("C5").value =
            ": Area and No. if Room(s) Incompliant";
          worksheetLegend.getCell("B5").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF5B00" },
          };
          worksheetLegend.getCell("C6").value = ": Room not found in SoA";
          worksheetLegend.getCell("B6").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFD700" },
          };

          // Xuất file Excel
          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = URL.createObjectURL(blob);

          // Tạo và kích hoạt liên kết tải xuống
          const link = document.createElement("a");
          link.href = url;
          link.download = "Excel_Results.xlsx";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error("Export failed: ", err);
        }
      }
    } catch (error) {
      console.error("Error occurred:", error);
    } finally {
      setOpenModalExport(false);
    }
  };

  const handleExport = async (
    soaBefore: SoAModel[],
    ifcFile: IFCFileModel[]
  ) => {
    if (props.projectId) {
      setIsLoading(true);
      try {
        if (soaBefore.length > 0 && ifcFile.length > 0) {
          loadIfcModel();

          const listModels: FragmentsGroup[] = [];
          const attributesTables: { [modelId: string]: any } = {};
          const tableDefinition: BUI.TableDataTransform = {
            Entity: (entity) => {
              return BUI.html`<bim-label>${entity}</bim-label>`;
            },

            NominalValue: (value) => {
              return BUI.html`<bim-label>${value}</bim-label>`;
            },

            AreaValue: (value) => {
              return BUI.html`<bim-label>${value}</bim-label>`;
            },
          };

          fragments.onFragmentsLoaded.add(async (model) => {
            if (model.hasProperties) {
              try {
                await indexer.process(model);
              } catch (error) {
                console.log(error);
              }

              const expressIDs = new Set<number>([
                /* danh sách ID cần thêm */
              ]);
              const properties = model.getLocalProperties();
              if (properties) {
                for (const id in properties) {
                  const property = properties[id];
                  if (property && typeof property === "object") {
                    const { expressID } = property;
                    expressIDs.add(expressID);
                  }
                }
              }

              const modelIdMap = { [model.uuid]: expressIDs };
              if (
                !modelIdMap[model.uuid] ||
                modelIdMap[model.uuid].size === 0
              ) {
                return;
              }

              const fragmentIdMap =
                fragments.modelIdToFragmentIdMap(modelIdMap);

              const [newAttributesTable, updateNewAttributesTable] =
                CUI.tables.entityAttributes({
                  components,
                  fragmentIdMap,
                  tableDefinition,
                  attributesToInclude: () => {
                    const attributes: any[] = [
                      "Name",
                      "HasProperties",
                      "HasPropertySets",
                      "HasProperties",
                      (name: string) => name.includes("Name"),
                      (name: string) => name.includes("Value"),
                      (name: string) => name.includes("expressID"),
                      (name: string) => name.includes("NominalValue"),
                      (name: string) => {
                        const ignore = ["IsGroupedBy", "IsDecomposedBy"];
                        return name.startsWith("Is") && !ignore.includes(name);
                      },
                    ];
                    return attributes;
                  },
                });

              attributesTables[model.uuid] = {
                table: newAttributesTable,
                update: updateNewAttributesTable,
              };
              listModels.push(model);

              if (listModels.length === ifcFile.length) {
                setTimeout(() => {
                  const allTableData: BUI.TableGroupData[][] = Object.values(
                    attributesTables
                  ).map((item) => item.table.data);

                  if (allTableData.length > 0) {
                    const allIFCItemOld: IFCItemOld[] = [];
                    allTableData.forEach((tableData) => {
                      const modelUuid = Object.keys(attributesTables).find(
                        (key) => attributesTables[key].table.data === tableData
                      );

                      tableData.forEach((row) => {
                        if (row.data.Entity === "IFCSPACE") {
                          let soaRefNo = "";
                          let roomName = "";
                          if (row.children) {
                            row.children.forEach((item) => {
                              if (item.data.Name === "IfcSoA") {
                                item.children?.forEach((chill) => {
                                  if (chill.data.Name === "IfcSoA_Ref_No") {
                                    soaRefNo = String(chill.data.NominalValue);
                                  } else if (
                                    chill.data.Name === "IfcSoA_Room_Name"
                                  ) {
                                    roomName = String(chill.data.NominalValue);
                                  }
                                });
                              }
                            });
                          }

                          if (row.children) {
                            row.children.forEach((item) => {
                              if (item.data.Name === "IfcSoA") {
                                item.children?.forEach((chill) => {
                                  if (
                                    chill.data.Name === "IfcSoA_Provided_Area"
                                  ) {
                                    const data: IFCItemOld = {
                                      IFCRefNo: soaRefNo,
                                      IFCNameArea: {
                                        IFCName: String(roomName),
                                        IFCArea: String(
                                          chill.data.NominalValue
                                        ),
                                      },
                                      IFCNoRoom: 1,
                                      modelID: modelUuid,
                                    };
                                    allIFCItemOld.push(data);
                                  }
                                });
                              }
                            });
                          }
                        }
                      });
                    });

                    const allIFCItemNew: IFCItemNew[] = [];
                    const map = new Map<string, IFCItemNew>();

                    allIFCItemOld.forEach((item) => {
                      if (item.IFCRefNo !== "") {
                        if (!map.has(item.IFCRefNo)) {
                          map.set(item.IFCRefNo, {
                            IFCRefNo: item.IFCRefNo,
                            IFCNameList: [item.IFCNameArea],
                            IFCNoRoom: item.IFCNoRoom,
                            modelID: item.modelID,
                          });
                        } else {
                          const existingItem = map.get(item.IFCRefNo)!;
                          existingItem.IFCNameList.push(item.IFCNameArea);
                          existingItem.IFCNoRoom += item.IFCNoRoom;
                        }
                      } else {
                        const uniqueKey = Math.random()
                          .toString(36)
                          .substr(2, 9);
                        map.set(uniqueKey, {
                          IFCRefNo: "",
                          IFCNameList: [item.IFCNameArea],
                          IFCNoRoom: 1,
                          modelID: item.modelID,
                        });
                      }
                    });

                    // Chuyển từ Map thành mảng
                    allIFCItemNew.push(...map.values());
                    allIFCItemNew.sort((a: any, b: any) => {
                      const soaRefNoA = a.IFCRefNo.split(".");
                      const soaRefNoB = b.IFCRefNo.split(".");

                      for (
                        let i = 0;
                        i < Math.max(soaRefNoA.length, soaRefNoB.length);
                        i++
                      ) {
                        const partA = soaRefNoA[i] || "";
                        const partB = soaRefNoB[i] || "";

                        // So sánh chuỗi, trả về thứ tự tương ứng
                        if (partA !== partB) {
                          return partA.localeCompare(partB, undefined, {
                            numeric: true,
                          });
                        }
                      }
                      return 0;
                    });

                    allIFCItemNew.forEach((item) => {
                      item.IFCNameList.sort((a: any, b: any) =>
                        a.IFCName.localeCompare(b.IFCName, undefined, {
                          numeric: true,
                        })
                      );
                    });

                    handleExportValue(allIFCItemNew, soaBefore);
                  }
                }, 1000);
              }
            }
          });
        }

        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Export success!",
          0
        )();
      } catch (error) {
        console.error("Error occurred:", error);
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          "Export Failed",
          1
        )();
      } finally {
        setIsLoading(false);
      }
    }
  };

  // #endregion

  return (
    <>
      {project && (
        <div className="h-screen flex items-center justify-center">
          <Box sx={{ display: "flex", margin: 1 }}>
            <Box component="main" sx={{ flexGrow: 1, pt: 1 }}>
              <Box sx={{ width: "100%" }}>
                {isLoading && isLoading === true ? (
                  <Backdrop
                    sx={(theme) => ({
                      color: "#fff",
                      zIndex: theme.zIndex.drawer + 1,
                    })}
                    open={isLoading}
                  >
                    <CircularProgress color="inherit" />
                  </Backdrop>
                ) : (
                  <>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Paper
                        sx={{
                          display: "flex",
                          height: 800,
                          gap: 2,
                          margin: 2,
                          padding: 2,
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex">
                            <div className="flex items-center justify-start text-center">
                              <label className="text-red-500 font-bold text-2xl">
                                Step 1: Load SoA Forms
                              </label>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                              <label>
                                <FileUpload
                                  accept=".xlsx, .xls"
                                  onDataChange={(files) => {
                                    handleExcelFileUpload(files);
                                  }}
                                ></FileUpload>
                              </label>
                            </div>
                          </div>
                          <h1 className="text-2xl text-center font-bold">
                            Schedule of Accomodation (SoA) Form (.xlsx)
                          </h1>
                          <div className="w-[45rem] h-full">
                            <div
                              style={{ width: "100%", height: "100%" }}
                              className={"ag-theme-quartz-dark"}
                            >
                              <AgGridReact
                                className="ag-height text-[1.3rem]"
                                rowData={excel}
                                columnDefs={columnExcelDefs}
                                defaultColDef={defaultColDef}
                                rowSelection="multiple"
                                pagination={true}
                                paginationPageSize={25}
                                paginationPageSizeSelector={[25, 50, 100]}
                              />
                            </div>
                          </div>
                          <Stack
                            direction="row"
                            spacing={2}
                            display="flex"
                            justifyContent="space-between"
                          >
                            {checkOnClick ? (
                              <a
                                href={`/${props.userId}/Projects/${props.projectId}/ViewFile/`}
                                style={{ textDecoration: "none" }}
                              >
                                <Button variant="contained" color="error">
                                  Preview Consolidated SoA
                                </Button>
                              </a>
                            ) : (
                              <Button
                                variant="contained"
                                color="error"
                                disabled
                              >
                                Preview Consolidated SoA
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="inherit"
                              onClick={handleDeleteAllExcel}
                            >
                              Clear All
                            </Button>
                          </Stack>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex">
                            <div className="flex items-center justify-start text-center">
                              <label className="text-red-500 font-bold text-2xl">
                                Step 2: Load IFC models
                              </label>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                              <label>
                                <FileUpload
                                  accept=".ifc"
                                  onDataChange={(files) => {
                                    handleIFCFileUpload(files);
                                  }}
                                ></FileUpload>
                              </label>
                            </div>
                          </div>
                          <h1 className="text-2xl text-center font-bold">
                            Open Format BIM Model (.ifc)
                          </h1>
                          <div className="w-[45rem] h-full">
                            <div
                              style={{ width: "100%", height: "100%" }}
                              className={"ag-theme-quartz-dark"}
                            >
                              <AgGridReact
                                className="ag-height text-[1.3rem]"
                                rowData={ifcFile}
                                columnDefs={columnIFCDefs}
                                rowSelection="multiple"
                                defaultColDef={defaultColDef}
                                pagination={true}
                                paginationPageSize={25}
                                paginationPageSizeSelector={[25, 50, 100]}
                              />
                            </div>
                          </div>
                          <Stack
                            direction="row"
                            spacing={2}
                            display="flex"
                            justifyContent="space-between"
                          >
                            {checkOnClick ? (
                              <a
                                href={`/${props.userId}/Projects/${props.projectId}/ViewModel/`}
                                style={{ textDecoration: "none" }}
                              >
                                <Button variant="contained" color="error">
                                  Preview IFC MODEL
                                </Button>
                              </a>
                            ) : (
                              <Button
                                variant="contained"
                                color="error"
                                disabled
                              >
                                Preview IFC MODEL
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="inherit"
                              onClick={handleDeleteAllIFCFile}
                            >
                              Clear All
                            </Button>
                          </Stack>
                        </div>
                      </Paper>
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack
                          direction="row"
                          display="flex"
                          justifyContent="flex-start"
                          ml={2}
                          gap={1}
                        >
                          {project.isDelete === false &&
                          ((excel && excel.length > 0) ||
                            (ifcFile && ifcFile.length > 0)) ? (
                            <Box>
                              <Button
                                sx={{ width: 100, height: 50 }}
                                variant="contained"
                                color="error"
                                onClick={handleCommitFile}
                              >
                                Check
                              </Button>
                              <Snackbar
                                open={open}
                                key={message + type}
                                anchorOrigin={{ vertical, horizontal }}
                                autoHideDuration={2000}
                                onClose={handleSnackBarClose}
                              >
                                <Alert
                                  onClose={handleSnackBarClose}
                                  severity={getSeverity(type)}
                                  variant="filled"
                                  sx={{ width: "100%" }}
                                >
                                  {message}
                                </Alert>
                              </Snackbar>
                            </Box>
                          ) : (
                            <></>
                          )}
                        </Stack>
                        <Stack
                          direction="row"
                          display="flex"
                          justifyContent="flex-end"
                          mr={2}
                          gap={1}
                        >
                          {project.isDelete === false &&
                          ((excel && excel.length > 0) ||
                            (ifcFile && ifcFile.length > 0)) ? (
                            <>
                              {checkOnClick ? (
                                <>
                                  <a
                                    href={`/${props.userId}/Projects/${props.projectId}/ViewBCF/`}
                                    style={{ textDecoration: "none" }}
                                  >
                                    <Button
                                      sx={{ height: 50 }}
                                      variant="contained"
                                      color="error"
                                    >
                                      View Results In BCF Viewer
                                    </Button>
                                  </a>
                                  <a
                                    href={`/${props.userId}/Projects/${props.projectId}/ViewIFC/`}
                                    style={{ textDecoration: "none" }}
                                  >
                                    <Button
                                      sx={{ height: 50 }}
                                      variant="contained"
                                      color="error"
                                    >
                                      View Results In IFC Viewer
                                    </Button>
                                  </a>
                                  <Box>
                                    <Button
                                      sx={{ height: 50 }}
                                      variant="contained"
                                      color="error"
                                      onClick={() => {
                                        setOpenModalExport(true);
                                        handleExport(soaBefore, ifcFile);
                                      }}
                                    >
                                      Export Results To .XLSX
                                    </Button>
                                    <Snackbar
                                      open={open}
                                      key={message + type}
                                      anchorOrigin={{ vertical, horizontal }}
                                      autoHideDuration={2000}
                                      onClose={handleSnackBarClose}
                                    >
                                      <Alert
                                        onClose={handleSnackBarClose}
                                        severity={getSeverity(type)}
                                        variant="filled"
                                        sx={{ width: "100%" }}
                                      >
                                        {message}
                                      </Alert>
                                    </Snackbar>
                                    <React.Fragment>
                                      <ModalJoy
                                        aria-labelledby="modal-title"
                                        aria-describedby="modal-desc"
                                        open={openModalExport}
                                        sx={{
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <CircularProgress color="inherit" />
                                      </ModalJoy>
                                    </React.Fragment>
                                  </Box>
                                </>
                              ) : (
                                <>
                                  <Button
                                    sx={{ height: 50 }}
                                    variant="contained"
                                    color="error"
                                    disabled
                                  >
                                    View Results In BCF Viewer
                                  </Button>
                                  <Button
                                    sx={{ height: 50 }}
                                    variant="contained"
                                    color="error"
                                    disabled
                                  >
                                    View Results In IFC Viewer
                                  </Button>
                                  <Box>
                                    <Button
                                      sx={{ height: 50 }}
                                      variant="contained"
                                      color="error"
                                      disabled
                                    >
                                      Export Results To .XLSX
                                    </Button>
                                    <Snackbar
                                      open={open}
                                      key={message + type}
                                      anchorOrigin={{ vertical, horizontal }}
                                      autoHideDuration={2000}
                                      onClose={handleSnackBarClose}
                                    >
                                      <Alert
                                        onClose={handleSnackBarClose}
                                        severity={getSeverity(type)}
                                        variant="filled"
                                        sx={{ width: "100%" }}
                                      >
                                        {message}
                                      </Alert>
                                    </Snackbar>
                                    <React.Fragment>
                                      <ModalJoy
                                        aria-labelledby="modal-title"
                                        aria-describedby="modal-desc"
                                        open={openModalExport}
                                        sx={{
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <CircularProgress color="inherit" />
                                      </ModalJoy>
                                    </React.Fragment>
                                  </Box>
                                </>
                              )}
                            </>
                          ) : (
                            <></>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </div>
      )}
    </>
  );
};

export default ImportFile;
