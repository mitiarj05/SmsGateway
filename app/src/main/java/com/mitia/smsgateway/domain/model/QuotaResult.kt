package com.mitia.smsgateway.domain.model

sealed interface QuotaResult {
    data class Success(val quota: QuotaDto) : QuotaResult
    data object NetworkError : QuotaResult
}
