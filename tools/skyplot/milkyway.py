import json
from dataclasses import dataclass
from typing import List

from geometry import Poly
from geometry import SPoint


@dataclass
class MilkyWayLayer:
    polys: List[Poly]


@dataclass
class MilkyWay:
    layers: List[MilkyWayLayer]


def rotate_to_0_hour(poly: Poly) -> Poly:
    break_idx = -1
    for idx in range(1, len(poly.v)):
        ra1 = poly.v[idx - 1].ra
        ra2 = poly.v[idx].ra
        if abs(ra1 - ra2) > 1:
            # large jump in RA; wraparound here
            break_idx = idx
            break
    if break_idx > 0:
        return Poly(poly.v[break_idx:-1] + poly.v[0:break_idx])
    else:
        return poly


def join_polys(poly1: Poly, poly2: Poly) -> Poly:
    """Assumes that poly1 starts at ra=0 and ends at ra=24, and poly2 starts at ra=24 and ends at ra=0."""
    poly1_start = SPoint(0, poly1.v[0].dec)
    poly1_end = SPoint(24, poly1.v[-1].dec)
    poly2_start = SPoint(24, poly2.v[0].dec)
    poly2_end = SPoint(0, poly2.v[-1].dec)
    full_list = [poly1_start] + poly1.v + [poly1_end] + [poly2_start] + poly2.v + [poly2_end]
    return Poly(full_list)


def fix_layer_hack(layer: MilkyWayLayer) -> MilkyWayLayer:
    """Fixes the first layer, where the first two polygons wrap around the sky and are disconnected."""
    new_polys = [join_polys(rotate_to_0_hour(layer.polys[0]), rotate_to_0_hour(layer.polys[1]))] + layer.polys[2:-1]
    return MilkyWayLayer(new_polys)


def num_24h_crosses(poly: Poly) -> int:
    num_breaks = 0
    for idx in range(1, len(poly.v)):
        ra1 = poly.v[idx - 1].ra
        ra2 = poly.v[idx].ra
        if abs(ra1 - ra2) > 1:
            num_breaks += 1
    return num_breaks


def read_milky_way(mw_file: str) -> MilkyWay:
    f = open(mw_file)
    data = json.load(f)

    layers: List[MilkyWayLayer] = []
    first_layer = True
    for feature in data["features"]:
        coords = feature["geometry"]["coordinates"]
        polys: List[Poly] = []
        for poly in coords:
            spoints: List[SPoint] = []
            for point in poly:
                alpha = float(point[0])
                if alpha < 0:
                    alpha += 360.0
                ra = alpha / 15.0  # convert to hours
                dec = float(point[1])
                spoints.append(SPoint(ra, dec))
            if num_24h_crosses(Poly(spoints)) != 2:
                # Hack to simply ignore the few smaller polys that cross
                # over the 24 hour line. Slightly better would be to split
                # into two separate simple polys.
                polys.append(Poly(spoints))
        layer = MilkyWayLayer(polys)
        if first_layer:
            layer = fix_layer_hack(layer)
            first_layer = False
        layers.append(layer)
    f.close()

    return MilkyWay(layers)


if __name__ == "__main__":
    mwdata = read_milky_way("data/milkyway.json")
    p = mwdata.layers[0].polys[1]
    for point in p.v:
        print("{}\t{}".format(point.ra, point.dec))
    # print(mwdata)
    # print(len(mwdata.layers))
