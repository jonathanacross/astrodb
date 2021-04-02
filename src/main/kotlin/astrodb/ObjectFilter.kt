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
    val conIn: List<Constellations> = emptyList(),
    val conNotIn: List<Constellations> = emptyList(),
    val objectTypesIn: List<ObjectType> = emptyList(),
    val objectTypesNotIn: List<ObjectType> = emptyList(),
    val raInRange: RaRange? = null,
    val decGreaterThan: Double? = null,
    val decLessThan: Double? = null,
    val brighterThanMagnitude: Double? = null,
    val sbBrighterThan: Double? = null,
    val sizeGreaterThan: Double? = null,
    val sizeLessThan: Double? = null,
    val programIs: String? = null,
    val programIn: List<String> = emptyList(),
    val programLike: String? = null,
    val checkedInProgram: Boolean? = null,
    val seen: Boolean? = null,
    val seenBefore: String? = null,
    val seenAfter: String? = null,
    val notSeenBefore: String? = null,
    val notSeenAfter: String? = null,
    val numProgramsGreaterThan: Int? = null
) {
    fun getProgramName(): String? = programIs
    fun getRaRange(): RaRange? = raInRange

    private fun listContainsStringMatch(list: List<String>, str: String): Boolean {
        return list.any { li -> li.contains(str) }
    }

    private fun listContainsProgram(list: List<ProgramEntry>, str: String): Boolean {
        return list.any { li -> li.programName == str }
    }

    private fun listContainsAnyProgram(list: List<ProgramEntry>, strs: List<String>): Boolean {
        return list.any { li -> strs.contains(li.programName) }
    }

    private fun listMatchesProgram(list: List<ProgramEntry>, str: String): Boolean {
        return list.any { li -> li.programName.contains(str) }
    }

    private fun programHasObservationFor(programEntries: List<ProgramEntry>,
                                         programName: String): Boolean {
        return programEntries.any { p -> p.programName == programName && p.observationId.isNotEmpty() }
    }

    private fun observedBefore(obs: List<Observation>, date: String): Boolean {
        // lexicographic comparison works because dates are in the format yyyy-mm-dd.
        return obs.any { o -> o.date < date }
    }

    private fun observedAfter(obs: List<Observation>, date: String): Boolean {
        // lexicographic comparison works because dates are in the format yyyy-mm-dd.
        return obs.any { o -> o.date > date }
    }

    private fun notObservedBefore(obs: List<Observation>, date: String): Boolean {
        // lexicographic comparison works because dates are in the format yyyy-mm-dd.
        return obs.all { o -> o.date >= date }
    }

    private fun notObservedAfter(obs: List<Observation>, date: String): Boolean {
        // lexicographic comparison works because dates are in the format yyyy-mm-dd.
        return obs.all { o -> o.date <= date }
    }

    fun filter(obj: JoinedObject): Boolean {
        if (nameIs != null && !obj.obj.names.contains(nameIs)) {
            return false
        }
        if (nameLike != null && !listContainsStringMatch(obj.obj.names, nameLike)) {
            return false
        }
        if (conIn.isNotEmpty()) {
            val con = obj.obj.constellation.asCon()
            if (con == null || !conIn.contains(con)) {
                return false
            }
        }
        if (conNotIn.isNotEmpty()) {
            val con = obj.obj.constellation.asCon()
            if (con == null || conNotIn.contains(con)) {
                return false
            }
        }
        if (objectTypesIn.isNotEmpty() && objectTypesIn.intersect(obj.obj.objectTypes).isEmpty()) {
            return false
        }
        if (objectTypesNotIn.isNotEmpty() && objectTypesNotIn.intersect(obj.obj.objectTypes).isNotEmpty()) {
            return false
        }
        if (raInRange != null) {
            val raNumber = obj.obj.ra.asNumber()
            if (raNumber == null || !raInRange.inRange(raNumber)) {
                return false
            }
        }
        if (decGreaterThan != null) {
            val decNumber = obj.obj.dec.asNumber()
            if (decNumber == null || decNumber < decGreaterThan) {
                return false
            }
        }
        if (decLessThan != null) {
            val decNumber = obj.obj.dec.asNumber()
            if (decNumber == null || decNumber > decLessThan) {
                return false
            }
        }
        if (brighterThanMagnitude != null) {
            val objMag = obj.obj.magnitude.asNumber()
            if (objMag != null && objMag > brighterThanMagnitude) {
                return false
            }
        }
        if (sbBrighterThan != null) {
            val objSb = obj.obj.surfaceBrightness
            if (objSb != null && objSb > sbBrighterThan) {
                return false
            }
        }
        if (sizeGreaterThan != null && obj.obj.size.asNumber() < sizeGreaterThan) {
            return false
        }
        if (sizeLessThan != null && obj.obj.size.asNumber() > sizeLessThan) {
            return false
        }
        if (programIs != null && !listContainsProgram(obj.programs, programIs)) {
            return false
        }
        if (programIn.isNotEmpty() && !listContainsAnyProgram(obj.programs, programIn)) {
            return false
        }
        if (programLike != null && !listMatchesProgram(obj.programs, programLike)) {
            return false
        }
        if (checkedInProgram != null &&
            programIs != null &&
            programHasObservationFor(obj.programs, programIs) != checkedInProgram) {
            return false
        }
        if (seen != null && ((obj.observations.isEmpty()) == seen)) {
            return false
        }
        if (seenBefore != null && !observedBefore(obj.observations, seenBefore)) {
            return false
        }
        if (seenAfter != null && !observedAfter(obj.observations, seenAfter)) {
            return false
        }
        if (notSeenBefore != null && !notObservedBefore(obj.observations, notSeenBefore)) {
            return false
        }
        if (notSeenAfter != null && !notObservedAfter(obj.observations, notSeenAfter)) {
            return false
        }
        if (numProgramsGreaterThan != null && obj.programs.size < numProgramsGreaterThan) {
            return false
        }

        return true
    }
}