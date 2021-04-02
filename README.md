# astrodb

This project is a quick-and-dirty astronomy observing list database.
There are two parts: a command-line interface to query objects
in the database, and a web UI to query observations, at 
https://jonathanacross.github.io/astrodb/

Data is read in from three TSV files that correspond to three 
tables: one for object data, one for observing program data, and
one for observation data.

Technically, these TSV files could be imported into SQL, joined,
and queried.  So why not do that?
- TSV files are easy to update and no SQL instance has to be running.
- I've found I actually only do a few types of queries, one to create
  an observing list, or tracking how far I am to completing
  a program.  Full SQL generality is not required.
- Object data is more complex than can be easily represented in SQL 
  data structures.  For example, the magnitude of an object might
  be a single number, a range (for asterisms) or a list (for multiple
  star systems). Another example: filtering/sorting by RA is tricky 
  when crossing over from 23h to 0h.
- This handles a lot of data conversion and validation to help
  ease the pain of importing data from various observing programs.  
  For instance, "02 30 00", "2:30", "+2h30m00s", "2.5" all represent the
  same R.A. value, and you can enable checking for duplicate objects
  based on having the same (or nearly same) position in the sky.
  This is useful as one observing program may list an object as M31 
  while another might list it as NGC224.

## Building and Running

To build, run the following from the project directory.
```
./gradlew installDist
```

This builds binaries at build/install/astrodb/bin which you can
directly call on the command line.  Here are some examples:

```
# show the usage
build/install/astrodb/bin/astrodb help 
```

```
# Make an observing list of clusters and galaxies that are somewhat bright 
# (magnitude <= 10, surface brightess <= 12), that lie in a particular part 
# of the sky and that you've never observed. Results for observing lists are
# always sorted by Con (which are also sorted by RA), and then RA.
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=observing_list \
--filter='
    ra range 22h to 2h
    dec >= -20
    seen = false
    type in OCl,Gal
    mag <= 10.0
    sb <= 12.0
'
```

```
# Make a list of objects for a particular program that
# you have observed, but no observation is marked
# for the program.  Such objects may have been intentionally
# missed (e.g., because of specific program requirements)
# or may have been accidental.
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=observing_list \
--filter='
    program = "Binocular Messier OP"
    checkedinprogram = false
    seen = true
'
```

```
# Track the progress for a particular observing program.  Results
# for program lists are always are sorted by the order in the program.
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=program_list \
--filter='program = "Messier OP"'
```

Note that if the observing program has a single quote in it,
e.g., "Wimmer's List", then writing the program in the filter can be
done as described 
[here](https://unix.stackexchange.com/questions/169508/single-quote-within-double-quotes-and-the-bash-reference-manual):

```
program = "Wimmer'"'"'s List"
```


```
# When adding new objects to the objects table:
# Check if there are likely duplicates, and output all the object data 
# in a consistent format. (Can be used as a future objects.tsv file.)  
# Order is unchanged.  
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=object_list \
--checkLikelyDuplicates=true
```

```
# Get information about a particular object
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=observing_list \
--filter='name like Dumbbell'
```

```
# Print meta-information about objects, including the number of programs
# items are in, how many observations have been made, and the distance
# to objects.  This makes it easy to answer questions like "What are
# the most popular objects?" and "what's the most distant object I
# have ever seen?".
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=meta_list \
--filter='seen = true'
```
