import { Box, Dialog, DialogContent, IconButton, Skeleton } from "@mui/material"
import { Image } from "@mui/icons-material"
import api from "../../../utils/api"
import { useState } from "react"
import { useLoader } from "../../Loader"


const ViewImageDialog = ({fileId})=>{
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [image, setImage] = useState("")

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
        <Dialog open={show} onClose={()=>{
            setShow(false)
        }}>
            <DialogContent>
                {loading?<Skeleton variant="rectangular" width="100%" height="50vh" animation="wave" sx={{minWidth:"30vw"}}></Skeleton>
                    :<Box component="img" src={image} sx={{maxHeight:"50vh", maxWidth:"70vw"}} /> }
            </DialogContent>
        </Dialog>
    </>
}

export default ViewImageDialog