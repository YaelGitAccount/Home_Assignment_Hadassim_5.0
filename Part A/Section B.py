import pandas as pd
import os
import shutil


#########################################################
#סעיף ב
#1+2
# המרת Excel ל-CSV
def convert_excel_to_csv(excel_path, csv_path):
    df = pd.read_excel(excel_path)
    df.to_csv(csv_path, index=False)

def read_data(file_path):
    if file_path.endswith('.csv'):#format date: dd/mm/yy
        return pd.read_csv(file_path, chunksize=100_000, parse_dates=["timestamp"],dayfirst=True)
    elif file_path.endswith('.xlsx'):#format date: mm/dd/yy
        csv_path = file_path.replace('.xlsx', '_temp.csv')
        convert_excel_to_csv(file_path, csv_path)
        return pd.read_csv(csv_path, chunksize=100_000, parse_dates=["timestamp"])
    elif file_path.endswith('.parquet'):#format date: dd/mm/yy
        try:
            df = pd.read_parquet(file_path)
            if isinstance(df, pd.DataFrame):
                df['timestamp'] = pd.to_datetime(df['timestamp'], format="%d/%m/%Y %H:%M:%S", errors='coerce')
                return [df]  # הופכים את ה-DataFrame לרשימה של DataFrame כדי להתאים ללוגיקה של chunk
        except Exception as e:
            raise ValueError(f"Error reading parquet file: {e}")
    else:
        raise ValueError(f"Unsupported file type: {file_path}")


# חלוקת הנתונים לפי יום
def split_file_by_day(file_path):
    print(file_path)
    df = read_data(file_path)
    for chunk in df:
        # Initial cleaning
        chunk = chunk.dropna(subset=['timestamp', 'value'])
        chunk['value'] = pd.to_numeric(chunk['value'], errors='coerce')
        chunk = chunk.dropna(subset=['value'])

        # Remove duplicates by timestamp (keeps the first row)
        chunk = chunk.drop_duplicates(subset=['timestamp'], keep='first')

        # Date extraction
        # Make sure the 'timestamp' column is of type datetime
        chunk['timestamp'] = pd.to_datetime(chunk['timestamp'], errors='coerce')
        #chunk['timestamp'] = pd.to_datetime(chunk['timestamp'], errors='coerce', dayfirst=True)

        # If there are missing values ​​after conversion (i.e., cannot be converted to a date), you can remove those rows
        chunk = chunk.dropna(subset=['timestamp'])
        # Extract the date only
        chunk['date'] = chunk['timestamp'].dt.date




################################################################################################
        ############ע"מ שיתאים את מבנה התאריך לכל סוג קובץ:
        """
        def read_data(file_path):
            if file_path.endswith('.csv'):
                return pd.read_csv(file_path, chunksize=100_000, parse_dates=["timestamp"], 
                                    date_parser=lambda x: pd.to_datetime(x, format='%d/%m/%Y %H:%M:%S', errors='coerce'))
            elif file_path.endswith('.xlsx'):
                csv_path = file_path.replace('.xlsx', '_temp.csv')
                convert_excel_to_csv(file_path, csv_path)
                return pd.read_csv(csv_path, chunksize=100_000, parse_dates=["timestamp"],
                                    date_parser=lambda x: pd.to_datetime(x, format='%d/%m/%Y %H:%M:%S', errors='coerce'))
            elif file_path.endswith('.parquet'):
                return pd.read_parquet(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_path}")
        """
        # Save each day to its own file
        for date, group in chunk.groupby('date'):
            filename = os.path.join("tmp_files", f"{date}.csv")
            group.drop(columns=['date']).to_csv(filename, mode='a', header=not os.path.exists(filename), index=False)


# Calculate hourly averages for each file
def calculate_hourly_avg_per_file(file_path):
    df = pd.read_csv(file_path, parse_dates=["timestamp"])

    df['value'] = pd.to_numeric(df['value'], errors='coerce')
    df = df.dropna(subset=['value'])

    # Removing duplicates in case they remain
    df = df.drop_duplicates(subset=['timestamp'], keep='first')

    df['hour'] = df['timestamp'].dt.floor('h')

    result = df.groupby('hour')['value'].mean().reset_index()
    result.columns = ['hour', 'average_value']
    return result


