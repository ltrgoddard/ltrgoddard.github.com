#!/usr/bin/env python

import sys
import json
import csv
import re

with open(sys.argv[1], "r") as input:
    data = input.read()

csv_output = csv.writer(open(sys.argv[2], "w"))
csv_output.writerow(["start", "end", "label"])

raw_entries = data.split("\\\n\n\\")
entries = []

for entry in raw_entries:
    if "*See*" not in entry and "*see*" not in entry:
	try:
	    head = entry.split("\\", 1)[0]
            title = re.search(r"(?<=\*\*)(?:.|\n)*?(?=\*\*)", head).group(0)
            title = title.split(" ", 1)
	    dates = re.findall(r"(19\d\d|2000)", head)
            start_date = dates[0]
            if len(dates) > 1:
                for end_date in re.finditer(r"19\d\d", head):
	            pass
                end_date = end_date.group(0)
            elif head.find("- ") == -1:
                end_date = dates[0]
            else:
                end_date = "2005"
            #place = re.search(r"(?<=. )[A-Za-z]*(?=(\:|, then))", head).group(0)
            json_entry = {"number": title[0], "title": title[1], "start": dates[0], "end": end_date}
            csv_output.writerow([json_entry["start"], json_entry["end"], json_entry["title"]])
            entries.append(json_entry)
	except Exception as e:
	    print(e)
            print(head)


