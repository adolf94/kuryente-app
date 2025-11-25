
import { Settings } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, MenuItem, Stack, TextField } from "@mui/material";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useMemo, useState } from "react";

const BillPreferences = ()=>{
    const [open,setOpen] = useState(false)
    const [storage,setStorage] = useLocalStorage("billPrefs", {
        "Meralco" : 1,
        "Manila Water" : 1
    })
    const [state,setState] = useState(storage)

    const select = useMemo(()=>{
        
        let data = []
        data.push(<MenuItem value={1}>
            End of month
        </MenuItem>)
        for(let i = 1 ; i < 30; i++){
            data.push(<MenuItem value={i + 1}>
                {i}
            </MenuItem>)
        }
        return data

    },[])

    return <>
        <Button variant='outlined' size='small' onClick={()=>setOpen(true)}>
            <Settings fontSize='small' /> Preferences
        </Button>
        <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="xs" fullWidth>
            <DialogContent>
                <Stack>
                    <Box sx={{p:1}}>
                        <TextField value={state["Meralco"]} placeholder="select" label="Meralco Bill Cutoff" fullWidth select size="small"
                            onChange={(evt)=>setState({...state, "Meralco":Number.parseInt(evt.target.value)})}>
                            {...select}
                        </TextField>
                    </Box>
                    <Box sx={{p:1}}>
                        <TextField value={state["Manila Water"]} placeholder="select" label="Manila Water Cutoff" fullWidth select size="small"
                            onChange={(evt)=>setState({...state, "Meralco":Number.parseInt(evt.target.value)})}>
                            {...select}
                        </TextField>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={()=>{
                    setOpen(false)
                    setStorage(state)}}>Save</Button>
            </DialogActions>
        </Dialog>
    </>

}

export default BillPreferences