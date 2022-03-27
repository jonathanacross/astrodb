from dataclasses import dataclass
from typing import Dict

from geometry import SPoint


@dataclass
class Star:
    loc: SPoint
    mag: float


def parse_ra(ra_string: str) -> float:
    if len(ra_string) != 8:
        raise Exception("Expected 8 digits for ra_string")
    hour = int(ra_string[0:2])
    minute = int(ra_string[2:4])
    second = float(ra_string[4:8])
    ra = hour + minute / 60.0 + second / 3600.0
    return ra


def parse_dec(dec_string: str) -> float:
    if len(dec_string) != 7:
        raise Exception("Expected 7 digits for dec_string")
    sign = 1.0 if dec_string[0] == '+' else -1.0
    degree = int(dec_string[1:3])
    minute = int(dec_string[3:5])
    second = int(dec_string[5:7])
    dec = sign * (degree + minute / 60.0 + second / 3600.0)
    return dec


def read_star_data(star_file: str) -> Dict[int, Star]:
    """Reads star data from a file. Returns a map of id -> star."""

    sfile = open(star_file, 'r')
    lines = sfile.readlines()
    stars = {}
    for line in lines:
        if line.startswith('#'):
            # skip comments
            continue
        fields = line.strip().split('\t')
        try:
            star_id = int(fields[0])
            ra = parse_ra(fields[4])
            dec = parse_dec(fields[5])
            mag = float(fields[6])
            stars[star_id] = Star(SPoint(ra, dec), mag)
        except Exception:
            pass

    return stars
