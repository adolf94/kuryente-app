import datetime
import json
import os
import tempfile
import math
import azure.functions as func
import logging
from deps.google_auth import verify_custom_jwt
from deps.tuya import get_status, save_status_checkpoint, switch_device
from deps.textbee_sms import send_sms
from deps.cosmosdb import add_to_app, add_to_finance, check_notifs_gcash, create_monthly_bill, get_all_container, get_file_by_id, get_item_by_id, get_latest_from_container, get_reading_by_date
from deps.google_ai import identify_img_transact_ai
from deps.azure_blob import get_file, upload_to_azure,container_name
from werkzeug.utils import secure_filename
from uuid_extensions import uuid7, uuid7str

from httpblueprint import bp
app = func.FunctionApp()

app.register_functions(bp)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', "jfif"}  # Allowed file types

cached_files = {}



def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route(route="health", auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:

    return func.HttpResponse("ok", status_code=200)
@app.route(route="upload_proof", auth_level=func.AuthLevel.ANONYMOUS)
def upload_proof(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    #TODO : restrict filetype, filesize


    print(req.files["file"])
    file = req.files["file"]
    originalFileName = secure_filename(file.filename)
    if(allowed_file(originalFileName) == False):
            return func.HttpResponse(
                 json.dumps({
                "error": True,
                "message": "not allowed"
            }), mimetype="application/json", status_code=400)

    temp_file = tempfile.NamedTemporaryFile(delete=False)
    local_file_path = temp_file.name

    file.save(local_file_path)

    logging.info("file saved ")
    id = uuid7( as_type='str')
    fileId = id.replace("-","")
    fileType = originalFileName.split(".",1)[-1]
    blob_name = fileId + "." + fileType
    fileData = upload_to_azure(local_file_path, blob_name)



    record = {
        "id":id,
        "Container": container_name,
        "PartitionKey":"default",
        "Service": "blob",
        "OriginalFileName":originalFileName,
        "MimeType": file.mimetype ,
        "FileKey": blob_name,
        "Lines": [],
        "$type": "BlobFile",
        "App":"ai",
        "DateCreated": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "Status":"Active"
    }
    add_to_finance("Files", record)


    ai_response = identify_img_transact_ai(localpath=local_file_path, file_record=record)

    ai_response["fileId"] = id
    cached_files[id] = ai_response

    return func.HttpResponse(
        json.dumps(ai_response), mimetype="application/json", status_code=200)



            # if connection_string:
        #     blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        #     blob_client = blob_service_client.get_blob_client(container=container_name, blob_name=blob_name)


@app.route(route="files/{id}", methods=[func.HttpMethod.GET], auth_level=func.AuthLevel.ANONYMOUS)
def get_img_by_id(req: func.HttpRequest) -> func.HttpResponse:
    
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)

    if("KURYENTE_ADMIN" in user["role"] ):
        return func.HttpResponse("", status_code=403)
    

    id = req.route_params.get("id")
    item = get_file_by_id(id)
    if(item == None):
        return func.HttpResponse("", status_code=404)
    
    src = get_file(item)
    item["url"] = src


    return func.HttpResponse(json.dumps(item), mimetype="application/json", status_code=200)






@app.route(route="record_payment", methods=[func.HttpMethod.POST], auth_level=func.AuthLevel.ANONYMOUS)
def record_payment(req: func.HttpRequest) -> func.HttpResponse:
    
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)

    if("KURYENTE_ADMIN" in user["role"] ):
        return func.HttpResponse("", status_code=403)
    
    body = req.get_json()

    new_item = {
        "id" : uuid7str(),
        "PartitionKey" : "default",
        "Status": "Approved",
        "DateAdded": datetime.datetime.now(tz=datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "File": body
    }

    add_to_app("PaymentsUploads", new_item)

    current_timer = get_latest_from_container("TimerDetails")
    last_disconnect_time = datetime.datetime.strptime(current_timer["DisconnectTime"], "%Y-%m-%dT%H:%M:%SZ")
    new_disconnect_time = last_disconnect_time + datetime.timedelta(days=body["days"])
    new_data = {
        "id": uuid7str(),
        "PartitionKey": "default",
        "DisconnectTime": new_disconnect_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "PaymentId": new_item["id"],
        "Rate": current_timer["Rate"]
    }
    switch_device(True)
    add_to_app("TimerDetails",new_data)

    return func.HttpResponse(json.dumps({
        "timer" : new_data,
        "extend" : body["days"],
        "payment": new_item
    }), mimetype="application/json", status_code=200)

@app.route(route="decide_payment", auth_level=func.AuthLevel.ANONYMOUS)
def decide_payment(req: func.HttpRequest) -> func.HttpResponse:

    #validations
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)

    if("KURYENTE_ADMIN" in user["role"] ):
        return func.HttpResponse("", status_code=403)

    body = req.get_json()
    item = get_item_by_id("PaymentsUploads", body["id"])
    if(item == None):
        return func.HttpResponse("", status_code=400)

    if(item["Status"] == "Approved"):
        return func.HttpResponse("", status_code=409)

    if(body["newStatus"] == "Approved"):
        item["Status"] = "Approved"
        current_timer = get_latest_from_container("TimerDetails")
        last_disconnect_time = datetime.datetime.strptime(current_timer["DisconnectTime"], "%Y-%m-%dT%H:%M:%SZ")
        days_to_add = math.floor(float(item["File"]["amount"]) / current_timer["Rate"])
        new_disconnect_time = last_disconnect_time + datetime.timedelta(days=days_to_add)
        new_data = {
            "id": uuid7str(),
            "PartitionKey": "default",
            "DisconnectTime": new_disconnect_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "PaymentId": item["id"],
            "Rate": current_timer["Rate"]
        }
        switch_device(True)
        item["Days"] = days_to_add
        add_to_app("TimerDetails",new_data)

    else:
        new_data = None
        days_to_add = 0
        item["Status"] = "Rejected"
        item["Reason"] = "" if "reason" not in body else body["reason"]

    add_to_app("PaymentsUploads", item)

    return func.HttpResponse(json.dumps({
        "timer" : new_data,
        "extend" : days_to_add,
        "payment": item
    }), mimetype="application/json", status_code=200)


