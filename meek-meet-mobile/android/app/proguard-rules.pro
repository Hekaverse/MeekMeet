# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor / WebView
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.app.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.NativePlugin *;
}
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod *;
}

# Official Capacitor plugins live under com.capacitorjs.* and are loaded via reflection
-keep class com.capacitorjs.** { *; }
-keepattributes *Annotation*

# Keep JS interfaces for WebView
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Supabase / Auth callbacks
-keep class com.meekmeet.app.** { *; }
-keep class android.app.** { *; }
-keep class android.content.** { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# FileProvider
-keep class androidx.core.content.FileProvider { *; }
