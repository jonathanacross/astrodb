package astrodb

import astrodb.Keyword

enum class Mode {
    OBSERVING_LIST,
    PROGRAM_LIST,
    OBJECT_LIST
}

data class Options(
    val objectsFileName: String,
    val observationsFileName: String,
    val programsFileName: String,
    val mode: Mode,
    val filterString: String,
    val checkLikelyDuplicates: Boolean
)

fun usage(): String {
    val filterDesc = Keyword.values().map{ k -> k.example.prependIndent("    ") }
    val argDescription = listOf(
        "",
        "Usage: java -jar astrodb.jar [options]",
        "    --objects={objects file}",
        "    --observations={observations file}",
        "    --programs={programs file}",
        "    --mode=[observing_list | program_list | object_list]",
        "    --filter='{filter}'",
        "    --checkLikelyDuplicates=[true|false]",
        "",
        "Filter consists of clauses in the form:"
    )

    return (argDescription + filterDesc).joinToString("\n")
}

// Small hack to expand ~ to user directory to allow user to specify files as ~/....
private fun expandPath(path: String): String {
    return path.replaceFirst(Regex("^~"), System.getProperty("user.home"))
}

fun parseArgs(args: Array<String>): Options {
    var objectsFileName = ""
    var observationsFileName = ""
    var programsFileName = ""
    var mode = Mode.OBSERVING_LIST
    var filterString = ""
    var checkLikelyDuplicates = false

    for (arg in args) {
        val keyValue = arg.split("=", limit = 2)
        if (keyValue.size != 2) {
            throw ParseException("couldn't parse '$keyValue'\n." + usage())
        }
        val key = keyValue[0]
        val value = keyValue[1]
        when (key) {
            "--objects" -> objectsFileName = expandPath(value)
            "--observations" -> observationsFileName = expandPath(value)
            "--programs" -> programsFileName = expandPath(value)
            "--mode" -> mode = Mode.valueOf(value.toUpperCase())
            "--filter" -> filterString = value
            "--checkLikelyDuplicates" -> checkLikelyDuplicates = value.toBoolean()
            else -> throw ParseException("unknown argument $key. " + usage())
        }
    }

    // simple validation
    if (objectsFileName.isBlank()) {
        throw ParseException("--objects file not specified")
    }
    if (observationsFileName.isBlank()) {
        throw ParseException("--observations file not specified")
    }
    if (programsFileName.isBlank()) {
        throw ParseException("--programs file not specified")
    }
    return Options(objectsFileName, observationsFileName, programsFileName, mode, filterString, checkLikelyDuplicates)
}
