import Cocoa

let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)

image.lockFocus()

let bounds = NSRect(origin: .zero, size: size)

// 1. macOS Squircle App Background
let bgPath = NSBezierPath(roundedRect: bounds, xRadius: 224, yRadius: 224)
let bgGradient = NSGradient(colors: [
    NSColor(calibratedRed: 0.12, green: 0.32, blue: 0.92, alpha: 1.0), // Royal Blue
    NSColor(calibratedRed: 0.18, green: 0.15, blue: 0.72, alpha: 1.0), // Deep Indigo
    NSColor(calibratedRed: 0.08, green: 0.06, blue: 0.38, alpha: 1.0)  // Midnight Violet
], atLocations: [0.0, 0.55, 1.0], colorSpace: .sRGB)!

bgGradient.draw(in: bgPath, angle: -45)

// Subtle Inner Border / Specular Rim
let borderPath = NSBezierPath(roundedRect: bounds.insetBy(dx: 10, dy: 10), xRadius: 214, yRadius: 214)
NSColor(calibratedWhite: 1.0, alpha: 0.18).setStroke()
borderPath.lineWidth = 6
borderPath.stroke()

// Ambient Light Bloom in top-left
let bloomPath = NSBezierPath(ovalIn: NSRect(x: 100, y: 550, width: 450, height: 450))
let bloomGrad = NSGradient(colors: [
    NSColor(calibratedRed: 0.4, green: 0.7, blue: 1.0, alpha: 0.35),
    NSColor(calibratedRed: 0.3, green: 0.5, blue: 1.0, alpha: 0.0)
])!
bloomGrad.draw(in: bloomPath, relativeCenterPosition: .zero)

// 2. Central Paper / Specification Document (White Glassmorphic Sheet)
let sheetRect = NSRect(x: 212, y: 160, width: 600, height: 704)
let sheetPath = NSBezierPath(roundedRect: sheetRect, xRadius: 52, yRadius: 52)

// Card Drop Shadow
let shadow = NSShadow()
shadow.shadowOffset = NSSize(width: 0, height: -22)
shadow.shadowBlurRadius = 48
shadow.shadowColor = NSColor(calibratedRed: 0.02, green: 0.02, blue: 0.15, alpha: 0.45)
shadow.set()

NSColor(calibratedWhite: 0.98, alpha: 0.96).setFill()
sheetPath.fill()

// Reset Shadow
NSShadow().set()

// Card subtle border
NSColor(calibratedWhite: 1.0, alpha: 0.9).setStroke()
sheetPath.lineWidth = 4
sheetPath.stroke()

// 3. Document Header Bar inside sheet
let headerRect = NSRect(x: 252, y: 740, width: 520, height: 76)
let headerPath = NSBezierPath(roundedRect: headerRect, xRadius: 20, yRadius: 20)
let headerGrad = NSGradient(colors: [
    NSColor(calibratedRed: 0.22, green: 0.42, blue: 0.96, alpha: 1.0),
    NSColor(calibratedRed: 0.38, green: 0.25, blue: 0.92, alpha: 1.0)
])!
headerGrad.draw(in: headerPath, angle: 0)

// Header Text: "TEST ANALYSIS"
let headerTitle = "TEST ANALYSIS"
let headerFont = NSFont.systemFont(ofSize: 28, weight: .black)
let headerAttr: [NSAttributedString.Key: Any] = [
    .font: headerFont,
    .foregroundColor: NSColor.white,
    .kern: 3.0
]
let headerStr = NSAttributedString(string: headerTitle, attributes: headerAttr)
let hSize = headerStr.size()
headerStr.draw(at: NSPoint(x: headerRect.midX - hSize.width / 2, y: headerRect.midY - hSize.height / 2 + 1))

// 4. Two-Way Matrix Grid (雙向細目表網格: Units x 3 Cognitive Levels)
let tableRect = NSRect(x: 252, y: 220, width: 520, height: 480)
let tableBg = NSBezierPath(roundedRect: tableRect, xRadius: 24, yRadius: 24)
NSColor(calibratedRed: 0.94, green: 0.96, blue: 0.99, alpha: 1.0).setFill()
tableBg.fill()

// Table Header Row: 4 columns (單元, 知識, 應用, 評鑑)
let colX: [CGFloat] = [268, 396, 524, 652]
let colW: CGFloat = 108

let colTitles = ["單元", "知識", "應用", "評鑑"]
let colColors = [
    NSColor(calibratedRed: 0.35, green: 0.42, blue: 0.52, alpha: 1.0),
    NSColor(calibratedRed: 0.15, green: 0.45, blue: 0.95, alpha: 1.0), // Blue (知識)
    NSColor(calibratedRed: 0.45, green: 0.22, blue: 0.88, alpha: 1.0), // Indigo (應用)
    NSColor(calibratedRed: 0.85, green: 0.25, blue: 0.55, alpha: 1.0)  // Violet (評鑑)
]

for c in 0..<4 {
    let chipRect = NSRect(x: colX[c], y: 642, width: colW, height: 42)
    let chipPath = NSBezierPath(roundedRect: chipRect, xRadius: 10, yRadius: 10)
    colColors[c].withAlphaComponent(0.12).setFill()
    chipPath.fill()
    
    let font = NSFont.systemFont(ofSize: 20, weight: .bold)
    let attr: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: colColors[c]]
    let str = NSAttributedString(string: colTitles[c], attributes: attr)
    let s = str.size()
    str.draw(at: NSPoint(x: chipRect.midX - s.width / 2, y: chipRect.midY - s.height / 2))
}

