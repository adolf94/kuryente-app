import { Alert, Box, Button, Card, CardActions, CardContent, CardHeader, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import useBillComputation from '../../../utils/useBillComputation'
import moment from 'moment'
import numeral from 'numeral'
import { useMemo } from 'react'
import { ChevronLeft, ExpandMore } from '@mui/icons-material'
import { useAllPayments } from '../../../repositories/repository'

export const Route = createFileRoute('/user/bills/current')({
  component: RouteComponent,
})

function RouteComponent() {
    const router = useRouter()
    const {result:bill,isLoading } = useBillComputation(moment().set("D",1))
    const {data: payments} = useAllPayments()
    const currentPayments =  useMemo<any>(()=>(payments || []).filter(e=>{
           return e.DateAdded > bill?.dateEnd
        }),[payments])


    const paymentAfter = useMemo(()=>{
        return currentPayments.reduce((prev,cur)=>{
            return prev + cur.File.amount
        },0)
    },[currentPayments,bill])


    const readings = []
    if(isLoading) return <></>
    return <>
      <Grid container >
        <Grid size={12}>
          <Button size="large" onClick={()=>router.history.back()}><ChevronLeft /> Back</Button>
        </Grid>
        <Grid container size={12}>
          <Grid size={{xs:12,sm:6,md:4}} sx={{p:1}}>
            <Typography variant='h6'>Bill Summary</Typography>
            <Card>
              <CardContent>
                <Table size='small'>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{border:"none"}}>
                        <Typography variant='subtitle1'>Previous Unpaid Balance</Typography>
                        <Typography variant='body2' color="textDisabled">as of {moment().set("D",1).format("MMM DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", border:"none"}}>
                        <Typography variant='subtitle1'> {numeral(bill?.balance).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography variant='subtitle1'>Payments</Typography>
                        <Typography variant='body2' color="textDisabled">{moment().set("D",1).format("MM/DD")} - {moment().format("MM/DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right"}}>
                        <Typography variant='subtitle1'> - {numeral(paymentAfter).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{border:"none"}}>
                        <Typography variant='subtitle1' fontWeight="bold">Outstanding Balance</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", border:"none"}}>
                        <Typography variant='subtitle1' fontWeight="bold">{numeral(bill?.balance - paymentAfter).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell  sx={{borderTop:"2px"}}>
                        <Typography variant='subtitle1'>Utility Usage</Typography>
                        <Typography variant='body2' color="textDisabled">No bill generated yet</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", borderTop:"2px"}}>
                        <Typography variant='subtitle1'>+ {numeral(0).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{display:"none"}}>
                      <TableCell  sx={{borderTop:"2px"}}>
                        <Typography variant='subtitle1'>Utility Usage</Typography>
                        <Typography variant='body2' color="textDisabled">{moment(bill?.dateStart).format("MM/DD")} - {moment(bill?.dateEnd).format("MM/DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", borderTop:"2px"}}>
                        <Typography variant='subtitle1'>+ {numeral(bill?.current).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{display:"none"}}>
                      <TableCell  sx={{borderTop:"2px"}}>
                        <Typography variant='subtitle1' fontWeight="bold">Outstanding Balance</Typography>
                        <Typography variant='body2' color="textDisabled">as of {moment(bill?.dateEnd).add(1,"day").format("MMM DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", borderTop:"2px"}}>
                        <Typography variant='subtitle1' fontWeight="bold">{numeral(bill?.balance).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{xs:12,sm:6,md:4}} >
        <Grid size={12} sx={{px:1,pt:1}}>
          <Typography variant='h5'>Readings</Typography>
          <Alert color='warning'>No Readings yet. Will be done on the first day of the next month</Alert>
            
        </Grid>
          </Grid>
          <Grid container size={{xs:12,sm:6,md:4}} sx={{display:'block',justifyContent:"center"}}>
            <Grid size={12} sx={{px:1,pt:1}}>
              <Typography variant='h5'>Payments</Typography>
            </Grid>
            <Grid size={12}>
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          Date
                        </TableCell>
                        <TableCell>
                          Method
                        </TableCell>
                        <TableCell>
                          Rate
                        </TableCell>
                        <TableCell>
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPayments.map(item=><TableRow key={item.id}>
                        <TableCell>{moment(item.DateAdded).format("MM/DD")}</TableCell>
                        <TableCell>{item.File.recipientBank} <br /> {item.PaymentBy?.Name || item.PaymentBy?.Email} </TableCell>
                        <TableCell>{numeral(item.Rate).format("0.00")}</TableCell>
                        <TableCell sx={{textAlign:"right"}}>{numeral(item.File.amount).format("0,0.00")}</TableCell>
                      </TableRow>)}
                      <TableRow>
                        <TableCell colSpan={2}>
                            <Typography variant="subtitle2" fontWeight="bold">Total Payments</Typography>
                        </TableCell>
                        <TableCell colSpan={2} sx={{textAlign:"right"}}>
                            <Typography variant="subtitle2" fontWeight="bold">{numeral(paymentAfter).format("0,0.00")}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid container size={12} display="none">
          <Grid size={{xs:12,sm:6,md:4}} sx={{p:1}}>
            <Card>
              <CardContent>
                <Typography variant='h6'>{numeral(bill?.current).format("0,0.00")}</Typography>
                <Typography variant='subtitle2'>Utility Usage as of {bill?.dateEnd}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}} sx={{p:1}}>
            <Card>
              <CardContent>
                <Typography variant='h6'>{numeral(bill?.previous).format("0,0.00")}</Typography>
                <Typography variant='subtitle2'>Previous unpaid balance</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}} sx={{p:1}}>
            <Card>
              <CardContent>
                <Typography variant='h6'>{numeral(bill?.totalPayment).format("0,0.00")}</Typography>
                <Typography variant='subtitle2'>Payments ({moment(bill?.dateStart).format("MM/DD")} - {moment(bill?.dateEnd).format("MM/DD")})</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}} sx={{p:1}}>
            <Card>
              <CardContent>
                <Typography variant='h6'>{numeral(bill?.balance).format("0,0.00")}</Typography>
                <Typography variant='subtitle2'>Outstanding Balance ({moment(bill?.dateEnd).format("MM/DD")})</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    
    </>

}
