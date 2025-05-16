import React, { useState } from "react";
import {
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";

const Notification: React.FC = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleConfirmYes = () => {
    setOpenDialog(false);
    setOpenSnackbar(true);
  };

  return (
    <div>
      {/* Nút mở hộp thoại xác nhận */}
      <Button variant="contained" color="primary" onClick={handleOpenDialog}>
        Show Notification
      </Button>

      {/* Hộp thoại xác nhận */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">
            No
          </Button>
          <Button onClick={handleConfirmYes} color="primary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar hiển thị khi chọn "Yes" */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      ></Snackbar>
    </div>
  );
};

export default Notification;
