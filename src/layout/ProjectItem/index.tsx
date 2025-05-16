/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
import React, { useEffect, useCallback, useState } from "react";
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Navbar from "./navbar";
import { Link, useNavigate } from "react-router-dom";
import { ProjectModel } from "@model/ProjectModel";
import { ExcelModel } from "@model/ExcelModel";
import { SoAModel } from "@model/SoAModel";
import { IFCFileModel } from "@model/IFCFileModel";
import { BackUpModel } from "@model/BackUpModel";
import { PORT } from "@lib/db";
import axios from "axios";
import ModalJoy from "@mui/joy/Modal";
import ModalDialogJoy from "@mui/joy/ModalDialog";
import ModalCloseJoy from "@mui/joy/ModalClose";
import DialogTitleJoy from "@mui/joy/DialogTitle";
import DialogContentJoy from "@mui/joy/DialogContent";
import DialogActionsJoy from "@mui/joy/DialogActions";
import SheetJoy from "@mui/joy/Sheet";
import ButtonJoy from "@mui/joy/Button";
import TypographyJoy from "@mui/joy/Typography";
import StackJoy from "@mui/joy/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import DividerJoy from "@mui/joy/Divider";
import Stack from "@mui/material/Stack";
import Edit from "@mui/icons-material/Edit";
import Add from "@mui/icons-material/Add";
import Popup from "./Popup";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { Fab, AlertColor } from "@mui/material";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { FragmentIdMap, FragmentsGroup } from "@thatopen/fragments";
import { isBlank } from "../../util/isBlank";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open) => (open ? openedMixin(theme) : closedMixin(theme)),
}));

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

interface ProjectItemInput {
  userId: number;
  ignored: boolean;
  search: string;
}

interface CreateValue {
  id: string;
  Name: string;
}

interface StateSnackBar extends SnackbarOrigin {
  open: boolean;
  type: number;
  message: string;
}

