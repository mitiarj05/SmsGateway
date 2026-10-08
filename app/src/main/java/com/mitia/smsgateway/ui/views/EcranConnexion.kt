package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.Image
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

@Composable
fun EcranConnexion(
    aConnexionReussie: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var email by remember { mutableStateOf("test@smstsika.mg") }
    var motDePasse by remember { mutableStateOf("••••••••••") }
    var resterConnecte by remember { mutableStateOf(true) }

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

            // Logo icône néon 96px avec ombre indigo portée
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .shadow(24.dp, RoundedCornerShape(26.dp), spotColor = NeonShadowColor)
                    .clip(RoundedCornerShape(26.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(GradientIndigoStart, GradientIndigoEnd)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.smstsika),
                    contentDescription = "Logo SMSIKA",
                    modifier = Modifier.size(56.dp)
                )
            }

            Spacer(Modifier.height(18.dp))

            // Titre SMSIKA (SMS en #0F172A, IKA en dégradé texte)
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = Color(0xFF0F172A), fontWeight = FontWeight.ExtraBold, fontSize = 32.sp)) {
                        append("SMS")
                    }
                    withStyle(
                        SpanStyle(
                            brush = Brush.linearGradient(listOf(GradientIndigoStart, Color(0xFF22D3EE))),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 32.sp
                        )
                    ) {
                        append("IKA")
                    }
                },
                letterSpacing = 1.sp
            )

            Spacer(Modifier.height(4.dp))

            // Sous-titre « SMS GATEWAY · Espace client »
            Text(
                text = "SMS GATEWAY · Espace client",
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
                            visualTransformation = PasswordVisualTransformation(),
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Lock,
                                    contentDescription = null,
                                    tint = TexteSousTitreClair,
                                    modifier = Modifier.size(18.dp).padding(start = 6.dp)
                                )
                            },
                            trailingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Visibility,
                                    contentDescription = null,
                                    tint = TexteSousTitreClair,
                                    modifier = Modifier.size(18.dp).padding(end = 6.dp)
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
                            modifier = Modifier.clickable {}
                        )
                    }

                    Spacer(Modifier.height(4.dp))

                    // Bouton dégradé pleine largeur « Se connecter »
                    BoutonNeon(
                        libelle = "Se connecter",
                        auClic = aConnexionReussie,
                        modifier = Modifier.fillMaxWidth()
                    )

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

                    // Bouton Google « Continuer avec Google »
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                            .background(BlancCarte)
                            .clickable {}
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(18.dp)
                                    .clip(CircleShape)
                                    .background(Brush.horizontalGradient(listOf(Color(0xFFEA4335), Color(0xFFFBBC05), Color(0xFF34A853), Color(0xFF4285F4)))),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("G", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
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
                    modifier = Modifier.clickable {}
                )
            }

            Spacer(Modifier.height(24.dp))

            // Tout en bas, centré : « Compte démo » + chip fond #F1F5F9 mono « demo@smsika.mg / demo2026 »
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Compte démo",
                    color = TexteSousTitreClair,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium
                )
                Surface(
                    color = FondInputClair,
                    shape = RoundedCornerShape(99.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BordureInputClair)
                ) {
                    Text(
                        text = "demo@smsika.mg / demo2026",
                        color = TexteTitreClair,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}
