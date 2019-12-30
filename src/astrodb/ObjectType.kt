package astrodb

enum class ObjectType(val canonicalName: String, private val shortName: String, val otherNames: List<String>) {
    ASTERISM("Asterism", "Ast", listOf("asterism", "ast")),
    CARBON_STAR("Carbon Star", "Carbon", listOf("carbon star", "carbon")),
    DOUBLE_STAR("Double Star", "Double", listOf("double star", "ds", "dbl", "double")),
    GALAXY("Galaxy", "Gal", listOf("galaxy", "gal", "gx")),
    GLOBULAR_CLUSTER("Globular Cluster", "GCl", listOf("globular cl.", "gcl", "gc", "globular", "globular cluster")),
    OPEN_CLUSTER("Open Cluster", "OCl", listOf("opcl", "open cl.", "ocl", "oc", "open cluster")),
    DARK_NEBULA("Dark Nebula", "DN", listOf("dark nebula", "dn")),
    EMISSION_NEBULA("Emission Nebula", "EN", listOf("emission nebula", "en")),
    PLANETARY_NEBULA("Planetary Nebula", "PN", listOf("planetary neb.", "planetary", "pln", "pn")),
    REFLECTION_NEBULA("Reflection Nebula", "RN", listOf("reflection nebula", "rn")),
    SUPERNOVA_REMNANT("Supernova Remnant", "SNR", listOf("supernova remnant", "snr", "sr")),

    STAR_CLOUD("Star Cloud", "Star Cloud", listOf("star cloud", "*'s")),
    VARIABLE_STAR("Variable Star", "Variable", listOf("variable star", "variable"));

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
            val fields = typesField.split("+")
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


