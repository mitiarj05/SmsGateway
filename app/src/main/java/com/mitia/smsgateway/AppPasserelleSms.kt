package com.mitia.smsgateway

import android.app.Application
import android.util.Log
import com.mitia.smsgateway.di.ConteneurApp

/**
 * Point d'entrée applicatif (déclaré dans le manifest).
 * Expose le conteneur d'injection : `(application as AppPasserelleSms).conteneurApp`.
 */
class AppPasserelleSms : Application() {

    val conteneurApp: ConteneurApp by lazy { ConteneurApp(this) }

    override fun onCreate() {
        super.onCreate()
        Log.d("AppPasserelleSms", "Application démarrée")
    }
}
