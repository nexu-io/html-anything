import { iconSprite } from "../index.js";
import { forwardRef } from "react";
import type { Icon, IconProps } from "@phosphor-icons/react";
export type { Icon, IconProps } from "@phosphor-icons/react";

/** Remix Icon 4.9.1, shared with the OpenDesign reference design system.
 * Legacy weight props remain compatible; only explicit fill selects a filled variant.
 * Paths are bundled locally, so the editor needs no icon CDN or network request.
 */
const filledVariants = new Set(["add-fill", "alert-fill", "align-item-left-fill", "anticlockwise-fill", "apps-2-fill", "arrow-down-s-fill", "arrow-go-back-fill", "arrow-go-forward-fill", "arrow-left-fill", "arrow-right-fill", "arrow-right-s-fill", "arrow-right-up-fill", "arrow-up-fill", "braces-fill", "camera-fill", "camera-lens-fill", "chat-1-fill", "check-fill", "checkbox-blank-fill", "checkbox-circle-fill", "clapperboard-fill", "clipboard-fill", "clockwise-fill", "close-fill", "closed-captioning-fill", "code-s-slash-fill", "computer-fill", "cursor-fill", "delete-bin-fill", "download-2-fill", "drag-move-2-fill", "dropper-fill", "edit-fill", "equalizer-fill", "expand-horizontal-fill", "external-link-fill", "eye-fill", "eye-off-fill", "file-add-fill", "file-code-fill", "file-copy-fill", "file-fill", "file-image-fill", "file-text-fill", "file-video-fill", "film-fill", "flashlight-fill", "folder-add-fill", "folder-fill", "folder-open-fill", "fullscreen-exit-fill", "fullscreen-fill", "global-fill", "grid-fill", "history-fill", "home-fill", "image-fill", "information-fill", "layout-2-fill", "layout-column-fill", "loader-4-fill", "markdown-fill", "menu-fill", "moon-fill", "more-fill", "music-2-fill", "palette-fill", "pause-fill", "pen-nib-fill", "play-fill", "plug-fill", "question-fill", "refresh-fill", "repeat-fill", "robot-fill", "route-fill", "ruler-fill", "save-fill", "scissors-cut-fill", "scissors-fill", "search-fill", "settings-3-fill", "shield-check-fill", "side-bar-fill", "skip-left-fill", "skip-right-fill", "slideshow-fill", "sparkling-fill", "stack-fill", "subtract-fill", "sun-fill", "terminal-box-fill", "time-fill", "upload-2-fill", "voiceprint-fill", "volume-down-fill", "volume-mute-fill", "volume-up-fill", "zoom-in-fill", "zoom-out-fill"]);
export const RemixIcon = forwardRef<SVGSVGElement, IconProps & { name: string }>(
  function RemixIcon({ name, size = 16, weight, alt, mirrored, children, style, ...props }, ref) {
    const filled = name.replace(/-line$/, "-fill");
    const variant = weight === "fill" && filledVariants.has(filled) ? filled : name;
    return <svg ref={ref} width={size} height={size} viewBox="0 0 24 24"
      aria-hidden={alt ? undefined : true} aria-label={alt} {...props}
      fill="currentColor" stroke="none" data-remix-icon={variant}
      style={mirrored ? { ...style, transform: `${style?.transform ?? ""} scaleX(-1)` } : style}>
      {alt && <title>{alt}</title>}
      <use href={`${iconSprite}#ri-${variant}`} />
      {children}
    </svg>;
  },
);

function icon(name: string): Icon {
  const Component = forwardRef<SVGSVGElement, IconProps>((props, ref) => <RemixIcon {...props} name={name} ref={ref} />);
  Component.displayName = `RemixIcon(${name})`;
  return Component;
}

