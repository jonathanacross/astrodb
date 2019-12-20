package astrodb

enum class Constellation {
    And, Ant, Aps, Aql, Aqr, Ara, Ari, Aur, Boo, CMa, CMi,
    CVn, Cae, Cam, Cap, Car, Cas, Cen, Cep, Cet, Cha, Cir,
    Cnc, Col, Com, CrA, CrB, Crt, Cru, Crv, Cyg, Del, Dor,
    Dra, Eql, Eri, For, Gem, Gru, Her, Hor, Hya, Hyi, Ind,
    LMi, Lac, Leo, Lep, Lib, Lup, Lyn, Lyr, Men, Mic, Mon,
    Mus, Nor, Oct, Oph, Ori, Pav, Peg, Per, Phe, Pic, PsA,
    Psc, Pup, Pyx, Ret, Scl, Sco, Sct, Ser, Sex, Sge, Sgr,
    Tau, Tel, TrA, Tri, Tuc, UMa, UMi, Vel, Vir, Vol, Vul;

    companion object {
        fun parse(conField: String): Constellation {
            try {
                return valueOf(conField)
            } catch (e: Exception) {
                throw ParseException("unknown constellation '" + conField + "'")
            }
        }
    }
}
