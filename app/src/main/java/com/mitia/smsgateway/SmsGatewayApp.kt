package com.mitia.smsgateway

import android.app.Application
import android.util.Log
import com.mitia.smsgateway.di.AppContainer

/**
 * Point d'entrée applicatif (déclaré dans le manifest).
 * Expose le conteneur d'injection : `(application as SmsGatewayApp).appContainer`.
 */
class SmsGatewayApp : Application() {

    val appContainer: AppContainer by lazy { AppContainer(this) }

    override fun onCreate() {
        super.onCreate()
        Log.d("SmsGatewayApp", "Application démarrée")
    }
}
