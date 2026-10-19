package com.mitia.smsgateway.ui.views

import android.net.Uri
import android.provider.Settings
import android.widget.VideoView
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.mitia.smsgateway.R
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun EcranOnboarding(
    aTerminer: () -> Unit = {},
    aOuvrirConnexion: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val pagerState = rememberPagerState(pageCount = { 3 })
    val portee = rememberCoroutineScope()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // En haut à droite : Bouton texte « Passer »
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = "Passer",
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clickable { aTerminer() }
                        .padding(top = 16.dp, end = 8.dp)
                )
            }

            // Swiper Horizontal (3 Slides)
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) { pageIndex ->
                when (pageIndex) {
                    0 -> SlideOnboarding1()
                    1 -> SlideOnboarding2()
                    else -> SlideOnboarding3()
                }
            }

            // Dots d'indication (3 dots ronds 7px, l'actif élargi 22px en dégradé)
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(vertical = 10.dp)
            ) {
                repeat(3) { index ->
                    val estActif = pagerState.currentPage == index
                    Box(
                        modifier = Modifier
                            .height(7.dp)
                            .width(if (estActif) 22.dp else 7.dp)
                            .clip(CircleShape)
                            .background(
                                if (estActif)
                                    Brush.horizontalGradient(listOf(GradientIndigoStart, Color(0xFF38BDF8)))
                                else
                                    Brush.horizontalGradient(listOf(MaterialTheme.colorScheme.outline, MaterialTheme.colorScheme.outline))
                            )
                    )
                }
            }

            // En bas : Bouton dégradé pleine largeur « Suivant » / « Commencer »
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                BoutonNeon(
                    libelle = if (pagerState.currentPage == 2) "Commencer" else "Suivant",
                    auClic = {
                        if (pagerState.currentPage < 2) {
                            portee.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                        } else {
                            aTerminer()
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                // Si slide 3 : "Déjà un compte ? Se connecter"
                if (pagerState.currentPage == 2) {
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 6.dp)
                    ) {
                        Text(
                            text = "Déjà un compte ? ",
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            fontSize = 12.5.sp
                        )
                        Text(
                            text = "Se connecter",
                            color = GradientIndigoStart,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { aOuvrirConnexion() }
                        )
                    }
                } else {
                    Spacer(Modifier.height(18.dp))
                }
            }
        }
    }
}

/* ================= SLIDE 1 ================= */
@Composable
private fun SlideOnboarding1() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Centre : logo officiel SMSTSIKA 150px avec grande ombre portée
        Image(
            painter = painterResource(id = R.drawable.logo_app),
            contentDescription = "Logo SMSTSIKA",
            modifier = Modifier
                .size(150.dp)
                .shadow(32.dp, RoundedCornerShape(38.dp), spotColor = NeonShadowColor)
                .clip(RoundedCornerShape(38.dp)),
            contentScale = ContentScale.Fit
        )

        Spacer(Modifier.height(36.dp))

        // Titre centré 23px font 800 #0F172A avec mot « poche » en dégradé
        Text(
            text = buildAnnotatedString {
                withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.ExtraBold, fontSize = 23.sp)) {
                    append("Votre passerelle SMS\ndans votre ")
                }
                withStyle(
                    SpanStyle(
                        brush = Brush.linearGradient(listOf(GradientIndigoStart, Color(0xFF38BDF8))),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 23.sp
                    )
                ) {
                    append("poche")
                }
            },
            textAlign = TextAlign.Center,
            lineHeight = 30.sp
        )

        Spacer(Modifier.height(14.dp))

        // Sous-titre centré 12.5px #64748B
        Text(
            text = "Transformez vos téléphones Android en relais d'envoi professionnels — sans abonnement, avec vos propres cartes SIM.",
            color = MaterialTheme.colorScheme.secondaryContainer,
            fontSize = 12.5.sp,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(Modifier.height(18.dp))

        ClipPresentation(
            modifier = Modifier
                .fillMaxWidth(0.6f)
                .aspectRatio(16f / 9f)
        )
    }
}

