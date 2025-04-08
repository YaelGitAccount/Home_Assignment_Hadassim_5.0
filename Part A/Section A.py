import os
from collections import defaultdict
import pandas as pd
import chardet
import heapq
import shutil

####
#The functions in the following code are only effective on extremely large files
#and for distributed and parallel use
###
def file_split_excel(file_path, directory_path, max_rows):
    # Reading the file directly from Excel
    df = pd.read_excel(file_path, header=None) # Reading without titles
    file_paths = []
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        # Cutting the data into pieces
        for i in range(0, len(df), max_rows):
            chunk = df.iloc[i:i + max_rows] # max_rows row section
            """new_file_path = os.path.join(directory_path, f'logs_part{i // max_rows + 1}.txt.xlsx')
            chunk.to_excel(new_file_path, index=False, header=False) # Save as Excel"""
            new_file_path = os.path.join(directory_path, f'logs_part{i // max_rows + 1}.txt')
            file_paths.append(new_file_path)
            chunk.to_csv(new_file_path, index=False, header=False, sep=' ', encoding='utf-8')  # Save as TXT
    else:
        for file_name in os.listdir(directory_path):
            file_path = os.path.join(directory_path, file_name)
            # Checks if it is a file and not a folder
            if os.path.isfile(file_path):
                file_paths.append(file_path)
    return file_paths

class FrequencyCounter:
    # The class counts the frequency of keys in files, it creates a hash table in which it stores the frequency
    def __init__(self, file_path, directory_path, max_row):
        self.file_path = file_path
        self.max_row = max_row
        self.directory_path = directory_path
        self.map = defaultdict(int)  # Hash table for keys and values
        self.file_paths = file_split_excel(file_path, directory_path, max_row)  # Get the subpaths of the subfiles of the received file

    def count_frequencies(self):
        for file_path in self.file_paths:
            with open(file_path, 'rb') as file:
                data = file.read()
                result = chardet.detect(data)
                encoding = result['encoding']

            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    for line in file:
                        words = line.split()
                        if "Error:" in words:
                            error_code = line.split("Error: ")[1].strip().strip('"')  # Removes quotation marks
                            self.map[error_code] += 1
            except UnicodeDecodeError:
                with open(file_path, 'r', encoding=encoding, errors='ignore') as file:
                    for line in file:
                        #Didn't deal with coding
                        words = line.split()
                        for word in words:
                            if "Error:" in word:
                                error_code = word.split("Error:")[1]
                                if error_code in self.map:
                                    self.map[error_code] += 1
                                else:
                                    self.map[error_code] = 1


def get_top_n_errors(file_path, directory_path, max_row, n):
    # Create an object to calculate frequencies
    file_counter = FrequencyCounter(file_path, directory_path, max_row)
    file_counter.count_frequencies()

    # Getting the N most common error types
    top_n_errors = heapq.nlargest(n, file_counter.map.items(), key=lambda x: x[1])
    print(top_n_errors)
    # Print the result
    print(f"\n{n} Most common error types:")
    for error, count in top_n_errors:
        print(f"{error}: {count} times")
    if os.path.exists(directory_path):
        try:
            shutil.rmtree(directory_path)
            print(f"\nThe folder '{directory_path}' was successfully deleted.")
        except Exception as e:
            print(f"\n An error occurred while deleting the folder: {e}.")
    return top_n_errors


# דוגמה:
top_errors = get_top_n_errors(

    r"C:\Users\user1\Desktop\פרוייקט הדסים סופי\Part A\logs.txt.xlsx",
    r"C:\Users\user1\Desktop\פרוייקט הדסים סופי\Part A\logs files", 10000, 5)

##סיבוכיות זמן:
#N - כמות למציאת הגדולים ביותר

#M - גודל כל קובץ:
#מעבר על כל השורות פעם אחת כאשר מעתיקים לקבצים ואחר כך כאשר עוברים על כל תתי הקבצים
#שליפת N השגיאות הנפוצות
#N*LOG (M)
#(מכיון heapq.nlargest(n, ...) משתמשת בערימת מקסימום....)
#סהכ: M + N * LOG (M)

