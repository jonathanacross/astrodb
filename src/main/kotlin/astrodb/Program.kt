package astrodb

// handles item numbers like 64, 65a, 65b for easy sorting.
data class ItemNumber(val itemNumber: Int, val subNumber: String) {
    override fun toString(): String = itemNumber.toString() + subNumber

    companion object {
        fun parse(field: String): ItemNumber {
            val numberMatcher = Regex("(\\d+)(.*)")
            val matches = numberMatcher.matchEntire(field)
            if (matches == null) {
                throw ParseException("expected item number to begin with a number")
            } else {
                val number = matches.groupValues[1].toInt()
                val rest = matches.groupValues[2]
                return ItemNumber(number, rest)
            }
        }
    }
}

data class ProgramEntry(val programName: String,
                        val itemNumber: ItemNumber,
                        val itemId: String,
                        val observationId: String) {
    companion object {
        fun parse(line: String): ProgramEntry {
            val fields = line.split("\t")
            val programName = fields[0]
            val itemNumber = ItemNumber.parse(fields[1])
            val itemId = fields[2]
            val observationId = fields[3]
            return ProgramEntry(programName, itemNumber, itemId, observationId)
        }
    }
}

