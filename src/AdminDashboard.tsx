import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./Dashboard.css";

// ── Types ──────────────────────────────────────────────────────────────────────
type SessionUser = {
  id: string | number;
  role: string;
  full_name: string;
  email: string;
};

type DBUser = {
  id: string | number;
  full_name: string | null;
  email: string | null;
  role: string;
};

type Assignment = {
  pt_id: string | number;
  patient_id: string | number;
};

type AssignResult = {
  ok: boolean;
  message?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// ── Design Tokens ──────────────────────────────────────────────────────────────
const BLUE = "#3b82f6";
const BLUE_LIGHT = "#eff6ff";
const BLUE_MID = "#dbeafe";
const BLUE_DARK = "#1e3a5f";
const AMBER = "#d97706";
const AMBER_LIGHT = "#fffbeb";
const AMBER_MID = "#fde68a";

const card: CSSProperties = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.04)",
};

const pillBtn = (active: boolean, color: "blue" | "amber" = "blue"): CSSProperties => ({
  background: active ? (color === "amber" ? AMBER : BLUE) : (color === "amber" ? AMBER_LIGHT : BLUE_LIGHT),
  color: active ? "white" : (color === "amber" ? AMBER : BLUE),
  border: `1px solid ${active ? (color === "amber" ? AMBER : BLUE) : (color === "amber" ? AMBER_MID : "#bfdbfe")}`,
  borderRadius: "10px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
});

