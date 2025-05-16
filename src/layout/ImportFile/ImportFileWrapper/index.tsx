/* eslint-disable import/no-unresolved */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ImportFile from "@layout/ImportFile";
import TopNav from "@layout/Navbar/TopNav";
import SideNav from "@layout/Navbar/SideNav";
import { UserModel } from "@model/UserModel";
import { PORT } from "@lib/db";

const ImportFileWrapper = () => {
  const [sideNav, setSideNav] = useState(false);

  const { userId } = useParams<{ userId: string }>();
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedBackupID } = useParams<{ selectedBackupID: string }>();

  const [user, setUser] = useState<UserModel>({ id: 0, Name: "" });

  if (!userId) {
    return <div>Error: User ID not found </div>;
  }
  if (!projectId) {
    return <div>Error: Project ID not found </div>;
  }
  if (!selectedBackupID) {
    return <div>Error: Backup ID not found </div>;
  }

  document.title = "Input Data Page";

  const toggleSideNav = () => {
    setSideNav(!sideNav);
  };

  const fetchUser = useCallback(
    async (url: string, setUser: (user: UserModel) => void) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data: UserModel = await response.json();
        if (data) {
          const processedUser = {
            id: Number(data.id),
            Name: data.Name,
          };

          setUser(processedUser);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (userId) {
      fetchUser(`http://localhost:${PORT}/api/user/${userId}`, setUser);
    }
  }, [userId]);

  return (
    <>
      <TopNav
        user={user}
        projectId={projectId}
        toggleSideNav={toggleSideNav}
        onDataChange={() => {}}
      />
      <SideNav
        userId={user.id}
        projectId={projectId}
        isOpen={sideNav}
        toggleSideNav={toggleSideNav}
      />
      <ImportFile
        userId={user.id}
        projectId={projectId}
        selectedBackupID={selectedBackupID}
      />
      ;
    </>
  );
};

export default ImportFileWrapper;
