# astrodb

This project is a quick-and-dirty astronomy observing list database.

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
# Make an observing list of objects in a particular program that
# you haven't seen for a while.
build/install/astrodb/bin/astrodb \
--objects="data/objects.tsv" \
--programs="data/programs.tsv" \
--observations="data/observations.tsv" \
--mode=observing_list \
--filter='
    program = "Messier OP"
    notseen since 2018-01-22
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

## Data files

### Object file

This contains all intrinsic data for objects.  This file has columns:
- Id - id of object used to join against other tables.  
   This can be an arbitrary string,
   though I prefer to use a name I might recognize to make editing easier,
   e.g., "M 31" rather than "12345".
- Names - alternate names of object, separated by /
- Type - object type, separated by +.  Object types used in various
          observing programs are supported.  E.g., "galaxy", "Gal", "GX"
          all represent a galaxy.
- Con - constellation name (capitalization ignored)
- RA - Right ascension.  Handles various formats, e.g.,
   24h 32.52m", "24 32 31" "24:32:31" "24:32.52" all map to 24.542
- Dec - Declination.  Handles various formats, e.g.,
    "-55 20' 15", "-55:20:15", "-55° 20.25'" all map to -55.3375
- Mag - Magnitude. Can be one of
     - Empty (e.g., for dark nebulae)
     - A single value
     - A list of values, for double stars, e.g., "6.5,7.3"
     - A range of values, for asterisms, e.g., "6 to 7" or "6-7"
     - Named key-value pairs, for multiple stars, e.g., "A=3.4, BC=4.5, D=8"
- Size - Size of an object. Can be one of 
     - Empty (e.g., for carbon stars)
     - Single number for the diameter of the object. Default is in arcminutes
       if no units are specified. Examples: "12.3'", "4 deg", "6.2"
     - Pair of numbers specifying the major/minor diameters of the object.
       E.g., "2.5 x 1.3".
- Sep - For double stars, the separations, in arcseconds.  Can be one of
     - Empty
     - A single number for double stars
     - Named key-value pairs, separated by ", " for multiple stars, e.g., 
       "A,BC=12, AD=53"
- PA - for double stars, the position angles, in degrees.  Can be one of
     - Empty
     - A single number for double stars
     - Named key-value pairs, separated by ", " for multiple stars, e.g., 
       "A,BC=334, AD=98"
- Class - class of the object.  A freeform string.  Informational only;
     not used in filtering.
- Distance - distance to the object.  Informational only.  Can be given
     in "ly", "kly", "mly" for units.
- Notes - other notes for the object.

### Program file
This file stores which items are in which observing programs.  This has
columns:

- Program - name of the program
- Number - number in the program.  Some programs have entries with
  suffixes like 68a, 68b.  These are supported and will be sorted correctly.
- Id - item id to join with objects

### Observations file
This just has a list of the dates of when objects were observed. 
This has columns:

- Date in format yyyy-mm-dd
- Id - item id to join with objects
