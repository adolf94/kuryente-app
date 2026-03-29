


import { Assistant } from '@mui/icons-material';
import { Box, Fab, Popover, Typography, useMediaQuery, useTheme } from '@mui/material'
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react';
import SupportChatModal from '../components/index/user/SupportChatModal';
import { createContext } from 'react';

export const ChatContext = createContext<{ setShowChat: (show: boolean) => void }>({ setShowChat: () => {} });


const fabStyle = {
  position: 'fixed',
  bottom: { xs: 16, md: 32 },
  right: { xs: 16, md: 32 },
};


const RouteComponent = ()=>{
    // const [open,setOpen]= useState(true)
    const button = useRef(null)
    const [anchorEl,setAnchorEl] = useState(null)
    const open = !!anchorEl
    const [show,setShow]= useState(false)
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isIndexPage = location.pathname === '/user' || location.pathname === '/user/'
    const fabVisible = !isMobile || !isIndexPage
    
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

    return <ChatContext.Provider value={{ setShowChat: setShow }}>
        <Outlet />
        <SupportChatModal open={show} onClose={()=>setShow(false)}/>
        {fabVisible && (
            <Fab 
                sx={{ 
                    ...fabStyle, 
                    width: { xs: 56, md: 72 }, 
                    height: { xs: 56, md: 72 },
                    '& .MuiSvgIcon-root': {
                        fontSize: { xs: '1.5rem', md: '2rem' }
                    }
                }} 
                color='primary' 
                ref={button} 
                onClick={()=>setShow(true)}
            >
                <Assistant />
            </Fab>
        )}

        <Popover
        open={open}
        anchorEl={anchorEl}
        disableRestoreFocus
        disableEnforceFocus
        hideBackdrop
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
          root: {
            sx: { pointerEvents: 'none' }
          },
          paper: {
            sx: {
              pointerEvents: 'auto',
              marginRight: '20px', // Gap between FAB and Popover
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: "50%", // Position at the bottom
                right: -6,
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                transform: 'translate(0, 50%) rotate(45deg)', // Move down and rotate
                zIndex: 0,
                borderRight: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        <Box sx={{p: 2, maxWidth: 220}}>
            <Typography variant="body2" fontWeight="600" color="text.primary">
                Need help with your bill?
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Ask our AI assistant for help.
            </Typography>
        </Box>    
    </Popover>
    </ChatContext.Provider>
}



export const Route = createFileRoute('/user')({
  component: RouteComponent,
})