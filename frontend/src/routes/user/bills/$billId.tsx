import { Box, Button, Card, CardActions, CardContent, CardHeader, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import useBillComputation from '../../../utils/useBillComputation'
import moment from 'moment'
import numeral from 'numeral'
import { useMemo } from 'react'
import { ChevronLeft, ExpandMore } from '@mui/icons-material'

export const Route = createFileRoute('/user/bills/$billId')({
  component: RouteComponent,
})

function RouteComponent() {
    const { billId } = Route.useParams()
    const router = useRouter()
    const {result:bill,isLoading } = useBillComputation(moment(billId))


    const readings = useMemo(()=>{
      if(!bill?.readings) return []
      let reads = bill.readings.reduce((p,c)=>{
        if(!p[c.type]) {
          p[c.type] = []
        }
        p[c.type].push(c)
        return p
      }, {})
      return Object.keys(reads)
        .map(key=>{
          let data = reads[key]
          return data.reduce((p,c)=>{
            if(!p) return {
              ...c,
              prorated:!c.prorated ? undefined : {
                ...c.prorated,
                prevReading: c.prorated.reading - c.prorated.consumption,
                amount: (c.prorated.consumption * c.per_unit)
              }
            }
            let cp = c.prorated
            return {
              ...c,
              prorated : !p.prorated ? undefined : {
                ...cp,
                consumption: p.prorated.consumption + cp.consumption,
                dateStart : p.prorated.dateStart < cp.dateStart ? p.prorated.dateStart : cp.dateStart,
                dateEnd : p.prorated.dateEnd > cp.dateEnd ? p.prorated.dateEnd : cp.dateEnd,
                daysCount: p.prorated.dayCount + cp.dayCount,
                isEstimated : p.isEstimated || cp.isEstimated,
                reading : Math.max(p.reading,cp.reading),
                prevReading: Math.min((p.reading - p.consumption),(cp.reading - cp.consumption)),
                amount: (p.prorated.consumption * p.per_unit) + (cp.consumption * c.per_unit)
              },
              
            }
          },null)
        }).map(p=>{
          let pr = p.prorated
          return {
            ...p,
            prorated: !pr ? undefined : {
              ...pr,
              per_unit : pr.amount / pr.consumption
            }
          }
        })

    },[bill])
    console.log(readings)
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
                        <Typography variant='body2' color="textDisabled">as of {moment(bill?.dateStart).format("MMM DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", border:"none"}}>
                        <Typography variant='subtitle1'> {numeral(bill?.previous).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography variant='subtitle1'>Payments</Typography>
                        <Typography variant='body2' color="textDisabled">{moment(bill?.dateStart).format("MM/DD")} - {moment(bill?.dateEnd).format("MM/DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right"}}>
                        <Typography variant='subtitle1'> - {numeral(bill?.totalPayment).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{border:"none"}}>
                        <Typography variant='subtitle1'></Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", border:"none"}}>
                        <Typography variant='subtitle1'>{numeral(bill?.previous - bill?.totalPayment).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell  sx={{borderTop:"2px"}}>
                        <Typography variant='subtitle1'>Utility Usage</Typography>
                        <Typography variant='body2' color="textDisabled">{moment(bill?.dateStart).format("MM/DD")} - {moment(bill?.dateEnd).format("MM/DD")}</Typography>
                      </TableCell>
                      <TableCell sx={{textAlign:"right", borderTop:"2px"}}>
                        <Typography variant='subtitle1'>+ {numeral(bill?.current).format("0,0.00")}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{}}>
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
        </Grid>
        
        {readings.sort((a,b)=>{
          if(a.type > b.type) return 1
          if(a.type < b.type) return -1
          if(a.reading?.dateStart < b.reading?.dateStart) return 1
          if(a.reading?.dateStart == b.reading?.dateStart) return 0
          return -1
        }).map((reading,i)=><Grid size={12} sx={{p:1}} key={reading.id}>
              <Card>
                <CardContent>
                  <Grid container>
                    <Grid size={12}>
                      <Typography variant='body1'>{reading.type}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' sx={{display:"block"}}>Reading Period</Typography>
                      <Typography variant='body2'>{moment(reading?.prorated?.dateStart || reading?.dateStart ).format("MM/DD")} - {moment(reading?.prorated?.dateEnd || reading?.dateEnd).format("MM/DD")}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' sx={{display:"block"}}>Meter Reading</Typography>
                      <Typography variant='body2'  sx={{display:"inline"}} >{reading?.prorated?.reading || reading?.reading || "N/A"}</Typography>
                        {
                          !!reading?.prorated?.prevReading || reading?.prevReading  ? 
                            <Typography variant='body2'  sx={{display:"inline", color:"#777"}}>  (prev: {reading?.prorated?.prevReading || reading?.prevReading || "N/A"})</Typography> :
                            <></>
                        }
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption'  sx={{display:"block"}}>Consumption</Typography>
                      <Typography variant='body2'>{numeral(reading.prorated?.consumption || reading.consumption).format("0,0.00")}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption'>Price Per unit</Typography>
                      <Typography variant='body2'>{numeral(reading?.prorated?.per_unit || reading.per_unit).format("0,0.00")}</Typography>
                    </Grid>
                    <Grid size={6}>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption'>Total Cost</Typography>
                      <Typography variant='body2'>{numeral((reading.prorated?.amount) || (reading.per_unit * reading.consumption)).format("0,0.00")}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Tooltip title="Coming soon!">
                    <Button size="small"> <ExpandMore /> More Info</Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>)}
            
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
                      {bill?.payments.map(item=><TableRow key={item.id}>
                        <TableCell>{moment(item.DateAdded).format("MM/DD")}</TableCell>
                                            
                        <TableCell>{item.File.recipientBank} <br /> {item.PaymentBy?.Name || item.PaymentBy?.Email || item.PaymentBy} </TableCell>
                        <TableCell>{numeral(item.Rate).format("0.00")}</TableCell>
                        <TableCell sx={{textAlign:"right"}}>{numeral(item.File.amount).format("0,0.00")}</TableCell>
                      </TableRow>)}
                      <TableRow>
                        <TableCell colSpan={2}>
                            <Typography variant="subtitle2" fontWeight="bold">Total Payments</Typography>
                        </TableCell>
                        <TableCell colSpan={2} sx={{textAlign:"right"}}>
                            <Typography variant="subtitle2" fontWeight="bold">{numeral(bill?.totalPayment).format("0,0.00")}</Typography>
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
