package astrodb

fun writeObservingList(objects: List<JoinedObject>) {
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

    for (o in objects) {
        val sizesep = if (o.obj.separations.toString().isNotEmpty())
            o.obj.separations.toString()
        else
            o.obj.size.toString()

        val line =
            o.obj.id + "\t" +
                    o.obj.objectTypes.joinToString("+") + "\t" +
                    o.obj.constellation + "\t" +
                    formatRa(o.obj.ra) + "\t" +
                    formatDec(o.obj.dec) + "\t" +
                    o.obj.magnitude + "\t" +
                    sizesep + "\t" +
                    o.obj.positionAngles + "\t" +
                    String.format("%.1f", o.obj.surfaceBrightness) + "\t" +
                    o.obj.names.joinToString("/") + ". " + o.obj.notes

        println(line)
    }
}

fun writeProgramList(objects: List<JoinedObject>, programName: String) {
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

    for (o in objects) {
        val dates = o.observations.joinToString(", ") { obs -> obs.date }
        val matchingProgram =
            o.programs.filter { p -> p.programName == programName }
        val itemNumber = if (matchingProgram.isNotEmpty()) matchingProgram[0].itemNumber else 0

        val line =
            itemNumber.toString() + "\t" +
                    o.obj.id + "\t" +
                    dates + "\t" +
                    o.obj.constellation + "\t" +
                    formatRa(o.obj.ra) + "\t" +
                    formatDec(o.obj.dec) + "\t" +
                    o.obj.names.joinToString("/")

        println(line)
    }
}
