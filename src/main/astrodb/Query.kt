package astrodb

fun tokenize(query: String): List<String> {
    var inQuote = false
    val tokens = mutableListOf<String>()
    val currentToken = StringBuilder()
    query.forEach { c ->
        if (c == '"') {
            inQuote = !inQuote
        } else {
            if (inQuote) {
                currentToken.append(c)
            } else {
                if (c.isWhitespace()) {
                    if (currentToken.isNotEmpty()) {
                        tokens.add(currentToken.toString())
                        currentToken.clear()
                    }
                } else {
                    currentToken.append(c)
                }
            }
        }
    }
    if (currentToken.isNotEmpty()) {
        tokens.add(currentToken.toString())
    }

    return tokens.toList()
}

fun parseCons(cons: String): List<Constellation> {
    return cons.split(",").map{ c -> Constellation.parse(c)}
}

fun parseQuery(query: String): ObjectFilter {
    val tokens = tokenize(query)

    var nameIs: String? = null
    var nameLike: String? = null
    var conIn: List<Constellation> = emptyList()
    var objectTypesIn: List<ObjectType> = emptyList()
    var raInRange: RaRange? = null
    var decGreaterThan: Double? = null
    var decLessThan: Double? = null
    var brighterThanMagnitude: Double? = null
    var sizeGreaterThan: Double? = null
    var sizeLessThan: Double? = null
    var inProgram: String? = null
    var seen: Boolean? = null

    var idx = 0
    while (idx < tokens.size) {
        when (Keyword.getKeyword(tokens[idx], tokens[idx + 1])) {
            Keyword.NAME_IS -> { nameIs = tokens[idx + 2]; idx += 3 }
            Keyword.NAME_LIKE -> { nameLike = tokens[idx + 2]; idx += 3 }
            Keyword.CON_IN -> { conIn = parseCons(tokens[idx + 2]); idx += 3}
            Keyword.TYPE_IN -> { objectTypesIn = ObjectType.parse(tokens[idx + 2]); idx += 3}
            Keyword.RA_RANGE -> { raInRange = RaRange(parseBase60(tokens[idx + 2]), parseBase60(tokens[idx + 4])); idx += 5 }
            Keyword.DEC_GREATER -> { decGreaterThan = parseBase60(tokens[idx + 2]); idx += 3 }
            Keyword.DEC_LESS -> { decLessThan = parseBase60(tokens[idx + 2]); idx += 3 }
            Keyword.MAGNITUDE_LESS -> { brighterThanMagnitude = tokens[idx + 2].toDouble(); idx += 3 }
            Keyword.SIZE_GREATER -> { sizeGreaterThan = Size.parse(tokens[idx + 2]).asNumber(); idx += 3 }
            Keyword.SIZE_LESS -> { sizeLessThan = Size.parse(tokens[idx + 2]).asNumber(); idx += 3 }
            Keyword.PROGRAM_IS -> { inProgram = tokens[idx + 2]; idx += 3 }
            Keyword.SEEN_IS -> { seen = tokens[idx + 2].toBoolean(); idx += 3}
            else -> throw ParseException("not implemented")
        }
    }

    return ObjectFilter(
        nameIs = nameIs,
        nameLike = nameLike,
        conIn = conIn,
        objectTypesIn = objectTypesIn,
        raInRange = raInRange,
        decGreaterThan = decGreaterThan,
        decLessThan = decLessThan,
        brighterThanMagnitude = brighterThanMagnitude,
        sizeGreaterThan = sizeGreaterThan,
        sizeLessThan = sizeLessThan,
        inProgram = inProgram,
        seen = seen
    )
}

enum class Keyword(val token1: String, val token2: String) {
    NAME_IS("name", "="),  // name like x, name = x
    NAME_LIKE("name", "like"),  // name like x, name = x
    CON_IN("con", "in"),   // con in and,per
    TYPE_IN("type", "in"),  // type in ast,double
    RA_RANGE("ra", "range"), // ra range 23:00 to 2:00
    DEC_LESS("dec", "<="),  // dec >= 30, dec <= 20
    DEC_GREATER("dec", ">="),  // dec >= 30, dec <= 20
    MAGNITUDE_LESS("mag", "<="),  // magnitude <= 12
    SIZE_LESS("size", "<="),  // size <= 1deg
    SIZE_GREATER("size", ">="),  // size >= 1deg
    PROGRAM_IS("program", "="), // program = "RASC.."
    SEEN_IS("seen", "="),  // seen = true, seen = false
    NOTSEEN_SINCE("notseen", "since");  // notseen since 2019-01-01

    companion object {
        fun getKeyword(token1: String, token2: String): Keyword {
            for (k in values()) {
                if (k.token1 == token1.toLowerCase() && k.token2 == token2.toLowerCase()) {
                    return k
                }
            }
            throw ParseException("unknown keyword from $token1, $token2")
        }
    }
}

