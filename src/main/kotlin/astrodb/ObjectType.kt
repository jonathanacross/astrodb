package astrodb

enum class ObjectType(val canonicalName: String, private val shortName: String, val otherNames: List<String>, val fixedLocation: Boolean) {
    ASTERISM("Asterism", "Ast", listOf("asterism", "ast"), true),
    CARBON_STAR("Carbon Star", "Carbon", listOf("carbon star", "carbon"), true),
    DOUBLE_STAR("Double Star", "Double", listOf("double star", "ds", "dbl", "double"), true),
    GALAXY("Galaxy", "Gal", listOf("galaxy", "gal", "gx", "g"), true),
    GLOBULAR_CLUSTER("Globular Cluster", "GCl", listOf("globular cl.", "gcl", "gc", "globular", "globular cluster"), true),
    OPEN_CLUSTER("Open Cluster", "OCl", listOf("opcl", "open cl.", "ocl", "oc", "open cluster"), true),
    DARK_NEBULA("Dark Nebula", "DN", listOf("dark nebula", "dn"), true),
    EMISSION_NEBULA("Emission Nebula", "EN", listOf("emission nebula", "en"), true),
    PLANETARY_NEBULA("Planetary Nebula", "PN", listOf("planetary neb.", "planetary", "pln", "pn"), true),
    REFLECTION_NEBULA("Reflection Nebula", "RN", listOf("reflection nebula", "rn"), true),
    SUPERNOVA_REMNANT("Supernova Remnant", "SNR", listOf("supernova remnant", "snr", "sr"), true),
    QUASAR("Quasar", "Q", listOf("quasar", "q"), true),
    STAR_CLOUD("Star Cloud", "Star Cloud", listOf("star cloud", "*'s"), true),
    VARIABLE_STAR("Variable Star", "Variable", listOf("variable star", "variable"), true),
    // Object types with no fixed locations
    ASTERIOD("Asteroid", "Asteroid", listOf("asteroid"), false),
    COMET("Comet", "Comet", listOf("comet"), false),
    MOON("Moon", "Moon", listOf("moon", "lunar feature"), false),
    PLANET("Planet", "Planet", listOf("planet", "planetary feature"), false),
    SUN("Sun", "Sun", listOf("sun", "solar feature"), false);

    override fun toString(): String {
        return shortName
    }

    companion object {
        private val map: MutableMap<String, ObjectType> = HashMap()

        init {
            for (ot in values()) {
                for (name in ot.otherNames) {
                    map[name] = ot
                }
            }
        }

        fun parse(typesField: String): List<ObjectType> {
            val fields = typesField.split(",", "+")
            val types = mutableListOf<ObjectType>()
            for (f in fields) {
                val ot = map[f.toLowerCase()]
                if (ot != null) {
                    types.add(ot)
                } else {
                    throw ParseException("couldn't parse object type(s) '$typesField'")
                }
            }
            return types
        }
    }


}


