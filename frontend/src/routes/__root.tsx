

import { Box } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Outlet, createRootRoute, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ConfirmProvider } from 'material-ui-confirm';
import React, { useEffect } from 'react'
import { type UserInfo, AuthContext} from '../components/GoogleLoginWrapper';
import Loader from '../components/Loader';
import Header from '../components/Header';


const RootComponent = ()=>{
    

    return <>
        <ConfirmProvider>
            <Loader>
                <GoogleOAuthProvider clientId={(window as any).webConfig.clientId}>
                        <Box sx={{width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column"}}>
                            <Header />
                            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                                <Outlet />
                            </Box>
                        </Box>
                </GoogleOAuthProvider>
            </Loader>
        </ConfirmProvider>
        <TanStackRouterDevtools initialIsOpen={false} />
    </>
}

export const Route = createRootRouteWithContext<{user: UserInfo}>()({
    component: RootComponent
})
