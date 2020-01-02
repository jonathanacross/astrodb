package astrodb

import java.io.File
import java.text.DecimalFormat
import kotlin.math.abs
import kotlin.math.round

// https://raw.githubusercontent.com/Stellarium/stellarium/master/nebulae/default/catalog.txt
// has a fairly comprehensive dataset for magnitude, distance, type, size
// https://github.com/Stellarium/stellarium/blob/master/nebulae/default/names.dat
// has names


class ParseException(message: String) : Exception(message)

fun formatNumber(d: Double): String {
    val df = DecimalFormat("0")
    df.maximumFractionDigits = 3
    return df.format(d)
}

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
        throw ParseException("Couldn't parse entry '$formattedValue'")
    }
}

fun parseNames(nameField: String): List<String> {
    return nameField.split("/").toList()
}

data class ObjectWithLine(val obj: Object, val line: Int)

fun readObjectFile(fileName: String, checkLikelyDuplicates: Boolean): List<Object> {
    val fileLines = mutableListOf<String>()
    File(fileName).useLines { filelines -> fileLines.addAll(filelines) }

    val objects = mutableListOf<ObjectWithLine>()
    fileLines.forEachIndexed { index, line ->
        if (!line.startsWith("#")) {
            val lineNumber = index + 1
            try {
                val observingObject = Object.parse(line)
                objects.add(ObjectWithLine(observingObject, lineNumber))
            } catch (e: Exception) {
                throw ParseException(e.message + " on line " + lineNumber)
            }
        }
    }

    val duplicates = findDuplicates(objects)
    if (duplicates.isNotEmpty()) {
        val sb = StringBuilder()
        for ((id, objs) in duplicates.entries) {
            val lines = objs.map { o -> o.line }
            sb.append("Duplicate entries for '$id' on lines $lines\n")
        }
        throw ParseException(sb.toString())
    }

    if (checkLikelyDuplicates) {
        val likelyDuplicates = findLikelyDuplicates(objects)
        if (likelyDuplicates.isNotEmpty()) {
            val sb = StringBuilder()
            for ((id, objs) in likelyDuplicates.entries) {
                val lines = objs.map { o -> o.line }
                sb.append("Possible duplicate entries (by RA/DEC)'" + objs.map { x -> x.obj.id } + "' on lines " + lines + "\n")
            }
            throw ParseException(sb.toString())
        }
    }

    return objects.map { objectWithLine -> objectWithLine.obj }
}

fun readProgramFile(fileName: String): List<ProgramEntry> {
    val fileLines = mutableListOf<String>()
    File(fileName).useLines { filelines -> fileLines.addAll(filelines) }

    val programData = mutableListOf<ProgramEntry>()
    fileLines.forEachIndexed { index, line ->
        if (!line.startsWith("#")) {
            val lineNumber = index + 1
            try {
                val entry = ProgramEntry.parse(line)
                programData.add(entry)
            } catch (e: Exception) {
                throw ParseException(e.message + " on line " + lineNumber)
            }
        }
    }

    return programData
}

fun readObservationFile(fileName: String): List<Observation> {
    val fileLines = mutableListOf<String>()
    File(fileName).useLines { filelines -> fileLines.addAll(filelines) }

    val observations = mutableListOf<Observation>()
    fileLines.forEachIndexed { index, line ->
        if (!line.startsWith("#")) {
            val lineNumber = index + 1
            try {
                val entry = Observation.parse(line)
                observations.add(entry)
            } catch (e: Exception) {
                throw ParseException(e.message + " on line " + lineNumber)
            }
        }
    }

    return observations
}


fun normalizeId(id: String): String {
    return id.toLowerCase().replace(" ", "")
}

fun findDuplicates(objs: List<ObjectWithLine>): Map<String, List<ObjectWithLine>> {
    return objs.groupBy({ normalizeId(it.obj.id) }, { it })
        .filterValues { list -> list.size > 1 }
}

