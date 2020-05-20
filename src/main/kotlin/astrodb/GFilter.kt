package astrodb

sealed class GFilter {
    abstract fun matches(obj: JoinedObject): Boolean

    class Predicate(val col: Column, val op: FilterOp) : GFilter() {
        override fun matches(obj: JoinedObject): Boolean {
            return col.extractor(obj).matches(op)
        }
    }

    class ListPredicate(val col: ListColumn, val aggregator: Aggregator, val op: FilterOp) : GFilter() {
        override fun matches(obj: JoinedObject): Boolean {
            return aggregator.matches(col.extractor(obj), op)
        }
    }

    class And(val predicates: List<GFilter>) : GFilter() {
        override fun matches(obj: JoinedObject): Boolean {
            return predicates.all { p -> p.matches(obj) }
        }
    }
}

sealed class FilterOp {
    //various parse() constructor functions

    data class EqDouble(val other: Double) : FilterOp()
    data class GtDouble(val other: Double) : FilterOp()
    data class GeDouble(val other: Double) : FilterOp()
    data class LtDouble(val other: Double) : FilterOp()
    data class LeDouble(val other: Double) : FilterOp()

    data class EqInt(val other: Int) : FilterOp()
    data class GtInt(val other: Int) : FilterOp()
    data class GeInt(val other: Int) : FilterOp()
    data class LtInt(val other: Int) : FilterOp()
    data class LeInt(val other: Int) : FilterOp()

    data class EqString(val other: String) : FilterOp()
    data class GtString(val other: String) : FilterOp()
    data class GeString(val other: String) : FilterOp()
    data class LtString(val other: String) : FilterOp()
    data class LeString(val other: String) : FilterOp()
    data class ContainsString(val other: String) : FilterOp()

    data class EqBoolean(val other: Boolean) : FilterOp()
//    // for enums, strings
//    IN("in"),
//
//    // for strings
//    LIKE("like"),
//
//    // for RA in particular
//    RANGE("range")
}


sealed class ColumnType {
    abstract fun matches(op: FilterOp): Boolean

    data class BooleanColumn(val value: Boolean) : ColumnType() {
        override fun matches(op: FilterOp): Boolean {
            return when (op) {
                is FilterOp.EqBoolean -> value == op.other
                else -> throw ParseException("Boolean doesn't support operation $op")
            }
        }
    }

    data class DoubleColumn(val value: Double?) : ColumnType() {
        override fun matches(op: FilterOp): Boolean {
            if (value == null) {
                return true
            }
            return when (op) {
                is FilterOp.EqDouble -> value == op.other
                is FilterOp.GtDouble -> value > op.other
                is FilterOp.GeDouble -> value >= op.other
                is FilterOp.LtDouble -> value < op.other
                is FilterOp.LeDouble -> value <= op.other
                else -> throw ParseException("Double doesn't support operation $op")
            }
        }
    }

    data class IntColumn(val value: Int?) : ColumnType() {
        override fun matches(op: FilterOp): Boolean {
            if (value == null) {
                return true
            }
            return when (op) {
                is FilterOp.EqInt -> value == op.other
                is FilterOp.GtInt -> value > op.other
                is FilterOp.GeInt -> value >= op.other
                is FilterOp.LtInt -> value < op.other
                is FilterOp.LeInt -> value <= op.other
                else -> throw ParseException("Int doesn't support operation $op")
            }
        }
    }

    data class StringColumn(val value: String?) : ColumnType() {
        override fun matches(op: FilterOp): Boolean {
            if (value == null) {
                return true
            }
            return when (op) {
                is FilterOp.EqString -> value == op.other
                is FilterOp.GtString -> value > op.other
                is FilterOp.GeString -> value >= op.other
                is FilterOp.LtString -> value < op.other
                is FilterOp.LeString -> value <= op.other
                is FilterOp.ContainsString -> value.contains(op.other)
                else -> throw ParseException("String doesn't support operation $op")
            }
        }
    }
}

sealed class Aggregator {
    abstract fun matches(value: List<String>, op: FilterOp): Boolean

    object Any : Aggregator() {
        override fun matches(value: List<String>, op: FilterOp): Boolean {
            return value.any { x -> ColumnType.StringColumn(x).matches(op) }
        }
    }

    object All : Aggregator() {
        override fun matches(value: List<String>, op: FilterOp): Boolean {
            return value.all { x -> ColumnType.StringColumn(x).matches(op) }
        }
    }

    object Count : Aggregator() {
        override fun matches(value: List<String>, op: FilterOp): Boolean {
            return ColumnType.IntColumn(value.size).matches(op)
        }
    }

    object Has : Aggregator() {
        override fun matches(value: List<String>, op: FilterOp): Boolean {
            return ColumnType.BooleanColumn(value.isNotEmpty()).matches(op)
        }
    }

    // TODO: consider also adding a "none" aggregation, then may be able to
    // unify the list/nonlist types.
}

sealed class ListColumn(val rep: String, val extractor: (JoinedObject) -> List<String>) {
    object Name : ListColumn("name", { obj -> obj.obj.names })
    object Obs : ListColumn("obs", { obj -> obj.observations.map { o -> o.date } })
    object Program : ListColumn("programs", { obj -> obj.programs.map { p -> p.programName } })
}

sealed class Column(val rep: String, val extractor: (JoinedObject) -> ColumnType) {
    object Mag : Column("mag", { obj -> ColumnType.DoubleColumn(obj.obj.magnitude.asNumber()) })
    object Sb : Column("sb", { obj -> ColumnType.DoubleColumn(obj.obj.surfaceBrightness) })
}


