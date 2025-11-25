import { Settings } from '@mui/icons-material'
import { Button, Card, CardActions, CardContent, Grid, Icon, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { useAllBills } from '../../../repositories/repository'
import BillCard from '../../../components/index/user/BillCard'
import BillPreferences from '../../../components/index/user/BillPreferences'

export const Route = createFileRoute('/user/bills/')({
  component: RouteComponent,
})

function RouteComponent() {

  const {data:bills} = useAllBills()

  return <Grid size={{xs:12}} sx={{p:1}}>

      <Grid container sx={{justifyContent:"space-between"}}>
        <Grid>
          <Typography variant='h5'>Bill Summary</Typography>
        </Grid>
        <Grid>
          <BillPreferences />
        </Grid>
      </Grid>
      <Grid container>
            {bills.sort((a,b)=>a.id<b.id?1:-1)
                .map(e=><Grid key={e.id} size={{xs:12,sm:6,md:3}} sx={{p:1}}>
                    <BillCard item={e} date={e.id}/>
                    </Grid>)    }
        </Grid>
  </Grid>
}
