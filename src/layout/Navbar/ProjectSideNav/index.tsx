/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable prettier/prettier */
import React, { useEffect, useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import Collapse from "@mui/material/Collapse";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { ProjectModel } from "@model/ProjectModel";
import { PORT } from "@lib/db";
import { Button, Fab, Stack, AlertColor } from "@mui/material";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

interface ProjectSideNavInput {
  toggleSideNav: () => void;
  forceUpdate: () => void;
  isOpen: boolean;
  ignored: any;
  userId: number;
}

interface StateSnackBar extends SnackbarOrigin {
  open: boolean;
  type: number;
  message: string;
}

const ProjectSideNav: React.FC<ProjectSideNavInput> = ({
  toggleSideNav,
  isOpen,
  forceUpdate,
  ignored,
  userId,
}) => {
  const [value, setValue] = useState<string>("");
  const [activeProject, setActiveProject] = useState<ProjectModel[]>([]);
  const [finishProject, setFinishProject] = useState<ProjectModel[]>([]);
  const [nestFinishOpen, setNestFinishOpen] = useState(false);
  const [nestOpen, setNestOpen] = useState(true);
  const [stateSnackBar, setStateSnackBar] = React.useState<StateSnackBar>({
    open: false,
    message: "",
    type: 0,
    vertical: "top",
    horizontal: "center",
  });

  const { vertical, horizontal, open, message, type } = stateSnackBar;

  const getSeverity = (type: number): AlertColor => {
    switch (type) {
      case 0:
        return "success";
      case 1:
        return "error";
      case 2:
        return "warning";
      default:
        return "info";
    }
  };

  const handleSnackBarClick =
    (newState: SnackbarOrigin, status: string, typeInput: number) => () => {
      setStateSnackBar({
        ...newState,
        open: true,
        message: status,
        type: typeInput,
      });
    };

  const handleSnackBarClose = () => {
    setStateSnackBar({ ...stateSnackBar, open: false });
  };

  const nestFinishClick = () => {
    setNestFinishOpen(!nestFinishOpen);
  };

  const nestClick = () => {
    setNestOpen(!nestOpen);
  };

  const fetchProjects = useCallback(
    async (url: string, setProjects: (projects: ProjectModel[]) => void) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data: ProjectModel[] = await response.json();
        if (data.length > 0) {
          const processedProjects = data.map((item) => ({
            id: String(item.id),
            Name: item.Name,
            Description: item.Description,
            CreateDate: new Date(item.CreateDate),
            ModifyDate: new Date(item.ModifyDate),
            isDelete: item.isDelete,
            Status: item.Status,
          }));

          // Áp dụng bộ lọc và sắp xếp
          const filteredAndSortedProjects = processedProjects
            .filter((item) =>
              item.Name.toLowerCase().includes(value.toLowerCase())
            )
            .sort((a, b) => a.Name.localeCompare(b.Name));

          setProjects(filteredAndSortedProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    },
    [value]
  );

  useEffect(() => {
    if (userId !== 0) {
      fetchProjects(
        `http://localhost:${PORT}/api/projects/${userId}/active`,
        setActiveProject
      );
      fetchProjects(
        `http://localhost:${PORT}/api/projects/${userId}/finish`,
        setFinishProject
      );
    }
  }, [ignored, value, userId]);

  const changeProject = async (
    projectId: string,
    projectName: string,
    isDelete: boolean
  ) => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/projects/${userId}/isDelete/${projectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: isDelete }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create excel");
      }
      forceUpdate();
      return response.json();
    } catch (error) {
      console.error("Error creating excel:", error);
      return null;
    } finally {
      if (isDelete === true) {
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          `Finsh project: ${projectName} success!`,
          0
        )();
      } else {
        handleSnackBarClick(
          { vertical: "top", horizontal: "center" },
          `Activite project: ${projectName} success!`,
          0
        )();
      }
    }
  };

  const DrawerList = (
    <List sx={{ width: "100%", minWidth: 290, padding: 0 }}>
      <Box height={80} />
      <div className="w-full h-auto mx-4">
        <input
          type="search"
          id="default-search"
          className="block p-3 ps-10 text-sm text-center text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search...."
          onChange={(e) => setValue(e.currentTarget.value)}
        />
      </div>
      <ListItemButton onClick={nestClick}>
        <div className="text-green-600 font-bold mr-auto">
          On Working Projects
        </div>
        {nestOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={nestOpen} timeout="auto" unmountOnExit>
        {activeProject.map((item) => (
          <Stack direction="row" key={item.id}>
            <ListItemButton
              sx={{
                pl: 3,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)", // Keep it transparent on hover
                },
              }}
            >
              <Link to={`/Projects/${item.id}/ImportFile/`}>
                <ListItemText primary={item.Name} />
              </Link>
            </ListItemButton>
            <Button
              sx={{
                maxWidth: 40,
                backgroundColor: "transparent", // Make the background transparent
                boxShadow: "none", // Remove any shadow effects
                color: "inherit", // Inherit color from the parent or icon itself
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)", // Keep it transparent on hover
                  boxShadow: "none", // Ensure no shadow on hover
                },
              }}
              variant="contained"
              onClick={() => changeProject(item.id, item.Name, !item.isDelete)}
            >
              <DeleteIcon sx={{ color: "inherit" }} />
            </Button>
          </Stack>
        ))}
      </Collapse>
      <ListItemButton onClick={nestFinishClick}>
        <div className="text-red-600 font-bold mr-auto">Finish Projects</div>
        {nestFinishOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={nestFinishOpen} timeout="auto" unmountOnExit>
        {finishProject.map((item) => (
          <Stack direction="row" key={item.id}>
            <ListItemButton
              sx={{
                pl: 3,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)", // Keep it transparent on hover
                },
              }}
            >
              <Link to={`/Projects/${item.id}/ImportFile/`}>
                <ListItemText primary={item.Name} />
              </Link>
            </ListItemButton>
            <Button
              sx={{
                maxWidth: 40,
                backgroundColor: "transparent", // Make the background transparent
                boxShadow: "none", // Remove any shadow effects
                color: "inherit", // Inherit color from the parent or icon itself
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)", // Keep it transparent on hover
                  boxShadow: "none", // Ensure no shadow on hover
                },
              }}
              variant="contained"
              color="primary"
              onClick={() => changeProject(item.id, item.Name, !item.isDelete)}
            >
              <ReplyRoundedIcon />
            </Button>
          </Stack>
        ))}
      </Collapse>
    </List>
  );

  return (
    <div>
      <Drawer open={isOpen} onClose={toggleSideNav}>
        {DrawerList}
      </Drawer>
      <Snackbar
        open={open}
        key={message + type}
        anchorOrigin={{ vertical, horizontal }}
        autoHideDuration={2000}
        onClose={handleSnackBarClose}
      >
        <Alert
          onClose={handleSnackBarClose}
          severity={getSeverity(type)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProjectSideNav;