fun findLikelyDuplicates(objs: List<ObjectWithLine>): Map<String, List<ObjectWithLine>> {
    fun hashDist(obj: Object): Int {
        val intRa = round(obj.ra * 60).toInt()
        val intDec = round(obj.dec * 60).toInt()
        return intRa * 1000000 + intDec
    }

    return objs.groupBy({ hashDist(it.obj).toString() }, { it })
        .filterValues { list -> list.size > 1 }
}

data class JoinedObject(
    val obj: Object,
    val programs: List<ProgramEntry>,
    val observations: List<Observation>
)

fun joinData(objs: List<Object>, programs: List<ProgramEntry>, observations: List<Observation>): List<JoinedObject> {

    // check for items in programs that don't have corresponding objects
    val expectedItems = programs.map { p -> p.itemId }.toSet()
    val knownObjects = objs.map { o -> o.id }.toSet()
    val missingObjects = expectedItems.filter { e -> !knownObjects.contains(e) }
    if (missingObjects.isNotEmpty()) {
        throw ParseException(
            "Found " + missingObjects.size +
                    " objects in observing lists that had no object data. Item ids = \n" +
                    missingObjects.joinToString("\n")
        )
    }
    // convert ProgramEntry to a map based on the object ids.
    val programById = programs.groupBy(keySelector = { p -> p.itemId })

    // check for items in observations that don't have objects
    val expectedItemsFromObservations = observations.map { p -> p.itemId }.toSet()
    val missingObjectsFromObservations = expectedItemsFromObservations.filter { e -> !knownObjects.contains(e) }
    if (missingObjectsFromObservations.isNotEmpty()) {
        throw ParseException(
            "Found " + missingObjectsFromObservations.size +
                    " objects in observation data that had no object data. Item ids = \n" +
                    missingObjectsFromObservations.joinToString("\n")
        )
    }
    // convert ProgramEntry to a map based on the object ids.
    val observationById = observations.groupBy(keySelector = { p -> p.itemId })

    return objs.map { o ->
        JoinedObject(
            o,
            programById.getOrDefault(o.id, emptyList()),
            observationById.getOrDefault(o.id, emptyList())
        )
    }
}

fun main(args: Array<String>) {
    try {
        //val objects = readObjectFile("/Users/jonathan/tmp/objects.tsv", false)
        val objects = readObjectFile("/Users/jonathan/tmp/objs2.txt", false)
        val programData = readProgramFile("/Users/jonathan/tmp/programs.txt")
        val observations = readObservationFile("/Users/jonathan/tmp/observations.txt")
        val joinedObjects = joinData(objects, programData, observations)

        //val filter = ObjectFilter(objectTypesIn = listOf(ObjectType.OPEN_CLUSTER))
        //val filter = ObjectFilter(conIn = listOf(Constellation.AND, Constellation.LYR))
        //val filter = ObjectFilter(nameIs="M 45")
        //val filter = ObjectFilter(nameLike="M 10")
        //val filter = ObjectFilter(decGreaterThan = 80.0)
        //val filter = ObjectFilter(decLessThan = -30.0)
        //val filter = ObjectFilter(raInRange = RaRange(20.2, 20.5))
        //val filter = ObjectFilter(raInRange = RaRange(23.50, 0.50))
        //val filter = ObjectFilter(sizeGreaterThan = 2.0 * 60 )
        //val filter = ObjectFilter(brighterThanMagnitude = 2.0)
        val filter = ObjectFilter(inProgram = "Wimmer's List")
        //val filter = ObjectFilter(seen = false)
        //val filter = ObjectFilter()
        val filteredObjs = joinedObjects.filter { o -> filter.filter(o) }

        println("found " + filteredObjs.size + " objects:")
        //writeObservingList(filteredObjs)
        writeProgramList(filteredObjs, "Wimmer's List")
//        for (fo in filteredObjs) {
//            println(fo.obj)
//        }
    } catch (e: Exception) {
        println(e)
    }
}
