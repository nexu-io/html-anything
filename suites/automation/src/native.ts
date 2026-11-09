/** Read-only diagnostic SPI. Never linked into the product Electron runtime. */
export const swift = String.raw`import AppKit
import Foundation
import Darwin

var sequence = 0
func emit(_ data: [String: Any]) {
    sequence += 1
    var value = data
    value["time"] = Date().timeIntervalSince1970 * 1000
    value["sequence"] = sequence
    guard let bytes = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
          let text = String(data: bytes, encoding: .utf8) else { exit(2) }
    print(text)
    fflush(stdout)
}
func unavailable(_ reason: String) -> Never {
    emit(["event": "error", "reason": reason])
    exit(2)
}
guard CommandLine.arguments.count == 2 else { unavailable("bundle argument required") }
let bundle = CommandLine.arguments[1]
guard let library = dlopen("/System/Library/PrivateFrameworks/SkyLight.framework/SkyLight", RTLD_LAZY),
      let connectionSymbol = dlsym(library, "SLSMainConnectionID"),
      let spacesSymbol = dlsym(library, "SLSCopyManagedDisplaySpaces") else {
    unavailable("read-only native Space symbols unavailable")
}
typealias Connection = @convention(c) () -> Int32
typealias Spaces = @convention(c) (Int32) -> Unmanaged<CFArray>?
typealias Display = @convention(c) (Int32) -> Unmanaged<CFString>?
let connection = unsafeBitCast(connectionSymbol, to: Connection.self)
let spaces = unsafeBitCast(spacesSymbol, to: Spaces.self)
let displaySymbol = dlsym(library, "SLSCopyActiveMenuBarDisplayIdentifier")
func snapshot() -> [String: Any] {
    guard let raw = spaces(connection()),
          let displays = (raw.takeRetainedValue() as NSArray) as? [[String: Any]], !displays.isEmpty else {
        unavailable("native Space snapshot unavailable")
    }
    var result: [[String: Any]] = []
    for item in displays {
        guard let display = item["Display Identifier"] as? String,
              let current = item["Current Space"] as? [String: Any],
              let identifier = (current["ManagedSpaceID"] ?? current["id64"]) as? NSNumber,
              let type = current["type"] as? NSNumber else { unavailable("unsupported native Space format") }
        result.append(["display": display, "id": identifier.stringValue, "type": type.intValue])
    }
    var active: String?
    if let symbol = displaySymbol {
        let copyDisplay = unsafeBitCast(symbol, to: Display.self)
        if let value = copyDisplay(connection()) { active = value.takeRetainedValue() as String }
    }
    if active == nil && result.count == 1 { active = result[0]["display"] as? String }
    guard let active else { unavailable("active native display unavailable") }
    return ["activeDisplay": active, "spaces": result]
}
let workspace = NSWorkspace.shared
let center = workspace.notificationCenter
let activation = center.addObserver(forName: NSWorkspace.didActivateApplicationNotification,
                                    object: nil, queue: .main) { notification in
    if let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication {
        emit(["event": "activate", "pid": Int(app.processIdentifier)])
    }
}
var priorSpaces = ""
var priorPolicy: [Int: String] = [:]
var lastSample = Date.distantPast
let timer = Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { _ in
    let current = snapshot()
    guard let bytes = try? JSONSerialization.data(withJSONObject: current, options: [.sortedKeys]),
          let key = String(data: bytes, encoding: .utf8) else { unavailable("cannot encode snapshot") }
    if key != priorSpaces {
        priorSpaces = key
        emit(["event": "space", "snapshot": current])
    }
    if Date().timeIntervalSince(lastSample) >= 0.1 {
        lastSample = Date()
        emit(["event": "sample", "snapshot": current])
    }
    for app in workspace.runningApplications where app.bundleIdentifier == bundle {
        let pid = Int(app.processIdentifier)
        let state = "\(app.activationPolicy.rawValue):\(app.isActive)"
        if priorPolicy[pid] != state {
            priorPolicy[pid] = state
            emit(["event": "policy", "pid": pid, "policy": app.activationPolicy.rawValue, "active": app.isActive])
        }
    }
}
signal(SIGTERM, SIG_IGN)
func stop() {
    timer.invalidate()
    center.removeObserver(activation)
    emit(["event": "stopped"])
    exit(0)
}
let termination = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)
termination.setEventHandler { stop() }
termination.resume()
DispatchQueue.global(qos: .utility).async {
    while readLine() != nil {}
    DispatchQueue.main.async { stop() }
}
emit(["event": "sample", "snapshot": snapshot()])
RunLoop.main.run()
`;
