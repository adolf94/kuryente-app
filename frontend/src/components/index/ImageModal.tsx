import { Close, CloudUpload } from "@mui/icons-material";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Paper, Skeleton, Stack, Divider, Typography, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import numeral from "numeral"
import { useConfirm } from 'material-ui-confirm'
import { anonApi } from "../../utils/apiOld";
import useLogin from "../GoogleLoginWrapper";
import api from "../../utils/api";
import moment from "moment";

interface ImageModalProps {
    timer: any,
    onComplete: (data: any) => void
}

const ImageModal = ({ timer, onComplete = () => { } }: ImageModalProps) => {
    const [image, setImage] = useState("")
    const [file, setFile] = useState<any>(null)
    const [result, setResult] = useState<any>(null)
    const [confirmation, setConfirmation] = useState()
    const [submitLoading, setLoading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const [show, setShow] = useState("")
    const [agree, setAgree] = useState(false)
    const confirm = useConfirm()
    const { user, isTokenRefreshing, setUser } = useLogin()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const handleFileChange = (event: any) => {
        if (event.target.files && event.target.files[0]) {
            setImage(URL.createObjectURL(event.target.files[0]));
            setFile(event.target.files[0])
            setShow("upload")
            handleUpload(event.target.files[0])
        }
    }

    const handleCancel = () => {
        setShow("")
        if (fileRef.current) fileRef.current.value = "";
        setResult(null)
        setImage("")
        setAgree(false)
    }

    const handleUpload = (file: any) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("filename", file.name)

        api.post("/upload_proof", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }).then(res => {
            setResult(res.data)
            setAgree((res.data.recipientBank || "").toLowerCase().indexOf("gcash") > -1)
        })
    }

    const confirmPayment = () => {
        setShow("loading")
        api.post("/confirm_payment", {
            fileId: result.fileId
        }).then(res => {
            let data: any;
            if (res.data.data.Status === "Approved") {
                data = {
                    title: "Approved",
                    variant: "success",
                    description: "Service should be reinstated in a few moments if it was disconnected"
                }
            } else {
                if (!res.data?.data?.reason) {
                    data = {
                        title: "Pending",
                        variant: "warning",
                        description: "Payment will be validated within the day. For automated validation, please use GCash."
                    }
                } else {
                    data = {
                        title: "Pending",
                        variant: "warning",
                        description: "We're experiencing issues at the moment. AR has been notified to validate to the soonest"
                    }
                }
            }
            setShow("")
            confirm(data)
            onComplete(res.data)
        }).catch(ex => {
            const status = ex?.response?.status;
            let message = "Something went wrong. Kindly send via FB / Messenger";


            confirm({
                title: "Error occurred",
                description: message,
                hideCancelButton: true
            })
            setShow("")
        })
    }

    const calculateDays = (amount: number, transactionFee: number) => {
        if (!amount) return 0;
        return Math.floor((amount - (transactionFee || 0)) / timer?.Rate)
    }

    const computation = useMemo(() => {
        if (!result) return { days: null, endDate: null }
        const days = calculateDays(result.amount, result.transactionFee)
        const endDate = moment(timer.DisconnectTime).isBefore(moment()) ? "" : moment(timer.DisconnectTime).add(days, "days").format("MMM DD")

        return {
            days,
            endDate
        }
    }, [result, timer])

    const onUploadClicked = async () => {
        if (fileRef.current) fileRef.current.value = ""
        if (!user.isLoggedIn()) {
            await anonApi.get("/get_timer_info")
        }
        if (fileRef.current) fileRef.current.click()
    }

    return <>
        <Dialog open={show === "loading"} slotProps={{
            paper: {
                sx: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                },
            }
        }}>
            <DialogContent>
                <CircularProgress size={100} thickness={4} />
            </DialogContent>
        </Dialog>

        <Dialog
            open={show === "upload"}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            onClose={handleCancel}
        >
            <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="600">Review Payment Details</Typography>
                {isMobile && (
                    <IconButton edge="end" color="inherit" onClick={handleCancel} aria-label="close">
                        <Close />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC' }}>
                <Grid container spacing={4} direction={{ xs: 'column-reverse', md: 'row' }}>
                    {/* Image Preview Area */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600" letterSpacing={0.5}>
                            RECEIPT PREVIEW
                        </Typography>
                        <Paper elevation={0} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'center', bgcolor: '#FFFFFF', minHeight: 300, alignItems: 'center' }}>
                            <Box component="img" src={image} sx={{ maxHeight: "60vh", maxWidth: "100%", objectFit: 'contain', borderRadius: 1 }} />
                        </Paper>
                    </Grid>

                    {/* Data Extraction Area */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600" letterSpacing={0.5}>
                            EXTRACTED DETAILS
                        </Typography>

                        {result && result.isValid === false ? (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                <strong>Error Analysis:</strong> {result.reason}. Please try re-uploading a clearer image of your receipt.
                            </Alert>
                        ) : (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#FFFFFF', mb: 2, minHeight: 180 }}>
                                {!result ? (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} py={4}>
                                        <CircularProgress size={32} />
                                        <Typography variant="body2" color="text.secondary">Analyzing receipt data...</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={2} divider={<Divider />}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="text.secondary">Source Bank</Typography>
                                            <Typography variant="body1" fontWeight="600">{result.recipientBank}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                                            <Typography variant="h6" color="primary.main" fontWeight="700">PHP {numeral(result.amount).format("0,0.00")}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="text.secondary">Daily Rate</Typography>
                                            <Typography variant="body2">PHP {numeral(timer?.Rate).format("0,0.00")}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Typography variant="body2" color="text.secondary" mt={0.5}>Extension Granted</Typography>
                                            <Box textAlign="right">
                                                <Typography variant="h6" fontWeight="700" color="secondary.main">{computation.days} Days</Typography>
                                                {computation.endDate && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Until {computation.endDate}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Stack>
                                )}
                            </Paper>
                        )}

                        {result && result.isValid !== false && (
                            <Stack spacing={2} sx={{ mt: 3 }}>
                                {result.recipientBank.toLowerCase().indexOf("gcash") === -1 && (
                                    <Alert severity="info" sx={{ borderRadius: 2, '.MuiAlert-message': { width: '100%' } }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} size="small" />}
                                            label={<Typography variant="body2">Requires manual validation. Please wait until AR confirms it within the day.</Typography>}
                                            sx={{ m: 0, alignItems: 'flex-start', '.MuiFormControlLabel-label': { mt: 0.5 } }}
                                        />
                                    </Alert>
                                )}

                                {result.recipientBank.toLowerCase().indexOf("gcash") !== -1 && (
                                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                                        <strong>GCash Detected:</strong> System will automatically verify this payment. Ensure funds are received before submitting.
                                    </Alert>
                                )}
                            </Stack>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, md: 4 }, py: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
                <Button onClick={handleCancel} color="inherit" sx={{ fontWeight: 600, mr: 1 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    disabled={!result?.isValid || (result.recipientBank.toLowerCase().indexOf("gcash") === -1 && !agree)}
                    onClick={confirmPayment}
                    sx={{ px: 4, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                    Submit Payment Proof
                </Button>
            </DialogActions>
        </Dialog>

        <Box sx={{ pb: 2, textAlign: "center" }}>
            <input
                type="file"
                id="file-upload-input"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
            />
            <Button
                component="label"
                variant="contained"
                disabled={isTokenRefreshing}
                startIcon={<CloudUpload />}
                onClick={() => onUploadClicked()}
                fullWidth={false}
                size="large"
                sx={{ 
                    borderRadius: 3, 
                    px: 3, 
                    py: 1.2, 
                    textTransform: 'none', 
                    fontWeight: 800,
                    boxShadow: '0 8px 16px rgba(33, 150, 243, 0.2)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 20px rgba(33, 150, 243, 0.3)'
                    }
                }}
            >
                Extend Service
            </Button>
            <Typography variant='body2' color="text.secondary" display="block">
                <b>Current Rate: </b>
                {!timer ? <Skeleton variant="text" width="7rem" sx={{ display: "inline-flex" }} /> : `PHP ${numeral(timer?.Rate).format("0,0.00")} / day`}
            </Typography>
        </Box>
    </>
}

export default ImageModal