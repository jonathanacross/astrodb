r"""
Sorts the objects in objects.tsv

Usage:
python3 sort_objects.py -i ../data/objects.tsv
"""
from collections import defaultdict
from dataclasses import dataclass
from optparse import OptionParser
from typing import List, Tuple, Counter, DefaultDict
import string
import re


def natural_sort_key(s, _nsre=re.compile('([0-9]+)')):
    return [int(text) if text.isdigit() else text.lower()
            for text in _nsre.split(s)]


class Object:
    """Class for fields of an object."""

    is_header: bool
    obj_id: str
    obj_type: str
    line: str

    def __init__(self, line: str):
        fields: str = line.split('\t')
        self.is_header = fields[0].startswith('#')
        self.has_location = (fields[4] == '')
        self.obj_id = fields[0]
        self.obj_type = self.get_main_object_type(fields[2])
        self.line = line

    def get_main_object_type(self, obj_types) -> str:
        types: str = obj_types.split('+')
        return types[0]


        

def sort_objects(obj_file: str):
    """Sort objects."""
    ofile = open(obj_file, 'r')
    lines = ofile.readlines()
    objects = [Object(line) for line in lines]
    sorted_objects = sorted(objects, key = lambda o: (not o.is_header, o.has_location, o.obj_type, natural_sort_key(o.obj_id)))
    for o in sorted_objects:
        print(o.line, end='')
    #natsort_key1 = natsort_keygen(key=lambda y: y.lower())
    #>>> l1.sort(key=natsort_key1)


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-i", "--input",
                      dest="input_object_file",
                      help="file with objects",
                      metavar="TSV FILE")
    (options, args) = parser.parse_args()
    if not (options.input_object_file):
        parser.error("must specify input object file.  Run with -h to see usage.")

    sort_objects(options.input_object_file)

