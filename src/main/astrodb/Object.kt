package astrodb

import java.lang.Math.PI
import kotlin.math.abs
import kotlin.math.log10
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
    val size: Size,
    val separations: Separation,
    val positionAngles: PositionAngle,
    val objectClass: String,
    val distance: Distance,
    val notes: String
) {
    val surfaceBrightness: Double? = computeSurfaceBrightness()

    private fun computeSurfaceBrightness(): Double? {

        fun ellipseArea(d1: Double, d2: Double) = (PI / 4.0) * d1 * d2

        if (magnitude is Magnitude.MagValue) {
            return when (size) {
                is Size.Diameter -> magnitude.mag + 2.512 * log10(ellipseArea(size.size, size.size))
                is Size.MajorMinor -> magnitude.mag + 2.512 * log10(ellipseArea(size.major, size.minor))
                is Size.None -> null
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
                size + "\t" +
                separations + "\t" +
                positionAngles + "\t" +
                objectClass + "\t" +
                distance + "\t" +
                notes
    }

    companion object {
        fun parse(line: String): Object {
            val fields = line.split("\t")
            val id = fields[0]
            val names = parseNames(fields[1])
            val types = ObjectType.parse(fields[2])
            val con = Constellation.parse(fields[3])
            val ra = parseBase60(fields[4])
            val dec = parseBase60(fields[5])
            val mag = Magnitude.parse(fields[6])
            val size = Size.parse(fields[7])
            val seps = Separation.parse(fields[8])
            val pas = PositionAngle.parse(fields[9])
            val objectClass = fields[10]
            val distance = Distance.parse(fields[11])
            val notes = fields[12]

            return Object(id, names, types, con, ra, dec, mag, size, seps, pas, objectClass, distance, notes)
        }
    }
}