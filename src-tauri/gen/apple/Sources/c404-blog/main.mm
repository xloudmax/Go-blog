#include "bindings/bindings.h"
#import "C404_Blog-Swift.h"
#import <WebKit/WebKit.h>

// 递归查找 WebView
static WKWebView* findWebViewInView(UIView *view) {
    if ([view isKindOfClass:[WKWebView class]]) return (WKWebView *)view;
    for (UIView *subview in view.subviews) {
        WKWebView *found = findWebViewInView(subview);
        if (found) return found;
    }
    return nil;
}

static void startProbing(int retryCount) {
    if (retryCount <= 0) {
        NSLog(@"[ERROR] 🛑 Webview search failed finally.");
        return;
    }

    WKWebView *found = nil;
    for (UIWindow *window in [[UIApplication sharedApplication] windows]) {
        found = findWebViewInView(window);
        if (found) break;
    }

    if (found) {
        NSLog(@"[DEBUG] 🎯 Found WebView! Activating Native Bar...");
        [[BottomBarManager shared] setupWithWebview:found];
    } else {
        NSLog(@"[DEBUG] ⏳ Probing WebView (remaining %d)...", retryCount);
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            startProbing(retryCount - 1);
        });
    }
}

int main(int argc, char * argv[]) {
    // 调度探测任务
    dispatch_async(dispatch_get_main_queue(), ^{
        startProbing(15);
    });

    // 启动 Tauri (阻塞调用)
	ffi::start_app();
    
    return 0; // 显式返回 int
}
