import React, { useState, useEffect } from 'react'
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import { red } from '@mui/material/colors';

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

const BootstrapDialogTitle = (props: DialogTitleProps) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

interface TabDialogInterface {
  name?: string
  open: boolean
  onClose: () => void
  onSave: (fileName: string) => void
  onDelete?: () => void
}

function TabDialog(props: TabDialogInterface) {

  const {name, open, onClose, onSave, onDelete} = props

  const [currentName, setCurrentName] = useState(name ? name : "")

  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    onSave(currentName)
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
    onClose()
  }

  const handleEdit = (event: any) => {
    setCurrentName(event.target.value)
  }

  useEffect(() => {
    if (open && name != null) {
      setCurrentName(name)
    }
  }, [open])
  

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <BootstrapDialogTitle id="edit-tab-dialog-title" onClose={handleClose}>
        Edit file
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <TextField 
          id="outlined-basic" 
          label="File name"
          value={currentName}
          variant="outlined" 
          InputLabelProps={{
            shrink: true,
          }} 
          onChange={handleEdit}
          fullWidth/>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleSave}>
          Save
        </Button>
        <Button disabled={onDelete == null} onClick={handleDelete} color="warning">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TabDialog