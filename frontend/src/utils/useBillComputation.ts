import moment from "moment"
import { useAllBills, useAllPayments, useAllReading } from "../repositories/repository"
import { useMemo } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

const useBillComputation = (date)=>{

    

    const {data: payments, isLoading:paymentsLoading, isPlaceholderData :pdPayments} = useAllPayments()
    const {data: untatsReadings, isLoading:readingsLoading, isPlaceholderData: pdReading} = useAllReading()
    const{data:bills, isLoading:billsLoading, isPlaceholderData:pdBills} = useAllBills()
  
      const [billPrefs] = useLocalStorage("billPrefs", {
          "Meralco" : 1,
          "Manila Water" : 1
      })
    

    const isLoading = paymentsLoading || readingsLoading || billsLoading 
    const isPlaceholderData = pdPayments || pdReading || pdBills

    const computeOld = (date : moment.Moment)=>{
        const types = ["Manila Water", "Meralco"]
        const billStr =  date.format("YYYY-MM-DD")
        let bill = bills.sort((a,b)=>a.dateStart > b.dateStart ? -1 : 1)
            .find(e=>e.dateEnd < billStr)
        let readings = untatsReadings.map(e=>({...e, billConsumption:e.consumption}))

        const currentStart = date.clone().add(-1, "months")
        const currentEnd = date.clone().add(-1, "day")

        const prevEnd = date.clone().add(-1 , "months").add(-1, "day")


        const startStr = currentStart.format("YYYY-MM-DD")
        const endStr = currentEnd.format("YYYY-MM-DD")

        const monthReadings = readings.filter(e=>e.date > startStr && e.date <= endStr)
        
        let priorReading = {} as any
        let postReading = {} as any

        types.forEach((type : string)=>{
          priorReading[type] = readings.sort((a,b)=>a.date > b.date ? -1 : 1)
            .find(e=> e.date < startStr && e.type == type)
          
            
          postReading[type] = readings.sort((a,b)=>a.date < b.date ? -1 : 1)
            .find(e=> e.date > endStr && e.type == type)
        })

        let monthPayments = payments.filter(e=>moment(e.dateAdded).isAfter(currentStart)
                                  && moment(e.dateAdded).isBefore(currentEnd) && e.status == "Approved"
                              )
      
        Object.values(postReading)
            .forEach(e=>{
              if(!e) return
              let current = monthReadings.sort((a,b)=>a.date > b.date ? 1:-1)
                .find(r=>r.type == e.type)
                if(!current) return
              let shouldEstimate = current.date != endStr
              if(!shouldEstimate) return
              
              let postReadDate = moment(e.date)
              let lastReadDate = moment(current.date)
              let readDiff = postReadDate.diff(lastReadDate, "days") + 1
              let billDiff = currentEnd.diff(lastReadDate,"days") + 1

              let actualUsage = current.consumption / readDiff * billDiff
              current.billConsumption = actualUsage;
              current.actualDayCount = billDiff
              current.estimated = true;
            })
          Object.values(priorReading)
          .forEach(e=>{
            if(!e) return
            let shouldEstimate = e.date != prevEnd.format("YYYY-MM-DD")
            if(!shouldEstimate) return
            let current = monthReadings.sort((a,b)=>a.date < b.date ? 1:-1)
              .find(r=>r.type == e.type)
            if(!current) return
            let priorReadDate = moment(e.date)
            let firstReadDate = moment(current.date)
            let billDate = currentEnd;
            let readDiff = firstReadDate.diff(priorReadDate, "days")
            let billDiff = firstReadDate.diff(currentStart,"days")

            let actualUsage = e.consumption / readDiff * billDiff
            e.billConsumption = actualUsage;
            e.actualDayCount = billDiff
            e.estimated = true;
            monthReadings.push(e)
          })
      let paymentAmount = monthPayments.reduce((p,c)=>{
        p += c.amount
        return p
      },0) 
      let currentAmount = monthReadings.reduce((p,c)=>{
        p+= (c.billConsumption * c.per_unit)
        return p
      },0)

      return {
        id: date.format("YYYY-MM-DD"),
        dateStart: currentStart,
        dateEnd: currentEnd,
        current:currentAmount,
        payments:paymentAmount,
        previous: bill.balance,
        bills:monthReadings,
        balance: bill.balance -paymentAmount +currentAmount
      }

    }


    

    const billDateRange = (date, billDate)=>{
      
      return {
          prevMonth: date.clone().set("date", billDate),
          monthStartStr: date.clone().add(-1,"month").set("date", billDate).format("YYYY-MM-DD"),
          monthEndStr: date.clone().set("date", billDate).add(-1,"day").format("YYYY-MM-DD"),
          monthStart:date.clone().add(-1,"month").set("date", billDate),
          monthEnd: date.clone().set("date", billDate).add(-1,"day")
      }

    }

    const computeBill = (date:moment.Moment)=>{
      const types = ["Manila Water", "Meralco"]
      let p = {
        "Manila Water": {
          type:"Manila Water",
          cutOff : billPrefs["Manila Water"]
        },
        "Meralco": {
          type:"Meralco",
          cutOff : billPrefs["Meralco"]
        }
      }
      const cutOff = Object.values(p).reduce((prev,c)=>{
        if(!prev) return c.cutOff
        if(prev> c.cutOff) return prev
        return c.cutOff
      }, null)

      const prevMonth = date.clone().add(1,"month").add(-cutOff,"day")
                  .add(1,"day").add(-1,"month").set("date",1)
      p = Object.keys(p).reduce((prev,c)=>{
        prev[c] = {...p[c], ...billDateRange(prevMonth, p[c].cutOff)}
        return prev

      },{})
      const paymentRange = Object.values(p).reduce((prev,c)=>{
        if(!prev) return c
        if(prev.cutOff > c.cutOff) return prev
        return c
      }, null)


      const billStr =  date.format("YYYY-MM-DD")
      let bill = bills.sort((a,b)=>a.dateStart > b.dateStart ? -1 : 1)
          .find(e=>e.dateEnd < billStr)
      let readings = untatsReadings.map(e=>({...e, billConsumption:e.consumption}))
      const monthReadings = readings.filter(e=>e.date > p[e.type].monthStartStr && e.date <= p[e.type].monthEndStr)
      let priorReading = {} as any
      let postReading = {} as any

      types.forEach((type : string)=>{
        priorReading[type] = readings.sort((a,b)=>a.date > b.date ? -1 : 1)
          .find(e=> e.date < p[e.type].monthStartStr && e.type == type)
        
          
        postReading[type] = readings.sort((a,b)=>a.date < b.date ? -1 : 1)
          .find(e=> e.date > p[e.type].monthEndStr && e.type == type)
      })
      let monthPayments = payments.filter(e=>moment(e.DateAdded).isAfter(paymentRange.monthStart)
                                && moment(e.DateAdded).isBefore(paymentRange.monthEnd) && e.Status == "Approved"
                            )
  
                            Object.keys(priorReading)
                            .forEach(key=>{
                              if(monthReadings.length == 0) return
                              let e = priorReading[key]
                              let current = monthReadings.sort((a,b)=>a.date < b.date ? 1:-1)
                                .find(r=>r.type == key)
                              let shouldEstimate = !e || (e.date != p[current.type].monthStart.add(-1,"day").format("YYYY-MM-DD"))
                              if(!e) e = {
                                type : key,
                                date : moment(current.date).clone().add(-1,"month").format("YYYY-MM-DD")
                                //prior read date was just fetch for date reference of the estimated consumption
                              }

                              current.prevReading = current.reading && current.reading - current.consumption 

                              if(!shouldEstimate) return
                              let priorReadDate = moment(e.date)
                              let firstReadDate = moment(current.date)
                              let billStart =  p[current.type].monthStart
                              let billEnd = moment(current.date)


                              let readDiff = firstReadDate.diff(priorReadDate, "days")
                              let billDiff = billEnd.diff(billStart,"days")
                    
                              // console.log( (current.consumption / readDiff * billDiff))
                              let actualUsage =  e.reading ? Math.round(current.consumption / readDiff * billDiff) : (current.consumption / readDiff * billDiff)
                              
                              current.prorated = {
                                consumption : actualUsage,
                                reading :  !current.reading ? 0 : (current.reading ),
                                dayCount : billDiff,
                                dateStart : p[current.type].monthStartStr,
                                dateEnd : current.date,
                                isEstimated : true
                              }
                              current.section = "prior"
                              current.estimated = true;
                            })
      Object.values(postReading)
        .forEach(e=>{
          if(!e) return
          let current = monthReadings.sort((a,b)=>a.date > b.date ? 1:-1)
            .find(r=>r.type == e.type)
            if(!current) return
          let shouldEstimate = current.date !=  p[e.type].monthEndStr
          if(!shouldEstimate) return
          
          let postReadDate = moment(e.date)
          let lastReadDate = moment(current.date)
          let readDiff =  postReadDate.diff(lastReadDate, "days")

          let billStart = current.date
          let billEnd = p[current.type].monthEnd
          let billDiff = billEnd.diff(billStart,"days")


          console.log( (e.consumption / readDiff * billDiff))
          let actualUsage = e.reading ? Math.round(e.consumption / readDiff * billDiff) : (e.consumption / readDiff * billDiff)
          e.prorated = {
            consumption : actualUsage,
            dayCount : billDiff,
            reading:  !e.reading ? 0 : ( e.reading - e.consumption + actualUsage),
            dateStart : current.date,
            dateEnd : p[current.type].monthEndStr,
            isEstimated : true
          }
          e.section = "post"
          e.estimated = true;
          monthReadings.push(e)
        })
      let paymentAmount = monthPayments.reduce((p,c)=>{
          p += c.File.amount
          return p
        },0) 
      let currentAmount = monthReadings.reduce((p,c)=>{
          p+= (c.prorated?.consumption || c.consumption ) * c.per_unit
          return p
        },0)

      return {
        id: date.format("YYYY-MM-DD"),
        dateStart: paymentRange.monthStartStr,
        dateEnd: paymentRange.monthEndStr,
        current:currentAmount,
        previous: bill.previous,
        readings:monthReadings,
        payments:monthPayments,
        totalPayment: paymentAmount,
        balance: bill.previous -paymentAmount +currentAmount
      }
    }



    const result = useMemo(()=>{
      if(isLoading || isPlaceholderData)
        return null
      return computeBill(moment(date))
    },[bills,untatsReadings,payments,date])

    return {result, isLoading :(isPlaceholderData || isLoading) };
}
export default useBillComputation 