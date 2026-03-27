import { Box, Button, Card, CardActions, CardContent, Divider, Skeleton, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import numeral from "numeral"
import { BILL, getBills, useAllBills, useAllPayments, useAllReading } from "../../../repositories/repository"
import useBillComputation from "../../../utils/useBillComputation"
import { useEffect, useMemo } from "react"
import moment from "moment"
import { useNavigate } from "@tanstack/react-router"
import { ArrowForwardIos } from "@mui/icons-material"

const BillCard = ({item, date} : {item:any, date:Date})=>{
    const navigate = useNavigate()

    const {result:bill,isLoading } = useBillComputation(moment(date))
    return <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}>
        <CardContent sx={{ pb: 1, flexGrow: 1 }}>
            <Typography variant='overline' color="text.secondary" fontWeight="700">
                {moment(date).format("MMM YYYY")}
            </Typography>
            <Typography variant='h4' fontWeight="700" color="primary.main" sx={{ mt: 1, mb: 3 }}>
                P {numeral(bill?.current).format("0,0.00")}
            </Typography>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant='body2' color="text.secondary">Payments Made</Typography>
                <Typography variant='body2' fontWeight="500">P {numeral(bill?.totalPayment).format("0,0.00")}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
                <Typography variant='body2' color="text.secondary">Remaining Balance</Typography>
                <Typography variant='body2' fontWeight="600" color={bill?.balance > 0 ? 'error.main' : 'text.primary'}>
                    P {numeral(bill?.balance).format("0,0.00")}
                </Typography>
            </Box>
        </CardContent>
        <Divider />
        <CardActions>
            <Button size="small" endIcon={<ArrowForwardIos sx={{ fontSize: '10px' }} />} fullWidth sx={{ justifyContent: 'space-between', px: 2, color: 'text.secondary' }} onClick={()=>navigate({to: `/user/bills/${bill.id}`})}>
                View Details
            </Button>
        </CardActions>
    </Card>
}

export const LoadingBillCard = ()=>{
    return <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ pb: 1, flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height="1.5rem" />
            <Skeleton variant="text" width="80%" height="4rem" sx={{ mt: 1, mb: 1 }} />
            <Box display="flex" justifyContent="space-between" mb={1} mt={3}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="30%" />
            </Box>
            <Box display="flex" justifyContent="space-between">
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="35%" />
            </Box>
        </CardContent>
        <Divider />
        <CardActions>
            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: 1 }} />
        </CardActions>
    </Card>
}

export const UnbilledBillCard = ({payments} : {payments: any})=>{
    const {result:bill,isLoading } = useBillComputation(moment().set("D",1))
    const navigate = useNavigate()

    const paymentAfter = useMemo(()=>{
        return payments.filter((e: any)=>{
           return e.DateAdded > bill?.dateEnd
        }).reduce((prev: number,cur: any)=>{
            return prev + cur.File.amount
        },0)
    },[payments,bill])

    const outstanding = bill?.balance - paymentAfter;

    return <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <CardContent sx={{ pb: 1, flexGrow: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant='overline' color="primary.700" fontWeight="700">
                    {moment(bill?.id).add(1,"month").format("MMM YYYY")} (Current)
                </Typography>
            </Box>
            
            <Typography variant='h4' fontWeight="700" color="text.primary" sx={{ mt: 1, mb: 3 }}>
                P 0.00
            </Typography>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant='body2' color="primary.800">Advanced Payments</Typography>
                <Typography variant='body2' fontWeight="500" color="primary.900">P {numeral(paymentAfter).format("0,0.00")}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" p={1} bgcolor="#FFFFFF" borderRadius={1} border="1px solid" borderColor="primary.100">
                <Typography variant='body2' fontWeight="600" color={outstanding > 0 ? "error.main" : "primary.700"}>
                    Outstanding Balance
                </Typography>
                <Typography variant='body2' fontWeight="700" color={outstanding > 0 ? "error.main" : "primary.900"}>
                    P {numeral(outstanding).format("0,0.00")}
                </Typography>
            </Box>
        </CardContent>
        <Divider sx={{ borderColor: 'primary.100' }} />
        <CardActions>
            <Button size="small" endIcon={<ArrowForwardIos sx={{ fontSize: '10px' }} />} fullWidth sx={{ justifyContent: 'space-between', px: 2 }} onClick={()=>navigate({to: `/user/bills/current`})}>
                View Status
            </Button>
        </CardActions>
    </Card>
}

export default BillCard