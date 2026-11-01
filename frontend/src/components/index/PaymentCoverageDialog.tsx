import { useState } from "react"
import { Alert, Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from "@mui/material"
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
    const perDay = payment.CoverageRate != null ? numeral(payment.CoverageRate).format("0,0.00") : "—"

    const excess = Number.parseFloat(payment.CoverageExcess ?? 0) || 0
    const excessNode = excess != 0 ? (
        <Tooltip title={excess > 0
            ? "Leftover amount from this payment (after rounding down whole days). It is carried over and applied to your next payment."
            : "A portion of previously carried-over amount was consumed by this payment. It was deducted from your next payment."}>
            <Chip
                size="small"
                variant="outlined"
                color={excess > 0 ? "warning" : "info"}
                label={excess > 0 ? `Excess ₱${numeral(excess).format("0,0.00")}` : `Credit used ₱${numeral(-excess).format("0,0.00")}`}
                sx={{ cursor: 'help' }}
            />
        </Tooltip>
    ) : null

    const credit = Number.parseFloat(payment.CoverageCredit ?? 0) || 0
    const creditNode = credit > 0 ? (
        <Tooltip title="Amount carried over from previous payments that was added to and applied by this payment.">
            <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={`Credit +₱${numeral(credit).format("0,0.00")}`}
                sx={{ cursor: 'help' }}
            />
        </Tooltip>
    ) : null

    const dayFmt = (d: any) => d ? moment(d).format("MMM DD, YYYY") : "—"
    const rowValue = (value: any) => <Typography variant="body1" fontWeight={700} noWrap>{value}</Typography>

    const rows = [
        {
            label: "Amount Paid",
            value: <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                {rowValue(`₱${numeral(payment.File?.amount).format("0,0.00")}`)}
                {creditNode}
            </Box>
        },
        {
            label: "Per Day",
            value: <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                {rowValue(`₱${perDay}`)}
                {excessNode}
            </Box>
        },
        { label: "Days Covered", value: rowValue(days > 0 ? `${days} ${days == 1 ? "day" : "days"}` : "—") },
        { label: "Coverage Start", value: rowValue(dayFmt(payment.CoverageStart)) },
        { label: "Coverage End", value: rowValue(dayFmt(payment.CoverageEnd)) },
    ]

    return <>
        {variant === "chip" ? (
            <Chip size="small" variant="outlined" color="success" label={coverage} onClick={() => setOpen(true)} sx={{ cursor: 'pointer' }} />
        ) : (
            <Typography
                variant="caption"
                component="span"
                role="button"
                tabIndex={0}
                onClick={() => setOpen(true)}
                onKeyDown={(evt: any) => { if (evt.key === "Enter" || evt.key === " ") setOpen(true) }}
                sx={{
                    display: 'inline-block', width: 'fit-content',
                    cursor: 'pointer', color: 'text.secondary',
                    '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                }}
            >
                Covers: {coverage}
            </Typography>
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
                            {row.value}
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
