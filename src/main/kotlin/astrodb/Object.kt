package astrodb

import java.lang.Math.PI
import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.roundToInt

data class Object(
    val id: String,
    val names: List<String>,
    val objectTypes: List<ObjectType>,
    val constellation: Constellation,
    val ra: Ra,
    val dec: Dec,
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
                ra + "\t" +
                dec + "\t" +
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
            val ra = Ra.parse(fields[4])
            val dec = Dec.parse(fields[5])
            val mag = Magnitude.parse(fields[6])
            val size = Size.parse(fields[7])
            val seps = Separation.parse(fields[8])
            val pas = PositionAngle.parse(fields[9])
            val objectClass = fields[10]
            val distance = Distance.parse(fields[11])
            val notes = fields[12]

            for (type in types) {
                if (type.fixedLocation) {
                    if (ra.asNumber() == null || dec.asNumber() == null || con.asCon() == null) {
                        throw ParseException("object missing ra/dec/con but should have a fixed location");
                    }
                } else {
                    if (ra.asNumber() != null || dec.asNumber() != null || con.asCon() != null) {
                        throw ParseException("object has ra/dec/con but should not have a fixed location");
                    }
                }
            }

            return Object(id, names, types, con, ra, dec, mag, size, seps, pas, objectClass, distance, notes)
        }
    }
}
