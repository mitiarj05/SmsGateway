package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.domain.model.ElementEvenement
import com.mitia.smsgateway.domain.repository.DepotJournaux
import com.mitia.smsgateway.util.UtilitairesTemps
import kotlinx.coroutines.flow.Flow

class DepotJournauxImpl(private val context: Context) : DepotJournaux {

    override suspend fun journaliser(message: String) =
        JournalEvenements.journaliser(context, message)

    override fun observer(): Flow<List<ElementEvenement>> =
        JournalEvenements.observer(context)

    override suspend fun instantane(): List<ElementEvenement> =
        JournalEvenements.instantane(context)

    override suspend fun effacer() =
        JournalEvenements.effacer(context)

    override fun versTexte(evenements: List<ElementEvenement>): String = buildString {
        for (e in evenements.sortedBy { it.horodatage }) {
            append(UtilitairesTemps.formaterHeure(e.horodatage)).append(' ').append(e.message).append('\n')
        }
    }
}
