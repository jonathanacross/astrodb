package astrodb

sealed class Magnitude {
    object None : Magnitude()
    data class MagValue(val mag: Double) : Magnitude()
    data class MagList(val magList: List<Double>) : Magnitude()
    data class MagRange(val min: Double, val max: Double) : Magnitude()

    companion object {
        fun parse(magField: String): Magnitude {
            try {
                val fields = magField.split(",")
                if (fields.size > 1) {
                    val mags = fields.map { x -> x.trim().toDouble() }
                    return Magnitude.MagList(mags)
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
