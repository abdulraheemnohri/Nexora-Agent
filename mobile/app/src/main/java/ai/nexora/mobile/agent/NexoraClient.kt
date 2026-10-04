package ai.nexora.mobile.agent
import okhttp3.*
import org.json.JSONObject
class NexoraClient(private val baseUrl:String="http://10.0.2.2:8000") {
 private val http=OkHttpClient()
 fun chat(message:String, callback:(String)->Unit) {
  val body=JSONObject().put("message",message).put("provider","local").toString().toRequestBody("application/json".toMediaType())
  val req=Request.Builder().url("$baseUrl/v1/chat/completions").post(body).build()
  http.newCall(req).enqueue(object:Callback{
   override fun onFailure(call:Call,e:java.io.IOException){callback("Connection failed")}
   override fun onResponse(call:Call,r:Response){r.use{callback(JSONObject(it.body?.string()?:"{}").optString("response","No response"))}}
  })
 }
}
