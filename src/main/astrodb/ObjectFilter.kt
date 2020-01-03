package astrodb

data class RaRange(val min: Double, val max: Double) {
    fun inRange(ra: Double): Boolean {
        return if (min <= max) {
            ra in min..max
        } else {
            // This happens when the range crosses over from 23.99 hours to 0.00 hours.
            // In this case, the inclusion is reversed.
            ra <= max || ra >= min
        }
    }
}

data class ObjectFilter(
    val nameIs: String? = null,
    val nameLike: String? = null,
    val conIn: List<Constellation> = emptyList(),
    val objectTypesIn: List<ObjectType> = emptyList(),
    val raInRange: RaRange? = null,
    val decGreaterThan: Double? = null,
    val decLessThan: Double? = null,
    val brighterThanMagnitude: Double? = null,
    val sizeGreaterThan: Double? = null,
    val sizeLessThan: Double? = null,
    val inProgram: String? = null,
    val seen: Boolean? = null
) {
    fun getProgramName(): String? = inProgram
    fun getRaRange(): RaRange? = raInRange

    private fun listContainsStringMatch(list: List<String>, str: String): Boolean {
        return list.any { li -> li.contains(str) }
    }

    private fun listContainsProgram(list: List<ProgramEntry>, str: String): Boolean {
        return list.any { li -> li.programName == str }
    }

    fun filter(obj: JoinedObject): Boolean {
        if (nameIs != null && !obj.obj.names.contains(nameIs)) {
            return false
        }
        if (nameLike != null && !listContainsStringMatch(obj.obj.names, nameLike)) {
            return false
        }
        if (conIn.isNotEmpty() && !conIn.contains(obj.obj.constellation)) {
            return false
        }
        if (objectTypesIn.isNotEmpty() && objectTypesIn.intersect(obj.obj.objectTypes).isEmpty()) {
            return false
        }
        if (raInRange != null && !raInRange.inRange(obj.obj.ra)) {
            return false
        }
        if (decGreaterThan != null && obj.obj.dec < decGreaterThan) {
            return false
        }
        if (decLessThan != null && obj.obj.dec > decLessThan) {
            return false
        }
        if (brighterThanMagnitude != null) {
            val objMag = obj.obj.magnitude.asNumber()
            if (objMag != null && objMag <= brighterThanMagnitude) {
                return false
            }
        }
        if (sizeGreaterThan != null && obj.obj.size.asNumber() < sizeGreaterThan) {
            return false
        }
        if (sizeLessThan != null && obj.obj.size.asNumber() > sizeLessThan) {
            return false
        }
        if (inProgram != null && !listContainsProgram(obj.programs, inProgram)) {
            return false
        }
        if (seen != null && ((obj.observations.isEmpty()) == seen)) {
            return false
        }

        return true
    }
}