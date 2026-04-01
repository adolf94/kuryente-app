import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material"
import { Close, ReceiptLong, Visibility } from "@mui/icons-material"
import { useState } from "react"
import api from "../../../utils/api"
import numeral from "numeral"
import moment from "moment"

interface AdminBillDetailsDialogProps {
    bill: any
}

const AdminBillDetailsDialog = ({ bill }: AdminBillDetailsDialogProps) => {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const onViewClicked = async () => {
        setOpen(true)
        if (url !== "" || !bill.file_id) return

        setLoading(true)
        try {
            const e = await api.get(`/files/${bill.file_id}`)
            const fileResponse = await fetch(e.data.url)
            const blob = await fileResponse.blob()
            const localUrl = URL.createObjectURL(blob)
            setUrl(localUrl)
        } catch (error) {
            console.error("Error fetching PDF", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <IconButton size="small" color="primary" onClick={onViewClicked}>
                <Visibility fontSize="small" />
            </IconButton>

            <Dialog
                open={open}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
                onClose={() => setOpen(false)}
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 1.5, display: 'flex' }}>
                            <ReceiptLong fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="700">
                                Master Bill: {moment(bill.billing_end).format("MMMM YYYY")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Period: {moment(bill.billing_start).format("MMM DD")} - {moment(bill.billing_end).format("MMM DD")}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, height: isMobile ? 'calc(100vh - 80px)' : '85vh', overflow: 'hidden' }}>
                    <Grid container sx={{ height: '100%' }}>
                        {/* Left Side: PDF Viewer */}
                        <Grid size={{ xs: 12, md: 8 }} sx={{ height: isMobile ? '70vh' : '100%', borderRight: { xs: 'none', md: '1px solid' }, borderBottom: { xs: '1px solid', md: 'none' }, borderColor: 'divider' }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : bill.file_id ? (
                                <Box sx={{ width: '100%', height: '100%', bgcolor: '#ebebeb' }}>
                                    <embed
                                        src={url}
                                        type="application/pdf"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 'none' }}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                                    No PDF file associated.
                                </Box>
                            )}
                        </Grid>

                        {/* Right Side: Data Summary */}
                        <Grid size={{ xs: 12, md: 4 }} sx={{ p: 3, bgcolor: '#FAFAFA', height: '100%', overflowY: 'auto' }}>
                            <Typography variant="overline" color="text.secondary" fontWeight="700">EXTRACTED DATA</Typography>
                            <Stack spacing={2.5} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Total Amount</Typography>
                                    <Typography variant="h5" fontWeight="700" color="primary.main">
                                        ₱{numeral(bill.current).format("0,0.00")}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Grid container spacing={2}>
                                    <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">Consumption</Typography>
                                        <Typography variant="body1" fontWeight="600">{bill.consumption || '-'} {bill.type?.includes("Water") ? 'm³' : 'KWH'}</Typography>
                                    </Grid>
                                    <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">Unit Rate</Typography>
                                        <Typography variant="body1" fontWeight="600">₱{numeral(bill.price_per_unit).format("0.0000")}</Typography>
                                    </Grid>
                                </Grid>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Extraction Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="body2" color="success.main" fontWeight="600" display="flex" alignItems="center" gap={0.5}>
                                            <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%' }} />
                                            Success
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ pt: 2 }}>
                                    <Button fullWidth variant="outlined" color="inherit" onClick={() => window.open(url, '_blank')}>
                                        Download Original PDF
                                    </Button>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default AdminBillDetailsDialog
