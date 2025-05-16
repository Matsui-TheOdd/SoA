import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as CUI from "@thatopen/ui-obc";
import * as OBF from "@thatopen/components-front";
import * as WEBIFC from "web-ifc";
import { SoAModel } from "@model/SoAModel";
import { FragmentIdMap, FragmentsGroup } from "@thatopen/fragments";
import ExcelJS from 'exceljs';
import { PORT } from "@lib/db";
import { ProjectModel } from "@model/ProjectModel";
import { isBlank } from "../../util/isBlank";

// interface IFCNameArea {
//   IFCName: string;
//   IFCArea: string;
// }

// interface IFCItemOld {
//   IFCRefNo: string;
//   IFCNameArea: IFCNameArea;
//   IFCNoRoom: number;
//   modelID: string | undefined;
// }


// interface IFCItemNew {
//   IFCRefNo: string;
//   IFCNameList: IFCNameArea[];
//   IFCNoRoom: number;
//   modelID: string | undefined;
// }


export default (components: OBC.Components, soa: SoAModel[], userId: number, projectId: string, numberIFC: number, onDataChange: (data: any) => void) => {
  const hider = components.get(OBC.Hider);
  const classifier = components.get(OBC.Classifier);
  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const highlighter = components.get(OBF.Highlighter);
  const attributesTables: { [modelId: string]: any } = {};
  const allFragmentIdMaps: FragmentIdMap[] = [];
  let checkData: any[] = [];
  // let listIFCItem: IFCItemNew[] = [];
  let soaRefNoSummary: { SoARefNo: string; RoomName: string; Rooms: number; ExcelRooms: number }[] = [];
  const listModels: FragmentsGroup[] = [];
  const ifcSpace: any[] = [];
  const spatialStructures: Record<string, any> = {};
  const classes: Record<string, any> = {};

  const provisionNumbers = (percentageDifference: number): string => {
    if ((percentageDifference < 0 && percentageDifference >= -10) || (percentageDifference > 0 && percentageDifference <= 10)) {
      return "Under-provision";
    }

    if (percentageDifference === 0) {
      return "Under-provision";
    }

    return "Over-provision";
  };

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

  const [modelsList] = CUI.tables.modelsList({
    components,
    tags: { schema: false, viewDefinition: false },
    actions: {
      download: false,
      dispose: false,
    } as const,
  });

  const [relationsTree] = CUI.tables.relationsTree({
    components,
    models: [],
    hoverHighlighterName: "hover",
    selectHighlighterName: "select",
  });
  relationsTree.preserveStructureOnFilter = true;

  const handleDeselectHighline = () => {
    highlighter.clear();
  }

  const handleUnderProvisionVisible = async (isChecked: boolean) => {
    handleDeselectHighline();
    const targetColor = new THREE.Color(0x80EF80);
    const targetRGB = [targetColor.r, targetColor.g, targetColor.b];
    listModels.forEach(modelValue => {
      ifcSpace.forEach(data => {
        modelValue.items.forEach(item => {
          if (item.ids) {
            item.ids.forEach(id => {
              if (id === data.expressID) {
                const itemColors = item.exportData().colors;
                if (itemColors && itemColors.length === 3) {
                  const [r, g, b] = itemColors;

                  // So sánh với màu mục tiêu
                  if (
                    Math.abs(r - targetRGB[0]) < 0.01 &&
                    Math.abs(g - targetRGB[1]) < 0.01 &&
                    Math.abs(b - targetRGB[2]) < 0.01
                  ) {
                    item.setVisibility(isChecked, item.ids);
                  }
                }
              }
            })
          }
        });
      });
    });
  }

  const handleOverProvisionVisible = async (isChecked: boolean) => {
    handleDeselectHighline();
    const targetColor = new THREE.Color(0xFF1D18);
    const targetRGB = [targetColor.r, targetColor.g, targetColor.b];
    listModels.forEach(modelValue => {
      ifcSpace.forEach(data => {
        modelValue.items.forEach(item => {
          if (item.ids) {
            item.ids.forEach(id => {
              if (id === data.expressID) {
                const itemColors = item.exportData().colors;
                if (itemColors && itemColors.length === 3) {
                  const [r, g, b] = itemColors;

                  // So sánh với màu mục tiêu
                  if (
                    Math.abs(r - targetRGB[0]) < 0.01 &&
                    Math.abs(g - targetRGB[1]) < 0.01 &&
                    Math.abs(b - targetRGB[2]) < 0.01
                  ) {
                    item.setVisibility(isChecked, item.ids);
                  }
                }
              }
            })
          }
        });
      });
    });
  }

  const handleRemainSpaceVisible = async (isChecked: boolean) => {
    handleDeselectHighline();
    const colorUnderProvision = new THREE.Color(0x80EF80);
    const colorOverProvision = new THREE.Color(0xFF1D18);
    const underProvisionRGB = [colorUnderProvision.r, colorUnderProvision.g, colorUnderProvision.b];
    const overProvisionRGB = [colorOverProvision.r, colorOverProvision.g, colorOverProvision.b];
    listModels.forEach(modelValue => {
      modelValue.items.forEach(item => {
        if (item.ids) {
          const itemColors = item.exportData().colors;
          if (itemColors && itemColors.length === 3) {
            const [r, g, b] = itemColors;

            // So sánh với màu mục tiêu
            const isUnderProvision =
              Math.abs(r - underProvisionRGB[0]) < 0.01 &&
              Math.abs(g - underProvisionRGB[1]) < 0.01 &&
              Math.abs(b - underProvisionRGB[2]) < 0.01;

            const isOverProvision =
              Math.abs(r - overProvisionRGB[0]) < 0.01 &&
              Math.abs(g - overProvisionRGB[1]) < 0.01 &&
              Math.abs(b - overProvisionRGB[2]) < 0.01;

            if (!isUnderProvision && !isOverProvision) {
              item.setVisibility(isChecked, item.ids);
            }
          }
          else {
            item.setVisibility(isChecked, item.ids);
          }
        }
      });
    });
  }

  // const handleExportExcel = async (exportTable: IFCItemNew[]) => {
  //   const newData: SoAModel[] = soa
  //     .map((row) => {
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

  //       const generatedRows: SoAModel[] = [];
  //       generatedRows.push(baseRow);

  //       return generatedRows;
  //     })
  //     .flat();

  //   if (newData.length > 0) {
  //     try {
  //       const workbook = new ExcelJS.Workbook();
  //       const worksheet = workbook.addWorksheet("SOA Data");

  //       // Định nghĩa tiêu đề
  //       const columns = [
  //         { header: "SoA_Ref. No.", key: "RefNo", width: 15 },
  //         {
  //           header: "Name",
  //           key: "Description",
  //           width: 25,
  //         },
  //         { header: "No. of Rooms.", key: "Rooms", width: 15 },
  //         { header: "Unit Area", key: "UnitArea", width: 20 },
  //         { header: "Cellular Room", key: "CellularRoom", width: 15 },
  //         { header: "Open Plan", key: "OpenPlan", width: 15 },
  //         {
  //           header: "Other Requirement",
  //           key: "SpecialRequirement",
  //           width: 40,
  //         },
  //         { header: "Room Name in BIM Model", key: "roomName", width: 15 },
  //         { header: "Provied Area", key: "area", width: 15 },
  //         { header: "Diff", key: "minus", width: 15 },
  //         { header: "% Diff", key: "percent", width: 15 },
  //         { header: "Total Area of Multi-Room Required", key: "TotalAreaRequired", width: 15 },
  //         { header: "Total Area of Multi-Room Provided", key: "TotalAreaProvided", width: 15 },
  //         { header: "Total Diff (Multi-Room)", key: "TotalMinus", width: 15 },
  //         { header: "Total % Diff (Multi-Room)", key: "TotalPercent", width: 15 },
  //         { header: "No. of Rooms Required", key: "TotalRoomRequired", width: 15 },
  //         { header: "No. of Rooms Provided", key: "TotalRoomProvided", width: 15 },
  //       ];

  //       worksheet.columns = columns;

  //       // Sắp xếp dữ liệu theo RefNo
  //       const sortedData = newData.sort((a: any, b: any) => {
  //         const soaRefNoA = a.RefNo.split('.');
  //         const soaRefNoB = b.RefNo.split('.');

  //         for (let i = 0; i < Math.max(soaRefNoA.length, soaRefNoB.length); i++) {
  //           const partA = soaRefNoA[i] || "";
  //           const partB = soaRefNoB[i] || "";

  //           // So sánh chuỗi, trả về thứ tự tương ứng
  //           if (partA !== partB) {
  //             return partA.localeCompare(partB, undefined, { numeric: true });
  //           }
  //         }
  //         return 0;
  //       });

  //       const rowList: any[] = [];

  //       // Ghi dữ liệu vào sheet
  //       sortedData.forEach((rowSoA) => {
  //         exportTable.forEach((rowIFC: IFCItemNew) => {
  //           if (rowSoA.RefNo === rowIFC.IFCRefNo) {
  //             if (Number(rowSoA.Rooms) === rowIFC.IFCNoRoom) {
  //               let count = 0;
  //               for (let i = 0; i < rowIFC.IFCNoRoom; i++) {
  //                 if (rowSoA.UnitArea !== "" && rowIFC.IFCNameList[i].IFCArea !== "") {
  //                   if (
  //                     !Number.isNaN(Number(rowSoA.UnitArea))
  //                     && !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
  //                   ) {
  //                     const percentString = Number(rowSoA.UnitArea) !== 0 ? Number(((Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea)) / Number(rowSoA.UnitArea) * 100).toFixed(2)) : "0";
  //                     if (count === 0) {
  //                       const toltalPercent = Number(((Number(rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0)) - Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms))) / Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)) * 100).toFixed(2));
  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
  //                         TotalAreaProvided: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0),
  //                         TotalMinus: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0) - (Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)),
  //                         TotalPercent: String(`${toltalPercent}%`),
  //                         TotalRoomRequired: rowSoA.Rooms,
  //                         TotalRoomProvided: rowIFC.IFCNoRoom,
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 1,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                     else {
  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: "",
  //                         TotalAreaProvided: "",
  //                         TotalMinus: "",
  //                         TotalPercent: "",
  //                         TotalRoomRequired: "",
  //                         TotalRoomProvided: "",
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 1,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                   }
  //                   else {
  //                     const newRow = {
  //                       RefNo: rowSoA.RefNo,
  //                       Description: rowSoA.Description,
  //                       Rooms: rowSoA.Rooms,
  //                       UnitArea: rowIFC.IFCNameList[i].IFCArea,
  //                       CellularRoom: rowSoA.CellularRoom,
  //                       OpenPlan: rowSoA.OpenPlan,
  //                       SpecialRequirement: rowSoA.SpecialRequirement,
  //                       roomName: rowIFC.IFCNameList[i].IFCName,
  //                       area: rowIFC.IFCNameList[i].IFCArea,
  //                       minus: 0,
  //                       percent: "0%",
  //                       TotalAreaRequired: "",
  //                       TotalAreaProvided: "",
  //                       TotalMinus: "",
  //                       TotalPercent: "",
  //                       TotalRoomRequired: "",
  //                       TotalRoomProvided: "",
  //                       provision: provisionNumbers(0),
  //                       isRoomNumber: 1,
  //                     };

  //                     rowList.push(newRow);
  //                   }
  //                 }
  //                 count++;
  //               }
  //             }
  //             else if (Number(rowSoA.Rooms) < rowIFC.IFCNoRoom) {
  //               let count = 0;
  //               for (let i = 0; i < Number(rowSoA.Rooms); i++) {
  //                 if (rowSoA.UnitArea !== "" && rowIFC.IFCNameList[i].IFCArea !== "") {
  //                   if (
  //                     !Number.isNaN(Number(rowSoA.UnitArea))
  //                     && !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
  //                   ) {
  //                     const percentString = Number(rowSoA.UnitArea) !== 0 ? Number(((Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea)) / Number(rowSoA.UnitArea) * 100).toFixed(2)) : "0";
  //                     if (count === 0) {
  //                       const totalPercent = Number(((Number(rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0)) - Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms))) / Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)) * 100).toFixed(2))
  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
  //                         TotalAreaProvided: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0),
  //                         TotalMinus: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0) - (Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)),
  //                         TotalPercent: String(`${totalPercent}%`),
  //                         TotalRoomRequired: rowSoA.Rooms,
  //                         TotalRoomProvided: rowIFC.IFCNoRoom,
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 0,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                     else {
  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: "",
  //                         TotalAreaProvided: "",
  //                         TotalMinus: "",
  //                         TotalPercent: "",
  //                         TotalRoomRequired: "",
  //                         TotalRoomProvided: "",
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 0,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                   }
  //                   else {
  //                     const newRow = {
  //                       RefNo: rowSoA.RefNo,
  //                       Description: rowSoA.Description,
  //                       Rooms: rowSoA.Rooms,
  //                       UnitArea: rowIFC.IFCNameList[i].IFCArea,
  //                       CellularRoom: rowSoA.CellularRoom,
  //                       OpenPlan: rowSoA.OpenPlan,
  //                       SpecialRequirement: rowSoA.SpecialRequirement,
  //                       roomName: rowIFC.IFCNameList[i].IFCName,
  //                       area: rowIFC.IFCNameList[i].IFCArea,
  //                       minus: 0,
  //                       percent: "0%",
  //                       TotalAreaRequired: 0,
  //                       TotalAreaProvided: 0,
  //                       TotalMinus: 0,
  //                       TotalPercent: 0,
  //                       TotalRoomRequired: rowSoA.Rooms,
  //                       TotalRoomProvided: rowIFC.IFCNoRoom,
  //                       provision: provisionNumbers(0),
  //                       isRoomNumber: 0,
  //                     };
  //                     rowList.push(newRow);
  //                   }
  //                 }
  //                 count++;
  //               }
  //               for (let i = Number(rowSoA.Rooms); i < rowIFC.IFCNoRoom; i++) {
  //                 if (rowIFC.IFCNameList[i].IFCArea !== "") {
  //                   const newRow = {
  //                     RefNo: "",
  //                     Description: "",
  //                     Rooms: "",
  //                     UnitArea: "",
  //                     CellularRoom: "",
  //                     OpenPlan: "",
  //                     SpecialRequirement: "",
  //                     roomName: rowIFC.IFCNameList[i].IFCName,
  //                     area: rowIFC.IFCNameList[i].IFCArea,
  //                     minus: "",
  //                     percent: "",
  //                     TotalAreaRequired: "",
  //                     TotalAreaProvided: "",
  //                     TotalMinus: "",
  //                     TotalPercent: "",
  //                     TotalRoomRequired: "",
  //                     TotalRoomProvided: "",
  //                     provision: provisionNumbers(0),
  //                     isRoomNumber: 0,
  //                   };

  //                   rowList.push(newRow);
  //                 }
  //               }
  //             }
  //             else if (Number(rowSoA.Rooms) > rowIFC.IFCNoRoom) {
  //               let count = 0;
  //               for (let i = 0; i < rowIFC.IFCNoRoom; i++) {
  //                 if (rowSoA.UnitArea !== "" && rowIFC.IFCNameList[i].IFCArea !== "") {
  //                   if (
  //                     !Number.isNaN(Number(rowSoA.UnitArea))
  //                     && !Number.isNaN(Number(rowIFC.IFCNameList[i].IFCArea))
  //                   ) {
  //                     const percentString = Number(rowSoA.UnitArea) !== 0 ? Number(((Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea)) / Number(rowSoA.UnitArea) * 100).toFixed(2)) : "0";
  //                     if (count === 0) {
  //                       const totalPercent = Number(((Number(rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0)) - Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms))) / Number(Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)) * 100).toFixed(2));

  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: Number(rowSoA.UnitArea) * Number(rowSoA.Rooms),
  //                         TotalAreaProvided: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0),
  //                         TotalMinus: rowIFC.IFCNameList.reduce((sum, item) => sum + Number(item.IFCArea || 0), 0) - (Number(rowSoA.UnitArea) * Number(rowSoA.Rooms)),
  //                         TotalPercent: String(`${totalPercent}%`),
  //                         TotalRoomRequired: rowSoA.Rooms,
  //                         TotalRoomProvided: rowIFC.IFCNoRoom,
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 0,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                     else {
  //                       const newRow = {
  //                         RefNo: rowSoA.RefNo,
  //                         Description: rowSoA.Description,
  //                         Rooms: rowSoA.Rooms,
  //                         UnitArea: rowSoA.UnitArea,
  //                         CellularRoom: rowSoA.CellularRoom,
  //                         OpenPlan: rowSoA.OpenPlan,
  //                         SpecialRequirement: rowSoA.SpecialRequirement,
  //                         roomName: rowIFC.IFCNameList[i]?.IFCName,
  //                         area: rowIFC.IFCNameList[i]?.IFCArea,
  //                         minus: Number(rowIFC.IFCNameList[i].IFCArea) - Number(rowSoA.UnitArea),
  //                         percent: String(`${percentString}%`),
  //                         TotalAreaRequired: "",
  //                         TotalAreaProvided: "",
  //                         TotalMinus: "",
  //                         TotalPercent: "",
  //                         TotalRoomRequired: "",
  //                         TotalRoomProvided: "",
  //                         provision: provisionNumbers(Number(percentString)),
  //                         isRoomNumber: 0,
  //                       };

  //                       rowList.push(newRow);
  //                     }
  //                   }
  //                   else {
  //                     const newRow = {
  //                       RefNo: rowSoA.RefNo,
  //                       Description: rowSoA.Description,
  //                       Rooms: rowSoA.Rooms,
  //                       UnitArea: rowIFC.IFCNameList[i].IFCArea,
  //                       CellularRoom: rowSoA.CellularRoom,
  //                       OpenPlan: rowSoA.OpenPlan,
  //                       SpecialRequirement: rowSoA.SpecialRequirement,
  //                       roomName: rowIFC.IFCNameList[i].IFCName,
  //                       area: rowIFC.IFCNameList[i].IFCArea,
  //                       minus: 0,
  //                       percent: "0%",
  //                       TotalAreaRequired: 0,
  //                       TotalAreaProvided: 0,
  //                       TotalMinus: 0,
  //                       TotalPercent: 0,
  //                       TotalRoomRequired: rowSoA.Rooms,
  //                       TotalRoomProvided: rowIFC.IFCNoRoom,
  //                       provision: provisionNumbers(0),
  //                       isRoomNumber: 0,
  //                     };

  //                     rowList.push(newRow);
  //                   }
  //                 }
  //                 count++;
  //               }

  //               for (let i = rowIFC.IFCNoRoom; i < Number(rowSoA.Rooms); i++) {
  //                 if (rowSoA.UnitArea !== "") {
  //                   const newRow = {
  //                     RefNo: rowSoA.RefNo,
  //                     Description: rowSoA.Description,
  //                     Rooms: rowSoA.Rooms,
  //                     UnitArea: rowSoA.UnitArea,
  //                     CellularRoom: rowSoA.CellularRoom,
  //                     OpenPlan: rowSoA.OpenPlan,
  //                     SpecialRequirement: rowSoA.SpecialRequirement,
  //                     roomName: "",
  //                     area: "",
  //                     minus: "",
  //                     percent: "",
  //                     TotalAreaRequired: "",
  //                     TotalAreaProvided: "",
  //                     TotalMinus: "",
  //                     TotalPercent: "",
  //                     TotalRoomRequired: "",
  //                     TotalRoomProvided: "",
  //                     provision: provisionNumbers(0),
  //                     isRoomNumber: 0,
  //                   };

  //                   rowList.push(newRow);
  //                 }
  //               }
  //             }
  //           }
  //         });
  //       });

  //       rowList.forEach((item) => {
  //         if (item.CellularRoom && !isBlank(item.CellularRoom)) {
  //           const baseRow = {
  //             RefNo: item.RefNo,
  //             Description: item.Description,
  //             Rooms: 1,
  //             UnitArea: item.UnitArea,
  //             CellularRoom: item.UnitArea,
  //             OpenPlan: "",
  //             SpecialRequirement: item.SpecialRequirement,
  //             roomName: item.roomName,
  //             area: item.area,
  //             minus: item.minus,
  //             percent: item.percent,
  //             TotalAreaRequired: item.TotalAreaRequired,
  //             TotalAreaProvided: item.TotalAreaProvided,
  //             TotalMinus: item.TotalMinus,
  //             TotalPercent: item.TotalPercent,
  //             TotalRoomRequired: item.TotalRoomRequired,
  //             TotalRoomProvided: item.TotalRoomProvided,
  //           };

  //           const newRow = worksheet.addRow(baseRow);
  //           const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //           newRow.height = Math.max(20, lineCount * 15);

  //           if (isBlank(baseRow.roomName) && isBlank(baseRow.area)) {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FF7600BC" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 0 && item.provision === "Over-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FFFF5B00" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 1 && item.provision === "Over-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FFFF0000" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 1 && item.provision === "Under-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "90EE90" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 0) {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FF7600BC" },
  //                 };
  //               }
  //             });
  //           }
  //         }
  //         else if (item.OpenPlan && !isBlank(item.OpenPlan)) {
  //           const baseRow = {
  //             RefNo: item.RefNo,
  //             Description: item.Description,
  //             Rooms: 1,
  //             UnitArea: item.UnitArea,
  //             CellularRoom: "",
  //             OpenPlan: item.UnitArea,
  //             SpecialRequirement: item.SpecialRequirement,
  //             roomName: item.roomName,
  //             area: item.area,
  //             minus: item.minus,
  //             percent: item.percent,
  //             TotalAreaRequired: item.TotalAreaRequired,
  //             TotalAreaProvided: item.TotalAreaProvided,
  //             TotalMinus: item.TotalMinus,
  //             TotalPercent: item.TotalPercent,
  //             TotalRoomRequired: item.TotalRoomRequired,
  //             TotalRoomProvided: item.TotalRoomProvided,
  //           };

  //           const newRow = worksheet.addRow(baseRow);
  //           const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //           newRow.height = Math.max(20, lineCount * 15);
  //           if (isBlank(baseRow.roomName) && isBlank(baseRow.area)) {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FF7600BC" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 0 && item.provision === "Over-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FFFF5B00" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 1 && item.provision === "Over-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FFFF0000" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 1 && item.provision === "Under-provision") {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "90EE90" },
  //                 };
  //               }
  //             });
  //           }
  //           else if (item.isRoomNumber === 0) {
  //             newRow.eachCell((cell, colNumber) => {
  //               if (colNumber <= 11) {
  //                 cell.fill = {
  //                   type: "pattern",
  //                   pattern: "solid",
  //                   fgColor: { argb: "FF7600BC" },
  //                 };
  //               }
  //             });
  //           }
  //         }
  //         else {
  //           const baseRow = {
  //             RefNo: "",
  //             Description: "",
  //             Rooms: "",
  //             UnitArea: "",
  //             CellularRoom: "",
  //             OpenPlan: "",
  //             SpecialRequirement: "",
  //             roomName: item.roomName,
  //             area: item.area,
  //             minus: "",
  //             percent: "",
  //             TotalAreaRequired: "",
  //             TotalAreaProvided: "",
  //             TotalMinus: "",
  //             TotalPercent: "",
  //             TotalRoomRequired: "",
  //             TotalRoomProvided: "",
  //           };

  //           const newRow = worksheet.addRow(baseRow);
  //           const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //           newRow.height = Math.max(20, lineCount * 15);
  //           newRow.eachCell((cell, colNumber) => {
  //             if (colNumber <= 11) {
  //               cell.fill = {
  //                 type: "pattern",
  //                 pattern: "solid",
  //                 fgColor: { argb: "FF7600BC" },
  //               };
  //             }
  //           });
  //         }
  //       });

  //       const missingExcelItems: any[] = [];
  //       sortedData.forEach((rowSoA) => {
  //         const exists = rowList.some((row) => row.RefNo === rowSoA.RefNo);
  //         if (!exists) {
  //           if (!Number.isNaN(Number(rowSoA.Rooms))) {
  //             for (let i = 0; i < Number(rowSoA.Rooms); i++) {
  //               const newRow = {
  //                 RefNo: rowSoA.RefNo,
  //                 Description: rowSoA.Description,
  //                 Rooms: rowSoA.Rooms,
  //                 UnitArea: rowSoA.UnitArea,
  //                 CellularRoom: rowSoA.CellularRoom,
  //                 OpenPlan: rowSoA.OpenPlan,
  //                 SpecialRequirement: rowSoA.SpecialRequirement,
  //                 roomName: "",
  //                 area: "",
  //                 minus: "",
  //                 percent: "",
  //                 TotalAreaRequired: "",
  //                 TotalAreaProvided: "",
  //                 TotalMinus: "",
  //                 TotalPercent: "",
  //                 TotalRoomRequired: "",
  //                 TotalRoomProvided: "",
  //                 provision: provisionNumbers(0),
  //                 isRoomNumber: 0,
  //               };
  //               missingExcelItems.push(newRow);
  //             }
  //           }
  //         }
  //       });
  //       missingExcelItems.sort((a: any, b: any) => {
  //         const soaRefNoA = a.RefNo.split('.');
  //         const soaRefNoB = b.RefNo.split('.');

  //         for (let i = 0; i < Math.max(soaRefNoA.length, soaRefNoB.length); i++) {
  //           const partA = soaRefNoA[i] || "";
  //           const partB = soaRefNoB[i] || "";

  //           if (partA !== partB) {
  //             return partA.localeCompare(partB, undefined, { numeric: true });
  //           }
  //         }

  //         return a.Description.localeCompare(b.Description, undefined, { numeric: true });
  //       });
  //       missingExcelItems.forEach((item) => {
  //         if (item.CellularRoom && !isBlank(item.CellularRoom)) {
  //           const baseRow = {
  //             RefNo: item.RefNo,
  //             Description: item.Description,
  //             Rooms: 1,
  //             UnitArea: item.UnitArea,
  //             CellularRoom: item.UnitArea,
  //             OpenPlan: "",
  //             SpecialRequirement: item.SpecialRequirement,
  //             roomName: item.roomName,
  //             area: item.area,
  //             minus: "",
  //             percent: "",
  //             TotalAreaRequired: "",
  //             TotalAreaProvided: "",
  //             TotalMinus: "",
  //             TotalPercent: "",
  //             TotalRoomRequired: "",
  //             TotalRoomProvided: "",
  //           };

  //           const newRow = worksheet.addRow(baseRow);
  //           const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //           newRow.height = Math.max(20, lineCount * 15);
  //           newRow.eachCell((cell, colNumber) => {
  //             if (colNumber <= 11) {
  //               cell.fill = {
  //                 type: "pattern",
  //                 pattern: "solid",
  //                 fgColor: { argb: "FF7600BC" },
  //               };
  //             }
  //           });
  //         }
  //         else if (item.OpenPlan && !isBlank(item.OpenPlan)) {
  //           const baseRow = {
  //             RefNo: item.RefNo,
  //             Description: item.Description,
  //             Rooms: 1,
  //             UnitArea: item.UnitArea,
  //             CellularRoom: "",
  //             OpenPlan: item.UnitArea,
  //             SpecialRequirement: item.SpecialRequirement,
  //             roomName: item.roomName,
  //             area: item.area,
  //             minus: item.minus,
  //             percent: item.percent,
  //             TotalAreaRequired: "",
  //             TotalAreaProvided: "",
  //             TotalMinus: "",
  //             TotalPercent: "",
  //             TotalRoomRequired: "",
  //             TotalRoomProvided: "",
  //           };

  //           const newRow = worksheet.addRow(baseRow);
  //           const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //           newRow.height = Math.max(20, lineCount * 15);
  //           newRow.eachCell((cell, colNumber) => {
  //             if (colNumber <= 11) {
  //               cell.fill = {
  //                 type: "pattern",
  //                 pattern: "solid",
  //                 fgColor: { argb: "FF7600BC" },
  //               };
  //             }
  //           });
  //         }
  //       });

  //       const missingIFCItems: any[] = [];
  //       exportTable.forEach((rowIFC: IFCItemNew) => {
  //         const exists = rowList.some((row) => row.roomName === rowIFC.IFCNameList?.[0]?.IFCName);
  //         if (!exists) {
  //           const newRow = {
  //             RefNo: "",
  //             Description: "",
  //             Rooms: "",
  //             UnitArea: "",
  //             CellularRoom: "",
  //             OpenPlan: "",
  //             SpecialRequirement: "",
  //             roomName: rowIFC.IFCNameList[0]?.IFCName,
  //             area: rowIFC.IFCNameList[0]?.IFCArea,
  //             minus: "",
  //             percent: "",
  //             TotalAreaRequired: "",
  //             TotalAreaProvided: "",
  //             TotalMinus: "",
  //             TotalPercent: "",
  //             TotalRoomRequired: "",
  //             TotalRoomProvided: "",
  //             provision: provisionNumbers(0),
  //             isRoomNumber: 0,
  //           };
  //           missingIFCItems.push(newRow);
  //         }
  //       });
  //       missingIFCItems.sort((a: any, b: any) => {
  //         return a.roomName.localeCompare(b.roomName, undefined, { numeric: true });
  //       });
  //       missingIFCItems.forEach((item) => {
  //         const baseRow = {
  //           RefNo: "",
  //           Description: "",
  //           Rooms: "",
  //           UnitArea: "",
  //           CellularRoom: "",
  //           OpenPlan: "",
  //           SpecialRequirement: "",
  //           roomName: item.roomName,
  //           area: item.area,
  //           minus: "",
  //           percent: "",
  //           TotalAreaRequired: "",
  //           TotalAreaProvided: "",
  //           TotalRoomRequired: "",
  //           TotalRoomProvided: "",
  //           TotalMinus: "",
  //           TotalPercent: "",
  //         };

  //         const newRow = worksheet.addRow(baseRow);
  //         const lineCount = Math.ceil(item.SpecialRequirement.length / 40);
  //         newRow.height = Math.max(20, lineCount * 15);
  //         newRow.eachCell((cell, colNumber) => {
  //           if (colNumber <= 11) {
  //             cell.fill = {
  //               type: "pattern",
  //               pattern: "solid",
  //               fgColor: { argb: "FFFFD700" },
  //             };
  //           }
  //         });
  //       });

  //       worksheet.eachRow((row) => {
  //         row.eachCell((cell) => {
  //           cell.alignment = {
  //             vertical: "middle",
  //           };
  //         });
  //       });

  //       // Bật chế độ wrapText cho cột "Special Requirement"
  //       worksheet.getColumn("SpecialRequirement").alignment = {
  //         wrapText: true,
  //       };

  //       const worksheetLegend = workbook.addWorksheet("Legend");
  //       worksheetLegend.getCell('C2').value = ': SoA Compliant';
  //       worksheetLegend.getCell('B2').fill = {
  //         type: "pattern",
  //         pattern: "solid",
  //         fgColor: { argb: "FF90EE90" },
  //       };
  //       worksheetLegend.getCell('C3').value = ': Area Incompliant';
  //       worksheetLegend.getCell('B3').fill = {
  //         type: "pattern",
  //         pattern: "solid",
  //         fgColor: { argb: "FFFF0000" },
  //       };
  //       worksheetLegend.getCell('C4').value = ': No. if Room(s) Incompliant';
  //       worksheetLegend.getCell('B4').fill = {
  //         type: "pattern",
  //         pattern: "solid",
  //         fgColor: { argb: "FF7600BC" },
  //       };
  //       worksheetLegend.getCell('C5').value = ': Area and No. if Room(s) Incompliant';
  //       worksheetLegend.getCell('B5').fill = {
  //         type: "pattern",
  //         pattern: "solid",
  //         fgColor: { argb: "FFFF5B00" },
  //       };
  //       worksheetLegend.getCell('C6').value = ': Room not found in SoA';
  //       worksheetLegend.getCell('B6').fill = {
  //         type: "pattern",
  //         pattern: "solid",
  //         fgColor: { argb: "FFFFD700" },
  //       };

  //       // Xuất file Excel
  //       const buffer = await workbook.xlsx.writeBuffer();
  //       const blob = new Blob([buffer], {
  //         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //       });
  //       const url = URL.createObjectURL(blob);

  //       // Tạo và kích hoạt liên kết tải xuống
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.download = "Excel_Results.xlsx";
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //     } catch (err) {
  //       console.error("Export failed: ", err);
  //     }
  //   }
  // };

  const handleCheckPrecent = async (checkTable: any[]) => {
    if (checkTable.length > 0) {
      checkTable.forEach((table) => {
        // Thêm dữ liệu vào sheet
        let totalRoomArea = 0;
        let totalUnitArea = 0;
        table.forEach((row: any) => {
          if (row.data.Area !== "" && row.data.UnitArea !== "") {
            if (
              !Number.isNaN(Number(row.data.Area)) &&
              !Number.isNaN(Number(row.data.UnitArea))
            ) {
              if (Number(row.data.UnitArea) === 0) {
                totalRoomArea += Number(row.data.Area);
              }
              else {
                totalRoomArea += Number(row.data.Area);
                totalUnitArea += Number(row.data.UnitArea);
              }
            }
            else {
              totalRoomArea += Number(row.data.Area);
              totalUnitArea += Number(row.data.Area);
            }
          }

        });
        const percentString = Number(((Number(totalRoomArea) - Number(totalUnitArea)) / Number(totalUnitArea) * 100).toFixed(2));
        if (percentString) {
          const status = provisionNumbers(percentString)
          alert(String(`Total Percentage: ${percentString}% is ${status}`));
        }
      });
    }
  }

  const panel = BUI.Component.create<BUI.PanelSection>(() => {
    return BUI.html`
        <bim-div>
          <bim-panel-section collapsed label="Floors" name="Floors"">
          </bim-panel-section>
          
          <bim-panel-section collapsed label="Categories" name="Categories"">
          </bim-panel-section>

          <bim-panel-section collapsed label="Provision">
              <bim-div style="display: flex; justify-content: space-between; align-items: center;">
                <bim-label>Under Provision</bim-label>
                <bim-checkbox name="under" 
                             .checked="${true}" 
                              @change="${(e: Event) => handleUnderProvisionVisible((e.target as HTMLInputElement).checked)}">
                </bim-checkbox>
              </bim-div>
              <bim-div style="display: flex; justify-content: space-between; align-items: center;">
                <bim-label>Over Provision</bim-label>
                <bim-checkbox name="over" 
                             .checked="${true}" 
                              @change="${(e: Event) => handleOverProvisionVisible((e.target as HTMLInputElement).checked)}">
                </bim-checkbox>
              </bim-div>
              <bim-div style="display: flex; justify-content: space-between; align-items: center;">
                <bim-label>Non Provision</bim-label>
                <bim-checkbox name="remain" 
                             .checked="${true}" 
                              @change="${(e: Event) => handleRemainSpaceVisible((e.target as HTMLInputElement).checked)}">
                 </bim-checkbox>
              </bim-div>
            </bim-panel-section>
          </bim-panel-section>
        </bim-div>
    `;
  });

  const floorSection = panel.querySelector(
    "bim-panel-section[name='Floors']",
  ) as BUI.PanelSection;

  const categorySection = panel.querySelector(
    "bim-panel-section[name='Categories']",
  ) as BUI.PanelSection;

  const handleLoadClassifier = async () => {
    const structureNames = classifier.list?.stories ? Object.keys(classifier.list.stories) : [];
    for (const name of structureNames) {
      spatialStructures[name] = true;
    }

    const classNames = classifier.list?.entities ? Object.keys(classifier.list.entities) : [];
    for (const name of classNames) {
      classes[name] = true;
    }

    for (const name in spatialStructures) {
      const panel = BUI.Component.create<BUI.Checkbox>(() => {
        return BUI.html`
            <bim-checkbox checked label="${name}"
              @change="${({ target }: { target: BUI.Checkbox }) => {
            const found = classifier.list?.level?.[name];
            if (found && found.id !== null) {
              for (const [_id, model] of fragments.groups) {
                const foundIDs = indexer.getEntityChildren(model, found.id);
                const fragMap = model.getFragmentMap(foundIDs);
                hider.set(target.value, fragMap);
              }
            }
          }}">
            </bim-checkbox>
          `;
      });
      floorSection.append(panel);
    }

    for (const name in classes) {
      const checkbox = BUI.Component.create<BUI.Checkbox>(() => {
        return BUI.html`
            <bim-checkbox checked label="${name}"
              @change="${({ target }: { target: BUI.Checkbox }) => {
            const found = classifier.find({ entities: [name] });
            hider.set(target.value, found);
          }}">
            </bim-checkbox>
          `;
      });
      categorySection.append(checkbox);
    }

    onDataChange(true);
  }

  fragments.onFragmentsLoaded.add(async (model) => {
    if (model.hasProperties) {
      const expressIDs = new Set<number>([/* danh sách ID cần thêm */]);
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
      if (!modelIdMap[model.uuid] || modelIdMap[model.uuid].size === 0) {
        return;
      }

      const fragmentIdMap = fragments.modelIdToFragmentIdMap(modelIdMap);
      // Tạo một attributesTable mới cho từng model
      const [newAttributesTable, updateNewAttributesTable] = CUI.tables.entityAttributes({
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

      attributesTables[model.uuid] = { table: newAttributesTable, update: updateNewAttributesTable };
      allFragmentIdMaps.push(fragmentIdMap);
      listModels.push(model);

      // Nếu tất cả model đã được xử lý, gọi onFragmentIdChange
      if (listModels.length === numberIFC) {
        setTimeout(() => {
          const allTableData: BUI.TableGroupData[][] = Object.values(attributesTables).map((item) => item.table.data);
          if (allTableData.length > 0) {
            const allData: any[] = [];
            // const allIFCItemOld: IFCItemOld[] = [];
            const uniqueSoARefNos: Set<string> = new Set<string>();
            const soaRefNoDetails: Map<string, { RoomName: string, Rooms: number; ExcelRooms: number }> = new Map();

            allTableData.forEach((tableData) => {
              const dataValue: any[] = [];
              const modelUuid = Object.keys(attributesTables).find(
                (key) => attributesTables[key].table.data === tableData
              );

              tableData.forEach((row) => {
                if (row.data.Entity === "IFCSPACE") {
                  ifcSpace.push(row.data);
                  let soaRefNo = "";
                  let roomName = "";
                  if (row.children) {
                    row.children.forEach((item) => {
                      if (item.data.Name === "IfcSoA") {
                        item.children?.forEach((chill) => {
                          if (chill.data.Name === "IfcSoA_Ref_No") {
                            soaRefNo = String(chill.data.NominalValue);
                          }
                          else if (chill.data.Name === "IfcSoA_Room_Name") {
                            roomName = String(chill.data.NominalValue);
                          }
                        })
                      }
                    });
                  }

                  if (soaRefNo !== "" && roomName !== "") {
                    uniqueSoARefNos.add(soaRefNo);

                    const soaUnitArea = soa.find((item) => item.RefNo === soaRefNo)?.UnitArea ?? "";
                    const soaRooms = Number(soa.find((item) => item.RefNo === soaRefNo)?.Rooms ?? 0);

                    // Cập nhật Map với thông tin rooms và số lần xuất hiện
                    if (!soaRefNoDetails.has(soaRefNo)) {
                      soaRefNoDetails.set(soaRefNo, { RoomName: roomName, Rooms: 1, ExcelRooms: soaRooms, });
                    } else {
                      const currentDetails = soaRefNoDetails.get(soaRefNo)!;
                      soaRefNoDetails.set(soaRefNo, {
                        RoomName: roomName,
                        Rooms: currentDetails.Rooms + 1,
                        ExcelRooms: currentDetails.ExcelRooms + soaRooms,
                      });
                    }

                    if (row.children) {
                      row.children.forEach((item) => {
                        if (item.data.Name === "IfcSoA") {
                          item.children?.forEach((chill) => {
                            if (chill.data.Name === "IfcSoA_Provided_Area") {
                              const nominalValue = chill.data.NominalValue;
                              const data = {
                                SoARefNo: soaRefNo,
                                RoomName: roomName,
                                Area: nominalValue,
                                UnitArea: soaUnitArea,
                                modelID: modelUuid,
                              };
                              dataValue.push({ data });
                            }
                          });
                        }
                      });
                    }
                  }

                  // if (row.children) {
                  //   row.children.forEach((item) => {
                  //     if (item.data.Name === "SoA") {
                  //       item.children?.forEach((chill) => {
                  //         if (chill.data.Name === "SoA_Provided_Area") {
                  //           const data: IFCItemOld = {
                  //             IFCRefNo: soaRefNo,
                  //             IFCNameArea: {
                  //               IFCName: String(roomName),
                  //               IFCArea: String(chill.data.NominalValue)
                  //             },
                  //             IFCNoRoom: 1,
                  //             modelID: modelUuid,
                  //           };
                  //           allIFCItemOld.push(data);
                  //         }
                  //       });
                  //     }
                  //   });
                  // }
                }
              });
              allData.push(dataValue);
            })

            soaRefNoSummary = [];
            soa.forEach((item) => {
              const soaRefNo = item.RefNo;
              const soaRooms = Number(item.Rooms);

              // Chỉ xử lý nếu Rooms là một số hợp lệ
              if (!uniqueSoARefNos.has(soaRefNo) && !Number.isNaN(soaRooms)) {
                uniqueSoARefNos.add(soaRefNo);
                soaRefNoDetails.set(soaRefNo, { RoomName: "", Rooms: 0, ExcelRooms: soaRooms });
              }
            });
            // Chuyển Map thành danh sách key-value
            soaRefNoDetails.forEach((value, key) => {
              soaRefNoSummary.push({
                SoARefNo: key,
                RoomName: value.RoomName,
                Rooms: value.Rooms,
                ExcelRooms: value.ExcelRooms,
              });
            });

            checkData = [];
            listModels.forEach(modelValue => {
              allData.forEach(data => {
                const dataValue: any[] = [];
                for (let i = 0; i < data.length; i++) {
                  const value = data[i];
                  if (modelValue.uuid === value.data.modelID) {
                    const data = {
                      SoARefNo: value.data.SoARefNo,
                      RoomName: value.data.RoomName,
                      Area: value.data.Area,
                      UnitArea: value.data.UnitArea,
                      modelName: modelValue.name,
                    };
                    dataValue.push({ data });
                  }
                }
                if (dataValue.length > 0) {
                  checkData.push(dataValue);
                }
              });
            });

            // const allIFCItemNew: IFCItemNew[] = [];
            // const map = new Map<string, IFCItemNew>();

            // allIFCItemOld.forEach((item) => {
            //   if (item.IFCRefNo !== "") {
            //     if (!map.has(item.IFCRefNo)) {
            //       map.set(item.IFCRefNo, {
            //         IFCRefNo: item.IFCRefNo,
            //         IFCNameList: [item.IFCNameArea],
            //         IFCNoRoom: item.IFCNoRoom,
            //         modelID: item.modelID,
            //       });
            //     } else {
            //       const existingItem = map.get(item.IFCRefNo)!;
            //       existingItem.IFCNameList.push(item.IFCNameArea);
            //       existingItem.IFCNoRoom += item.IFCNoRoom;
            //     }
            //   }
            //   else {
            //     const uniqueKey = Math.random().toString(36).substr(2, 9);
            //     map.set(uniqueKey, {
            //       IFCRefNo: "",
            //       IFCNameList: [item.IFCNameArea],
            //       IFCNoRoom: 1,
            //       modelID: item.modelID,
            //     });
            //   }
            // });

            // // Chuyển từ Map thành mảng
            // allIFCItemNew.push(...map.values());
            // listIFCItem = allIFCItemNew.map((item) => ({ ...item }));
            // listIFCItem.sort((a: any, b: any) => {
            //   const soaRefNoA = a.IFCRefNo.split('.');
            //   const soaRefNoB = b.IFCRefNo.split('.');

            //   for (let i = 0; i < Math.max(soaRefNoA.length, soaRefNoB.length); i++) {
            //     const partA = soaRefNoA[i] || "";
            //     const partB = soaRefNoB[i] || "";

            //     // So sánh chuỗi, trả về thứ tự tương ứng
            //     if (partA !== partB) {
            //       return partA.localeCompare(partB, undefined, { numeric: true });
            //     }
            //   }
            //   return 0;
            // });

            // listIFCItem.forEach(item => {
            //   item.IFCNameList.sort((a: any, b: any) =>
            //     a.IFCName.localeCompare(b.IFCName, undefined, { numeric: true })
            //   );
            // });
          }

          handleLoadClassifier();
        }, 1000);
      }
    }
  });

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel style="display: flex; flex-direction: column; position: relative; height: 100%;">
        <div style="flex: 1 1 auto;">
          <bim-panel-section label="Loaded Models" icon="mage:box-3d-fill">
            ${modelsList}
          </bim-panel-section>
          <bim-panel-section collapsed label="Filter" icon="ph:tree-structure-fill">
            ${panel}
        </div>
        <bim-div style="padding: 0.5rem; display: flex; justify-content: flex-start; align-items: flex-start;">
          <bim-div style="display: flex; gap: 10px; align-items: center;">
            <bim-button label="Check"
                        style="width: 80px; height: 25px; font-size: 10px; padding: 0; text-align: center;"
                        @click="${() => { handleCheckPrecent(checkData); }}">
            </bim-button>
           </bim-div>
        </bim-div>
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; padding: 5px;">
          <bim-div style="flex: 1; text-align: center;">
            <a href="http://localhost:5173/${userId}/Projects/${projectId}/ImportFile/back">
              <bim-button label="BACK"
                          style="width: 260px; height: 30px; font-size: 10px; text-align: center; background-color: red; color: white; font-weight: bold;">
              </bim-button>
            </a>
          </bim-div>
        </div>
      </bim-panel>
    `;
  });
};
