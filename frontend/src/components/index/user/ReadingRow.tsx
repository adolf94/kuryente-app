import { Box, ListItem, Skeleton, Typography } from "@mui/material"
import moment from "moment"
import numeral from 'numeral'

const ReadingRow = ({reading: e} : {reading: any})=>{
    return (
        <ListItem divider sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', py: 2, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ flex: '1 1 auto', minWidth: 150, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" fontWeight="600" color="text.primary">
                    {moment(e.date).format("MMM DD, YYYY")}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    Reading: <Typography component="span" variant="caption" fontWeight="600" color="text.primary">{e.reading}</Typography> • 
                    Usage: <Typography component="span" variant="caption" fontWeight="600" color="text.primary">{e.consumption}</Typography> units
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    Rate: P {numeral(e.per_unit).format("0,0.[00]")} / unit
                </Typography>
            </Box>
            <Box sx={{ flex: '0 0 auto', textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mb: 0.5 }}>Computed Cost</Typography>
                <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                    P {numeral(e.consumption * e.per_unit).format("0,0.00")}
                </Typography>
            </Box>
        </ListItem>
    )
}

export const LoadingReadingRow = ()=>{
    return (
        <ListItem divider sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ width: '100%' }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
            </Box>
        </ListItem>
    )
}

export default ReadingRow