"""
Generates a graph of number of objects observed in a program over time.
Example:
python3 progress.py \
        -p data/programs.tsv \
        -b data/observations.tsv \
        -n "Messier OP" \
        -o messier.pdf
"""

import datetime
import matplotlib
import matplotlib.dates as mdates
from matplotlib.dates import DateFormatter
import matplotlib.pyplot as plt
from optparse import OptionParser


def get_item_names(program_file, program_name):
    pfile = open(program_file, 'r')
    lines = pfile.readlines()
    names = set({})
    for line in lines:
        fields = line.strip().split('\t')
        program = fields[0]
        object_name = fields[2]
        if program == program_name:
            names.add(object_name)
    return names


def get_dates_seen(obs_file, object_names):
    ofile = open(obs_file, 'r')
    lines = ofile.readlines()
    seen_set = set({})
    date_to_count = {}
    for line in lines:
        if line.startswith("#"):
            continue
        fields = line.strip().split('\t')
        date = fields[0]
        object_name = fields[1]
        seen_set.add(object_name)
        num_seen_in_program = len(object_names.intersection(seen_set))
        # there may be multiple entries per day, but since the count
        # is strictly increasing as we view more objects, the final
        # time we update an entry for each day will be the total
        # number of objects seen at the the end of the day.
        date_to_count[date] = num_seen_in_program
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
            curr_count = date_to_count[str_date]
        str_dates.append(str_date)
        counts.append(curr_count)
    return (str_dates, counts)


def trim_range(dates, counts):
    # only save last 0
    last_zero_idx = 0
    for i in range(0, len(dates)):
        if counts[i] == 0:
            last_zero_idx = i
    last_high_idx = len(dates)
    for i in range(len(dates)-1, 0, -1):
        if counts[i] == counts[-1]:
            last_high_idx = i+1
    return (dates[last_zero_idx:last_high_idx],
            counts[last_zero_idx:last_high_idx])


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
    parser.add_option("-b", "--observation_file", dest="observation_file",
                      help="file with observations", metavar="FILE")
    parser.add_option("-n", "--program_name", dest="program_name",
                      help="program name to graph")
    parser.add_option("-o", "--output_file", dest="output_file",
                      help="graphics file to create", metavar="FILE")
    (options, args) = parser.parse_args()
    if not (options.program_file and
            options.observation_file and
            options.program_name and
            options.output_file):
        parser.error("all options must be set.  Run with -h to see usage.")

    items = get_item_names(options.program_file, options.program_name)
    dc = get_dates_seen(options.observation_file, items)
    (dates, counts) = fill_missing_dates(dc)
    (dates, counts) = trim_range(dates, counts)
    save_plot(dates, counts, options.program_name, options.output_file)
