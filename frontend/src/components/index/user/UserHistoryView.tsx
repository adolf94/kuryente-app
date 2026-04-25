import React, { useMemo, useState } from 'react'
import { 
    Box, 
    Button,
    Typography, 
    Card, 
    CardContent, 
    Chip, 
    Stack, 
    Divider, 
    Tabs, 
    Tab, 
    useTheme,
    Paper,
    Avatar,
    useMediaQuery
} from '@mui/material'
import { 
    ReceiptLong, 
    Payment, 
    ElectricBolt, 
    WaterDrop
} from '@mui/icons-material'
import ViewImageDialog from '../admin/ViewImageDialog'
import moment from 'moment'
import numeral from 'numeral'
import { useAllBills, useAllPayments, useAllReading } from '../../../repositories/repository'

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`history-tabpanel-${index}`}
            aria-labelledby={`history-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const UserHistoryView = () => {
    const [tabValue, setTabValue] = useState(0);
    const [visibleMonths, setVisibleMonths] = useState(3);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { data: bills = [] } = useAllBills({ unsetPlaceholder: true })
    const { data: payments = [] } = useAllPayments({ unsetPlaceholder: true })
    const { data: readings = [] } = useAllReading({ unsetPlaceholder: true })

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Grouping by Month for the primary "Ledger" view
    const ledgerData = useMemo(() => {
        const months = new Set<string>();
        bills.forEach((b: any) => months.add(moment(b.id).subtract(5, 'days').format("YYYY-MM")));
        readings.forEach((r: any) => months.add(moment(r.date).subtract(5, 'days').format("YYYY-MM")));
        
        const sortedMonths = Array.from(months).sort((a, b) => a < b ? 1 : -1);

        return sortedMonths.map(month => {
            const mBills = bills.filter((b: any) => moment(b.id).subtract(5, 'days').format("YYYY-MM") === month);
            const mReadings = readings.filter((r: any) => moment(r.date).subtract(5, 'days').format("YYYY-MM") === month);
            const mPayments = payments.filter((p: any) => moment(p.DateAdded).subtract(5, 'days').format("YYYY-MM") === month);

            const meralco = mReadings.find((r: any) => r.type === 'Meralco');
            const water = mReadings.find((r: any) => r.type === 'Manila Water');
            const bill = mBills[0]; // Assuming one bill per month

            return {
                month,
                label: moment(month, "YYYY-MM").format("MMMM YYYY"),
                meralco,
                water,
                bill,
                payments: mPayments,
                totalCost: (meralco?.consumption || 0) * (meralco?.per_unit || 0) + (water?.consumption || 0) * (water?.per_unit || 0)
            };
        });
    }, [bills, readings, payments]);

    const getStatusChip = (status: string) => {
        const isPaid = status === 'Approved' || status === 'Paid';
        const isPending = status === 'Pending';
        return (
            <Chip 
                label={status.toUpperCase()} 
                size="small" 
                color={isPaid ? "success" : isPending ? "warning" : "error"}
                sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem', height: 20 }} 
            />
        )
    }

    const UtilityRow = ({ type, data }: { type: 'Electricity' | 'Water', data: any }) => {
        if (!data) return null;
        const isMeralco = type === 'Electricity';
        const icon = isMeralco ? <ElectricBolt sx={{ fontSize: 16 }} /> : <WaterDrop sx={{ fontSize: 16 }} />;
        const color = isMeralco ? '#FFC107' : '#03A9F4';
        const cost = (data.consumption || 0) * (data.per_unit || 0);
        const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
 
        return (
            <Box sx={{ mb: isMobile ? 1.5 : 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textTransform: 'uppercase', mb: 0.5, letterSpacing: 0.5 }}>
                            {icon} {isMeralco ? 'MERALCO' : 'MANILA WATER'}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="baseline">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {data.consumption} {isMeralco ? 'KWH' : 'm³'}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                (Reading: {data.reading || data.Reading})
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.disabled" display="block">
                            Rate: P {numeral(data.per_unit).format("0,0.00")} / unit
                        </Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography variant={isMobile ? "body2" : "h6"} fontWeight={900} sx={{ color }}>
                            P {numeral(cost).format("0,0.00")}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    variant="fullWidth"
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 800, fontSize: '0.85rem' }
                    }}
                >
                    <Tab label="Monthly Ledger" />
                    <Tab label="Statements" />
                    <Tab label="Payments" />
                </Tabs>
            </Paper>

            {/* Ledger Tab: Month-Centric Grouping */}
            <CustomTabPanel value={tabValue} index={0}>
                <Stack spacing={isMobile ? 1.5 : 2.5} pb={4}>
                    {ledgerData.length > 0 ? ledgerData.slice(0, visibleMonths).map((item, i) => (
                        <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: isMobile ? 2 : 3, overflow: 'hidden' }}>
                            <Box sx={{ px: isMobile ? 1.5 : 2, py: isMobile ? 1 : 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant={isMobile ? "caption" : "subtitle2"} fontWeight={900} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {item.label}
                                </Typography>
                            </Box>
                            <CardContent sx={{ pt: isMobile ? 1.5 : 2, pb: isMobile ? '8px !important' : '16px !important', px: isMobile ? 1.5 : 2 }}>
                                {/* Water on top per user request */}
                                <UtilityRow type="Water" data={item.water} />
                                <Divider sx={{ my: isMobile ? 1.5 : 2, borderStyle: 'dashed' }} />
                                <UtilityRow type="Electricity" data={item.meralco} />
                                
                                {item.bill && (
                                    <Box sx={{ 
                                        mt: isMobile ? 2 : 3, 
                                        p: isMobile ? 1.5 : 2, 
                                        bgcolor: 'primary.50', 
                                        borderRadius: isMobile ? 2 : 3, 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        border: '1px solid',
                                        borderColor: 'primary.100'
                                    }}>
                                        <Box>
                                            <Typography variant="caption" fontWeight={900} color="primary.main" sx={{ display: 'block', mb: 0.2, letterSpacing: 0.5 }}>
                                                TOTAL MONTHLY CHARGE
                                            </Typography>
                                            <Typography variant={isMobile ? "subtitle1" : "h5"} fontWeight={900} color="primary.main">
                                                P {numeral(item.bill.current).format("0,0.00")}
                                            </Typography>
                                        </Box>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            size={isMobile ? "small" : "medium"}
                                            startIcon={<ReceiptLong />}
                                            onClick={() => window.open(`/user/bills/${item.bill.id}`, '_blank')}
                                            sx={{ 
                                                borderRadius: 2.5, 
                                                fontWeight: 800, 
                                                px: isMobile ? 2 : 3,
                                                py: isMobile ? 0.8 : 1.2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                                boxShadow: 'none',
                                                '&:hover': { boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)' }
                                            }}
                                        >
                                            {isMobile ? 'View' : 'View Statement'}
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    )) : (
                        <Typography color="text.secondary" textAlign="center" py={8}>No historical records found for your account.</Typography>
                    )}
                    
                    {ledgerData.length > visibleMonths && (
                        <Button 
                            variant="outlined" 
                            onClick={() => setVisibleMonths(prev => prev + 6)}
                            sx={{ mt: 2, borderRadius: 2.5, fontWeight: 800, py: 1.5 }}
                        >
                            Show Older Records
                        </Button>
                    )}
                </Stack>
            </CustomTabPanel>

            {/* Statements Tab */}
            <CustomTabPanel value={tabValue} index={1}>
                <Stack spacing={2} pb={4} sx={{ mt: 3 }}>
                    {bills.sort((a: any, b: any) => a.id < b.id ? 1 : -1).map((bill: any, i: number) => (
                        <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 40, height: 40 }}>
                                        <ReceiptLong sx={{ fontSize: 20 }} />
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle1" fontWeight={800}>
                                            Statement for {moment(bill.id).subtract(5, 'days').format("MMMM YYYY")}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Total: P {numeral(bill.current).format("0,0.00")} • Due: {moment(bill.id).add(1, 'month').date(5).format("MMM DD, YYYY")}
                                        </Typography>
                                    </Box>
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        onClick={() => window.open(`/user/bills/${bill.id}`, '_blank')}
                                        sx={{ borderRadius: 2, fontWeight: 800 }}
                                    >
                                        Open
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                    {bills.length === 0 && (
                        <Typography color="text.secondary" textAlign="center" py={8}>No historical statements found.</Typography>
                    )}
                </Stack>
            </CustomTabPanel>

            {/* Payments Tab */}
            <CustomTabPanel value={tabValue} index={2}>
                <Stack spacing={2} pb={4}>
                    {(payments as any[]).sort((a: any, b: any) => a.DateAdded < b.DateAdded ? 1 : -1).map((pay: any, i: number) => (
                        <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: 'success.50', color: 'success.main', width: 40, height: 40 }}>
                                        <Payment sx={{ fontSize: 20 }} />
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle1" fontWeight={800}>
                                            P {numeral(pay.File?.amount).format("0,0.00")}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block' }}>
                                            {moment(pay.DateAdded).format("MMM DD, YYYY • hh:mm A")}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" fontWeight={700}>
                                            By: {pay.PaymentBy?.name || pay.PaymentBy?.email || pay.PaymentBy || 'Unknown'}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {pay.File?.fileId && (
                                            <ViewImageDialog fileId={pay.File.fileId} />
                                        )}
                                        {getStatusChip(pay.Status || 'Approved')}
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                    {payments.length === 0 && (
                        <Typography color="text.secondary" textAlign="center" py={8}>No payment records found.</Typography>
                    )}
                </Stack>
            </CustomTabPanel>
        </Box>
    );
};

export default UserHistoryView;
