r"""
Generates graphs for observations and sessions by month.

Example:
python3 gen_frequency_charts.py \
    -d ../data/observations.tsv \
    -o num_observations_by_month.png \
    -s num_sessions_by_month.png
"""
from collections import defaultdict
from dataclasses import dataclass
from optparse import OptionParser
from typing import List, Tuple, Counter, DefaultDict
import cairo
import re

YearMonth = Tuple[int, int]
YearMonthCount = Tuple[int, int, int]
CountList = List[YearMonthCount]
ObservationsAndSessionsByMonth = Tuple[CountList, CountList]


def extract_counts(obs_file: str) -> ObservationsAndSessionsByMonth:
    """Extract num of observations and num of sessions by month."""
    ofile = open(obs_file, 'r')
    lines = ofile.readlines()
    num_observations: Counter[YearMonth] = Counter()
    sessions: DefaultDict[YearMonth, set] = defaultdict(set)
    for line in lines:
        date_match = re.search(r"\t(\d\d\d\d)-(\d\d)-(\d\d)\t", line)
        if date_match:
            year = int(date_match.group(1))
            month = int(date_match.group(2))
            day = int(date_match.group(3))

            num_observations[(year, month)] += 1
            sessions[(year, month)].add(day)

    num_observations_by_month = []
    num_sessions_by_month = []
    for k in num_observations:
        num_observations_by_month.append((k[0], k[1], num_observations[k]))
        num_sessions_by_month.append((k[0], k[1], len(sessions[k])))

    return (num_observations_by_month, num_sessions_by_month)


@dataclass
class Color:
    """Struct for red, green, blue components of a color."""

    r: float
    g: float
    b: float


def get_gradient_color(min_color: Color, max_color: Color, percent: float) -> Color:
    """Compute the color percent of the way between min_color and max_color."""
    r: float = percent * max_color.r + (1.0 - percent) * min_color.r
    g: float = percent * max_color.g + (1.0 - percent) * min_color.g
    b: float = percent * max_color.b + (1.0 - percent) * min_color.b
    return Color(r, g, b)


