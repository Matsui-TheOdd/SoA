/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable import/extensions */
/* eslint-disable no-alert */
/* eslint-disable import/no-unresolved */
/* eslint-disable prefer-template */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import {
  DataGrid,
  GridRowSelectionModel,
  GridColDef,
  GridCellParams,
} from "@mui/x-data-grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { ExcelModel } from "@model/ExcelModel";
import { SoAModel } from "@model/SoAModel";
import { PORT } from "@lib/db";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const ViewFile = (props: { userId: number; projectId: string }) => {
  const paginationModel = { page: 0, pageSize: 50 };
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [excel, setExcel] = useState<ExcelModel[]>([]);
  const [selectedExcels, setSelectedExcels] = useState<ExcelModel[]>([]);
  const [soaBefore, setSoABefore] = useState<SoAModel[]>([]);
  const [soa, setSoA] = useState<SoAModel[]>([]);
  const [soaAfter, setSoAAfter] = useState<SoAModel[]>([]);

  // #region useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (props.projectId) {
        setIsLoading(true);
        try {
          const dataExcel = await getExcelDb(props.projectId);
          if (dataExcel) {
            setExcel(dataExcel);

            const dataSoA = (
              await Promise.all(
                dataExcel.map(async (item) => {
                  const soaRows = await getSoADb(item.id);
                  return soaRows && soaRows.length > 0 ? soaRows : [];
                })
              )
            ).flat();

            setSoABefore(dataSoA);

            const newData: SoAModel[] = dataSoA
              .map((row) => {
                const rooms = row.Rooms === "-" ? "-" : Number(row.Rooms);

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
                if (typeof rooms === "number" && rooms > 1) {
                  for (let i = 0; i < rooms; i++) {
                    const id = crypto.randomUUID();
                    const rowCurrent: SoAModel = {
                      ...baseRow,
                      Rooms: "1",
                      Description: `${row.Description} ${i + 1}`,
                      CellularRoom: `${
                        Math.round((Number(row.CellularRoom) / rooms) * 100) /
                        100
                      }`,
                      id: `${id}`,
                    };
                    generatedRows.push(rowCurrent);
                  }
                } else {
                  generatedRows.push(baseRow);
                }
                return generatedRows;
              })
              .flat();

            setSoAAfter(newData);
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [props.projectId]);

  useEffect(() => {
    setSoA(
      selectedExcels
        .flatMap((row) => {
          return soaBefore.filter((item) => item.ExcelID === row.id);
        })
        .sort((a: any, b: any) => {
          const soaRefNoA = String(a.RefNo).split(".");
          const soaRefNoB = String(b.RefNo).split(".");

          for (
            let i = 0;
            i < Math.max(soaRefNoA.length, soaRefNoB.length);
            i++
          ) {
            const partA = soaRefNoA[i] || "";
            const partB = soaRefNoB[i] || "";

            if (partA !== partB) {
              return partA.localeCompare(partB, undefined, { numeric: true });
            }
          }
          return 0;
        })
    );
  }, [selectedExcels]);

  // useEffect(() => {
  //   setSoAAfter(() => {
  //     const newData: SoAModel[] = [];
  //     soa.forEach((row) => {
  //       const rooms = row.Rooms === "-" ? "-" : Number(row.Rooms);

  //       const baseRow: SoAModel = {
  //         id: row.id,
  //         RefNo: row.RefNo,
  //         Rooms: String(row.Rooms),
  //         Description: row.Description,
  //         UnitArea: String(row.UnitArea),
  //         CellularRoom: String(row.CellularRoom),
  //         OpenPlan: String(row.OpenPlan),
  //         SpecialRequirement: row.SpecialRequirement,
  //         ExcelID: row.ExcelID,
  //       };

  //       if (typeof rooms === "number" && rooms > 1) {
  //         for (let i = 0; i < rooms; i++) {
  //           const id = crypto.randomUUID();
  //           const rowCurrent: SoAModel = {
  //             ...baseRow,
  //             Rooms: "1",
  //             Description: `${row.Description} ${i + 1}`,
  //             id: `${id}`, // Gán id
  //           };

  //           newData.push(rowCurrent);
  //         }
  //       } else {
  //         newData.push(baseRow);
  //       }
  //     });
  //     return newData;
  //   });
  // }, [soa]);
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

  const handleExportExcel = async () => {
    if (soaAfter.length > 0) {
      try {
        setIsLoading(true);

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
        ];

        worksheet.columns = columns;

        // Sắp xếp dữ liệu theo RefNo
        const sortedData = soaAfter.sort((a: any, b: any) => {
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
              return partA.localeCompare(partB, undefined, { numeric: true });
            }
          }
          return 0;
        });

        // Ghi dữ liệu vào sheet
        sortedData.forEach((row, index) => {
          const newRow = worksheet.addRow({
            RefNo: row.RefNo,
            Description: row.Description,
            Rooms: row.Rooms,
            UnitArea: row.UnitArea,
            CellularRoom: row.CellularRoom,
            OpenPlan: row.OpenPlan,
            SpecialRequirement: row.SpecialRequirement,
          });

          // Tự động điều chỉnh độ cao của hàng dựa trên số dòng cần thiết
          const lineCount = Math.ceil(row.SpecialRequirement.length / 40);
          newRow.height = Math.max(20, lineCount * 15); // Mỗi dòng chiếm 15px

          newRow.eachCell((cell) => {
            cell.alignment = {
              vertical: "middle",
            };
          });
        });

        // Bật chế độ wrapText cho cột "Special Requirement"
        worksheet.getColumn("SpecialRequirement").alignment = {
          wrapText: true,
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
        link.download = "soa_data.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Export failed: ", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("No data to export");
    }
  };

  const handleRowSelection = (newSelection: GridRowSelectionModel) => {
    const selectedRows: ExcelModel[] = newSelection
      .map((id) => {
        return excel.find((row) => row.id === id) as ExcelModel;
      })
      .filter((row): row is ExcelModel => row !== undefined);

    setSelectedExcels(selectedRows);
  };
  // #endregion

  // #region Columns
  const columnExcels: GridColDef<ExcelModel>[] = [
    {
      field: "Name",
      headerName: "Name",
      width: 200,
      description: "Name",
    },
  ];

  const columnSoAs: GridColDef<SoAModel>[] = [
    { field: "RefNo", headerName: "SoA_Ref. No.", width: 90 },
    {
      field: "Description",
      headerName: "Name",
      width: 300,
      editable: true,
    },
    {
      field: "Rooms",
      headerName: "No. of Rooms.",
      width: 160,
      editable: true,
    },
    {
      field: "UnitArea",
      headerName: "Unit Area",
      width: 130,
      editable: true,
    },
    {
      field: "CellularRoom",
      headerName: "Cellular Room",
      width: 130,
      editable: true,
    },
    {
      field: "OpenPlan",
      headerName: "Open Plan",
      width: 130,
      editable: true,
    },
    {
      field: "SpecialRequirement",
      headerName: "Other Requirement",
      width: 200,
      editable: true,
    },
  ];
  // #endregion

  return (
    <>
      <div className="h-screen flex items-center justify-center">
        <Box height={70} />
        <Box sx={{ display: "flex" }}>
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
                <Stack
                  direction="column"
                  spacing={2}
                  marginTop={2}
                  display="flex"
                  justifyContent="flex-start"
                >
                  <label className="pl-4 font-bold text-2xl">
                    Combined SoA Table
                  </label>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Paper sx={{ height: 700, width: 400 }}>
                      <DataGrid
                        rows={excel}
                        columns={columnExcels}
                        checkboxSelection
                        onRowSelectionModelChange={handleRowSelection}
                        disableRowSelectionOnClick
                      />

                      <Stack
                        direction="row"
                        spacing={2}
                        marginTop={2}
                        display="flex"
                        justifyContent="flex-start"
                      >
                        <a
                          href={`/${props.userId}/Projects/${props.projectId}/ImportFile/back`}
                          style={{ textDecoration: "none" }}
                        >
                          <Button
                            variant="contained"
                            color="error"
                            sx={{ width: 100 }}
                          >
                            Back
                          </Button>
                        </a>
                      </Stack>
                    </Paper>
                    <Paper sx={{ height: 700, width: 1200 }}>
                      <DataGrid
                        rows={soa}
                        columns={columnSoAs}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[50, 100]}
                      />
                      <Stack
                        direction="row"
                        spacing={2}
                        marginTop={2}
                        display="flex"
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleExportExcel}
                        >
                          Export
                        </Button>
                      </Stack>
                    </Paper>
                  </Box>
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </div>
    </>
  );
};

export default ViewFile;
