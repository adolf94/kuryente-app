# Register this blueprint by adding the following line of code 
# to your entry point file.  
# app.register_functions(httpblueprint) 
# 
# Please refer to https://aka.ms/azure-functions-python-blueprints


import json
import os
import azure.functions as func
import logging

from deps.cosmosdb import get_latest_from_container

bp = func.Blueprint()


@bp.route(route="get_timer_info", auth_level=func.AuthLevel.ANONYMOUS)
def get_timer_info(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')


    item = get_latest_from_container("TimerDetails")
    body = json.dumps(item)
    return func.HttpResponse(body, status_code=200, mimetype="application/json")
        