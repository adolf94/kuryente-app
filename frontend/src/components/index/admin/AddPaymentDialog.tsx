import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Input, InputAdornment, MenuItem, TextField } from "@mui/material"
import NumberInput from "./NumberInput"
import { useMemo, useState } from "react"
import { useConfirm } from "material-ui-confirm"
import moment from "moment"
import api from "../../../utils/api"
import { useLoader } from "../../Loader"


const AddPaymentDialog = (props: any)=>{
    const [show, setShow] = useState(false)
    const [form,setForm] = useState({
        amount: 0,
        description: "",
        recipientBank:"Cash",
        datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
        days:0
    })
    const confirm = useConfirm()

    const {showLoading,hideLoading} = useLoader()
    
    const onAmountChange = (evt)=>{
        let days = Math.floor(evt / 150)
        setForm({...form, amount: evt, days: days})
    }

    const onSubmit = ()=>{
        confirm({
            title: "Confirm",
            description: `Are you sure to record ${form.amount}?`
          }).then((val)=>{
                if(!val) return
            if(val.confirmed)
                showLoading()
              return api.post("/record_payment", form)
                .then((res)=>{

                    confirm({
                        title: "Approved",
                        description: `Elec/Water has been extended till ${moment(res?.data.timer.DisconnectTime).format("MMM DD")}`,
                        hideCancelButton:true
                    })
                    props.onCreate(res.data)
                    setShow(false)
                    hideLoading()
                    setForm({
                        amount: 0,
                        description: "",
                        recipientBank:"Cash",
                        datetime: moment().format("YYYY-MM-DDTHH:mm:ss"),
                        days:0
                    })
                })
            })
    }

    const submitable = useMemo(()=>{
        if(!form.amount) return false
        return true
    },[form])

    return <>
    <Button variant="text" onClick={()=>{
        setShow(true)
    }}>Add Payment</Button>
    
    <Dialog open={show} onClose={()=>{
        setShow(false)
    }}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
            <Grid container spacing={2}>
                <Grid  size={12}>
                    <TextField type="date" value={form.datetime} fullWidth onChange={(evt)=>{
                        setForm({...form, datetime: evt.target.value})
                    }}></TextField>
                </Grid>
                <Grid  size={12}>
                    <TextField select value={form.recipientBank} fullWidth onChange={(evt)=>{
                        setForm({...form, recipientBank: evt.target.value})
                    }}>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="GCash">GCash</MenuItem>
                        <MenuItem value="BDO">BDO</MenuItem>
                        <MenuItem value="BPI">BPI</MenuItem>
                    </TextField>
                </Grid>
                <Grid  size={12}>
                    <NumberInput label="amount" variant="outlined" value={form.amount} onChange={onAmountChange}/>
                </Grid>
                <Grid  size={12}>
                    <NumberInput label="days"  variant="outlined" value={form.days} slotProps={{ input : {
                        endAdornment: <InputAdornment position="end">days</InputAdornment>
                    }}} onChange={(evt)=>{
                        setForm({...form, days: evt})
                    }}
                    inputProps={{ min: 0, style: { textAlign: "right" } }}/>
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