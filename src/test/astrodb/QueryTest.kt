import astrodb.*
import org.junit.Test as test
import kotlin.test.assertEquals

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
        assertEquals(parseQuery("type in ast,double"), ObjectFilter(objectTypesIn= listOf(ObjectType.ASTERISM, ObjectType.DOUBLE_STAR)))
        assertEquals(parseQuery("ra range 21 to 23:30"), ObjectFilter(raInRange = RaRange(21.0, 23.5)))
        assertEquals(parseQuery("dec >= 2d30m"), ObjectFilter(decGreaterThan = 2.5))
        assertEquals(parseQuery("dec <= -10"), ObjectFilter(decLessThan = -10.0))
        assertEquals(parseQuery("mag >= -10"), ObjectFilter(brighterThanMagnitude = -10.0))
        assertEquals(parseQuery("size >= 120'"), ObjectFilter(sizeGreaterThan = 120.0))
        assertEquals(parseQuery("size <= 2.5deg"), ObjectFilter(sizeLessThan = 150.0))
        assertEquals(parseQuery("seen = false"), ObjectFilter(seen = false))
        assertEquals(parseQuery("seen = true"), ObjectFilter(seen = true))
        assertEquals(parseQuery("program = \"Best 500\""), ObjectFilter(inProgram = "Best 500"))
    }
}
