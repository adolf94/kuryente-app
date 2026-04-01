import { ArrowForward, Payments, BarChart, Home, AdminPanelSettings, Assistant } from '@mui/icons-material'
import { Box, Button, Card, Container, Grid, List, Stack, Typography, useTheme, Paper, useMediaQuery, ButtonGroup, Popover } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import moment from 'moment'
import { useMemo } from 'react'
import { useAllBills, useAllPayments, useAllReading } from '../../repositories/repository'
import BillCard, { UnbilledBillCard, LoadingBillCard } from '../../components/index/user/BillCard'
import PaymentCard, { LoadingPaymentCard } from '../../components/index/user/PaymentCard'
import ReadingRow, { LoadingReadingRow } from '../../components/index/user/ReadingRow'
import useLogin from '../../components/GoogleLoginWrapper'
import UserHistoryView from '../../components/index/user/UserHistoryView'
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { Close as CloseIcon, WaterDrop, ElectricBolt } from '@mui/icons-material'
import { useState, useContext, useEffect } from 'react'
import { ChatContext } from '../user'
import { LinePlot, MarkPlot, AreaPlot } from '@mui/x-charts/LineChart'
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis'
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis'
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip'
import { ChartContainer } from '@mui/x-charts/ChartContainer'
import { ChartsGrid } from '@mui/x-charts/ChartsGrid'

