import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Input, InputAdornment, MenuItem, TextField } from "@mui/material"
import NumberInput from "./NumberInput"
import { useMemo, useState } from "react"
import { useConfirm } from "material-ui-confirm"
import moment from "moment"
import numeral from "numeral"
import api from "../../../utils/api"
import { useLoader } from "../../Loader"
import { usePaymentMutation } from "../../../repositories/repository"


interface AddPaymentDialogProps {
    onCreate : (output:any)=>any,
    item? : any

}


const AddPaymentDialog = (props: any)=>{
    const [show, setShow] = useState(false)
    const [form,setForm] = useState({
        amount: 0,
        rate: 150,
        description: "",
        recipientBank:"Cash",
        datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
        days:0
    })
    const confirm = useConfirm()
    const {add_admin} = usePaymentMutation()

    const {showLoading,hideLoading} = useLoader()
    
    const onAmountChange = (evt)=>{
        let days = Math.floor(evt / 150)
        setForm({...form, amount: evt, days: days})
    }
    const onFormChange = (field : string, value : number)=>{
        if(field == "amount"){
            setForm({...form, amount:value, days: Math.floor(value / form.rate)})
            return
        }
        setForm({
            ...form,
            days: field == "days" ? value : Math.floor( form.amount / form.rate),
            rate: field == "rate" ? value : form.amount / value
        })
    }

    const onSubmit = ()=>{
        if(!props.item?.id){
            confirm({
                title: "Confirm",
                description: `Are you sure to record ${numeral(form.amount).format("0,0.0")}?`
              }).then(async (val)=>{
                    if(!val) return
                if(val.confirmed)
                    showLoading()
                    let output  = await add_admin.mutateAsync(form)
                        confirm({
                            title: "Approved",
                            description: `Elec/Water has been extended till ${moment(res?.data.timer.DisconnectTime).format("MMM DD")}`,
                            hideCancelButton:true
                        })
                        props.onCreate(output)
                        setShow(false)
                        hideLoading()
                        setForm({
                            amount: 0,
                            description: "",
                            recipientBank:"Cash",
                            datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
                            rate:0,
                            days:0
                        })
                })
        }else{

        }
    }

    const submitable = useMemo(()=>{
        if(!form.amount) return false
        return true
    },[form.amount])

    return <>
    <Button variant="text" onClick={()=>{
        setShow(true)
    }}>Add Payment</Button>
    
    <Dialog open={show} maxWidth="xs" onClose={()=>{
        setShow(false) 
    }}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
            <Grid container spacing={2}>
                <Grid  size={12}>
                    <TextField type="date" value={form.datetime} fullWidth size="small" onChange={(evt)=>{
                        setForm({...form, datetime: evt.target.value})
                    }}></TextField>
                </Grid>
                <Grid  size={12}>
                    <TextField select value={form.recipientBank} fullWidth size="small" onChange={(evt)=>{
                        setForm({...form, recipientBank: evt.target.value})
                    }}>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="GCash">GCash</MenuItem>
                        <MenuItem value="BDO">BDO</MenuItem>
                        <MenuItem value="BPI">BPI</MenuItem>
                    </TextField>
                </Grid>
                <Grid  size={12}>
                    <NumberInput label="amount" variant="outlined" value={form.amount} size="small" onChange={(evt)=>onFormChange("amount", Number.parseFloat(evt ))}/>
                </Grid>
                <Grid  size={12}>
                    <TextField label="Payment By" size="small" fullWidth value={form.paymentBy} onChange={evt=>setForm({...form,paymentBy:evt.target.value})} />
                </Grid>
                <Grid  size={12}>
                    <NumberInput label="rate" variant="outlined" value={form.rate} size="small" onChange={(evt)=>onFormChange("rate", Number.parseFloat(evt) )}/>
                </Grid>
                <Grid  size={12}>
                    <NumberInput label="days"  variant="outlined" value={form.days} size="small" slotProps={{ input : {
                        endAdornment: <InputAdornment position="end">days</InputAdornment>
                    }}} 
                        onChange={(evt)=>onFormChange("days", Number.parseFloat(evt))} 
                    inputProps={{ min: 0, style: { textAlign: "right" } }} />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={()=>{
                setShow(false)
            }}>Cancel</Button>
            <Button disabled={!submitable} onClick={onSubmit}>Submit</Button>
        </DialogActions>
    </Dialog>
    </>
}

export default AddPaymentDialog