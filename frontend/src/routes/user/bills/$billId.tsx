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
        <Grid size={{xs:12,sm:6,md:3}} sx={{p:1}}>
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
      <Grid container sx={{justifyContent:"center"}}>
        <Grid size={12} sx={{px:1,pt:1}}>
          <Typography variant='h5'>Readings</Typography>
        </Grid>
        
        {readings.sort((a,b)=>{
          if(a.type > b.type) return 1
          if(a.type < b.type) return -1
          if(a.reading?.dateStart < b.reading?.dateStart) return 1
          if(a.reading?.dateStart == b.reading?.dateStart) return 0
          return -1
        }).map(reading=><Grid size={{xs:12,md:5}} sx={{p:1}} key={reading.id}>
          <Card>
            <CardContent>
              <Grid container>
                <Grid size={12}>
                  <Typography variant='body1'>{reading.type}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant='caption'>Reading Period</Typography>
                  <Typography variant='body2'>{moment(reading?.prorated?.dateStart || reading?.dateStart ).format("MM/DD")} - {moment(reading?.prorated?.dateEnd || reading?.dateEnd).format("MM/DD")}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant='caption'>Meter Reading</Typography>
                  <Typography variant='body2'>{reading?.prorated?.reading || reading?.reading || "N/A"}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant='caption'>Consumption</Typography>
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
      <Grid container sx={{justifyContent:"center"}}>
        <Grid size={12} sx={{px:1,pt:1}}>
          <Typography variant='h5'>Payments</Typography>
        </Grid>
        <Grid size={{xs:12,md:9}}>
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
                    <TableCell>{item.File.recipientBank}</TableCell>
                    <TableCell>{numeral(item.Rate).format("0.00")}</TableCell>
                    <TableCell>{numeral(item.File.amount).format("0,0.00")}</TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    
    </>

}
