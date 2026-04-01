import { Box, Button, Card, CardContent, CardHeader, Container, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, Slide } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import * as React from 'react'
import { useEffect, useMemo, useState, forwardRef } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import useBillComputation from '../../../utils/useBillComputation'
import moment from 'moment'
import numeral from 'numeral'
import { ArrowBack, Description, InfoOutlined, Close, Home, AdminPanelSettings, Logout } from '@mui/icons-material'
import api from '../../../utils/api'
import useLogin from '../../../components/GoogleLoginWrapper'
import ViewMasterBillDialog from '../../../components/index/user/ViewMasterBillDialog'
import StatusChip from '../../../components/index/admin/StatusChip'

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />
})

const MeterReadingCard = ({ reading }: { reading: any }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const masterConsumption = reading?.master_consumption || 0
    const submeterConsumption = reading?.prorated?.consumption || reading?.consumption || 0
    const difference = masterConsumption - submeterConsumption

    const perUnit = reading?.prorated?.per_unit || reading.per_unit
    const yourCost = submeterConsumption * perUnit
    const ourCost = difference * perUnit
    const masterCost = masterConsumption * perUnit

    const handleOpen = () => setIsDialogOpen(true)
    const handleClose = () => setIsDialogOpen(false)

    return (
        <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                    title={<Typography variant="subtitle1" fontWeight="700">{reading.type}</Typography>}
                    action={
                        (reading?.prorated?.isEstimated || reading?.isEstimated) && (
                            <Chip label="Estimated" size="small" color="warning" variant="outlined" />
                        )
                    }
                    sx={{ pb: 0 }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <List disablePadding dense>
                        <ListItem disableGutters>
                            <ListItemText
                                primary={<Typography variant="caption" color="text.secondary">Reading Period</Typography>}
                                secondary={
                                    <Typography variant="body2" fontWeight="500" color="text.primary">
                                        {moment(reading?.prorated?.dateStart || reading?.dateStart).format("MM/DD/YYYY")} - {moment(reading?.prorated?.dateEnd || reading?.dateEnd).format("MM/DD/YYYY")}
                                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                                            ({reading?.prorated?.dayCount || reading?.daysCount || reading?.dayCount || (moment(reading?.prorated?.dateEnd || reading?.dateEnd).diff(moment(reading?.prorated?.dateStart || reading?.dateStart), 'days') + 1)} days)
                                        </Typography>
                                    </Typography>
                                }
                            />
                        </ListItem>

                        <ListItem disableGutters>
                            <ListItemText
                                primary={<Typography variant="caption" color="text.secondary">Recorded Reading</Typography>}
                                secondary={
                                    <Box>
                                        <Typography variant="body2" fontWeight="500" color="text.primary">
                                            {reading?.prorated?.reading || reading?.reading || "N/A"}
                                            {(!!reading?.prorated?.prevReading || reading?.prevReading) && (
                                                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                                                    (Prev: {reading?.prorated?.prevReading || reading?.prevReading})
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>

                        <ListItem disableGutters>
                            <ListItemText
                                primary={<Typography variant="caption" color="text.secondary">Consumption vs Cost</Typography>}
                                secondary={
                                    <Typography variant="body2" fontWeight="600" color="text.primary">
                                        {numeral(submeterConsumption).format("0,0.00")} units
                                        <span style={{ margin: '0 8px', color: '#E2E8F0' }}>|</span>
                                        P {numeral(perUnit).format("0,0.00")} / unit
                                    </Typography>
                                }
                            />
                        </ListItem>

                        {reading.master_reading !== undefined && reading.master_reading !== null && (
                            <ListItem disableGutters>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    startIcon={<InfoOutlined />}
                                    onClick={handleOpen}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        py: 1,
                                        mt: 1,
                                        borderStyle: 'dashed',
                                        '&:hover': { borderStyle: 'solid' }
                                    }}
                                >
                                    View Usage Analysis
                                </Button>
                            </ListItem>
                        )}

                        <Dialog
                            open={isDialogOpen}
                            onClose={handleClose}
                            TransitionComponent={Transition}
                            keepMounted
                            fullWidth
                            maxWidth="xs"
                            PaperProps={{
                                sx: {
                                    borderRadius: { xs: '20px 20px 0 0', sm: 4 },
                                    position: { xs: 'fixed', sm: 'relative' },
                                    bottom: { xs: 0, sm: 'auto' },
                                    m: { xs: 0, sm: 2 },
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight="800" color="primary.main">Usage Analysis</Typography>
                                <IconButton onClick={handleClose} size="small">
                                    <Close />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ px: 3, pb: 4 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={3} sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
                                    How our bill is split
                                </Typography>
                                <Stack spacing={2.5}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="700">Your Consumption</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {reading?.prorated?.reading || reading?.reading || "N/A"} - {reading?.prorated?.prevReading || reading?.prevReading || "N/A"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body1" fontWeight="800">{numeral(submeterConsumption).format("0,0.00")} units</Typography>
                                            <Typography variant="subtitle2" color="primary.main" fontWeight="700">
                                                x PHP {numeral(perUnit).format("0.00")} = PHP {numeral(yourCost).format("0,0.00")}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="700">Our Consumption</Typography>
                                            <Typography variant="caption" color="text.secondary">Main house / Shared</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body1" fontWeight="800" color="text.primary">{numeral(difference).format("0,0.00")} units</Typography>
                                            <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                                                x PHP {numeral(perUnit).format("0.00")} = PHP {numeral(ourCost).format("0,0.00")}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 3, border: '1px var(--primary-main) dashed' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="800">Master Total</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {reading.master_reading} - {reading.master_reading - masterConsumption}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h6" fontWeight="900" color="primary.main">{numeral(masterConsumption).format("0,0.00")} units</Typography>
                                                <Typography variant="subtitle1" fontWeight="800" color="primary.dark">PHP {numeral(masterCost).format("0,0.00")}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 1, px: 1 }}>
                                        * Note: These figures are based on the reading taken on {moment(reading.date).format("MMMM DD, YYYY")} and NOT the official {reading.type} bill period.
                                    </Typography>
                                </Stack>
                            </DialogContent>
                        </Dialog>
                    </List>
                </CardContent>
                <Divider />
                <Box p={2} bgcolor="#F8FAFC" display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary">Total Resource Cost</Typography>
                    <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                        PHP {numeral((reading.prorated?.amount) || (reading.per_unit * reading.consumption)).format("0,0.00")}
                    </Typography>
                </Box>
            </Card>
        </Grid>
    )
}

export const Route = createFileRoute('/user/bills/$billId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { billId } = Route.useParams()
    const router = useRouter()
    const { user } = useLogin()
    const { result: bill, isLoading } = useBillComputation(moment(billId))

    const [master, setMaster] = useState([])

    useEffect(() => {
        api.get(`/masterbills/${billId}`)
            .then(e => {
                setMaster(e.data)
            })
    }, [billId])

    const readings = useMemo(() => {
        if (!bill?.readings) return []
        let reads = bill.readings.reduce((p: any, c: any) => {
            if (!p[c.type]) {
                p[c.type] = []
            }
            p[c.type].push(c)
            return p
        }, {})
        return Object.keys(reads)
            .map(key => {
                let data = reads[key]
                return data.reduce((p: any, c: any) => {
                    if (!p) return {
                        ...c,
                        prorated: !c.prorated ? undefined : {
                            ...c.prorated,
                            prevReading: c.prorated.reading - c.prorated.consumption,
                            amount: (c.prorated.consumption * c.per_unit)
                        }
                    }
                    let cp = c.prorated
                    return {
                        ...c,
                        prorated: !p.prorated ? undefined : {
                            ...cp,
                            consumption: p.prorated.consumption + cp.consumption,
                            dateStart: p.prorated.dateStart < cp.dateStart ? p.prorated.dateStart : cp.dateStart,
                            dateEnd: p.prorated.dateEnd > cp.dateEnd ? p.prorated.dateEnd : cp.dateEnd,
                            dayCount: p.prorated.dayCount + cp.dayCount,
                            isEstimated: p.isEstimated || cp.isEstimated,
                            reading: Math.max(p.reading, cp.reading),
                            prevReading: Math.min((p.reading - p.consumption), (cp.reading - cp.consumption)),
                            amount: (p.prorated.consumption * p.per_unit) + (cp.consumption * c.per_unit)
                        },
                    }
                }, null)
            }).map(p => {
                let pr = p.prorated
                const typeMaster = bill?.details?.[p.type]
                return {
                    ...p,
                    master_reading: p.master_reading ?? typeMaster?.masterReading,
                    master_consumption: p.master_consumption ?? typeMaster?.masterConsumption,
                    prorated: !pr ? undefined : {
                        ...pr,
                        per_unit: pr.amount / pr.consumption
                    }
                }
            })

    }, [bill])

    if (isLoading) return <></>

    return <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
        {/* Navigation Header */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
                size="small"
                variant="text"
                color="primary"
                startIcon={<Home sx={{ fontSize: 18 }} />}
                onClick={() => router.navigate({ to: "/" })}
                sx={{ fontWeight: 700 }}
            >
                Landing Page
            </Button>
            {user.hasScope(`api://${(window as any).webConfig.audience}/admin`) && (
                <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    startIcon={<AdminPanelSettings sx={{ fontSize: 18 }} />}
                    onClick={() => router.navigate({ to: "/admin" })}
                    sx={{ fontWeight: 700, opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                    Admin
                </Button>
            )}
            <Button
                size="small"
                variant="text"
                color="error"
                startIcon={<Logout sx={{ fontSize: 18 }} />}
                onClick={() => {
                    (window as any).localStorage.clear();
                    window.location.href = "/";
                }}
                sx={{ fontWeight: 700 }}
            >
                Logout
            </Button>
        </Stack>
        {/* Navigation & Header */}
        <Box mb={4}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => router.history.back()}
                sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
            >
                Back to Dashboard
            </Button>
            <Typography variant="h4" fontWeight="700" color="text.primary">
                Bill Details: {moment(billId).format('MMMM YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Period: {moment(bill?.dateStart).format("MMMM DD")} - {moment(bill?.dateEnd).format("MMMM DD, YYYY")}
            </Typography>
        </Box>

        <Grid container spacing={4}>
            {/* Left Column: Summary & Documents */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h6" fontWeight="600" mb={2}>Financial Breakdown</Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 4 }}>
                    <CardContent sx={{ p: 0 }}>
                        <Stack divider={<Divider />}>
                            <Box p={3}>
                                <Typography variant='body2' color="text.secondary">Previous Unpaid Balance</Typography>
                                <Typography variant='caption' color="text.disabled" display="block" mb={0.5}>
                                    as of {moment(bill?.dateStart).format("MMM DD")}
                                </Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right">
                                    PHP {numeral(bill?.previous).format("0,0.00")}
                                </Typography>
                            </Box>

                            <Box p={3}>
                                <Typography variant='body2' color="text.secondary">Payments Applied</Typography>
                                <Typography variant='caption' color="text.disabled" display="block" mb={0.5}>
                                    {moment(bill?.dateStart).format("MM/DD")} - {moment(bill?.dateEnd).format("MM/DD")}
                                </Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right" color="success.main">
                                    - PHP {numeral(bill?.totalPayment).format("0,0.00")}
                                </Typography>
                            </Box>

                            <Box p={3} bgcolor="#F8FAFC">
                                <Typography variant='body2' color="text.secondary">Utility Usage Cost (Yours)</Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right">
                                    + PHP {numeral(bill?.current).format("0,0.00")}
                                </Typography>
                            </Box>

                            {(bill?.ourCurrent || 0) > 0 && (
                                <Box p={3} bgcolor="#F8FAFC">
                                    <Typography variant='body2' color="text.secondary">House Usage share (Ours)</Typography>
                                    <Typography variant='subtitle1' fontWeight="600" align="right">
                                        + PHP {numeral(bill?.ourCurrent).format("0,0.00")}
                                    </Typography>
                                </Box>
                            )}

                            <Box p={3} bgcolor={bill?.balance > 0 ? "error.50" : "success.50"}>
                                <Typography variant='subtitle1' fontWeight="700" color={bill?.balance > 0 ? "error.main" : "text.primary"}>
                                    Outstanding Balance
                                </Typography>
                                <Typography variant='caption' color="text.secondary" display="block" mb={1}>
                                    as of {moment(bill?.dateEnd).add(1, "day").format("MMM DD")}
                                </Typography>
                                <Typography variant='h5' fontWeight="700" align="right" color={bill?.balance > 0 ? "error.main" : "text.primary"}>
                                    PHP {numeral(bill?.balance).format("0,0.00")}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {master.length > 0 && (
                    <>
                        <Typography variant="h6" fontWeight="600" mb={2}>Master Bills</Typography>
                        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <List disablePadding>
                                {master.map((e: any, idx: number) => (
                                    <ViewMasterBillDialog key={idx} item={e} />
                                ))}
                            </List>
                        </Card>
                    </>
                )}
            </Grid>

            {/* Right Column: Readings & Payments */}
            <Grid size={{ xs: 12, md: 8 }}>
                {/* Meter Readings section */}
                <Typography variant="h6" fontWeight="600" mb={2}>Meter Readings</Typography>
                <Grid container spacing={3} mb={5}>
                    {readings.sort((a: any, b: any) => {
                        if (a.type > b.type) return 1
                        if (a.type < b.type) return -1
                        if (a.reading?.dateStart < b.reading?.dateStart) return 1
                        if (a.reading?.dateStart === b.reading?.dateStart) return 0
                        return -1
                    }).map((reading: any, i: number) => (
                        <MeterReadingCard key={reading.id || i} reading={reading} />
                    ))}
                </Grid>

                {/* Payments section */}
                <Typography variant="h6" fontWeight="600" mb={2} mt={{ xs: 4, md: 0 }}>Payments Ledger</Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <List disablePadding>
                        {bill?.payments?.length === 0 && (
                            <ListItem>
                                <ListItemText
                                    sx={{ py: 3, textAlign: 'center' }}
                                    primary={<Typography variant="body2" color="text.secondary">No payments recorded for this period.</Typography>}
                                />
                            </ListItem>
                        )}
                        {bill?.payments.map((item: any) => (
                            <ListItem divider key={item.id} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, px: 3 }}>
                                <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Typography variant="body1" fontWeight="600">{item.File.recipientBank}</Typography>
                                        <StatusChip size="small" value={item.Status} />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" display="block">
                                        {moment(item.DateAdded).format("MMM DD, YYYY")} • By: {item.PaymentBy?.name || item.PaymentBy?.email || item.PaymentBy}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: '0 0 auto', textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
                                    <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                        PHP {numeral(item.File.amount).format("0,0.00")}
                                    </Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                    {bill?.payments?.length > 0 && (
                        <Box p={3} bgcolor="#F8FAFC" display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight="700">Total Payments Applied</Typography>
                            <Typography variant="subtitle1" fontWeight="700" color="success.main">
                                PHP {numeral(bill?.totalPayment).format("0,0.00")}
                            </Typography>
                        </Box>
                    )}
                </Card>
            </Grid>
        </Grid>
    </Container>
}
