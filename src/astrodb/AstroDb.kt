package astrodb

import java.io.File
import java.lang.StringBuilder
import kotlin.math.abs

// https://raw.githubusercontent.com/Stellarium/stellarium/master/nebulae/default/catalog.txt
// has a fairly comprehensive dataset for magnitude, distance, type, size
// https://github.com/Stellarium/stellarium/blob/master/nebulae/default/names.dat
// has names



class ParseException(message: String) : Exception(message)

// reads base-60-style strings and changes to a double value.
// examples: "24h 32.52m", "24 32 31" "24:32:31" "24:32.52" all go to 24.542
// "-55 20' 15", "-55:20:15", "-55° 20.25'" all map to -55.3375
fun parseBase60(formattedValue: String): Double {
    try {
        val numberMatcher = Regex("[-.0-9]+")
        val matches = numberMatcher.findAll(formattedValue)
        val digitGroups = matches.map { it.groupValues[0].toDouble() }

        var value = 0.0
        var scale = 1.0
        val sign = if (digitGroups.elementAt(0) < 0) -1.0 else 1.0

        for (number in digitGroups) {
            value += abs(number) * scale
            scale /= 60.0
        }

        return value * sign
    } catch (e: NumberFormatException) {
        throw ParseException("Couldn't parse entry '" + formattedValue + "'")
    }
}

fun parseLine(line: String): Object {
    val fields = line.split("\t")
    val id = fields[0]
    val names = listOf(fields[1])
    val types = ObjectType.parse(fields[2])
    val con = Constellation.parse(fields[3])
    val ra = parseBase60(fields[4])
    val dec = parseBase60(fields[5])
    val mag = Magnitude.parse(fields[6])
    val size = Size.parse(fields[7])

    return Object(id, names, types, con, ra, dec, mag, size)
}

data class ObjectWithLine(val obj: Object, val line: Int)

fun readFile(fileName: String): Either<String, List<ObjectWithLine>> {
    val fileLines = mutableListOf<String>()
    File(fileName).useLines { filelines -> fileLines.addAll(filelines) }

    val objects = mutableListOf<ObjectWithLine>()
    fileLines.forEachIndexed { index, line ->
        if (!line.startsWith("#")) {
            val lineNumber = index + 1
            try {
                val observingObject = parseLine(line)
                objects.add(ObjectWithLine(observingObject, lineNumber))
            } catch (e: ParseException) {
                return error(e.message + " on line " + lineNumber)
            }
        }
    }

    val duplicates = findDuplicates(objects)
    if (duplicates.size > 0) {
        val sb = StringBuilder()
        for ((id, objs) in duplicates.entries) {
            val lines = objs.map{ o -> o.line }
            sb.append("Duplicate entries for '" + id + "' on lines " + lines + "\n")
        }
        return error(sb.toString())
    }

    return value(objects)
}

fun normalizeId(id: String): String {
    return id.toLowerCase().replace(" ", "")
}

fun findDuplicates(objs: List<ObjectWithLine>): Map<String, List<ObjectWithLine>>  {
    val duplicates = objs.groupBy({ normalizeId(it.obj.id) }, { it })
        .filterValues { list -> list.size > 1 }
   return duplicates
}

fun main(args: Array<String>) {
    val objectsOrError = readFile("/Users/jonathan/tmp/objects.tsv")
    val objects: List<Object>
    when (objectsOrError) {
        is Either.Error -> print(objectsOrError.error)
        is Either.Value -> print("success; read " + objectsOrError.value.size)
    }
}