@app.route(route="payments", methods=[func.HttpMethod.GET], auth_level=func.AuthLevel.ANONYMOUS)
def payments(req:func.HttpRequest) -> func.HttpResponse:

    #validations
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)
    
    
    items = get_all_container("PaymentsUploads")
    return func.HttpResponse(json.dumps(items), mimetype="application/json", status_code=200)


@app.route(route="bills", methods=[func.HttpMethod.GET], auth_level=func.AuthLevel.ANONYMOUS)
def bills(req:func.HttpRequest) -> func.HttpResponse:

    #validations
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)
    
    
    items = get_all_container("Bills")
    return func.HttpResponse(json.dumps(items), mimetype="application/json", status_code=200)


# @app.route(route="trigger_status_checkpoint", auth_level=func.AuthLevel.ANONYMOUS)
# def test_sms(req: func.HttpRequest) -> func.HttpResponse:
#     save_status_checkpoint()
#     return func.HttpResponse("ok", status_code=200)

@app.route(route="readings",methods=[func.HttpMethod.GET],  auth_level=func.AuthLevel.ANONYMOUS)
def readings(req: func.HttpRequest) -> func.HttpResponse:
    
    user = verify_custom_jwt(req.headers.get("Authorization"))
    if(user == None):
        return func.HttpResponse("", status_code=401)

    items = get_all_container("Readings")
    return func.HttpResponse(json.dumps(items),mimetype="application/json",  status_code=200)

@app.route(route="create_bill", methods=["GET"],auth_level=func.AuthLevel.ANONYMOUS)
def create_bill(req:func.HttpRequest) -> func.HttpResponse:
    date = req.params.get('date')
    bill = create_monthly_bill(date)
    return func.HttpResponse(json.dumps(bill),mimetype="application/json",  status_code=200)


@app.route(route="add_reading", auth_level=func.AuthLevel.ANONYMOUS)
def add_reading(req: func.HttpRequest) -> func.HttpResponse:
    
    user = verify_custom_jwt(req.headers.get("Authorization"))
    body = req.get_json()
    if(user == None):
        return func.HttpResponse(status_code=401)
    if("KURYENTE_ADMIN" not in user["role"] ):
        return func.HttpResponse(status_code=403, mimetype="application/json")
    
    after = get_reading_by_date(body["date"], body["type"], "asc")
    before = get_reading_by_date(body["date"], body["type"], "desc")
    if "id" not in body: body["id"] =  uuid7str()
    body["PartitionKey"] = "default"

    if(body["reading"] is not None and body["reading"] > 0):
        if(body["consumption"] is not None and before is not None):
            prev = int(before["reading"])
            body["consumption"] = int(body["reading"]) - prev
        else:
            body["consumption"] = int(body["reading"])
    add_to_app("Readings", body)
    
    if(after is not None):
        #update after
        if(after["consumption"] is not None):
            prev = int(body["reading"])
            after["consumption"] = int(after["reading"]) - prev
            add_to_app("Readings", after)

    return func.HttpResponse(json.dumps(body),mimetype="application/json",  status_code=201)



