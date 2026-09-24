export default function BackendUnavailable({ children, compact = false }) {
  return (
    <div className={`backend-unavailable${compact ? " compact" : ""}`} role="status">
      <strong>BACKEND NON DISPONIBLE</strong>
      <span> — {children || "fonctionnalité non implémentée côté backend."}</span>
    </div>
  );
}
