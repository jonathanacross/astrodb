package astrodb

data class ObjectWithRaSort(val obj: Object, val raSort: Double) {
    companion object {
        fun create(obj: Object, raRange: RaRange): ObjectWithRaSort {
            val raSort =
                if (raRange.min <= raRange.max) {
                    obj.ra
                } else {
                    if (obj.ra < raRange.min) obj.ra + 24 else obj.ra
                }
            return ObjectWithRaSort(obj, raSort)
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
        .sortedWith(compareBy({ it.obj.constellation }, { it.raSort }))

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
    for (o in objects) {
        println(o.obj)
    }
}