const ProjectItem: React.FC<ProjectItemInput> = ({
  userId,
  ignored,
  search,
}) => {
  const [openModalEdit, setOpenModalEdit] = useState<number | null>(null);
  const [openModalAdd, setOpenModalAdd] = useState<boolean>(false);
  const [project, setProject] = useState<ProjectModel[]>([]);
  const [check, setCheck] = useState<ProjectModel[]>([]);
  const [backupData, setBackupData] = useState<{
    [projectId: string]: BackUpModel[];
  }>({});
  const [selectedBackup, setSelectedBackup] = useState<BackUpModel | null>(
    null
  );
  const [redirect, setRedirect] = useState(false);
  const [create, setCreate] = useState<CreateValue>({ id: "", Name: "" });
  const [comply, setComply] = useState<String>("Not Comply");
  const [isDelete, setIsDelete] = useState<Boolean>(false);
  const [openModalDelete, setOpenModalDelete] = useState<number | null>(null);
  const [stateSnackBar, setStateSnackBar] = React.useState<StateSnackBar>({
    open: false,
    message: "",
    type: 0,
    vertical: "top",
    horizontal: "center",
  });

  const navigate = useNavigate();

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

  const getBackUpDb = async (
    projectId: string
  ): Promise<BackUpModel[] | undefined> => {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/function/backup/get/${projectId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const obj = await response.json();
      const list: BackUpModel[] = [];

      if (Array.isArray(obj.backupFile)) {
        obj.backupFile.forEach((item: BackUpModel) => {
          if (
            typeof item.id === "string" &&
            typeof item.ImportDate === "string" &&
            typeof item.ProjectID === "string"
          ) {
            const bk: BackUpModel = {
              id: item.id,
              ImportDate: new Date(item.ImportDate),
              ProjectID: item.ProjectID,
            };
            list.push(bk);
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
              item.Name.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => b.CreateDate.getTime() - a.CreateDate.getTime());

          setProjects(filteredAndSortedProjects);

          const newBackupData: { [projectId: string]: BackUpModel[] } = {};
          for (const item of filteredAndSortedProjects) {
            const dataBackUp = await getBackUpDb(item.id);
            if (dataBackUp) {
              newBackupData[item.id] = dataBackUp;
            }
          }
          setBackupData(newBackupData);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    },
    [search]
  );

  const fetchChecks = useCallback(
    async (url: string, setChecks: (checks: ProjectModel[]) => void) => {
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
          const filteredAndSortedProjects = processedProjects
            .filter((item) =>
              item.Name.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => b.CreateDate.getTime() - a.CreateDate.getTime());

          setChecks(filteredAndSortedProjects);
        } else {
          setChecks([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    },
    [search]
  );

  useEffect(() => {
    if (userId !== 0 && isDelete === false) {
      fetchProjects(
        `http://localhost:${PORT}/api/projects/${userId}/active`,
        setProject
      );
      fetchChecks(
        `http://localhost:${PORT}/api/projects/${userId}/check`,
        setCheck
      );
    }
  }, [ignored, isDelete, search, userId]);

  useEffect(() => {
    if ((create.id !== "", create.Name !== "")) {
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        `Create project: ${create.Name} success!`,
        0
      )();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [create]);

  const isDeleteProject = async (projectId: string, projectName: string) => {
    try {
      setIsDelete(true);
      const response = await fetch(
        `http://localhost:${PORT}/api/projects/${userId}/isDelete/${projectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: true }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create excel");
      }

      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        `Finsh project: ${projectName} success!`,
        0
      )();

      return response.json();
    } catch (error) {
      console.error("Error creating excel:", error);
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        `Finsh project: ${projectName} failed!`,
        1
      )();
      return null;
    } finally {
      setIsDelete(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const updateComplyProject = async (
    projectId: string,
    projectName: string,
    complyValue: string
  ) => {
    try {
      setComply(complyValue);
      const response = await fetch(
        `http://localhost:${PORT}/api/projects/${userId}/comply/${projectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comply: complyValue }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create excel");
      }

      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        `Project: ${projectName} action ${complyValue} success!`,
        0
      )();

      return response.json();
    } catch (error) {
      console.error("Error creating excel:", error);
      handleSnackBarClick(
        { vertical: "top", horizontal: "center" },
        `Project: ${projectName} action ${complyValue} failed!`,
        1
      )();
      return null;
    } finally {
      setIsDelete(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleConfirmYes = (id: string, name: string) => {
    isDeleteProject(id, name);
  };

  const handleBackUpSelection = async (
    selectedBackupID: string,
    projectId: string
  ) => {
    try {
      if (isBlank(selectedBackupID)) {
        navigate(`/${userId}/Projects/${projectId}/ImportFile/clear`);
      } else {
        navigate(
          `/${userId}/Projects/${projectId}/ImportFile/${selectedBackupID}`
        );
      }
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  return (
    <Box sx={{ width: "100vw", height: "100vh" }}>
      <Box height={70} />
      <Box>
        <Box sx={{ display: "flex" }}>
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
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ width: "100%", display: "flex" }}>
              <Box width={50} />
              <Grid
                container
                direction="column"
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                }}
              >
                <div className="text-4xl font-bold text-red-700 ">
                  Create New Project
                </div>

                <Box height={10} />

                <React.Fragment>
                  <Fab
                    size="large"
                    color="error"
                    aria-label="add"
                    onClick={() => setOpenModalAdd(true)}
                  >
                    <Add fontSize="large" sx={{ color: "white" }} />
                  </Fab>
                  <ModalJoy
                    open={openModalAdd}
                    onClose={() => setOpenModalAdd(false)}
                  >
                    <ModalDialogJoy sx={{ width: 600 }}>
                      <ModalCloseJoy variant="plain" sx={{ m: 1 }} />
                      <DialogTitleJoy>Create new checking</DialogTitleJoy>
                      <DialogContentJoy>
                        <Popup
                          id=""
                          userId={userId}
                          onDataChange={(data) => {
                            setCreate(data);
                          }}
                        />
                      </DialogContentJoy>
                    </ModalDialogJoy>
                  </ModalJoy>
                </React.Fragment>

                <Box height={30} />

                <div className="text-4xl font-bold text-red-700 ">
                  My Projects
                </div>

                <Box height={20} />

                <Grid container rowSpacing={3} columnSpacing={3}>
                  {Array.from(project).map((item, index) => (
                    <Grid key={index} item xs={3}>
                      <Card
                        className="relative"
                        sx={{ maxWidth: 400, height: 300 }}
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <div className="flex relative h-12 w-full bg-red-700">
                          <Typography
                            gutterBottom
                            variant="h6"
                            component="div"
                            className="p-2.5 text-white"
                          >
                            {item.Name}
                          </Typography>
                          <div className="absolute top-0 right-0 mt-2 mr-1">
                            <React.Fragment>
                              <ButtonJoy
                                sx={{
                                  maxWidth: 40,
                                  maxHeight: 40,
                                  backgroundColor: "transparent",
                                  boxShadow: "none",
                                  color: "inherit",
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                                    boxShadow: "none",
                                  },
                                }}
                                color="primary"
                                onClick={() => setOpenModalEdit(index)}
                              >
                                <Edit sx={{ color: "white" }} />
                              </ButtonJoy>
                              <ButtonJoy
                                sx={{
                                  maxWidth: 40,
                                  maxHeight: 40,
                                  backgroundColor: "transparent",
                                  boxShadow: "none", // Remove any shadow effects
                                  color: "inherit", // Inherit color from the parent or icon itself
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.08)", // Keep it transparent on hover
                                    boxShadow: "none", // Ensure no shadow on hover
                                  },
                                }}
                                color="primary"
                                onClick={() => setOpenModalDelete(index)}
                              >
                                <DeleteIcon sx={{ color: "white" }} />
                              </ButtonJoy>

                              <ModalJoy
                                aria-labelledby="modal-title"
                                aria-describedby="modal-desc"
                                open={openModalEdit === index}
                                onClose={() => setOpenModalEdit(null)}
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <SheetJoy
                                  variant="outlined"
                                  sx={{
                                    width: 600,
                                    borderRadius: "md",
                                    p: 3,
                                    boxShadow: "lg",
                                  }}
                                >
                                  <ModalCloseJoy
                                    variant="plain"
                                    sx={{ m: 1 }}
                                    onClick={() => setOpenModalEdit(null)}
                                  />
                                  <DialogTitleJoy />
                                  <DialogContentJoy>
                                    <Popup
                                      id={item.id}
                                      userId={userId}
                                      onDataChange={() => {}}
                                    />
                                  </DialogContentJoy>
                                </SheetJoy>
                              </ModalJoy>

                              <ModalJoy
                                aria-labelledby="modal-title"
                                aria-describedby="modal-desc"
                                open={openModalDelete === index}
                                onClose={() => setOpenModalDelete(null)}
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <ModalDialogJoy
                                  variant="outlined"
                                  role="alertdialog"
                                >
                                  <DialogTitleJoy>
                                    <WarningRoundedIcon />
                                    Confirmation
                                  </DialogTitleJoy>
                                  <DividerJoy />
                                  <DialogContentJoy>
                                    Are you sure you want to delete {item.Name}?
                                  </DialogContentJoy>
                                  <DialogActionsJoy>
                                    <Stack direction="row" spacing={1}>
                                      <ButtonJoy
                                        onClick={() => setOpenModalDelete(null)}
                                        variant="plain"
                                        color="neutral"
                                      >
                                        No
                                      </ButtonJoy>
                                      <ButtonJoy
                                        onClick={() =>
                                          handleConfirmYes(item.id, item.Name)
                                        }
                                        variant="solid"
                                        color="danger"
                                        autoFocus
                                      >
                                        Yes
                                      </ButtonJoy>
                                    </Stack>
                                  </DialogActionsJoy>
                                </ModalDialogJoy>
                              </ModalJoy>
                            </React.Fragment>
                          </div>
                        </div>
                        <div className="flex-grow">
                          <CardContent sx={{ flexGrow: 1, height: "100%" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                WebkitLineClamp: 4,
                                textOverflow: "ellipsis",
                              }}
                              className="cursor-pointer"
                            >
                              {item.Description}
                            </Typography>
                          </CardContent>
                        </div>
                        <div className="absolute top-[7.5rem] left-1/2 transform -translate-x-1/2">
                          <Stack direction="column" spacing={0}>
                            <CardActions style={{ margin: 0 }}>
                              <Stack
                                direction="row"
                                spacing={0}
                                gap={2}
                                alignItems="center"
                                sx={{ flex: 1 }}
                              >
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  sx={{
                                    width: 360,
                                    height: 55,
                                  }}
                                  onClick={() => {
                                    handleBackUpSelection("", item.id);
                                  }}
                                >
                                  New Check
                                </Button>
                              </Stack>
                            </CardActions>
                            {check.some(
                              (checkItem) => checkItem.id === item.id
                            ) ? (
                              <CardActions style={{ margin: 0 }}>
                                <Stack
                                  direction="row"
                                  spacing={0}
                                  gap={2}
                                  alignItems="center"
                                  sx={{ flex: 1 }}
                                >
                                  {backupData[item.id] &&
                                    backupData[item.id].length > 0 && (
                                      <Autocomplete
                                        disablePortal={false}
                                        options={backupData[item.id] || []}
                                        getOptionLabel={(
                                          option: BackUpModel
                                        ) =>
                                          option?.ImportDate
                                            ? format(
                                                new Date(option.ImportDate),
                                                "yyyy-MM-dd:HH:mm"
                                              )
                                            : ""
                                        }
                                        defaultValue={
                                          backupData[item.id]?.[0] ?? null
                                        }
                                        onChange={(
                                          event,
                                          newValue: BackUpModel | null
                                        ) => {
                                          setSelectedBackup(newValue);
                                        }}
                                        sx={{ width: "50%" }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="Backup"
                                            fullWidth
                                          />
                                        )}
                                      />
                                    )}
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    sx={{
                                      width: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      height: 55,
                                    }}
                                    onClick={() => {
                                      if (selectedBackup?.id) {
                                        handleBackUpSelection(
                                          selectedBackup.id,
                                          item.id
                                        );
                                      } else {
                                        handleBackUpSelection("new", item.id);
                                      }
                                    }}
                                  >
                                    Load Previous Check
                                  </Button>
                                </Stack>
                              </CardActions>
                            ) : (
                              <div></div>
                            )}
                          </Stack>
                        </div>
                        <div className="absolute bottom-0 left-0 m-2">
                          <div className="font-bold text-red-500 text-xs">
                            Created: {formatDate(item.CreateDate ?? new Date())}
                          </div>
                        </div>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectItem;
