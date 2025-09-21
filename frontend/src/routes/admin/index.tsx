import { CancelOutlined, CheckCircle, CheckCircleOutline, Image, ArrowDropDown } from '@mui/icons-material'
import { Box, Button, Card, CardContent, CardHeader, Chip, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { createFileRoute, redirect } from '@tanstack/react-router'
import StatusChip from '../../components/index/admin/StatusChip'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import numeral from 'numeral'
import moment from 'moment'
import { useConfirm } from 'material-ui-confirm'
import AddPaymentDialog from '../../components/index/admin/AddPaymentDialog'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
  beforeLoad:(ctx)=>{
    if(!ctx.context?.user?.isAuthenticated || ctx.context?.user?.role != "admin")
      throw redirect({to:"/"})
  }
})

function RouteComponent() {
  const confirm = useConfirm()

  const [data,setData] = useState<any[]>([])

  useEffect(()=>{
    api.get<any>("/payments")
      .then(e=>{
        setData(e.data)
      })
  },[])


  const decide = (index : Number, decision : any)=>{

    confirm({
      title: "Confirm",
      description: `Are you sure with ${decision["label"]}?`
    }).then((val)=>{
      if(!val) return
      if(val.confirmed)
        return api.post("/decide_payment", {
          id: data[index].id,
          newStatus: decision["label"]
        }).then((res)=>{
          if(decision.label == "Approved"){
            confirm({
              title: "Approved",
              description: `Elec/Water has been extended till ${moment(res?.data.timer.DisconnectTime).format("MMM DD")}`,
              hideCancelButton:true
            })
          }else{
            confirm({
              title: "Declined",
              description:"Rejection Successful",
              hideCancelButton:true
            })
          }
          
          setData(prev=>{
            let newState = [...prev]
            newState[index] = res?.data.payment
            return newState
          })
        })
    })

  }


  return <>
    <Grid container>
      <Grid size={{xs:12,md:6}} sx={{p:1}}>
        <Card>
          <CardContent>
            <Box sx={{display:"flex", justifyContent:"space-between"}}>
              <Box>
                <Typography variant='h6'>
                  Payment Histories
                </Typography>
              </Box>
              <Box>
                <AddPaymentDialog onCreate={(data)=>setData(prev=>[data.payment,...prev])}/>
              </Box>
            </Box>
          </CardContent>
          <CardContent>
            <TableContainer sx={{display:{xs:'none',sm:"block"}}}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Date
                    </TableCell>
                    <TableCell>
                      Source
                    </TableCell>
                    <TableCell>
                      Amount
                    </TableCell>
                    <TableCell>
                      Rate
                    </TableCell>
                    <TableCell>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    data.map((e,i)=><TableRow key={e.id}>
                      <TableCell>
                        {moment(e.File.datetime).format("MMM DD")}
                      </TableCell>
                      <TableCell>
                        <IconButton size='small'>
                          <Image fontSize='small' />
                        </IconButton>
                        {e.File?.recipientBank}
                      </TableCell>
                      <TableCell sx={{textAlign:"right"}}>
                        {numeral(e.File.amount).format("0,0.00")}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color='success' label="12D@P150"/>
                      </TableCell>
                      <TableCell>
                      <StatusChip value={e.Status} size="small" onChange={(newValue)=>{
                          decide(i,newValue)
                        }}></StatusChip>
                      </TableCell>
                    </TableRow>)
                  }
                  
                </TableBody>
              </Table>
            </TableContainer>
            <Box  sx={{display:{xs:"block", sm:"none"}}}>

              <Paper variant='outlined' sx={{p:2}}>
                <Grid container> 
                  <Grid size={6} sx={{pb:1}}>
                    <Typography variant='body2'>09-27</Typography>
                  </Grid>
                  <Grid size={6} sx={{textAlign:"right",pb:1}}>
                    <StatusChip value="Pending" size="small" />
                  </Grid>
                  <Grid size={6}>
                    <Typography variant='body2'>
                    <IconButton size='small'>
                      <Image fontSize='small' />
                    </IconButton>GCash</Typography>
                  </Grid>
                  <Grid size={6} sx={{textAlign:"right",pb:1}}>
                    <Typography variant='body2'>P 1,800.00</Typography>
                  </Grid>
                  <Grid size={6} sx={{pb:1}}>
                    <Chip size="small" color='success' label="12D @ P 150"></Chip>
                  </Grid>
                  <Grid size={6}>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{xs:12,md:6}} sx={{p:1}}>
        <Card>
          <CardHeader>
            <Typography variant='h6'>
              Bill Histories
            </Typography>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Test1
                    </TableCell>
                    <TableCell>
                      Test2
                    </TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  </>
}
