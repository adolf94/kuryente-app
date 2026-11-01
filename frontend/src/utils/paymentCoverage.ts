import moment from "moment"

const day = (d: string, withYear: boolean) => moment(d).format(withYear ? "MMM DD, YYYY" : "MMM DD")

/**
 * Human-readable coverage range a payment funds, e.g. "Feb 01 – Feb 12".
 * Returns null when the payment has no coverage (pending, rejected, no timers).
 */
export const formatPaymentCoverage = (payment: any): string | null => {
    if (payment?.Status !== "Approved") return null
    const end = payment.CoverageEnd
    if (!end) return null
    const start = payment.CoverageStart
    if (!start) return `Up to ${day(end, true)}`
    const sameYear = moment(start).year() === moment(end).year()
    return `${day(start, !sameYear)} – ${day(end, !sameYear)}`
}
