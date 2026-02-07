import logging
import os
from typing import Any, List, Optional
import zoneinfo
from google import genai
from google.genai import types
from datetime import datetime, timezone, timedelta

from uuid_extensions import uuid7, uuid7str
from deps.cosmosdb import debug_tool, get_db, get_latest_timer,  get_readings,get_master_bills , get_complete_bill

_chat_cache = {}


client = genai.Client(api_key=os.environ['GEMINI_API_KEY'], vertexai=True)
manila_time = datetime.now(timezone(timedelta(hours=8))).strftime("%A, %B %d, %Y")

support_sysprompt = f"""# **SYSTEM PROMPT: Kuryente App Support AI**

    # **SYSTEM CONTEXT**

        Current Date: {manila_time}
        Location: Philippines (PHT)
        # SYSTEM PROMPT: Kuryente App Support AI

        # SYSTEM CONTEXT

        Current Date: [manila_time]
        Location: Philippines (PHT)

        ## 1. IDENTITY & ROLE

        You are the **Kuryente App Support AI**, the digital assistant of **Kuya AR**. Your primary responsibility is to assist relatives (sub-meter users) with queries regarding their electricity (Meralco) and water (Manila Water) bills. You act as a transparent, neutral, and helpful mediator between Kuya AR (the Admin) and the sub-meter users.

        You can direct users to view their detailed bill online at: `https://kuryente.adolfrey.com/user/bills/[date in YYYY-MM-01 format]` (using the billing month's date).

        ## 2. CORE BILLING LOGIC & CONTEXT

        ### A. Distinguishing "User Bill" vs. "Master Bill" (CRITICAL)

        * **Default Definition of "Bill":** When a user asks for their "bill," "statement," or "how much I owe," they are referring to the **User Bill** (the amount Kuya AR is charging them based on their sub-meter).
        * **Privacy of Master Bill:** **DO NOT** share details, files, or summaries of the **Master Bill** (Meralco/Manila Water total bill) unless:
            1. The user specifically and explicitly asks for it (e.g., "Gusto ko makita yung mismong Meralco bill").
            2. The user is explicitly questioning or disputing the **per-unit rate** (₱/kWh or ₱/m3) provided in the readings.
        * **No Permission Seeking:** **DO NOT** ask the user "Gusto niyo po ba makita ang Master Bill?" or seek permission to check it. Simply provide User Bill data until the specific conditions above are met.

        ### B. Billing Cycles vs. Reading Cycles

        * **Utility Billing (Master Meter):**
            * **Manila Water:** Typically 20th of the previous month to the 19th of the current month.
            * **Meralco:** Typically 26th of the previous month to the 25th of the current month.
        * **Sub-Meter Calculation (User Billing):**
            * The app calculates usage from the **1st day to the last day of a calendar month**.
            * **Month Translation Rule:** The bill generated on the 1st of a month represents the **usage of the entire previous month**. 
            * **Naming Convention:** Always label the bill using the month the consumption actually occurred ($N-1$).
            * **Rate Logic:** The Peso per kWh or Peso per m3 is derived from the Master Meter bill.
            * **Unbilled Days Buffer:** A minimal "add-on" is included in the rate to serve as a buffer for possible rate increases from Utility Providers and to compensate for unbilled days.

        ### C. Bill Amount & Service Extension (Prepaid Logic)

        * **Bill Calculation:** The **Total Current Bill** is determined based on the **previous month's total utility consumption and costs**.
        * **Daily Rate Usage:** You may mention the **Daily Rate** (rate per day) *only* to explain the "Service Extension" (how many days of load the user gets).
        * **Important Restriction:** **DO NOT** emphasize or point to the "daily rate" as the reason for a high bill. A high bill is always a reflection of high actual usage or increased utility rates from the preceding period.
        * **Service Extension:** `Total Amount Paid (including credits) / Daily Rate`. **Round down** the resulting number of days.
        * **Automatic Disconnection:** Service cuts off at exactly **2:00 PM Manila Time** on the expiry date.

        ## 3. USAGE INVESTIGATION & RATE CHANGES

        * **Google Search Requirement:** **ALWAYS** search for "Meralco rates [Current Month/Year]" or "Manila Water rate adjustment [Current Month/Year]".
        * **Recency Constraint:** **STRICTLY** do not refer to reports/news older than **3 months**.
        * **Environmental Factors:** Briefly mention summer (tag-init) efficiency drops.

        ## 4. AVAILABLE FUNCTIONS (Tool Use)

        * `get_latest_timer()`: Returns disconnection time and current Daily Rate.
        * `get_complete_bill(date)`: Fetches complete summary. Use this for the User Bill. **Note: This now includes the `daily_rate`.**
        * `get_readings(date, month_count)`: Fetches sub-meter readings for comparisons.
        * `get_master_bills(date, month_count)`: Fetches utility provider's details. **Only call this if explicitly requested or if the per-unit rate is questioned.**

        ## 5. TONE & GUARDRAILS

        * **Identity:** "Kuryente App AI assisting Kuya AR."
        * **Language:** Taglish.
        * **Markdown Formatting (MANDATORY):** Always use Markdown (bolding, headers, lists).
        * **Dispute Escalation & Proactive Problem Solving:**
            * **Persistence Rule:** Attempt to satisfy the user at least **4 times** with data before escalating.
            * **Investigation Steps:** 
            1. Compare readings. 
            2. Check Rates (Search). 
            3. Explain Buffer/Cycle. 
            4. Daily breakdown.
            * **Last Resort Messaging:** "Kung may discrepancy pa rin po kayong nakikita sa mismong reading pagkatapos ng ating math, pwede po nating i-PM si Kuya AR sa Messenger."

        ## 6. OUT-OF-SCOPE

        * Limited to Kuryente App/utility line guidance. Refuse coding/general knowledge queries.

        ## 7. EXAMPLE RESPONSES

        * *User: "Magkano bill ko?"*
            * AI: "Ang inyong **Total Current Bill** para sa [Month] usage ay **₱[Amount]**. Base ito sa inyong konsumo na **[kWh] kWh**."
  """

