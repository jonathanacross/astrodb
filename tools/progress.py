"""
Generates a graph of number of objects observed in a program over time.
Example:
python3 progress.py \
        -p ../data/programs.tsv \
        -n "Messier OP" \
        -o messier.pdf
"""

import datetime
import matplotlib
import matplotlib.dates as mdates
from matplotlib.dates import DateFormatter
import matplotlib.pyplot as plt
from optparse import OptionParser


def parse_date(observation_id):
    'Parses an id like 20190129-02-m81m82 to a date, e.g., 2019-01-29.'
    return observation_id[0:4] + "-" + observation_id[4:6] + "-" + observation_id[6:8]


def get_dates_seen(program_file, program_name):
    'Creates a map of date -> num observations for the given program.'
    pfile = open(program_file, 'r')
    lines = pfile.readlines()
    seen_set = set({})
    date_to_count = {}
    for line in lines:
        fields = line.strip().split('\t')
        program = fields[0]
        object_name = fields[2]
        # check if this line corresponds to the program of interest and
        # has an observation
        if program == program_name and len(fields) == 4:
            observation_id = fields[3]
            obs_date = parse_date(observation_id)
            if obs_date not in date_to_count:
                date_to_count[obs_date] = 0
            date_to_count[obs_date] += 1
    return date_to_count


def fill_missing_dates(date_to_count):
    # compute first, last dates
    sorted_date_counts = sorted(date_to_count)
    start = datetime.datetime.strptime(sorted_date_counts[0], "%Y-%m-%d")
    end = datetime.datetime.strptime(sorted_date_counts[-1], "%Y-%m-%d")
    dates = [start + datetime.timedelta(days=x)
             for x in range(0, (end-start).days + 1)]

    curr_count = 0
    str_dates = []
    counts = []
    for date in dates:
        str_date = date.strftime("%Y-%m-%d")
        if str_date in date_to_count:
            curr_count += date_to_count[str_date]
        str_dates.append(str_date)
        counts.append(curr_count)
    return (str_dates, counts)


def save_plot(dates, counts, program_name, output_file):
    x_values = [datetime.datetime.strptime(
        d, "%Y-%m-%d").date() for d in dates]
    ax = plt.gca()

    years = mdates.YearLocator()   # every year
    months = mdates.MonthLocator()  # every month
    years_fmt = mdates.DateFormatter('%Y')

    ax.xaxis.set_major_locator(years)
    ax.xaxis.set_major_formatter(years_fmt)
    ax.xaxis.set_minor_locator(months)

    ax.grid(True)

    plt.plot(x_values, counts)
    plt.title(program_name)
    plt.savefig(output_file)


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-p", "--program_file", dest="program_file",
                      help="file with programs", metavar="FILE")
    #parser.add_option("-b", "--observation_file", dest="observation_file",
    #                  help="file with observations", metavar="FILE")
    parser.add_option("-n", "--program_name", dest="program_name",
                      help="program name to graph")
    parser.add_option("-o", "--output_file", dest="output_file",
                      help="graphics file to create", metavar="FILE")
    (options, args) = parser.parse_args()
    if not (options.program_file and
            options.program_name and
            options.output_file):
        parser.error("all options must be set.  Run with -h to see usage.")

    dc = get_dates_seen(options.program_file, options.program_name)
    (dates, counts) = fill_missing_dates(dc)
    save_plot(dates, counts, options.program_name, options.output_file)
