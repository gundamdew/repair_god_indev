package pl.repairgod.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.webkit.JavascriptInterface;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Enable edge-to-edge layout so content extends behind status and navigation bars
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Make both bars completely transparent
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // Disable contrast enforcement on Android 10+ (API 29+) to eliminate gray scrims
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // Apply light theme system bar icons by default
        applyTheme(false);

        // Expose a JavaScript interface to dynamically adjust status & navigation bar icons
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void setDarkMode(boolean isDark) {
                    runOnUiThread(() -> applyTheme(isDark));
                }
            }, "AndroidThemeBridge");
        }
    }

    private void applyTheme(boolean isDark) {
        Window window = getWindow();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            // Light status/nav bars mean dark icons (for light backgrounds)
            controller.setAppearanceLightStatusBars(!isDark);
            controller.setAppearanceLightNavigationBars(!isDark);
        }
    }
}
