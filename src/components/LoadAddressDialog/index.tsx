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
import { isAddress } from '../../utils'

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

interface LoadAddressDialogInterface {
  open: boolean
  onClose: () => void
  onLoad: (address: string) => void
}

function LoadAddressDialog(props: LoadAddressDialogInterface) {

  const {open, onClose,onLoad} = props

  const [currentAddress, setCurrentAddress] = useState("")
  const [error, setError] = useState(false)

  const handleClose = () => {
    onClose()
  }

  const handleLoad = () => {
    if (isAddress(currentAddress)) {
      onLoad(currentAddress)
      onClose()
    } else {
      setError(true)
    }
  }

  const handleEdit = (event: any) => {
    setError(false)
    setCurrentAddress(event.target.value)
  }

  useEffect(() => {
    if (open) {
      setCurrentAddress("")
      setError(false)
    }
  }, [open])
  

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <BootstrapDialogTitle id="edit-tab-dialog-title" onClose={handleClose}>
        Load from address
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <TextField 
          error={error}
          id="address-outlined-basic" 
          label="Ethereum address"
          value={currentAddress}
          variant="outlined" 
          helperText={error ? "Invalid address" : undefined}
          InputLabelProps={{
            shrink: true,
          }} 
          onChange={handleEdit}
          fullWidth/>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleLoad}>
          Load
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LoadAddressDialog