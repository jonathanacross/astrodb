# astrodb

This project is a quick-and-dirty astronomy observing list database.

Data is read in from three TSV files that correspond to three 
tables: one for object data, one for observing program data, and
one for observation data.

Technically, these TSV files could be imported into SQL, joined,
and queried.  So why not do that?
- TSV files are easy to update and no SQL instance has to be running.
- I've found I actually only do two types of queries, one to create
  an observing list, or tracking how far I am to completing
  a program.  Full SQL generality is not required.
- Object data is more complex than can be easily represented in SQL 
  data structures.  For example, the magnitude of an object might
  be a single number, a range (for asterisms) or a list (for multiple
  star systems). Another example: filtering/sorting by RA is tricky 
  when crossing over from 23h to 0h.
- This program handles a lot of data validation when creating
  TSV from various observing programs.  A SQL function might
  be able to read in "02 30 00", "2:30", "+2h30m00s", "2.5"
  as the same R.A. value, but it probably won't detect that
  you already imported M31 as "NGC 224" from somewhere else,
  based on having a nearby position in the sky.

The files this expects as input are an "object" file,
with columns
   Id - name of object used to join
   Names - alternate names of object, separated by /
   Type - object type, this is one of
   Con
   RA
   Dec
   Mag
   Size
   Sep
   PA
   Class
   Distance
   Notes

