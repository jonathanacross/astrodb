package astrodb

import astrodb.*
import kotlin.test.assertEquals
import org.junit.Test as test

class QueryTest {
    @test
    fun tokenizeCheck() {
        assertEquals(tokenize("foo bar baz"), listOf("foo", "bar", "baz"))
        assertEquals(tokenize("   foo  bar   baz   "), listOf("foo", "bar", "baz"))
        assertEquals(tokenize("   foo  \"in quotes\"   baz   "), listOf("foo", "in quotes", "baz"))
        assertEquals(tokenize("   foo  \"in quotes\""), listOf("foo", "in quotes"))
        assertEquals(tokenize("\"q 1 2 \" and  \"q 3 4\""), listOf("q 1 2 ", "and", "q 3 4"))
    }

    @test
    fun parseQueryCheck() {
        assertEquals(parseQuery("name = \"ST 585\""), ObjectFilter(nameIs="ST 585"))
        assertEquals(parseQuery("name LIKE \"M \""), ObjectFilter(nameLike="M "))
        assertEquals(parseQuery("con in and"), ObjectFilter(conIn=listOf(Constellation.AND)))
        assertEquals(parseQuery("con in and,per"), ObjectFilter(conIn=listOf(Constellation.AND,Constellation.PER)))
        assertEquals(parseQuery("con notin and,ori"), ObjectFilter(conNotIn = listOf(Constellation.AND, Constellation.ORI)))
        assertEquals(parseQuery("type in ast,double"), ObjectFilter(objectTypesIn= listOf(ObjectType.ASTERISM, ObjectType.DOUBLE_STAR)))
        assertEquals(parseQuery("type notin ast,double"), ObjectFilter(objectTypesNotIn= listOf(ObjectType.ASTERISM, ObjectType.DOUBLE_STAR)))
        assertEquals(parseQuery("ra range 21 to 23:30"), ObjectFilter(raInRange = RaRange(21.0, 23.5)))
        assertEquals(parseQuery("dec >= 2d30m"), ObjectFilter(decGreaterThan = 2.5))
        assertEquals(parseQuery("dec <= -10"), ObjectFilter(decLessThan = -10.0))
        assertEquals(parseQuery("mag <= 10"), ObjectFilter(brighterThanMagnitude = 10.0))
        assertEquals(parseQuery("sb <= 12"), ObjectFilter(sbBrighterThan = 12.0))
        assertEquals(parseQuery("size >= 120'"), ObjectFilter(sizeGreaterThan = 120.0))
        assertEquals(parseQuery("size <= 2.5deg"), ObjectFilter(sizeLessThan = 150.0))
        assertEquals(parseQuery("seen = false"), ObjectFilter(seen = false))
        assertEquals(parseQuery("seen = true"), ObjectFilter(seen = true))
        assertEquals(parseQuery("program = \"Best 500\""), ObjectFilter(programIs = "Best 500"))
        assertEquals(parseQuery("program in \"Best 500\",\"Worst 500\""), ObjectFilter(programIn = listOf("Best 500", "Worst 500")))
        assertEquals(parseQuery("program like 500"), ObjectFilter(programLike = "500"))
        assertEquals(parseQuery("notseen since 2019-12-13"), ObjectFilter(notSeenSince = "2019-12-13"))
    }
}
