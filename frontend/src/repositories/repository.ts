import { queryOptions, useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query"
import api from "../utils/api"
import { queryClient } from "../App"
import { Label } from "@mui/icons-material"
import moment from "moment"

export const PAYMENT = "payment"
export const getPayments = ()=>{
    return   api.get<any[]>("/payments")
    .then(e=>{
      return e.data
    })
}
export const useAllPayments = (queryOptions?: UseQueryOptions) =>  useQuery<any>({
    ...(queryOptions|| {}),
        queryKey: [PAYMENT],
        queryFn: ()=>getPayments(),
        networkMode:'online',
        placeholderData:[]
    })

export const usePaymentMutation = ()=>{
    const add_admin = useMutation({
        mutationFn:(data: any)=>{
            return api.post("/record_payment", data)
            .then((res)=>{
                return res.data
            })
        },
        onSuccess:(data)=>{
            queryClient.setQueryData<any[]>([PAYMENT], (prev)=>[...(prev||[]), data])
        }
    })

    const decide_admin = useMutation({
        mutationFn:(id, decision)=>{
            return api.post("/decide_payment", {
                id: id,
                newStatus:decision
              }).then((res)=>{
                return res.data
              })
        },
        onSuccess:(data)=>{
            queryClient.setQueryData([PAYMENT], (prev)=>[...prev, data])
        }
    })

    return {add_admin, decide_admin}
}






export const READING = "reading"

export const getAllReadings = ()=>{
    
    return api.get<any[]>("/readings")
      .then(e=>{
        let sortedData = e.data.sort((a,b)=> a.date > b.date ? -1 : 1)
        console.log(sortedData)
        let data = e.data.reduce((p,c)=>{
            let prev = sortedData.find(e=>e.date < c.date && e.type == c.type)
            if(!!prev){
                c.dateStart = moment(prev.date).clone().add("day",1).format("YYYY-MM-DD"),
                c.dateEnd = c.date
            }
            p.push(c)
            return p
        },[])


        return e.data
      })
}
export const useAllReading = (queryOptions? : UseQueryOptions)=>useQuery<any>({
    ...(queryOptions|| {}),
    queryKey: [READING],
    queryFn: ()=>getAllReadings(),
    networkMode:'online',
    placeholderData:[]
})

export const useReadingMutation = ()=>{

    const add_reading = useMutation({
        mutationFn: (data)=>{
            return api.post<any>("add_reading", data).then(e=>e.data)
        },
        onSuccess:(data)=>{
            queryClient.setQueryData([READING], (prev)=>[...(prev||[]), data])
        }
    })

    return {add_reading}
}

export const BILL = "bill"
export const getBills = ()=>{

    return api<any[]>("/bills")
        .then(e=>e.data)
}
export const useAllBills = (queryOptions? : UseQueryOptions)=>useQuery<any>({
    ...(queryOptions|| {}),
    queryKey : [BILL],
    queryFn: ()=>getBills(),
    placeholderData:[],
    networkMode:'online',
    
})

const Component = ()=>{
    const {data} = useAllBills()
}