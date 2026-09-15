package com.mitia.smsgateway

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.mitia.smsgateway.ui.theme.SmsGatewayTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SmsGatewayTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MainScreen(
                        modifier = Modifier.padding(innerPadding),
                        onStartServiceClick = { startSmsGatewayService() }
                    )
                }
            }
        }
    }

    private fun startSmsGatewayService() {
        val intent = Intent(this, SmsGatewayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}

@Composable
fun MainScreen(modifier: Modifier = Modifier, onStartServiceClick: () -> Unit = {}) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var serverUrl by remember { mutableStateOf("") }
    var savedMessage by remember { mutableStateOf("") }

    // Charge l'URL persistée (ou le défaut) à l'ouverture.
    LaunchedEffect(Unit) {
        val url = DevicePreferences.getServerUrl(context)
        serverUrl = url
        ApiClient.setBaseUrl(url)
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "SMS-GATEWAY")
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it; savedMessage = "" },
            label = { Text("Adresse serveur (http://IP:3001)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = {
                scope.launch {
                    DevicePreferences.saveServerUrl(context, serverUrl)
                    val normalized = DevicePreferences.getServerUrl(context)
                    serverUrl = normalized
                    ApiClient.setBaseUrl(normalized)
                    savedMessage = "Adresse enregistrée : $normalized"
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Enregistrer l'adresse")
        }
        if (savedMessage.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = savedMessage)
        }
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onStartServiceClick, modifier = Modifier.fillMaxWidth()) {
            Text("Démarrer le service")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "Change de WiFi ? Mets à jour l'IP ci-dessus, enregistre, puis redémarre le service.")
    }
}

@Preview(showBackground = true)
@Composable
fun MainScreenPreview() {
    SmsGatewayTheme {
        MainScreen()
    }
}
