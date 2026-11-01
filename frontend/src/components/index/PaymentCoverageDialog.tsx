import { useState } from "react"
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material"
import { Close } from "@mui/icons-material"
import moment from "moment"
import numeral from "numeral"
import { formatPaymentCoverage } from "../../utils/paymentCoverage"

/**
 * Renders the coverage range of an approved payment as a clickable text link
 * (or chip) that opens a dialog explaining the amount paid, the effective
 * per-day rate, and the coverage start and end dates.
 */
const PaymentCoverageDialog = ({ payment, variant = "text" }: { payment: any, variant?: "text" | "chip" }) => {
    const [open, setOpen] = useState(false)

    const coverage = formatPaymentCoverage(payment)
    if (!coverage) return null

    const days = Number.parseFloat(payment.Days ?? 0)
    const perDay = payment.CoverageRate
        ? numeral(payment.CoverageRate).format("0,0.00")
        : (days > 0 ? numeral(Number.parseFloat(payment.File?.amount) / days).format("0,0.00") : "—")

    const dayFmt = (d: any) => d ? moment(d).format("MMM DD, YYYY") : "—"

    const rows = [
        { label: "Amount Paid", value: `₱${numeral(payment.File?.amount).format("0,0.00")}` },
        { label: "Per Day", value: `₱${perDay}${!payment.CoverageRate && days > 0 ? " (est.)" : ""}` },
        { label: "Days Covered", value: days > 0 ? `${days} ${days == 1 ? "day" : "days"}` : "—" },
        { label: "Coverage Start", value: dayFmt(payment.CoverageStart) },
        { label: "Coverage End", value: dayFmt(payment.CoverageEnd) },
    ]

    return <>
        {variant === "chip" ? (
            <Chip size="small" variant="outlined" color="success" label={coverage} onClick={() => setOpen(true)} sx={{ cursor: 'pointer' }} />
        ) : (
            <Button
                size="small"
                onClick={() => setOpen(true)}
                sx={{
                    p: 0, minWidth: 0, textTransform: 'none', textAlign: 'left',
                    color: 'text.secondary', justifyContent: 'flex-start',
                    '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
                }}
            >
                Covers: {coverage}
            </Button>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700">Payment Coverage Details</Typography>
                <IconButton aria-label="close" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 1 }}>
                <Stack divider={<Box borderTop="1px solid" borderColor="divider" />}>
                    {rows.map(row => (
                        <Box key={row.label} py={1.5} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>{row.label}</Typography>
                            <Typography variant="body1" fontWeight={700} noWrap>{row.value}</Typography>
                        </Box>
                    ))}
                </Stack>
                <Alert severity="info" icon={false} sx={{ my: 2, border: '1px solid', borderColor: 'info.light', bgcolor: 'info.50' }}>
                    <Typography variant="caption" color="text.secondary">
                        Disconnection may be extended, but payments are still applied to the original disconnection date.
                    </Typography>
                </Alert>
            </DialogContent>
        </Dialog>
    </>
}

export default PaymentCoverageDialog
