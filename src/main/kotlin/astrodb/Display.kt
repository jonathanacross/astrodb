package astrodb

data class ObjectWithRaSort(val obj: Object, val conSort: Double, val raSort: Double) {

    companion object {
        fun create(obj: Object, raRange: RaRange): ObjectWithRaSort {
            val conSort = getRaSortValue(obj.constellation.ra, raRange)
            val raSort = getRaSortValue(obj.ra, raRange)
            return ObjectWithRaSort(obj, conSort, raSort)
        }

        private fun getRaSortValue(ra: Double, raRange: RaRange): Double {
            return if (raRange.min <= raRange.max) {
                ra
            } else {
                if (ra < raRange.min) ra + 24 else ra
            }
        }
    }
}

fun writeObservingList(objects: List<JoinedObject>, givenRaRange: RaRange?) {
    val raRange = givenRaRange ?: RaRange(0.0, 24.0)
    val header =
        "#Id" + "\t" +
                "Type" + "\t" +
                "Con" + "\t" +
                "RA" + "\t" +
                "Dec" + "\t" +
                "Mag" + "\t" +
                "Size/Sep" + "\t" +
                "PA" + "\t" +
                "SB" + "\t" +
                "Notes"
    println(header)

    val objectsWithRaSort = objects.map { o -> ObjectWithRaSort.create(o.obj, raRange) }
        .sortedWith(compareBy({ it.conSort }, { it.raSort }))

    for (o in objectsWithRaSort) {
        val sizesep =
            if (o.obj.separations.toString().isNotEmpty()) o.obj.separations.toString()
            else o.obj.size.toString()

        val sb =
            if (o.obj.surfaceBrightness == null) ""
            else String.format("%.1f", o.obj.surfaceBrightness)

        val line =
            o.obj.id + "\t" +
                    o.obj.objectTypes.joinToString("+") + "\t" +
                    o.obj.constellation + "\t" +
                    formatRa(o.obj.ra) + "\t" +
                    formatDec(o.obj.dec) + "\t" +
                    o.obj.magnitude + "\t" +
                    sizesep + "\t" +
                    o.obj.positionAngles + "\t" +
                    sb + "\t" +
                    o.obj.names.joinToString("/") + ". " + o.obj.notes

        println(line)
    }
}

data class ObservedProgramObject(val itemNumber: ItemNumber, val dates: String, val obj: Object)

fun writeProgramList(objects: List<JoinedObject>, programName: String?) {
    if (programName == null) {
        throw ParseException("program name not specified")
    }
    // critical columns
    // id, names, con, ra dec program number (for a program), dates seen
    val header =
        "#ItemNumber" + "\t" +
                "Id" + "\t" +
                "Dates" + "\t" +
                "Con" + "\t" +
                "RA" + "\t" +
                "Dec" + "\t" +
                "Names"
    println(header)

    val observedObjs = objects.map { o ->
        val dates = o.observations.joinToString(", ") { obs -> obs.date }
        val matchingProgram =
            o.programs.filter { p -> p.programName == programName }
        val itemNumber = if (matchingProgram.isNotEmpty()) matchingProgram[0].itemNumber else ItemNumber(0, "")
        ObservedProgramObject(itemNumber, dates, o.obj)
    }

    val sortedObjs = observedObjs.sortedWith(compareBy({ it.itemNumber.itemNumber }, { it.itemNumber.subNumber }))

    for (o in sortedObjs) {
        val line =
            o.itemNumber.toString() + "\t" +
                    o.obj.id + "\t" +
                    o.dates + "\t" +
                    o.obj.constellation + "\t" +
                    formatRa(o.obj.ra) + "\t" +
                    formatDec(o.obj.dec) + "\t" +
                    o.obj.names.joinToString("/")

        println(line)
    }
}

fun writeObjectList(objects: List<JoinedObject>) {
    val header =
        "#Id" + "\t" +
                "Names" + "\t" +
                "Type" + "\t" +
                "Con" + "\t" +
                "RA" + "\t" +
                "Dec" + "\t" +
                "Mag" + "\t" +
                "Size" + "\t" +
                "Sep" + "\t" +
                "PA" + "\t" +
                "Class" + "\t" +
                "Distance" + "\t" +
                "Notes"
    println(header)

    for (o in objects) {
        println(o.obj)
    }
}

fun writeMetaList(objects: List<JoinedObject>) {
    val header =
            "#Id" + "\t" +
                    "Names" + "\t" +
                    "Type" + "\t" +
                    "Con" + "\t" +
                    "RA" + "\t" +
                    "Dec" + "\t" +
                    "Dist" + "\t" +
                    "NumObs" + "\t" +
                    "NumPrograms" + "\t" +
                    "Dates" + "\t" +
                    "Programs"
    println(header)

    for (o in objects) {
        val line =
                o.obj.id + "\t" +
                        o.obj.names.joinToString("/") + "\t" +
                        o.obj.objectTypes.joinToString("+") + "\t" +
                        o.obj.constellation + "\t" +
                        formatRa(o.obj.ra) + "\t" +
                        formatDec(o.obj.dec) + "\t" +
                        o.obj.distance + "\t" +
                        o.observations.size + "\t" +
                        o.programs.size + "\t" +
                        o.observations.joinToString(", ") { obs -> obs.date } + "\t" +
                        o.programs.joinToString(", ") { obs -> obs.programName }

        println(line)
    }
}
