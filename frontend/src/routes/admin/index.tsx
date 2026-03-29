import { Payments, PendingActions, Timer, BarChart, WaterDrop, FlashOn, Add, Shield, CheckCircleOutline, AccountCircle, Receipt, MoreVert } from '@mui/icons-material'
import { Box, Button, Card, CardContent, CardHeader, Chip, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Stack, Divider, Tab, Tabs, Container, useMediaQuery, useTheme, IconButton, Menu, MenuItem } from '@mui/material'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import StatusChip from '../../components/index/admin/StatusChip'
import { useEffect, useMemo, useState } from 'react'
import api from '../../utils/api'
import { anonApi } from '../../utils/apiOld'
import numeral from 'numeral'
import moment from 'moment'
import { useConfirm } from 'material-ui-confirm'
import AddPaymentDialog from '../../components/index/admin/AddPaymentDialog'
import ViewImageDialog from '../../components/index/admin/ViewImageDialog'
import AddReadingDialog from '../../components/index/admin/AddReadingDialog'
import { useQuery } from '@tanstack/react-query'
import { getAllReadings, getPayments, PAYMENT, READING, usePaymentMutation, useAllReading, useAllPayments, useAllMasterBills } from '../../repositories/repository'
import AddMasterBillDialog from '../../components/index/admin/AddMasterBillDialog'
import AdminMetricCard from '../../components/index/admin/AdminMetricCard'
import AdminBillDetailsDialog from '../../components/index/admin/AdminBillDetailsDialog'
import ViewReadingsDialog from '../../components/index/admin/ViewReadingsDialog'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
  beforeLoad: (ctx) => {
    console.log("Admin beforeLoad - isLoggedIn:", ctx.context?.user?.isLoggedIn(), "isLoading:", ctx.context?.user?.isLoading, "hasScope:", ctx.context?.user?.hasScope(`api://${window.webConfig.audience}/admin`))
    
    // Don't redirect if auth is still loading
    if (ctx.context?.user?.isLoading) return;

    if (!ctx.context?.user?.isLoggedIn() || !ctx.context?.user?.hasScope(`api://${window.webConfig.audience}/admin`)) {
      console.warn("Redirecting from admin to /")
      throw redirect({ to: "/" })
    }
  }
})

