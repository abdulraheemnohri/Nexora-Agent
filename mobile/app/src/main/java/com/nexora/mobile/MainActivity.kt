package com.nexora.mobile
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { NexoraApp(::openTermux) } }
    private fun openTermux() { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/termux/termux-app"))) }
}
@Composable
fun NexoraApp(openTermux: () -> Unit) {
    var gateway by remember { mutableStateOf("http://127.0.0.1:8000") }
    var token by remember { mutableStateOf("") }
    var tab by remember { mutableStateOf(0) }
    MaterialTheme(darkColorScheme()) {
        Column(Modifier.fillMaxSize().padding(18.dp)) {
            Text("NEXORA", style=MaterialTheme.typography.headlineMedium)
            Text("Mobile edge console", color=MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(14.dp))
            TabRow(selectedTabIndex=tab) { listOf("Agent","Terminal","Device").forEachIndexed { i,n -> Tab(selected=i==tab,onClick={tab=i},text={Text(n)}) } }
            Spacer(Modifier.height(14.dp))
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                when(tab) {
                    0 -> { OutlinedTextField(gateway,{gateway=it},label={Text("Nexora gateway URL")},modifier=Modifier.fillMaxWidth()); Spacer(Modifier.height(8.dp)); OutlinedTextField(token,{token=it},label={Text("Bearer token")},modifier=Modifier.fillMaxWidth()); Spacer(Modifier.height(12.dp)); Text("Connect this phone to your Debian/Linux Nexora gateway. The mobile app is an edge client.") }
                    1 -> { Text("Linux terminal environment",style=MaterialTheme.typography.titleLarge); Spacer(Modifier.height(8.dp)); Text("A normal Android APK is sandboxed; it cannot honestly claim to be a general Linux distribution. Nexora uses Termux as the terminal runtime."); Spacer(Modifier.height(12.dp)); Button(onClick=openTermux,modifier=Modifier.fillMaxWidth()){Text("Open Termux")}; Spacer(Modifier.height(8.dp)); Text("Inside Termux, run mobile/termux/install-nexora.sh from the Nexora repository.") }
                    else -> { Text("Device tools",style=MaterialTheme.typography.titleLarge); Spacer(Modifier.height(8.dp)); Text("Reserved for explicit, user-approved Android actions. Screen interaction uses Android's Accessibility Service framework when implemented and authorized.") }
                }
            }
            Text("Local-first • Human approval • No hidden device control",style=MaterialTheme.typography.labelSmall)
        }
    }
}