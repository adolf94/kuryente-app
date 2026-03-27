import { Alert, Box, Button, Card, CardContent, Container, Divider, Grid, List, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import useBillComputation from '../../../utils/useBillComputation'
import moment from 'moment'
import numeral from 'numeral'
import { useEffect, useMemo, useState } from 'react'
import { ArrowBack } from '@mui/icons-material'
import { useAllPayments } from '../../../repositories/repository'
import StatusChip from '../../../components/index/admin/StatusChip'
import api from '../../../utils/api'
import ViewMasterBillDialog from '../../../components/index/user/ViewMasterBillDialog'

export const Route = createFileRoute('/user/bills/current')({
  component: RouteComponent,
})

function RouteComponent() {
    const router = useRouter()
    const { result: bill, isLoading } = useBillComputation(moment().set("D", 1))
    const { data: payments } = useAllPayments()
    const [master, setMaster] = useState([])

    const currentPayments = useMemo<any>(() => (payments || []).filter((e: any) => {
        return e.DateAdded > bill?.dateEnd
    }).map((e: any) => {
        e.rate = e.rate || (e.File.amount / e.File.days)
        return e
    }), [payments, bill])

    const paymentAfter = useMemo(() => {
        return currentPayments.reduce((prev: number, cur: any) => {
            if (cur.Status !== "Approved") return prev
            return prev + cur.File.amount
        }, 0)
    }, [currentPayments, bill])

    useEffect(() => {
        api.get(`/masterbills/${moment().add(1, 'month').format("YYYY-MM-01")}`)
            .then(e => {
                setMaster(e.data)
            })
    }, [])

    if (isLoading) return <></>

    const currentBalance = (bill?.balance || 0) - paymentAfter;

    return <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
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
                Current Bill Period: {moment().format('MMMM YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Period: {moment().set("D", 1).format("MMMM DD")} - {moment().endOf('month').format("MMMM DD, YYYY")}
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
                                    as of {moment().set("D", 1).format("MMM DD")}
                                </Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right">
                                    PHP {numeral(bill?.balance).format("0,0.00")}
                                </Typography>
                            </Box>

                            <Box p={3}>
                                <Typography variant='body2' color="text.secondary">Payments Applied</Typography>
                                <Typography variant='caption' color="text.disabled" display="block" mb={0.5}>
                                    {moment().set("D", 1).format("MM/DD")} - {moment().format("MM/DD")}
                                </Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right" color="success.main">
                                    - PHP {numeral(paymentAfter).format("0,0.00")}
                                </Typography>
                            </Box>

                            <Box p={3} bgcolor="#F8FAFC">
                                <Typography variant='body2' color="text.secondary">Utility Usage</Typography>
                                <Typography variant='subtitle1' fontWeight="600" align="right" color="text.disabled">
                                    + PHP 0.00
                                </Typography>
                                <Typography variant='caption' color="text.disabled" display="block" align="right">
                                    No bill generated yet
                                </Typography>
                            </Box>

                            <Box p={3} bgcolor={currentBalance > 0 ? "error.50" : "success.50"}>
                                <Typography variant='subtitle1' fontWeight="700" color={currentBalance > 0 ? "error.main" : "text.primary"}>
                                    Outstanding Balance
                                </Typography>
                                <Typography variant='caption' color="text.secondary" display="block" mb={1}>
                                    as of today
                                </Typography>
                                <Typography variant='h5' fontWeight="700" align="right" color={currentBalance > 0 ? "error.main" : "text.primary"}>
                                    PHP {numeral(currentBalance).format("0,0.00")}
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
                    <Grid size={12}>
                        <Alert color='warning' icon={false} sx={{ border: '1px solid', borderColor: 'warning.light', bgcolor: 'warning.50' }}>
                            <Typography variant="subtitle2" fontWeight="600" color="warning.dark">No Readings Yet</Typography>
                            <Typography variant="body2" color="warning.dark">Readings will be generated on the first day of the next month.</Typography>
                        </Alert>
                    </Grid>
                </Grid>

                {/* Payments section */}
                <Typography variant="h6" fontWeight="600" mb={2} mt={{ xs: 4, md: 0 }}>Payments Ledger</Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <List disablePadding>
                        {currentPayments.length === 0 && (
                            <ListItem>
                                <ListItemText 
                                    sx={{ py: 3, textAlign: 'center' }}
                                    primary={<Typography variant="body2" color="text.secondary">No payments recorded for this period yet.</Typography>} 
                                />
                            </ListItem>
                        )}
                        {currentPayments.map((item: any) => (
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
                    {currentPayments.length > 0 && (
                        <Box p={3} bgcolor="#F8FAFC" display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight="700">Total Approved Payments</Typography>
                            <Typography variant="subtitle1" fontWeight="700" color="success.main">
                                PHP {numeral(paymentAfter).format("0,0.00")}
                            </Typography>
                        </Box>
                    )}
                </Card>
            </Grid>
        </Grid>
    </Container>
}
