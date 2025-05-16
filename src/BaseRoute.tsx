/* eslint-disable import/no-unresolved */
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import ProjectItemWrapper from "@layout/ProjectItem/ProjectItemWrapper";
import ViewFileWrapper from "@layout/ViewFile/ViewFileWrapper";
import ImportFileWrapper from "@layout/ImportFile/ImportFileWrapper";
import PrecheckModel from "@layout/PrecheckModel/PrecheckModelWrapper";
import PrecheckIFC from "@layout/PrecheckIFC/PrecheckIFCWrapper";
import PrecheckBCF from "@layout/PrecheckBCF/PrecheckBCFWrapper";

const BaseRoute = () => {
  return (
    <Routes>
      <Route path="/:userId/Projects" element={<ProjectItemWrapper />} />
      <Route
        path="/:userId/Projects/:projectId/ImportFile/:selectedBackupID"
        element={<ImportFileWrapper />}
      />
      <Route
        path="/:userId/Projects/:projectId/ViewFile"
        element={<ViewFileWrapper />}
      />

      <Route
        path="/:userId/Projects/:projectId/ViewModel"
        element={<PrecheckModel />}
      />
      <Route
        path="/:userId/Projects/:projectId/ViewIFC"
        element={<PrecheckIFC />}
      />
      <Route
        path="/:userId/Projects/:projectId/ViewBCF"
        element={<PrecheckBCF />}
      />
    </Routes>
  );
};

export default BaseRoute;