const RouteComponent = () => {
    const theme = useTheme()
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const { setShowChat } = useContext(ChatContext)
    const [historyOpen, setHistoryOpen] = useState(false)
    const { user } = useLogin()
    const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
    const showHelp = Boolean(popoverAnchor);

    useEffect(() => {
        const timer = setTimeout(() => {
            const btn = document.getElementById('ai-assistant-button');
            if (btn) {
                setPopoverAnchor(btn);
                // Auto-close after 6 seconds so it doesn't block the UI permanently
                setTimeout(() => setPopoverAnchor(prev => prev?.id === 'ai-assistant-button' ? null : prev), 6000);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const { data: payments = [], isLoading: payLoading } = useAllPayments({ unsetPlaceholder: true })
    const { data: readings = [], isLoading: readLoading } = useAllReading({ unsetPlaceholder: true })
    const { data: bills = [], isLoading: billLoading } = useAllBills({ unsetPlaceholder: true })

    const latestBill = useMemo(() => {
        return [...bills].sort((a: any, b: any) => a.id < b.id ? 1 : -1)[0]
    }, [bills])

    const chartData = useMemo(() => {
        // Generate trailing months for the X-axis (6 for mobile, 12 for desktop)
        const monthsCount = isMobile ? 6 : 12
        const months = []
        for (let i = monthsCount; i >= 1; i--) {
            months.push(moment().subtract(i, 'months').format("YYYY-MM"))
        }

        const meralcoCostData = months.map(m => {
            const r = readings.filter((read: any) => read.type === 'Meralco' && moment(read.date).subtract(5, 'days').format("YYYY-MM") === m)
            return r.length > 0 ? r.reduce((acc: number, cur: any) => acc + ((cur.consumption || 0) * (cur.per_unit || 0)), 0) : 0
        })

        const waterCostData = months.map(m => {
            const r = readings.filter((read: any) => read.type === 'Manila Water' && moment(read.date).subtract(5, 'days').format("YYYY-MM") === m)
            return r.length > 0 ? r.reduce((acc: number, cur: any) => acc + ((cur.consumption || 0) * (cur.per_unit || 0)), 0) : 0
        })

        return {
            x: months.map(m => moment(m, "YYYY-MM").format("MMM")),
            meralco: meralcoCostData,
            water: waterCostData
        }
    }, [readings])

    const isFirstFiveDays = moment().date() <= 5;
    const recentBills = useMemo(() => {
        return [...bills].sort((a: any, b: any) => a.id < b.id ? 1 : -1).slice(0, 2)
    }, [bills])

    return (
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 6 }, pb: { xs: 14, md: 6 } }}>
            {/* Quick Navigation */}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: { xs: 1, md: 2 } }}>
                <Button
                    size="small"
                    variant="text"
                    color="primary"
                    startIcon={<Home sx={{ fontSize: 18 }} />}
                    onClick={() => {
                        sessionStorage.setItem('manual_home_visit', 'true');
                        navigate({ to: "/" });
                    }}
                    sx={{ fontWeight: 700 }}
                >
                    Home
                </Button>
                {user.hasScope(`api://${(window as any).webConfig.audience}/admin`) && (
                    <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        startIcon={<AdminPanelSettings sx={{ fontSize: 18 }} />}
                        onClick={() => navigate({ to: "/admin" })}
                        sx={{ fontWeight: 700, opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                        Admin
                    </Button>
                )}
                <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => {
                        (window as any).localStorage.clear();
                        (window as any).sessionStorage.clear();
                        window.location.href = "/";
                    }}
                    sx={{ fontWeight: 700 }}
                >
                    Logout
                </Button>
            </Stack>

            {/* Minimalist Welcome Header - Optimized for mobile density */}
            <Box mb={{ xs: 2, md: 6 }}>
                <Typography variant={isMobile ? "h5" : "h3"} fontWeight="900" color="text.primary" sx={{ mb: isMobile ? 0.5 : 1 }}>
                    Hello, {user?.name || 'Client'}
                </Typography>
                <Typography variant={isMobile ? "body2" : "h6"} color="text.secondary" fontWeight="400">
                    Here's a quick look at your utility account status.
                </Typography>
            </Box>

            {/* Hero Section: Two Primary Cards - Tighter spacing for mobile */}
            <Grid container spacing={isMobile ? 2.5 : 4} mb={{ xs: 3, md: 6 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ height: '100%' }}>
                        <Typography variant="subtitle2" fontWeight="800" color="primary.main" sx={{ mb: isMobile ? 1 : 2, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                            {isFirstFiveDays ? "Latest Statement" : "Current Usage (Estimated)"}
                        </Typography>
                        {payLoading || billLoading ? <LoadingBillCard /> :
                            (isFirstFiveDays ? (
                                recentBills[0] ? <BillCard item={recentBills[0]} date={recentBills[0].id} /> : (
                                    <Card sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                                        <Typography variant="body2" color="text.secondary">No statements available.</Typography>
                                    </Card>
                                )
                            ) : (
                                <UnbilledBillCard payments={payments} />
                            ))
                        }
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ height: '100%', mt: { xs: 2, md: 0 } }}>
                        <Typography variant="subtitle2" fontWeight="800" color="text.secondary" sx={{ mb: isMobile ? 1 : 2, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                            {isFirstFiveDays ? "Previous Statement" : "Latest Statement"}
                        </Typography>
                        {billLoading ? <LoadingBillCard /> :
                            (isFirstFiveDays ? (
                                recentBills[1] ? <BillCard item={recentBills[1]} date={recentBills[1].id} /> : (
                                    <Paper sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                                        <Typography color="text.secondary">No previous statements available.</Typography>
                                    </Paper>
                                )
                            ) : (
                                latestBill ? <BillCard item={latestBill} date={latestBill.id} /> : (
                                    <Paper sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                                        <Typography color="text.secondary">No statements available yet.</Typography>
                                    </Paper>
                                )
                            ))
                        }
                    </Box>
                </Grid>
            </Grid>

            {/* Trends Section */}
            <Box mb={6}>
                <Card elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box>
                            <Typography variant="h6" fontWeight="700">Cost Trends (PHP)</Typography>
                            <Typography variant="body2" color="text.secondary">Total monthly spending comparison</Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: 10, bgcolor: '#03A9F4' }} />
                                <Typography variant="caption" fontWeight={700}>Water</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: 10, bgcolor: '#FFC107' }} />
                                <Typography variant="caption" fontWeight={700}>Electricity</Typography>
                            </Box>
                        </Stack>
                    </Stack>

                    <Box sx={{ height: 320, width: '100%', mt: 2 }}>
                        {chartData.x.length > 0 ? (
                            <ChartContainer
                                height={300}
                                series={[
                                    {
                                        type: 'line',
                                        data: chartData.meralco,
                                        label: 'Electricity',
                                        color: '#FFC107',
                                        area: true,
                                        stack: 'total',
                                    },
                                    {
                                        type: 'line',
                                        data: chartData.water,
                                        label: 'Water',
                                        color: '#03A9F4',
                                        area: true,
                                        stack: 'total',
                                    },
                                ]}
                                xAxis={[{ data: chartData.x, scaleType: 'point' }]}
                                margin={{ left: 35, right: 10, top: 20, bottom: 40 }}
                            >
                                <ChartsGrid horizontal />
                                <AreaPlot />
                                <LinePlot />
                                <MarkPlot />
                                <ChartsXAxis />
                                <ChartsYAxis />
                                <ChartsTooltip />
                            </ChartContainer>
                        ) : (
                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary">Not enough data to generated trends.</Typography>
                            </Box>
                        )}
                    </Box>
                </Card>
            </Box>

            {/* Minimalist Activity Snippets */}
            <Grid container spacing={4} mb={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1}>
                                <Payments fontSize="small" color="success" /> Recent Payments
                            </Typography>
                            <Button size="small" onClick={() => setHistoryOpen(true)} sx={{ fontWeight: 700, p: 0 }}>View All</Button>
                        </Stack>
                        <List disablePadding>
                            {payLoading ? (
                                Array.from(new Array(3)).map((_, i) => <LoadingPaymentCard key={i} />)
                            ) : (
                                payments.sort((a: any, b: any) => a.DateAdded > b.DateAdded ? -1 : 1)
                                    .slice(0, 3)
                                    .map((e: any, i: number) => <PaymentCard key={i} payment={e} />)
                            )}
                        </List>
                        {payments.length === 0 && !payLoading && (
                            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>No recent payments.</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1}>
                                <BarChart fontSize="small" color="primary" /> Recent Readings
                            </Typography>
                            <Button size="small" onClick={() => setHistoryOpen(true)} sx={{ fontWeight: 800, p: 0, minWidth: 0, textTransform: 'none' }}>View All</Button>
                        </Stack>

                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    <ElectricBolt sx={{ fontSize: 14 }} /> Meralco
                                </Typography>
                                <List disablePadding>
                                    {readLoading ? (
                                        Array.from(new Array(1)).map((_, i) => <LoadingReadingRow key={i} />)
                                    ) : (
                                        readings.filter((r: any) => r.type === "Meralco")
                                            .slice(0, 1)
                                            .map((e: any, i: number) => <ReadingRow key={i} reading={e} />)
                                    )}
                                </List>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    <WaterDrop sx={{ fontSize: 14 }} /> Manila Water
                                </Typography>
                                <List disablePadding>
                                    {readLoading ? (
                                        Array.from(new Array(1)).map((_, i) => <LoadingReadingRow key={i} />)
                                    ) : (
                                        readings.filter((r: any) => r.type === "Manila Water")
                                            .slice(0, 1)
                                            .map((e: any, i: number) => <ReadingRow key={i} reading={e} />)
                                    )}
                                </List>
                            </Box>
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>

            {/* CTA to Elaborative View - Merged on mobile for better ergonomics */}
            <Box mt={4} sx={{ position: 'sticky', bottom: 16, zIndex: 10 }}>
                {isMobile ? (
                    <ButtonGroup
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{
                            borderRadius: (theme: any) => theme.shape.borderRadius * 3, // Premium rounded pill
                            overflow: 'hidden',
                            boxShadow: '0 12px 24px rgba(33, 150, 243, 0.3)',
                            '& .MuiButton-root': {
                                py: 2.2,
                                fontWeight: 800,
                                fontSize: '1rem',
                                border: 'none',
                            }
                        }}
                    >
                        <Button
                            onClick={() => setHistoryOpen(true)}
                            sx={{
                                flex: '1 1 auto',
                                textTransform: 'none',
                                px: 1, // Reduced padding to ensure text doesn't wrap unnecessarily
                                minWidth: 0 // Allow shrinking to content if needed
                            }}
                        >
                            View All Reports and History
                        </Button>
                        <Button
                            id="ai-assistant-button"
                            sx={{
                                flex: '0 0 56px', // Fixed shrunk size
                                width: 56,
                                p: 0,
                                borderLeft: '1px solid rgba(255,255,255,0.2) !important'
                            }}
                            onClick={() => {
                                setShowChat(true);
                                setPopoverAnchor(null);
                            }}
                            onMouseEnter={(e) => setPopoverAnchor(e.currentTarget)}
                            onMouseLeave={() => setPopoverAnchor(null)}
                        >
                            <Assistant />
                        </Button>
                        <Popover
                            id="mouse-over-popover"
                            sx={{
                                pointerEvents: 'none',
                                mt: -1
                            }}
                            open={showHelp}
                            anchorEl={popoverAnchor}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'center',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'center',
                            }}
                            onClose={() => setPopoverAnchor(null)}
                            disableRestoreFocus
                            PaperProps={{
                                sx: {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    px: 2.5,
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    boxShadow: '0 8px 32px rgba(33, 150, 243, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: -6,
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: 12,
                                        height: 12,
                                        bgcolor: 'primary.main',
                                    }
                                }
                            }}
                        >
                            Got a question? Ask our AI! ✨
                        </Popover>
                    </ButtonGroup>
                ) : (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            endIcon={<ArrowForward />}
                            onClick={() => setHistoryOpen(true)}
                            sx={{
                                py: 2.5,
                                borderRadius: 4,
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                letterSpacing: 0.5,
                                boxShadow: '0 12px 24px rgba(33, 150, 243, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 16px 32px rgba(33, 150, 243, 0.4)',
                                    transform: 'translateY(-4px)'
                                },
                            }}
                        >
                            View Complete Account History & Reports
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Noob-Friendly History Modal */}
            <Dialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                fullScreen={isMobile}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: { xs: 0, sm: 4 }, minHeight: '80vh' }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 2
                }}>
                    <Typography variant="h6" fontWeight="800">Account History</Typography>
                    <IconButton onClick={() => setHistoryOpen(false)} edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'grey.50' }}>
                    <UserHistoryView />
                </DialogContent>
            </Dialog>
        </Container>
    )
}

export const Route = createFileRoute('/user/')({
    component: RouteComponent,
})