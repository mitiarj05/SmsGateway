package com.mitia.smsgateway.data.sms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Propositions de codes USSD par opérateur.
 *
 * L'annuaire ne fait que PROPOSER : c'est l'utilisateur qui saisit le code, car
 * un code erroné peut souscrire à un service payant.
 */
class AnnuaireUssdTest {

    @Test
    fun yasEtTelma_consultentLeCreditPar357() {
        // Vérifié sur une carte Yas réelle : #357# renvoie directement le crédit.
        assertEquals(listOf("#357#"), AnnuaireUssd.suggestions("Yas"))
        assertEquals(listOf("#357#"), AnnuaireUssd.suggestions("TELMA"))
        assertEquals(listOf("#357#"), AnnuaireUssd.suggestions("Telma Madagascar"))
    }

    @Test
    fun operateurInconnu_aucuneSuggestion() {
        assertTrue(AnnuaireUssd.suggestions("Operateur Bidon").isEmpty())
        assertTrue(AnnuaireUssd.suggestions("").isEmpty())
        assertTrue(AnnuaireUssd.suggestions(null).isEmpty())
    }
}
