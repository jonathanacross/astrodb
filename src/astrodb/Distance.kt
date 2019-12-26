package astrodb

sealed class Distance {
    object None : Distance() {
        override fun toString() = ""
    }

    data class DistWithValue(val distLightYears: Double) : Distance() {
        private fun formatNumber(d: Double): String {
            if (d == Math.floor(d))
                return String.format("%s", d.toInt())
            else
                return String.format("%.0f", d)
        }

        override fun toString(): String {
            if (distLightYears > 1000000) {
                return formatNumber(distLightYears / 1000000) + "mly"
            } else if (distLightYears > 1000) {
                return formatNumber(distLightYears / 1000) + "kly"
            } else {
                return formatNumber(distLightYears) + "ly"
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
            val scale: Double
            if (distLower.endsWith("mly")) {
                scale = 1000000.0
            } else if (distLower.endsWith("kly")) {
                scale = 1000.0
            } else if (distLower.endsWith("ly")) {
                scale = 1.0
            } else {
                throw ParseException("Couldn't parse distance entry '" + distField + "'; unknown units")
            }

            val amount = "[0-9.]+".toRegex().find(distField)
            if (amount != null) {
                return DistWithValue(amount.value.toDouble() * scale)
            } else {
                throw ParseException("Couldn't parse distance entry '" + distField + "'")
            }
        }
    }
}