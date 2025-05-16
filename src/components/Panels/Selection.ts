/* eslint-disable no-alert */
/* eslint-disable import/no-unresolved */
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui-obc";
import { SoAModel } from "@model/SoAModel";
import { TableDataModel } from "@model/TableDataModel";
import { FragmentIdMap, FragmentsGroup } from "@thatopen/fragments";
import { AppManager } from "../../bim-components";

type IfcElementsInfo = {
  SoA_Ref_No: string;
  SoA_Room_Name: string;
  SoA_Required_Area: number | string;
  SoA_Provided_Area: number | string;
  Difference: number;
};

export default (components: OBC.Components, soa: SoAModel[], numberIFC: number, onDataChange: (data: any) => void) => {
  const fragments = components.get(OBC.FragmentsManager);
  const highlighter = components.get(OBF.Highlighter);
  const appManager = components.get(AppManager);
  const viewportGrid = appManager.grids.get("viewport");

  const simpleTable = document.createElement(
    "bim-table",
  ) as BUI.Table<IfcElementsInfo>;

  const baseStyle: Record<string, string> = {
    padding: "0.25rem",
    borderRadius: "0.25rem",
  };
  const tableDefinition: BUI.TableDataTransform = {
    Entity: (entity) => {
      let style = {};
      if (entity === OBC.IfcCategoryMap[WEBIFC.IFCPROPERTYSET]) {
        style = {
          ...baseStyle,
          backgroundColor: "purple",
          color: "white",
        };
      }
      if (String(entity).includes("IFCELEMENTQUANTITY")) {
        style = {
          ...baseStyle,
          backgroundColor: "pink",
          color: "white",
        };
      }
      return BUI.html`<bim-label style=${BUI.styleMap(style)}>${entity}</bim-label>`;
    },
    NominalValue: (value) => {
      let style = {};
      if (typeof value === "string") {
        style = { ...baseStyle, backgroundColor: "#b13535", color: "white" };
      }
      if (typeof value === "number") {
        style = { ...baseStyle, backgroundColor: "#18882c", color: "white" };
      }
      return BUI.html`<bim-label style=${BUI.styleMap(style)}>${value}</bim-label>`;
    },

    AreaValue: (value) => {
      let style = {};
      if (typeof value === "number") {
        style = { ...baseStyle, backgroundColor: "#d9c0b7", color: "white" };
      }
      return BUI.html`<bim-label style=${BUI.styleMap(style)}>${value}</bim-label>`;
    },
  };

  const [attributesTable, updateAttributesTable] = CUI.tables.entityAttributes({
    components,
    fragmentIdMap: {},
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

  attributesTable.expanded = true;
  attributesTable.indentationInText = true;
  attributesTable.preserveStructureOnFilter = true;

  const attributesTables: { [modelId: string]: any } = {};
  const listModels: FragmentsGroup[] = [];

  const compareNumbers = (a: number, b: number, percent: number) => {
    const percentageDifference = (Math.abs(a - b) / b) * 100;

    if (percentageDifference > percent) {
      return 1;
    }
    return 0;
  };

  const provisionNumbers = (percentageDifference: number): string => {
    if ((percentageDifference < 0 && percentageDifference >= -10) || (percentageDifference > 0 && percentageDifference <= 10)) {
      return "Under-provision";
    }

    if (percentageDifference === 0) {
      return "Under-provision";
    }

    return "Over-provision";
  };

  // Set up custom filtering logic
  fragments.onFragmentsDisposed.add(() => updateAttributesTable());
  highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    if (!viewportGrid) return;
    viewportGrid.layout = "second";
    attributesTable.expanded = false;
    const mainData: BUI.TableGroupData[] = [];

    updateAttributesTable({ fragmentIdMap });

    setTimeout(() => {
      const tableData = attributesTable.data;
      tableData.forEach(row => {
        if (row.data.Entity === "IFCSPACE") {
          if (row.children) {
            let soaRefNo = "";
            let roomName = "";
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
            })

            if (soaRefNo !== "") {
              const soaArea = soa.find((item) => item.RefNo === soaRefNo)?.UnitArea ?? "";
              if (soaArea !== "") {
                row.children.forEach((item) => {
                  if (item.data.Name === "IfcSoA") {
                    item.children?.forEach((chill) => {
                      if (chill.data.Name === "IfcSoA_Provided_Area") {
                        const nominalValue = chill.data.NominalValue
                        if (
                          !Number.isNaN(Number(nominalValue)) &&
                          !Number.isNaN(Number(soaArea))
                        ) {
                          const data = {
                            SoA_Ref_No: soaRefNo,
                            SoA_Room_Name: roomName,
                            SoA_Required_Area: soaArea,
                            SoA_Provided_Area: nominalValue,
                            Difference: Number(((Number(nominalValue) - Number(soaArea)) / Number(soaArea) * 100).toFixed(2))
                          }
                          mainData.push({ data })
                        }
                        else {
                          const data = {
                            SoA_Ref_No: soaRefNo,
                            SoA_Room_Name: roomName,
                            SoA_Required_Area: nominalValue,
                            SoA_Provided_Area: nominalValue,
                            Difference: 0
                          }
                          mainData.push({ data })
                        }
                        simpleTable.data = mainData;
                      }
                    })
                  }
                })
              }
            }
            else {
              simpleTable.data = [];
            }
          }
        }
      })

      simpleTable.dataTransform.Difference = (value) => {
        const baseStyle = `display: flex; 
                           align-items: center; 
                           justify-content: center; 
                           width: 100%; 
                           text-align: center;
                           padding: 0.125rem 0.375rem;
                          `;

        const provisionStatus = provisionNumbers(value);
        if (provisionStatus === "Under-provision") {
          return BUI.html`
            <bim-label style="${baseStyle}; background-color: #00800054; color: #006400;">
              ${value}
            </bim-label> 
          `;
        }
        if (provisionStatus === "Over-provision") {
          return BUI.html`
            <bim-label style="${baseStyle}; background-color: #ff000054; color: #d54f4f;">
              ${value}
            </bim-label> 
          `;
        }
        // If the class value is none of the above, just return the same value without any changes.
        return value;
      };
    }, 1000)
  });

  highlighter.events.select.onClear.add(() => {
    updateAttributesTable({ fragmentIdMap: {} });
    if (!viewportGrid) return;
    viewportGrid.layout = "main";
  });

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

      listModels.push(model);

      // Nếu tất cả model đã được xử lý, gọi onFragmentIdChange
      if (listModels.length === numberIFC) {
        setTimeout(() => {
          const allTableData: BUI.TableGroupData[][] = Object.values(attributesTables).map((item) => item.table.data);
          if (allTableData.length > 0) {
            const allNonIFCSpace: any[] = [];
            const allDataCorrect: any[] = [];
            const allDataWarning: any[] = [];

            allTableData.forEach((tableData) => {
              const nonIFCSpace: any[] = [];
              const dataWarningValue: any[] = [];
              const dataCorrectValue: any[] = [];
              tableData.forEach((row) => {
                if (row.data.Entity === "IFCSPACE") {
                  if (row.children) {
                    let soaRefNo = "";
                    let roomName = "";
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
                    if (soaRefNo !== "") {
                      const soaArea = soa.find((item) => item.RefNo === soaRefNo)?.UnitArea ?? "";
                      if (soaArea !== "") {
                        row.children.forEach((item) => {
                          if (item.data.Name === "IfcSoA") {
                            item.children?.forEach((chill) => {
                              if (chill.data.Name === "IfcSoA_Provided_Area") {
                                const nominalValue = chill.data.NominalValue;
                                const modelUuid = Object.keys(attributesTables).find(
                                  (key) => attributesTables[key].table.data === tableData
                                );
                                const id = row.data.expressID;
                                if (
                                  !Number.isNaN(Number(nominalValue)) &&
                                  !Number.isNaN(Number(soaArea))
                                ) {
                                  if (compareNumbers(Number(nominalValue), Number(soaArea), 10)) {
                                    const data: TableDataModel = {
                                      SoARefNo: soaRefNo,
                                      RoomName: roomName,
                                      expressID: id,
                                      modelID: modelUuid,
                                      RoomArea: nominalValue,
                                      UnitArea: soaArea,
                                      Percent: Number(((Number(nominalValue) - Number(soaArea)) / Number(soaArea) * 100).toFixed(2))
                                    };
                                    dataWarningValue.push({ data });
                                  }
                                  else {
                                    const data: TableDataModel = {
                                      SoARefNo: soaRefNo,
                                      RoomName: roomName,
                                      expressID: id,
                                      modelID: modelUuid,
                                      RoomArea: nominalValue,
                                      UnitArea: soaArea,
                                      Percent: Number(((Number(nominalValue) - Number(soaArea)) / Number(soaArea) * 100).toFixed(2))
                                    };
                                    dataCorrectValue.push({ data });
                                  }
                                }
                                else {
                                  const data: TableDataModel = {
                                    SoARefNo: soaRefNo,
                                    RoomName: roomName,
                                    expressID: id,
                                    modelID: modelUuid,
                                    RoomArea: nominalValue,
                                    UnitArea: String(nominalValue),
                                    Percent: 0
                                  };
                                  dataCorrectValue.push({ data });
                                }
                              }
                            });
                          }
                        });
                      }
                      else {
                        const id = row.data.expressID;
                        const modelUuid = Object.keys(attributesTables).find(
                          (key) => attributesTables[key].table.data === tableData
                        );
                        const data: TableDataModel = {
                          SoARefNo: "",
                          RoomName: roomName,
                          expressID: id,
                          modelID: modelUuid,
                          RoomArea: 0,
                          UnitArea: "0",
                          Percent: 0
                        };
                        nonIFCSpace.push({ data });
                      }
                    }
                    else {
                      const id = row.data.expressID;
                      const modelUuid = Object.keys(attributesTables).find(
                        (key) => attributesTables[key].table.data === tableData
                      );
                      const data: TableDataModel = {
                        SoARefNo: "",
                        RoomName: roomName,
                        expressID: id,
                        modelID: modelUuid,
                        RoomArea: 0,
                        UnitArea: "0",
                        Percent: 0
                      };
                      nonIFCSpace.push({ data });
                    }
                  }
                }
                else {
                  const id = row.data.expressID;
                  const modelUuid = Object.keys(attributesTables).find(
                    (key) => attributesTables[key].table.data === tableData
                  );
                  const data: TableDataModel = {
                    SoARefNo: "",
                    RoomName: "",
                    expressID: id,
                    modelID: modelUuid,
                    RoomArea: 0,
                    UnitArea: "0",
                    Percent: 0
                  };
                  nonIFCSpace.push({ data });
                }
              });
              allDataWarning.push(dataWarningValue);
              allDataCorrect.push(dataCorrectValue);
              allNonIFCSpace.push(nonIFCSpace);
            })

            if (allDataCorrect.length > 0) {
              allDataCorrect.forEach((data: any[]) => {
                if (data && data.length > 0) {
                  let totalArea = 0;
                  let totalExcelArea = 0;
                  data.forEach((item) => {
                    const area = parseFloat(item.data.Area) || 0;
                    const excelArea = parseFloat(item.data.ExcelArea) || 0;

                    totalArea += area;
                    totalExcelArea += excelArea;
                  })

                  const Model = data[0].data.modelID;
                  const filteredModels = listModels.filter(modelValue => modelValue.uuid === Model);

                  if (filteredModels.length > 0) {
                    const name = filteredModels[0].name;
                    if (compareNumbers(Number(totalArea), Number(totalExcelArea), 10)) {
                      alert(`Project ${name} is over 10% Area`);
                    }
                  }
                }
              });
            }

            listModels.forEach(modelValue => {
              allDataCorrect.forEach(data => {
                data.forEach((value: any) => {
                  if (modelValue.uuid === value.data.modelID) {
                    modelValue.items.forEach(item => {
                      if (item && typeof item.setColor === 'function' && item.ids) {
                        item.ids.forEach(id => {
                          if (id === value.data.expressID) {
                            item.setColor(new THREE.Color(0x80EF80), item.ids, true);
                          }
                        })
                      }
                    });
                  }
                });
              });

              allDataWarning.forEach(data => {
                data.forEach((value: any) => {
                  if (modelValue.uuid === value.data.modelID) {
                    modelValue.items.forEach(item => {
                      if (item && typeof item.setColor === 'function' && item.ids) {
                        item.ids.forEach(id => {
                          if (id === value.data.expressID) {
                            item.setColor(new THREE.Color(0xFF1D18), item.ids, true);
                          }
                        })
                      }
                    });
                  }
                });
              });

              allNonIFCSpace.forEach(data => {
                data.forEach((value: any) => {
                  if (modelValue.uuid === value.data.modelID) {
                    modelValue.items.forEach(item => {
                      if (item && typeof item.setColor === 'function' && item.ids) {
                        item.ids.forEach(id => {
                          if (id === value.data.expressID) {
                            item.setColor(new THREE.Color(0x808080), item.ids, true);
                          }
                        })
                      }
                    });
                  }
                });
              });
            });

            onDataChange(true);
          }
        }, 1000);
      }
    }
  });

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
    <bim-panel>
      <bim-panel-section label="Entity Attributes" fixed>
        ${simpleTable}
      </bim-panel-section>
    </bim-panel>
  `;
  });
};
