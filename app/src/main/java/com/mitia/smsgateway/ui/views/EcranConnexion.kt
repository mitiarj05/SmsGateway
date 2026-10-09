package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.Image
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.material3.IconButton
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import com.mitia.smsgateway.data.remote.ClientApi
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
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.R
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.theme.*

/**
 * ID client Web OAuth (console Firebase → Authentication → Fournisseurs → Google).
 * Requis pour la connexion Google native. Vide = bouton Google désactivé avec message.
 */
private const val WEB_CLIENT_ID = "233592128256-b6gter86alhot1th9mi1knp5g0t6664u.apps.googleusercontent.com"

@Composable
fun EcranConnexion(
    aConnexionReussie: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var etape by remember { mutableStateOf("email") }
    var email by remember { mutableStateOf("") }
    var motDePasse by remember { mutableStateOf("") }
    var afficherMotDePasse by remember { mutableStateOf(false) }
    var resterConnecte by remember { mutableStateOf(true) }
    var erreur by remember { mutableStateOf<String?>(null) }
    var googleEnCours by remember { mutableStateOf(false) }
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()

    fun ouvrirNavigateur(chemin: String) {
        try {
            val url = ClientApi.urlBase.trimEnd('/') + chemin
            contexte.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            Log.e("EcranConnexion", "Ouverture navigateur impossible", e)
        }
    }

    fun connexionGoogle() {
        if (WEB_CLIENT_ID.isBlank()) {
            erreur = "Connexion Google non configurée sur cette application."
            return
        }
        googleEnCours = true
        erreur = null
        portee.launch {
            try {
                val gestionnaire = CredentialManager.create(contexte)
                val optionGoogle = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(WEB_CLIENT_ID)
                    .build()
                val requete = GetCredentialRequest.Builder()
                    .addCredentialOption(optionGoogle)
                    .build()
                val resultat = gestionnaire.getCredential(contexte, requete)
                val identifiant = GoogleIdTokenCredential.createFrom(resultat.credential.data)
                val credential = GoogleAuthProvider.getCredential(identifiant.idToken, null)
                val auth = FirebaseAuth.getInstance().signInWithCredential(credential).await()
                val jetonId = auth.user?.getIdToken(false)?.await()?.token
                if (jetonId.isNullOrBlank()) {
                    erreur = "Connexion Google impossible — réessayez."
                } else {
                    val erreurServeur = ClientApi.lierCompteGoogle(jetonId)
                    if (erreurServeur == null) {
                        aConnexionReussie()
                        return@launch
                    }
                    erreur = erreurServeur
                }
            } catch (e: Exception) {
                if (e !is GetCredentialCancellationException) {
                    erreur = "Connexion Google impossible — réessayez."
                    Log.e("EcranConnexion", "Échec Google", e)
                }
            } finally {
                googleEnCours = false
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(Modifier.height(16.dp))

            // Logo officiel SMSTSIKA
            Image(
                painter = painterResource(id = R.drawable.logo_app),
                contentDescription = "Logo SMSTSIKA",
                modifier = Modifier
                    .size(96.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .shadow(24.dp, RoundedCornerShape(26.dp), spotColor = NeonShadowColor),
                contentScale = ContentScale.Fit
            )

            Spacer(Modifier.height(18.dp))

            // Sous-titre (le logo contient déjà « SMS GATEWAY »)
            Text(
                text = "Espace client",
                color = TexteSousTitreClair,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.5.sp
            )

            Spacer(Modifier.height(28.dp))

            // Carte blanche radius 20px
            CarteGlass(
                modifier = Modifier.fillMaxWidth(),
                coins = 20.dp
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Bannière d'erreur
                    if (erreur != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(13.dp))
                                .background(Color(0xFFFFF1F2))
                                .border(1.dp, Color(0xFFFECDD3), RoundedCornerShape(13.dp))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = erreur ?: "",
                                color = Color(0xFFE11D48),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                    if (etape == "email") {
                    // Champ « Adresse e-mail »
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Adresse e-mail",
                            color = TexteTitreClair,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            singleLine = true,
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Email,
                                    contentDescription = null,
                                    tint = TexteSousTitreClair,
                                    modifier = Modifier.size(18.dp).padding(start = 6.dp)
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = FondInputClair,
                                unfocusedContainerColor = FondInputClair,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = BordureInputClair,
                                focusedTextColor = TexteTitreClair,
                                unfocusedTextColor = TexteTitreClair,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }
                    } else {
                        // Récapitulatif e-mail + Modifier
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(13.dp))
                                .background(FondInputClair)
                                .clickable { etape = "email"; erreur = null }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = email,
                                color = TexteTitreClair,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = "Modifier",
                                color = GradientIndigoStart,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    // Champ « Mot de passe »
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Mot de passe",
                            color = TexteTitreClair,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = motDePasse,
                            onValueChange = { motDePasse = it },
                            singleLine = true,
                            visualTransformation = if (afficherMotDePasse) {
                                androidx.compose.ui.text.input.VisualTransformation.None
                            } else {
                                PasswordVisualTransformation()
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Lock,
                                    contentDescription = null,
                                    tint = TexteSousTitreClair,
                                    modifier = Modifier.size(18.dp).padding(start = 6.dp)
                                )
                            },
                            trailingIcon = {
                                IconButton(onClick = { afficherMotDePasse = !afficherMotDePasse }) {
                                    Icon(
                                        imageVector = if (afficherMotDePasse) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                                        contentDescription = if (afficherMotDePasse) "Masquer" else "Afficher",
                                        tint = TexteSousTitreClair,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = FondInputClair,
                                unfocusedContainerColor = FondInputClair,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = BordureInputClair,
                                focusedTextColor = TexteTitreClair,
                                unfocusedTextColor = TexteTitreClair,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    // Ligne : Checkbox + Lien Mot de passe oublié ?
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { resterConnecte = !resterConnecte }
                        ) {
                            Checkbox(
                                checked = resterConnecte,
                                onCheckedChange = { resterConnecte = it },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = NeonShadowColor,
                                    uncheckedColor = BordureInputClair
                                ),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = "Rester connecté",
                                color = TexteTitreClair,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Text(
                            text = "Mot de passe oublié ?",
                            color = GradientIndigoStart,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { ouvrirNavigateur("/mot-de-passe-oublie") }
                        )
                    }
                    } // fin etape mdp

                    Spacer(Modifier.height(4.dp))

                    // Bouton principal : Continuer (e-mail) / Se connecter (mot de passe)
                    BoutonNeon(
                        libelle = if (etape == "email") "Continuer" else "Se connecter",
                        auClic = {
                            if (etape == "email") {
                                if (email.trim().isEmpty()) {
                                    erreur = "Saisissez votre adresse e-mail pour continuer"
                                } else {
                                    erreur = null
                                    etape = "mdp"
                                }
                            } else {
                                if (motDePasse.isEmpty()) {
                                    erreur = "Saisissez votre mot de passe"
                                } else {
                                    erreur = null
                                    aConnexionReussie()
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (etape == "email") {
                    // Séparateur « ou continuer avec »
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = BordureInputClair)
                        Text(
                            text = "ou continuer avec",
                            color = TexteSousTitreClair,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = BordureInputClair)
                    }

                    // Bouton Google « Continuer avec Google » (logo réel)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                            .background(BlancCarte)
                            .clickable { if (!googleEnCours) connexionGoogle() }
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (googleEnCours) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                androidx.compose.material3.CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = GradientIndigoStart,
                                    strokeWidth = 2.dp
                                )
                                Spacer(Modifier.width(10.dp))
                                Text(
                                    text = "Connexion…",
                                    color = TexteTitreClair,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Image(
                                painter = painterResource(id = R.drawable.google_logo),
                                contentDescription = "Google",
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(10.dp))
                            Text(
                                text = "Continuer avec Google",
                                color = TexteTitreClair,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        }
                    }
                    } // fin etape email (séparateur + Google)
                }
            }

            Spacer(Modifier.height(20.dp))

            // Sous la carte : « Pas encore de compte ? Créer un espace client »
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pas encore de compte ? ",
                    color = TexteSousTitreClair,
                    fontSize = 13.sp
                )
                Text(
                    text = "Créer un espace client",
                    color = GradientIndigoStart,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { ouvrirNavigateur("/demande-acces") }
                )
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}
