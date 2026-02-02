import { Box, Button, CircularProgress, Dialog, DialogContent } from "@mui/material"
import React, { useRef, useState } from "react"
import api from "../../../utils/api"
import { confirm } from "material-ui-confirm"


const AddMasterBillDialog = (props)=>{

    const fileRef = useRef(null)
    const [pdf,setPdf] = useState(null)
    const [open,setOpen] = useState("")
    const [url,setUrl] = useState("")

    const handleFileChange = (event)=>{
        
        if (event.target.files && event.target.files[0]) {
            setPdf(event.target.files[0])
            
            setUrl(URL.createObjectURL(event.target.files[0]) + "#view=FitW");
            setOpen("preview")
            // handleUpload(event.target.files[0])
        }
    }


    const onUploadClicked = async ()=>{
        
        fileRef.current!.value = ""
        // if(!user.isLoggedIn()){
        //     await api.get("/get_timer_info")
        // }
        fileRef.current!.click()
    }

    const onUpload = ()=>{
        const formData = new FormData();
        formData.append('file', pdf);

        api.post('/upload_bill', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Optional: Track upload progress for the UI
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        }).then(e=>{
            confirm({
                title: "Upload Successful",
            })
        })
    }


    return <>
        <input
            type="file"
            id="file-upload-input"
            ref={fileRef}
            style={{ display: 'none' }} // Or use MUI's VisuallyHiddenInput component
            onChange={handleFileChange}
        />
        {React.cloneElement(props.children,{onClick:()=>onUploadClicked()})}
        <Dialog open={open == "loading"} slotProps={{
            paper:{
                sx: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                },
            }
            }}>
            <DialogContent>
                <CircularProgress size={100}/>
            </DialogContent>
        </Dialog>
        <Dialog open={open == "preview"} maxWidth="xl" fullWidth onClose={()=>setOpen("")}>
            <DialogContent >
                <Box sx={{textAlign:"right",pb:2}}>
                    <Button variant="contained" onClick={onUpload}>Upload</Button>
                </Box>
                <Box width="100%" sx={{height:"70vh"}}>
                    <embed
                        src={url}
                        
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    />
                </Box>
            </DialogContent>
        </Dialog>
    </>


}

export default AddMasterBillDialog