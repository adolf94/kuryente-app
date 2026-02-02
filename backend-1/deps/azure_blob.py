
import datetime
import logging
import os
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient,generate_blob_sas,BlobSasPermissions,ContentSettings
from azure.identity import DefaultAzureCredential



account_url = os.getenv("BLOB_SCREENSHOT_UPLOAD", "")  # e.g., "https://mydatalake.blob.core.windows.net"
connection_string = os.getenv("BLOB_CONNECTION_STRING", "")  # e.g., "https://mydatalake.blob.core.windows.net"

def upload_to_azure(file_path, blob_name, mime, container="transact-screenshots"):
    """
    Uploads a file to Azure Blob Storage.
    Handles both connection string and Azure Identity authentication.

    Args:
        file_path (str): Path to the file to upload.
        blob_name (str): Name of the blob in Azure Blob Storage.

    Returns:
        str: URL of the uploaded blob if successful, None otherwise.
    """

    blob_service_client = None
    if connection_string != "":
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        logging.info("found the connection string")

    # # Use DefaultAzureCredential - this will use whatever identity you've configured
    # # (e.g., environment variables, managed identity, etc.)
    else:
        credential = DefaultAzureCredential()
        blob_service_client = BlobServiceClient(account_url=account_url, credential=credential)
        logging.info("using default Credential")
        
    content_settings = ContentSettings(content_type=mime)
    blob_client = blob_service_client.get_blob_client(container=container, blob=blob_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True,content_settings=content_settings)  # Overwrite if it exists


    return {
        "url":blob_client.url,
        "fileId": blob_name,
    }


def get_file(record):
    blob_service_client = None
    blob_permissions = BlobSasPermissions(read=True)
    sas_expiry = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=30)
    if connection_string != "":
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        logging.info("found the connection string")

    # # Use DefaultAzureCredential - this will use whatever identity you've configured
    # # (e.g., environment variables, managed identity, etc.)

        account_name, account_key = _extract_account_info_from_connection_string(connection_string)

        
        # Generate the SAS token
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=record["Container"],
            blob_name=record["FileKey"],
            account_key=account_key,
            permission=blob_permissions,
            expiry=sas_expiry
        )

    else:
        credential = DefaultAzureCredential()
        blob_service_client = BlobServiceClient(account_url=account_url, credential=credential)
        logging.info("using default Credential")
                 # SAS valid for 1 hour

        start_time = datetime.datetime.now(datetime.UTC)
        user_delegation_key = blob_service_client.get_user_delegation_key(
            key_start_time=start_time,
            key_expiry_time=sas_expiry
        )
        # Generate the SAS token
        account_name = blob_service_client.account_name
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=record["Container"],
            blob_name=record["FileKey"],
            user_delegation_key=user_delegation_key,
            permission=blob_permissions,
            expiry=sas_expiry
        )
    endpoint = "http://127.0.0.1:10000/devstoreaccount1" if account_name == "devstoreaccount1" else f"https://{account_name}.blob.core.windows.net"
    container_sas_url = f"{endpoint}/{record["Container"]}/{record["FileKey"]}?{sas_token}"
    return container_sas_url




def _extract_account_info_from_connection_string(conn_str):
    parts = conn_str.split(';')
    account_name = None
    account_key = None
    for part in parts:
        if part.startswith('AccountName='):
            account_name = part.split('=', 1)[1]
        elif part.startswith('AccountKey='):
            account_key = part.split('=', 1)[1]
    return account_name, account_key
