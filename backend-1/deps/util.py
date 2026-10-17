
import datetime

import pytz



def get_disconnect_time(last_date):
    # Extensions are always anchored to the last stored DisconnectTime,
    # even when the service is already disconnected — never to the current date.
    return last_date


def date_diff_with_tz(date_start, ds_timezone, date_end, de_timezone):
    # 2. Define your dates (Example dates)
    # If your dates are already datetime objects, localize them:
    date_end_raw = datetime.datetime(2023, 10, 30, 15, 0, 0)   # Oct 30, 3:00 PM Manila
    date_start_raw = datetime.datetime(2023, 10, 25, 10, 0, 0) # Oct 25, 10:00 AM UTC

    # 3. Make them timezone aware
    date_end = de_timezone.localize(date_end_raw)
    date_start = ds_timezone.localize(date_start_raw)

    # 4. Calculate difference
    diff = date_end - date_start

    # 5. Get the number of days
    days_count = diff.days
    return days_count