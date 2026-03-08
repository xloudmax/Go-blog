import UIKit
import SwiftUI
import WebKit

@MainActor
@objc(BottomBarManager)
class BottomBarManager: NSObject {
    private static let instance = BottomBarManager()
    @objc(shared) class func shared() -> BottomBarManager { return instance }
    
    var overlayWindow: UIWindow?
    var webview: WKWebView?

    @objc(setupWithWebview:)
    func setup(webview: WKWebView) {
        print("[DEBUG] 🚀 Swift: Setup with Webview")
        self.webview = webview
        
        // 只有 iOS 15+ 才执行原生 Bar 注入
        if #available(iOS 15.0, *) {
            setupNativeBar(webview: webview)
        } else {
            print("[DEBUG] ⚠️ iOS 14 detected, skipping native bar.")
        }
    }
    
    @available(iOS 15.0, *)
    private func setupNativeBar(webview: WKWebView) {
        webview.isOpaque = false
        webview.backgroundColor = .clear
        webview.scrollView.backgroundColor = .clear
        
        guard let windowScene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else { return }
        
        let win = UIWindow(windowScene: windowScene)
        win.windowLevel = .statusBar + 1
        win.backgroundColor = .clear
        
        let bar = LiquidBottomBar { index in
            let js = "window.__TAURI__.event.emit('tab-changed', { index: \(index) })"
            self.webview?.evaluateJavaScript(js)
        }
        
        let rootView = ZStack(alignment: .bottom) {
            Color.clear.ignoresSafeArea()
            VStack {
                Spacer()
                bar.padding(.bottom, 24)
                   .border(Color.red, width: 3) // 调试红框
            }
        }
        
        win.rootViewController = UIHostingController(rootView: AnyView(rootView))
        win.rootViewController?.view.backgroundColor = .clear
        win.isHidden = false
        self.overlayWindow = win
        print("[DEBUG] ✅ Swift: Overlay Window Visible")
    }
}