export const Aperture = icon("camera-lens-line");
export const ArrowClockwise = icon("clockwise-line");
export const ArrowCounterClockwise = icon("anticlockwise-line");
export const ArrowLeft = icon("arrow-left-line");
export const ArrowLineLeft = icon("skip-left-line");
export const ArrowLineRight = icon("skip-right-line");
export const ArrowSquareOut = icon("external-link-line");
export const ArrowsOutCardinal = icon("drag-move-2-line");
export const ArrowsOutLineHorizontal = icon("expand-horizontal-line");
export const BezierCurve = icon("pen-nib-line");
export const BracketsCurly = icon("braces-line");
export const Camera = icon("camera-line");
export const CaretDown = icon("arrow-down-s-line");
export const CaretRight = icon("arrow-right-s-line");
export const CaretRightIcon = icon("arrow-right-s-line");
export const ChartBarHorizontal = icon("timeline-view");
export const Check = icon("check-line");
export const CheckCircleIcon = icon("checkbox-circle-line");
export const ClipboardText = icon("clipboard-line");
export const Clock = icon("time-line");
export const ClockCounterClockwise = icon("history-line");
export const Code = icon("code-s-slash-line");
export const Copy = icon("file-copy-line");
export const CornersIn = icon("fullscreen-exit-line");
export const CornersOut = icon("fullscreen-line");
export const DotsThree = icon("more-line");
export const Eye = icon("eye-line");
export const EyeSlash = icon("eye-off-line");
export const Eyedropper = icon("dropper-line");
export const File = icon("file-line");
export const FileCode = icon("file-code-line");
export const FileCss = icon("file-code-line");
export const FileHtml = icon("file-code-line");
export const FileJpg = icon("file-image-line");
export const FileJs = icon("file-code-line");
export const FileJsx = icon("file-code-line");
export const FileMd = icon("markdown-line");
export const FilePlus = icon("file-add-line");
export const FilePng = icon("file-image-line");
export const FileSvg = icon("file-image-line");
export const FileTs = icon("file-code-line");
export const FileTsx = icon("file-code-line");
export const FileTxt = icon("file-text-line");
export const FileVideo = icon("file-video-line");
export const FilmSlate = icon("clapperboard-line");
export const FilmStrip = icon("film-line");
export const FolderSimple = icon("folder-line");
export const FolderSimplePlus = icon("folder-add-line");
export const FrameCorners = icon("focus-mode");
export const Gear = icon("settings-3-line");
export const GridFour = icon("grid-line");
export const Image = icon("image-line");
export const Layout = icon("layout-2-line");
export const Lightning = icon("flashlight-line");
export const Link = icon("link");
export const LinkSimple = icon("link");
export const Magnet = icon("align-item-left-line");
export const MagnetStraight = icon("align-item-left-line");
export const MagnifyingGlassMinus = icon("zoom-out-line");
export const MagnifyingGlassPlus = icon("zoom-in-line");
export const Minus = icon("subtract-line");
export const Monitor = icon("computer-line");
export const MusicNote = icon("music-2-line");
export const Palette = icon("palette-line");
export const Path = icon("route-line");
export const PencilSimple = icon("edit-line");
export const Plus = icon("add-line");
export const Presentation = icon("slideshow-line");
export const Ruler = icon("ruler-line");
export const Scissors = icon("scissors-line");
export const SlidersHorizontal = icon("equalizer-line");
export const SpeakerHigh = icon("volume-up-line");
export const SpeakerSlash = icon("volume-mute-line");
export const Square = icon("checkbox-blank-line");
export const SquareSplitVertical = icon("layout-column-line");
export const Sidebar = icon("side-bar-line");
export const Sparkle = icon("sparkling-line");
export const SquaresFour = icon("apps-2-line");
export const Stack = icon("stack-line");
export const TextAa = icon("font-size");
export const TextT = icon("text");
export const Trash = icon("delete-bin-line");
export const WarningIcon = icon("alert-line");
export const Waveform = icon("voiceprint-line");
export const X = icon("close-line");
export const XIcon = icon("close-line");

/** Focus the timeline viewport on the selected clip range. */
export const ZoomSelection = icon("focus-3-line");