billing_functions = [
    types.FunctionDeclaration(
        name="get_latest_timer",
        description="Returns the most recent disconnection time and the current Daily Rate.",
        parameters=types.Schema(type="OBJECT", properties={})
    ),
    types.FunctionDeclaration(
        name="get_complete_bill",
        description="Fetches a complete summary including sub-meter readings and master bill details for a specific month.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "date": types.Schema(type="STRING", description="Date in 'YYYY-MM-DD' format.")
            },
            required=["date"]
        )
    )
]

# Wrap them in a Tool object
billing_tools = types.Tool(function_declarations=billing_functions)

callable_map = {
    "get_latest_timer": get_latest_timer,
    "get_complete_bill": get_complete_bill
}

class SupportChatManager:
    """
    A manager class to handle continuous support conversations with the 
    new Google GenAI SDK (google-genai).
    Integrated with helper methods for Cosmos DB serialization.
    """
    
    def __init__(self, user_id: str, system_prompt: str = support_sysprompt, tools = [billing_tools]):
        """
        Initializes the GenAI Client.
        """
        self.client = client
        self.model_id = "gemini-2.0-flash"
        self.system_prompt = system_prompt
        # The new SDK expects tools passed as a list of functions or types.Tool
        self.tools = tools
        self.user_id = user_id

    def chat(self, user_message: str, chat_id:str):
        """
        Runs a chat turn using the new Client.chats.create interface.
        """
        # Create a chat session with config for tools and system instruction# 1. ROUTER: Detect if we need BOTH or just ONE
        search_keywords = ['rates', 'meralco', 'manila water', 'balita', 'taas', 'bakit', "why"]
        billing_keywords = ['reading', 'magkano', 'bayad', 'timer', "daily", "day"]
        
        needs_search = any(w in user_message.lower() for w in search_keywords)
        needs_billing = any(w in user_message.lower() for w in billing_keywords)

        search_info = ""
        
        # 2. STEP ONE: Trigger Google Search if needed
        if needs_search and not needs_billing :
            search_session = self.client.chats.create(
                model=self.model_id,
                config=types.GenerateContentConfig(
                    system_instruction="Analyze the user query and search for the latest Meralco/Manila Water rates (Current Date: {manila_time}). Summarize the findings briefly. IMPORTANT: Use only results from the past 3 months",
                    tools=[types.Tool(google_search={})]
                )
            )
            search_res = search_session.send_message(f"Search for: {user_message}")
            search_info = f"\n\n[LATEST RATES NEWS]: {search_res.text}"

        # 3. STEP TWO: Main Chat with Billing Tools
        # We "inject" the search info into the system prompt so the AI can use it
        augmented_prompt = self.system_prompt + (f"\n\nCURRENT CONTEXT FROM WEB: {search_info}" if search_info else "")
        chat_data = self.get_chat_data(chat_id)
        chat_session = self.client.chats.create(
            model=self.model_id,
            config=types.GenerateContentConfig(
                system_instruction=augmented_prompt,
                tools=[get_latest_timer, get_complete_bill, get_readings, get_master_bills ],
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
            ),
            history=chat_data["history"] if chat_data["history"] else []
        )

        try:
            response = chat_session.send_message(user_message)
            # In the new SDK, chat_session.history is automatically updated
            chat_data["history"] = chat_session.get_history()
            chat_data["timestamp"] = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
            self.save_chat_data(chat_data)
            text_result = ""
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if part.text:
                        text_result += part.text
            
            return text_result or "Action performed successfully.", chat_data["id"]
        except Exception as e:
            return f"Error: {str(e)}", chat_data["id"]


    def get_chat_data(self, chat_id:str):


        
        if chat_id != "":
            if(chat_id in _chat_cache):
                return _chat_cache[chat_id]
            else:
                now = datetime.now(timezone.utc)
                db = get_db()
                container = db.get_container_client("Chats")
                query = "SELECT * FROM c WHERE c.id = @id"
                parameters = [{"name": "@id", "value": chat_id}]
                
                result = container.query_items(
                    query=query,
                    parameters=parameters, partition_key=self.user_id)

                item = next(result, None)
                item_time = datetime.fromisoformat(item["timestamp"])

                if(item_time > now): 
                    item["history"] = self.deserialize_history(item["history"])
                    return item
            
    
        id = uuid7( as_type='str')
        new_item = {
            "id":  id,
            "timestamp" : (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
            "history": [],
            "user_id" : self.user_id
        }
        return new_item

    def save_chat_data(self,data):
        db = get_db()
        container = db.get_container_client("Chats")
        data["history"] = self.serialize_history(data["history"])
        container.upsert_item(data)
        _chat_cache[data["id"]] = data
        return True




    @staticmethod
    def serialize_history(history: List[types.Content]) -> List[dict]:
        """
        Converts Gemini Content objects into JSON-serializable dicts for Cosmos DB.
        """
        json_history = []
        for content in history:
            parts = []
            for part in content.parts:
                if part.text is not None:
                    parts.append({'text': part.text})
                elif part.function_call is not None:
                    parts.append({'function_call': {
                        'name': part.function_call.name,
                        'args': part.function_call.args
                    }})
                elif part.function_response is not None:
                    parts.append({'function_response': {
                        'name': part.function_response.name,
                        'response': part.function_response.response
                    }})
            
            json_history.append({
                'role': content.role,
                'parts': parts
            })
        return json_history

    @staticmethod
    def deserialize_history(json_history: List[dict]) -> List[types.Content]:
        """
        Converts list of dicts from Cosmos DB back into types.Content objects.
        """
        return [types.Content(role=m['role'], parts=[types.Part(**p) for p in m['parts']]) for m in json_history]