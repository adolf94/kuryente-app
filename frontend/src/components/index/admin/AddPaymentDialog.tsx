import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, MenuItem, TextField, useMediaQuery, useTheme } from "@mui/material"
import NumberInput from "./NumberInput"
import { useMemo, useState } from "react"
import { useConfirm } from "material-ui-confirm"
import moment from "moment"
import numeral from "numeral"
import { useLoader } from "../../Loader"
import { usePaymentMutation } from "../../../repositories/repository"

const AddPaymentDialog = (props: any) => {
    const [show, setShow] = useState(false)
    const [form, setForm] = useState({
        amount: 0,
        rate: 150,
        description: "",
        recipientBank: "Cash",
        datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
        days: 0,
        paymentBy: ""
    })
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const confirm = useConfirm()
    const { add_admin } = usePaymentMutation()

    const { showLoading, hideLoading } = useLoader()

    const onFormChange = (field: string, value: number) => {
        if (field == "amount") {
            setForm({ ...form, amount: value, days: Math.floor(value / form.rate) })
            return
        }
        setForm({
            ...form,
            days: field == "days" ? value : Math.floor(form.amount / form.rate),
            rate: field == "rate" ? value : form.amount / value
        })
    }

    const onSubmit = () => {
        if (!props.item?.id) {
            confirm({
                title: "Confirm",
                description: `Are you sure to record ${numeral(form.amount).format("0,0.0")}?`
            }).then(async (val) => {
                if (!val) return
                if (val.confirmed)
                    showLoading()
                let output = await add_admin.mutateAsync(form)
                confirm({
                    title: "Approved",
                    description: `Elec/Water has been extended till ${moment(output?.timer.DisconnectTime).format("MMM DD")}`,
                    hideCancelButton: true
                })
                props.onCreate(output)
                setShow(false)
                hideLoading()
                setForm({
                    amount: 0,
                    description: "",
                    recipientBank: "Cash",
                    datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
                    rate: 150,
                    days: 0,
                    paymentBy: ""
                })
            })
        } else {

        }
    }

    const submitable = useMemo(() => {
        if (!form.amount) return false
        return true
    }, [form.amount])

    return <>
        <Button variant="text" onClick={() => {
            setShow(true)
        }}>Add Payment</Button>

        <Dialog open={show} maxWidth="xs" fullWidth fullScreen={isMobile} onClose={() => {
            setShow(false)
        }}>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={12}>
                        <TextField type="datetime-local" label="Payment Date" value={form.datetime} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                            setForm({ ...form, datetime: evt.target.value })
                        }}></TextField>
                    </Grid>
                    <Grid size={12}>
                        <TextField select label="Recipient Bank" value={form.recipientBank} fullWidth size="small" onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                            setForm({ ...form, recipientBank: evt.target.value })
                        }}>
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="GCash">GCash</MenuItem>
                            <MenuItem value="BDO">BDO</MenuItem>
                            <MenuItem value="BPI">BPI</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={12}>
                        <NumberInput label="amount" variant="outlined" value={form.amount} size="small" onChange={(evt: string) => onFormChange("amount", Number.parseFloat(evt))} />
                    </Grid>
                    <Grid size={12}>
                        <TextField label="Payment By" size="small" fullWidth value={form.paymentBy} onChange={(evt: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, paymentBy: evt.target.value })} />
                    </Grid>
                    <Grid size={12}>
                        <NumberInput label="rate" variant="outlined" value={form.rate} size="small" onChange={(evt: string) => onFormChange("rate", Number.parseFloat(evt))} />
                    </Grid>
                    <Grid size={12}>
                        <NumberInput label="days" variant="outlined" value={form.days} size="small" slotProps={{
                            input: {
                                endAdornment: <InputAdornment position="end">days</InputAdornment>
                            }
                        }}
                            onChange={(evt: string) => onFormChange("days", Number.parseFloat(evt))}
                            inputProps={{ min: 0, style: { textAlign: "right" } }} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    setShow(false)
                }}>Cancel</Button>
                <Button variant="contained" disabled={!submitable} onClick={onSubmit}>Submit</Button>
            </DialogActions>
        </Dialog>
    </>
}

export default AddPaymentDialog