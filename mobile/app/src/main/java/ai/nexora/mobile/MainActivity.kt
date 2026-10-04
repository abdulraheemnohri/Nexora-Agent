package ai.nexora.mobile
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.nexora.mobile.agent.NexoraClient
class MainActivity: ComponentActivity() {
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { NexoraApp() } }
}
@Composable fun NexoraApp() {
 var input by remember { mutableStateOf("") }; var answer by remember { mutableStateOf("Nexora mobile is ready.") }
 val client=remember{NexoraClient()}
 MaterialTheme { Scaffold(topBar={TopAppBar(title={Text("Nexora Mobile")})}) { p ->
  Column(Modifier.padding(p).padding(16.dp).fillMaxSize()) {
   Text("Local-first AI operator", style=MaterialTheme.typography.titleMedium)
   Spacer(Modifier.height(12.dp)); Text(answer,Modifier.weight(1f).fillMaxWidth())
   Row { TextField(input,{input=it},Modifier.weight(1f),placeholder={Text("Ask Nexora…")})
    Button(onClick={ { val q=input; input=""; client.chat(q){answer=it} }},enabled=input.isNotBlank()) { Text("Send") } }
  }
 }}
}
