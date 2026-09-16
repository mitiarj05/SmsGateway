package com.mitia.smsgateway.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Formatage d'heure partagé (journal, export, UI). Pur, sans dépendance Android. */
object TimeUtils {

    private fun timeFormat(): SimpleDateFormat =
        SimpleDateFormat("HH:mm:ss", Locale.FRANCE)

    fun formatTime(t: Long): String = timeFormat().format(Date(t))
}
