from dataclasses import dataclass
from typing import Dict
from typing import List

from geometry import Poly
from geometry import break_into_simple
from star import Star


@dataclass
class ConstellationLines:
    star_ids: List[int]


def read_constellation_lines(con_lines_file: str) -> List[ConstellationLines]:
    """Reads constellation lines."""

    cfile = open(con_lines_file, 'r')
    lines = cfile.readlines()
    conlines = []
    for line in lines:
        if line.startswith('#'):
            # skip comments
            continue
        fields = line.strip().split('\t')
        star_ids = [int(x) for x in fields[2:]]
        conlines.append(ConstellationLines(star_ids))

    return conlines


def to_poly(con: ConstellationLines, stars: Dict[int, Star]) -> Poly:
    return Poly([stars[c].loc for c in con.star_ids])


def to_polys(con_lines: List[ConstellationLines], stars: Dict[int, Star]) -> List[Poly]:
    return [to_poly(c, stars) for c in con_lines]


def to_simple_polys(con_lines: List[ConstellationLines], stars: Dict[int, Star]) -> List[Poly]:
    complex_polys: List[Poly] = to_polys(con_lines, stars)
    simple_polys: List[List[Poly]] = [break_into_simple(c) for c in complex_polys]
    flattened: List[Poly] = [item for sublist in simple_polys for item in sublist]
    return flattened
