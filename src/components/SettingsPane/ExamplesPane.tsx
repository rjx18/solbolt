import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OrderingStorageVariables from './examples/OrderingStorageVariables'
import { useExampleContentManager } from '../../contexts/Application'
import StorageLoopMutations from './examples/StorageLoopMutations'
import RecursionVsFor from './examples/RecursionVsFor'
import PublicVsInternal from './examples/PublicVsInternal'

const EXAMPLE_TITLES = [
  "Ordering of storage variables",
  "Storage mutations in loop",
  "Recursion vs For loops",
  "Public vs Internal functions"
]

const EXAMPLE_COMPONENTS= [
  <OrderingStorageVariables />,
  <StorageLoopMutations />,
  <RecursionVsFor />,
  <PublicVsInternal />
]

interface ContentListProps {
  handleClick: (example: number) => void
}

const ContentList = ({handleClick}: ContentListProps) => {

  return <Box>
    <Typography variant="button" sx={{fontSize: "12pt"}}>Examples</Typography>
    <Box py={3}>
      <Grid container spacing={1}>
        {EXAMPLE_TITLES.map((title, index) => {
          return <Grid item xs={12}>
            <Button variant="outlined" color="primary" fullWidth onClick={() => handleClick(index)} style={{textTransform: "none"}}>
              {title}
            </Button>
          </Grid>
        })}
      </Grid>
    </Box>
  </Box>
}

interface ContentPaneProps {
  title: string
  content: any
  handleBack: () => void
}

const ContentPane = ({title, content, handleBack}: ContentPaneProps) => {
  return <Box>
    <Box pb={2}>
      <IconButton aria-label="back" onClick={handleBack}>
        <ArrowBackIcon />
      </IconButton>
    </Box>
    <Typography variant="button" sx={{fontSize: "12pt"}}>{title}</Typography>
    <Box pt={3}>
      {content}
    </Box>
  </Box>
}

function ExamplesPane() {
  // const [exampleLoaded, setExampleLoaded] = useState(-1)

  const [exampleContentOpen, updateExampleContentOpen] = useExampleContentManager()

  const handleExampleClick = (example: number) => {
    updateExampleContentOpen(example)
  }

  const handleExampleBack = () => {
    updateExampleContentOpen(-1)
  }

  return (
    <Box>
      {exampleContentOpen === -1 ? <ContentList handleClick={handleExampleClick} /> : <ContentPane content={EXAMPLE_COMPONENTS[exampleContentOpen]} title={EXAMPLE_TITLES[exampleContentOpen]} handleBack={handleExampleBack} />}
    </Box>
  )
}

export default ExamplesPane