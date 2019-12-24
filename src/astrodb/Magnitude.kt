package astrodb

sealed class Magnitude {
    object None : Magnitude() {
        override fun toString() = ""
    }
    data class MagValue(val mag: Double) : Magnitude() {
        override fun toString(): String {
            return String.format("%.1f", mag)
        }
    }
    data class MagList(val magList: List<Double>) : Magnitude() {
        override fun toString(): String {
            return magList.map{x -> String.format("%.1f", x)}.joinToString(", ")
        }
    }
    data class MagRange(val min: Double, val max: Double) : Magnitude() {
        override fun toString(): String {
            return String.format("%.1f - %.1f", min, max)
        }
    }

    companion object {
        fun parse(magField: String): Magnitude {
            try {
                if (magField.trim().equals("?")) {
                    return None
                }
                val fields = magField.split(",")
                if (fields.size > 1) {
                    val mags = fields.map { x -> x.trim().toDouble() }
                    return MagList(mags)
                } else {
                    val lohi = "[0-9.]+".toRegex().findAll(magField).map{ it.value }.toList()
                    return when {
                        lohi.size == 0 -> {
                            None
                        }
                        lohi.size == 1 -> {
                            val magVal = magField.trim().toDouble()
                            MagValue(magVal)
                        }
                        lohi.size == 2 -> {
                            val lo = lohi[0].toDouble()
                            val hi = lohi[0].toDouble()
                            MagRange(lo, hi)
                        }
                        else -> throw ParseException("Couldn't parse magnitude entry '" + magField + "'; too many fields for a range")
                    }
                }
            } catch (e: NumberFormatException) {
                throw ParseException("Couldn't parse magnitude entry '" + magField + "'")
            }
        }
    }
}