const navItems = [
  { id: "patients", label: "Patients", icon: "🧑‍🦽" },
  { id: "therapists", label: "Physical Therapists", icon: "🩺" },
  { id: "add-user", label: "Add User", icon: "➕" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: PATIENTS
// ══════════════════════════════════════════════════════════════════════════════
interface PatientsPageProps {
  patients: DBUser[];
  pts: DBUser[];
  assignments: Assignment[];
  onAssign: (patientId: string | number, ptId: string | number | null) => Promise<AssignResult>;
  loading: boolean;
}

function PatientsPage({ patients, pts, assignments, onAssign, loading }: PatientsPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  const sameId = (a: string | number, b: string | number) => String(a) === String(b);

  const getAssignedPt = (patientId: string | number): DBUser | null => {
    const a = assignments.find((x) => sameId(x.patient_id, patientId));
    if (!a) return null;
    return pts.find((p) => sameId(p.id, a.pt_id)) ?? null;
  };

  const unassignedPatients = patients.filter((p) => !assignments.some((a) => sameId(a.patient_id, p.id)));
  const assignedPatients = patients.filter((p) => assignments.some((a) => sameId(a.patient_id, p.id)));

  const selectedPatient = selected !== null ? patients.find((p) => sameId(p.id, selected)) ?? null : null;
  const currentPt = selectedPatient ? getAssignedPt(selectedPatient.id) : null;
  const [selectPtId, setSelectPtId] = useState<string>("");

  useEffect(() => {
    if (selectedPatient) {
      setSelectPtId(currentPt ? String(currentPt.id) : "");
      setAssigning(false);
      setAssignMessage(null);
    }
  }, [selected]);

  const handleAssign = async () => {
    if (!selectedPatient) return;
    setAssigning(true);
    setAssignMessage(null);
    const result = await onAssign(selectedPatient.id, selectPtId || null);
    setAssigning(false);

    if (!result.ok) {
      setAssignMessage(result.message ?? "Failed to update assignment.");
    }
  };

  if (loading) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "60px", color: "#94a3b8" }}>
        Loading patients...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      {/* Patient list */}
      <div style={{ ...card, width: "300px", flexShrink: 0, overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800, color: BLUE_DARK }}>
          All Patients ({patients.length})
        </h2>

        {unassignedPatients.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              ⚠ Unassigned ({unassignedPatients.length})
            </div>
            {unassignedPatients.map((p) => (
              <PatientRow key={String(p.id)} patient={p} assignedPt={null} selected={selected !== null && sameId(selected, p.id)} onClick={() => setSelected(String(p.id))} />
            ))}
          </div>
        )}

        {assignedPatients.length > 0 && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              ✓ Assigned ({assignedPatients.length})
            </div>
            {assignedPatients.map((p) => (
              <PatientRow key={String(p.id)} patient={p} assignedPt={getAssignedPt(p.id)} selected={selected !== null && sameId(selected, p.id)} onClick={() => setSelected(String(p.id))} />
            ))}
          </div>
        )}

        {patients.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "20px" }}>
            No patients found.
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1 }}>
        {!selectedPatient ? (
          <div style={{ ...card, height: "300px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "48px" }}>👈</div>
            <div style={{ color: "#94a3b8", fontWeight: 600 }}>Select a patient to manage their assignment</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Patient header */}
            <div style={{ ...card, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "18px" }}>
                {getInitials(selectedPatient.full_name ?? "?")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "17px", color: BLUE_DARK }}>{selectedPatient.full_name ?? "—"}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>ID: {selectedPatient.id} · Patient</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{selectedPatient.email ?? "No email set"}</div>
              </div>
              <div style={{ padding: "6px 14px", borderRadius: "99px", background: currentPt ? "#d1fae5" : "#fee2e2", color: currentPt ? "#065f46" : "#991b1b", fontSize: "12px", fontWeight: 700 }}>
                {currentPt ? "✓ Assigned" : "⚠ Unassigned"}
              </div>
            </div>

            {/* Assignment card */}
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 800, color: BLUE_DARK }}>PT Assignment</h3>

              {currentPt && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f0fdf4", borderRadius: "14px", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #34d399, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "13px" }}>
                    {getInitials(currentPt.full_name ?? "?")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#065f46" }}>{currentPt.full_name}</div>
                    <div style={{ fontSize: "11px", color: "#10b981" }}>Currently assigned PT</div>
                  </div>
                </div>
              )}

              <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "8px" }}>
                {currentPt ? "Reassign to a different PT" : "Assign a PT"}
              </label>
              <select
                value={selectPtId}
                onChange={(e) => setSelectPtId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", fontWeight: 600, color: BLUE_DARK, background: BLUE_LIGHT, cursor: "pointer", marginBottom: "14px" }}
              >
                <option value="">— Remove assignment —</option>
                {pts.map((pt) => (
                  <option key={pt.id} value={String(pt.id)}>
                    {pt.full_name ?? `PT #${pt.id}`}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssign}
                disabled={assigning}
                style={{ padding: "11px 22px", borderRadius: "12px", border: "none", background: assigning ? "#cbd5e1" : `linear-gradient(135deg, #5ba3f5, #2563eb)`, color: "white", fontWeight: 700, cursor: assigning ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                {assigning ? "Saving..." : currentPt ? "Update Assignment" : "Assign PT"}
              </button>
              {assignMessage && (
                <div style={{ marginTop: "10px", color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>
                  {assignMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, assignedPt, selected, onClick }: { patient: DBUser; assignedPt: DBUser | null; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: "11px 13px", borderRadius: "13px", border: `2px solid ${selected ? BLUE : "#e0ecff"}`, background: selected ? BLUE_LIGHT : "#f8faff", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "12px" }}>
        {getInitials(patient.full_name ?? "?")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{patient.full_name ?? "—"}</div>
        <div style={{ fontSize: "11px", color: assignedPt ? "#10b981" : "#f97316" }}>
          {assignedPt ? `PT: ${assignedPt.full_name}` : "No PT assigned"}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: THERAPISTS
// ══════════════════════════════════════════════════════════════════════════════
interface TherapistsPageProps {
  pts: DBUser[];
  patients: DBUser[];
  assignments: Assignment[];
  loading: boolean;
}

function TherapistsPage({ pts, patients, assignments, loading }: TherapistsPageProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const sameId = (a: string | number, b: string | number) => String(a) === String(b);

  const getPtPatients = (ptId: string | number): DBUser[] => {
    const ids = assignments.filter((a) => sameId(a.pt_id, ptId)).map((a) => String(a.patient_id));
    return patients.filter((p) => ids.includes(String(p.id)));
  };

  const selectedPt = selected !== null ? pts.find((p) => sameId(p.id, selected)) ?? null : null;
  const selectedPatients = selectedPt ? getPtPatients(selectedPt.id) : [];

  if (loading) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "60px", color: "#94a3b8" }}>
        Loading therapists...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      {/* PT list */}
      <div style={{ ...card, width: "300px", flexShrink: 0, overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800, color: BLUE_DARK }}>
          Physical Therapists ({pts.length})
        </h2>
        {pts.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "20px" }}>No PTs found.</div>
        )}
        {pts.map((pt) => {
          const count = getPtPatients(pt.id).length;
          return (
            <div
              key={String(pt.id)}
              onClick={() => setSelected(String(pt.id))}
              style={{ padding: "11px 13px", borderRadius: "13px", border: `2px solid ${selected !== null && sameId(selected, pt.id) ? BLUE : "#e0ecff"}`, background: selected !== null && sameId(selected, pt.id) ? BLUE_LIGHT : "#f8faff", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #34d399, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "12px" }}>
                {getInitials(pt.full_name ?? "?")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK }}>{pt.full_name ?? "—"}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{pt.email ?? "No email"}</div>
              </div>
              <div style={{ padding: "3px 9px", borderRadius: "99px", background: count > 0 ? BLUE_MID : "#f1f5f9", color: count > 0 ? BLUE : "#94a3b8", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>
                {count} {count === 1 ? "patient" : "patients"}
              </div>
            </div>
          );
        })}
      </div>

      {/* PT detail */}
      <div style={{ flex: 1 }}>
        {!selectedPt ? (
          <div style={{ ...card, height: "300px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "48px" }}>👈</div>
            <div style={{ color: "#94a3b8", fontWeight: 600 }}>Select a PT to view their patients</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...card, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #34d399, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "18px" }}>
                {getInitials(selectedPt.full_name ?? "?")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "17px", color: BLUE_DARK }}>{selectedPt.full_name ?? "—"}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>ID: {selectedPt.id} · Physical Therapist</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{selectedPt.email ?? "No email set"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: BLUE }}>{selectedPatients.length}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Assigned Patients</div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, color: BLUE_DARK }}>Assigned Patients</h3>
              {selectedPatients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No patients assigned yet</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedPatients.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f8faff", borderRadius: "12px", border: `1px solid ${BLUE_MID}` }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "11px" }}>
                        {getInitials(p.full_name ?? "?")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK }}>{p.full_name ?? "—"}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{p.email ?? "No email"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: ADD USER
// ══════════════════════════════════════════════════════════════════════════════
function AddUserPage({ onUserAdded }: { onUserAdded: () => void }) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"patient" | "pt" | "admin">("patient");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleAdd = async () => {
    if (!fullName.trim()) {
      setMessage({ text: "Full name is required.", ok: false });
      return;
    }
    setSaving(true);
    setMessage(null);

    const insertData: Record<string, string | null> = {
      full_name: fullName.trim(),
      role,
      email: email.trim() || null,
    };

    const { error } = await supabase.from("users").insert(insertData);

    setSaving(false);
    if (error) {
      setMessage({ text: `Failed: ${error.message}`, ok: false });
    } else {
      setMessage({ text: `User "${fullName.trim()}" added as ${role}.`, ok: true });
      setFullName("");
      setEmail("");
      setRole("patient");
      onUserAdded();
    }
  };

  const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    patient: { bg: BLUE_LIGHT, color: BLUE, border: "#bfdbfe" },
    pt: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
    admin: { bg: AMBER_LIGHT, color: AMBER, border: AMBER_MID },
  };

  return (
    <div style={{ maxWidth: "480px" }}>
      <div style={card}>
        <h2 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 800, color: BLUE_DARK }}>Add New User</h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "6px" }}>Full Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Smith"
            style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", fontWeight: 600, background: BLUE_LIGHT, boxSizing: "border-box", color: BLUE_DARK, outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "8px" }}>Role *</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {(["patient", "pt", "admin"] as const).map((r) => {
              const active = role === r;
              const c = roleColors[r];
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `2px solid ${active ? c.color : c.border}`, background: active ? c.bg : "white", color: c.color, fontWeight: active ? 800 : 600, cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}
                >
                  {r === "patient" ? "🧑‍🦽 Patient" : r === "pt" ? "🩺 PT" : "🛡 Admin"}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "6px" }}>Email (optional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane@example.com"
            style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", fontWeight: 600, background: BLUE_LIGHT, boxSizing: "border-box", color: BLUE_DARK, outline: "none" }}
          />
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>
            Leave blank — the user can set their email when they sign up.
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={saving || !fullName.trim()}
          style={{ width: "100%", padding: "13px", borderRadius: "14px", border: "none", background: saving || !fullName.trim() ? "#cbd5e1" : `linear-gradient(135deg, #5ba3f5, #2563eb)`, fontWeight: 700, cursor: saving || !fullName.trim() ? "not-allowed" : "pointer", color: "white", fontSize: "14px", transition: "background 0.3s" }}
        >
          {saving ? "Adding..." : "➕ Add User"}
        </button>

        {message && (
          <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "12px", background: message.ok ? "#d1fae5" : "#fee2e2", color: message.ok ? "#065f46" : "#991b1b", fontSize: "13px", fontWeight: 600 }}>
            {message.text}
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: "16px", background: AMBER_LIGHT, border: `1px solid ${AMBER_MID}` }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: AMBER, marginBottom: "4px" }}>💡 How it works</div>
        <div style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.6" }}>
          Adding a user here creates a record in the database with their name and role. They can then sign up on the login page using their name and role — their email and password will be linked to this record at signup.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
