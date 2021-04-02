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

fun parseCons(cons: String): List<Constellations> {
    return cons.split(",").map { c -> Constellations.parse(c) }
}

fun parseQuery(query: String): ObjectFilter {
    val tokens = tokenize(query)

    var nameIs: String? = null
    var nameLike: String? = null
    var conIn: List<Constellations> = emptyList()
    var conNotIn: List<Constellations> = emptyList()
    var objectTypesIn: List<ObjectType> = emptyList()
    var objectTypesNotIn: List<ObjectType> = emptyList()
    var raInRange: RaRange? = null
    var decGreaterThan: Double? = null
    var decLessThan: Double? = null
    var brighterThanMagnitude: Double? = null
    var sbBrighterThan: Double? = null
    var sizeGreaterThan: Double? = null
    var sizeLessThan: Double? = null
    var programIs: String? = null
    var programIn: List<String> = emptyList()
    var programLike: String? = null
    var checkedInProgram: Boolean? = null
    var seen: Boolean? = null
    var seenBefore: String? = null
    var seenAfter: String? = null
    var notSeenBefore: String? = null
    var notSeenAfter: String? = null
    var numProgramsGreaterThan: Int? = null

    var idx = 0
    while (idx < tokens.size) {
        when (Keyword.getKeyword(tokens[idx], tokens[idx + 1])) {
            Keyword.NAME_IS -> { nameIs = tokens[idx + 2]; idx += 3 }
            Keyword.NAME_LIKE -> { nameLike = tokens[idx + 2]; idx += 3 }
            Keyword.CON_IN -> { conIn = parseCons(tokens[idx + 2]); idx += 3}
            Keyword.CON_NOTIN -> { conNotIn = parseCons(tokens[idx + 2]); idx += 3}
            Keyword.TYPE_IN -> { objectTypesIn = ObjectType.parse(tokens[idx + 2]); idx += 3}
            Keyword.TYPE_NOTIN -> { objectTypesNotIn = ObjectType.parse(tokens[idx + 2]); idx += 3}
            Keyword.RA_RANGE -> { raInRange = RaRange(parseBase60(tokens[idx + 2]), parseBase60(tokens[idx + 4])); idx += 5 }
            Keyword.DEC_GREATER -> { decGreaterThan = parseBase60(tokens[idx + 2]); idx += 3 }
            Keyword.DEC_LESS -> { decLessThan = parseBase60(tokens[idx + 2]); idx += 3 }
            Keyword.MAGNITUDE_LESS -> { brighterThanMagnitude = tokens[idx + 2].toDouble(); idx += 3 }
            Keyword.SB_LESS -> { sbBrighterThan = tokens[idx + 2].toDouble(); idx += 3 }
            Keyword.SIZE_GREATER -> { sizeGreaterThan = Size.parse(tokens[idx + 2]).asNumber(); idx += 3 }
            Keyword.SIZE_LESS -> { sizeLessThan = Size.parse(tokens[idx + 2]).asNumber(); idx += 3 }
            Keyword.PROGRAM_IS -> { programIs = tokens[idx + 2]; idx += 3 }
            Keyword.PROGRAM_IN -> { programIn = tokens[idx + 2].split(","); idx += 3 }
            Keyword.PROGRAM_LIKE -> { programLike = tokens[idx + 2]; idx += 3 }
            Keyword.CHECKED_IN_PROGRAM_IS -> { checkedInProgram = tokens[idx + 2].toBoolean(); idx += 3 }
            Keyword.SEEN_IS -> { seen = tokens[idx + 2].toBoolean(); idx += 3 }
            Keyword.SEEN_BEFORE -> { seenBefore = tokens[idx + 2]; idx += 3 }
            Keyword.SEEN_AFTER -> { seenAfter = tokens[idx + 2]; idx += 3 }
            Keyword.NOT_SEEN_BEFORE -> { notSeenBefore = tokens[idx + 2]; idx += 3 }
            Keyword.NOT_SEEN_AFTER -> { notSeenAfter = tokens[idx + 2]; idx += 3 }
            Keyword.NUM_PROGRAMS_GREATER -> { numProgramsGreaterThan = tokens[idx + 2].toInt(); idx += 3}
        }
    }

    return ObjectFilter(
        nameIs = nameIs,
        nameLike = nameLike,
        conIn = conIn,
        conNotIn = conNotIn,
        objectTypesIn = objectTypesIn,
        objectTypesNotIn = objectTypesNotIn,
        raInRange = raInRange,
        decGreaterThan = decGreaterThan,
        decLessThan = decLessThan,
        brighterThanMagnitude = brighterThanMagnitude,
        sbBrighterThan = sbBrighterThan,
        sizeGreaterThan = sizeGreaterThan,
        sizeLessThan = sizeLessThan,
        programIs = programIs,
        programIn = programIn,
        programLike = programLike,
        checkedInProgram = checkedInProgram,
        seen = seen,
        seenBefore = seenBefore,
        seenAfter = seenAfter,
        notSeenBefore = notSeenBefore,
        notSeenAfter = notSeenAfter,
        numProgramsGreaterThan = numProgramsGreaterThan
    )
}

enum class Keyword(val token1: String, val token2: String, val example: String) {
    NAME_IS("name", "=", "name = \"M 13\""),
    NAME_LIKE("name", "like", "name like \"M \""),
    CON_IN("con", "in", "con in and,per"),
    CON_NOTIN("con", "notin", "con notin and,per"),
    TYPE_IN("type", "in", "type in ast,gal"),
    TYPE_NOTIN("type", "notin", "type notin oc,double"),
    RA_RANGE("ra", "range", "ra range 23:00 to 2:00"),
    DEC_LESS("dec", "<=", "dec <= 80"),
    DEC_GREATER("dec", ">=", "dec >= -20"),
    MAGNITUDE_LESS("mag", "<=", "mag <= 10"),
    SB_LESS("sb", "<=", "sb <= 12"),
    SIZE_LESS("size", "<=", "size <= 10   (measured in arcminutes if no units given)"),
    SIZE_GREATER("size", ">=", "size >= 1deg"),
    PROGRAM_IS("program", "=", "program = \"Messier OP\""),
    PROGRAM_IN("program", "in", "program in \"Messier OP\",\"Urban OP\""),
    PROGRAM_LIKE("program", "like", "program like RASC"),
    CHECKED_IN_PROGRAM_IS("checkedinprogram", "=", "checkedinprogram = false"),
    SEEN_IS("seen", "=", "seen = false"),
    SEEN_BEFORE("seen", "before", "seen before 2018-01-15  (exists an observation before the date)"),
    SEEN_AFTER("seen", "after", "seen after 2018-01-15  (exists an observation after the date)"),
    NOT_SEEN_BEFORE("notseen", "before", "notseen before 2018-01-15  (all observations are on/after the date)"),
    NOT_SEEN_AFTER("notseen", "after", "notseen after 2018-01-15  (all observations are on/before the date)"),
    NUM_PROGRAMS_GREATER("numprograms", ">=", "numprograms >= 3");

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

