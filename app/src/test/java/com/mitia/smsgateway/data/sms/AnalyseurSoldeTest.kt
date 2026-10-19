package com.mitia.smsgateway.data.sms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Extraction du montant dans les réponses d'opérateurs.
 *
 * Les textes de référence ne sont pas inventés : la première réponse est celle
 * qu'a réellement renvoyée `#357#` sur une carte Yas de l'appareil de test, et
 * c'est elle qui avait révélé que l'ariary n'était pas reconnu (le relevé
 * stocké portait « 88 » sans unité).
 */
class AnalyseurSoldeTest {

    @Test
    fun releveYas_reel_estLuAvecSaDevise() {
        val (montant, devise) = AnalyseurSolde.analyser(
            "Telma devient Yas! Votre credit est: 88Ar valable jusqu au 15 janv. 2027. " +
                "Bonus appels: 0Ar FAF, 0Ar Yas, 0 SMS FAF, 0 SMS Yas, 0Ar KADOA."
        )
        assertEquals("88", montant)
        assertEquals("AR", devise)
    }

    @Test
    fun montantEcritAvecEspaces() {
        val (montant, devise) =
            AnalyseurSolde.analyser("Votre solde est de 5 000 FCFA valable jusqu'au 12/12/2026")
        assertEquals("5 000", montant)
        assertEquals("FCFA", devise)
    }

    @Test
    fun virguleDesCentimes() {
        val (montant, devise) = AnalyseurSolde.analyser("Solde: 12,50 EUR")
        assertEquals("12,50", montant)
        assertEquals("EUR", devise)
    }

    @Test
    fun uneDateNestPasUnMontant() {
        // « le 12/12/2026 » : aucun montant suivi d'une devise, et le repli
        // lui-même refuse un nombre qui fait partie d'une date.
        val (montant, devise) = AnalyseurSolde.analyser("Votre solde expire le 12/12/2026")
        assertNull(montant)
        assertNull(devise)
    }

    @Test
    fun leRepliNeConfondPasUneDateAvecUnMontant() {
        // Un vrai montant sans devise, suivi d'une date : le montant est pris,
        // la date est laissée où elle est.
        val (montant, devise) = AnalyseurSolde.analyser("Solde: 5 000. Expire le 12/12/2026")
        assertEquals("5 000", montant)
        assertNull(devise)
    }

    @Test
    fun leFDeFactureNestPasUneDevise() {
        val (montant, devise) = AnalyseurSolde.analyser("Facture 1200 Factures impayees")
        assertNull(montant)
        assertNull(devise)
    }

    @Test
    fun repliQuandLaDeviseManque() {
        // Repli assumé : le nombre est conservé, mais sans unité. Le détecteur de
        // SMS, lui, refuse un relevé sans devise (voir DetecteurSoldeSmsTest).
        val (montant, devise) = AnalyseurSolde.analyser("Votre solde est 5000")
        assertEquals("5000", montant)
        assertNull(devise)
    }

    @Test
    fun texteVide() {
        assertEquals(null to null, AnalyseurSolde.analyser(null))
        assertEquals(null to null, AnalyseurSolde.analyser("   "))
    }
}
