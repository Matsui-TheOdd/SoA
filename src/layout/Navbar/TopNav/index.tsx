/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable prettier/prettier */
import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { alpha, styled } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import InputBase from "@mui/material/InputBase";
import { ProjectModel } from "@model/ProjectModel";
import { UserModel } from "@model/UserModel";
import { PORT } from "@lib/db";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import Header from "../../../../dist/assets/Header.jpg";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

interface TopNavInput {
  user: UserModel;
  projectId: string;
  toggleSideNav: () => void;
  onDataChange: (data: string) => void;
}

// Styled AppBar component
const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const TopNav: React.FC<TopNavInput> = ({
  user,
  projectId,
  toggleSideNav,
  onDataChange,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  useEffect(() => {
    onDataChange(searchValue);
  }, [searchValue]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar
        position="fixed"
        sx={{ backgroundColor: "#fff", color: "#000" }}
      >
        <Toolbar sx={{ backgroundColor: "#fff", color: "#000" }}>
          <IconButton
            size="large"
            edge="start"
            color="error"
            aria-label="menu"
            sx={{ mr: 2, fontSize: "40px" }}
            onClick={toggleSideNav}
          >
            <MenuIcon sx={{ fontSize: "40px" }} />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <img
              src={Header}
              alt="Dashboard"
              style={{
                height: "65px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              marginLeft: "auto",
            }}
          >
            <PersonIcon sx={{ fontSize: "30px" }} />
            <Typography
              variant="body2"
              sx={{ color: "gray", fontSize: "16px" }}
            >
              {user.Name}
            </Typography>
          </Box>
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default TopNav;
