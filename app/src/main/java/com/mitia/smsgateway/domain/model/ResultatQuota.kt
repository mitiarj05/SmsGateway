package com.mitia.smsgateway.domain.model

sealed interface ResultatQuota {
    data class Succes(val quota: QuotaDto) : ResultatQuota
    data object ErreurReseau : ResultatQuota
}
