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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box width="24%" display="flex">
      <Box flexGrow={1}>
        <TabPanel value={value} index={0}>
          <CompilerOptions/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <SymexecOptions />
        </TabPanel>
        <TabPanel value={value} index={2}>
          Item Three
      </TabPanel>
      </Box>
      <Box height="100%">
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ 
            borderLeft: 1, 
            borderColor: 'divider',
            height: "100%",
            '.MuiTabs-indicator': {
              left: 0,
            },
          }}
        >
          <Tab icon={<CodeIcon />} {...a11yProps(0)} />
          <Tab icon={<MemoryIcon />} {...a11yProps(1)} />
          <Tab icon={<ManageSearchIcon />} {...a11yProps(2)} />
        </Tabs>
      </Box>
      
  </Box>
  )
}

export default SettingsPane