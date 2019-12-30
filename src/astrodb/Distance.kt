package astrodb

sealed class Distance {
    object None : Distance() {
        override fun toString() = ""
    }

    data class DistWithValue(val distLightYears: Double) : Distance() {
        override fun toString(): String {
            return when {
                distLightYears > 1000000 -> {
                    formatNumber(distLightYears / 1000000) + "mly"
                }
                distLightYears > 1000 -> {
                    formatNumber(distLightYears / 1000) + "kly"
                }
                else -> {
                    formatNumber(distLightYears) + "ly"
                }
            }
        }
    }

    companion object {
        fun parse(distField: String): Distance {
            if (distField.isBlank()) {
                return None
            }
            // try to determine units
            val distLower = distField.toLowerCase()
            val scale: Double =
                when {
                    distLower.endsWith("mly") -> 1000000.0
                    distLower.endsWith("kly") -> 1000.0
                    distLower.endsWith("ly") -> 1.0
                    else -> {
                        throw ParseException("Couldn't parse distance entry '$distField'; unknown units")
                    }
                }

            val amount = "[0-9.]+".toRegex().find(distField)
            if (amount != null) {
                return DistWithValue(amount.value.toDouble() * scale)
            } else {
                throw ParseException("Couldn't parse distance entry '$distField'")
            }
        }
    }
}