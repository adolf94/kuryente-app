

import { Box } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Outlet, createRootRoute, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ConfirmProvider } from 'material-ui-confirm';
import React, { useEffect } from 'react'
import { type UserInfo, AuthContext} from '../components/GoogleLoginWrapper';
import Loader from '../components/Loader';


const RootComponent = ()=>{
    

    return <>
        <ConfirmProvider>
            <Loader>
                <GoogleOAuthProvider clientId={window.webConfig.clientId}>
                        <Box sx={{width: "100%"}}>
                            <Outlet />
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
