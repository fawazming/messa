package expo.modules.messasms

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class MessaSmsModule : Module() {

  private val requestCounter = AtomicInteger(1)
  private val pendingPromises = ConcurrentHashMap<Int, Promise>()
  private var receiverRegistered = false

  private val sentAction = "expo.modules.messasms.SMS_SENT"

  private val sentReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      val requestCode = intent.getIntExtra(EXTRA_REQUEST_CODE, -1)
      val promise = pendingPromises.remove(requestCode) ?: return
      if (resultCode == Activity.RESULT_OK) {
        promise.resolve(mapOf("success" to true))
      } else {
        promise.resolve(
          mapOf(
            "success" to false,
            "error" to "SMS service unavailable (code $resultCode)"
          )
        )
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MessaSms")

    Events("onSmsSent", "onSmsFailed")

    OnCreate {
      registerReceiverIfNeeded()
    }

    OnDestroy {
      pendingPromises.values.forEach { promise ->
        promise.resolve(mapOf("success" to false, "error" to "Module deallocated"))
      }
      pendingPromises.clear()
      unregisterReceiver()
    }

    Function("isAvailable") { true }

    AsyncFunction("getSubscriptionsAsync") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(emptyList<Map<String, Any?>>())
        return@AsyncFunction
      }
      try {
        promise.resolve(readSubscriptions(context))
      } catch (exception: SecurityException) {
        promise.reject(
          "E_SIM_PERMISSION",
          "READ_PHONE_STATE permission is required to list SIM subscriptions.",
          exception
        )
      } catch (exception: Exception) {
        promise.reject("E_SIM_UNAVAILABLE", "Unable to read SIM subscriptions.", exception)
      }
    }

    AsyncFunction("sendSmsAsync") { subscriptionId: Int, destination: String, message: String, promise: Promise ->
      sendSms(subscriptionId, destination, message, promise)
    }
  }

  private fun sendSms(
    subscriptionId: Int,
    destination: String,
    message: String,
    promise: Promise
  ) {
    val context = appContext.reactContext
    if (context == null) {
      promise.resolve(mapOf("success" to false, "error" to "No Android context available"))
      return
    }
    if (destination.isBlank()) {
      promise.resolve(mapOf("success" to false, "error" to "Missing destination number"))
      return
    }
    if (message.isBlank()) {
      promise.resolve(mapOf("success" to false, "error" to "Message is empty"))
      return
    }

    registerReceiverIfNeeded()

    val requestCode = requestCounter.getAndIncrement()
    pendingPromises[requestCode] = promise

    val sentIntent = buildSentIntent(context, requestCode)

    try {
      val smsManager = resolveSmsManager(context, subscriptionId)
      val parts = smsManager.divideMessage(message)

      if (parts.size <= 1) {
        smsManager.sendTextMessage(destination, null, message, sentIntent, null)
      } else {
        val sentIntents = ArrayList<PendingIntent>(parts.size)
        for (index in parts.indices) {
          sentIntents.add(sentIntent)
        }
        smsManager.sendMultipartTextMessage(destination, null, parts, sentIntents, null)
      }
    } catch (exception: Exception) {
      pendingPromises.remove(requestCode)?.let {
        it.resolve(
          mapOf(
            "success" to false,
            "error" to (exception.message ?: "SMS could not be sent")
          )
        )
      }
    }
  }

  private fun buildSentIntent(context: Context, requestCode: Int): PendingIntent {
    val intent = Intent(sentAction)
    intent.setPackage(context.packageName)
    intent.putExtra(EXTRA_REQUEST_CODE, requestCode)

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(context, requestCode, intent, flags)
  }

  private fun resolveSmsManager(context: Context, subscriptionId: Int): SmsManager {
    if (subscriptionId <= 0) {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(SmsManager::class.java)
      } else {
        @Suppress("DEPRECATION")
        SmsManager.getDefault()
      }
    }

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(SmsManager::class.java).createForSubscriptionId(subscriptionId)
    } else {
      @Suppress("DEPRECATION")
      SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
    }
  }

  @Suppress("MissingPermission")
  private fun readSubscriptions(context: Context): List<Map<String, Any?>> {
    val manager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE)
      as? SubscriptionManager
      ?: return emptyList()

    val infos = manager.activeSubscriptionInfoList ?: return emptyList()

    return infos.map { info ->
      mapOf(
        "subscriptionId" to info.subscriptionId,
        "slotIndex" to info.simSlotIndex,
        "displayName" to (info.displayName?.toString() ?: "SIM ${info.simSlotIndex + 1}"),
        "carrierName" to info.carrierName?.toString(),
        "phoneNumber" to info.number
      )
    }
  }

  private fun registerReceiverIfNeeded() {
    if (receiverRegistered) return
    val context = appContext.reactContext ?: return
    try {
      ContextCompat.registerReceiver(
        context,
        sentReceiver,
        IntentFilter(sentAction),
        ContextCompat.RECEIVER_NOT_EXPORTED
      )
      receiverRegistered = true
    } catch (_: Exception) {
      receiverRegistered = false
    }
  }

  private fun unregisterReceiver() {
    if (!receiverRegistered) return
    val context = appContext.reactContext
    if (context != null) {
      try {
        context.unregisterReceiver(sentReceiver)
      } catch (_: Exception) {
        // Receiver was already unregistered.
      }
    }
    receiverRegistered = false
  }

  companion object {
    private const val EXTRA_REQUEST_CODE = "requestCode"
  }
}
