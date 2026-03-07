@import "tailwindcss";

* { box-sizing: border-box; }

body {
  margin: 0; padding: 0;
  background: #c6c7c5;
  font-family: 'Segoe UI', 'Tahoma', 'Helvetica', sans-serif;
  overflow: hidden;
  height: 100vh; width: 100vw; color: #333;
  font-size: 12px;
}

#root { height: 100vh; width: 100vw; }

.window { margin: 0 !important; }

.sprite14-thumb {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 68px; height: 68px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid #b0b2b4;
  background: #fff;
  position: relative;
}
.sprite14-thumb:hover { border-color: #6090d0; background: #f0f4ff; }
.sprite14-thumb.selected {
  border-color: #4080cc;
  background: #e0ecff;
  box-shadow: 0 0 0 2px rgba(64,128,204,0.3);
}
.sprite14-thumb-name {
  font-size: 8px; color: #555;
  text-align: center; max-width: 60px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-top: 2px;
}

.scratch14-stage-bg {
  background: #fff;
  border: 2px inset #b0b0b0;
}

.scratch14-sprite-panel {
  background: linear-gradient(180deg, #e0e2e4 0%, #d0d2d4 100%);
}

.viewport-grid {
  background-image:
    linear-gradient(rgba(60,120,200,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(60,120,200,0.06) 1px, transparent 1px);
  background-size: 20px 20px;
}

.viewport-object { position: absolute; cursor: move; }
.viewport-object:hover { outline: 2px solid rgba(74,144,217,0.5); outline-offset: 1px; }
.viewport-object.selected { outline: 2px solid #4a90d9; outline-offset: 1px; }

.console-line {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 10px; padding: 1px 6px;
  border-bottom: 1px solid #eee;
  color: #333;
}
.console-line.error { color: #cc3333; background: #fff0f0; }
.console-line.warn { color: #996600; background: #fffae0; }
.console-line.info { color: #336699; }

.scratch14-community-header {
  background: linear-gradient(180deg, #4e7ec2 0%, #3965a5 100%);
  padding: 16px 24px;
  color: #fff;
}
.scratch14-community-nav {
  background: linear-gradient(180deg, #e8eaec 0%, #d5d7d9 100%);
  border-bottom: 1px solid #aaa;
  display: flex;
  padding: 0 16px;
}
.scratch14-community-nav-item {
  padding: 8px 16px; font-size: 12px; color: #555;
  cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600;
}
.scratch14-community-nav-item:hover { color: #333; background: rgba(0,0,0,0.04); }
.scratch14-community-nav-item.active { color: #2a5ea0; border-bottom-color: #2a5ea0; }

.scratch14-project-card {
  background: #fff; border: 1px solid #ccc; border-radius: 6px;
  overflow: hidden; cursor: pointer; transition: box-shadow 0.15s;
}
.scratch14-project-card:hover {
  box-shadow: 0 3px 12px rgba(0,0,0,0.15); border-color: #4e7ec2;
}
.scratch14-project-thumb {
  width: 100%; height: 100px;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  background: linear-gradient(135deg, #e8ecf2 0%, #d0d6e0 100%);
  border-bottom: 1px solid #ddd;
}

/* =============================================
   GOOGLE BLOCKLY GERAS — 3D GRADIENT SHADOW
   ============================================= */

.blocklyMainBackground {
  fill: #d6d8da !important;
}

.blocklyToolboxDiv {
  background: linear-gradient(180deg, #d8dade 0%, #c0c2c6 100%) !important;
  border-right: 1px solid #888 !important;
  overflow: hidden !important;
  font-family: 'Segoe UI', sans-serif !important;
  padding: 2px 0 !important;
}

.blocklyTreeRow {
  border-radius: 3px !important;
  margin: 1px 4px !important;
  padding: 3px 8px !important;
  height: auto !important;
  line-height: 18px !important;
}
.blocklyTreeRow:hover {
  background: rgba(100,150,220,0.2) !important;
}
.blocklyTreeSelected {
  background: rgba(100,150,220,0.35) !important;
}
.blocklyTreeLabel {
  font-size: 11px !important;
  font-weight: 600 !important;
  font-family: 'Segoe UI', sans-serif !important;
}

.blocklyFlyoutBackground {
  fill: #e4e6e8 !important;
  fill-opacity: 0.97 !important;
}

/* MAIN BLOCK — gradient shadow on bottom */
.blocklyPath {
  stroke-width: 1px !important;
  filter: drop-shadow(0px 2px 1px rgba(0,0,0,0.3)) !important;
}

/* DARK EDGE — bottom/right shadow for 3D depth */
.blocklyPathDark {
  display: block !important;
  visibility: visible !important;
  fill: none !important;
  stroke-width: 3px !important;
  stroke-opacity: 0.5 !important;
  filter: drop-shadow(0px 1px 0px rgba(0,0,0,0.2)) !important;
}

/* LIGHT EDGE — top/left highlight for 3D shine */
.blocklyPathLight {
  display: block !important;
  visibility: visible !important;
  stroke-width: 3px !important;
  stroke-opacity: 0.7 !important;
  filter: drop-shadow(0px -1px 0px rgba(255,255,255,0.3)) !important;
}

/* Block text */
.blocklyText {
  font-family: 'Lucida Grande', 'Segoe UI', sans-serif !important;
  font-size: 11px !important;
  font-weight: bold !important;
  fill: #fff !important;
  filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.4)) !important;
}

.blocklyNonEditableText > text,
.blocklyEditableText > text {
  fill: #fff !important;
}

.blocklyDropdownText {
  fill: #fff !important;
  font-size: 11px !important;
  font-weight: bold !important;
  filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.3)) !important;
}

/* Input fields */
.blocklyEditableText > rect,
.blocklyEditableText > .blocklyFieldRect {
  rx: 3 !important;
  ry: 3 !important;
  fill: rgba(0,0,0,0.15) !important;
  stroke: rgba(0,0,0,0.25) !important;
  stroke-width: 1px !important;
}

/* Selected block */
.blocklySelected > .blocklyPath {
  stroke: #fc3 !important;
  stroke-width: 2.5px !important;
  filter: drop-shadow(0px 2px 1px rgba(0,0,0,0.3)) drop-shadow(0 0 6px rgba(255,204,51,0.5)) !important;
}

/* Dragging block */
.blocklyDragging > .blocklyPath {
  filter: drop-shadow(4px 8px 8px rgba(0,0,0,0.4)) !important;
}

/* Insertion marker */
.blocklyInsertionMarker > .blocklyPath {
  fill: rgba(0,0,0,0.12) !important;
  stroke: none !important;
  filter: none !important;
}

/* Connection highlight */
.blocklyHighlightedConnectionPath {
  stroke: #fc3 !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 5px rgba(255,204,51,0.6)) !important;
}

/* Scrollbars */
.blocklyScrollbarHandle {
  rx: 3 !important;
  ry: 3 !important;
  fill: #a0a5ad !important;
  stroke: #888d95 !important;
}
.blocklyScrollbarBackground {
  fill: #dfe1e3 !important;
}

/* Trashcan and zoom */
.blocklyTrash { opacity: 0.5; }
.blocklyTrash:hover { opacity: 1; }
.blocklyZoom > image { opacity: 0.5; }
.blocklyZoom > image:hover { opacity: 1; }

/* Comments */
.blocklyCommentRect {
  fill: #fffde7 !important;
  stroke: #e6a800 !important;
  rx: 3 !important;
  ry: 3 !important;
  filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.15)) !important;
}

/* =============================================
   HIDE BLOCKLY ARTIFACTS
   ============================================= */
.injectionDiv {
  overflow: hidden !important;
  clip: rect(0, auto, auto, 0) !important;
}

article[role="tabpanel"][hidden] {
  display: none !important;
  height: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
}
article[role="tabpanel"][hidden] * {
  display: none !important;
  overflow: hidden !important;
  visibility: hidden !important;
}

.blockly-container-wrapper {
  overflow: hidden !important;
  position: relative !important;
}
.blockly-container-wrapper:empty {
  display: none !important;
}

.blocklyScrollbarHorizontal,
.blocklyScrollbarVertical {
  z-index: 1 !important;
  transition: opacity 0.3s ease !important;
}

/* =============================================
   STICKY NOTES
   ============================================= */
.sticky-note { pointer-events: all !important; }
.sticky-note .window {
  box-shadow: 2px 3px 10px rgba(0,0,0,0.3) !important;
}
.sticky-note .window:hover {
  box-shadow: 2px 3px 14px rgba(0,0,0,0.4) !important;
}
.sticky-note .title-bar { cursor: grab !important; user-select: none; }
.sticky-note textarea {
  font-family: 'Segoe UI', sans-serif !important;
  line-height: 1.4;
}

/* =============================================
   MISC
   ============================================= */
.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid #ccc;
  border-top-color: #4580c4;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

ul[role="menubar"] > li { font: var(--w7-font); }

section.tabs { display: flex; flex-direction: column; }
section.tabs > article[role="tabpanel"] { flex: 1; overflow: hidden; }
