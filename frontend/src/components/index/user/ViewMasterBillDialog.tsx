import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import api from "../../../utils/api"
import { confirm } from "material-ui-confirm"
import { ReceiptLong, Visibility } from "@mui/icons-material"


const AddMasterBillDialog = (props)=>{

    const [open,setOpen] = useState(false)
    const [url,setUrl] = useState("")
    const [loading,setLoading] = useState(false)

    const onViewClicked = async ()=>{

        setOpen(true)
        if(url != "") {
             return
        }
        setLoading(true)


        let e = await api.get(`/files/${props.item.file_id}`)
        const fileResponse = await fetch(e.data.url);
        const blob = await fileResponse.blob();
        
        // 3. Create a local "Object URL"
        const localUrl = URL.createObjectURL(blob);
        setUrl(localUrl);
        setLoading(false)
         
    }

    return <>
        <Dialog open={open} maxWidth="xl" fullWidth onClose={()=>setOpen(false)}>
            <DialogContent >
                {   loading ? 
                    <Box width="100%" sx={{height:"70vh", textAlign:"center"}}>
                        
                        <CircularProgress size={100} sx={{mt:"30vh"}}/>
                    </Box>:
                    <Box width="100%" sx={{height:"70vh"}}>
                    <embed
                        src={url}
                        
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    />
                </Box>}
            </DialogContent>
        </Dialog>

        <ListItem secondaryAction={<IconButton onClick={onViewClicked}>
            <Visibility />
        </IconButton>} >
            <ListItemButton onClick={()=>onViewClicked()}>
                <ListItemIcon>
                    <ReceiptLong />
                </ListItemIcon>
            <ListItemText>
                {props.item.filename}
            </ListItemText>
            </ListItemButton>
        </ListItem>
    </>


}

export default AddMasterBillDialog