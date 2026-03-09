import SwiftUI

@MainActor
class ArticleState: ObservableObject {
    @Published var title: String = "正在阅读：深度学习入门"
    @Published var author: String = "Xloudmax"
    
    static let shared = ArticleState()
}

enum NativeTab: Int, CaseIterable {
    case home, search, insight, tags, profile

    var title: String {
        switch self {
        case .home: return "首页"
        case .search: return "搜索"
        case .insight: return "Insight"
        case .tags: return "分类"
        case .profile: return "我的"
        }
    }

    var image: String {
        switch self {
        case .home: return "house.fill"
        case .search: return "magnifyingglass"
        case .insight: return "bolt.horizontal.circle.fill"
        case .tags: return "square.grid.2x2.fill"
        case .profile: return "person.fill"
        }
    }
}

// MARK: - Components

@available(iOS 15.0, *)
struct ArticleInfoView: View {
    var size: CGSize
    @ObservedObject var state = ArticleState.shared
    
    var body: some View {
        HStack(spacing: 12) {
            Group {
                if #available(iOS 16.0, *) {
                    RoundedRectangle(cornerRadius: size.height / 4)
                        .fill(.blue.gradient)
                } else {
                    RoundedRectangle(cornerRadius: size.height / 4)
                        .fill(.blue)
                }
            }
            .frame(width: size.width, height: size.height)
            .overlay {
                Image(systemName: "doc.text.fill")
                    .foregroundStyle(.white.opacity(0.8))
                    .font(.system(size: size.width * 0.5))
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(state.title)
                    .font(.system(size: 14, weight: .semibold))
                
                Text(state.author)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            .lineLimit(1)
        }
    }
}

@available(iOS 15.0, *)
struct MiniPlayerView: View {
    var body: some View {
        HStack(spacing: 15) {
            ArticleInfoView(size: .init(width: 38, height: 38))
            
            Spacer(minLength: 0)
            
            HStack(spacing: 20) {
                Button {
                    // Play/Pause logic
                } label: {
                    Image(systemName: "play.fill")
                        .font(.title3)
                }

                Button {
                    // Forward logic
                } label: {
                    Image(systemName: "forward.fill")
                        .font(.title3)
                }
            }
            .foregroundStyle(.primary)
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 8)
    }
}

// MARK: - Main Content

@available(iOS 15.0, *)
struct NativeBottomBarContent: View {
    var onTabSelected: (Int) -> Void
    @State private var selectedIndex: Int = 0
    @State private var expandMiniPlayer: Bool = false
    @Namespace private var animation
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // 1. Tab Bar Container
            VStack(spacing: 0) {
                // Mini Player floating above
                let miniPlayer = MiniPlayerView()
                    .padding(.horizontal, 8)
                    .background {
                        if #available(iOS 26.0, *) {
                            Rectangle()
                                .glassEffect(.regular.interactive())
                        } else {
                            Rectangle()
                                .fill(.ultraThinMaterial)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .onTapGesture {
                        withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                            expandMiniPlayer.toggle()
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                    .shadow(color: .black.opacity(0.1), radius: 10, y: 5)
                
                if #available(iOS 18.0, *) {
                    miniPlayer
                        .matchedTransitionSource(id: "ARTICLE_PLAYER", in: animation)
                } else {
                    miniPlayer
                }

                // The actual Tab Bar
                barHStack()
                    .padding(.vertical, 10)
                    .padding(.horizontal, 8)
                    .background {
                        if #available(iOS 26.0, *) {
                            Rectangle().glassEffect(.regular.interactive())
                        } else {
                            Rectangle().fill(.ultraThinMaterial)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
                    .padding(.horizontal, 16)
                    .shadow(color: .black.opacity(0.15), radius: 12, y: 4)
            }
            .padding(.bottom, 4) // Spacing from bottom of screen
        }
        .fullScreenCover(isPresented: $expandMiniPlayer) {
            FullArticlePlayerView(isPresented: $expandMiniPlayer, animation: animation)
        }
    }

