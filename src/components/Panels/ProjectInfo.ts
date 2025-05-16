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

export default (components: OBC.Components, userId: number, projectId: string,) => {
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

  return BUI.Component.create<BUI.Panel>(() => {

    return BUI.html`
      <bim-panel style="display: flex; flex-direction: column; position: relative; height: 100%;">
       <div style="flex: 1 1 auto;">
          <bim-panel-section label="Loaded Models" icon="mage:box-3d-fill">
            ${modelsList}
          </bim-panel-section>
        </div>
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