function RouteComponent() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const { data: readings = [] } = useAllReading()
  const { data: payments = [] } = useAllPayments()
  const { data: bills = [] } = useAllMasterBills()
  const { decide_admin } = usePaymentMutation()
  const [billDate, setBillDate] = useState(moment().format("YYYY-MM-01"))
  const [activeTab, setActiveTab] = useState(0)
  const [timerInfo, setTimerInfo] = useState<any>(null)
  const [isLoading, setLoading] = useState(false)

  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<null | HTMLElement>(null)

  useEffect(() => {
    anonApi.get("/get_timer_info").then((res: any) => {
      setTimerInfo(res.data)
    })
  }, [])

  const stats = useMemo(() => {
    const pendingCount = payments.filter(p => p.Status === 'Pending').length;
    const mtdCollection = payments
      .filter(p => p.Status === 'Approved' && moment(p.File?.datetime).isSame(moment(), 'month'))
      .reduce((sum, p) => sum + (p.File?.amount || 0), 0);

    // Latest reading date
    const lastReading = readings?.[0]?.date ? moment(readings[0].date).format("MMM DD") : 'N/A';

    // Connection Status
    const isConnected = timerInfo?.ExtendedTimer || timerInfo?.DisconnectTime ? moment(timerInfo.ExtendedTimer || timerInfo.DisconnectTime).isAfter(moment()) : false;

    return {
      pendingCount,
      mtdCollection: numeral(mtdCollection).format("0,0.00"),
      lastReading,
      totalPayments: payments.length,
      status: isConnected ? "Connected" : "Disconnected",
      statusColor: isConnected ? "success" : "error" as const
    }
  }, [payments, readings, timerInfo])

  const pendingPaymentsCount = useMemo(() => payments.filter(p => p.Status === 'Pending').length, [payments])

  const decide = (p_data: any, decision: any) => {
    confirm({
      title: "Confirm Decision",
      description: `Are you sure you want to mark this as ${decision["label"]}?`
    }).then(async (val) => {
      if (!val) return
      if (val.confirmed) {
        var res = await decide_admin.mutateAsync({ id: p_data.id, decision: decision.label })
        if (decision.label == "Approved") {
          confirm({
            title: "Approved",
            description: `Payment confirmed. Extension granted till ${moment(res?.timer.DisconnectTime).format("MMM DD")}`,
            hideCancelButton: true
          })
        } else {
          confirm({
            title: "Decision Recorded",
            description: `${decision.label} Successful`,
            hideCancelButton: true
          })
        }
      }
    })
  }

  const generateBill = () => {
    setLoading(true)
    api.get(`/create_bill`, { params: { date: billDate } })
      .then(e => {
        navigate({ to: `/user/bills/${billDate}` })
        setLoading(false)
      })
  }

  const MobilePaymentCard = ({ payment, showStatus = false }: { payment: any, showStatus?: boolean }) => (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" gutterBottom>
                {moment(payment.File?.datetime).format("MMMM DD, YYYY")}
              </Typography>
              <Typography variant="subtitle1" fontWeight="700">
                ₱{numeral(payment.File?.amount).format("0,0.00")}
              </Typography>
            </Box>
            <Box>
              {showStatus ? (
                <StatusChip value={payment.Status} size="small" />
              ) : (
                <StatusChip value={payment.Status} size="small" select onChange={(newValue) => decide(payment, newValue)} />
              )}
            </Box>
          </Box>
          <Divider />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              {payment.File?.fileId && <ViewImageDialog fileId={payment.File.fileId} />}
              <Typography variant="body2">{payment.File?.recipientBank || 'Cash'}</Typography>
            </Stack>
            <Chip size="small" variant="outlined" label={`${payment.File?.days || 0}D @ ₱150`} color={(payment.File?.days || 0) > 0 ? "success" : "default"} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  const MobileMasterBillCard = ({ bill }: { bill: any }) => (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle2" fontWeight="700">
                {moment(bill.bill_date).format("MMM DD, YYYY")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {moment(bill.billing_start).format("MMM DD")} - {moment(bill.billing_end).format("MMM DD")}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {bill.type?.includes("Meralco") ? <FlashOn fontSize="small" color="warning" /> : <WaterDrop fontSize="small" color="info" />}
              <Typography variant="body2" fontWeight="600">{bill.type}</Typography>
            </Box>
          </Box>
          <Divider />
          <Grid container spacing={1}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Amount</Typography>
              <Typography variant="body2" fontWeight="600">₱{numeral(bill.current).format("0,0.00")}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Usage</Typography>
              <Typography variant="body2">{bill.consumption || '-'} {bill.type?.includes("Water") ? 'm³' : 'KWH'}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Rate</Typography>
              <Typography variant="body2">₱{numeral(bill.price_per_unit).format("0.0000")}</Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              {bill.file_id && <AdminBillDetailsDialog bill={bill} />}
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  )

  const MobileReadingRow = ({ type, item }: { type: string, item: any }) => (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          {type === 'Meralco' ? <FlashOn color="warning" fontSize="small" /> : <WaterDrop color="info" fontSize="small" />}
          <Box>
            <Typography variant="body2" fontWeight="700">{type}</Typography>
            <Typography variant="caption" color="text.secondary">{item ? moment(item.date).format("MMM DD") : 'N/A'}</Typography>
          </Box>
        </Stack>
        <Box textAlign="right">
          <Typography variant="body2" fontWeight="600">
            {item ? `₱${numeral(item.consumption * item.per_unit).format("0,0.00")}` : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item ? `${item.reading} (${item.consumption})` : '-'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Dashboard Header */}
      <Box mb={4} display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-end' }} gap={2}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700" color="text.primary">Admin Command Center</Typography>
          <Typography variant="body2" color="text.secondary">Real-time utility management and payment approvals</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
          <Button variant="outlined" color="inherit" onClick={() => navigate({ to: '/user' })} startIcon={<AccountCircle />} sx={{ flex: 1 }}>
            Switch to User View
          </Button>
          <Box display="flex" gap={2} sx={{ flex: 1 }}>
            <TextField
              type="date"
              size="small"
              label="Statement Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={billDate}
              onChange={(evt) => setBillDate(evt.target.value)}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={generateBill} startIcon={<Payments />} disabled={isLoading} sx={{ flex: 1 }}>
              Generate
            </Button>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AdminMetricCard title="CONNECTION STATUS" value={stats.status} icon={<Timer />} color={stats.statusColor as any} subtitle={timerInfo ? `Till ${moment(timerInfo.ExtendedTimer || timerInfo.DisconnectTime).format("MMM DD, HH:mm")}` : "Loading..."} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AdminMetricCard title="PENDING APPROVALS" value={stats.pendingCount} icon={<PendingActions />} color="warning" subtitle="Requires immediate action" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AdminMetricCard title="MTD COLLECTION" value={`₱${stats.mtdCollection}`} icon={<Payments />} color="success" subtitle="Current month approved" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AdminMetricCard title="LATEST READING" value={stats.lastReading} icon={<BarChart />} color="info" subtitle="Status of last meter check" />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column: Payments */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight="600">Payment Feed</Typography>}
              action={<AddPaymentDialog onCreate={() => { }} />}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, '& .MuiCardHeader-action': { alignSelf: 'center' } }}
            />
            <Box sx={{ px: 2, pt: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label={isMobile ? `Action (${pendingPaymentsCount})` : pendingPaymentsCount > 0 ? `Action Required (${pendingPaymentsCount})` : "Action Required"} sx={{ fontWeight: 600 }} />
                <Tab label="History" sx={{ fontWeight: 600 }} />
                <Tab label="Master Bills" sx={{ fontWeight: 600 }} />
              </Tabs>
            </Box>
            <CardContent sx={{ p: isMobile ? 2 : 0 }}>
              {isMobile ? (
                <Box sx={{ maxHeight: 500, overflowY: 'auto', px: 1 }}>
                  {activeTab === 0 ? (
                    <>
                      {payments.filter(p => p.Status === 'Pending').map((e) => (
                        <MobilePaymentCard key={e.id} payment={e} />
                      ))}
                      {pendingPaymentsCount === 0 && (
                        <Stack alignItems="center" spacing={1.5} py={8}>
                          <CheckCircleOutline sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">You're all caught up!</Typography>
                        </Stack>
                      )}
                    </>
                  ) : activeTab === 1 ? (
                    <>
                      {payments.filter(p => p.Status !== 'Pending').sort((a, b) => moment(b.File?.datetime).valueOf() - moment(a.File?.datetime).valueOf()).map((e) => (
                        <MobilePaymentCard key={e.id} payment={e} showStatus />
                      ))}
                    </>
                  ) : (
                    <>
                      {bills.map((b: any) => (
                        <MobileMasterBillCard key={b.id} bill={b} />
                      ))}
                      {bills.length === 0 && (
                        <Box py={8} textAlign="center">
                          <Typography variant="body2" color="text.secondary">No master bills uploaded yet.</Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              ) : (
                <TableContainer sx={{ minHeight: 400, maxHeight: 600, overflowY: 'auto' }}>
                  {activeTab === 0 ? (
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Source & Receipt</TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Effect</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.filter(p => p.Status === 'Pending').map((e) => (
                          <TableRow key={e.id} hover sx={{ bgcolor: 'rgba(255, 193, 7, 0.04)' }}>
                            <TableCell>{moment(e.File?.datetime).format("MMM DD")}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {e.File?.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                                <Typography variant="body2">{e.File?.recipientBank || 'Cash'}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                              ₱{numeral(e.File?.amount).format("0,0.00")}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" variant="outlined" label={`${e.File?.days || 0}D @ ₱150`} color={(e.File?.days || 0) > 0 ? "success" : "default"} />
                            </TableCell>
                            <TableCell>
                              <StatusChip value={e.Status} size="small" select onChange={(newValue) => decide(e, newValue)} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {pendingPaymentsCount === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                              <Stack alignItems="center" spacing={1.5}>
                                <CheckCircleOutline sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                    You're all caught up!
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    No pending payments found.
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  ) : activeTab === 1 ? (
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Source & Receipt</TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.filter(p => p.Status !== 'Pending').sort((a, b) => moment(b.File?.datetime).valueOf() - moment(a.File?.datetime).valueOf()).map((e) => (
                          <TableRow key={e.id} hover>
                            <TableCell>{moment(e.File?.datetime).format("MMM DD")}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {e.File?.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                                <Typography variant="body2">{e.File?.recipientBank || 'Cash'}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                              ₱{numeral(e.File?.amount).format("0,0.00")}
                            </TableCell>
                            <TableCell>
                              <StatusChip value={e.Status} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Bill Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Utility</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Usage</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bills.map((b: any) => (
                          <TableRow key={b.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {moment(b.bill_date).format("MMM DD, YYYY")}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {moment(b.billing_start).format("MMM DD")} - {moment(b.billing_end).format("MMM DD")}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {b.type?.includes("Meralco") ? <FlashOn fontSize="small" color="warning" /> : <WaterDrop fontSize="small" color="info" />}
                                <Typography variant="body2">{b.type}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>₱{numeral(b.current).format("0,0.00")}</TableCell>
                            <TableCell>{b.consumption || '-'} {b.type?.includes("Water") ? 'm³' : 'KWH'}</TableCell>
                            <TableCell>₱{numeral(b.price_per_unit).format("0.0000")}</TableCell>
                            <TableCell>
                              {b.file_id ? <AdminBillDetailsDialog bill={b} /> : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {bills.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                              <Typography variant="body2" color="text.secondary">No master bills uploaded yet.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Utilities & Billing */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={4}>
            {/* Readings Manager Card */}
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardHeader
                title={<Typography variant="h6" fontWeight="600">Utility Readings</Typography>}
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                action={
                  <Stack direction="row" spacing={1}>
                    <AddReadingDialog onAdded={() => { }} data={readings} allowedTypes={["Manila Water", "Meralco"]} admin>
                      <Button size="small" startIcon={<Add fontSize="inherit" />}>{isMobile ? 'Read' : 'Reading'}</Button>
                    </AddReadingDialog>
                    <AddMasterBillDialog>
                      <Button size="small" startIcon={<Add fontSize="inherit" />}>{isMobile ? 'Bill' : 'Master Bill'}</Button>
                    </AddMasterBillDialog>
                  </Stack>
                }
              />
              <CardContent sx={{ p: isMobile ? 2 : 0 }}>
                {isMobile ? (
                  <Box>
                    {['Meralco', 'Manila Water'].map(type => (
                      <MobileReadingRow key={type} type={type} item={readings.find(r => r.type === type)} />
                    ))}
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Utility</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Last Data</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {['Meralco', 'Manila Water'].map(type => {
                          const item = readings.find(r => r.type === type);
                          return (
                            <TableRow key={type}>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {type === 'Meralco' ? <FlashOn color="warning" fontSize="small" /> : <WaterDrop color="info" fontSize="small" />}
                                  <Typography variant="body2" fontWeight="600">{type}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{item ? moment(item.date).format("MMM DD") : 'N/A'}</TableCell>
                              <TableCell>{item ? `${item.reading} (${item.consumption})` : '-'}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                {item ? `₱${numeral(item.consumption * item.per_unit).format("0,0.00")}` : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <Divider />
                <Box p={2}>
                  <ViewReadingsDialog readings={readings} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Settings Placeholder */}
            <Card elevation={0} sx={{ borderRadius: 2, bgcolor: '#EEF2FF', border: '1px solid', borderColor: 'primary.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1.5, bgcolor: 'primary.500', color: 'white', borderRadius: 2 }}>
                    <Shield />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700" color="primary.900">System Controls</Typography>
                    <Typography variant="body2" color="primary.700">Global Rate: ₱150.00 / day</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

    </Container>
  )
}
