import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, useMediaQuery, useTheme } from "@mui/material"
import { Close } from "@mui/icons-material"
import React, { useRef, useState } from "react"
import api from "../../../utils/api"
import { confirm } from "material-ui-confirm"


const AddMasterBillDialog = (props: any) => {

    const fileRef = useRef<HTMLInputElement>(null)
    const [pdf, setPdf] = useState<File | null>(null)
    const [open,setOpen] = useState("")
    const [url,setUrl] = useState("")
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        
        if (event.target.files && event.target.files[0]) {
            setPdf(event.target.files[0])
            
            setUrl(URL.createObjectURL(event.target.files[0]) + "#view=FitW");
            setOpen("preview")
            // handleUpload(event.target.files[0])
        }
    }


    const onUploadClicked = async ()=>{
        
        if (fileRef.current) fileRef.current.value = ""
        // if(!user.isLoggedIn()){
        //     await api.get("/get_timer_info")
        // }
        fileRef.current?.click()
    }

    const onUpload = () => {
        setOpen("loading")
        const formData = new FormData();
        formData.append('file', pdf!);

        api.post('/upload_bill', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Optional: Track upload progress for the UI
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        }).then(() => {
            confirm({
                title: "Upload Successful",
            })
            setOpen("")
        }).catch(err => {
            console.error(err)
            setOpen("preview")
            confirm({
                title: "Upload Failed",
                description: "There was an error uploading the file. Please try again."
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
            <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={80} thickness={4} />
            </DialogContent>
        </Dialog>
        <Dialog open={open == "preview"} maxWidth="xl" fullWidth fullScreen={isMobile} onClose={()=>setOpen("")}>
            <DialogContent >
                <Box sx={{display: 'flex', justifyContent:"space-between", alignItems: 'center', pb:2}}>
                    {isMobile && <IconButton onClick={()=>setOpen("")}><Close/></IconButton>}
                    <Button variant="contained" fullWidth={isMobile} onClick={onUpload}>Upload</Button>
                </Box>
                <Box width="100%" sx={{height: isMobile ? "calc(100vh - 80px)" : "85vh"}}>
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