    @ViewBuilder
    private func barHStack() -> some View {
        GeometryReader { geometry in
            let tabWidth = geometry.size.width / CGFloat(NativeTab.allCases.count)
            
            ZStack(alignment: .leading) {
                // The Sliding Selection Pill (The "Slider")
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(.primary.opacity(0.1))
                    .frame(width: tabWidth - 16, height: 48)
                    .background {
                        if #available(iOS 26.0, *) {
                            RoundedRectangle(cornerRadius: 24, style: .continuous)
                                .glassEffect(.regular.interactive())
                        } else {
                            RoundedRectangle(cornerRadius: 24, style: .continuous)
                                .fill(.ultraThinMaterial)
                        }
                    }
                    .offset(x: CGFloat(selectedIndex) * tabWidth + 8, y: geometry.size.height / 2 - 24)
                    .shadow(color: .black.opacity(0.05), radius: 5, y: 2)

                HStack(spacing: 0) {
                    ForEach(NativeTab.allCases, id: \.self) { tab in
                        Button {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.8, blendDuration: 0)) {
                                selectedIndex = tab.rawValue
                            }
                            onTabSelected(tab.rawValue)
                        } label: {
                            VStack(spacing: 3) {
                                Image(systemName: tab.image)
                                    .font(.system(size: 18, weight: selectedIndex == tab.rawValue ? .semibold : .regular))
                                    .modifier(BounceModifier(isSelected: selectedIndex == tab.rawValue))
                                Text(tab.title)
                                    .font(.system(size: 10, weight: .bold))
                            }
                            .foregroundStyle(selectedIndex == tab.rawValue ? .primary : .secondary)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .frame(height: 56)
    }
}

@available(iOS 15.0, *)
struct FullArticlePlayerView: View {
    @Binding var isPresented: Bool
    var animation: Namespace.ID
    @ObservedObject var state = ArticleState.shared
    
    var body: some View {
        let content = ScrollView {
            VStack(spacing: 30) {
                // Top Handle
                Capsule()
                    .fill(.secondary.opacity(0.5))
                    .frame(width: 36, height: 5)
                    .padding(.top, 10)
                
                // Hero Image / Cover
                Group {
                    if #available(iOS 16.0, *) {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(.blue.gradient)
                    } else {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(.blue)
                    }
                }
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Image(systemName: "doc.text.fill")
                        .foregroundStyle(.white.opacity(0.5))
                        .font(.system(size: 100))
                }
                .padding(.horizontal, 30)
                .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 20)
                
                // Info
                VStack(spacing: 8) {
                    Text(state.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    Text("作者：\(state.author)")
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 30)
                
                // Controls Group
                VStack(spacing: 40) {
                    // Progress Bar
                    Slider(value: .constant(0.4))
                        .tint(.primary)
                    
                    HStack(spacing: 50) {
                        Image(systemName: "backward.fill")
                        Image(systemName: "play.fill")
                            .font(.system(size: 44))
                        Image(systemName: "forward.fill")
                    }
                    .font(.title)
                }
                .padding(.horizontal, 40)
                
                Spacer()
                
                Button {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                        isPresented = false
                    }
                } label: {
                    Text("收起阅读器")
                        .fontWeight(.bold)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(.ultraThinMaterial, in: Capsule())
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 20)
            }
            .frame(maxWidth: .infinity)
        }
        .background(.background)
        
        if #available(iOS 18.0, *) {
            content
                .navigationTransition(.zoom(sourceID: "ARTICLE_PLAYER", in: animation))
        } else {
            content
        }
    }
}

@available(iOS 15.0, *)
struct BounceModifier: ViewModifier {
    let isSelected: Bool
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.symbolEffect(.bounce, value: isSelected)
        } else {
            content
        }
    }
}
