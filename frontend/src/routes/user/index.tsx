

import { Alert, Button, Grid, Typography } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'


const RouteComponent = ()=>{
    const navigate = useNavigate({ from: '/user/' })
    return <>
        <Grid container sx={{justifyContent:"center"}}>
            <Grid size={8} sx={{textAlign:"center", p:2}}>
                <Alert color='error'>
                    <Typography>This page is still in construction.</Typography>
                </Alert>
            </Grid>
            <Grid size={8} sx={{textAlign:"center", p:2}}>
                <Button variant='contained' size='large' onClick={()=>navigate({to:"/"})}>Back to Home</Button>

            </Grid>
            <Grid size={8} sx={{textAlign:"center", p:2}}>
                <Button variant='outlined' size='large' onClick={()=>navigate({to:"/admin"})}>Admin</Button>
            </Grid>

        </Grid>
    
    </>
}

export const Route = createFileRoute('/user/')({
    component: RouteComponent,
  })
  