/**
 * Clip muet en boucle, dans un cadre arrondi.
 *
 * Trois garde-fous, parce qu'un téléphone passerelle doit rester sobre :
 *  - rien n'est affiché si les animations système sont désactivées ;
 *  - la lecture s'arrête dès que l'app passe en arrière-plan ;
 *  - le lecteur est libéré quand l'écran quitte la composition.
 */
@Composable
private fun ClipPresentation(modifier: Modifier = Modifier) {
    val contexte = LocalContext.current
    val cycleDeVie = LocalLifecycleOwner.current.lifecycle
    val animationsSysteme = remember(contexte) {
        Settings.Global.getFloat(
            contexte.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) > 0f
    }

    // « Moins d'animations » : pas de clip du tout, plutôt qu'une image figée.
    if (!animationsSysteme) return

    val lecteur = remember(contexte) {
        VideoView(contexte).apply {
            setOnPreparedListener { mp ->
                mp.isLooping = true
                mp.setVolume(0f, 0f) // muet : aucun son, donc aucune permission
            }
            setVideoURI(Uri.parse("android.resource://${contexte.packageName}/${R.raw.presentation}"))
        }
    }

    DisposableEffect(cycleDeVie, lecteur) {
        val observateur = LifecycleEventObserver { _, evenement ->
            when (evenement) {
                Lifecycle.Event.ON_RESUME -> lecteur.start()
                Lifecycle.Event.ON_PAUSE -> lecteur.pause()
                else -> Unit
            }
        }
        cycleDeVie.addObserver(observateur)
        if (cycleDeVie.currentState.isAtLeast(Lifecycle.State.RESUMED)) lecteur.start()
        onDispose {
            cycleDeVie.removeObserver(observateur)
            lecteur.stopPlayback()
        }
    }

    Box(
        modifier = modifier
            .shadow(20.dp, RoundedCornerShape(20.dp), spotColor = NeonShadowColor)
            .clip(RoundedCornerShape(20.dp))
            .background(Color.Black),
    ) {
        AndroidView(factory = { lecteur }, modifier = Modifier.fillMaxSize())
    }
}

/* ================= SLIDE 2 ================= */
@Composable
private fun SlideOnboarding2() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Titre centré 23px font 800 #0F172A avec « envoyer mieux » en dégradé
        Text(
            text = buildAnnotatedString {
                withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.ExtraBold, fontSize = 23.sp)) {
                    append("Tout ce qu'il faut\npour ")
                }
                withStyle(
                    SpanStyle(
                        brush = Brush.linearGradient(listOf(GradientIndigoStart, Color(0xFF38BDF8))),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 23.sp
                    )
                ) {
                    append("envoyer mieux")
                }
            },
            textAlign = TextAlign.Center,
            lineHeight = 30.sp
        )

        Spacer(Modifier.height(24.dp))

        // Liste de 4 cartes blanches radius 15px
        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            CarteFonctionnalite(
                icone = Icons.AutoMirrored.Filled.Send,
                fondIcone = Color(0xFFECFDF5),
                couleurIcone = Color(0xFF059669),
                titre = "Envoi via vos cartes SIM",
                sousTitre = "SMS réels, débit 20 SMS/h par téléphone"
            )

            CarteFonctionnalite(
                icone = Icons.Filled.BarChart,
                fondIcone = Color(0xFFEFF6FF),
                couleurIcone = Color(0xFF2563EB),
                titre = "Suivi en temps réel",
                sousTitre = "Remis, échecs, file d'attente, quota"
            )

            CarteFonctionnalite(
                icone = Icons.Filled.Wifi,
                fondIcone = Color(0xFFF5F3FF),
                couleurIcone = Color(0xFF7C3AED),
                titre = "Multi-SIM & reprise auto",
                sousTitre = "Rotation toutes les 10 envois, retry 30 s"
            )

            CarteFonctionnalite(
                icone = Icons.Filled.Notifications,
                fondIcone = Color(0xFFFFFBEB),
                couleurIcone = Color(0xFFD97706),
                titre = "Réponses notifiées",
                sousTitre = "Webhook instantané vers votre application"
            )
        }
    }
}

