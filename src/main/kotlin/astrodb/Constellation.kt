package astrodb

enum class Constellation(private val abbrev: String, val fullName: String, val ra: Double, val dec: Double) {
    // RA is the average of the most eastward and most westward RA.
    // Dec is the average of the most northern and most southern declination.
    // Adapted from https://en.wikipedia.org/wiki/IAU_designated_constellations_by_area
    AND("And", "Andromeda", 0.8, 37.4),
    ANT("Ant", "Antlia", 10.3, -32.5),
    APS("Aps", "Apus", 16.1, -75.3),
    AQL("Aql", "Aquila", 19.7, 3.4),
    AQR("Aqr", "Aquarius", 22.3, -10.8),
    ARA("Ara", "Ara", 17.4, -56.6),
    ARI("Ari", "Aries", 2.6, 20.8),
    AUR("Aur", "Auriga", 6.1, 42.0),
    BOO("Boo", "Bootes", 14.7, 31.2),
    CAE("Cae", "Caelum", 4.7, -37.9),
    CAM("Cam", "Camelopardalis", 8.9, 69.4),
    CAP("Cap", "Capricornus", 21.0, -18.0),
    CAR("Car", "Carina", 8.7, -63.2),
    CAS("Cas", "Cassiopeia", 1.3, 62.2),
    CEN("Cen", "Centaurus", 13.1, -47.3),
    CEP("Cep", "Cepheus", 2.5, 71.0),
    CET("Cet", "Cetus", 1.7, -7.2),
    CHA("Cha", "Chamaeleon", 10.7, -79.2),
    CIR("Cir", "Circinus", 14.6, -63.0),
    CMA("CMa", "Canis Major", 6.8, -22.1),
    CMI("CMi", "Canis Minor", 7.7, 6.4),
    CNC("Cnc", "Cancer", 8.6, 19.8),
    COL("Col", "Columba", 5.9, -35.1),
    COM("Com", "Coma Berenices", 12.8, 23.3),
    CRA("CrA", "Corona Australis", 18.6, -41.1),
    CRB("CrB", "Corona Borealis", 15.8, 32.6),
    CRT("Crt", "Crater", 11.4, -15.9),
    CRU("Cru", "Crux", 12.4, -60.2),
    CRV("Crv", "Corvus", 12.4, -18.4),
    CVN("CVn", "Canes Venatici", 13.1, 40.1),
    CYG("Cyg", "Cygnus", 20.6, 44.5),
    DEL("Del", "Delphinus", 20.7, 11.7),
    DOR("Dor", "Dorado", 5.2, -59.4),
    DRA("Dra", "Draco", 15.1, 67.0),
    EQU("Equ", "Equuleus", 21.2, 7.8),
    ERI("Eri", "Eridanus", 3.3, -28.8),
    FOR("For", "Fornax", 2.8, -31.6),
    GEM("Gem", "Gemini", 7.1, 22.6),
    GRU("Gru", "Grus", 22.5, -46.4),
    HER("Her", "Hercules", 17.4, 27.5),
    HOR("Hor", "Horologium", 3.3, -53.3),
    HYA("Hya", "Hydra", 11.6, -14.5),
    HYI("Hyi", "Hydrus", 2.3, -70.0),
    IND("Ind", "Indus", 22.0, -59.7),
    LAC("Lac", "Lacerta", 22.5, 46.0),
    LEO("Leo", "Leo", 10.7, 13.1),
    LEP("Lep", "Lepus", 5.6, -19.0),
    LIB("Lib", "Libra", 15.2, -15.2),
    LMI("LMi", "Leo Minor", 10.2, 32.1),
    LUP("Lup", "Lupus", 15.2, -42.7),
    LYN("Lyn", "Lynx", 8.0, 47.5),
    LYR("Lyr", "Lyra", 18.9, 36.7),
    MEN("Men", "Mensa", 5.4, -77.5),
    MIC("Mic", "Microscopium", 21.0, -36.3),
    MON("Mon", "Monoceros", 7.1, 0.3),
    MUS("Mus", "Musca", 12.6, -70.2),
    NOR("Nor", "Norma", 15.9, -51.4),
    OCT("Oct", "Octans", 23.0, -82.2),
    OPH("Oph", "Ophiuchus", 17.4, -7.9),
    ORI("Ori", "Orion", 5.6, 5.9),
    PAV("Pav", "Pavo", 19.6, -65.8),
    PEG("Peg", "Pegasus", 22.7, 19.5),
    PER("Per", "Perseus", 3.2, 45.0),
    PHE("Phe", "Phoenix", 0.9, -48.6),
    PIC("Pic", "Pictor", 5.7, -53.5),
    PSA("PsA", "Piscis Austrinus", 22.3, -30.6),
    PSC("Psc", "Pisces", 0.5, 13.7),
    PUP("Pup", "Puppis", 7.3, -31.2),
    PYX("Pyx", "Pyxis", 9.0, -27.4),
    RET("Ret", "Reticulum", 3.9, -60.0),
    SCL("Scl", "Sculptor", 0.4, -32.1),
    SCO("Sco", "Scorpius", 16.9, -27.0),
    SCT("Sct", "Scutum", 18.7, -9.9),
    SER("Ser", "Serpens", 17.0, 6.1),
    SEX("Sex", "Sextans", 10.3, -2.6),
    SGE("Sge", "Sagitta", 19.7, 18.9),
    SGR("Sgr", "Sagittarius", 19.1, -28.5),
    TAU("Tau", "Taurus", 4.7, 14.9),
    TEL("Tel", "Telescopium", 19.3, -51.0),
    TRA("TrA", "Triangulum Australe", 16.1, -65.4),
    TRI("Tri", "Triangulum", 2.2, 31.5),
    TUC("Tuc", "Tucana", 23.8, -65.8),
    UMA("UMa", "Ursa Major", 11.3, 50.7),
    UMI("UMi", "Ursa Minor", 15.0, 77.7),
    VEL("Vel", "Vela", 9.6, -47.2),
    VIR("Vir", "Virgo", 13.4, -4.2),
    VOL("Vol", "Volans", 7.8, -69.8),
    VUL("Vul", "Vulpecula", 20.2, 24.4);

    override fun toString(): String {
        return abbrev
    }

    companion object {
        fun parse(conField: String): Constellation {
            try {
                return valueOf(conField.toUpperCase())
            } catch (e: Exception) {
                throw ParseException("unknown constellation '$conField'")
            }
        }
    }
}
