import logging
import os
from google import genai
from google.genai import types
from PIL import Image
import json


client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

def identify_img_transact_ai(localpath, file_record):

    prompt = f"""
        I have provided a screenshot of a transaction, provide the information show in json format. I have provided a default or just leave it blank if the data is not available. The original filename is {file_record["OriginalFileName"]}



        isValid Parameters:
        ```````
        recipients account ids must be any of the below (or the screenshot pattern is the same):
        BDO - 006480138219
        BPI - 4229186642
        GCash - 09151792560
        GCash - DWQM4TK3JDNWDA19C

        Valid Transaction types: 
        - transfer
        - transfer_via_instapay
        - transfer_via_pesonet
        ```````

        Possible keys are
        ```````
        - transactionType  : string -  the transaction executed (Samples: "bills_pay", "transfer", "transfer_via_instapay", "transfer_via_pesonet"). If it shows transfer to other bank use  "transfer_via_instapay", if it looks like we're paying a merchant use pay_merchant
        - app: string - the app name source of the screenshot
        - description : string - description for the transaction, include a summary, recipient name for the transaction. Be more concise on the text. Make it at least 60 characters.
        - sourceFilename : string - the filename of the image used.
        - reference : string - the reference number that can be used in later time. for record purposes
        - datetime : datetime- the date and time the transaction was executed in the format of "YYYY-MM-DDTHH:mm:ssZ". Convert from GMT +8:00 if it was not provided
        - senderAcct  : string - (source account) the account used to send / pay as mentioned in the screenshot
        - senderBank  : string - (source bank) the bank of the account used to send / pay as mentioned in the screenshot
        - senderName  : string - the name or nickname used to send / pay as mentioned in the screenshot
        - recipientAccount  : string - the destination account number of the transfer.
        - recipientBank  : string - the bank of the account of the recipient
        - recipientName  : string - the name or nickname of the recipient account as shown in the image. For Bills pay, this is the type of bill paid. It can also be the merchant name.
        - amount : decimal - the paid/transfered amount
        - transactionFee : decimal - the fee for the transaction (default value:0.00)
        - currency : string - the payment currency (default value: PHP)
        - isValid: boolean - validate using the parameters under "isValid parameters"
        - reason: string - provide the reason on the decision above. leave blank if isValid is true otherwise have it at max 100 characters. Do not show the valid account numbers here
        - otherData : json_object - key-value pairs of details that are not yet captured but can be used for referencing the transaction
        ```````


    """


        
    image = Image.open(localpath)

    config = types.GenerateContentConfig(
        response_mime_type="application/json"
    )
    try:
        response = client.models.generate_content(model="gemini-2.5-flash",
                                            contents=[image, prompt],
                                            config=config
                                            )
    except Exception as e:
        logging.error(e)
        response = client.models.generate_content(model="gemini-1.5-flash",
                                            contents=[image, prompt],
                                            config=config
                                            )


    output = json.loads(response.text)
    
    return output
