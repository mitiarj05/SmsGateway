package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.ElementEvenement
import kotlinx.coroutines.flow.Flow

/** Journal embarqué (écran Journal, export). */
interface DepotJournaux {
    suspend fun journaliser(message: String)
    fun observer(): Flow<List<ElementEvenement>>
    suspend fun instantane(): List<ElementEvenement>
    suspend fun effacer()
    fun versTexte(evenements: List<ElementEvenement>): String
}
