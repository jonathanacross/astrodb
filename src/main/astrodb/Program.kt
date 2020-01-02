package astrodb

data class ProgramEntry(val programName: String, val itemNumber: String, val itemId: String) {
    companion object {
        fun parse(line: String): ProgramEntry {
            val fields = line.split("\t")
            val programName = fields[0]
            val itemNumber = fields[1]
            val itemId = fields[2]
            return ProgramEntry(programName, itemNumber, itemId)
        }
    }
}

