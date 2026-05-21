// src/components/SheetsModal.jsx
// Google Sheets integration modal

import { useState, useEffect } from "react";

const APPS_SCRIPT = `// Electoral CRM — Google Apps Script
// ─────────────────────────────────────────────────────────────
// HOW TO DEPLOY:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Paste this entire code
// 4. Click Deploy → New deployment
// 5. Type: Web App
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Click Deploy → Copy the Web App URL
// 9. Paste that URL in the app under Sidebar → Google Sheets
// ─────────────────────────────────────────────────────────────

const SHEET_NAME = "Contacts";
const COLS = [
  "Timestamp","Name","Phone","WhatsApp",
  "Mandal","Panchayat","Village",
  "BoothNo","BoothName","Tag","Caste","Notes"
];

// Called when someone submits via GET (pull)
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;
  const result = data.map(row => {
    const obj = {};
    header.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Called when app pushes a new contact (POST)
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);
    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLS);
      sheet.getRange(1, 1, 1, COLS.length)
        .setFontWeight("bold")
        .setBackground("#4F46E5")
        .setFontColor("#ffffff");
    }
    const body = JSON.parse(e.postData.contents);
    if (body.action === "add") {
      sheet.appendRow([
        new Date().toISOString(),
        body.name    || "",
        body.phone   || "",
        body.wa      || "",
        body.mandal  || "",
        body.panchayat || "",
        body.village || "",
        body.bno     || "",
        body.bnm     || "",
        body.tag     || "",
        body.caste   || "",
        body.notes   || ""
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok", message: "Contact added" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function SheetsModal({ open, onClose, settings, onSave }) {
  const [url, setUrl] = useState(settings.sheetsUrl || "");
  useEffect(() => { if (open) setUrl(settings.sheetsUrl || ""); }, [open]);

  const copy = () =>
    navigator.clipboard.writeText(APPS_SCRIPT)
      .then(() => alert("✅ Apps Script code copied! Now paste it in Google Sheets → Extensions → Apps Script"));

  const C = {
    primary: "#4F46E5", primaryLight: "#EEF2FF",
    teal: "#0D9488", tealLight: "#CCFBF1",
    gray200: "#E5E7EB", gray400: "#9CA3AF", gray600: "#4B5563", gray900: "#111827",
    white: "#FFFFFF", gray50: "#F9FAFB", gray100: "#F3F4F6",
  };

  if (!open) return null;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "30px 16px", overflowY: "auto", backdropFilter: "blur(3px)" }}
    >
      <div style={{ background: C.white, borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,.18)", padding: "24px 26px", width: 640, maxHeight: "90vh", overflowY: "auto", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.gray900 }}>🔗 Google Sheets Integration</span>
          <button onClick={onClose} style={{ background: C.gray100, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray600 }}>✕</button>
        </div>

        {/* Status badge */}
        <div style={{ background: url ? "#D1FAE5" : "#FEF3C7", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 600, color: url ? "#065F46" : "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{url ? "✅" : "⚠️"}</span>
          {url ? "Google Sheets is connected. New contacts will sync automatically." : "Not connected yet. Follow the steps below to connect."}
        </div>

        {/* Step by step */}
        <div style={{ background: C.primaryLight, borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 12, color: C.primary, lineHeight: 1.9 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13 }}>📋 One-time setup (~5 minutes)</div>
          <div><b>Step 1.</b> Open Google Sheets → create a new sheet → name the first sheet tab <b>"Contacts"</b></div>
          <div><b>Step 2.</b> Click <b>Extensions → Apps Script</b></div>
          <div><b>Step 3.</b> Delete any existing code → paste the script below</div>
          <div><b>Step 4.</b> Click <b>Deploy → New deployment → Web App</b></div>
          <div><b>Step 5.</b> Set <b>Execute as: Me</b> and <b>Who has access: Anyone</b> → click Deploy</div>
          <div><b>Step 6.</b> Copy the <b>Web App URL</b> → paste it below → Save</div>
        </div>

        {/* Script block */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gray900 }}>Apps Script code</span>
            <button
              onClick={copy}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${C.primary}`, background: C.primaryLight, color: C.primary, fontFamily: "inherit" }}
            >
              📋 Copy code
            </button>
          </div>
          <pre style={{ background: C.gray50, border: `1.5px solid ${C.gray200}`, borderRadius: 10, padding: "10px 14px", fontSize: 10, maxHeight: 160, overflow: "auto", whiteSpace: "pre-wrap", color: C.gray600, lineHeight: 1.6 }}>
            {APPS_SCRIPT}
          </pre>
        </div>

        {/* URL input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.gray400, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
            Web App URL
          </label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: `1.5px solid ${C.gray200}`, borderRadius: 9, background: C.white, color: C.gray900, outline: "none", fontFamily: "inherit" }}
          />
          {url && !/^https:\/\/script\.google\.com/.test(url) && (
            <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, fontWeight: 500 }}>⚠ URL should start with https://script.google.com</div>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: C.tealLight, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#0F766E", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>How it works after setup:</div>
          <div>• Every new contact added in this app is <b>automatically sent to your Google Sheet</b></div>
          <div>• Field workers can also submit contacts directly via the Google Sheet</div>
          <div>• Use the <b>"⬇️ Pull"</b> button in the top bar to import new rows from the Sheet into this app</div>
          <div>• Duplicate phone numbers are automatically skipped during pull</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", background: C.gray100, color: C.gray600, border: `1px solid ${C.gray200}`, fontFamily: "inherit" }}>Cancel</button>
          <button
            onClick={() => { onSave(url); onClose(); }}
            style={{ padding: "9px 18px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg,#4F46E5,#3730A3)`, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(79,70,229,.35)", fontFamily: "inherit" }}
          >
            ✓ Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}