package astrodb

import java.lang.Math.PI
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

data class Object(
    val id: String,
    val names: List<String>,
    val objectTypes: List<ObjectType>,
    val constellation: Constellation,
    val ra: Double,
    val dec: Double,
    val magnitude: Magnitude,
    val size: Size
) {
    val surfaceBrightness: Double? = computeSurfaceBrightness()

    private fun computeSurfaceBrightness(): Double? {

        fun ellipseArea(d1: Double, d2: Double) = (PI / 4.0) * d1 * d2

        if (magnitude is Magnitude.MagValue) {
            when (size) {
                is Size.Diameter -> return magnitude.mag + 2.512 * Math.log10(ellipseArea(size.size, size.size))
                is Size.MajorMinor -> return magnitude.mag + 2.512 * Math.log10(ellipseArea(size.major, size.minor))
                is Size.None -> return null
            }
        }
        return null
    }

    override fun toString(): String {
        return id + "\t" +
                names.joinToString("/") + "\t" +
                objectTypes.joinToString("+") + "\t" +
                constellation + "\t" +
                formatRa(ra) + "\t" +
                formatDec(dec) + "\t" +
                magnitude + "\t" +
                size
    }
}
