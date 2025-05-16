/* eslint-disable import/no-unresolved */
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import ProjectItem from "@layout/ProjectItem";
import TopNav from "@layout/Navbar/TopNav";
import ProjectSideNav from "@layout/Navbar/ProjectSideNav";
import { UserModel } from "@model/UserModel";
import { PORT } from "@lib/db";

const ProjectItemWrapper = () => {
  const [sideNav, setSideNav] = useState(false);
  const [search, setSearch] = useState("");

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const toggleSideNav = () => {
    setSideNav(!sideNav);
  };

  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserModel>({ id: 0, Name: "" });

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
    [search]
  );

  useEffect(() => {
    if (userId) {
      fetchUser(`http://localhost:${PORT}/api/user/${userId}`, setUser);
    }
  }, [userId]);

  document.title = "OpenBIMate: IFC SoA Checker";

  return (
    <>
      <TopNav
        user={user}
        projectId={""}
        toggleSideNav={toggleSideNav}
        onDataChange={(data) => {
          setSearch(data);
        }}
      />
      <ProjectSideNav
        isOpen={sideNav}
        toggleSideNav={toggleSideNav}
        forceUpdate={forceUpdate}
        ignored={ignored}
        userId={user.id}
      />
      <ProjectItem userId={user.id} ignored={ignored} search={search} />
    </>
  );
};

export default ProjectItemWrapper;
