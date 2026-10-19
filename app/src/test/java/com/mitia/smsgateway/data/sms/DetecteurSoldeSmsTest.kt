package com.mitia.smsgateway.data.sms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Reconnaissance d'une notification de solde dans les SMS entrants.
 *
 * Ces gardes comptent : le relevé du solde est le seul moyen de savoir quand la
 * passerelle n'a plus de crédit, mais un faux solde est pire qu'aucun solde.
 * L'appareil reçoit aussi bien les réponses des clients que les campagnes de
 * l'opérateur — un SMS Yas réellement reçu annonçait « Rechargez 200 Ar… ».
 */
class DetecteurSoldeSmsTest {

    @Test
    fun notificationDeSoldeYas_estLue() {
        val mesure = DetecteurSoldeSms.extraireSolde(
            "Yas",
            "Telma devient Yas! Votre credit est: 88Ar valable jusqu au 15 janv. 2027."
        )
        assertEquals("88" to "AR", mesure)
    }

    @Test
    fun smsMarketingSansMotDeSolde_estIgnore() {
        assertNull(
            DetecteurSoldeSms.extraireSolde(
                "Yas",
                "Rechargez 200 Ar et beneficiez de 20 Mo de data gratuits!"
            )
        )
    }

    @Test
    fun dateSansDevise_nestPasUnMontant() {
        // Mot de solde présent, montant candidat présent… mais pas de devise :
        // la date ne doit pas devenir le solde.
        assertNull(DetecteurSoldeSms.extraireSolde("Yas", "Votre solde expire le 12/12/2026"))
    }

    @Test
    fun montantTropLoinDuMotDeSolde_estIgnore() {
        val texte = "Votre solde expire bientot." + " bla".repeat(20) + " Rechargez 200 Ar."
        assertNull(DetecteurSoldeSms.extraireSolde("Yas", texte))
    }

    @Test
    fun clientQuiRepond_nestPasUnService() {
        // Un numéro de mobile complet : c'est un client, pas l'opérateur.
        assertNull(DetecteurSoldeSms.extraireSolde("+261341234567", "Votre credit est 5000Ar"))
        assertNull(DetecteurSoldeSms.extraireSolde("0341234567", "Votre solde est 5000Ar"))
    }

    @Test
    fun codeCourtOperateur_estUnService() {
        assertEquals("5000" to "AR", DetecteurSoldeSms.extraireSolde("355", "Votre solde est 5000Ar"))
    }

    @Test
    fun expediteursDeService() {
        assertTrue(DetecteurSoldeSms.expediteurDeService("Yas"))
        assertTrue(DetecteurSoldeSms.expediteurDeService("TELMA"))
        assertTrue(DetecteurSoldeSms.expediteurDeService("YasQuizWin"))
        assertTrue(DetecteurSoldeSms.expediteurDeService("355"))
        assertFalse(DetecteurSoldeSms.expediteurDeService(""))
        assertFalse(DetecteurSoldeSms.expediteurDeService("+261341234567"))
    }
}
