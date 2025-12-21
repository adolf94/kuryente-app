import { Skeleton, TableCell, TableRow } from "@mui/material"
import moment from "moment"
import numeral from 'numeral'



const ReadingRow = ({reading:e})=>{


    return <TableRow>
        <TableCell>{moment(e.date).format("MMM DD")}</TableCell>
        <TableCell>{e.reading}</TableCell>
        <TableCell>{e.consumption}</TableCell>
        <TableCell>{numeral(e.consumption * e.per_unit).format("0,0.00")}</TableCell>
    </TableRow>
}

export const LoadingReadingRow = ()=>{
    return <TableRow>
        <TableCell colSpan={4}><Skeleton variant="text" /></TableCell>
    </TableRow>
}

export default ReadingRow