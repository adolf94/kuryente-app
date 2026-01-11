
import datetime



def get_disconnect_time_for_disconnected():

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    # 2. Add 16 hours
    after_16_hours = now_utc + datetime.timedelta(hours=12)

    # 3. Set the hour to 6:00 AM
    final_time = after_16_hours.replace(hour=6, minute=0, second=0, microsecond=0)
    return final_time

def get_disconnect_time(last_date):
    if_disconnected = get_disconnect_time_for_disconnected()

    if(if_disconnected > last_date):
        if_disconnected = last_date

    return if_disconnected


def date_diff_with_tz(date_start, ds_timezone, date_end, de_timezone):
    # 2. Define your dates (Example dates)
    # If your dates are already datetime objects, localize them:
    date_end_raw = datetime(2023, 10, 30, 15, 0, 0)   # Oct 30, 3:00 PM Manila
    date_start_raw = datetime(2023, 10, 25, 10, 0, 0) # Oct 25, 10:00 AM UTC

    # 3. Make them timezone aware
    date_end = de_timezone.localize(date_end_raw)
    date_start = ds_timezone.localize(date_start_raw)

    # 4. Calculate difference
    diff = date_end - date_start

    # 5. Get the number of days
    days_count = diff.days
    return days_count