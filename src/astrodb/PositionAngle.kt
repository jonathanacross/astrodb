package astrodb


data class NamedPositionAngle(val key: String, val pa: Int) {
    override fun toString(): String {
        return "$key=$pa"
    }
}

// Position angles are always in degrees.
sealed class PositionAngle {
    object None : PositionAngle() {
        override fun toString() = ""
    }

    data class Single(val pa: Int) : PositionAngle() {
        override fun toString(): String {
            return pa.toString()
        }
    }

    data class Named(val pas: List<NamedPositionAngle>) : PositionAngle() {
        override fun toString(): String {
            return pas.joinToString(", ") { x -> x.toString() }
        }
    }

    companion object {
        private fun extractInt(field: String): Int {
            return "[0-9]+".toRegex().find(field)!!.value.toInt()
        }

        private fun parseKv(kvField: String): NamedPositionAngle {
            val parts = kvField.split("=")
            if (parts.size != 2) {
                throw ParseException("couldn't read PositionAngle; expected = in key/value for '$kvField'")
            }
            val key = parts[0]
            val valueField = parts[1]
            return NamedPositionAngle(key, extractInt(valueField))
        }

        fun parse(sepField: String): PositionAngle {
            if (sepField.isBlank()) {
                return None
            }

            return try {
                val sepFields = sepField.split(", ")
                if (sepFields.size == 1) {
                    Single(extractInt(sepFields[0]))
                } else {
                    Named(sepFields.map { f -> parseKv(f) }.toList())
                }
            } catch (e: NumberFormatException) {
                throw ParseException("Couldn't parse separation '$sepField'")
            }
        }
    }
}