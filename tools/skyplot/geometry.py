from dataclasses import dataclass
from typing import List


@dataclass
class SPoint:
    """Class to hold a sky coordinate; ra goes 0 to 24, dec -90 to 90."""
    ra: float
    dec: float


def shift_right(p: SPoint) -> SPoint:
    return SPoint(p.ra + 24, p.dec)


def shift_left(p: SPoint) -> SPoint:
    return SPoint(p.ra - 24, p.dec)


def crosses_24_to_0(ra1: float, ra2: float) -> bool:
    return ra1 - ra2 > 16


def crosses_0_to_24(ra1: float, ra2: float) -> bool:
    return ra1 - ra2 < -16


def get_dec_intersection(v1: SPoint, v2: SPoint, ra: float) -> float:
    """Gets the dec coordinate along the line from v1 to v2 with given ra coordinate."""
    # Note: if I use spherical geometry to draw lines as proper great
    # circles, then this would have to be updated as well.
    dec = v2.dec + (v2.dec - v1.dec) / (v2.ra - v1.ra) * (ra - v2.ra)
    return dec


@dataclass
class Poly:
    """Class to hold a polygon as a list of points."""
    v: List[SPoint]


def break_into_simple(orig: Poly) -> List[Poly]:
    """Breaks this polygon into a list of simple ones that do not cross the 24 hour line."""
    simple_polys: List[Poly] = []
    curr_poly: List[SPoint] = [orig.v[0]]
    for i in range(1, len(orig.v)):
        prev_vertex = orig.v[i - 1]
        curr_vertex = orig.v[i]
        if crosses_24_to_0(prev_vertex.ra, curr_vertex.ra):
            curr_vertex_24: SPoint = shift_right(curr_vertex)
            dec: float = get_dec_intersection(prev_vertex, curr_vertex_24, 24)
            p24: SPoint = SPoint(24, dec)
            p0: SPoint = SPoint(0, dec)
            curr_poly.append(p24)
            simple_polys.append(Poly(curr_poly))
            curr_poly = [p0, curr_vertex]
        elif crosses_0_to_24(prev_vertex.ra, curr_vertex.ra):
            curr_vertex_0: SPoint = shift_left(curr_vertex)
            dec: float = get_dec_intersection(prev_vertex, curr_vertex_0, 0)
            p24: SPoint = SPoint(24, dec)
            p0: SPoint = SPoint(0, dec)
            curr_poly.append(p0)
            simple_polys.append(Poly(curr_poly))
            curr_poly = [p24, curr_vertex]
        else:
            curr_poly.append(curr_vertex)
    simple_polys.append(Poly(curr_poly))
    return simple_polys


if __name__ == "__main__":
    orig_poly = Poly([
        SPoint(22, 0),
        SPoint(23, 10),
        SPoint(1, 30),
        SPoint(1, 20),
        SPoint(22, 50),
    ])
    simple_polys = break_into_simple(orig_poly)
    print(simple_polys)
