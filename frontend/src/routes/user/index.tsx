

import { Add, AddCircle, Settings } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Grid, Icon, IconButton, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tooltip, Typography } from '@mui/material'
import { createFileRoute, useCanGoBack, useNavigate } from '@tanstack/react-router'
import moment from 'moment'
import StatusChip from '../../components/index/admin/StatusChip'
import ViewImageDialog from '../../components/index/admin/ViewImageDialog'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import AddReadingIconButton from '../../components/index/user/AddReadingIconButton'
import AddReadingDialog from '../../components/index/admin/AddReadingDialog'
import numeral from 'numeral'
import { useQuery } from '@tanstack/react-query'
import { BILL, getAllReadings, getBills, getPayments, PAYMENT, READING, useAllBills, useAllPayments, useAllReading } from '../../repositories/repository'
import BillCard from '../../components/index/user/BillCard'


const RouteComponent = ()=>{
    const navigate = useNavigate({ from: '/user/' })

    const {data: payments} = useAllPayments()
    const {data: readings} = useAllReading()
    const{data:bills, isLoading,isFetching,isPending, isPaused} = useAllBills()
    const [type, setType] = useState("Manila Water")

    console.log(bills.sort((a,b)=>a.date>b.date?1:-1))    

    return <Box sx={{width:"100%"}}>
        <Grid container>
            
            <Grid size={{xs:12, md:12}} sx={{p:1}}>
                <Typography variant='h5'>Bill Summary </Typography>
                <Grid container>
                    {bills.sort((a,b)=>a.id<b.id?1:-1)
                        .slice(0,4)
                        .map(e=><Grid key={e.id} size={{xs:12,sm:6,md:3}} sx={{p:1}}>
                            <BillCard item={e} date={e.id}/>
                            </Grid>)    }
                    <Grid size={12} sx={{textAlign:'right'}}>
                        <Button onClick={()=>navigate({to:"./bills"})}>View all bills</Button>
                    </Grid>
                </Grid>
            </Grid>
            <Grid size={{xs:12, md:6}} sx={{p:1}}>

                <Card>
                    <CardHeader title="Readings" action={<AddReadingDialog admin={false} data={readings} allowedTypes={["Manila Water"]} onAdded={()=>{}} >
                        <AddReadingIconButton />
                    </AddReadingDialog>} /> 
                    <CardContent>
                        <Grid container>
                            <Tabs value={type} onChange={(e,newValue)=>{console.log(e)

                                setType(newValue)
                            }}>
                                <Tab label={<Typography fontSize="small">Manila Water</Typography>} value="Manila Water"></Tab>
                                <Tab label={<Typography fontSize="small">Meralco</Typography>} value="Meralco"></Tab>
                            </Tabs>
                            
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            Date
                                        </TableCell>
                                        <TableCell>
                                            Reading
                                        </TableCell>
                                        <TableCell>
                                            Usage
                                        </TableCell>
                                        <TableCell>
                                            Cost
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {
                                        readings.filter(e=>e.type == type)
                                            .sort((a,b)=>a.date > b.date ? -1:1)
                                            .slice(0,10)
                                            .map(e=><TableRow>
                                                <TableCell>{moment(e.date).format("MMM DD")}</TableCell>
                                                <TableCell>{e.reading}</TableCell>
                                                <TableCell>{e.consumption}</TableCell>
                                                <TableCell>{numeral(e.consumption * e.per_unit).format("0,0.00")}</TableCell>
                                            </TableRow>)
                                    }
                                </TableBody>
                            </Table>
                        </Grid>
                    </CardContent>                    
                </Card>
            </Grid>
            <Grid  size={{xs:12,md:6}} sx={{p:1}}>
                <Box sx={{width:"100%"}}>
                            <Typography variant='h5'>Payments</Typography>
                    {payments.slice(0,10).map(e=><Card sx={{my:1}}>
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
                                    <Grid size={6}>
                                        <Typography variant='body2'>
                                                                    
                                            {e.File.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                                            {e.File?.recipientBank}
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid size={6} sx={{textAlign:"right",pb:1}}>
                                        <Typography variant='body2'>
                                        {numeral(e.File.amount).format("0,0.00")}</Typography>
                                    </Grid>
                                    
                                    {/* <Grid size={6}>
                                    <Typography variant='body2'>
                                            {e.File.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                                            {e.File?.recipientBank}
                                    </Typography>
                                    </Grid>
                                    <Grid size={6} sx={{textAlign:"right",pb:1}}>
                                    <Typography variant='body2'>
                                    {numeral(e.File.amount).format("0,0.00")}</Typography>
                                    </Grid>
                                    <Grid size={6} sx={{pb:1}}>
                                    <Chip size="small" color='success' label="12D @ P 150"></Chip>
                                    </Grid>
                                    <Grid size={6}>
                                    </Grid> */}
                                </Grid>
                            </CardContent>
                        </Card>)}
                        
                </Box>
            </Grid>
            <Grid  size={{xs:12,md:6}} sx={{p:1}}>
                
               
            </Grid>
            <Grid size={8} sx={{textAlign:"center", p:2}}>
                <Button variant='contained' size='large' onClick={()=>navigate({to:"/"})}>Back to Home</Button>

            </Grid>
            <Grid size={8} sx={{textAlign:"center", p:2}}>
                <Button variant='outlined' size='large' onClick={()=>navigate({to:"/admin"})}>Admin</Button>
            </Grid>

        </Grid>
    
    </Box>
}

export const Route = createFileRoute('/user/')({
    component: RouteComponent,
  })
  