# Merge all results into a final file
def combine_all_results(output_path):
    all_results = []

    for filename in os.listdir("tmp_files"):
        filepath = os.path.join("tmp_files", filename)
        hourly_avg = calculate_hourly_avg_per_file(filepath)
        all_results.append(hourly_avg)

    final_df = pd.concat(all_results).sort_values(by='hour')
    final_df.to_csv(output_path, index=False)


# Comprehensive run
def process_large_csv_to_hourly_averages(csv_path, OUTPUT_CSV):
    # Create a temporary folder
    os.makedirs("tmp_files", exist_ok=True)
    split_file_by_day(csv_path)
    combine_all_results(OUTPUT_CSV)
    temp_path = os.path.splitext(csv_path)[0] + '_temp.csv'
    print(temp_path)
    print(f"\nOutput file: {OUTPUT_CSV}")
    #if os.path.exists(temp_path):
        #os.remove(temp_path)
    if os.path.exists("tmp_files"):
        shutil.rmtree("tmp_files")

# Example run
process_large_csv_to_hourly_averages(
"C:\\Users\\user1\\Desktop\פרוייקט הדסים סופי\\\Part A\\time_series.csv",
    #"C:\\Users\\user1\\Downloads\\time_series.parquet",
#"C:\\Users\\user1\\Desktop\\פרוייקט הדסים סופי\\Part A\\time_series.xlsx",
    "C:\\Users\\user1\\Downloads\\final_hourly_averages_CSV_P.csv"
)


#########################################################
#סעיף 3
"""
שימוש במבנה נתונים מצטבר: כדי לחשב את הממוצע השעתי בזמן אמת,
 ניתן להשתמש במבנה נתונים מצטבר שמאפשר  לעדכן את הממוצעים של כל שעה ברגע שהנתונים מגיעים.
 dictionary או עץ 
  ( defaultdict) לשמירת סכום הערכים (total sum) ומספר הערכים (count) לכל שעה.
  ואז ברגע שמגיע נתון חדש, נחשב מחדש את הממוצע לשעה אליה הנתון החדש שייך
  בעצם בכל רגע יהיה מידע על שעה- סכום מצטבר וכן כמות וכך נמנע זכרון
   מיותר של כל המידע שהתקבל אבל נשמור את הנתונים לשעה ע"מ שניתן יהיה לדעת את הממוצע
  (ניתן לחשב אחת לפרק זמן מסויים, תלוי בחשיבות רמת הדיוק בכל רגע)


"""
#סעיף 4

"""
הוספתי את פונקציית def read_data(file_path):
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path, chunksize=100_000, parse_dates=["timestamp"])
    elif file_path.endswith('.xlsx'):
        csv_path = file_path.replace('.xlsx', '_temp.csv')
        convert_excel_to_csv(file_path, csv_path)
        return pd.read_csv(csv_path, chunksize=100_000, parse_dates=["timestamp"])
    elif file_path.endswith('.parquet'):
        # אם הקובץ הוא Parquet, נוודא שהוא לא מחזיר גנרטור אלא DataFrame
        try:
            df = pd.read_parquet(file_path)
            # אם ההחזרה היא DataFrame, מחזירים אותו ישירות
            if isinstance(df, pd.DataFrame):
                return [df]  # הופכים את ה-DataFrame לרשימה של DataFrame כדי להתאים ללוגיקה של chunk
        except Exception as e:
            raise ValueError(f"Error reading parquet file: {e}")
    else:
        raise ValueError(f"Unsupported file type: {file_path}")
 שבעצם מתאימה את פתיחת הקובץ לסוגו, וכן התאמות קטנות  נוספות לאורך הקוד
 parquet היתרונות של קובץ מסוג 
 דחיסות נתונים
 ניתן לגשת לפי עמודות
השימוש בו מהיר
וכך הקריאה והכתיבה הרבה יותר מהירים באופן ניכר מאוד!!!!!!
מכיוון שהשימוש בקובץ parquet מהיר באופן ניכר, יהיה יעיל לפצלו
 לקבצים רק מגודל מסויים של קובץ( GB +) אחרת, בגלל מהירותו, הפיצול לקבצים עלול רק להכביד
"""