/* ================= SLIDE 3 (Exact Screenshot) ================= */
@Composable
private fun SlideOnboarding3() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo officiel SMSTSIKA 150px centré
        Image(
            painter = painterResource(id = R.drawable.logo_app),
            contentDescription = "Logo SMSTSIKA",
            modifier = Modifier
                .size(150.dp)
                .shadow(32.dp, RoundedCornerShape(38.dp), spotColor = NeonShadowColor)
                .clip(RoundedCornerShape(38.dp)),
            contentScale = ContentScale.Fit
        )

        Spacer(Modifier.height(28.dp))

        // Titre "Prêt en 5 minutes" avec "5 minutes" en dégradé texte
        Text(
            text = buildAnnotatedString {
                withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.ExtraBold, fontSize = 23.sp)) {
                    append("Prêt en ")
                }
                withStyle(
                    SpanStyle(
                        brush = Brush.linearGradient(listOf(GradientIndigoStart, Color(0xFF38BDF8))),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 23.sp
                    )
                ) {
                    append("5 minutes")
                }
            },
            textAlign = TextAlign.Center,
            lineHeight = 30.sp
        )

        Spacer(Modifier.height(12.dp))

        // Sous-titre centré
        Text(
            text = "Installez l'app sur votre téléphone, scannez le QR depuis votre console web, et votre passerelle est en ligne.",
            color = MaterialTheme.colorScheme.secondaryContainer,
            fontSize = 12.5.sp,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(Modifier.height(22.dp))

        // 2 cartes blanches numérotées
        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            // Carte 1 : Connectez-vous à votre espace
            CarteEtapeNumerotee(
                numero = "1",
                fondNumero = Color(0xFFECFDF5),
                couleurNumero = Color(0xFF059669),
                titre = "Connectez-vous à votre espace",
                sousTitre = "Votre compte SMSTSIKA"
            )

            // Carte 2 : Scannez le QR de liaison
            CarteEtapeNumerotee(
                numero = "2",
                fondNumero = Color(0xFFEFF6FF),
                couleurNumero = Color(0xFF2563EB),
                titre = "Scannez le QR de liaison",
                sousTitre = "Parc d'envoi → Associer un téléphone"
            )
        }
    }
}

/* Carte Fonctionnalité Onboarding */
@Composable
private fun CarteFonctionnalite(
    icone: androidx.compose.ui.graphics.vector.ImageVector,
    fondIcone: Color,
    couleurIcone: Color,
    titre: String,
    sousTitre: String
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 6.dp,
                shape = RoundedCornerShape(15.dp),
                ambientColor = Color(0xFF23204D).copy(alpha = 0.06f),
                spotColor = Color(0xFF23204D).copy(alpha = 0.06f)
            )
            .clip(RoundedCornerShape(15.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(15.dp))
            .padding(horizontal = 13.dp, vertical = 11.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(fondIcone),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icone,
                    contentDescription = null,
                    tint = couleurIcone,
                    modifier = Modifier.size(17.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    text = titre,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(1.dp))
                Text(
                    text = sousTitre,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.5.sp
                )
            }
        }
    }
}

/* Carte Étape Numérotée Onboarding Slide 3 */
@Composable
private fun CarteEtapeNumerotee(
    numero: String,
    fondNumero: Color,
    couleurNumero: Color,
    titre: String,
    sousTitre: String
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 6.dp,
                shape = RoundedCornerShape(15.dp),
                ambientColor = Color(0xFF23204D).copy(alpha = 0.06f),
                spotColor = Color(0xFF23204D).copy(alpha = 0.06f)
            )
            .clip(RoundedCornerShape(15.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(15.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(fondNumero),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = numero,
                    color = couleurNumero,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    text = titre,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(1.dp))
                Text(
                    text = sousTitre,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp
                )
            }
        }
    }
}
