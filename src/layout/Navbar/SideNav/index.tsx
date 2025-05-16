/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable prettier/prettier */
import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import HomeIcon from "@mui/icons-material/Home";
import ViewInArRoundedIcon from "@mui/icons-material/ViewInArRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import ImportExportRoundedIcon from "@mui/icons-material/ImportExportRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { ProjectModel } from "@model/ProjectModel";
import { PORT } from "@lib/db";

interface SideNavInput {
  projectId: string;
  userId: number;
  toggleSideNav: () => void;
  isOpen: boolean;
}

const SideNav: React.FC<SideNavInput> = ({
  projectId,
  userId,
  toggleSideNav,
  isOpen,
}) => {
  const [bigNestOpen, setBigNestOpen] = React.useState(true);

  const bigNestClick = () => {
    setBigNestOpen(!bigNestOpen);
  };

  const [nestOpen, setNestOpen] = React.useState(true);

  const nestClick = () => {
    setNestOpen(!nestOpen);
  };

  const DrawerList = (
    <List sx={{ width: "100%", minWidth: 290, padding: 0 }}>
      <Box height={80} />
      <Link to={`/${userId}/Projects`}>
        <ListItemButton>
          <ListItemIcon>
            <HomeIcon sx={{ scale: 1.2 }} />
          </ListItemIcon>
          <ListItemText primary={"Home"} />
        </ListItemButton>
      </Link>
      {/* <ListItemButton sx={{ pl: 3 }} onClick={bigNestClick}>
        <ListItemText primary={project?.Name} />
        {bigNestOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={bigNestOpen} timeout="auto" unmountOnExit>
        <Link to={`/Projects/${projectId}/ImportFile/new`}>
          <ListItemButton sx={{ pl: 4 }}>
            <ListItemIcon>
              <FileUploadRoundedIcon sx={{ scale: 1.2 }} />
            </ListItemIcon>
            <ListItemText primary="Import Files" />
          </ListItemButton>
        </Link>
        <Link to={`/Projects/${projectId}/ViewFile/`}>
          <ListItemButton sx={{ pl: 4 }}>
            <ListItemIcon>
              <ChecklistRoundedIcon sx={{ scale: 1.2 }} />
            </ListItemIcon>
            <ListItemText primary="Preview SoAs" />
          </ListItemButton>
        </Link>
        <Link to={`/Projects/${projectId}/ViewIFC/`}>
          <ListItemButton sx={{ pl: 4 }}>
            <ListItemIcon>
              <ViewInArRoundedIcon sx={{ scale: 1.2 }} />
            </ListItemIcon>
            <ListItemText primary={"View Results In IFC Viewer"} />
          </ListItemButton>
        </Link>
        <Link to={`/Projects/${projectId}/ViewBCF/`}>
          <ListItemButton sx={{ pl: 4 }}>
            <ListItemIcon>
              <LinkRoundedIcon sx={{ scale: 1.2 }} />
            </ListItemIcon>
            <ListItemText primary={"BCF Collaboration"} />
          </ListItemButton>
        </Link>
      </Collapse> */}
    </List>
  );

  return (
    <div>
      <Drawer open={isOpen} onClose={toggleSideNav}>
        {DrawerList}
      </Drawer>
    </div>
  );
};

export default SideNav;
