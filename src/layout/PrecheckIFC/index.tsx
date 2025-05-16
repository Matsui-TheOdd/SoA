/* eslint-disable no-alert */
/* eslint-disable import/order */
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as CUI from "@thatopen/ui-obc";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as WEBIFC from "web-ifc";
import { AppManager } from "../../bim-components";
import projectInformation from "../../components/Panels/ProjectInformation";
import elementData from "../../components/Panels/Selection";
import showAtt from "../../components/Panels/ShowAtt";
import { PORT } from "../../lib/db";
import { IFCFileModel } from "../../model/IFCFileModel";
import { ExcelModel } from "../../model/ExcelModel";
import { SoAModel } from "../../model/SoAModel";
import { FragmentsGroup } from "@thatopen/fragments";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const PrecheckIFC = (props: { userId: number; projectId: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [soa, setSoA] = useState<SoAModel[]>([]);
  const [ifc, setIFC] = useState<IFCFileModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoadedProjectInfo, setIsLoadedProjectInfo] =
    useState<boolean>(false);
  const [isLoadedSelection, setIsLoadedSelection] = useState<boolean>(false);

  BUI.Manager.init();
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBF.PostproductionRenderer
  >();
  world.name = "Main";

  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const classifier = components.get(OBC.Classifier);

  const viewport = BUI.Component.create<BUI.Viewport>(() => {
    return BUI.html`
    <bim-viewport>
      <bim-grid floating></bim-grid>
    </bim-viewport>
  `;
  });

  const sceneComponent = new OBC.SimpleScene(components);
  sceneComponent.setup();
  world.scene = sceneComponent;
  world.scene.three.background = new THREE.Color("white");

  const rendererComponent = new OBF.PostproductionRenderer(
    components,
    viewport
  );
  world.renderer = rendererComponent;

  const cameraComponent = new OBC.SimpleCamera(components);
  world.camera = cameraComponent;

  viewport.addEventListener("resize", () => {
    rendererComponent.resize();
    cameraComponent.updateAspect();
  });

  const worldGrid = components.get(OBC.Grids);
  worldGrid.create(world);

  components.init();

  const { postproduction } = world.renderer;
  postproduction.enabled = true;

  postproduction.setPasses({ gamma: false });
  postproduction.setPasses({ custom: true });
  postproduction.customEffects.glossEnabled = false;
  postproduction.setPasses({ ao: false });

  const appManager = components.get(AppManager);
  const viewportGrid = viewport.querySelector<BUI.Grid>("bim-grid[floating]")!;
  appManager.grids.set("viewport", viewportGrid);

  classifier.list.CustomSelections = {};

  const highlighter = components.get(OBF.Highlighter);
  highlighter.setup({ world });
  highlighter.zoomToSelection = true;

  const outliner = components.get(OBF.Outliner);
  outliner.world = world;
  outliner.enabled = true;

  outliner.create(
    "example",
    new THREE.MeshBasicMaterial({
      color: 0x0099ff,
      transparent: true,
      opacity: 0.2,
    })
  );

  highlighter.events.select.onHighlight.add((data) => {
    outliner.clear("example");
    outliner.add("example", data);
  });

  highlighter.events.select.onClear.add(() => {
    outliner.clear("example");
  });

  const getExcelDb = async (): Promise<ExcelModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/${props.projectId}/excels`,
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

  const getIFCFileDb = async (): Promise<IFCFileModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/${props.projectId}/ifcFiles`,
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

  const loadIfcModel = async (): Promise<FragmentsGroup[]> => {
    try {
      // Get the IFC file data
      if (!ifc || !ifc.length) {
        console.error("IFC file data is missing or invalid.");
        return [];
      }

      // Initialize the list of models
      const listModels: FragmentsGroup[] = [];

      // Process each IFC file
      for (const item of ifc) {
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

  useEffect(() => {
    const loadSoAModel = async (): Promise<SoAModel[]> => {
      try {
        // Get the IFC file data
        setIsLoading(true);
        const dataExcel = await getExcelDb();
        if (!dataExcel || !dataExcel.length) {
          setIsLoading(false);
          return [];
        }

        const dataSoA = (
          await Promise.all(
            dataExcel.map(async (item) => {
              const soaRows = await getSoADb(item.id);
              return soaRows && soaRows.length > 0 ? soaRows : [];
            })
          )
        ).flat();

        const dataIFC = await getIFCFileDb();
        if (dataIFC) {
          setIFC(dataIFC);
        }

        setSoA(dataSoA);
        setIsLoading(false);
        return dataSoA;
      } catch (error) {
        return [];
      }
    };

    loadSoAModel();
  }, []);

  useEffect(() => {
    if (soa.length > 0 && ifc.length > 0) {
      if (!containerRef.current) return;
      loadIfcModel();
      // Handling loaded fragments
      fragments.onFragmentsLoaded.add(async (model) => {
        if (model.hasProperties) {
          await indexer.process(model);
          classifier.byEntity(model);

          await classifier.bySpatialStructure(model, {
            isolate: new Set([WEBIFC.IFCBUILDINGSTOREY, WEBIFC.IFCSPACE]),
            systemName: "level",
          });
          await classifier.bySpatialStructure(model, {
            isolate: new Set([WEBIFC.IFCBUILDINGSTOREY]),
            systemName: "stories",
          });
        }

        if (world.scene) world.scene.three.add(model);
        // for (const fragment of model.items) {
        //   world.meshes.add(fragment.mesh);
        //   world.scene.three.add(fragment.mesh);
        // }
      });

      // Create elementDataPanel (if used in the layout)
      const elementDataPanel = elementData(
        components,
        soa,
        ifc.length,
        (data) => {
          setIsLoadedSelection(data);
        }
      );
      const showAttPanel = showAtt(components);
      const projectInformationPanel = projectInformation(
        components,
        soa,
        props.userId,
        props.projectId,
        ifc.length,
        (data) => {
          setIsLoadedProjectInfo(data);
        }
      );

      const leftPanel = BUI.Component.create(() => {
        return BUI.html`
          ${projectInformationPanel}
        `;
      });

      // Create the main app grid and set the layout
      const app = BUI.Component.create(() => {
        return BUI.html`
          <bim-grid > </bim-grid>
        `;
      }) as BUI.Grid;

      // Define the layout of the app
      app.layouts = {
        main: {
          template: `
            "empty empty" 4.1rem
            "leftPanel viewport" 1fr
            /20rem 1fr 
          `,
          elements: {
            leftPanel,
            viewport,
          },
        },
      };

      app.layout = "main";

      // Handle viewport grid layout
      viewportGrid.layouts = {
        main: {
          template: `
                "empty" 1.6rem
                "empty empty" 1fr
                /1fr 1fr
            `,
          elements: {},
        },
        second: {
          template: `
                "empty showAttPanel" 2fr
                "elementDataPanel showAttPanel" 1fr
                /1fr 0.4fr
            `,
          elements: {
            elementDataPanel,
            showAttPanel,
          },
        },
      };

      viewportGrid.layout = "main";

      // Append the app to the container
      containerRef.current?.appendChild(app);
    }
  }, [soa, ifc]);

  useEffect(() => {
    if (isLoadedProjectInfo === true && isLoadedSelection === true) {
      setIsLoaded(true);
    }
  }, [isLoadedProjectInfo, isLoadedSelection]);

  return (
    <div className="h-screen w-screen">
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
        <div className="h-full w-full">
          {soa && soa.length > 0 && ifc && ifc.length > 0 ? (
            <>
              <Backdrop
                sx={(theme) => ({
                  color: "#fff",
                  zIndex: theme.zIndex.drawer + 1,
                })}
                open={!isLoaded}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
              <div className="h-full w-full" ref={containerRef}></div>
            </>
          ) : (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-md w-full space-y-8 text-center">
                <div className="mb-8">
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Page can't load
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Please, you need to import excel and ifc files to this
                    project before preview.
                  </p>
                </div>
                <div className="mt-8">
                  <a
                    href="/Projects"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Go back projects
                  </a>
                </div>
              </div>
              <div className="mt-16 w-full max-w-2xl">
                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                      If you think this is a mistake, please reload the page
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrecheckIFC;
