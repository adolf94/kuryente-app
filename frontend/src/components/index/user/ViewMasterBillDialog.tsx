import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme } from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import api from "../../../utils/api"
import { confirm } from "material-ui-confirm"
import { Close, ReceiptLong, Visibility } from "@mui/icons-material"

const AddMasterBillDialog = (props: any) => {

    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const onViewClicked = async () => {
        setOpen(true)
        if (url !== "") {
             return
        }
        setLoading(true)

        try {
            let e = await api.get(`/files/${props.item.file_id}`)
            const fileResponse = await fetch(e.data.url)
            const blob = await fileResponse.blob()
            
            // Create a local "Object URL"
            const localUrl = URL.createObjectURL(blob)
            setUrl(localUrl)
        } catch (error) {
            console.error("Error fetching PDF", error)
        } finally {
            setLoading(false)
        }
    }

    return <>
        <Dialog 
            open={open} 
            maxWidth="xl" 
            fullWidth 
            fullScreen={isMobile} 
            onClose={() => setOpen(false)}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ pr: 2 }}>
                    {props.item.filename}
                </Typography>
                <IconButton aria-label="close" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0, height: isMobile ? 'calc(100vh - 64px)' : '75vh' }}>
                {loading ? 
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress size={60} />
                    </Box> :
                    <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
                        <embed
                            src={url}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                        />
                    </Box>
                }
            </DialogContent>
        </Dialog>

        <ListItem secondaryAction={
            <IconButton edge="end" onClick={onViewClicked} color="primary">
                <Visibility />
            </IconButton>
        }>
            <ListItemButton onClick={() => onViewClicked()}>
                <ListItemIcon>
                    <ReceiptLong />
                </ListItemIcon>
                <ListItemText primary={props.item.filename} />
            </ListItemButton>
        </ListItem>
    </>
}

export default AddMasterBillDialog