package astrodb

// TODO: For now, all items are basically strings.  In the future,
// make more concrete types and join with the astrodb data to
// do better checking.
data class Observation(
    val id: String,
    val date: String,
    val location: String,
    val scope: String,
    val seeing: String,
    val transparency: String,
    val objectIds: List<String>,
    val time: String,
    val eyepiece: String,
    val magnification: String,
    val lunarPhase: String,
    val notes: String
) {
    companion object {
        fun parseObjIds(idsField: String): List<String> {
            return idsField.split("|").toList()
        }

        fun parse(line: String): Observation {
            val fields = line.split("\t")
            val id = fields[0]
            val date = fields[1]
            val location = fields[2]
            val scope = fields[3]
            val seeing = fields[4]
            val transparency = fields[5]
            val objectIds = parseObjIds(fields[6])
            val time = fields[7]
            val eyepiece = fields[8]
            val magnification = fields[9]
            val lunarPhase = fields[10]
            val notes = fields[11]
            return Observation(
                id, date, location, scope, seeing,
                transparency, objectIds, time,
                eyepiece, magnification, lunarPhase, notes
            )
        }
    }
}