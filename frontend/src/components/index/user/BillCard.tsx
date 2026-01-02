import { Button, Card, CardActions, CardContent, Skeleton, TextField, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import numeral from "numeral"
import { BILL, getBills, useAllBills, useAllPayments, useAllReading } from "../../../repositories/repository"
import useBillComputation from "../../../utils/useBillComputation"
import { useEffect, useMemo } from "react"
import moment from "moment"
import { useNavigate } from "@tanstack/react-router"

const BillCard = ({item, date} : {item:any, date:Date})=>{
    const navigate = useNavigate()

    const dateToCompute = useMemo(()=>{
    },[date])
    const {result:bill,isLoading } = useBillComputation(moment(date))
    return <Card>
        {/* <CardHeader title={<Typography variant='h6'>P 4,325.01</Typography>} subheader='Nov 2025'></CardHeader> */}
        <CardContent>

            <Typography variant='h6'>P {numeral(bill?.current).format("0,0.00")}</Typography>
            <Typography variant='body2'>{moment(date).format("MMM YYYY")}</Typography>
            <Typography variant='body2'>Payments:P {numeral(bill?.totalPayment).format("0,0.00")}</Typography>
            <Typography variant='body2'>Balance:P {numeral(bill?.balance).format("0,0.00")} </Typography>
        </CardContent>
        <CardActions sx={{justifyContent:"end"}}>
            <Button variant="outlined" onClick={()=>navigate({to: `/user/bills/${bill.id}`})}>View</Button>
        </CardActions>
    </Card>
}
export const LoadingBillCard = ()=>{
    return <Card>
        {/* <CardHeader title={<Typography variant='h6'>P 4,325.01</Typography>} subheader='Nov 2025'></CardHeader> */}
        <CardContent>
            
            <Skeleton variant="text" height="2.5rem" width="50%" />
            <Skeleton variant="text" height="1rem" width="35%" />
            <Skeleton variant="text" height="1rem" width="75%" />
            <Skeleton variant="text" height="1rem" width="75%" />
        </CardContent>
        <CardActions sx={{justifyContent:"end"}}>
            <Button variant="outlined" disabled>View</Button>
        </CardActions>
    </Card>
}

export const UnbilledBillCard = ({payments})=>{
    const {result:bill,isLoading } = useBillComputation(moment().set("D",1))
    const navigate = useNavigate()

    const paymentAfter = useMemo(()=>{
        return payments.filter(e=>{
           return e.DateAdded > bill?.dateEnd
        }).reduce((prev,cur)=>{
            return prev + cur.File.amount
        },0)
    },[payments,bill])

    return <Card>
        <CardContent>
            <Typography variant='h6'>P {numeral(0).format("0,0.00")}</Typography>
            <Typography variant='body2'>{moment(bill?.id).add(1,"month").format("MMM YYYY")}</Typography>
            <Typography variant='body2'>Payments:P {numeral(paymentAfter).format("0,0.00")}</Typography>
            <Typography variant='body2' fontWeight="bold">Outstanding Balance: P {numeral(bill?.balance - paymentAfter).format("0,0.00")}</Typography>
        </CardContent>
        <CardActions sx={{justifyContent:"end"}}>
            <Button variant="outlined" onClick={()=>navigate({to: `/user/bills/current`})}>View</Button>
        </CardActions>
    </Card>
}

export default BillCard