

from datetime import datetime
from functools import wraps
import json
import logging
import math
import os
import traceback
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient
from dateutil.relativedelta import relativedelta
import pytz
from dateutil import parser
from deps.util import date_diff_with_tz

tz_default = pytz.timezone(os.environ["TIMEZONE"])

if "COSMOS_KEY" in os.environ and os.environ["COSMOS_KEY"] != "":
    credential = os.environ["COSMOS_KEY"]
else:
    credential = DefaultAzureCredential()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def debug_tool(func):
    """Decorator to log tool inputs and outputs for troubleshooting."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        logger.info(f">>> TOOL CALL START: {func_name}")
        logger.info(f">>> ARGUMENTS: args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            # Log a snippet of the result to see if it's empty or malformed
            res_str = str(result)[:500] + "..." if len(str(result)) > 500 else str(result)
            logger.info(f">>> TOOL RESULT SUCCESS: {res_str}")
            return result
        except Exception as e:
            logger.error(f">>> TOOL ERROR in {func_name}: {str(e)}")
            logger.error(traceback.format_exc())
            return {"error": f"Internal tool error in {func_name}", "details": str(e)}
    return wrapper


def datestr_to_utcstr(date):
    naive_dt = datetime.strptime(date, "%Y-%m-%d")
    utc_aware_dt = tz_default.localize(naive_dt)
    utc_dt = utc_aware_dt.astimezone(pytz.utc)
    utc_string = utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return utc_string

def  utcstr_to_datetime(str):
    if not str.endswith('Z'):
        str = str + "Z"

    try:
            # It's a UTC timestamp
            naive_dt = datetime.strptime(str, "%Y-%m-%dT%H:%M:%SZ")
            utc_aware_dt = pytz.utc.localize(naive_dt)
            return utc_aware_dt
            # It's a non-UTC timestamp
    except ValueError:
        # Catch any malformed strings that don't match either format
        
        return pytz.utc.localize(datetime(datetime.UTC))


def get_db(name = os.environ["COSMOS_DB"]):
    cosmos_client = CosmosClient(os.environ["COSMOS_ENDPOINT"], credential)
    return cosmos_client.get_database_client(name)


def get_latest_from_container(container : str):
    db = get_db()
    container = db.get_container_client(container)
    items = container.query_items("select * from c order by c.DisconnectTime desc offset 0 limit 1", enable_cross_partition_query=True)
    item = next(items, None)
    return item



def add_to_app(container, record):
    db = get_db()
    container = db.get_container_client(container)
    container.upsert_item(record)
    return record

def get_all_container(container):
    db = get_db()
    container = db.get_container_client(container)
    items = container.query_items("select * from c  order by c._ts desc", enable_cross_partition_query=True)
    return list(items)

def get_masterbills_by_billdate(date):
    end_date = datetime.strptime(date, "%Y-%m-%d")
    start_date = end_date - relativedelta(months=1)

    start_str = start_date.strftime("%Y-%m-%d")
    yr = start_date.year
    db = get_db()
    container = db.get_container_client("MasterBills")
    result = container.query_items("""
            select * from c where c.bill_date >= @start and c.bill_date <= @end and c.year=@yr
        """,  parameters=[
                {"name":"@start", "value":start_str},
                {"name":"@end", "value":date},
                {"name":"@yr", "value": yr}], 
            partition_key=yr)
    return list(result)



def get_item_by_id(container, id):
    db = get_db()
    container = db.get_container_client(container)
    items = container.query_items("select * from c where c.id=@id", parameters=[{"name":"@id", "value":id}], partition_key="default")
    item = next(items, None)
    return item

def get_reading_by_date(date, bill_type, order):
    db = get_db()
    container = db.get_container_client("Readings")
    query = f"""
            SELECT TOp 1 * FROM c 
            where c.date {"<=" if order.lower() == "desc" else ">="} @date
                and c.type = @type
            order by c.date { "desc" if order.lower() == "desc" else "asc" }
        """
    items = container.query_items(query, parameters=[{"name":"@date", "value":date}, {"name":"@type", "value":bill_type}], partition_key="default")
    if(items == None): return None
    return next(items,None)
     

def add_to_finance(container, record):
    db = get_db(os.environ["FINANCE_DB"])
    container = db.get_container_client(container)
    container.upsert_item(record)
    return record

def get_file_by_id(id):
    db = get_db(os.environ["FINANCE_DB"])
    container = db.get_container_client("Files")
    items = container.query_items("select * from c where c.id=@id", parameters=[{"name":"@id", "value":id}], partition_key="default")
    item = next(items, None)
    return item

def check_notifs_gcash(data):
    db = get_db(os.environ["FINANCE_DB"])
    container = db.get_container_client("HookMessages")

    datebefore = utcstr_to_datetime(data["datetime"]) - datetime.timedelta(minutes=10)
    dateafter = utcstr_to_datetime(data["datetime"]) + datetime.timedelta(minutes=10)


    strBefore = datebefore.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    strAfter = dateafter.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    partition = utcstr_to_datetime(data["datetime"]).astimezone(tz_default).strftime("%Y-%m-01")

    items = container.query_items("""
            select * from c where c.JsonData.notif_pkg = 'com.globe.gcash.android'
            and c.JsonData.timestamp > @strBefore
            and c.JsonData.timestamp < @strAfter
            and c.MonthKey = @partition
        """, parameters = [
            {"name":"@strBefore", "value":strBefore},
            {"name":"@strAfter", "value":strAfter},
            {"name":"@partition", "value":partition}
        ], partition_key=partition)

    def filter_fn(row):
        if float(row["ExtractedData"]["amount"]) != float(data["amount"]): return False
        if row["ExtractedData"]["matchedConfig"] == "notif_gcash_receive": 
            return True
        
        if row["ExtractedData"]["matchedConfig"] == "notif_gcash_instapay" \
            and row["ExtractedData"]["senderAcct"] == data["senderAcct"][-4]:
                return True
        return False

    filtered = filter(filter_fn, items)

    

    return filtered

def create_monthly_bill(date):
    #get previous balance
    db = get_db()
    container = db.get_container_client("Bills")
    items = container.query_items("""select top 1 * from c
                                    where c.dateEnd < @date
                                    order by c.dateEnd Desc                                  
                                  """, parameters=[{"name":"@date", "value":date}], partition_key="default")
    prev_balance = next(items, None)
    
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    current_start = date_obj + relativedelta(months = -1)
    current_end = current_start + relativedelta(months = 1) - datetime.timedelta(days=1)

    current_start_str = current_start.strftime( "%Y-%m-%d")
    current_end_str = current_end.strftime("%Y-%m-%d")

    # prev_start_date = (current_start+ relativedelta(months=-1))
    # prev_start = prev_start_date.strftime("%Y-%m-%d")
    # prev_end = prev_start_date + relativedelta(months = 1)- datetime.timedelta(days=1)
    readings_tbl = db.get_container_client("Readings")
    readings = readings_tbl.query_items("""select * from c
                                    where c.date > @start and
                                    c.date < @end
                                  """, parameters=[
                                      {"name":"@start", "value":current_start_str},
                                      {"name":"@end", "value":date},
                                      ], partition_key="default")
    readings = list(readings)
    
    types = ["Manila Water", "Meralco"]
    prior_reading = {}
    post_reading = {}
    for type in types:
        prior_reading[type] = readings_tbl.query_items("""select top 1 * from c
                                        where c.date < @date and
                                            c.type = @type
                                            order by c.date desc
                                    """, parameters=[
                                        {"name":"@date", "value":current_start_str},
                                        {"name":"@type", "value":type},
                                        ], partition_key="default")
        prior_reading[type] = next(prior_reading[type], None)
    
    for type in types:
        post_reading[type] = readings_tbl.query_items("""select top 1 * from c
                                        where c.date > @date and
                                            c.type = @type
                                            order by c.date asc
                                    """, parameters=[
                                        {"name":"@date", "value":current_end_str},
                                        {"name":"@type", "value":type},
                                        ], partition_key="default")
        post_reading[type] = next(post_reading[type], None)

    prev_start_utc = datestr_to_utcstr(current_start_str)
    end_date_utc = datestr_to_utcstr(current_end_str)
    payments_tbl = db.get_container_client("PaymentsUploads")
    payments = payments_tbl.query_items("""select * from c where
                                    c.DateAdded > @start and
                                    c.DateAdded < @end and
                                    c.Status = 'Approved'
                                  """, parameters=[
                                        {"name":"@start", "value":prev_start_utc},
                                        {"name":"@end", "value":end_date_utc}
                                      ], partition_key="default")
    payments = list(payments)
    #should be estimated?
    

    for key in prior_reading.keys():
        #estimate prior
        if(key not in prior_reading or prior_reading[key] is None):
            continue
        shouldEstimate = prior_reading[key]["date"] != prev_balance["dateEnd"]
        if shouldEstimate: 
            current = sorted([item for item in readings if item["type"] == key], key = lambda item: item["date"]    )
           
            prior_read_date = datetime.strptime( prior_reading[key]["date"], "%Y-%m-%d")
            first_read_date = datetime.strptime( current[0]["date"], "%Y-%m-%d")
            prev_bill_date = datetime.strptime( prev_balance["dateEnd"]["date"], "%Y-%m-%d")
            reading_diff: datetime.timedelta = first_read_date - prior_read_date
            reading_diff = reading_diff.days
            bill_diff: datetime.timedelta =  prev_bill_date - first_read_date
            bill_diff = bill_diff.days

            actual_usage = current[0]["consumption"] / reading_diff * bill_diff
            for item in readings:
                if item["id"] == current[0]["id"]:
                    item["consumption"] = actual_usage
                    item["estimated"] = True
                    break
    for key in post_reading.keys():
        if key in post_reading :
            current = sorted([item for item in readings if item["type"] == key], key = lambda item: item["date"], reverse=True)
            if current is not None:
                shouldEstimate = current[0]["date"] != current_end_str
                # shouldEstimate = post_reading[key]["date"] != prev_end.strftime("%Y-%m-%d")
                if shouldEstimate: 

                    post_read_date = datetime.strptime( post_reading[key]["date"], "%Y-%m-%d")
                    last_read_date = datetime.strptime( current[0]["date"], "%Y-%m-%d")
                    reading_diff: datetime.timedelta = post_read_date - last_read_date + 1 #+1 because the date includes the current date
                    reading_diff = reading_diff.days
                    bill_diff: datetime.timedelta =  current_end - last_read_date + 1 # +1 because the date includes the current date
                    bill_diff = bill_diff.days

                    actual_usage = current[0]["consumption"] / reading_diff * bill_diff
                    for item in readings:
                        if item["id"] == current[0]["id"]:
                            item["consumption"] = actual_usage
                            item["estimated"] = True
                            break

    #compute 
    #prev amount - payments + current = balance

    payment_amount =  sum(item["File"]['amount'] for item in payments)
    current_amount = sum(item["consumption"] * item["per_unit"] for item in readings)

    


    current_bill = {
        "id" :date,
        "dateStart" : current_start_str,
        "PartitionKey":"default",
        "dateEnd" : current_end_str,
        "current": current_amount,
        "payments" :payment_amount,
        "previous" : prev_balance["balance"],
        "balance": prev_balance["balance"] - payment_amount + current_amount
    }        

    add_to_app("Bills", current_bill)
    return current_bill


def compute_daily(prev_balance = None):
    #get previous balance
    db = get_db()
    if(prev_balance == None):
        container = db.get_container_client("Bills")
        items = container.query_items("""select top 1 * from c
                                        order by c.dateEnd Desc                                  
                                    """, partition_key="default")
        prev_balance = next(items, None)



    use_for_compute = prev_balance["current"]
    outstanding = prev_balance["balance"]
    current = prev_balance["current"]



    timers = db.get_container_client("TimerDetails")
    timers_res = timers.query_items("""select top 1 * from c
                                    order by c.DisconnectTime Desc                              
                                  """, partition_key="default")

    last_timer = next(timers_res,None)


    difference = date_diff_with_tz(prev_balance["id"], pytz.utc, last_timer["DisconnectTime"], tz_default)

    #should compute which is higher outstanding or current_daily * 30
                            
    if(current > outstanding):
        use_for_compute = current #if mas malaki ung current sa outstanding divide by 2 nalang
    elif outstanding > (current * 1.05) :
        use_for_compute = current * 1.05
    else:
        use_for_compute = outstanding

    daily = math.ceil(use_for_compute / 300) * 10
    
    return daily

@debug_tool
def get_readings(date : str, month_count:int = 1):
    db = get_db()
    container = db.get_container_client("Readings")

    new_date = datetime.strptime(date, "%Y-%m-%d") - relativedelta(months=month_count)
    date_str = new_date.strftime("%Y-%m-%d")
    items = container.query_items("""select * from c
                                where c.date >= @date and c.date < @end_date
                            """,parameters=[
                                    {"name":"@end_date", "value":date},
                                    {"name":"@date", "value":date_str},
                                    ], partition_key="default")
    result = list(items)
    output = []
    for item in result:
        key_map = ["date","type","reading", "consumption","per_unit"]
        new_output = {old_k: item[old_k] for old_k in key_map if old_k in item}
        new_output["cost"] = new_output["consumption"] * new_output["per_unit"]
        output.append(new_output)
    
    return output

@debug_tool
def get_master_bills(date: str,  month_count:int = 1):
    db = get_db()
    container = db.get_container_client("MasterBills")

    curr_year = datetime.strptime(date, "%Y-%m-%d").year
    new_date = datetime.strptime(date, "%Y-%m-%d") - relativedelta(months=month_count)

    addtl_param = {"partition_key": new_date.year } if curr_year == new_date.year else {"enable_cross_partition_query":True}

    date_str = new_date.strftime("%Y-%m-%d")
    items = container.query_items("""select * from c
                                where c.bill_date >= @date and c.bill_date < @end_date
                            """,parameters=[
                                    {"name":"@end_date", "value":date},
                                    {"name":"@date", "value":date_str},
                                    ], **addtl_param)
    result = list(items)
    output = []

    for item in result:
        key_map = ["type","billing_start","billing_end","previous_reading", "current_reading","consumption","prev_balance","current","price_per_unit","payments", "total_balance", "file_id"]
        new_output = {old_k: item[old_k] for old_k in key_map if old_k in item}
        output.append(new_output)

    return output

@debug_tool
def get_latest_timer():
    item = get_latest_from_container("TimerDetails")
    key_map = ["DisconnectTime", "PaymentId", "Rate"]
    output = {old_k: item[old_k] for old_k in key_map if old_k in item}
    return output


@debug_tool
def get_complete_bill(date : str):
    logging.info("GET_COMPLETE BILL WAS TRIGGERED")


    db = get_db()
    container = db.get_container_client("Bills")
    items = container.query_items("""select top 1 * from c
                                  where c.id=@date
                                """,parameters=[
                                        {"name":"@date", "value":date},
                                      ], partition_key="default")
    result = next(items)
    key_map = {"id":"date", "dateStart":'dateStart', "dateEnd":"dateEnd", "current": "current", "payments":"payments","previous":"previous", "balance":"balance","daily_rate":"daily_rate"}
    bill = {new_k: result[old_k] for old_k, new_k in key_map.items() if old_k in result}

    readings = get_readings(date, 1)

    master_bills = get_master_bills(date,1)
    logging.info(json.dumps({
                "readings":readings,
                "bill":bill,
                "master_bills":master_bills 
            }
        ))
    return {
        "readings":readings,
        "bill":bill,
        "master_bills":master_bills 
    }
