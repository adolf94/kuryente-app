import { Card, CardContent, Grid, Skeleton, Typography } from "@mui/material"
import moment from "moment"
import ViewImageDialog from "../admin/ViewImageDialog"
import StatusChip from "../admin/StatusChip"
import numeral from 'numeral'




export const LoadingPaymentCard = ()=>{


    return <Card sx={{my:1}}>
        <CardContent>
            <Grid container> 
                <Grid size={6} sx={{pb:1}}>
                <Typography variant='body2'>
                    <Skeleton variant="text" height="1rem"/>
                </Typography>
                </Grid>
                <Grid size={6} sx={{textAlign:"right",pb:1}}>
                    <Skeleton variant="text" height="1rem"/>
                </Grid>
                <Grid size={4}>
                    <Typography variant='body2'>
                        <Skeleton variant="text" height="1rem"/>
                    </Typography>
                </Grid>
                <Grid size={4}>
                    <Typography variant='body2'>
                        
                    </Typography>
                </Grid>
                
                <Grid size={4} sx={{textAlign:"right",pb:1}}>
                        <Skeleton variant="text" height="1rem"/>
                </Grid>
                
            </Grid>
        </CardContent>
    </Card>
}

const PaymentCard = ({payment : e})=>{


    return <Card sx={{my:1}}>
        <CardContent>
            <Grid container> 
                <Grid size={6} sx={{pb:1}}>
                <Typography variant='body2'>
                    {moment(e.File.datetime).format("MMM DD")}
                </Typography>
                </Grid>
                <Grid size={6} sx={{textAlign:"right",pb:1}}>
                    <StatusChip value={e.Status} size="small"></StatusChip>
                </Grid>
                <Grid size={4}>
                    <Typography variant='body2'>
                                                
                        {e.File.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                        {e.File?.recipientBank}
                    </Typography>
                </Grid>
                <Grid size={4}>
                    <Typography variant='body2'>
                        {e.PaymentBy?.name || e.PaymentBy?.email || e.PaymentBy}
                    </Typography>
                </Grid>
                
                <Grid size={4} sx={{textAlign:"right",pb:1}}>
                    <Typography variant='body2'>
                    {numeral(e.File.amount).format("0,0.00")}</Typography>
                </Grid>
                
            </Grid>
        </CardContent>
    </Card>
}
export default PaymentCard