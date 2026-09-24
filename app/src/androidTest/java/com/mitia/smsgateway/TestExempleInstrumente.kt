package com.mitia.smsgateway

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Assert.*

/**
 * Test instrumenté, exécuté sur un appareil Android.
 *
 * Voir [documentation des tests](http://d.android.com/tools/testing).
 */
@RunWith(AndroidJUnit4::class)
class TestExempleInstrumente {
    @Test
    fun utiliseContexteApp() {
        // Contexte de l'app sous test.
        val contexteApp = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.mitia.smsgateway", contexteApp.packageName)
    }
}
