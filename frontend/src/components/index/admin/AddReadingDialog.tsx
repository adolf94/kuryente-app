import { Box, Button, Dialog, DialogActions, DialogContent, MenuItem, TextField } from "@mui/material"
import moment from "moment"
import { useEffect, useState } from "react"
import api from "../../../utils/api"
import { useConfirm } from "material-ui-confirm"




const AddReadingDialog = ({onAdded,data}: {onAdded : (item: any)=>any, data:any[]})=>{
    const [open,setOpen] = useState(true)
    const [form, setForm] = useState({
        date:moment().add(-1,"day").format("YYYY-MM-DD"),
        type:"Manila Water",
        reading:0,
        consumption:0,
        per_unit:0
    })
    const [prev,setPrev] = useState<any>(null)
    const confirm = useConfirm()

    useEffect(()=>{
        let sorted = data.filter(e=>e.type.toLowerCase() == form.type.toLowerCase() && e.date < form.date).sort((a,b)=>a.date < b.date ? 1 : -1 )
        if(sorted.length > 0){
            setForm({...form, per_unit: sorted[0]?.per_unit})
            setPrev(sorted[0])
        }
    },[form.type, form.date, data])


    const addReading = ()=>{
         confirm({
            description: "Add reading?",
            confirmationText: "Yes, Add",
            cancellationText:"Cancel"
         }).then(e=>{
            api.post("add_reading", form)
                .then(res=>{
                    setOpen(false)
                    onAdded(res.data)
                    setForm({date:moment().add(-1,"day").format("YYYY-MM-DD"),
                        type:"Manila Water",
                        reading:0,
                        consumption:0,
                        per_unit:42})
                })
         })


    }

    return <>
        <Dialog open={open}>
            <DialogContent>
                <Box sx={{py:1}}>
                    <TextField type="date" label="Date" fullWidth size="small" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                </Box>
                <Box sx={{py:1}}>
                    <TextField label="Type" select fullWidth size="small" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                        <MenuItem value="Manila Water">Manila Water</MenuItem>
                        <MenuItem value="Meralco">Meralco</MenuItem>
                    </TextField>
                </Box>
                <Box sx={{py:1}}>
                    <TextField type="number" label="Reading" size="small" fullWidth value={form.reading} 
                        onBlur={e=>{
                            let consumption = prev == null ? form.consumption: form.reading - prev.reading
                            setForm({...form, consumption})
                        }}  
                        onChange={e=>setForm({...form, reading:Number.parseInt(e.target.value)})}/>
                </Box>
                <Box sx={{pt:1}}>
                    <TextField type="number" label="Consumption" size="small" fullWidth value={form.consumption} onChange={e=>setForm({...form, consumption:Number.parseInt(e.target.value)})}/>
                </Box>
                <Box sx={{py:1}}>
                    <TextField type="number" label="Price per unit" size="small" fullWidth value={form.per_unit} onChange={e=>setForm({...form, per_unit:Number.parseFloat(e.target.value)})}/>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="success" fullWidth onClick={addReading}>Add</Button>
            </DialogActions>
        </Dialog>
    </>
}

export default AddReadingDialog