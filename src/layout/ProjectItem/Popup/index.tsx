/* eslint-disable import/no-unresolved */
import React, { useEffect, useRef, useState } from "react";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FormikHelpers,
  FormikProps,
} from "formik";
import * as yup from "yup";
import { ProjectModel } from "@model/ProjectModel";
import { PORT } from "@lib/db";
import { useNavigate } from "react-router-dom";
import { Button, Fab, Stack, AlertColor } from "@mui/material";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { isBlank } from "../../../util/isBlank";

interface ProjectNameDes {
  id: string;
  Name: string;
  Description: string;
}
interface CreateValue {
  id: string;
  Name: string;
}

interface PopupProps {
  id: string;
  userId: number;
  onDataChange: (data: CreateValue) => void;
}

interface StateSnackBar extends SnackbarOrigin {
  open: boolean;
  type: number;
  message: string;
}

const Popup: React.FC<PopupProps> = ({ id, userId, onDataChange }) => {
  const [project, setProject] = useState<ProjectModel>();
  const [create, setCreate] = useState<CreateValue>({ id: "", Name: "" });
  const navigate = useNavigate();
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

  const formRef = useRef<FormikProps<ProjectNameDes>>();

  const submit = async (values: ProjectNameDes) => {
    if (values.id === "") {
      values.id = crypto.randomUUID();
      const newProject: ProjectModel = {
        id: values.id,
        Name: values.Name,
        Description: values.Description,
        CreateDate: new Date(),
        ModifyDate: new Date(),
        isDelete: false,
        Status: "",
      };
      try {
        const response = await fetch(
          `http://localhost:${PORT}/api/projects/${userId}/create-project`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newProject),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to create excel");
        }

        setCreate({ id: values.id, Name: values.Name });
        return response.json();
      } catch (error) {
        console.error("Error creating excel:", error);
        return null;
      }
    } else {
      if (project) {
        const updateProject: ProjectModel = {
          id: values.id,
          Name: values.Name,
          Description: values.Description,
          CreateDate: project?.CreateDate,
          ModifyDate: project?.ModifyDate,
          isDelete: false,
          Status: project?.Status,
        };

        try {
          const response = await fetch(
            `http://localhost:${PORT}/api/projects/${userId}/update-project/${updateProject.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateProject),
            }
          );
          if (!response.ok) {
            throw new Error("Failed to create excel");
          }

          handleSnackBarClick(
            { vertical: "top", horizontal: "center" },
            `Edit project: ${values.Name} success!`,
            0
          )();
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return response.json();
        } catch (error) {
          console.error("Error creating excel:", error);
          handleSnackBarClick(
            { vertical: "top", horizontal: "center" },
            `Edit project: ${values.Name} failed!`,
            1
          )();
          return null;
        }
      }
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await fetch(
            `http://localhost:${PORT}/api/projects/${userId}/${id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok)
            throw new Error(
              `Network response was not ok: ${response.statusText}`
            );
          const obj = await response.json();
          if (obj) {
            const ex: ProjectModel = {
              id: obj.id,
              Name: obj.Name,
              Description: obj.Description,
              CreateDate: new Date(obj.CreateDate),
              ModifyDate: new Date(obj.ModifyDate),
              isDelete: obj.isDelete,
              Status: obj.Status,
            };
            setProject(ex);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
    console.log(project);
  }, [id]);

  useEffect(() => {
    if (project) {
      formRef.current?.setValues({
        ...formRef.current.values,
        id: project?.id,
        Name: project?.Name,
        Description: project?.Description,
      });
    }
  }, [project]);

  useEffect(() => {
    if ((create.id !== "", create.Name !== "" && userId !== 0)) {
      onDataChange(create);
      navigate(`/${userId}/Projects/${create.id}/ImportFile/new`);
    }
  }, [create]);

  const schema = yup.object().shape({
    Name: yup.string().label("Name").required(),
  });

  return (
    <div>
      <Formik
        innerRef={(instance) => (formRef.current = instance!)}
        initialValues={{
          id: project?.id || "",
          Name: project?.Name || "",
          Description: project?.Description || "",
        }}
        validationSchema={schema}
        onSubmit={submit}
      >
        {({
          values,
          touched,
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Stack>
              <p className="text-1xl font-bold">InForm No.</p>
              <div className="mt-2 mb-4">
                <input
                  id="Name"
                  name="Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.Name}
                  type="text"
                  autoComplete="given-name"
                  className="px-[0.4rem] py-[0.4rem] flex items-center border rounded-md border-gray-300 outline-none focus:border-[#052abc] w-full"
                />
                {touched.Name && !isBlank(errors.Name) && (
                  <div className="text-red-500">{errors.Name}</div>
                )}
              </div>
              <p className="text-1xl font-bold">Project Title / Description</p>
              <div className="mt-2">
                <textarea
                  id="Description"
                  name="Description"
                  onChange={handleChange}
                  value={values.Description}
                  rows={3}
                  className="px-[0.4rem] py-[0.4rem] flex items-center border rounded-md border-gray-300 outline-none focus:border-[#052abc] h-[12rem] w-full"
                />
              </div>
            </Stack>
            <div className="mt-6 flex items-center justify-end gap-x-2">
              <button
                type="submit"
                className="rounded-md border bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {id === "" ? "Create" : "Save"}
              </button>
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
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Popup;
