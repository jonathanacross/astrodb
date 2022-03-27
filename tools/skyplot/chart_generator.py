"""
Plots objects on a star chart.

Usage:
python3 chart_generator.py -i data/H400.tsv -o H400.pdf
"""

from constellation_lines import read_constellation_lines
from dso import read_dso_data
from dso import read_object_list
from milkyway import read_milky_way
from star import read_star_data
from star_chart import StarPlot
from optparse import OptionParser

if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-i", "--object_ids", dest="object_ids",
                      help="list of object ids to plot", metavar="FILE")
    parser.add_option("-o", "--output_map", dest="output_map",
                      help="output pdf map file to create")
    (options, args) = parser.parse_args()
    if not (options.object_ids and options.output_map):
        parser.error("all options must be set.  Run with -h to see usage.")

    stars = read_star_data("data/stars.tsv")
    con_lines = read_constellation_lines("data/constellation_lines.tsv")
    milky_way = read_milky_way("data/milkyway.json")
    dso_data = read_dso_data("../../data/objects.tsv")

    objects = read_object_list(options.object_ids)
    plot = StarPlot(1280, 800, stars, con_lines, milky_way, dso_data, objects)
    plot.write_pdf(options.output_map)
