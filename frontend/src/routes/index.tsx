import { Box, Button, Card, CardContent, Grid, Typography, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Container, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Timer from '../components/index/Timer'
import { CheckCircle, AccountBalanceWallet, AccessTimeFilled, Shield, Google, Telegram, Fingerprint, ElectricBolt, WaterDrop } from "@mui/icons-material"
import { useEffect, useState } from 'react'
import api from '../utils/api'
import ImageModal from '../components/index/ImageModal'
import useLogin from '../components/GoogleLoginWrapper'
import { anonApi } from '../utils/apiOld'

const Index = () => {

    const [timer, setTimer] = useState<any>({
        DisconnectTime: "",
        ExtendedTimer: ""
    })
    const [timerLoading, setTimerLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [promptOpen, setPromptOpen] = useState(false)
    const { user, login } = useLogin()
    const navigate = useNavigate({ from: '/' })

    useEffect(() => {
        // Only auto-redirect if they haven't explicitly asked to stay on the landing page
        if (user.isLoggedIn() && !sessionStorage.getItem('manual_home_visit')) {
            navigate({ to: '/user' })
        }
    }, [user.isLoggedIn(), navigate])

    useEffect(() => {
        setTimerLoading(true)
        anonApi.get("/get_timer_info").then(res => {
            setTimer(res.data)
            if (res.data?.DisableReload) {
                setPromptOpen(true)
            }
        }).finally(() => {
            setTimerLoading(false)
        })
    }, [])

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

                            {timerLoading ? (
                                <Box mt="auto" sx={{ bgcolor: '#F8FAFC', border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                    <Button variant="contained" color="primary" loading={true} sx={{ borderRadius: 3, px: 3, py: 1.2 }}>
                                        Extend Service
                                    </Button>
                                </Box>
                            ) : timer?.DisableReload ? (
                                <Box mt="auto" sx={{ bgcolor: '#F8FAFC', border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                    <Button variant="contained" color="primary" disabled onClick={() => setPromptOpen(true)} sx={{ borderRadius: 3, px: 3, py: 1.2 }}>
                                        Extend Service
                                    </Button>
                                    <Dialog open={promptOpen} onClose={() => setPromptOpen(false)} maxWidth="xs" fullWidth>
                                        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main', textAlign: 'center' }}>Reloading / Extending is disabled.</DialogTitle>
                                        <DialogContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                                <Box component="a" href="https://www.meralco.com.ph/residential/electric-service/start-or-modify" target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                                                    <img src="/meralco.png" alt="Meralco" style={{ height: 48, objectFit: 'contain' }} />
                                                </Box>
                                                <Divider orientation="vertical" flexItem />
                                                <Box component="a" href="https://www.manilawater.com/customers/customer-faq" target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                                                    <img src="/manilawater.jpeg" alt="Manila Water" style={{ height: 48, objectFit: 'contain', borderRadius: 4 }} />
                                                </Box>
                                            </Box>
                                            <DialogContentText color="text.primary" textAlign="center">
                                                Please call Meralco at <strong>16211</strong> and Manila Water at <strong>1627</strong> to avail of separate utility services.
                                            </DialogContentText>
                                        </DialogContent>
                                        <DialogActions sx={{ p: 2, pt: 0 }}>
                                            <Button onClick={() => setPromptOpen(false)} color="primary" variant="contained" disableElevation fullWidth>
                                                Accept
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
                                </Box>
                            ) : (
                                <Box mt="auto" sx={{ bgcolor: '#F8FAFC', border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                    <ImageModal
                                        timer={timer}
                                        onComplete={(data: any) => {
                                            setTimer(data.new_timer);
                                            navigate({ to: '/user' });
                                        }}
                                    />
                                </Box>
                            )}
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
                                <Button variant='contained' color="primary" size="large" disableElevation sx={{ px: 4, py: 1.5, borderRadius: 2 }} loading={loading} onClick={() => navigate({ to: "/user" })}>
                                    Enter Dashboard
                                </Button>
                            ) : (
                                <Button
                                    variant='contained'
                                    color="primary"
                                    size="large"
                                    disableElevation
                                    sx={{ 
                                        px: 3, 
                                        py: 1.5, 
                                        borderRadius: 2,
                                        display: 'flex',
                                        gap: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 700
                                    }}
                                    onClick={() => login()}
                                >
                                    Login with
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Google sx={{ fontSize: 20 }} />
                                        <Telegram sx={{ fontSize: 20 }} />
                                        <Fingerprint sx={{ fontSize: 20 }} />
                                    </Stack>
                                </Button>
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