// 4 Matrix Data Rows
let rowY: [CGFloat] = [548, 456, 364, 272]
let unitLabels = ["Unit 1", "Unit 2", "Unit 3", "Unit 4"]

let cellScores: [[(String, Int)]] = [
    [("4", 1), ("2", 2), ("1", 3)],
    [("2", 1), ("4", 2), ("2", 3)],
    [("3", 1), ("3", 2), ("2", 3)],
    [("5", 1), ("2", 2), ("0", 0)]
]

for r in 0..<4 {
    let y = rowY[r]
    
    // Unit tag
    let uRect = NSRect(x: colX[0], y: y, width: colW, height: 68)
    let uPath = NSBezierPath(roundedRect: uRect, xRadius: 14, yRadius: 14)
    NSColor.white.setFill()
    uPath.fill()
    NSColor(calibratedWhite: 0.88, alpha: 1.0).setStroke()
    uPath.lineWidth = 1.5
    uPath.stroke()
    
    let uFont = NSFont.systemFont(ofSize: 18, weight: .heavy)
    let uAttr: [NSAttributedString.Key: Any] = [.font: uFont, .foregroundColor: NSColor(calibratedRed: 0.2, green: 0.25, blue: 0.35, alpha: 1.0)]
    let uStr = NSAttributedString(string: unitLabels[r], attributes: uAttr)
    let us = uStr.size()
    uStr.draw(at: NSPoint(x: uRect.midX - us.width / 2, y: uRect.midY - us.height / 2))
    
    // 3 Cognitive Domain score pills
    for c in 0..<3 {
        let cellRect = NSRect(x: colX[c+1], y: y, width: colW, height: 68)
        let cellPath = NSBezierPath(roundedRect: cellRect, xRadius: 14, yRadius: 14)
        
        let (val, type) = cellScores[r][c]
        if type > 0 {
            let color = colColors[type]
            color.withAlphaComponent(0.14).setFill()
            cellPath.fill()
            color.withAlphaComponent(0.35).setStroke()
            cellPath.lineWidth = 1.5
            cellPath.stroke()
            
            let valFont = NSFont.systemFont(ofSize: 26, weight: .black)
            let valAttr: [NSAttributedString.Key: Any] = [.font: valFont, .foregroundColor: color]
            let valStr = NSAttributedString(string: val, attributes: valAttr)
            let vs = valStr.size()
            valStr.draw(at: NSPoint(x: cellRect.midX - vs.width / 2, y: cellRect.midY - vs.height / 2))
        } else {
            NSColor(calibratedWhite: 0.96, alpha: 1.0).setFill()
            cellPath.fill()
            let dashFont = NSFont.systemFont(ofSize: 22, weight: .bold)
            let dashStr = NSAttributedString(string: "—", attributes: [.font: dashFont, .foregroundColor: NSColor.lightGray])
            let ds = dashStr.size()
            dashStr.draw(at: NSPoint(x: cellRect.midX - ds.width / 2, y: cellRect.midY - ds.height / 2))
        }
    }
}

// 5. Intelligent AI Sparkle Star (Top Right of Sheet)
func drawSparkle(center: NSPoint, outerRadius: CGFloat, innerRadius: CGFloat, color: NSColor) {
    let path = NSBezierPath()
    let points = 4
    for i in 0..<(points * 2) {
        let angle = Double(i) * Double.pi / Double(points)
        let r = (i % 2 == 0) ? outerRadius : innerRadius
        let pt = NSPoint(x: center.x + CGFloat(cos(angle)) * r, y: center.y + CGFloat(sin(angle)) * r)
        if i == 0 { path.move(to: pt) } else { path.line(to: pt) }
    }
    path.close()
    color.setFill()
    path.fill()
}

// Brilliant AI Sparkle floating on top-right corner
let sparkleCenter = NSPoint(x: 770, y: 790)
let sparkleGlow = NSBezierPath(ovalIn: NSRect(x: sparkleCenter.x - 70, y: sparkleCenter.y - 70, width: 140, height: 140))
let sparkleGrad = NSGradient(colors: [
    NSColor(calibratedRed: 1.0, green: 0.85, blue: 0.25, alpha: 0.65),
    NSColor(calibratedRed: 0.95, green: 0.45, blue: 0.15, alpha: 0.0)
])!
sparkleGrad.draw(in: sparkleGlow, relativeCenterPosition: .zero)

drawSparkle(center: sparkleCenter, outerRadius: 64, innerRadius: 18, color: NSColor(calibratedRed: 1.0, green: 0.88, blue: 0.28, alpha: 1.0))
drawSparkle(center: sparkleCenter, outerRadius: 36, innerRadius: 12, color: NSColor.white)
drawSparkle(center: NSPoint(x: 700, y: 840), outerRadius: 24, innerRadius: 7, color: NSColor(calibratedRed: 0.4, green: 0.85, blue: 1.0, alpha: 0.95))

image.unlockFocus()

// Save to PNG
let outPath = "/Users/chiahua/.gemini/antigravity/scratch/TestAnls/build/icon_1024.png"
if let tiff = image.tiffRepresentation,
   let rep = NSBitmapImageRep(data: tiff),
   let png = rep.representation(using: .png, properties: [:]) {
    try? png.write(to: URL(fileURLWithPath: outPath))
    print("SUCCESS: \(outPath)")
} else {
    print("FAILED")
}
