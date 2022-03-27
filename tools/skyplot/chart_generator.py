from constellation_lines import read_constellation_lines
from dso import read_dso_data
from dso import read_object_list
from milkyway import read_milky_way
from star import read_star_data
from star_chart import StarPlot

if __name__ == "__main__":
    stars = read_star_data("data/stars.tsv")
    con_lines = read_constellation_lines("data/constellation_lines.tsv")
    milky_way = read_milky_way("data/milkyway.json")
    dso_data = read_dso_data("../../data/objects.tsv")

    # change these to choose what to plot
    objects_file = "data/H400.tsv"
    output_file = "H400.pdf"

    objects = read_object_list(objects_file)
    plot = StarPlot(1280, 800, stars, con_lines, milky_way, dso_data, objects)
    plot.write_pdf(output_file)
