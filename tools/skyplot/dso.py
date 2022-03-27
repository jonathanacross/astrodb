import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict
from typing import List

from geometry import SPoint


class DsoType(Enum):
    GALAXY = 1
    OPEN_CLUSTER = 2
    GLOBULAR_CLUSTER = 3
    PLANETARY_NEBULA = 4
    BRIGHT_NEBULA = 5
    ASTERISM = 6
    DOUBLE = 7
    CARBON = 8


@dataclass
class Dso:
    dsoType: DsoType
    loc: SPoint


def parse_ra(ra_string: str) -> float:
    """Changes 02h 39m 24s to a float."""
    digits_only = re.sub("[^0-9. ]+", "", ra_string)
    h, m, s = digits_only.strip().split(' ')
    return float(h) + float(m) / 60.0 + float(s) / 3600.0


def parse_dec(dec_string: str) -> float:
    """Changes a string like 53° 55' 00" to a float."""
    digits_only = re.sub("[^-0-9. ]+", "", dec_string)
    d, m, s = digits_only.strip().split(' ')
    return float(d) + float(m) / 60.0 + float(s) / 3600.0


def parse_type(type_string: str) -> DsoType:
    first_type = re.sub("\+.*", "", type_string)
    if first_type == "Gal":
        return DsoType.GALAXY
    elif first_type == "OCl":
        return DsoType.OPEN_CLUSTER
    elif first_type == "GCl":
        return DsoType.GLOBULAR_CLUSTER
    elif first_type == "PN":
        return DsoType.PLANETARY_NEBULA
    elif first_type == "EN" or first_type == "RN" or first_type == "SNR":
        return DsoType.BRIGHT_NEBULA
    elif first_type == "Ast":
        return DsoType.ASTERISM
    elif first_type == "Double":
        return DsoType.DOUBLE
    elif first_type == "Carbon":
        return DsoType.CARBON
    else:
        raise Exception("unsupported type: " + type_string)


def read_dso_data(dso_file: str) -> Dict[int, Dso]:
    """Reads dso from a file. Returns a map of id -> dso."""

    dfile = open(dso_file, 'r')
    lines = dfile.readlines()
    dsos = {}
    for line in lines:
        if line.startswith('#'):
            # skip comments
            continue
        fields = line.strip().split('\t')
        try:
            dso_id = fields[0]
            dso_type = parse_type(fields[2])
            ra = parse_ra(fields[4])
            dec = parse_dec(fields[5])
            dsos[dso_id] = Dso(dso_type, SPoint(ra, dec))
        except Exception:
            pass
    return dsos


def read_object_list(object_file: str) -> List[str]:
    """Reads a set of ids from the file."""

    ofile = open(object_file, 'r')
    lines = ofile.readlines()
    objects = []
    for line in lines:
        if line.startswith('#'):
            # skip comments
            continue
        objects.append(line.strip())
    return objects
