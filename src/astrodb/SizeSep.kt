package astrodb


enum class SizeUnits(private val toSec: Double, val defaultNotation: String) {
    DEGREES(3600.0, "°"),
    ARC_MINUTES(60.0, "'"),
    ARC_SECONDS(1.0, "\"");

    fun toSeconds(): Double = toSec
    fun fromSeconds(): Double = 1.0 / toSec

    companion object {
        fun parse(text: String, default: SizeUnits): SizeUnits {
            val tLower = text.toLowerCase().trim()
            if (tLower.endsWith("\"") || tLower.endsWith("''") || tLower.endsWith("s")) {
                return ARC_SECONDS
            } else if (tLower.endsWith("\'") || tLower.endsWith("m")) {
                return ARC_MINUTES
            } else if (tLower.endsWith("d") || tLower.endsWith("deg") || tLower.endsWith("°")) {
                return DEGREES
            } else {
                return default
            }
        }
    }
}

// dimensions for sizes are in arc minutes
sealed class Size {
    object None : Size() {
        override fun toString() = ""
    }

    data class Diameter(val size: Double) : Size() {
        override fun toString(): String {
            val units = getBestUnits(size)
            val amount = size * SizeUnits.ARC_MINUTES.toSeconds() * units.fromSeconds()
            return formatNumber(amount) + units.defaultNotation
        }
    }

    data class MajorMinor(val major: Double, val minor: Double) : Size() {
        override fun toString(): String {
            val units = getBestUnits(Math.sqrt(major * minor))
            val scale = SizeUnits.ARC_MINUTES.toSeconds() * units.fromSeconds()
            val majorAmt = major * scale
            val minorAmt = minor * scale
            return formatNumber(majorAmt) + units.defaultNotation +
                    " x " + formatNumber(minorAmt) + units.defaultNotation
        }
    }

    fun getBestUnits(sizeArcMin: Double): SizeUnits {
        return when {
            sizeArcMin >= 2 * 60 -> SizeUnits.DEGREES
            sizeArcMin < 1 -> SizeUnits.ARC_SECONDS
            else -> SizeUnits.ARC_MINUTES
        }
    }

    companion object {
        fun parse(sizeField: String): Size {
            if (sizeField.isBlank()) {
                return None
            }

            val givenUnits = SizeUnits.parse(sizeField, SizeUnits.ARC_MINUTES)
            val scale: Double = givenUnits.toSeconds() * SizeUnits.ARC_MINUTES.fromSeconds()
            val sizes = "[0-9.]+".toRegex().findAll(sizeField).map { it.value.toDouble() * scale }.toList()
            if (sizes.size == 1) {
                return Diameter(sizes[0])
            } else if (sizes.size == 2) {
                return MajorMinor(sizes[0], sizes[1])
            } else {
                throw ParseException("expected 1 or 2 values for size '" + sizeField + "'")
            }
        }
    }
}

data class NamedSeparation(val key: String, val sep: Double) {
    override fun toString(): String {
        return key + "=" + formatNumber(sep)
    }
}

// dimensions for separations are in arc seconds
sealed class Separation {
    object None : Separation() {
        override fun toString() = ""
    }
    data class Single(val sep: Double) : Separation() {
        override fun toString(): String {
            return formatNumber(sep)
        }
    }
    data class Named(val seps: List<NamedSeparation>) : Separation() {
        override fun toString(): String {
            return seps.map { x -> x.toString() }.joinToString(", ")
        }
    }

    companion object {
        private fun extractDouble(field: String): Double {
            return "[0-9.]+".toRegex().find(field)!!.value.toDouble()
        }

        private fun parseKv(kvField: String, scale: Double): NamedSeparation {
            val parts = kvField.split("=")
            if (parts.size != 2) {
                throw ParseException("couldn't read Separation; expected = in key/value for '" + kvField + "'")
            }
            val key = parts[0]
            val valueField = parts[1]
            return NamedSeparation(key, extractDouble(valueField) * scale)
        }

        fun parse(sepField: String): Separation {
            if (sepField.isBlank()) {
                return None
            }

            try {
                val givenUnits = SizeUnits.parse(sepField, SizeUnits.ARC_SECONDS)
                val scale: Double = givenUnits.toSeconds()
                val sepFields = sepField.split(", ")
                if (sepFields.size == 1) {
                    return Single(extractDouble(sepFields[0]) * scale)
                } else {
                    return Named(sepFields.map { f -> parseKv(f, scale) }.toList())
                }
            } catch (e: NumberFormatException) {
                throw ParseException("Couldn't parse separation '" + sepField + "'")
            }
        }
    }
}
