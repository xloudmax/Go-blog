import SwiftUI

@available(iOS 15.0, *)
struct LiquidBottomBar: View {
    var onTabSelected: (Int) -> Void
    @State private var selectedIndex = 0
    @State private var dragX: CGFloat = 0
    @State private var isDragging = false
    
    struct TabItem: Identifiable {
        let id: Int
        let title: String
        let image: String
    }
    
    let tabs = [
        TabItem(id: 0, title: "首页", image: "house.fill"),
        TabItem(id: 1, title: "搜索", image: "magnifyingglass"),
        TabItem(id: 2, title: "Insight", image: "bolt.horizontal.circle.fill"),
        TabItem(id: 3, title: "分类", image: "square.grid.2x2.fill"),
        TabItem(id: 4, title: "我的", image: "person.fill")
    ]
    
    private let barWidth: CGFloat = 350
    private let barHeight: CGFloat = 64
    
    var body: some View {
        let tabWidth = barWidth / CGFloat(tabs.count)
        ZStack {
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.12), radius: 20, x: 0, y: 10)
            
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color.white.opacity(0.85))
                .frame(width: tabWidth - 10, height: barHeight - 12)
                .offset(x: isDragging ? dragX : (CGFloat(selectedIndex) * tabWidth) - (barWidth / 2) + (tabWidth / 2), y: 0)
                .animation(.spring(response: 0.35, dampingFraction: 0.8), value: selectedIndex)
            
            HStack(spacing: 0) {
                ForEach(tabs) { tab in
                    VStack(spacing: 4) {
                        Image(systemName: tab.image).font(.system(size: 18))
                        Text(tab.title).font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(selectedIndex == tab.id ? .black : .primary.opacity(0.45))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .frame(width: barWidth, height: barHeight)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { value in
                    isDragging = true
                    dragX = value.location.x - barWidth/2
                }
                .onEnded { value in
                    isDragging = false
                    let newIndex = Int(max(0, min(CGFloat(tabs.count - 1), (value.location.x / tabWidth).rounded(.down))))
                    selectedIndex = newIndex
                    onTabSelected(newIndex)
                }
        )
    }
}
