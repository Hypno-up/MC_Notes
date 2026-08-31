package app.mcnote.v3;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * Le WebView Android ignore purement et simplement window.print(). Sans pont,
 * le bouton « Exporter » ne ferait rien dans l'application, alors qu'il
 * fonctionne sur la version web.
 *
 * On expose donc une unique methode vers le service d'impression du systeme,
 * qui sait aussi bien envoyer a une imprimante qu'enregistrer un PDF. Le
 * contenu imprime est celui du WebView : la feuille de style @media print de
 * l'application se charge de ne laisser que le conducteur.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView vue = getBridge().getWebView();
        vue.addJavascriptInterface(new PontImpression(vue), "ImpressionAndroid");
    }

    private class PontImpression {
        private final WebView vue;

        PontImpression(WebView vue) {
            this.vue = vue;
        }

        // Appelee depuis le fil JavaScript : l'impression doit repartir sur le
        // fil principal, sinon Android refuse l'operation.
        @JavascriptInterface
        public void imprimer(final String titre) {
            final String nom = (titre == null || titre.trim().isEmpty()) ? "Conducteur" : titre;
            vue.post(new Runnable() {
                @Override
                public void run() {
                    PrintManager gestionnaire =
                            (PrintManager) MainActivity.this.getSystemService(Context.PRINT_SERVICE);
                    if (gestionnaire == null) return;
                    gestionnaire.print(nom,
                            vue.createPrintDocumentAdapter(nom),
                            new PrintAttributes.Builder().build());
                }
            });
        }
    }
}
