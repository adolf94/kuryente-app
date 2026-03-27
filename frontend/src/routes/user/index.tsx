import { AddCircle } from '@mui/icons-material'
import { Box, Button, Card, CardContent, CardHeader, Container, Grid, List, Paper, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import moment from 'moment'
import { useState } from 'react'
import AddReadingIconButton from '../../components/index/user/AddReadingIconButton'
import AddReadingDialog from '../../components/index/admin/AddReadingDialog'
import { useAllBills, useAllPayments, useAllReading } from '../../repositories/repository'
import BillCard, { LoadingBillCard, UnbilledBillCard } from '../../components/index/user/BillCard'
import PaymentCard, { LoadingPaymentCard } from '../../components/index/user/PaymentCard'
import ReadingRow, { LoadingReadingRow } from '../../components/index/user/ReadingRow'


const RouteComponent = ()=>{
    const navigate = useNavigate({ from: '/user/' })

    const {data: payments, isLoading : payLoading} = useAllPayments({unsetPlaceholder:true})
    const {data: readings, isLoading: readLoading} = useAllReading({unsetPlaceholder:true})
    const {data: bills, isFetching, isLoading: billLoading} = useAllBills({unsetPlaceholder:true})
    const [type, setType] = useState("Manila Water")

    return <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
                <Typography variant="h4" fontWeight="700" color="text.primary" gutterBottom>
                    Account Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your bills, view usage history, and track payments.
                </Typography>
            </Box>
            <Box display="flex" gap={2}>
                <Button variant='outlined' color="primary" onClick={()=>navigate({to:"/"})}>Back to Home</Button>
                <Button variant='contained' color="primary" onClick={()=>navigate({to:"/admin"})}>Admin Panel</Button>
            </Box>
        </Box>

        <Box mb={5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant='h6' fontWeight="600">Bill Summary</Typography>
                <Button onClick={()=>navigate({to:"./bills"})} sx={{ fontWeight: 600 }}>View Complete History</Button>
            </Box>
            <Grid container spacing={3}>
                { billLoading ? <>
                <Grid size={{xs:12,sm:6,md:3}}>
                    <LoadingBillCard />
                </Grid>
                <Grid size={{xs:12,sm:6,md:3}}>
                    <LoadingBillCard />
                </Grid>
                <Grid size={{xs:12,sm:6,md:3}}>
                    <LoadingBillCard />
                </Grid>
                <Grid size={{xs:12,sm:6,md:3}}>
                    <LoadingBillCard />
                </Grid>
                </>:<>
                    {
                        moment().date() > 7 && 
                        <Grid size={{xs:12,sm:6,md:3}}>
                            {payLoading ? <LoadingBillCard /> : <UnbilledBillCard payments={payments}/>}
                        </Grid>
                    }
                    {
                        bills.sort((a:any, b:any)=>a.id < b.id ? 1 : -1)
                        .slice(0, moment().date() > 7 ? 3 : 4)
                        .map((e:any) => (
                            <Grid key={e.id} size={{xs:12,sm:6,md:3}}>
                                <BillCard item={e} date={e.id}/>
                            </Grid>
                        ))
                    }
                </>}
            </Grid>
        </Box>

        <Grid container spacing={4}>
            {/* Readings Table */}
            <Grid size={{xs:12, md:6}}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader 
                        title={<Typography variant="h6" fontWeight="600">Meter Readings</Typography>}
                        action={
                            <AddReadingDialog admin={false} data={readings || []} allowedTypes={["Manila Water"]} onAdded={()=>{}} >
                                <Button variant="text" startIcon={<AddCircle />} size="small" sx={{ fontWeight: 600 }}>Add Reading</Button>
                            </AddReadingDialog>
                        }
                        sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                    /> 
                    <CardContent sx={{ p: 0, flexGrow: 1 }}>
                        <Tabs 
                            value={type} 
                            onChange={(e,newValue) => setType(newValue)}
                            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab label="Manila Water" value="Manila Water" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Meralco" value="Meralco" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        </Tabs>
                        
                        <Box sx={{ p: 0 }}>
                            <List disablePadding>
                                {
                                    readLoading ? (
                                        Array.from(new Array(5)).map((_, i) => <LoadingReadingRow key={i} />)
                                    ) : (
                                        readings.filter((e:any)=>e.type === type)
                                            .sort((a:any, b:any)=>a.date > b.date ? -1 : 1)
                                            .slice(0, 10)
                                            .map((e:any, i:number)=><ReadingRow key={i} reading={e} />)
                                    )
                                }
                            </List>
                        </Box>
                    </CardContent>                    
                </Card>
            </Grid>

            {/* Payments List */}
            <Grid size={{xs:12, md:6}}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader 
                        title={<Typography variant="h6" fontWeight="600">Recent Payments</Typography>}
                        sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                    />
                    <CardContent sx={{ p: 0, flexGrow: 1 }}>
                        <List disablePadding>
                            {payLoading ? (
                                Array.from(new Array(5)).map((_, i) => <LoadingPaymentCard key={i} />)
                            ) : (
                                payments.sort((a:any, b:any)=>a.DateAdded > b.DateAdded ? -1 : 1)
                                .slice(0, 10)
                                .map((e:any, i:number)=><PaymentCard key={i} payment={e} />)
                            )}
                        </List>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    </Container>
}

export const Route = createFileRoute('/user/')({
    component: RouteComponent,
})