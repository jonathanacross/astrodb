package astrodb

data class KeyValue(val key: String, val value: Double) {
    override fun toString(): String {
        return key + "=" + String.format("%.1f", value)
    }
}

sealed class Magnitude {
    abstract fun asNumber(): Double?

    object None : Magnitude() {
        override fun toString() = ""
        override fun asNumber(): Double? = null
    }

    data class MagValue(val mag: Double) : Magnitude() {
        override fun toString(): String {
            return String.format("%.1f", mag)
        }

        override fun asNumber(): Double? = mag
    }

    data class MagList(val magList: List<Double>) : Magnitude() {
        override fun toString(): String {
            return magList.joinToString(", ") { x -> String.format("%.1f", x) }
        }

        override fun asNumber(): Double? = magList.min()
    }

    data class MagRange(val min: Double, val max: Double) : Magnitude() {
        override fun toString(): String {
            return String.format("%.1f - %.1f", min, max)
        }

        override fun asNumber(): Double? = min
    }

    data class Named(val mags: List<KeyValue>) : Magnitude() {
        override fun toString(): String {
            return mags.joinToString(", ") { x -> x.toString() }
        }

        override fun asNumber(): Double? = mags.map { m -> m.value }.min()
    }

    companion object {
        private fun extractDouble(field: String): Double {
            return "[0-9.]+".toRegex().find(field)!!.value.toDouble()
        }

        private fun parseKv(kvField: String): KeyValue {
            val parts = kvField.split("=")
            if (parts.size != 2) {
                throw ParseException("couldn't read magnitude; expected = in key/value for '$kvField'")
            }
            val key = parts[0]
            val valueField = parts[1]
            return KeyValue(key, extractDouble(valueField))
        }

        fun parse(magField: String): Magnitude {
            try {
                if (magField.trim() == "?") {
                    return None
                }
                val fields = magField.split(", ")
                if (fields.size > 1) {
                    return if (fields.size == 2) {
                        // a list of two magnitudes, e.g., for double stars
                        val mags = fields.map { x -> x.trim().toDouble() }
                        MagList(mags)
                    } else {
                        // a list of 3 or more magnitudes, for multiple stars.
                        // Should be keyed with the name
                        Named(fields.map { f -> parseKv(f) }.toList())
                    }
                } else {
                    val lohi = "[0-9.]+".toRegex().findAll(magField).map { it.value }.toList()
                    return when {
                        lohi.isEmpty() -> {
                            None
                        }
                        lohi.size == 1 -> {
                            val magVal = magField.trim().toDouble()
                            MagValue(magVal)
                        }
                        lohi.size == 2 -> {
                            val lo = lohi[0].toDouble()
                            val hi = lohi[1].toDouble()
                            return if (lo == hi) {
                                MagValue(lo)
                            } else {
                                MagRange(lo, hi)
                            }
                        }
                        else -> throw ParseException("Couldn't parse magnitude entry '$magField'; too many fields for a range")
                    }
                }
            } catch (e: NumberFormatException) {
                throw ParseException("Couldn't parse magnitude entry '$magField'")
            }
        }
    }
}
