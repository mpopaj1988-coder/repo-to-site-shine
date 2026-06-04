import * as React from "react";

interface PropertyFormProps {
  initialValues?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
}

export function PropertyForm({ initialValues, onSave, saving }: PropertyFormProps) {
  const [slug, setSlug] = React.useState(String(initialValues?.slug ?? ""));
  const [propertyName, setPropertyName] = React.useState(String(initialValues?.property_name ?? ""));
  const [wifiNetwork, setWifiNetwork] = React.useState(String(initialValues?.wifi_network ?? ""));
  const [wifiPassword, setWifiPassword] = React.useState(String(initialValues?.wifi_password ?? ""));
  const [checkInTime, setCheckInTime] = React.useState(String(initialValues?.check_in_time ?? "4:00 PM"));
  const [checkoutTime, setCheckoutTime] = React.useState(String(initialValues?.checkout_time ?? "10:00 AM"));
  const [parking, setParking] = React.useState(String(initialValues?.parking ?? ""));
  const [trash, setTrash] = React.useState(String(initialValues?.trash ?? ""));
  const [emergencyContact, setEmergencyContact] = React.useState(
    String(initialValues?.emergency_contact ?? "")
  );
  const [guideSlug, setGuideSlug] = React.useState(String(initialValues?.guide_slug ?? ""));
  const [notes, setNotes] = React.useState<string[]>(
    Array.isArray(initialValues?.notes) ? (initialValues.notes as string[]) : []
  );
  const [isActive, setIsActive] = React.useState(
    initialValues?.is_active !== undefined ? Boolean(initialValues.is_active) : true
  );
  const [newNote, setNewNote] = React.useState("");

  const addNote = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setNewNote("");
  };

  const removeNote = (i: number) => setNotes((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      slug: slug.trim().toLowerCase(),
      property_name: propertyName.trim(),
      wifi_network: wifiNetwork.trim(),
      wifi_password: wifiPassword.trim(),
      check_in_time: checkInTime.trim(),
      checkout_time: checkoutTime.trim(),
      parking: parking.trim() || null,
      trash: trash.trim() || null,
      emergency_contact: emergencyContact.trim(),
      guide_slug: guideSlug.trim() || null,
      notes,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      <Section title="Property basics">
        <Field label="Property name *">
          <input
            required
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            style={inputStyle}
            placeholder="Waterfront 3BR Tampa"
          />
        </Field>
        <Field
          label="URL slug *"
          hint="Used in your WiFi guide URL: /wifi/your-slug. Lowercase, letters, numbers, hyphens only."
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#999", fontSize: "14px", whiteSpace: "nowrap" }}>/wifi/</span>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              style={inputStyle}
              placeholder="my-property"
            />
          </div>
        </Field>
      </Section>

      <Section title="WiFi">
        <Field label="Network name">
          <input value={wifiNetwork} onChange={(e) => setWifiNetwork(e.target.value)} style={inputStyle} placeholder="MyNetwork_5G" />
        </Field>
        <Field label="Password">
          <input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} style={inputStyle} placeholder="supersecretpassword" />
        </Field>
      </Section>

      <Section title="Stay details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Check-in time">
            <input value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} style={inputStyle} placeholder="4:00 PM" />
          </Field>
          <Field label="Check-out time">
            <input value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} style={inputStyle} placeholder="10:00 AM" />
          </Field>
        </div>
        <Field label="Parking instructions (optional)">
          <textarea value={parking} onChange={(e) => setParking(e.target.value)} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Free parking in driveway — room for 2 cars." />
        </Field>
        <Field label="Trash instructions (optional)">
          <textarea value={trash} onChange={(e) => setTrash(e.target.value)} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Trash pickup Mondays. Bins in garage." />
        </Field>
        <Field label="Emergency contact">
          <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} style={inputStyle} placeholder="555-555-5555" />
        </Field>
      </Section>

      <Section title="House notes">
        <div style={{ marginBottom: "16px" }}>
          {notes.map((note, i) => (
            <div key={i} style={noteItemStyle}>
              <span style={{ flex: 1, fontSize: "14px", color: "#333" }}>• {note}</span>
              <button type="button" onClick={() => removeNote(i)} style={removeNoteBtnStyle}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Type a note and press Enter or Add"
          />
          <button type="button" onClick={addNote} style={addNoteBtnStyle}>
            Add
          </button>
        </div>
      </Section>

      <Section title="Advanced (optional)">
        <Field label="Local guide slug" hint="Links to your explore guide page, e.g. tampa, clearwater-beach">
          <input value={guideSlug} onChange={(e) => setGuideSlug(e.target.value)} style={inputStyle} placeholder="tampa" />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "8px" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Property is active (guests can access guide)</span>
        </label>
      </Section>

      <div style={{ paddingTop: "16px" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? "#b0bec5" : "#1A3A4A",
            color: "#fff",
            border: "none",
            padding: "14px 32px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save property"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #eee" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1A3A4A", margin: "0 0 20px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#333", marginBottom: "6px" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "12px", color: "#999", margin: "0 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const noteItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "8px 12px",
  background: "#F8FAFB",
  borderRadius: "6px",
  marginBottom: "6px",
};

const removeNoteBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#999",
  cursor: "pointer",
  fontSize: "14px",
  padding: "0",
  flexShrink: 0,
};

const addNoteBtnStyle: React.CSSProperties = {
  background: "#1A3A4A",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};
