package astrodb

data class Observation(val date: String, val itemId: String) {
    companion object {
        fun parse(line: String): Observation {
            val fields = line.split("\t")
            val date = fields[0]
            val itemId = fields[1]
            return Observation(date, itemId)
        }
    }
}
