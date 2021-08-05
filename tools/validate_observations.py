r"""
Does some simple validation for entries in observations.tsv

Usage:
python3 validate_observations.py -d ../data/observations.tsv 
"""
from collections import defaultdict
from dataclasses import dataclass
from optparse import OptionParser
from typing import List, Tuple, Counter, DefaultDict
import string
import re
from decimal import Decimal, ROUND_HALF_UP

YearMonth = Tuple[int, int]
YearMonthCount = Tuple[int, int, int]
CountList = List[YearMonthCount]
ObservationsAndSessionsByMonth = Tuple[CountList, CountList]

class Observation:
    """Class for validatable fields of an obsevation."""

    obsid: str
    date: str
    scope: str
    objids: str
    eyepiece: str
    mag: str

    def __init__(self, line: str):
        fields: str = line.split('\t')
        self.obsid = fields[0]
        self.date = fields[1]
        self.scope = fields[3]
        self.objids = fields[6]
        self.eyepiece = fields[8]
        self.mag = fields[9]

    def get_telescope_focal_length(self) -> int:
        telescopes: Map[str, int] = {"Meade Infinity 80": 400,
                                     "SV Access 80": 560,
                                     "Omni XLT 150": 750,
                                     "Dobstuff 10": 1125}
        return telescopes.get(self.scope, 0)

    def parse_eyepiece_focal_length(self) -> float:
        fl = 0
        fl_match = re.search(r"([0123456789.]+)mm", self.eyepiece)
        if fl_match:
            fl = float(fl_match.group(1))
        if "2x barlow" in self.eyepiece:
            fl /= 2.0
        return fl

    def parse_magnification(self) -> int:
        mag = 0
        mag_match = re.search(r"(\d+)x", self.mag)
        if mag_match:
            mag = int(mag_match.group(1))
        return mag

    def check_mag(self) -> bool:
        telescope_fl: int = self.get_telescope_focal_length() 
        ep_fl: float = self.parse_eyepiece_focal_length()
        magnification: int = self.parse_magnification() 

        if telescope_fl > 0:
            if ep_fl == 0:
                print("error for item: {}: expected eyepiece focal length, saw: {}".format(self.obsid, self.eyepiece))
                return False
            expected_mag = Decimal(telescope_fl / ep_fl).quantize(0, ROUND_HALF_UP)
            if magnification != expected_mag:
                print("error for item: {}: expected magnification: {} actual magnification: {}".format(self.obsid, expected_mag, self.mag))
                return False
        return True

    def check_id_date(self) -> bool:
        id_date_match = re.search(r"(\d\d\d\d\d\d\d\d)-", self.obsid)
        if not id_date_match:
            # skip header
            return True
        id_date: str = id_date_match.group(1)

        norm_date: str = self.date.replace("-", "")
        if id_date != norm_date:
            print("error for item: {}: observation id date {} is different from date: {}".format(self.obsid, id_date, self.date))
            return False
        return True

    def check_id_obs(self) -> bool:
        id_objs_match = re.search(r"\d\d\d\d\d\d\d\d-\d\d-(.*)", self.obsid)
        if not id_objs_match:
            # skip header
            return True
        id_objs: str = id_objs_match.group(1)

        translator = str.maketrans('','',string.punctuation)
        norm_objs: str = self.objids.lower().replace(" ", "")
        norm_objs = norm_objs.translate(translator)
        if norm_objs != id_objs:
            print("error for item: {}: observation id objects {} is different from normalized objects: {}".format(self.obsid, id_objs, norm_objs))
            return False
        return True

        

def validate_observations(obs_file: str):
    """Validate observations."""
    ofile = open(obs_file, 'r')
    lines = ofile.readlines()
    for line in lines:
        observation = Observation(line)
        observation.check_mag()
        observation.check_id_date()
        observation.check_id_obs()


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-d", "--observation_file",
                      dest="observation_file",
                      help="file with observations",
                      metavar="TSV FILE")
    (options, args) = parser.parse_args()
    if not (options.observation_file):
        parser.error("must specify observation file.  Run with -h to see usage.")

    validate_observations(options.observation_file)

