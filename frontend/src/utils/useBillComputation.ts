import moment from "moment"
import { useAllBills, useAllPayments, useAllReading } from "../repositories/repository"
import { useMemo } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

interface Reading {
  type: string;
  date: string;
  consumption: number;
  billConsumption: number;
  per_unit: number;
  reading?: number;
  prevReading?: number;
  actualDayCount?: number;
  estimated?: boolean;
  master_reading?: number;
  master_consumption?: number;
  prorated?: {
    consumption: number;
    reading: number;
    dayCount: number;
    dateStart: string;
    dateEnd: string;
    isEstimated: boolean;
  };
  section?: string;
  dateStart?: string;
  dateEnd?: string;
}

interface Bill {
  id: string;
  dateStart: string;
  dateEnd: string;
  current: number;
  previous: number;
  balance: number;
  readings: Reading[];
  payments: any[];
  totalPayment: number;
}

const useBillComputation = (date: moment.Moment | string) => {



  const { data: payments, isLoading: paymentsLoading, isPlaceholderData: pdPayments } = useAllPayments()
  const { data: untatsReadings, isLoading: readingsLoading, isPlaceholderData: pdReading } = useAllReading()
  const { data: bills, isLoading: billsLoading, isPlaceholderData: pdBills } = useAllBills()

  const [billPrefs] = useLocalStorage("billPrefs", {
    "Meralco": 1,
    "Manila Water": 1
  })


  const isLoading = paymentsLoading || readingsLoading || billsLoading
  const isPlaceholderData = pdPayments || pdReading || pdBills




  const billDateRange = (date: moment.Moment, billDate: number) => {

    return {
      prevMonth: date.clone().set("date", billDate),
      monthStartStr: date.clone().add(-1, "month").set("date", billDate).format("YYYY-MM-DD"),
      monthEndStr: date.clone().set("date", billDate).add(-1, "day").format("YYYY-MM-DD"),
      monthStart: date.clone().add(-1, "month").set("date", billDate),
      monthEnd: date.clone().set("date", billDate).add(-1, "day")
    }

  }

  const computeBill = (date: moment.Moment) => {
    const types = ["Manila Water", "Meralco"]
    let p = {
      "Manila Water": {
        type: "Manila Water",
        cutOff: billPrefs["Manila Water"]
      },
      "Meralco": {
        type: "Meralco",
        cutOff: billPrefs["Meralco"]
      }
    }
    const cutOff = Object.values(p).reduce((prev: any, c: any) => {
      if (!prev) return c.cutOff
      if (prev > c.cutOff) return prev
      return c.cutOff
    }, null)

    const prevMonth = date.clone().add(1, "month").add(-cutOff, "day")
      .add(1, "day").add(-1, "month").set("date", 1)

    let typedP: Record<string, any> = p;

    typedP = Object.keys(typedP).reduce((prev: any, c: string) => {
      prev[c] = { ...typedP[c], ...billDateRange(prevMonth as any, typedP[c].cutOff) }
      return prev

    }, {})

    const paymentRange = Object.values(typedP).reduce((prev: any, c: any) => {
      if (!prev) return c
      if (prev.cutOff > c.cutOff) return prev
      return c
    }, null)


    const billStr = date.format("YYYY-MM-DD")
    let bill = (bills as any[]).sort((a, b) => a.dateStart > b.dateStart ? -1 : 1)
      .find(e => e.dateEnd < billStr)
    let readings = (untatsReadings as any[]).map(e => ({ ...e, billConsumption: e.consumption })) as Reading[]
    const monthReadings = readings.filter(e => e.date > typedP[e.type].monthStartStr && e.date <= typedP[e.type].monthEndStr)
    let priorReading = {} as Record<string, Reading>
    let postReading = {} as Record<string, Reading>

    types.forEach((type: string) => {
      priorReading[type] = readings.sort((a, b) => a.date > b.date ? -1 : 1)
        .find(e => e.date < typedP[type].monthStartStr && e.type == type) as Reading

      postReading[type] = readings.sort((a, b) => a.date < b.date ? -1 : 1)
        .find(e => e.date > typedP[type].monthEndStr && e.type == type) as Reading
    })
    let monthPayments = (payments as any[]).filter(e => moment(e.DateAdded).isAfter(paymentRange.monthStart)
      && moment(e.DateAdded).isBefore(paymentRange.monthEnd) && e.Status == "Approved"
    )

    Object.keys(priorReading)
      .forEach(key => {
        if (monthReadings.length == 0) return
        let e = priorReading[key]
        let current = monthReadings.sort((a, b) => a.date < b.date ? 1 : -1)
          .find(r => r.type == key)

        if (!current) return;

        let shouldEstimate = !e || (e.date != typedP[current.type].monthStart.add(-1, "day").format("YYYY-MM-DD"))
        if (!e) e = {
          type: key,
          date: moment(current?.date).clone().add(-1, "month").format("YYYY-MM-DD")
          //prior read date was just fetch for date reference of the estimated consumption
        } as any

        if (current) {
          current.prevReading = current.reading && current.reading - current.consumption
        }

        if (!shouldEstimate || !current) return
        let priorReadDate = moment(e.date)
        let firstReadDate = moment(current.date)
        let billStart = typedP[current.type].monthStart
        let billEnd = moment(current.date)


        let readDiff = firstReadDate.diff(priorReadDate, "days")
        let billDiff = billEnd.diff(billStart, "days")

        // console.log( (current.consumption / readDiff * billDiff))
        let actualUsage = e.reading ? Math.round(current.consumption / readDiff * billDiff) : (current.consumption / readDiff * billDiff)

        current.prorated = {
          consumption: actualUsage,
          reading: !current.reading ? 0 : (current.reading),
          dayCount: billDiff,
          dateStart: typedP[current.type].monthStartStr,
          dateEnd: current.date,
          isEstimated: true
        }
        current.section = "prior"
        current.estimated = true;
      })
    Object.values(postReading)
      .forEach(e => {
        if (!e) return
        let current = monthReadings.sort((a, b) => a.date > b.date ? 1 : -1)
          .find(r => r.type == e.type)
        if (!current) return
        let shouldEstimate = current.date != typedP[e.type].monthEndStr
        if (!shouldEstimate) return

        let postReadDate = moment(e.date)
        let lastReadDate = moment(current.date)
        let readDiff = postReadDate.diff(lastReadDate, "days")

        let billStart = current.date
        let billEnd = typedP[current.type].monthEnd
        let billDiff = billEnd.diff(billStart, "days")


        console.log((e.consumption / readDiff * billDiff))
        let actualUsage = e.reading ? Math.round(e.consumption / readDiff * billDiff) : (e.consumption / readDiff * billDiff)
        e.prorated = {
          consumption: actualUsage,
          dayCount: billDiff,
          reading: !e.reading ? 0 : (e.reading - e.consumption + actualUsage),
          dateStart: current.date,
          dateEnd: typedP[current.type].monthEndStr,
          isEstimated: true
        }
        e.section = "post"
        e.estimated = true;
        monthReadings.push(e)
      })
    let paymentAmount = monthPayments.reduce((p: number, c: any) => {
      p += Number.parseFloat(c.File.amount)
      return p
    }, 0)
    let currentAmount = monthReadings.reduce((p: number, c: Reading) => {
      p += (c.prorated?.consumption || c.consumption) * c.per_unit
      return p
    }, 0)

    const submeterUnits = monthReadings.reduce((p: number, c: Reading) => p + (c.prorated?.consumption || c.consumption || 0), 0)

    let masterAmount = monthReadings.reduce((p: number, c: Reading) => {
      const submeterCons = c.prorated?.consumption || c.consumption
      const masterCons = c.master_consumption || submeterCons
      p += masterCons * c.per_unit
      return p
    }, 0)

    let masterUnits = monthReadings.reduce((p: number, c: Reading) => {
      const submeterCons = c.prorated?.consumption || c.consumption
      const masterCons = c.master_consumption || submeterCons
      p += masterCons
      return p
    }, 0)

    let oldOurAmount = masterAmount - currentAmount
    let oldOurUnits = masterUnits - submeterUnits

    const details = types.reduce((acc: any, type: string) => {
      const typeReadings = monthReadings.filter(r => r.type === type);
      const subUnits = typeReadings.reduce((sum, r) => sum + (r.prorated?.consumption || r.consumption || 0), 0);
      const mastUnits = typeReadings.reduce((sum, r) => sum + (r.master_consumption || (r.prorated?.consumption || r.consumption || 0)), 0);
      acc[type] = {
        consumption: subUnits,
        masterConsumption: mastUnits,
        ourConsumption: mastUnits - subUnits,
        masterReading: typeReadings.find(r => r.master_reading)?.master_reading
      };
      return acc;
    }, {});

    return {
      id: date.format("YYYY-MM-DD"),
      dateStart: paymentRange.monthStartStr,
      dateEnd: paymentRange.monthEndStr,
      current: currentAmount,
      masterCurrent: masterAmount,
      ourCurrent: oldOurAmount,
      consumption: submeterUnits,
      masterConsumption: masterUnits,
      ourConsumption: oldOurUnits,
      previous: bill.previous,
      readings: monthReadings,
      details: details, // ADDED PER-TYPE DETAILS
      payments: monthPayments,
      totalPayment: paymentAmount,
      balance: bill.previous - paymentAmount + currentAmount
    }
  }



  const result = useMemo(() => {
    if (isLoading || isPlaceholderData)
      return null
    return computeBill(moment(date))
  }, [bills, untatsReadings, payments, date])

  return { result, isLoading: (isPlaceholderData || isLoading) };
}
export default useBillComputation 