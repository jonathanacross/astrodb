import math
from dataclasses import dataclass
from typing import Dict
from typing import List

import cairo

from constellation_lines import ConstellationLines
from constellation_lines import to_simple_polys
from dso import Dso
from dso import DsoType
from milkyway import MilkyWay
from star import Star


@dataclass
class Point:
    x: float
    y: float


class Frame:
    """Represents a plot of the sky in the designated rectangle."""

    def __init__(self, left: float, top: float, width: float, height: float):
        self.left = left
        self.top = top
        self.width = width
        self.height = height
        self.right = self.left + width
        self.bottom = self.top + height

    def ra_to_x(self, ra: float) -> float:
        return self.left + self.width * (24.0 - ra) / 24.0

    def dec_to_y(self, dec: float) -> float:
        return self.top + self.height * (90.0 - dec) / 180.0


class StarPlot:

    def __init__(self, width: int, height: int, stars: Dict[int, Star],
                 con_lines: List[ConstellationLines],
                 milky_way: MilkyWay,
                 dso_data: Dict[str, Dso], object_ids: List[str]):
        self.width = width
        self.height = height
        self.surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, self.width, self.height)
        self.stars = stars
        self.con_lines = con_lines
        self.milky_way = milky_way
        self.dso_data = dso_data
        self.object_ids = object_ids

        margin = 15
        self.frame = Frame(2 * margin, margin, self.width - 3 * margin, self.height - 3 * margin)

    def draw_globular_cluster(self, ctx):
        r = 10.0
        ctx.set_source_rgb(1.0, 1.0, 0.0)
        ctx.arc(0, 0, r, 0.0, 2 * math.pi)
        ctx.fill()

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.arc(0, 0, r, 0.0, 2 * math.pi)
        ctx.move_to(-r, 0)
        ctx.line_to(r, 0)
        ctx.move_to(0, -r)
        ctx.line_to(0, r)
        ctx.stroke()

    def draw_open_cluster(self, ctx):
        r = 10.0
        ctx.set_source_rgb(1.0, 1.0, 0.0)
        ctx.arc(0, 0, r, 0.0, 2 * math.pi)
        ctx.fill()

        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.set_dash([0.0, 7.0])
        ctx.set_line_width(3)
        ctx.arc(0, 0, r, 0.0, 2 * math.pi)
        ctx.stroke()

    def draw_bright_nebula(self, ctx):
        r = 10.0
        ctx.set_source_rgb(0.0, 1.0, 0.0)
        ctx.rectangle(-r, -r, 2 * r, 2 * r)
        ctx.fill()
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.rectangle(-r, -r, 2 * r, 2 * r)
        ctx.stroke()

    def draw_asterism(self, ctx):
        r = 10.0
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.move_to(-r, -r)
        ctx.line_to(r, r)
        ctx.move_to(r, -r)
        ctx.line_to(-r, r)
        ctx.stroke()

    def ellipse_path(self, ctx):
        r = 10
        ctx.save()
        ctx.scale(1, 0.5)
        ctx.arc(0, 0, r, 0.0, 2 * math.pi)
        ctx.restore()

    def draw_galaxy(self, ctx):
        self.ellipse_path(ctx)
        ctx.set_source_rgb(1.0, 0.0, 0.0)
        ctx.fill()
        self.ellipse_path(ctx)
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.stroke()

    def draw_planetary_nebula(self, ctx):
        r = 10.0
        green_r = 0.8 * r  # radius of the green dot
        line_r = 1.2 * r  # radius of the crossing lines

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.move_to(-line_r, 0)
        ctx.line_to(line_r, 0)
        ctx.move_to(0, -line_r)
        ctx.line_to(0, line_r)
        ctx.stroke()

        ctx.set_source_rgb(0.0, 1.0, 0.0)
        ctx.arc(0, 0, green_r, 0.0, 2 * math.pi)
        ctx.fill()

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.arc(0, 0, green_r, 0.0, 2 * math.pi)
        ctx.stroke()

    def draw_carbon_star(self, ctx):
        r = 10.0

        ctx.set_source_rgb(1.0, 0.5, 0.0)
        ctx.move_to(-r, 0)
        ctx.line_to(0, -r)
        ctx.line_to(r, 0)
        ctx.line_to(0, r)
        ctx.close_path()
        ctx.fill()

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.move_to(-r, 0)
        ctx.line_to(0, -r)
        ctx.line_to(r, 0)
        ctx.line_to(0, r)
        ctx.close_path()
        ctx.stroke()


    def draw_double(self, ctx):
        r = 10.0
        dot_r = 0.6 * r  # radius of the dot
        line_r = 1.2 * r  # radius of the crossing line

        ctx.save()

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.move_to(-line_r, 0)
        ctx.line_to(line_r, 0)
        ctx.stroke()

        ctx.set_source_rgb(1.0, 0.0, 1.0)
        ctx.arc(0, 0, dot_r, 0.0, 2 * math.pi)
        ctx.fill()

        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.arc(0, 0, dot_r, 0.0, 2 * math.pi)
        ctx.stroke()
        ctx.restore()

    def draw_dsos(self, ctx):
        for dso_id in self.object_ids:
            if dso_id not in self.dso_data:
                print("warning: couldn't plot " + dso_id)
                continue
            dso = self.dso_data[dso_id]
            x = self.frame.ra_to_x(dso.loc.ra)
            y = self.frame.dec_to_y(dso.loc.dec)
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(0.4, 0.4)
            if dso.dsoType == DsoType.GALAXY:
                self.draw_galaxy(ctx)
            elif dso.dsoType == DsoType.OPEN_CLUSTER:
                self.draw_open_cluster(ctx)
            elif dso.dsoType == DsoType.GLOBULAR_CLUSTER:
                self.draw_globular_cluster(ctx)
            elif dso.dsoType == DsoType.BRIGHT_NEBULA:
                self.draw_bright_nebula(ctx)
            elif dso.dsoType == DsoType.PLANETARY_NEBULA:
                self.draw_planetary_nebula(ctx)
            elif dso.dsoType == DsoType.ASTERISM:
                self.draw_asterism(ctx)
            elif dso.dsoType == DsoType.DOUBLE:
                self.draw_double(ctx)
            elif dso.dsoType == DsoType.CARBON:
                self.draw_carbon_star(ctx)
            ctx.restore()

    def draw_con_lines(self, ctx):
        con_polys = to_simple_polys(self.con_lines, self.stars)

        ctx.save()
        ctx.set_source_rgb(0.5, 0.0, 0.0)
        ctx.set_line_width(0.5)
        # ctx.set_source_rgb(0.8, 0.8, 0.8)
        for p in con_polys:
            for idx, v in enumerate(p.v):
                x = self.frame.ra_to_x(v.ra)
                y = self.frame.dec_to_y(v.dec)
                if idx == 0:
                    ctx.move_to(x, y)
                else:
                    ctx.line_to(x, y)
            ctx.stroke()
        ctx.restore()

    def draw_milky_way(self, ctx):
        ctx.save()
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        start_color = (0.73, 0.83, 1.0)
        end_color = (0.875, 0.94, 1.0)
        num_layers = len(self.milky_way.layers)
        for idx, layer in enumerate(self.milky_way.layers):
            lam = float(idx) / (num_layers - 1.0)
            r = lam * start_color[0] + (1 - lam) * end_color[0]
            g = lam * start_color[1] + (1 - lam) * end_color[1]
            b = lam * start_color[2] + (1 - lam) * end_color[2]
            ctx.set_source_rgb(r, g, b)
            for p in layer.polys:
                for idx, v in enumerate(p.v):
                    x = self.frame.ra_to_x(v.ra)
                    y = self.frame.dec_to_y(v.dec)
                    if idx == 0:
                        ctx.move_to(x, y)
                    else:
                        ctx.line_to(x, y)
            ctx.fill()
        ctx.restore()

    def draw_stars(self, ctx):
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        for star_id, s in self.stars.items():
            x = self.frame.ra_to_x(s.loc.ra)
            y = self.frame.dec_to_y(s.loc.dec)
            radius = -0.55 * s.mag + 3.5
            # radius = 0.09 * s.mag * s.mag - 1.0 * s.mag + 3.4
            if radius > 0:
                ctx.arc(x, y, radius, 0.0, 2 * math.pi)
                ctx.fill()

    def draw_background(self, ctx):
        ctx.set_source_rgb(1.0, 1., 1.0)
        ctx.rectangle(0, 0, self.width, self.height)  # Rectangle(x0, y0, w, h)
        ctx.fill()

    def draw_grid(self, ctx):
        # hours
        ctx.set_line_width(1)
        ctx.set_source_rgb(0.8, 0.8, 0.8)
        for ra in range(24):
            x = self.frame.ra_to_x(ra)
            ymin = self.frame.top
            ymax = self.frame.bottom
            ctx.move_to(x, ymin)
            ctx.line_to(x, ymax)
            ctx.stroke()

        # dec lines
        ctx.set_line_width(1)
        ctx.set_source_rgb(0.8, 0.8, 0.8)
        for dec in range(-90, 90, 10):
            xmin = self.frame.left
            xmax = self.frame.right
            y = self.frame.dec_to_y(dec)
            ctx.move_to(xmin, y)
            ctx.line_to(xmax, y)
            ctx.stroke()

    def draw_labels(self, ctx):
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.select_font_face("Ariel", cairo.FONT_SLANT_NORMAL,
                             cairo.FONT_WEIGHT_NORMAL)
        ctx.set_font_size(10)

        for ra in range(25):
            x = self.frame.ra_to_x(ra)
            y = self.frame.bottom
            (x_bearing, y_bearing, width, height, dx, dy) = ctx.text_extents(str(ra))
            ctx.move_to(x - width * 0.5, y + 1.5 * height)
            ctx.show_text(str(ra))

        (x_bearing, y_bearing, width, height, dx, dy) = ctx.text_extents("-900")
        for dec in range(-90, 100, 10):
            x = self.frame.left
            y = self.frame.dec_to_y(dec)
            ctx.move_to(x - width, y + 0.5 * height)
            ctx.show_text(str(dec))

    def draw_frame(self, ctx):
        ctx.rectangle(self.frame.left, self.frame.top, self.frame.width, self.frame.height)
        ctx.set_line_width(2)
        ctx.set_source_rgb(0.0, 0.0, 0.0)
        ctx.stroke()

    def draw(self, ctx):
        self.draw_background(ctx)
        self.draw_milky_way(ctx)
        self.draw_grid(ctx)
        self.draw_labels(ctx)
        self.draw_con_lines(ctx)
        self.draw_stars(ctx)
        self.draw_dsos(ctx)
        self.draw_frame(ctx)

    def write_png(self, filename: str):
        ctx = cairo.Context(self.surface)
        self.draw(ctx)
        self.surface.write_to_png(filename)

    def write_pdf(self, filename: str):
        ps = cairo.PDFSurface(filename, self.width, self.height)
        ctx = cairo.Context(ps)
        self.draw(ctx)