class SquareChart:
    """Create charts to visualize counts by month and year."""

    def __init__(self, counts: CountList, title: str, width: int = 500):
        self.counts = counts
        self.width = width
        self.title = title

        # play with these to change the look of the chart
        self.margin = 10
        self.square_space = 2
        self.square_left = 55
        self.square_top = 45
        self.min_color = Color(1.0, 1.0, 1.0)
        self.max_color = Color(0.0, 0.4, 0.8)
        self.show_counts = True
        self.font_face = "sans-serif"

        # computed internal variables
        self.square_size = (self.width - self.margin - self.square_left) / 12
        self.height = self.__compute_height()
        self.max_count = max([c[2] for c in self.counts])

    def __year_to_y(self, year: int) -> float:
        min_year = self.counts[0][0]
        return self.square_top + (year - min_year) * self.square_size

    def __month_to_x(self, month: int) -> float:
        min_month = 1
        return self.square_left + (month - min_month) * self.square_size

    def __set_default_font(self, ctx) -> None:
        ctx.select_font_face(self.font_face,
                             cairo.FONT_SLANT_NORMAL,
                             cairo.FONT_WEIGHT_NORMAL)

    def __set_axis_font(self, ctx) -> None:
        self.__set_default_font(ctx)
        ctx.set_font_size(14)

    def __set_title_font(self, ctx) -> None:
        self.__set_default_font(ctx)
        ctx.set_font_size(16)

    def __set_square_font(self, ctx) -> None:
        self.__set_default_font(ctx)
        ctx.set_font_size(12)

    def __draw_title(self, ctx) -> None:
        self.__set_title_font(ctx)
        (_, _, width, height, _, _) = ctx.text_extents(self.title)
        x_center = 0.5 * (self.width - width)

        ctx.set_source_rgb(0, 0, 0)
        ctx.move_to(x_center, self.margin + height)
        ctx.text_path(self.title)
        ctx.fill()

    def __draw_rectangles(self, ctx) -> None:
        self.__set_square_font(ctx)

        for entry in self.counts:
            year = entry[0]
            month = entry[1]
            cnt = entry[2]

            ctx.rectangle(
                    self.__month_to_x(month) + self.square_space/2,
                    self.__year_to_y(year) + self.square_space/2,
                    self.square_size - self.square_space,
                    self.square_size - self.square_space)

            percent = cnt / self.max_count
            fill_color = get_gradient_color(self.min_color,
                                            self.max_color,
                                            percent)
            ctx.set_source_rgb(fill_color.r, fill_color.g, fill_color.b)
            ctx.fill()

            if self.show_counts:
                (_, _, width, height, _, _) = ctx.text_extents(str(cnt))
                x_center = self.__month_to_x(month) + 0.5 * (self.square_size - width)
                y_center = self.__year_to_y(year) + 0.5 * (self.square_size + height)
                ctx.set_source_rgb(0, 0, 0)
                ctx.move_to(x_center, y_center)
                ctx.text_path(str(cnt))
                ctx.fill()

    def __draw_month_axis(self, ctx) -> None:
        ctx.set_source_rgb(0, 0, 0)
        self.__set_axis_font(ctx)
        month_labels = list("JFMAMJJASOND")
        for m in range(12):
            (_, _, width, height, _, _) = ctx.text_extents(month_labels[m])
            x_center = 0.5 * (self.__month_to_x(m+1) + self.__month_to_x(m+2) - width)
            y = self.__year_to_y(self.counts[-1][0] + 1) + self.margin + height
            ctx.move_to(x_center, y)
            ctx.text_path(month_labels[m])
            ctx.fill()

    def __compute_height(self) -> int:
        # note: if the draw_month_axis function changes, so must this.
        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, 100, 100)
        ctx = cairo.Context(surface)
        self.__set_axis_font(ctx)
        (_, _, width, height, _, _) = ctx.text_extents("X")
        return int(self.__year_to_y(self.counts[-1][0] + 1) + 3*self.margin + height)

    def __draw_year_axis(self, ctx) -> None:
        ctx.set_source_rgb(0, 0, 0)
        self.__set_axis_font(ctx)
        years = set([c[0] for c in self.counts])
        for year in years:
            (_, _, _, height, _, _) = ctx.text_extents("2000")
            y_center = 0.5 * (self.__year_to_y(year) + self.__year_to_y(year+1) + height)
            ctx.move_to(self.margin, y_center)
            ctx.text_path(str(year))
            ctx.fill()

    def create_plot(self, output_file) -> None:
        """Create a plot and saves it to output_file."""
        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32,
                                     self.width, self.height)
        ctx = cairo.Context(surface)

        # fill background
        ctx.set_source_rgb(1.0, 1.0, 1.0)
        ctx.paint()

        self.__draw_title(ctx)
        self.__draw_rectangles(ctx)
        self.__draw_month_axis(ctx)
        self.__draw_year_axis(ctx)

        surface.write_to_png(output_file)


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-d", "--observation_file",
                      dest="observation_file",
                      help="file with observations",
                      metavar="TSV FILE")
    parser.add_option("-o", "--observations_chart",
                      dest="observations_chart",
                      help="file name of observations chart to create.",
                      metavar="PNG FILE")
    parser.add_option("-s", "--sessions_chart",
                      dest="sessions_chart",
                      help="file name of sessions chart to create.",
                      metavar="PNG FILE")
    (options, args) = parser.parse_args()
    if not (options.observation_file and
            options.observations_chart and
            options.sessions_chart):
        parser.error("all options must be set.  Run with -h to see usage.")

    (num_observations_by_month, num_sessions_by_month) = extract_counts(
            options.observation_file)

    obs_chart = SquareChart(num_observations_by_month,
                            "Number of Observations",
                            width=600)
    obs_chart.create_plot(options.observations_chart)

    ses_chart = SquareChart(num_sessions_by_month,
                            "Number of Observing Sessions",
                            width=600)
    ses_chart.create_plot(options.sessions_chart)
