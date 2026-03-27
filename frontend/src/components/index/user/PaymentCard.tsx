import { Box, ListItem, ListItemText, Skeleton, Typography } from "@mui/material"
import moment from "moment"
import ViewImageDialog from "../admin/ViewImageDialog"
import StatusChip from "../admin/StatusChip"
import numeral from 'numeral'

export const LoadingPaymentCard = ()=>{
    return <ListItem divider>
        <ListItemText 
            primary={<Skeleton variant="text" width="60%" />}
            secondary={<Skeleton variant="text" width="40%" />}
        />
        <Box textAlign="right">
            <Skeleton variant="text" width="80px" />
            <Skeleton variant="text" width="100px" />
        </Box>
    </ListItem>
}

const PaymentCard = ({payment : e} : {payment: any})=>{
    return <ListItem divider sx={{ py: 2, alignItems: 'flex-start' }}>
        <ListItemText
            primary={
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                        {moment(e.File.datetime).format("MMM DD")}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="600">
                        {e.File?.recipientBank}
                    </Typography>
                    {e.File.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                </Box>
            }
            secondary={
                <Typography variant="body2" color="text.secondary">
                    By: {e.PaymentBy?.name || e.PaymentBy?.email || e.PaymentBy}
                </Typography>
            }
            sx={{ m: 0 }}
        />
        <Box textAlign="right" display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
            <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                {numeral(e.File.amount).format("0,0.00")}
            </Typography>
            <StatusChip value={e.Status} size="small" />
        </Box>
    </ListItem>
}
export default PaymentCard