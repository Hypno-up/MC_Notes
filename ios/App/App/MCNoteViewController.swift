import UIKit
import WebKit
import Capacitor

/**
 * Pendant iOS de MainActivity : le WKWebView n'offre ni window.print(), ni
 * téléchargement d'un lien <a download>, et son Wake Lock n'est pas fiable.
 * La page passe donc par trois messages, appelés depuis index.html via
 * window.webkit.messageHandlers :
 *
 *   impression       (titre)            → service d'impression, qui sait aussi enregistrer un PDF
 *   ecranAllume      (true / false)     → empêche la mise en veille pendant la lecture
 *   partagerFichier  ({nom, contenu})   → feuille de partage (Fichiers, AirDrop, Mail…)
 */
class MCNoteViewController: CAPBridgeViewController, WKScriptMessageHandler {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        guard let controleur = webView?.configuration.userContentController else { return }
        // Relais faible : le WKUserContentController retient fortement ses
        // destinataires, ce qui empêcherait sinon le contrôleur d'être libéré.
        let relais = RelaisFaible(cible: self)
        for nom in ["impression", "ecranAllume", "partagerFichier"] {
            controleur.add(relais, name: nom)
        }
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        UIApplication.shared.isIdleTimerDisabled = false
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        switch message.name {
        case "impression":
            imprimer(titre: message.body as? String)
        case "ecranAllume":
            UIApplication.shared.isIdleTimerDisabled = (message.body as? Bool) ?? false
        case "partagerFichier":
            guard let corps = message.body as? [String: Any],
                  let nom = corps["nom"] as? String,
                  let contenu = corps["contenu"] as? String else { return }
            partager(nom: nom, contenu: contenu)
        default:
            break
        }
    }

    // Le contenu imprimé est celui du WebView : la feuille @media print de
    // l'application ne laisse que le conducteur.
    private func imprimer(titre: String?) {
        guard let vue = webView else { return }
        let nom = (titre?.trimmingCharacters(in: .whitespaces)).flatMap { $0.isEmpty ? nil : $0 } ?? "Conducteur"

        let infos = UIPrintInfo(dictionary: nil)
        infos.jobName = nom
        infos.outputType = .general

        let impression = UIPrintInteractionController.shared
        impression.printInfo = infos
        impression.printFormatter = vue.viewPrintFormatter()

        if UIDevice.current.userInterfaceIdiom == .pad {
            let ancre = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            impression.present(from: ancre, in: view, animated: true)
        } else {
            impression.present(animated: true)
        }
    }

    private func partager(nom: String, contenu: String) {
        let fichier = FileManager.default.temporaryDirectory.appendingPathComponent(nom)
        do {
            try contenu.write(to: fichier, atomically: true, encoding: .utf8)
        } catch {
            return
        }
        let feuille = UIActivityViewController(activityItems: [fichier], applicationActivities: nil)
        if let ancre = feuille.popoverPresentationController {
            ancre.sourceView = view
            ancre.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            ancre.permittedArrowDirections = []
        }
        present(feuille, animated: true)
    }
}

private class RelaisFaible: NSObject, WKScriptMessageHandler {
    weak var cible: WKScriptMessageHandler?

    init(cible: WKScriptMessageHandler) {
        self.cible = cible
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        cible?.userContentController(userContentController, didReceive: message)
    }
}
