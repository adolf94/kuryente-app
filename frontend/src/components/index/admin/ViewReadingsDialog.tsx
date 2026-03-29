import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material"
import { Close, BarChart, FlashOn, WaterDrop } from "@mui/icons-material"
import { useState } from "react"
import moment from "moment"
import numeral from "numeral"

interface ViewReadingsDialogProps {
    readings: any[]
}

const ViewReadingsDialog = ({ readings }: ViewReadingsDialogProps) => {
    const [open, setOpen] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Sort readings by date descending
    const sortedReadings = [...readings].sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())

    return (
        <>
            <Button fullWidth variant="outlined" color="inherit" onClick={() => setOpen(true)}>
                View Full Readings Ledger
            </Button>

            <Dialog 
                open={open} 
                onClose={() => setOpen(false)} 
                maxWidth="md" 
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: { borderRadius: isMobile ? 0 : 2 }
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 1.5, display: 'flex' }}>
                            <BarChart fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="700">Historical Readings Ledger</Typography>
                            <Typography variant="caption" color="text.secondary">Comprehensive history of utility meter checks</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent dividers sx={{ p: 0 }}>
                    <TableContainer sx={{ maxHeight: '70vh' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Utility</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Reading</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Usage</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Rate</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC', textAlign: 'right' }}>Cost</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedReadings.map((r, i) => (
                                    <TableRow key={r.id || i} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500">
                                                {moment(r.date).format("MMM DD, YYYY")}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {r.type?.includes("Meralco") ? <FlashOn color="warning" fontSize="inherit" /> : <WaterDrop color="info" fontSize="inherit" />}
                                                <Typography variant="body2">{r.type}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{r.reading || '-'}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {r.consumption || 0} {r.type?.includes("Water") ? 'm³' : 'KWH'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>₱{numeral(r.per_unit || 0).format("0.00")}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                                            ₱{numeral((r.consumption || 0) * (r.per_unit || 0)).format("0,0.00")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sortedReadings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography variant="body2" color="text.secondary">No historical records found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ViewReadingsDialog
