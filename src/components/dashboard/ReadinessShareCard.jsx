import React, { useRef } from "react";
import html2canvas from "html2canvas";

/**
 * Hook: returns { cardRef, shareCard }
 * shareCard({ score, level, sectionScores, examDate, targetTest, userName })
 *   - captures the ReadinessShareCardTemplate via html2canvas
 *   - tries Web Share API (mobile), falls back to PNG download (desktop)
 */
export function useReadinessShareCard() {
  const cardRef = useRef(null);

  const shareCard = async ({ score, level, sectionScores, examDate, targetTest, userName }) => {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const dataUrl = canvas.toDataURL("image/png");

    // Try Web Share API (mobile)
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "my-readiness-card.png", { type: "image/png" });
        const shareData = {
          title: "My Language Exam Readiness",
          text: `I'm ${score}% ready for my ${targetTest} exam! Check out this app: ykiprepmaster.com`,
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // fall through to download
      }
    }

    // Desktop fallback: download image
    const link = document.createElement("a");
    link.download = "my-readiness-card.png";
    link.href = dataUrl;
    link.click();
  };

  return { cardRef, shareCard };
}

/**
 * Hidden card element — rendered off-screen, captured by html2canvas.
 * Must be in the DOM when shareCard() is called.
 */
export function ReadinessShareCardTemplate({ cardRef, score, level, sectionScores, examDate, targetTest, userName }) {
  const daysLeft = examDate
    ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const sectionEmoji = (s) => (s >= 70 ? "✅" : "⚠️");

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "480px",
        padding: "32px",
        background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
        borderRadius: "16px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>
            YKI Prep Master
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700" }}>
            {userName || "Language Learner"}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            {targetTest} Preparation
          </div>
        </div>
        {daysLeft !== null && (
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 16px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>{daysLeft}</div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>days to go</div>
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: "16px", opacity: 0.9, marginTop: "4px" }}>Ready for the exam</div>
        <div style={{ fontSize: "13px", opacity: 0.7, marginTop: "4px" }}>{level}</div>
      </div>

      {/* Section scores */}
      {sectionScores && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
          {Object.entries(sectionScores).map(([section, val]) => (
            <div
              key={section}
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 12px" }}
            >
              <div style={{ fontSize: "11px", opacity: 0.7, textTransform: "capitalize" }}>
                {sectionEmoji(val)} {section}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>{val}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "12px", opacity: 0.6, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "12px" }}>
        ykiprepmaster.com
      </div>
    </div>
  );
}
