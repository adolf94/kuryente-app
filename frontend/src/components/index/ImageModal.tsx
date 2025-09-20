import {  CloudUpload } from "@mui/icons-material";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, FormControlLabel, Grid, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { anonApi } from "../../utils/api";
import numeral from "numeral"
import {useConfirm} from 'material-ui-confirm'



const ImageModal = ()=>{
    const [image, setImage] = useState("")
    const [file, setFile] = useState<any>(null)
    const [result, setResult] = useState<any>(null)
    const [confirmation,setConfirmation] = useState()
    const [submitLoading,setLoading] = useState(false)
    const fileRef = useRef(null)
    const [show, setShow] = useState("")
    const [agree, setAgree] = useState(false)
    const confirm = useConfirm()

    const handleFileChange = (event) => {
        console.log(event.target.files)

                
        if (event.target.files && event.target.files[0]) {
            setImage(URL.createObjectURL(event.target.files[0]));
            setFile(event.target.files[0])
            setShow("upload")
            handleUpload(event.target.files[0])
        }

    }

    const handleCancel = ()=>{
        setShow("")
        fileRef!.current.value = null;
        setResult(null)
        setImage("")
    }


    const handleUpload = (file)=>{
        const formData = new FormData()
        formData.append("file",file)        
        formData.append("filename",file.name)

        anonApi.post("/upload_proof", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }).then(res=>{
            console.log(res)
            setResult(res.data)
            setAgree(res.data.recipientBank.toLowerCase().indexOf("gcash") > -1)
        })

    }


    const confirmPayment = ()=>{
        setShow("loading")
        anonApi.post("/confirm_payment", {
            fileId: result.fileId
        }).then(res=>{
            if(res.data.status == "Approved"){
                var data = {
                    title: "Approved",
                    variant: "success",
                    description: "Service should be reinstated in a few moments if it was disconnected"
                }
            }else{
                if(!res.data.reason){
                    var data = {
                        title: "Pending",
                        variant: "warning",
                        description: "Payment will be validated within the day. For automated validation, please use GCash."
                    } 
                }else{
                    var data = {
                        title: "Pending",
                        variant: "warning",
                        description: "We're experiencing issues at the moment. AR has been notified to validate in to the soonest"
                    } 

                }
            }
            setShow("")
            confirm(data)
        })
    }

    const calculateDays = (amount : number, transactionFee : number)=>{
        if(!amount) return 0;

        return Math.floor((amount - (transactionFee || 0)) / 150)

    }

    return <>
    <Dialog open={show == "loading"} slotProps={{
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
    <Dialog open={show == "upload"} maxWidth="md"  onClose={handleCancel}>

        <DialogContent sx={{p:1}}>
            <Grid container justifyContent="center">
                <Grid size={12} sx={{alignContent:"center", textAlign:"center"}}>
                    <Typography>Image Uploaded</Typography>
                    <Paper sx={{p:1}}>
                        <Box component="img" src={image} sx={{maxHeight:"50vh", maxWidth:"70vw"}} />
                    </Paper>

                </Grid>
                <Grid size={12} sx={{pt:2, p:1}}>
                    {result && result.isValid == false ? <Alert color="error">ERROR: {result.reason}. Please try to reupload</Alert> :
                    <TableContainer>
                        <Table  size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell><Typography variant="body1"><b>Source:</b> </Typography></TableCell>
                                    <TableCell>{result ? result?.recipientBank : <Skeleton variant="text" height="0.875rem" />}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Typography variant="body1"><b>Amount:</b> </Typography></TableCell>
                                    <TableCell>{result ? numeral(result?.amount).format("0,0.00") : <Skeleton variant="text" height="0.875rem" />}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Typography variant="body1"><b>Rate:</b> </Typography></TableCell>
                                    <TableCell> 150.00 / day</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Typography variant="body1"><b># of days:</b> </Typography></TableCell>
                                    <TableCell>{result ? calculateDays(result?.amount, result?.transactionFee) : <Skeleton variant="text" height="0.875rem" />} </TableCell>
                                </TableRow>
                                {!result ? null : result.recipientBank.toLowerCase().indexOf("gcash") == -1 ? <TableRow>
                                    <TableCell padding="checkbox" colSpan={2}>
                                        <FormControlLabel control={<Checkbox checked={agree}  onChange={(e)=>setAgree(e.target.checked)} />}
                                            label={<Typography variant="body2">I agree that this needs manual validation will take time, I will wait until kuya AR has time within the day.</Typography>} />
                                    </TableCell>
                                </TableRow>:<TableRow>
                                    <TableCell padding="checkbox" colSpan={2}>
                                        <Typography variant="body2"><b>GCash :</b> The system will check if the funds has been received on AR's account. Please allow few mins after sending the payment before submitting the form to ensure that it has been recorded first! </Typography>
                                    </TableCell>
                                </TableRow>
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    }
                    
                </Grid>
            </Grid>

        </DialogContent>
        <DialogActions>
            <Button size="small" variant="outlined" onClick={handleCancel}>Cancel</Button>
            <Button size="small" variant="contained" disabled={!result?.isValid || !agree} onClick={confirmPayment}>Accept</Button>
        </DialogActions>
    </Dialog>
    
    <Box sx={{pb:2, textAlign:"center"}}> 
        <input
            type="file"
            id="file-upload-input"
            ref={fileRef}
            style={{ display: 'none' }} // Or use MUI's VisuallyHiddenInput component
            onChange={handleFileChange}
        />
        <Button
            component="label" // Important: Makes the button act as a label for the input
            htmlFor="file-upload-input" // Links the button to the hidden input
            variant="contained"
            startIcon={<CloudUpload />} >
            Upload Payment proof
        </Button>
        <Typography variant='body2'><b>Current Rate: </b> PHP 150.00 per day</Typography>
    </Box>
    </>



}

export default ImageModal