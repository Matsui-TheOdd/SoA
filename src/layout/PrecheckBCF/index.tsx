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
import { PORT } from "../../lib/db";
import { IFCFileModel } from "../../model/IFCFileModel";
import { ExcelModel } from "../../model/ExcelModel";
import { SoAModel } from "../../model/SoAModel";
import { FragmentsGroup } from "@thatopen/fragments";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

interface TopicPanelActions {
  information: Partial<CUI.TopicInformationSectionActions>;
  viewpoints: Partial<CUI.TopicViewpointsSectionActions>;
  relatedTopics: Partial<CUI.TopicRelationsSectionActions>;
  comments: Partial<CUI.TopicCommentsSectionActions>;
}

interface TopicPanelUI {
  components: OBC.Components;
  topic?: OBC.Topic;
  styles?: Partial<CUI.TopicStyles>;
  actions?: Partial<TopicPanelActions>;
  world?: OBC.World;
}

const PrecheckBCF = (props: { projectId: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [soa, setSoA] = useState<SoAModel[]>([]);
  const [ifc, setIFC] = useState<IFCFileModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
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

  const getAllLeafNodes = (node: any, leafNodes: any[] = []): any[] => {
    // Check if the current node has children
    if (node.children && node.children.length > 0) {
      // If the node has children, recursively search each child
      node.children.forEach((child: any) => getAllLeafNodes(child, leafNodes));
    } else {
      // If no children, it's a leaf node - add it to the list
      leafNodes.push(node);
    }
    return leafNodes;
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
      setIsLoading(true);
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

      // BCF Topics
      const users: CUI.TopicUserStyles = {
        "user_A@something.com": {
          name: "User A",
          picture:
            "https://www.profilebakery.com/wp-content/uploads/2023/04/Profile-Image-AI.jpg",
        },
        "user_B@something.com": {
          name: "User B",
          picture:
            "https://www.profilebakery.com/wp-content/uploads/2023/04/Portrait-Photography.jpg",
        },
        "user_C@something.com": {
          name: "User C",
          picture:
            "https://www.profilebakery.com/wp-content/uploads/2023/04/AI-Portrait.jpg",
        },
      };
      const topics = components.get(OBC.BCFTopics);
      topics.setup({
        users: new Set(Object.keys(users)),
        author: "user",
        labels: new Set(["Architecture", "Structure", "MEP"]),
        stages: new Set(["Not Comply", "Comply"]),
      });

      const viewpoints = components.get(OBC.Viewpoints);
      topics.list.onItemSet.add(({ value: topic }) => {
        const viewpoint = viewpoints.create(world);
        topic.viewpoints.add(viewpoint.guid);
      });

      const [topicsList, updateTopicsList] = CUI.tables.topicsList({
        components,
        dataStyles: { users },
      });

      topicsList.hiddenColumns = ["Guid"];

      topicsList.selectableRows = true;

      const [topicForm, updateTopicForm] = CUI.forms.topic({
        components,
        styles: { users },
      });

      const topicsModal = BUI.Component.create<HTMLDialogElement>(() => {
        return BUI.html`
          <dialog class="form-dialog">
           <bim-panel style="border-radius: var(--bim-ui_size-base); width: 22rem;">
            ${topicForm}
           </bim-panel> 
          </dialog>
        `;
      });

      containerRef.current?.appendChild(topicsModal);

      const showFormBtn = BUI.Component.create(() => {
        const onClick = () => {
          topicsModal.showModal();
        };

        return BUI.html`
          <bim-button style="flex: 0" @click=${onClick} label="Create Topic" icon="material-symbols:task"></bim-button>
        `;
      });

      updateTopicForm({
        onCancel: () => {
          topicsModal.close();
        },
        onSubmit: () => {
          topicsModal.close();
        },
      });

      const [topicPanel, updateTopicPanel] = BUI.Component.create(
        (state: TopicPanelUI) => {
          const { components, topic, world, actions, styles } = state;

          let topicSections: BUI.TemplateResult | undefined;
          let missingTopicSection: BUI.TemplateResult | undefined;

          if (topic) {
            const [information] = CUI.sections.topicInformation({
              components,
              topic,
              actions: actions?.information,
              styles,
            });

            const [viewpoints] = CUI.sections.topicViewpoints({
              components,
              topic,
              world,
              actions: actions?.viewpoints,
            });

            const [relatedTopics] = CUI.sections.topicRelations({
              components,
              topic,
              actions: actions?.relatedTopics,
            });

            const [comments] = CUI.sections.topicComments({
              topic,
              actions: actions?.comments,
              styles: styles?.users,
            });

            topicSections = BUI.html`
              <bim-panel-section label="Information" icon="ph:info-bold">
                ${information}
              </bim-panel-section>
              <bim-panel-section label="Comments" icon="majesticons:comment-line">
                ${comments}
              </bim-panel-section>
              <bim-panel-section label="Viewpoints" icon="tabler:camera">
                ${viewpoints}
              </bim-panel-section>
              <bim-panel-section label="Related Topics" icon="tabler:link">
                ${relatedTopics}
              </bim-panel-section>
            `;
          } else {
            missingTopicSection = BUI.html`
              <bim-panel-section label="Missing Topic" icon="material-symbols:chat-error">
                ${!topic ? BUI.html`<bim-label>There is no topic to display in this panel!</bim-label>` : null}
              </bim-panel-section> 
            `;
          }

          return BUI.html`
            <bim-panel>
              ${missingTopicSection}
              ${topicSections}
            </bim-panel> 
          `;
        },
        { components, world, styles: { users } }
      );

      // Lets update the topic panel in case the topic information gets update somewhere else in the app.
      topics.list.onItemUpdated.add(() => updateTopicPanel());

      updateTopicsList({
        onTopicEnter: (topic) => {
          updateTopicPanel({ topic });
        },
      });

      const loadBtn = BUI.Component.create(() => {
        const loadBCF = () => {
          const input = document.createElement("input");
          input.multiple = false;
          input.accept = ".bcf";
          input.type = "file";

          input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) return;
            const buffer = await file.arrayBuffer();
            topics.load(new Uint8Array(buffer), world);
          });

          input.click();
        };

        return BUI.html`<bim-button style="flex: 0" @click=${loadBCF} label="Load BCF" icon="material-symbols:refresh"></bim-button> `;
      });

      const deleteSelectedBtn = BUI.Component.create(() => {
        const onDelete = async () => {
          const selectedGuids = new Set(
            Array.from(topicsList.selection).map((topic) => topic.Guid)
          );
          topicsList.selection.clear();

          const updatedTopics = topicsList.value.filter(
            (topic) => !selectedGuids.has(topic.data.Guid)
          );

          // Update the topics list with the new filtered topics
          topicsList.data = updatedTopics;
        };

        return BUI.html`<bim-button style="flex: 0" @click=${onDelete} label="Delete Topic" icon="material-symbols:delete"></bim-button>`;
      });

      const downloadBtn = BUI.Component.create(() => {
        const onDownload = async () => {
          const selectedTopics = [...topicsList.selection]
            .map(({ Guid }) => {
              if (!(Guid && typeof Guid === "string")) return null;
              const topic = topics.list.get(Guid);
              return topic;
            })
            .filter((topic) => topic) as OBC.Topic[];

          const topicsToExport = selectedTopics;

          if (topicsToExport.length === 0) return;

          const bcfData = await topics.export(topicsToExport);
          const bcfFile = new File([bcfData], "topics.bcf");

          const a = document.createElement("a");
          a.href = URL.createObjectURL(bcfFile);
          a.download = bcfFile.name;
          a.click();
          URL.revokeObjectURL(a.href);
        };

        return BUI.html`<bim-button style="flex: 0" @click=${onDownload} label="Download BCF" icon="material-symbols:download"></bim-button> `;
      });

      const bcfPanel = BUI.Component.create(() => {
        const onTextInput = (e: Event) => {
          const input = e.target as BUI.TextInput;
          topicsList.queryString = input.value;
        };

        return BUI.html`
          <bim-panel>
            <bim-panel-section label="BCF" fixed>
              <div style="display: flex; justify-content: space-between; gap: 0.5rem">
                <bim-text-input style="flex-grow: 0; flex-basis: 15rem" @input=${onTextInput} placeholder="Search a topic..." debounce="100"></bim-text-input>
                <div style="display: flex; gap: 0.5rem">
                  ${loadBtn}
                  ${showFormBtn} 
                  ${downloadBtn}
                </div> 
              </div> 
              ${topicsList}
            </bim-panel-section>
          </bim-panel>
        `;
      });
      //

      const elementDataPanel = elementData(
        components,
        soa,
        ifc.length,
        (data) => {
          setIsLoadedSelection(data);
        }
      );

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
            "rightTopicPanel viewport"
            "rightTopicPanel bcfPanel" 20rem
            /20rem 1fr 
          `,
          elements: {
            viewport,
            rightTopicPanel: topicPanel,
            bcfPanel,
          },
        },
      };

      app.layout = "main";
      // Append the app to the container
      containerRef.current?.appendChild(app);
      setIsLoading(false);
    }
  }, [soa, ifc]);

  useEffect(() => {
    if (isLoadedSelection === true) {
      setIsLoaded(true);
    }
  }, [isLoadedSelection]);

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

export default PrecheckBCF;
