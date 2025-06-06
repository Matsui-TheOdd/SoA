/* eslint-disable no-alert */
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as FRAGS from "@thatopen/fragments";
import Zip from "jszip";

const input = document.createElement("input");
const askForFile = (extension: string) => {
  return new Promise<File | null>((resolve) => {
    input.type = "file";
    input.accept = extension;
    input.multiple = false;
    input.onchange = () => {
      const filesList = input.files;
      if (!(filesList && filesList[0])) {
        resolve(null);
        return;
      }
      const file = filesList[0];
      resolve(file);
    };
    input.click();
  });
};

export default (components: OBC.Components) => {
  const [loadBtn] = CUI.buttons.loadIfc({ components });
  loadBtn.label = "IFC";
  loadBtn.tooltipTitle = "Load IFC";
  loadBtn.tooltipText =
    "Loads an IFC file into the scene. The IFC gets automatically converted to Fragments.";

  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);

  const loadFragments = async () => {
    const fragmentsZip = await askForFile(".zip");
    if (!fragmentsZip) return;
    const zipBuffer = await fragmentsZip.arrayBuffer();
    const zip = new Zip();
    await zip.loadAsync(zipBuffer);
    const geometryBuffer = zip.file("geometry.frag");
    if (!geometryBuffer) {
      alert("No geometry found in the file!");
      return;
    }

    const geometry = await geometryBuffer.async("uint8array");

    let properties: FRAGS.IfcProperties | undefined;
    const propsFile = zip.file("properties.json");
    if (propsFile) {
      const json = await propsFile.async("string");
      properties = JSON.parse(json);
    }

    let relationsMap: OBC.RelationsMap | undefined;
    const relationsMapFile = zip.file("relations-map.json");
    if (relationsMapFile) {
      const json = await relationsMapFile.async("string");
      relationsMap = indexer.getRelationsMapFromJSON(json);
    }

    fragments.load(geometry, { properties, relationsMap });
  };

  return BUI.Component.create<BUI.PanelSection>(() => {
    return BUI.html`
      <bim-toolbar-section label="Import" icon="solar:import-bold">
        ${loadBtn}
        <bim-button @click=${loadFragments} label="Fragments" icon="fluent:puzzle-cube-piece-20-filled" tooltip-title="Load Fragments"
          tooltip-text="Loads a pre-converted IFC from a Fragments file. Use this option if you want to avoid the conversion from IFC to Fragments."></bim-button>
      </bim-toolbar-section>
    `;
  });
};
