package com.mitia.smsgateway.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

/**
 * Récepteur du widget d'écran d'accueil.
 *
 * Il ne fait que router : le dessin et les commandes vivent dans
 * [RenduWidgetPasserelle], que le service appelle aussi à chaque cycle de
 * scrutation pour que le widget reste à l'heure.
 */
class WidgetPasserelle : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // onUpdate arrive sur le thread principal et la lecture du stockage est
        // suspend : goAsync() prolonge la vie du récepteur le temps du rendu.
        val attente = goAsync()
        RenduWidgetPasserelle.rafraichirEnArrierePlan(context, apres = { attente.finish() })
    }

    /** Premier widget ajouté : on dessine tout de suite, sans attendre l'update système. */
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        RenduWidgetPasserelle.rafraichirEnArrierePlan(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            RenduWidgetPasserelle.ACTION_RAFRAICHIR ->
                RenduWidgetPasserelle.rafraichirEnArrierePlan(context)

            RenduWidgetPasserelle.ACTION_DEMARRER_SERVICE ->
                RenduWidgetPasserelle.demarrerService(context)

            RenduWidgetPasserelle.ACTION_ARRETER_SERVICE -> {
                RenduWidgetPasserelle.arreterService(context)
                // Court délai : sinon le système nous compterait encore « en
                // cours » et le widget se redessinerait avec l'ancien état.
                RenduWidgetPasserelle.rafraichirEnArrierePlan(context, delaiMs = 2_000)
            }
        }
    }
}
