import { Box, Button, Card, CardContent, Grid, Typography, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Container, Paper } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Timer from '../components/index/Timer'
import { CheckCircle, AccountBalanceWallet, AccessTimeFilled, Shield } from "@mui/icons-material"
import { useEffect, useState } from 'react'
import api from '../utils/api'
import ImageModal from '../components/index/ImageModal'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import useLogin from '../components/GoogleLoginWrapper'
import { anonApi } from '../utils/apiOld'

const Index = ()=>{

    const [timer,setTimer] = useState({
        DisconnectTime : "",
        ExtendedTimer:""
    })
    const [loading, setLoading] = useState(false)
    const {user, setUser} = useLogin()
    const navigate = useNavigate({ from: '/' })
    
    useEffect(()=>{
        anonApi.get("/get_timer_info").then(res=>{
            setTimer(res.data )
        })
        let token = window.localStorage.getItem("id_token")
        if(!token) return

        let userinfo = JSON.parse(window.atob(token.split(".")[1]));
        setUser({...user,isAuthenticated:true, ...userinfo})
    },[])

    const onGoogleSuccess = (data: CredentialResponse)=>{
            api.post(`${(window as any).webConfig.auth}/auth/google_credential`, data, { preventAuth: true } as any)
            .then(e=>{
                window.localStorage.setItem("refresh_token", e.data.refresh_token);
                window.sessionStorage.setItem("access_token", e.data.access_token);
                window.localStorage.setItem("id_token", e.data.id_token);
                let userinfo = JSON.parse(window.atob(e.data.id_token!.split(".")[1]));
                navigate({to:"/user"})
                setUser({ ...user, isAuthenticated:true, ...userinfo})
                setLoading(false);

                return e.data;
            }).catch(err => {
                if (!err.response?.status) {
                    console.log(err)
                    return navigate({to:"/errors/down"})
                }
                if (err.response.status === 401 && !!err.response.headers["X-GLogin-Error"]) {
                    console.debug("INVALID CODE")
                    setLoading(false)
                }
                if (err.response.status === 403) {
                    navigate({to:"/errors/denied"})
                }
            })
    }

    return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 8 }, px: { xs: 2, sm: 3 } }}>
        


        <Grid container spacing={3}>
            {/* Status Section */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative Background */}
                    <Box sx={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(67, 56, 202, 0.04) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
                    
                    <Typography variant="overline" color="primary.main" fontWeight="700" letterSpacing="1px" mb={1} textAlign={{ xs: 'center', md: 'left' }}>
                        Connection Timer
                    </Typography>
                    
                    <Box sx={{ my: 2 }}>
                        <Timer date={timer?.ExtendedTimer || timer?.DisconnectTime} />
                    </Box>

                    <Box mt="auto" pt={3}>
                        <Alert severity="warning" icon={<Shield />} sx={{ border: '1px solid', borderColor: 'warning.light', borderRadius: 2, '& .MuiAlert-message': { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}>
                            Service disconnection is automated. Please extend your service before the timer reaches 00:00 to avoid interruption.
                        </Alert>
                    </Box>
                </Paper>
            </Grid>

            {/* Upload Action */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Box display="flex" alignItems="center" mb={2} color="primary.main">
                            <AccountBalanceWallet sx={{ mr: 1 }} />
                            <Typography variant='h6' fontWeight="600" color="text.primary">Extend Service</Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Upload your payment receipt screenshot. Processing is instant for GCash transfers.
                        </Typography>

                        <Box mt="auto" sx={{ bgcolor: '#F8FAFC', border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                            <ImageModal timer={timer} onComplete={(data: any)=>setTimer(data.new_timer)}/>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Instructions */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="600" mb={3}>Payment Channels</Typography>
                        <List disablePadding>
                            <ListItem alignItems="flex-start" sx={{ px: 0, pb: 2 }}>
                                <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                                    <CheckCircle color="secondary" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={<Typography variant="subtitle2" fontWeight="600">GCash Transfers</Typography>}
                                    secondary={<Typography variant="body2" color="text.secondary" mt={0.5}>Highly Recommended. System fully automates validation and reconnection immediately upon upload.</Typography>}
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem alignItems="flex-start" sx={{ px: 0, pt: 2 }}>
                                <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                                    <AccessTimeFilled sx={{ color: 'text.secondary' }} fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={<Typography variant="subtitle2" fontWeight="600">BDO Bank Transfers</Typography>}
                                    secondary={<Typography variant="body2" color="text.secondary" mt={0.5}>Processed within 24 hours. Requires manual verification by the admin team.</Typography>}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Grid>

            {/* Account Panel */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                        <Shield sx={{ fontSize: 40, color: 'primary.main', mb: 2, opacity: 0.8 }} />
                        <Typography variant="h6" fontWeight="600" mb={1}>Secure Dashboard</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3} maxWidth={300}>
                            Access your complete billing history, usage statistics, and account management tools.
                        </Typography>

                        {user.isLoggedIn() ? (
                            <Button variant='contained' color="primary" size="large" disableElevation sx={{ px: 4, py: 1.5, borderRadius: 2 }} loading={loading} onClick={()=>navigate({to:"/user"})}>
                                Enter Dashboard
                            </Button>
                        ) : (
                            <Box sx={{ bgcolor: '#FFFFFF', p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <GoogleLogin onSuccess={onGoogleSuccess} shape="pill" />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    </Container>
    
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})
