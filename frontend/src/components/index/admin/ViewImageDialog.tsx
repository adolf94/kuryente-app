import { Box, Dialog, DialogContent, IconButton, Skeleton, useMediaQuery, useTheme } from "@mui/material"
import { Image, Close } from "@mui/icons-material"
import api from "../../../utils/api"
import { useState } from "react"


const ViewImageDialog = ({ fileId }: { fileId: string }) => {
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [image, setImage] = useState("")
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const onIconClick = ()=>{
        
        setShow(true)
        if(image != "") {
             return
        }
        setLoading(true)


        api.get(`/files/${fileId}`)
            .then(e=>{
                setImage(e.data.url)
                setLoading(false)
            })   
    }


    return <>
        <IconButton onClick={onIconClick} sx={{padding:"4px"}}>
            <Image  fontSize="small" />
        </IconButton>
        <Dialog open={show} fullScreen={isMobile} maxWidth="md" fullWidth onClose={()=>{
            setShow(false)
        }}>
            {isMobile && <IconButton onClick={()=>setShow(false)} sx={{position:'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.7)'}}><Close/></IconButton>}
            <DialogContent sx={{ p: isMobile ? 0 : 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isMobile ? 'black' : 'inherit', minHeight: '50vh' }}>
                {loading?<Skeleton variant="rectangular" width="100%" height={isMobile ? "100vh" : "50vh"} animation="wave" sx={{minWidth: isMobile ? "100vw" : "30vw"}}></Skeleton>
                    :<Box component="img" src={image} sx={{maxHeight: isMobile ? "100vh" : "80vh", maxWidth: "100%", width: isMobile ? "100vw" : "auto", objectFit: 'contain'}} /> }
            </DialogContent>
        </Dialog>
    </>
}

export default ViewImageDialog