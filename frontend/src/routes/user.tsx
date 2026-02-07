


import { Try } from '@mui/icons-material';
import { Box, Fab, Popover, Typography } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react';
import SupportChatModal from '../components/index/user/SupportChatModal';


const fabStyle = {
  position: 'fixed',
  bottom: 16,
  right: 16,
};


const RouteComponent = (props)=>{
    // const [open,setOpen]= useState(true)
    const button = useRef(null)
    const [anchorEl,setAnchorEl] = useState(null)
    const open = !!anchorEl
    const [show,setShow]= useState(false)
    
    useEffect(()=>{
        setTimeout(()=>{
            setAnchorEl(button.current)
            setTimeout(()=>{
              setAnchorEl(null)

            },5000)

        },10000)


    },[])


    const hidePopover = ()=>{
        
        setTimeout(()=>{
            setAnchorEl(null)
        },1000)
    }

    return <>
        <Outlet />

        <SupportChatModal open={show} onClose={()=>setShow(false)}/>
        <Fab sx={fabStyle } color='primary' size='75px' ref={button} onClick={()=>setShow(true)}>
            <Try  />
        </Fab>

        <Popover
        open={open}
        anchorEl={anchorEl}
        // onClose={handleClose}
        onMouseOver={hidePopover}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              marginRight: '20px', // Gap between FAB and Popover
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              borderRadius: '12px',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: "50%", // Position at the bottom
                right: -12,
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                transform: 'translate(-50%, 50%) rotate(45deg)', // Move down and rotate
                zIndex: 0,
              },
            },
          },
        }}
      >
        <Box sx={{p:2}}>
            <Typography>Do you have any questions? Ask me </Typography>
        </Box>    
    </Popover>

    </>
}



export const Route = createFileRoute('/user')({
  component: RouteComponent,
})