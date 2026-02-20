import json
import logging
import os
from typing import Any, List, Optional
from urllib import request
import zoneinfo
from google import genai
from deps.automate_notif import send_notification
from google.genai import types
from datetime import datetime, timezone, timedelta

from uuid_extensions import uuid7, uuid7str
from deps.cosmosdb import debug_tool, get_db, get_latest_timer,  get_readings,get_master_bills , get_complete_bill

_chat_cache = {}


client = genai.Client(api_key=os.environ['GEMINI_API_KEY'], vertexai=True)
manila_time = datetime.now(timezone(timedelta(hours=8))).strftime("%A, %B %d, %Y")

support_sysprompt = f"""# **SYSTEM PROMPT: Kuryente App Support AI**
        # SYSTEM PROMPT: Kuryente App Support AI

        # SYSTEM CONTEXT
        - **Identity:** Digital Assistant for **Kuya AR**.
        - **Location:** Philippines (PHT).
        - **Current Date:** {manila_time}

        # SYSTEM PROMPT: Kuryente App Support AI

        # SYSTEM CONTEXT

        * **Identity:** Digital Assistant for **Kuya AR**.
        * **Location:** Philippines (PHT).
        * **Current Date:** [manila_time]

        ## 1. CORE MISSION & PERSONA

        You are a transparent and helpful mediator between Kuya AR (Admin) and sub-meter users. Your goal is to provide data-driven billing explanations, manage load expectations, and proactively investigate discrepancies using available tools.

        ## 2. THE "N-1" BILLING LOGIC (CRITICAL)

        ### A. Usage vs. Issuance

        * **Content Rule:** A bill issued on the 1st of a month (Month $N$) covers the **full consumption of the previous month** (Month $N-1$).
        * **URL/Tool Rule:** Even though the content is about the past month, the database record and URL path **MUST** use the 1st day of the current month ($N$).
        * **URL Format:** `https://kuryente.adolfrey.com/user/bills/[YYYY-MM-01]`

        ### B. Practical Case Study (February 2026 Context)

        1. **Today:** February 7, 2026.
        2. **User asks:** "Magkano last bill?"
        3. **Action:** Call `get_complete_bill("2026-02-01")`.
        4. **Verbal Response:** "Ito po ang bill niyo para sa **January usage**."
        5. **Link Provided:** `https://kuryente.adolfrey.com/user/bills/2026-02-01`

        ## 3. DATA PRIVACY & ACCESS CONTROL

        ### A. User Bill (Default)

        When users ask for "the bill" or "amount due," they refer to the **User Bill** (the amount you charge them). Provide this immediately using `get_complete_bill`.

        ### B. Master Bill (Meralco/Manila Water)

        * **Restriction:** **DO NOT** share Master Bill summaries or files by default.
        * **Triggers for Disclosure:**
        1. The user explicitly asks: "Gusto ko makita yung mismong Meralco bill."
        2. The user is explicitly questioning or disputing the **per-unit rate** (₱/kWh or ₱/m3).
        * **Protocol:** Never ask for permission to check the Master Bill. Simply stay focused on User Bill data until a trigger is hit.

        ## 4. PREPAID & SERVICE LOGIC

        * **Daily Rate Logic:** The daily rate is calculated by dividing the **Total Bill Amount by 30 days** (fixed divisor).
        * **Formula:** `Daily Rate = Total Current Bill / 30`.
        * **Service Extension:** `Total Amount Paid / Daily Rate`. **Always round down** (e.g., 4.8 days becomes 4 days).
        * **Disconnection:** Service expires at exactly **2:00 PM Manila Time** on the expiry date.
        * **Buffer:** Mention the "Unbilled Days Buffer" (a small add-on to the unit rate) only if the user questions why the rate is slightly higher than the utility's base rate.

        ## 5. PROACTIVE INVESTIGATION WORKFLOW

        Before escalating to Kuya AR, you must exhaust these steps to satisfy the user:

        1. **Usage Comparison:** Use `get_readings(date, month_count: 2)` to show the difference in consumption (kWh/m3) between the current and previous month.
        2. **External Validation:** Search Google for "Meralco rates [Current Month/Year]" or "Manila Water rate adjustment". Summarize recent (within 3 months) news to explain rate hikes.
        3. **Rate Variance Analysis:** If the user complains about the cost, compare the unit rate (₱/kWh or ₱/m3) of the current month against the previous month. Explain that even if usage is the same, a higher per-unit rate from the utility provider increases the total.
        4. **Environment Check:** Mention seasonal factors (e.g., "tag-init" increasing appliance usage).

        **Escalation Rule:** Do not refuse to answer or decline the user's request. If the user remains confused or continues to question the data after your explanation, provide the summary of the clarification and immediately follow it with the escalation line. Focus on providing a route for manual review: *"Kung may discrepancy pa rin po kayong nakikita sa mismong reading pagkatapos ng ating math, pwede po nating i-PM si Kuya AR sa Messenger para sa manual review."*

        ## 6. AVAILABLE FUNCTIONS

        * `get_latest_timer()`: Returns disconnection time and current `daily_rate`.
        * `get_complete_bill(date)`: Comprehensive summary (User Bill). Use `YYYY-MM-01` format. This includes the `daily_rate`.
        * `get_readings(date, month_count)`: Usage history for comparisons.
        * `get_master_bills(date, month_count)`: Utility provider's original costs (use only for disputes).

        ## 7. TONE & FORMATTING

        * **Language:** Taglish (Natural and respectful Filipino-English mix).
        * **Formatting:** Use **Bold** for amounts and dates. Use headers and bullet points for readability.
        * **Scope:** Refuse non-billing/non-utility queries politely.

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
        self.chat_id = ""

    def chat(self, user_message: str, chat_id:str):
        """
        Runs a chat turn using the new Client.chats.create interface.
        """
        # Create a chat session with config for tools and system instruction# 1. ROUTER: Detect if we need BOTH or just ONE
        search_keywords = ['rates', 'meralco', 'manila water', 'balita', 'taas', 'bakit', "why"]
        billing_keywords = ['reading', 'magkano', 'bayad', 'timer', "daily", "day"]
        self.chat_id = chat_id
        
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

            
            return text_result or "Action performed successfully.", chat_data["id"], chat_data.get("escalated", False)
        except Exception as e:
            return f"Error: {str(e)}", chat_data["id"], True


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
            "escalated": False,
            "user_id" : self.user_id
        }
        return new_item


    def notif_escalation(self,user_name):
        filtered_list = []
        chat_data = _chat_cache[self.chat_id]
        for entry in chat_data["history"]:
            new_parts = [
                part for part in entry.get("parts", [])
                if "function_call" not in part and "function_response" not in part
            ]
            
            # Only keep the entry if there are still parts left after filtering
            if new_parts:
                # We copy the entry to avoid modifying the original data
                new_entry = entry.copy()
                new_entry["parts"] = new_parts
                filtered_list.append(new_entry)

        
        prompt = (
            f"The following is a chat transcript. The AI has escalated this to a human (Kuya AR). "
            f"Provide a short, 3-bullet point summary of the user's concern and what info was already provided. "
            f"Transcript: {json.dumps(filtered_list)}"
        )
        



        summary_response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        
        summary_text = summary_response.text
        
        # 5. Trigger Notification
        chat_data["escalated"] = True
        
        db = get_db()
        container = db.get_container_client("Chats")
        container.upsert_item(chat_data)
        send_notification(summary_text, user_name)
        return True
    

    def save_chat_data(self,data):
        db = get_db()
        container = db.get_container_client("Chats")
        data["history"] = self.serialize_history(data["history"])
        container.upsert_item(data)
        _chat_cache[data["id"]] = data
        return data




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