@app.route(route="confirm_payment", auth_level=func.AuthLevel.ANONYMOUS)
def confirm_payment(req: func.HttpRequest) -> func.HttpResponse:

    body = req.get_json()
    if body["fileId"] not in cached_files:
         return func.HttpResponse(json.dumps({"error": "File information is not found or expired. Please try again."}), mimetype="application/json", status_code=400)

    #verify for same reference id
    ai_data = cached_files[body["fileId"]]
    if(ai_data["isValid"] == False):
        return func.HttpResponse(json.dumps({"error": "File information is not found or expired. Please try again."}), mimetype="application/json", status_code=400)

    if(ai_data["recipientBank"].lower().find("gcash") == -1):
        id = uuid7str()
        data = {
            "File": ai_data,
            "Days":ai_data["days"],
            "id": id,
            "DateAdded": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "Status": "Pending",
            "PartitionKey":"default"
        }
         #notif
        add_to_app("PaymentsUploads", data)
        send_sms(os.environ["SMS_NUMBER"],f"ACTION REQUIRED: New payment ({ai_data["recipientBank"]}) from kuryente-app is in for review!---{id}")

    else:
        result = check_notifs_gcash(ai_data)
        current_timer = get_latest_from_container("TimerDetails")

        count = len(list(result))
        new_data = None
        if(count == 1):
            id = uuid7str()

            data = {
                "id": uuid7str(),
                "File": ai_data,
                "DateAdded": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "notif": next(result),
                "Days":ai_data["days"],
                "Status": "Approved",
                "PartitionKey":"default"
            }
            send_sms(os.environ["SMS_NUMBER"],f"FYI: New payment ({ai_data["recipientBank"]}) from kuryente-app has been auto approved!---{id}")


            last_disconnect_time = datetime.datetime.strptime(current_timer["DisconnectTime"], "%Y-%m-%dT%H:%M:%SZ")
            days_to_add = math.floor(float(ai_data["amount"]) / current_timer["Rate"])
            new_disconnect_time = last_disconnect_time + datetime.timedelta(days=days_to_add)
            new_data = {
                "id": uuid7str(),
                "PartitionKey": "default",
                "DisconnectTime": new_disconnect_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "PaymentId": data["id"],
                "Rate": current_timer["Rate"]
            }
            switch_device(True)
            add_to_app("TimerDetails",new_data)
            add_to_app("PaymentsUploads", data)
            # if(last_disconnect_time > datetime.datetime.now(datetime.UTC)):
            #     last_disconnect_time = datetime.datetime.now(datetime.UTC)

        else:
            id = uuid7str()

            data = {
                "File": ai_data,
                "id": id,
                
                "Reason": f"Found {count} matching the payment. needs verification",
                "Days":ai_data["days"],
                "DateAdded": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "Status": "Pending",
                "PartitionKey":"default"
            }

            last_disconnect_time = datetime.datetime.strptime(current_timer["DisconnectTime"], "%Y-%m-%dT%H:%M:%SZ")
            new_disconnect_time = last_disconnect_time + datetime.timedelta(days=1)
            current_timer["ExtendedTimer"] = new_disconnect_time.strftime("%Y-%m-%dT%H:%M:%SZ")


            add_to_app("TimerDetails",current_timer)
            #notif
            add_to_app("PaymentsUploads", data)
            send_sms(os.environ["SMS_NUMBER"],f"ACTION REQUIRED: New payment ({ai_data["recipientBank"]}) from kuryente-app is in for review!---{id}")



        output = {
                "data": data,
                "new_timer" : None if new_data is None else new_data
            }
        return func.HttpResponse(json.dumps(output),mimetype="application/json",  status_code=200)



    return func.HttpResponse(
        json.dumps(cached_files[body["fileId"]]), mimetype="application/json", status_code=200)



@app.timer_trigger(schedule="0 5 6 * * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False)
def turn_off_trigger(myTimer: func.TimerRequest) -> None:

    save_status_checkpoint()


    current_timer = get_latest_from_container("TimerDetails")
    disconnect_time = datetime.datetime.strptime(current_timer["DisconnectTime"], "%Y-%m-%dT%H:%M:%SZ").astimezone(datetime.timezone.utc)
    if(disconnect_time <= datetime.datetime.now(datetime.UTC)):
        send_sms(os.environ.get("SMS_NUMBER"), "KURYENTEAPP: Switch was turned off due to expiration of timer.")
        switch_device(False)

    logging.info('Python timer trigger function executed.')