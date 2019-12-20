package astrodb

import java.lang.Math.PI

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
            }
        }
        return null
    }
}
