import { AddCircle } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"


const AddReadingIconButton = (props)=>{


    return <Tooltip title="Add Reading">
                        
                        <IconButton {...props}>
                            <AddCircle />
                        </IconButton>
                    </Tooltip>
}

export default AddReadingIconButton