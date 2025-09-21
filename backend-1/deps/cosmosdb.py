

import datetime
import os
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient
import pytz

tz_default = pytz.timezone(os.environ["TIMEZONE"])

if "COSMOS_KEY" in os.environ and os.environ["COSMOS_KEY"] != "":
    credential = os.environ["COSMOS_KEY"]
else:
    credential = DefaultAzureCredential()


def utcstr_to_datetime(str):
    if not str.endswith('Z'):
        str = str + "Z"

    try:
            # It's a UTC timestamp
            naive_dt = datetime.datetime.strptime(str, "%Y-%m-%dT%H:%M:%SZ")
            utc_aware_dt = pytz.utc.localize(naive_dt)
            return utc_aware_dt
            # It's a non-UTC timestamp
    except ValueError:
        # Catch any malformed strings that don't match either format
        
        return pytz.utc.localize(datetime.datetime(datetime.UTC))


def get_db(name = os.environ["COSMOS_DB"]):
    cosmos_client = CosmosClient(os.environ["COSMOS_ENDPOINT"], credential)
    return cosmos_client.get_database_client(name)


def get_latest_from_container(container : str):
    db = get_db()
    container = db.get_container_client(container)
    items = container.query_items("select * from c order by c._ts desc offset 0 limit 1", enable_cross_partition_query=True)
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


def get_item_by_id(container, id):
    db = get_db()
    container = db.get_container_client(container)
    items = container.query_items("select * from c where c.id=@id", parameters=[{"name":"@id", "value":id}], partition_key="default")
    item = next(items, None)
    return item
     


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
    dateafter = utcstr_to_datetime(data["datetime"]) - datetime.timedelta(minutes=10)


    strBefore = datebefore.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    strAfter = dateafter.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    partition = utcstr_to_datetime(data["datetime"]).astimezone(tz_default).strftime("%Y-%m-01")

    items = container.query_items("""
            select * from c where c.JsonData.notif_pkg = 'com.globe.gcash.android'
            and c.JsonData.timestamp > @strBefore
            and c.JsonData.timestamp < @strAfter
            and c.PartitionKey = @partition
        """, parameters = [
            {"name":"strBefore", "value":strBefore},
            {"name":"strAfter", "value":strAfter},
            {"name":"partition", "value":partition}
        ], partition_key=partition)
    

    def filter_fn(row):
        if float(row["ExtractedData"]["amount"]) != float(data["amount"]): return False
        if row["ExtractedData"]["matchedConfig"] == "gcash_receive": 
            return True
        
        if row["ExtractedData"]["matchedConfig"] == "notif_gcash_instapay" \
            and row["ExtractedData"]["senderAcct"] == data["senderAcct"][-4]:
                return True
        return False

    filtered = filter(filter_fn, items)

    

    return filtered