
import datetime
import logging
import os
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient,generate_blob_sas
from azure.identity import DefaultAzureCredential



account_url = os.getenv("BLOB_SCREENSHOT_UPLOAD", "")  # e.g., "https://mydatalake.blob.core.windows.net"
connection_string = os.getenv("BLOB_CONNECTION_STRING", "")  # e.g., "https://mydatalake.blob.core.windows.net"
container_name = "transact-screenshots" # Replace with your container name

def upload_to_azure(file_path, blob_name):
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
        
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)  # Overwrite if it exists


    return {
        "url":blob_client.url,
        "fileId": blob_name,
    }


        
