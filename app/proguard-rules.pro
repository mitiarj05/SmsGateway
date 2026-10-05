# Conserve les noms pour la réflexion Gson (DTO réseau + cache local) :
# sans ça, R8 renomme les champs et le parsing JSON casse en silence.
-keepattributes Signature
-keep class com.mitia.smsgateway.domain.model.** { *; }

# Firebase Auth / Messaging embarquent déjà leurs règles consumer ;
# on garde les points d'entrée du SDK par sécurité.
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
