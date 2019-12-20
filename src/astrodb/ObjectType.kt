package astrodb

enum class ObjectType(val canonicalName: String, val otherNames: List<String>) {
    ASTERISM("Asterism", listOf("asterism", "ast")),
    CARBON_STAR("Carbon Star", listOf("carbon star", "carbon")),
    DOUBLE_STAR("Double Star", listOf("double star", "ds", "dbl")),
    GALAXY("Galaxy", listOf("galaxy", "gal", "gx")),
    GLOBULAR_CLUSTER("Globular Cluster", listOf("globular cl.", "gcl", "gc")),
    OPEN_CLUSTER("Open Cluster", listOf("opcl", "open cl.", "ocl", "oc")),

    DARK_NEBULA("Dark Nebula", listOf("dark nebula", "dn")),
    EMISSION_NEBULA("Emission Nebula", listOf("emission nebula", "en")),
    PLANETARY_NEBULA("Planetary Nebula", listOf("planetary neb.", "planetary", "pln", "pn")),
    REFLECTION_NEBULA("Reflection Nebula", listOf("reflection nebula", "rn")),
    SUPERNOVA_REMNANT("Supernova Remnant", listOf("supernova remnant", "snr", "sr")),

    STAR_CLOUD("Star Cloud", listOf("star cloud", "*'s")),
    VARIABLE_STAR("Variable Star", listOf("variable star"));

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
            val fields = typesField.split("+")
            val types = mutableListOf<ObjectType>()
            for (f in fields) {
                val ot = map[f.toLowerCase()]
                if (ot != null) {
                    types.add(ot)
                } else {
                    throw ParseException("couldn't parse object type(s) '" + typesField + "'")
                }
            }
            return types
        }
    }


}


