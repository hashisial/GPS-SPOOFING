export function SignalBackdrop() {
  return (
    <div className="gps-signal-backdrop" aria-hidden="true">
      <div className="gps-signal-backdrop__mesh" />
      <div className="gps-signal-backdrop__orbit gps-signal-backdrop__orbit--one" />
      <div className="gps-signal-backdrop__orbit gps-signal-backdrop__orbit--two" />
      <div className="gps-signal-backdrop__route gps-signal-backdrop__route--one" />
      <div className="gps-signal-backdrop__route gps-signal-backdrop__route--two" />
      <div className="gps-signal-backdrop__beacon gps-signal-backdrop__beacon--one" />
      <div className="gps-signal-backdrop__beacon gps-signal-backdrop__beacon--two" />
      <div className="gps-signal-backdrop__beacon gps-signal-backdrop__beacon--three" />
    </div>
  );
}
