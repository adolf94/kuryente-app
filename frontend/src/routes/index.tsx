import { Box, Button, Card, CardContent, CardHeader, Grid, TextField, Typography } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Timer from '../components/index/Timer'
import {CloudUpload} from "@mui/icons-material"
import moment from 'moment'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import ImageModal from '../components/index/ImageModal'
import { GoogleLogin, useGoogleLogin, type CredentialResponse } from '@react-oauth/google'
import useLogin from '../components/GoogleLoginWrapper'
import { anonApi } from '../utils/apiOld'

export const Route = createFileRoute('/')({
  component: Index,
})

const Index = ()=>{

    const [timer,setTimer] = useState({
        DisconnectTime : ""
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
        setUser({isAuthenticated:true, ...userinfo})
    },[])



    const loginGoogle = useGoogleLogin({
        redirect_uri: window.webConfig.redirectUri,
        scope: "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        onSuccess: codeResponse => {
            setLoading(true);

            anonApi.post("/google/auth", { code: codeResponse.code})
                .then((e) => {
                    window.localStorage.setItem("refresh_token", e.data.refresh_token);
                    window.localStorage.setItem("access_token", e.data.access_token);
                    navigate({to:"/user"})
                    setUser({isAuthenticated:true, ...e.data.user_info})
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
                .then(res=>{
                    window.localStorage.setItem("id_token", res.id_token);
                                       
                    // handleToken(res.id_token)
                    setLoading(false);
                });

        },
        flow: 'auth-code',
    });

    
    const onGoogleSuccess = (data: CredentialResponse)=>{
            api.post(`${window.webConfig.auth}/auth/google_credential`, data, { preventAuth: true })
            .then(e=>{
                window.localStorage.setItem("refresh_token", e.data.refresh_token);
                window.sessionStorage.setItem("access_token", e.data.access_token);
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
    <Grid container sx={{justifyContent:"center"}}>
        <Grid size={12} sx={{p:2, display:"flex", justifyContent:"center", alignItems:"center"}}>
            <Box sx={{display:"block"}}>
                <Box sx={{display:"block",  textAlign:"center"}}>
                    <Timer date={timer?.DisconnectTime} /><br />
                </Box>
                <Box>
                    <i>Disconnection will be automatic when timer counts down to 00:00</i>
                </Box>
            </Box>
        </Grid>
        <Grid size={{md:12, lg:6}} sx={{pt:2, p:1}}>
            <Box>
            <Card>
                <CardContent>
                    <Typography variant='h5'>Extend Electricity</Typography>
                     <ImageModal />

                    <Typography variant="h6">Instructions:</Typography> 
                    <Typography variant="body1" sx={{pl:2}}>
                            Do a screenshot of the payment done and click on <b>"Upload Payment proof"</b> button to submit the payment screenshot. Reconnection(if disconnected) will be done automatically after <b>validation</b>
                    </Typography> 
                    <Typography variant="body1" sx={{pt:1,pl:2}}>
                        <b>Fund transfer to GCash (BDO to GCash / GCash to GCash):</b> <br />
                        <Box component="span" sx={{pl:2}}>Will be validated / processed automatically by the System/Tool. Highly recommended if <b>disconnected</b> </Box>
                    </Typography>
                    <Typography variant="body1" sx={{pt:1,pl:2}}>
                        <b>Fund transfer to BDO (BDO to BDO):</b> <br />
                        <Box component="span" sx={{pl:2}}>Will be validated by <b>AR</b> within the day. <br /> </Box>
                    </Typography>
                </CardContent>
            </Card>
            </Box>
            <Box sx={{pt:2}}>
            <Card>
                <CardContent>
                    <Typography variant='h6'>Login to view history</Typography>
                    
                    {user.isLoggedIn() ?
                    <Box display="block" sx={{pt:1, textAlign:"center"}}>
                        <Button variant='contained' size="large" loading={loading} onClick={()=>navigate({to:"/user"})}>Go to Dashboard</Button>
                    </Box>: <Grid container sx={{pt:1, textAlign:"center", justifyContent:"center"}}>
                        <Grid>
                            <GoogleLogin onSuccess={onGoogleSuccess} />
                        </Grid>
                        {/* <Button variant='contained' size="large" loading={loading} onClick={loginGoogle}>Login with Google</Button> */}
                    </Grid>}
                </CardContent>
            </Card>
            </Box>
        </Grid>
    </Grid>
    
  )
}