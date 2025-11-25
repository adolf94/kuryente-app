import { ArrowDropDown } from "@mui/icons-material"
import { Box, Button, Chip, ClickAwayListener, Dialog, DialogActions, DialogContent, DialogContentText, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from "@mui/material"
import { useMemo, useState } from "react"



const StatusChip = (props)=>{

    const [anchorEl,setAnchor] = useState(null)
    const [showDialog,setShowDialog] = useState(false)
    const [decision,setDecision] = useState(false)
    const [rate,setRate] = useState(150)
    
    const show = !!anchorEl
    const selection = [{color:"success", label:"Approved"}, {color:"primary", label:"Pending"}, {color:"error", label:"Rejected"}]
    const data = useMemo(()=>{
        return selection.find(e=>e.label == props.value)
    },[props.value])


    const onSelect = (decision)=>{
        
        

        
    }


    return <><ClickAwayListener onClickAway={()=>{
        setAnchor(null)
    }}><Box>
        <Chip {...props} label={data?.label} color={data?.color} clickable={props.select} onDelete={props.select ? ()=>{} : undefined} deleteIcon={props.select && <ArrowDropDown />} onClick={props.select ?(evt)=>setAnchor(evt.target):undefined}></Chip>
        
    </Box>
    </ClickAwayListener>
            {props.select && <Menu anchorEl={anchorEl} open={show}>
                {selection.filter(e=>e.label != props.value).map(e=><MenuItem dense onClick={()=>{
                    setAnchor(null)
                    props.onChange(e)
                }}>{e.label}</MenuItem>)}
            </Menu>
            }
    {/* <Dialog open={false}>
        <DialogContent sx={{p:1}}>
            <Stack>
                <Box sx={{p:1}}>
                    <TextField value={amount} label="Amount" size="small" onChange={evt=>setAmount(Number.parseFloat(evt.target.value))}/>
                </Box>
                <Box sx={{p:1}}>
                    <TextField value={rate} label="Rate per day" size="small" onChange={evt=>setRate(Number.parseFloat(evt.target.value))}/>
                </Box>
                <Box sx={{p:1}}>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 'none' }}>Current Deadline</TableCell>
                                    <TableCell sx={{ borderBottom: 'none' }}>2025-11-01</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 'none' }}>Days</TableCell>
                                    <TableCell sx={{ borderBottom: 'none' }}>5</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 'none' }}>New Deadline</TableCell>
                                    <TableCell sx={{ borderBottom: 'none' }}>2025-11-22</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Stack>
            
        </DialogContent>
        <DialogActions>
            <Button variant="outlined">Ok</Button>
        </DialogActions>
    </Dialog> */}
            </>
}

export default StatusChip