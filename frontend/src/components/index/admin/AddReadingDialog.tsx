import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, useMediaQuery, useTheme } from "@mui/material"
import moment from "moment"
import { useEffect, useState, type JSX } from "react"
import { useConfirm } from "material-ui-confirm"
import React from "react"
import { useReadingMutation } from "../../../repositories/repository"

const AddReadingDialog = ({onAdded,data, allowedTypes, children,admin}: {onAdded : (item: any)=>any, data:any[], allowedTypes:string[], children: JSX.Element, admin?: boolean})=>{
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [open,setOpen] = useState(false)
    const [form, setForm] = useState({
        date:moment().add(-1,"day").format("YYYY-MM-DD"),
        type:"Manila Water",
        reading:0,
        master_reading:0,
        consumption:0,
        master_consumption:0,
        per_unit:0
    })
    const [prev,setPrev] = useState<any>(null)
    const confirm = useConfirm()
    const {add_reading} = useReadingMutation()
    useEffect(()=>{
        let sorted = data.filter(e=>e.type.toLowerCase() == form.type.toLowerCase() && e.date < form.date).sort((a,b)=>a.date < b.date ? 1 : -1 )
        if(sorted.length > 0){
            setForm({...form, per_unit: sorted[0]?.per_unit})
            setPrev(sorted[0])
        }else{
            setForm({...form, per_unit: 0})
            setPrev(null)
        }

    },[form.type, form.date, data])


    const addReading = ()=>{
         confirm({
            description: "Add reading?",
            confirmationText: "Yes, Add",
            cancellationText:"Cancel"
         }).then(async () => {
             let output = await add_reading.mutateAsync(form as any)
                    setOpen(false)
                    onAdded(output)
                    setForm({date:moment().add(-1,"day").format("YYYY-MM-DD"),
                        type:"Manila Water",
                        reading:0,
                        master_reading:0,
                        consumption:0,
                        master_consumption:0,
                        per_unit:0
                    })
        }).catch(() => {})
         


    }

    return <>
        {React.cloneElement(children,{onClick:()=>setOpen(true)})}
        <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs" fullScreen={isMobile}>
            <DialogTitle>Add Utility Reading</DialogTitle>
            <DialogContent>
                <Box sx={{py:1, mt: 0.5}}>
                    <TextField type="date" label="Date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                </Box>
                <Box sx={{py:1}}>
                    <TextField label="Type" select fullWidth size="small" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                        {allowedTypes.map(e=><MenuItem value={e}>{e}</MenuItem>)}
                        
                    </TextField>
                </Box>
                <Box sx={{py:1}}>
                    <TextField type="number" label="Sub-meter Reading" size="small" fullWidth value={form.reading} 
                        onBlur={()=>{
                            let consumption = prev == null ? form.consumption: form.reading - prev.reading
                            let master_consumption = prev == null? form.master_consumption : form.master_reading - (prev.master_reading || 0)
                            setForm({...form, consumption, master_consumption})
                        }}  
                        onChange={e=>setForm({...form, reading:Number.parseInt(e.target.value) || 0})}/>
                </Box>
                <Box sx={{py:1}}>
                    <TextField type="number" label="Master Meter Reading" size="small" fullWidth value={form.master_reading} 
                        onBlur={()=>{
                            let consumption = prev == null ? form.consumption: form.reading - prev.reading
                            let master_consumption = prev == null? form.master_consumption : form.master_reading - (prev.master_reading || 0)
                            setForm({...form, consumption, master_consumption})
                        }}  
                        onChange={e=>setForm({...form, master_reading:Number.parseInt(e.target.value) || 0})}/>
                </Box>
                <Box sx={{pt:1, display: 'flex', gap: 1}}>
                    <TextField type="number" label="Consumption" size="small" disabled={!admin} fullWidth value={form.consumption} onChange={e=>setForm({...form, consumption:Number.parseFloat(e.target.value)})}/>
                    <TextField type="number" label="Master Cons." size="small" disabled={!admin} fullWidth value={form.master_consumption} onChange={e=>setForm({...form, master_consumption:Number.parseFloat(e.target.value)})}/>
                </Box>
                <Box sx={{py:1}}>
                    <TextField type="number" label="Price per unit" disabled={!admin} size="small" fullWidth value={form.per_unit} onChange={e=>setForm({...form, per_unit:Number.parseFloat(e.target.value)})}/>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="text" color="inherit" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button variant="contained" color="success" onClick={addReading}>Add</Button>
            </DialogActions>
        </Dialog>
    </>
}

export default AddReadingDialog