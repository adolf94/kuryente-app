import { useEffect, useState } from "react"
import moment from "moment"
import { Skeleton, Typography } from "@mui/material"

const Timer = ({date} : {date: string})=>{

    const [remaining, setRemaining] = useState("")

    useEffect(()=>{

        const updateRemainingTime = () => {
            if(!date) return
            const now = moment();
            const endDate = moment(date);
            const duration = moment.duration(endDate.diff(now));

            // If the date has passed, clear interval and set to 0
            if (duration.asMilliseconds() <= 0) {
                setRemaining("Disconnected");
                timer && clearInterval(timer);
                return;
            }

            const days = Math.floor(duration.asDays());
            const hours = duration.hours();
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            // Format the time to be "X days and HH:mm:ss"
            const formattedTime = `${days} days and ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            setRemaining(formattedTime);
        }

        // updateRemainingTime(); // Run once immediately on mount/date change
        const timer = setInterval(updateRemainingTime, 1000); // Update every second

        return ()=>{
            clearInterval(timer)
        }

    },[date])

    return <span>
        {!date ? <Skeleton variant="text" height={100} />:
        <Typography variant='h3'>{remaining}</Typography>}
        </span>

}

export default Timer