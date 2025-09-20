import { ArrowDropDown } from "@mui/icons-material"
import { Box, Chip, ClickAwayListener, Menu, MenuItem } from "@mui/material"
import { useMemo, useState } from "react"



const StatusChip = (props)=>{

    const [anchorEl,setAnchor] = useState(null)
    
    const show = !!anchorEl
    const selection = [{color:"success", label:"Approved"}, {color:"primary", label:"Pending"}, {color:"error", label:"Rejected"}]
    const data = useMemo(()=>{
        return selection.find(e=>e.label == props.value)
    },[props.value])


    return <><ClickAwayListener onClickAway={()=>{
        setAnchor(null)
    }}><Box>
        <Chip {...props} label={data?.label} color={data?.color} clickable onDelete={()=>{}} deleteIcon={<ArrowDropDown />} onClick={(evt)=>setAnchor(evt.target)}></Chip>
        
    </Box>
    </ClickAwayListener>
            <Menu anchorEl={anchorEl} open={show}>
                {selection.filter(e=>e.label != props.value).map(e=><MenuItem dense onClick={()=>{
                    setAnchor(null)
                    props.onChange(e)
                }}>{e.label}</MenuItem>)}
            </Menu>
            </>
}

export default StatusChip