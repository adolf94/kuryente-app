import json
import logging
import os
from typing import Any, List, Optional
from urllib import request
import zoneinfo
import inspect

from openai import OpenAI
from deps.automate_notif import send_notification
from deps.openai_client import get_client, get_model
from datetime import datetime, timezone, timedelta

from uuid_extensions import uuid7, uuid7str
from deps.cosmosdb import debug_tool, get_db, get_latest_timer,  get_readings,get_master_bills , get_complete_bill

_chat_cache = {}


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


def _esc(o):
    return o


def _to_openai_tool(fn):
    """
    Wraps a python function into an OpenAI function-tool schema,
    auto-generating parameter descriptions from datatypes/docstrings.
    """
    sig = inspect.signature(fn)
    props = {}
    required = []
    for pname, p in sig.parameters.items():
        if p.default is inspect.Parameter.empty:
            required.append(pname)
        ann = p.annotation if p.annotation is not inspect.Parameter.empty else "string"

        if ann is str or ann == "str":
            js = "string"
        elif ann is int or ann == "int":
            js = "integer"
        elif ann is float or ann == "float":
            js = "number"
        elif ann is bool or ann == "bool":
            js = "boolean"
        else:
            js = "string"

        props[pname] = {"type": js}
    doc = inspect.getdoc(fn) or ""
    return {
        "type": "function",
        "function": {
            "name": fn.__name__,
            "description": doc.split("\n")[0],
            "parameters": {
                "type": "object",
                "properties": props,
                "required": required,
            },
        },
    }


# Build OpenAI tool schemas from cosmosdb tool functions
detect_tools = [
    _to_openai_tool(get_latest_timer),
    _to_openai_tool(get_complete_bill),
    _to_openai_tool(get_readings),
    _to_openai_tool(get_master_bills),
]

callable_map = {
    "get_latest_timer": get_latest_timer,
    "get_complete_bill": get_complete_bill,
    "get_readings": get_readings,
    "get_master_bills": get_master_bills,
}


class SupportChatManager:
    """
    A manager class to handle continuous support conversations with the 
    new Google GenAI SDK (google-genai).
    Integrated with helper methods for Cosmos DB serialization.
    """
    
    def __init__(self, user_id: str, system_prompt: str = support_sysprompt, tools = detect_tools):
        """
        Initializes the OpenAI client.
        """
        self.client = get_client()
        self.model_id = get_model()
        self.system_prompt = system_prompt
        self.tools = tools
        self.user_id = user_id
        self.chat_id = ""

    def chat(self, user_message: str, chat_id: str):
        # 1. ROUTER: Detect if we need web search or not
        search_keywords = ['rates', 'meralco', 'manila water', 'balita', 'taas', 'bakit', "why"]
        billing_keywords = ['reading', 'magkano', 'bayad', 'timer', "daily", "day"]
        self.chat_id = chat_id
        
        needs_search = any(w in user_message.lower() for w in search_keywords)
        needs_billing = any(w in user_message.lower() for w in billing_keywords)

        search_info = ""
        
        # 2. STEP ONE: If search needed, ask model to summarize web info (fallback: skip if service can't search)
        if needs_search and not needs_billing:
            try:
                search_res = self.client.chat.completions.create(
                    model=self.model_id,
                    messages=[
                        {"role": "system", "content": "Analyze the user query and search for the latest Meralco/Manila Water rates (Current Date: {manila_time}). Summarize the findings briefly. IMPORTANT: Use only results from the past 3 months"},
                        {"role": "user", "content": f"Search for: {user_message}"},
                    ],
                )
                search_info = f"\n\n[LATEST RATES NEWS]: {search_res.choices[0].message.content}"
            except Exception as e:
                logging.warning(f"Web-search summary step failed: {e}")

        # 3. STEP TWO: Main Chat with Billing Tools
        augmented_prompt = self.system_prompt + (f"\n\nCURRENT CONTEXT FROM WEB: {search_info}" if search_info else "")
        chat_data = self.get_chat_data(chat_id)
        history = chat_data["history"] if chat_data["history"] else []
        messages = [{"role": "system", "content": augmented_prompt}] + history + [{"role": "user", "content": user_message}]

        try:
            response = self.client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
            )
            msg = response.choices[0].message
            MAX_TOOL_ITER = 10
            iteration = 0
            while msg.tool_calls and iteration < MAX_TOOL_ITER:
                iteration += 1
                messages.append({"role": "assistant",
                                 "content": msg.content or "",
                                 "tool_calls": [tc.model_dump() for tc in msg.tool_calls]
                                 })
                for tc in msg.tool_calls:
                    fn_name = tc.function.name
                    fn = callable_map.get(fn_name)
                    if fn is None:
                        tool_output = {"error": f"Unknown function {fn_name}"}
                    else:
                        args = json.loads(tc.function.arguments or "{}")
                        tool_output = fn(**args)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(tool_output, default=str),
                    })

                response = self.client.chat.completions.create(
                    model=self.model_id,
                    messages=messages,
                    tools=self.tools,
                    tool_choice="auto",
                )
                msg = response.choices[0].message

            text_result = msg.content or "Action performed successfully."

            # Save conversation history in OpenAI format
            assistant_entry = {"role": "assistant", "content": text_result}
            history = messages[1:] + [assistant_entry]
            chat_data["history"] = [
                {"role": m["role"], "content": m["content"]}
                for m in history if isinstance(m.get("content"), str)
            ]
            chat_data["timestamp"] = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
            self.save_chat_data(chat_data)
            
            return text_result, chat_data["id"], chat_data.get("escalated", False)
        except Exception as e:
            return f"Error: {str(e)}", chat_data["id"], True


    def get_chat_data(self, chat_id: str):
        """Loads chat data from cache or Cosmos, or creates a new record."""
        if chat_id != "":
            if chat_id in _chat_cache:
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
                if item is None:
                    pass
                else:
                    item_time = datetime.fromisoformat(item["timestamp"])
                    if item_time > now:
                        return item
        
        id = uuid7(as_type='str')
        new_item = {
            "id": id,
            "timestamp": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
            "history": [],
            "escalated": False,
            "user_id": self.user_id
        }
        return new_item


    def notif_escalation(self, user_name):
        filtered_list = []
        chat_data = _chat_cache[self.chat_id]
        for entry in chat_data["history"]:
            filtered_list.append(entry)

        prompt = (
            f"The following is a chat transcript. The AI has escalated this to a human (Kuya AR). "
            f"Provide a short, 3-bullet point summary of the user's concern and what info was already provided. "
            f"Transcript: {json.dumps(filtered_list)}"
        )

        summary_response = get_client().chat.completions.create(
            model=get_model(),
            messages=[{"role": "user", "content": prompt}],
        )
        summary_text = summary_response.choices[0].message.content

        # Trigger Notification
        chat_data["escalated"] = True
        
        db = get_db()
        container = db.get_container_client("Chats")
        container.upsert_item(chat_data)
        send_notification(summary_text, user_name)
        return True
    

    def save_chat_data(self, data):
        db = get_db()
        container = db.get_container_client("Chats")
        container.upsert_item(data)
        _chat_cache[data["id"]] = data
        return data
