package com.mitia.smsgateway.ui.views

import android.os.Build
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.R
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.theme.*

/** Écran de chargement (logo + spinner) pendant l'init. */
@Composable
fun EcranDemarrage(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.logo_app),
                contentDescription = "SMSTSIKA",
                modifier = Modifier
                    .size(96.dp)
                    .shadow(16.dp, RoundedCornerShape(26.dp), spotColor = NeonShadowColor)
                    .clip(RoundedCornerShape(26.dp)),
                contentScale = ContentScale.Fit
            )
            Spacer(Modifier.height(20.dp))
            Text(
                text = "SMSTSIKA",
                color = TexteTitreClair,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = "passerelle autohébergée",
                color = TexteSousTitreClair,
                fontSize = 12.5.sp,
            )
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = GradientIndigoStart)
        }
    }
}

/**
 * Assistant de première ouverture : bienvenue → serveur → permissions.
 */
@Composable
fun EcranIntegration(
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    message: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
    aTerminer: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var etape by remember { mutableIntStateOf(0) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
        ) {
            Text(
                text = "Étape ${etape + 1}/3",
                color = TexteSousTitreClair,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { (etape + 1) / 3f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(CircleShape),
                color = GradientIndigoStart,
                trackColor = BordureInputClair,
            )
            Spacer(Modifier.height(28.dp))

            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column {
                    when (etape) {
                        0 -> IntegrationBienvenue()
                        1 -> IntegrationServeur(
                            urlServeur = urlServeur,
                            auChangementUrlServeur = auChangementUrlServeur,
                            message = message,
                            aEnregistrerServeur = aEnregistrerServeur,
                            aTesterConnexion = aTesterConnexion,
                        )
                        else -> IntegrationPermissions(
                            permissionSms = permissionSms,
                            permissionNotifications = permissionNotifications,
                            batterieOk = batterieOk,
                            aDemanderPermissionSms = aDemanderPermissionSms,
                            aDemanderPermissionNotifications = aDemanderPermissionNotifications,
                            aOuvrirReglagesBatterie = aOuvrirReglagesBatterie,
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (etape > 0) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                            .background(BlancCarte)
                            .clickable { etape-- }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = TexteTitreClair, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Retour", color = TexteTitreClair, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(Modifier.weight(1f))

                if (etape < 2) {
                    BoutonNeon(
                        libelle = "Continuer ➔",
                        auClic = { etape++ },
                        actif = etape != 1 || urlServeur.isNotBlank()
                    )
                } else {
                    BoutonNeon(
                        libelle = "Terminer et démarrer",
                        auClic = aTerminer,
                        actif = permissionSms
                    )
                }
            }

            if (etape == 2 && !permissionSms) {
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "La permission SMS est obligatoire pour envoyer.",
                    color = RougePastelTexte,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun IntegrationBienvenue() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Image(
            painter = painterResource(id = R.drawable.logo_app),
            contentDescription = "SMSTSIKA",
            modifier = Modifier
                .size(96.dp)
                .shadow(16.dp, RoundedCornerShape(26.dp), spotColor = NeonShadowColor)
                .clip(RoundedCornerShape(26.dp)),
            contentScale = ContentScale.Fit
        )
        Spacer(Modifier.height(20.dp))
        Text(
            text = "Bienvenue sur SMSTSIKA",
            color = TexteTitreClair,
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = "Ce téléphone va devenir un émetteur SMS piloté par votre serveur : " +
                "il reçoit les tâches en push, envoie via sa carte SIM, même écran éteint.",
            color = TexteSousTitreClair,
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
        )
    }
}

@Composable
private fun IntegrationServeur(
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    message: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Connectez le serveur",
            color = TexteTitreClair,
            fontSize = 19.sp,
            fontWeight = FontWeight.ExtraBold,
        )
        Text(
            text = "Adresse de votre passerelle (pré-remplie en production).",
            color = TexteSousTitreClair,
            fontSize = 12.5.sp,
        )

        OutlinedTextField(
            value = urlServeur,
            onValueChange = auChangementUrlServeur,
            label = { Text("Adresse serveur", color = TexteSousTitreClair) },
            placeholder = { Text("https://sms-gateway-omega.vercel.app", color = TexteSousTitreClair) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = FondInputClair,
                unfocusedContainerColor = FondInputClair,
                focusedBorderColor = GradientIndigoStart,
                unfocusedBorderColor = BordureInputClair,
                focusedTextColor = TexteTitreClair,
                unfocusedTextColor = TexteTitreClair,
            ),
            shape = RoundedCornerShape(13.dp),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                    .background(BlancCarte)
                    .clickable(onClick = aTesterConnexion)
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Tester", color = TexteTitreClair, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }

            BoutonNeon(
                libelle = "Enregistrer",
                auClic = aEnregistrerServeur,
                modifier = Modifier.weight(1f)
            )
        }

        if (message.isNotEmpty()) {
            Text(text = message, color = GradientIndigoStart, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun IntegrationPermissions(
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Autorisations requises",
            color = TexteTitreClair,
            fontSize = 19.sp,
            fontWeight = FontWeight.ExtraBold,
        )
        Text(
            text = "Sans elles, l'envoi en arrière-plan ne fonctionnera pas.",
            color = TexteSousTitreClair,
            fontSize = 12.5.sp,
        )

        LignePermissionIntegration(
            enRegle = permissionSms,
            etiquette = "Envoi SMS",
            detail = "obligatoire",
            etiquetteAction = "Autoriser",
            afficherAction = !permissionSms,
            aAction = aDemanderPermissionSms,
        )
        LignePermissionIntegration(
            enRegle = permissionNotifications,
            etiquette = "Notifications",
            detail = "service visible permanent",
            etiquetteAction = "Autoriser",
            afficherAction = !permissionNotifications && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU,
            aAction = aDemanderPermissionNotifications,
        )
        LignePermissionIntegration(
            enRegle = batterieOk,
            etiquette = "Batterie sans restriction",
            detail = "sinon Android tue le service",
            etiquetteAction = "Ouvrir réglages",
            afficherAction = !batterieOk,
            aAction = aOuvrirReglagesBatterie,
        )
    }
}

@Composable
private fun LignePermissionIntegration(
    enRegle: Boolean,
    etiquette: String,
    detail: String,
    etiquetteAction: String,
    afficherAction: Boolean,
    aAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(if (enRegle) VertPastelBg else RougePastelBg)
                .border(1.dp, if (enRegle) VertPastelBordure else RougePastelBordure, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (enRegle) Icons.Filled.Check else Icons.Filled.Close,
                contentDescription = null,
                tint = if (enRegle) VertPastelTexte else RougePastelTexte,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = etiquette, color = TexteTitreClair, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
            Text(text = detail, color = TexteSousTitreClair, fontSize = 11.sp)
        }
        if (afficherAction) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(GradientIndigoStart)
                    .clickable(onClick = aAction)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(etiquetteAction, color = Color.White, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
