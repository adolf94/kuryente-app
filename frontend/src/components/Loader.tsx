import { CircularProgress, Dialog, DialogContent } from "@mui/material"
import React, { useContext, useState } from "react"
const LoaderContext = React.createContext({
    showLoading : ()=>{},
    hideLoading:  ()=>{}
})

const Loader = ({children})=>{
    const [show, setShow] = useState(false)


    return   <LoaderContext.Provider value={{
        showLoading : ()=>setShow(true),
        hideLoading: ()=>setShow(false)
    }}>
        {children}
      <Dialog open={show} slotProps={{
            paper:{
                sx: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                },
            }
          }}>
            <DialogContent>
                <CircularProgress size={100}/>
            </DialogContent>
        </Dialog>
    </LoaderContext.Provider>
}


export const useLoader = ()=>{
    let ctx = useContext(LoaderContext)
    return ctx
}


export default Loader