interface SettingsPageProps {
  initialName: string;
  initialEmail: string;
  onSaveProfile: (name: string, email: string) => Promise<{ ok: boolean; message?: string }>;
}

function SettingsPage({ initialName, initialEmail, onSaveProfile }: SettingsPageProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setName(initialName);
    setEmail(initialEmail);
  }, [initialName, initialEmail]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");
    const result = await onSaveProfile(name.trim(), email.trim());
    setSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message || "Failed to save changes.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "520px" }}>
      <div style={card}>
        <h2 style={{ margin: "0 0 18px", fontSize: "17px", fontWeight: 800, color: BLUE_DARK }}>Profile Settings</h2>
        {(
          [
            ["Full Name", name, setName],
            ["Email", email, setEmail],
          ] as [string, string, (v: string) => void][]
        ).map(([label, val, set]) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "6px" }}>{label}</label>
            <input
              value={val}
              onChange={(e) => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", background: BLUE_LIGHT, boxSizing: "border-box", color: BLUE_DARK }}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        style={{ padding: "13px", borderRadius: "14px", border: "none", background: saved ? "#10b981" : `linear-gradient(135deg, #5ba3f5, #2563eb)`, fontWeight: 700, cursor: "pointer", color: "white", fontSize: "14px", transition: "background 0.3s" }}
      >
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
      </button>
      {errorMessage && <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>{errorMessage}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("patients");
  const [patients, setPatients] = useState<DBUser[]>([]);
  const [pts, setPts] = useState<DBUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sessionUser");
      if (!raw) return null;
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });

  const displayName = sessionUser?.full_name?.trim() || "Admin";
  const displayInitials = getInitials(displayName);

  const loadData = async () => {
    setLoading(true);

    const [usersRes, assignmentsRes] = await Promise.all([
      supabase.from("users").select("id, full_name, email, role"),
      supabase.from("pt_patient_assignments").select("pt_id, patient_id"),
    ]);

    if (!usersRes.error && usersRes.data) {
      const allUsers = usersRes.data as DBUser[];
      setPatients(allUsers.filter((u) => u.role === "patient"));
      setPts(allUsers.filter((u) => u.role === "pt"));
    }

    if (!assignmentsRes.error && assignmentsRes.data) {
      setAssignments(
        (assignmentsRes.data as { pt_id: string | number; patient_id: string | number }[]).map((a) => ({
          pt_id: a.pt_id,
          patient_id: a.patient_id,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sessionUser");
    navigate("/auth");
  };

  const handleAssign = async (patientId: string | number, ptId: string | number | null): Promise<AssignResult> => {
    // Remove existing assignment for this patient
    const { error: deleteError } = await supabase
      .from("pt_patient_assignments")
      .delete()
      .eq("patient_id", patientId);

    if (deleteError) {
      return { ok: false, message: `Could not clear previous assignment: ${deleteError.message}` };
    }

    if (ptId !== null) {
      const { error: insertError } = await supabase
        .from("pt_patient_assignments")
        .insert({ pt_id: ptId, patient_id: patientId });

      if (insertError) {
        return { ok: false, message: `Could not assign PT: ${insertError.message}` };
      }
    }

    await loadData();
    return { ok: true };
  };

  const handleSaveProfile = async (name: string, email: string): Promise<{ ok: boolean; message?: string }> => {
    if (!sessionUser) return { ok: false, message: "No active session." };
    if (!name || !email) return { ok: false, message: "Name and email are required." };

    const { error } = await supabase
      .from("users")
      .update({ full_name: name, email, updated_at: new Date().toISOString() })
      .eq("id", sessionUser.id);

    if (error) return { ok: false, message: error.message };

    const updated = { ...sessionUser, full_name: name, email };
    setSessionUser(updated);
    localStorage.setItem("sessionUser", JSON.stringify(updated));
    return { ok: true };
  };

  const titles: Record<string, string> = {
    patients: "Patients",
    therapists: "Physical Therapists",
    "add-user": "Add User",
    settings: "Settings",
  };

  const subtitles: Record<string, string> = {
    patients: `${patients.length} patients · ${assignments.length} assigned · ${patients.length - assignments.filter((a) => patients.some((p) => String(p.id) === String(a.patient_id))).length} unassigned`,
    therapists: `${pts.length} physical therapists`,
    "add-user": "Add patients and PTs to the system",
    settings: "Manage your admin account",
  };

  return (
    <div className="dashboard-wrapper dashboard-pt">
      {/* Sidebar */}
      <div style={{ width: "220px", flexShrink: 0, background: "linear-gradient(180deg, #f59e0b 0%, #d97706 60%, #b45309 100%)", display: "flex", flexDirection: "column", padding: "22px 14px", boxShadow: "4px 0 20px rgba(217,119,6,0.25)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", paddingLeft: "6px" }}>
          <div style={{ width: "38px", height: "38px", background: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>🐴</div>
          <span style={{ color: "white", fontWeight: 800, fontSize: "19px" }}>Gallop!</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "14px", padding: "11px 13px", marginBottom: "22px", display: "flex", alignItems: "center", gap: "9px", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div style={{ width: "34px", height: "34px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡️</div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>{displayName}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px" }}>Administrator</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 13px", borderRadius: "12px", border: "none", cursor: "pointer", background: activeNav === item.id ? "rgba(255,255,255,0.25)" : "transparent", color: "white", fontWeight: activeNav === item.id ? 700 : 500, fontSize: "13px", textAlign: "left" }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "13px" }}
        >
          <span>🚪</span> Log Out
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 800, color: BLUE_DARK }}>{titles[activeNav]}</h1>
            <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "13px" }}>{subtitles[activeNav]}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadData} style={{ ...pillBtn(false, "amber"), padding: "8px 14px" }}>↻ Refresh</button>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "white", boxShadow: "0 2px 8px rgba(217,119,6,0.4)" }}>
              {displayInitials}
            </div>
          </div>
        </div>

        {activeNav === "patients" && (
          <PatientsPage patients={patients} pts={pts} assignments={assignments} onAssign={handleAssign} loading={loading} />
        )}
        {activeNav === "therapists" && (
          <TherapistsPage pts={pts} patients={patients} assignments={assignments} loading={loading} />
        )}
        {activeNav === "add-user" && <AddUserPage onUserAdded={loadData} />}
        {activeNav === "settings" && (
          <SettingsPage initialName={displayName} initialEmail={sessionUser?.email ?? ""} onSaveProfile={handleSaveProfile} />
        )}
      </div>
    </div>
  );
}