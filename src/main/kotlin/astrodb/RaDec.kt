package astrodb

import kotlin.math.abs
import kotlin.math.roundToInt

fun formatBase60(value: Double, radixNames: Triple<String, String, String>): String {
    val signStr = if (value < 0) "-" else ""
    val totalSeconds = (abs(value) * 3600).roundToInt()
    val seconds = totalSeconds % 60
    val totalMinutes = (totalSeconds - seconds) / 60
    val minutes = totalMinutes % 60
    val degrees = (totalMinutes - minutes) / 60

    val degreesStr = degrees.toString().padStart(2, '0')
    val minutesStr = minutes.toString().padStart(2, '0')
    val secondsStr = seconds.toString().padStart(2, '0')

    return signStr + degreesStr + radixNames.first + " " +
            minutesStr + radixNames.second + " " +
            secondsStr + radixNames.third
}

fun formatDec(dec: Double): String {
    return formatBase60(dec, Triple("°", "'", "\""))
}

fun formatRa(dec: Double): String {
    return formatBase60(dec, Triple("h", "m", "s"))
}

sealed class Ra {
    abstract fun asNumber(): Double?

    object None : Ra() {
        override fun toString() = ""
        override fun asNumber() = null
    }

    data class RaWithValue(val ra: Double) : Ra() {
        override fun toString() = formatRa(ra)
        override fun asNumber() = ra
    }

    companion object {
        fun parse(field: String): Ra {
            if (field.trim() == "") {
                return None
            }
            return RaWithValue(parseBase60(field))
        }
    }
}

sealed class Dec {
    abstract fun asNumber(): Double?

    object None : Dec() {
        override fun toString() = ""
        override fun asNumber() = null
    }

    data class DecWithValue(val dec: Double) : Dec() {
        override fun toString() = formatDec(dec)
        override fun asNumber() = dec
    }

    companion object {
        fun parse(field: String): Dec {
            if (field.trim() == "") {
                return None
            }
            return DecWithValue(parseBase60(field))
        }
    }
}
