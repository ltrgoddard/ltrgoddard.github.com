#!/usr/bin/env python

import sys
import csv
import re

with open(sys.argv[1], "r") as input:
    data = input.read()

output = csv.writer(open(sys.argv[2], "w"))
output.writerow(["id", "location"])

data = re.sub("(?<=\d), ", "|", data)
data = re.sub("(?<=\da), ", "|", data)
entries = data.split("\n")

for entry in entries:
    elements = entry.split("|")
    first_element = elements[0].rsplit(" ", 1)
    location = first_element[0]
    elements.pop(0)
    try:
        elements.append(first_element[1])
        for element in elements:
            output.writerow([element, location])
        #output.writerow([location, len(elements)])
    except Exception as e:
        print(e)
