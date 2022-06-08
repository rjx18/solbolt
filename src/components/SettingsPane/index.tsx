import React, { useState } from 'react'

import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import CodeIcon from '@mui/icons-material/Code';
import MemoryIcon from '@mui/icons-material/Memory';
import InfoIcon from '@mui/icons-material/Info';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import CompilerOptions from './CompilerOptions';
import SymexecOptions from './SymexecOptions';
import { useSettingsTabOpenManager } from '../../contexts/Application';
import Inspector from './Inspector';
import IconButton from '@mui/material/IconButton'
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import FeedIcon from '@mui/icons-material/Feed';
import ExamplesPane from './ExamplesPane';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

function SettingsPane() {

  const [settingsTabOpen, setSettingsTabOpen] = useSettingsTabOpenManager()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSettingsTabOpen(newValue);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
  }


  return (
    <Box width="24%" display="flex" height="100%">
      <Box flexGrow={1} height="100%" sx={{overflow: 'auto'}}>
        <TabPanel value={settingsTabOpen} index={0}>
          <CompilerOptions/>
        </TabPanel>
        <TabPanel value={settingsTabOpen} index={1}>
          <SymexecOptions />
        </TabPanel>
        <TabPanel value={settingsTabOpen} index={2}>
          <Inspector />
        </TabPanel>
        <TabPanel value={settingsTabOpen} index={3}>
          <ExamplesPane />
        </TabPanel>
      </Box>
      <Box height="100%">
        <Tabs
          orientation="vertical"
          value={settingsTabOpen}
          onChange={handleChange}
          aria-label="Solbolt tab menu"
          sx={{ 
            borderLeft: 1, 
            borderColor: 'divider',
            height: "100%",
            '.MuiTabs-indicator': {
              left: 0,
            },
            '.MuiTabs-flexContainerVertical' : {
              height: "100%"
            },
          }}
        >
          <Tab label="Compiler Options" icon={<CodeIcon />} {...a11yProps(0)} style={{fontSize: "8pt", width: 0, fontWeight: 700}} />
          <Tab label="Symexec Options" icon={<MemoryIcon />} {...a11yProps(1)} style={{fontSize: "8pt", width: 0, fontWeight: 700}} />
          <Tab label="Gas Inspector" icon={<ManageSearchIcon />} {...a11yProps(2)} style={{fontSize: "8pt", width: 0, fontWeight: 700}} />
          <Tab label="Examples" icon={<FeedIcon />} {...a11yProps(3)} style={{fontSize: "8pt", width: 0, fontWeight: 700}} />
          <IconButton sx={{marginTop: "auto", width: 50, height: 50, alignSelf: "center", marginBottom: 1}} onClick={handleDialogOpen}>
            <InfoIcon />
          </IconButton>
        </Tabs>
      </Box>
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <BootstrapDialogTitle id="info-tab-dialog-title" onClose={handleDialogClose}>
          About Solbolt
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Solbolt is a Solidity bytecode explorer and gas analysis tool 
            inspired by the popular compiler explorer Godbolt, originally 
            made for the GCC compiler. 
          </Typography>
          <Typography variant="body2" sx={{mt: 3}}>
            The tool uses the Solidity compiler for compilation, as well as a extended version
            of the open source Mythril symbolic execution engine for gas analysis. It 
            only stores your Solidity source code on your local machine, and no code is stored
            on the backend server.
          </Typography>
          <Typography variant="body2" sx={{mt: 3}}>
            We do not guarantee the correctness of the gas analysis results, and therefore by using this
            tool, you waive any liabilities that derive from the use of the results generated by 
            this tool, including but not restricted to any gas related bugs, or incorrect bytecode.
          </Typography>
          <Typography variant="body2" sx={{mt: 3}}>
            This tool is built entirely by Richard Xiong, as a 4th year Masters project at 
            Imperial College London. For any enquiries, please contact <a href="mailto:rjx18@ic.ac.uk">rjx18@ic.ac.uk</a>.
          </Typography>
        </DialogContent>
        {/* <DialogActions>
          <Button autoFocus onClick={handleSave}>
            Save
          </Button>
          <Button disabled={onDelete == null} onClick={handleDelete} color="warning">
            Delete
          </Button>
        </DialogActions> */}
      </Dialog>
  </Box>
  )
}

export default SettingsPane