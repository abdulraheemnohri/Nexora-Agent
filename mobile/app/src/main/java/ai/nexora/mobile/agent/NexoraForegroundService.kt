package ai.nexora.mobile.agent
import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
class NexoraForegroundService: Service() {
 override fun onCreate(){super.onCreate(); val ch="nexora_agent"; val nm=getSystemService(NotificationManager::class.java); nm.createNotificationChannel(NotificationChannel(ch,"Nexora Agent",NotificationManager.IMPORTANCE_LOW)); startForeground(1001,NotificationCompat.Builder(this,ch).setContentTitle("Nexora Agent").setContentText("Agent service active").setSmallIcon(android.R.drawable.ic_dialog_info).build())}
 override fun onStartCommand(i:Intent?,flags:Int,id:Int)=START_STICKY
 override fun onBind(i:Intent?):IBinder?=null
}
