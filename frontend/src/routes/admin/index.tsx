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
import ViewImageDialog from '../../components/index/admin/ViewImageDialog'
import AddReadingDialog from '../../components/index/admin/AddReadingDialog'
import { useQuery } from '@tanstack/react-query'
import { getAllReadings, getPayments, PAYMENT, READING, usePaymentMutation } from '../../repositories/repository'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
  beforeLoad:(ctx)=>{
    if(!ctx.context?.user?.isLoggedIn() || ctx.context?.user?.role.indexOf("KURYENTE_ADMIN") == -1)
      throw redirect({to:"/"})
  }
})

function RouteComponent() {
  const confirm = useConfirm()

  const {data : readings} = useQuery({
    queryFn:()=>getAllReadings(),
    queryKey:[READING],
    initialData:[],
    placeholderData:[]
  })
  
  const {data: data, } = useQuery<any[]>({
      queryKey: [PAYMENT],
      queryFn: ()=>getPayments(),
      initialData: [],
      placeholderData:[]
  })
  const {decide_admin} = usePaymentMutation()



  const decide = (index : int, decision : any)=>{

    confirm({
      title: "Confirm",
      description: `Are you sure with ${decision["label"]}?`
    }).then(async (val)=>{
      if(!val) return
      if(val.confirmed)
          var res = await decide_admin.mutateAsync({id:data[index].id, decision:decision.label})
          if(decision.label == "Approved"){
            confirm({
              title: "Approved",
              description: `Elec/Water has been extended till ${moment(res?.timer.DisconnectTime).format("MMM DD")}`,
              hideCancelButton:true
            })
          }else{
            confirm({
              title: "Declined",
              description:"Rejection Successful",
              hideCancelButton:true
            })
          }
          
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
                <AddPaymentDialog onCreate={()=>{}}/>
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
                        {e.File.fileId && <ViewImageDialog fileId={e.File.fileId} />}
                        {e.File?.recipientBank}
                      </TableCell>
                      <TableCell sx={{textAlign:"right"}}>
                        {numeral(e.File.amount).format("0,0.00")}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color='success' label={(e.File?.days || 0) + "@150"}/>
                      </TableCell>
                      <TableCell>
                      <StatusChip value={e.Status} size="small" select onChange={(newValue)=>{
                          decide(i,newValue)
                        }}></StatusChip>
                      </TableCell>
                    </TableRow>)
                  }
                  
                </TableBody>
              </Table>
            </TableContainer>
            <Box  sx={{display:{xs:"block", sm:"none"}}}>
              
            {
                    data.map((e,i)=><Paper variant='outlined' sx={{p:2}}>
              <Grid container> 
                <Grid size={6} sx={{pb:1}}>
                  <Typography variant='body2'>{moment(e.File.datetime).format("MMM DD")}</Typography>
                </Grid>
                <Grid size={6} sx={{textAlign:"right",pb:1}}>
                  <StatusChip value={e.Status} size="small" onChange={(newValue)=>{
                      decide(i,newValue)
                    }}></StatusChip>
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
                <Grid size={6} sx={{pb:1}}>
                  <Chip size="small" color='success' label="12D @ P 150"></Chip>
                </Grid>
                <Grid size={6}>
                </Grid>
              </Grid>
            </Paper>
                    
                    
                  )}
                  
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
            
          <AddReadingDialog onAdded={()=>{}}  data={readings} allowedTypes={["Manila Water", "Meralco"]} admin>
              <Button>Add Reading</Button>

            </AddReadingDialog>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Date
                    </TableCell>
                    <TableCell>
                      Utility
                    </TableCell>
                    <TableCell>
                      Reading
                    </TableCell>
                    <TableCell>
                      Consumption
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readings.map(e=><TableRow>
                    <TableCell>
                      {moment(e.date).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell>
                      {e.type}
                    </TableCell>
                    <TableCell>
                      {e.reading}
                    </TableCell>
                    <TableCell>
                      {e.consumption}
                    </TableCell>
                    <TableCell>
                      {e.consumption * e.per_unit} ({e.per_unit}/unit)
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  </>
}
