import UIKit
import SwiftUI
import WebKit

@MainActor
@objc(BottomBarManager)
class BottomBarManager: NSObject, WKScriptMessageHandler {
    private static let instance = BottomBarManager()
    @objc(shared) class func shared() -> BottomBarManager { return instance }

    var barHostingController: UIViewController?
    var webview: WKWebView?

    @objc(setupWithWebview:)
    func setup(webview: WKWebView) {
        print("[DEBUG] Swift: Setup with Webview")
        self.webview = webview
        
        // Register message handler for JS -> Swift communication
        webview.configuration.userContentController.add(self, name: "updateArticle")
        
        if #available(iOS 15.0, *) {
            setupNativeBar(webview: webview)
        }
    }

    // Handle messages from JS
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "updateArticle", let body = message.body as? [String: String] {
            let title = body["title"] ?? "正在阅读"
            let author = body["author"] ?? "Xloudmax"
            
            DispatchQueue.main.async {
                ArticleState.shared.title = title
                ArticleState.shared.author = author
                print("[DEBUG] Swift: Updated article state from JS: \(title) by \(author)")
            }
        }
    }

    @available(iOS 15.0, *)
    private func setupNativeBar(webview: WKWebView) {
        guard let parentView = webview.superview else {
            print("[DEBUG] Swift: WebView has no superview")
            return
        }

        let bar = NativeBottomBarContent { index in
            let js = "window.dispatchEvent(new CustomEvent('tab-changed', { detail: { index: \(index) } }))"
            self.webview?.evaluateJavaScript(js)
        }

        let hostingController = UIHostingController(rootView: bar)
        hostingController.view.backgroundColor = .clear
        hostingController.view.isOpaque = false
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false

        parentView.addSubview(hostingController.view)

        NSLayoutConstraint.activate([
            hostingController.view.leadingAnchor.constraint(equalTo: parentView.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: parentView.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: parentView.bottomAnchor),
        ])

        // Keep a reference to prevent deallocation
        self.barHostingController = hostingController

        print("[DEBUG] Swift: Native bottom bar added as subview")
    }
}
