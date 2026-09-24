package com.mitia.smsgateway.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Formatage d'heure partagé (journal, export, UI). Pur, sans dépendance Android. */
object UtilitairesTemps {

    private fun formatHeure(): SimpleDateFormat =
        SimpleDateFormat("HH:mm:ss", Locale.FRANCE)

    fun formaterHeure(horodatage: Long): String = formatHeure().format(Date(horodatage))
}
