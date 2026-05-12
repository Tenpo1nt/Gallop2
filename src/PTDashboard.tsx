import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import './Dashboard.css';

type SessionUser = {
  id: string | number;
  role: string;
  full_name: string;
  email: string;
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function toPatientCard(userId: string | number, fullName: string): Patient {
  const idText = String(userId);
  const safeName = fullName.trim() || `Patient ${userId}`;
  return {
    id: idText,
    name: safeName,
    condition: "Rehab Program",
    progress: 0,
    nextSession: "No upcoming session",
    workoutId: null,
    avatar: getInitials(safeName)
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────
const workoutIconOptions = [
  "🏋️",
  "💪",
  "🦵",
  "🦶",
  "⚖️",
  "🧘",
  "🏃",
  "🤸",
  "❤️",
  "🦴",
  "🩺",
  "🔥",
];

const exerciseSuggestions = [
  "Quad Sets",
  "Straight Leg Raises",
  "Hamstring Curls",
  "Single Leg Stand",
  "Heel-Toe Walking",
  "Pendulum Swings",
  "Wall Slides",
  "Band Pull-Aparts",
  "Bridges",
  "Clamshells",
  "Calf Raises",
  "Ankle Circles",
  "Shoulder Rolls",
  "Marching",
  "Step-Ups",
];

const setsSuggestions = ["1", "2", "3", "4", "5"];
const repsSuggestions = ["5", "8", "10", "12", "15", "20", "30"];
const timeSuggestions = [
  "15 sec rest",
  "20 sec rest",
  "30 sec rest",
  "45 sec rest",
  "60 sec rest",
  "30 sec hold",
  "45 sec hold",
  "60 sec hold",
];

interface Exercise {
  name: string;
  sets: number | string;
  reps: number | string;
  duration: string;
}

interface Workout {
  id: string;
  name: string;
  icon: string;
  exercises: Exercise[];
}

interface Patient {
  id: string;
  name: string;
  condition: string;
  progress: number;
  nextSession: string;
  workoutId: string | null;
  avatar: string;
}

interface Message {
  from: string;
  text: string;
  time: string;
}

interface MessageThread {
  patientId: string;
  messages: Message[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

// TODO: Replace with real data fetching and persistence logic
const workoutNameSuggestions = [
  "Morning Knee Strengthening",
  "Balance & Stability Routine",
  "Shoulder Mobility Flow",
  "Lower Back Relief Routine",
  "Ankle Mobility Recovery",
  "Hip Strength Builder",
  "Post-Surgery Rehab Plan",
  "Core Stability Session",
  "Daily Flexibility Flow",
  "Gentle Recovery Routine",
];

const initialWorkouts: Workout[] = [
  {
    id: "w1", name: "Morning Knee Strengthening",
    icon: "🏋️",
    exercises: [
      { name: "Quad Sets", sets: 3, reps: 10, duration: "30 sec rest" },
      { name: "Straight Leg Raises", sets: 3, reps: 8, duration: "45 sec rest" },
      { name: "Hamstring Curls", sets: 3, reps: 12, duration: "30 sec rest" },
    ]
  },
  {
    id: "w2", name: "Balance & Stability Routine",
    icon: "🤸",
    exercises: [
      { name: "Single Leg Stand", sets: 3, reps: 30, duration: "30 sec hold" },
      { name: "Heel-Toe Walking", sets: 2, reps: 10, duration: "20 sec rest" },
    ]
  },
  {
    id: "w3", name: "Shoulder Mobility Flow",
    icon: "💪",
    exercises: [
      { name: "Pendulum Swings", sets: 2, reps: 15, duration: "20 sec rest" },
      { name: "Wall Slides", sets: 3, reps: 10, duration: "30 sec rest" },
      { name: "Band Pull-Aparts", sets: 3, reps: 12, duration: "30 sec rest" },
    ]
  },
];

const initialMessages: MessageThread[] = [];

// ── Constants ──────────────────────────────────────────────────────────────────
const BLUE = "#3b82f6";
const BLUE_LIGHT = "#eff6ff";
const BLUE_MID = "#dbeafe";
const BLUE_DARK = "#1e3a5f";

const card: CSSProperties = {
  background: "white", borderRadius: "20px",
  padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.04)"
};

const pillBtn = (active: boolean): CSSProperties => ({
  background: active ? BLUE : BLUE_LIGHT,
  color: active ? "white" : BLUE,
  border: `1px solid ${active ? BLUE : "#bfdbfe"}`,
  borderRadius: "10px", padding: "6px 14px",
  fontSize: "12px", fontWeight: 700, cursor: "pointer"
});

// ── Nav Items ──────────────────────────────────────────────────────────────────
const navItems = [
  { id: "patients", label: "My Patients", img: "/patients_sidebar_icon.png" },
  { id: "workouts", label: "Workout Creation", img: "/workoutcreation_sidebar_icon.png" },
  { id: "messages", label: "Messages", img: "/messages_sidebar_icon.png" },
  { id: "settings", label: "Settings", img: "/settings_sidebar_icon.png" },
];
// ══════════════════════════════════════════════════════════════════════════════
// PAGE: MY PATIENTS
// ══════════════════════════════════════════════════════════════════════════════
interface PatientsPageProps {
  patients: Patient[];
  workouts: Workout[];
  onUpdatePatient: (id: string, changes: Partial<Patient>) => void;
}

function PatientsPage({ patients, workouts, onUpdatePatient }: PatientsPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [changingWorkout, setChangingWorkout] = useState(false);

  const patient = selected ? patients.find(p => p.id === selected) ?? null : null;
  const assignedWorkout = patient?.workoutId ? workouts.find(w => w.id === patient.workoutId) ?? null : null;

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      {/* Patient List */}
      <div style={{ ...card, width: "300px", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: BLUE_DARK }}>My Patients</h2>
          <button style={pillBtn(true)}>+ Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {patients.length === 0 ? (
            <div style={{ padding: "14px", borderRadius: "12px", background: "#f8faff", border: "1px solid #e0ecff", color: "#64748b", fontSize: "12px", textAlign: "center" }}>
              No patients assigned yet.
            </div>
          ) : patients.map(p => (
            <div key={p.id} onClick={() => { setSelected(p.id); setChangingWorkout(false); }} style={{
              padding: "13px 14px", borderRadius: "14px",
              border: `2px solid ${selected === p.id ? BLUE : "#e0ecff"}`,
              background: selected === p.id ? BLUE_LIGHT : "#f8faff",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
            }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 800, fontSize: "13px"
              }}>{p.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{p.condition}</div>
                <div style={{ marginTop: "5px", background: BLUE_MID, borderRadius: "99px", height: "4px" }}>
                  <div style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, #5ba3f5, ${BLUE})`, height: "4px", borderRadius: "99px" }} />
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: BLUE, flexShrink: 0 }}>{p.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Detail */}
      <div style={{ flex: 1 }}>
        {!patient ? (
          <div style={{ ...card, height: "400px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "48px" }}>👈</div>
            <div style={{ color: "#94a3b8", fontWeight: 600 }}>Select a patient to view their details</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...card, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 800, fontSize: "18px"
              }}>{patient.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "17px", color: BLUE_DARK }}>{patient.name}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>ID: {patient.id} · {patient.condition}</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>Next: {patient.nextSession}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: BLUE }}>{patient.progress}%</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Progress</div>
                <div style={{ marginTop: "4px", background: BLUE_MID, borderRadius: "99px", height: "5px", width: "70px" }}>
                  <div style={{ width: `${patient.progress}%`, background: `linear-gradient(90deg, #5ba3f5, ${BLUE})`, height: "5px", borderRadius: "99px" }} />
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: BLUE_DARK }}>Assigned Workout</h3>
                <button onClick={() => setChangingWorkout(!changingWorkout)} style={pillBtn(changingWorkout)}>
                  {changingWorkout ? "Cancel" : "Change Workout"}
                </button>
              </div>

              {changingWorkout && (
                <div style={{ marginBottom: "16px" }}>
                  <select
                    defaultValue={patient.workoutId ?? ""}
                    onChange={(e) => {
                      onUpdatePatient(patient.id, { workoutId: e.target.value || null });
                      setChangingWorkout(false);
                    }}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "12px",
                      border: `2px solid ${BLUE_MID}`, fontSize: "14px", fontWeight: 600,
                      color: BLUE_DARK, background: BLUE_LIGHT, cursor: "pointer"
                    }}
                  >
                    <option value="">— No workout assigned —</option>
                    {workouts.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignedWorkout ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "22px" }}>🏋️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: BLUE_DARK }}>{assignedWorkout.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{assignedWorkout.exercises.length} exercises</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {assignedWorkout.exercises.map((ex, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", background: "#f8faff", borderRadius: "12px", border: `1px solid ${BLUE_MID}`
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "6px",
                            background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "11px", fontWeight: 800, color: BLUE
                          }}>{i + 1}</div>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: BLUE_DARK }}>{ex.name}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {ex.sets} sets · {ex.reps} reps · {ex.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No workout assigned yet</div>
                  <div style={{ fontSize: "12px" }}>Click "Change Workout" to assign one</div>
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
// PAGE: WORKOUT CREATION
// ══════════════════════════════════════════════════════════════════════════════
interface WorkoutsPageProps {
  workouts: Workout[];
  onSave: (editingId: string | null, form: { name: string; icon: string; exercises: Exercise[] }) => void;
  onDelete: (id: string) => void;
}

function WorkoutsPage({ workouts, onSave, onDelete }: WorkoutsPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; icon: string; exercises: Exercise[] }>({ name: "", icon: "🏋️", exercises: [] });
  const [newEx, setNewEx] = useState<Exercise>({ name: "", sets: "", reps: "", duration: "" });

  // const startCreate = () => { setForm({ name: "", exercises: [] }); setEditingId(null); setCreating(true); };
  // const startEdit = (w: Workout) => { setForm({ name: w.name, exercises: w.exercises.map(e => ({ ...e })) }); setEditingId(w.id); setCreating(true); };
  const startCreate = () => {
    setForm({ name: "", icon: "🏋️", exercises: [] });
    setEditingId(null);
    setCreating(true);
  };
  const startEdit = (w: Workout) => {
    setForm({
      name: w.name,
      icon: w.icon,
      exercises: w.exercises.map(e => ({ ...e }))
    });
    setEditingId(w.id);
    setCreating(true);
  };

  const addExercise = () => {
    if (!newEx.name) return;
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...newEx }] }));
    setNewEx({ name: "", sets: "", reps: "", duration: "" });
  };
  const removeExercise = (i: number) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));
  const formValid = form.name.trim() !== "" && form.exercises.length > 0;
  const handleSave = () => {
    if (!form.name || form.exercises.length === 0) return;
    onSave(editingId, form);
    setCreating(false);
  };

  // const exFields: [keyof Exercise, string][] = [["name", "Exercise name"], ["sets", "Sets"], ["reps", "Reps"], ["duration", "Rest"]];

  if (creating) return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: BLUE_DARK }}>
          {editingId ? "Edit Workout" : "Create New Workout"}
        </h2>
        <button onClick={() => setCreating(false)} style={pillBtn(false)}>← Back</button>
      </div>


      <div style={{ marginBottom: "14px" }}>
        <label
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: BLUE_DARK, // TODO: Select color based on theme
            display: "block",
            marginBottom: "6px"
          }}
        >
          Workout List Name
        </label>

        <input
          list="workout-name-suggestions"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Morning Knee Strengthening"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "12px",
            border: `2px solid ${BLUE_MID}`,
            fontSize: "14px",
            fontWeight: 600,
            background: BLUE_LIGHT,
            boxSizing: "border-box",
            color: BLUE_DARK,
            outline: "none",
            boxShadow: "0 2px 8px rgba(59,130,246,0.08)",
            transition: "all 0.3s ease"
          }}
        />

        <datalist id="workout-name-suggestions">
          {workoutNameSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            color: "#64748b",
            fontWeight: 500
          }}
        >
          Start typing to see suggested workout names.
        </div>
      </div>

      {/* Icon Selection */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: BLUE_DARK,
            display: "block",
            marginBottom: "8px"
          }}
        >
          Workout Icon
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            padding: "12px",
            borderRadius: "14px",
            background: BLUE_LIGHT,
            border: `1px solid ${BLUE_MID}`
          }}
        >
          {workoutIconOptions.map((icon) => {
            const active = form.icon === icon;

            return (
              <button
                key={icon}
                type="button"
                onClick={() => setForm(f => ({ ...f, icon }))}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  border: active ? `2px solid ${BLUE}` : `1px solid ${BLUE_MID}`,
                  background: active ? "linear-gradient(135deg, #5ba3f5, #2563eb)" : "white",
                  color: active ? "white" : BLUE_DARK,
                  fontSize: "20px",
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 4px 12px rgba(59,130,246,0.25)"
                    : "0 2px 8px rgba(59,130,246,0.06)",
                  transition: "all 0.3s ease"
                }}
              >
                {icon}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            color: "#64748b",
            fontWeight: 500
          }}
        >
          Choose an icon to represent this workout in your library.
        </div>
      </div>

      {/* <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "6px" }}>Workout Name</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Morning Knee Strengthening"
          style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", background: BLUE_LIGHT, boxSizing: "border-box", color: BLUE_DARK }} />
      </div> */}

      <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "8px" }}>Exercises</label>
      {form.exercises.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "10px", textAlign: "center", padding: "16px", background: "#f8faff", borderRadius: "12px" }}>
          No exercises added yet
        </div>
      )}
      {form.exercises.map((ex, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8faff", borderRadius: "12px", border: `1px solid ${BLUE_MID}`, marginBottom: "8px" }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK }}>{ex.name}</span>
            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>{ex.sets} sets · {ex.reps} reps · {ex.duration}</span>
          </div>
          <button onClick={() => removeExercise(i)} style={{ background: "#fee2e2", border: "none", borderRadius: "8px", color: "#ef4444", fontWeight: 700, padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
        </div>
      ))}

      <div
        style={{
          background: BLUE_LIGHT,
          borderRadius: "14px",
          padding: "16px",
          margin: "10px 0 20px",
          border: `1px solid ${BLUE_MID}`
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: BLUE_DARK,
            marginBottom: "10px"
          }}
        >
          + Add Exercise
        </div>

        {/* Column Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "6px"
          }}
        >
          {["Exercise Name", "Sets", "Reps", "Time"].map((header) => (
            <div
              key={header}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: BLUE_DARK,
                padding: "0 4px"
              }}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Input Row */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "10px"
          }}
        >
          <input
            list="exercise-name-suggestions"
            value={newEx.name}
            onChange={e => setNewEx(n => ({ ...n, name: e.target.value }))}
            placeholder="Exercise name"
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: `1px solid ${BLUE_MID}`,
              fontSize: "13px",
              fontWeight: 500,
              background: "white",
              boxSizing: "border-box",
              color: BLUE_DARK,
              outline: "none",
              boxShadow: "0 2px 8px rgba(59,130,246,0.06)",
              transition: "all 0.3s ease"
            }}
          />

          <input
            list="sets-suggestions"
            value={newEx.sets}
            onChange={e => setNewEx(n => ({ ...n, sets: e.target.value }))}
            placeholder="Sets"
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: `1px solid ${BLUE_MID}`,
              fontSize: "13px",
              fontWeight: 500,
              background: "white",
              boxSizing: "border-box",
              color: BLUE_DARK,
              outline: "none",
              boxShadow: "0 2px 8px rgba(59,130,246,0.06)",
              transition: "all 0.3s ease"
            }}
          />

          <input
            list="reps-suggestions"
            value={newEx.reps}
            onChange={e => setNewEx(n => ({ ...n, reps: e.target.value }))}
            placeholder="Reps"
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: `1px solid ${BLUE_MID}`,
              fontSize: "13px",
              fontWeight: 500,
              background: "white",
              boxSizing: "border-box",
              color: BLUE_DARK,
              outline: "none",
              boxShadow: "0 2px 8px rgba(59,130,246,0.06)",
              transition: "all 0.3s ease"
            }}
          />

          <input
            list="time-suggestions"
            value={newEx.duration}
            onChange={e => setNewEx(n => ({ ...n, duration: e.target.value }))}
            placeholder="Time"
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: `1px solid ${BLUE_MID}`,
              fontSize: "13px",
              fontWeight: 500,
              background: "white",
              boxSizing: "border-box",
              color: BLUE_DARK,
              outline: "none",
              boxShadow: "0 2px 8px rgba(59,130,246,0.06)",
              transition: "all 0.3s ease"
            }}
          />

          <datalist id="exercise-name-suggestions">
            {exerciseSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <datalist id="sets-suggestions">
            {setsSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <datalist id="reps-suggestions">
            {repsSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <datalist id="time-suggestions">
            {timeSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "10px"
          }}
        >
          {exFields.map(([k, ph]) => (
            <input
              key={k}
              value={newEx[k] as string}
              onChange={e => setNewEx(n => ({ ...n, [k]: e.target.value }))}
              placeholder={ph}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: `1px solid ${BLUE_MID}`,
                fontSize: "13px",
                background: "white",
                boxSizing: "border-box",
                color: BLUE_DARK
              }}
            />
          ))}
        </div> */}

        <button
          onClick={addExercise}
          style={{ ...pillBtn(true), padding: "8px 16px", fontSize: "13px" }}
        >
          Add Exercise
        </button>
      </div>

      {/* <div style={{ background: BLUE_LIGHT, borderRadius: "14px", padding: "16px", margin: "10px 0 20px", border: `1px solid ${BLUE_MID}` }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, marginBottom: "10px" }}>+ Add Exercise</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          {exFields.map(([k, ph]) => (
            <input key={k} value={newEx[k] as string} onChange={e => setNewEx(n => ({ ...n, [k]: e.target.value }))}
              placeholder={ph}
              style={{ padding: "8px 10px", borderRadius: "10px", border: `1px solid ${BLUE_MID}`, fontSize: "13px", background: "white", boxSizing: "border-box" }} />
          ))}
        </div>
        <button onClick={addExercise} style={{ ...pillBtn(true), padding: "8px 16px", fontSize: "13px" }}>Add Exercise</button>
      </div> */}

      <div style={{ display: "flex", gap: "10px" }}>
        {/* <button onClick={() => setCreating(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", fontWeight: 700, cursor: "pointer", color: "#64748b" }}>Cancel</button>
        <button onClick={handleSave} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, #5ba3f5, #2563eb)`, fontWeight: 700, cursor: "pointer", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.35)" }}>💾 Save Workout</button> */}
        <button
          onClick={() => setCreating(false)}
          // disabled={!formValid}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "white",
            fontWeight: 700,
            cursor: "pointer",
            color: "#64748b"

            // background: formValid
            //   ? "linear-gradient(135deg, #5ba3f5, #2563eb)"
            //   : "#cbd5e1",
            // boxShadow: formValid
            //   ? "0 4px 12px rgba(59,130,246,0.35)"
            //   : "none",
            // opacity: formValid ? 1 : 0.7,
            // transition: "all 0.25s ease"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!formValid}
          style={{
            flex: 2,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            fontWeight: 700,
            color: "white",
            cursor: formValid ? "pointer" : "not-allowed",
            background: formValid
              ? "linear-gradient(135deg, #5ba3f5, #2563eb)"
              : "#cbd5e1",
            boxShadow: formValid
              ? "0 4px 12px rgba(59,130,246,0.35)"
              : "none",
            opacity: formValid ? 1 : 0.7,
            transition: "all 0.25s ease"
          }}
        >
          💾 Save Workout
        </button>
      </div>
      {!formValid && (
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginTop: "8px",
            fontWeight: 500
          }}
        >
          Please enter a workout name and add at least one exercise.
        </div>
      )}
    </div>
  );

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: BLUE_DARK }}>Workout Library</h2>
        <button onClick={startCreate} style={pillBtn(true)}>+ Create New</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {workouts.map(w => (
          <div key={w.id} style={{ background: "#f8faff", borderRadius: "16px", border: `1px solid ${BLUE_MID}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>


                {/* <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏋️</div> */}
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: BLUE_MID,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.08)"
                  }}
                >
                  {w.icon || "🏋️"}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: BLUE_DARK }}>{w.name}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{w.exercises.length} exercises</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => startEdit(w)} style={pillBtn(false)}>Edit</button>
                <button onClick={() => onDelete(w.id)} style={{ background: "#fee2e2", border: "none", borderRadius: "10px", color: "#ef4444", fontWeight: 700, padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${BLUE_MID}`, padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {w.exercises.map((ex, i) => (
                <span key={i} style={{ background: BLUE_MID, color: BLUE, borderRadius: "99px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>{ex.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
interface MessagesPageProps {
  patients: Patient[];
}

function MessagesPage({ patients }: MessagesPageProps) {
  const [selected, setSelected] = useState<string>("");
  const [input, setInput] = useState("");
  const [allMessages, setAllMessages] = useState<MessageThread[]>(initialMessages);

  useEffect(() => {
    setAllMessages((prev) => {
      const map = new Map(prev.map((thread) => [thread.patientId, thread.messages]));
      return patients.map((p) => ({
        patientId: p.id,
        messages: map.get(p.id) ?? []
      }));
    });

    if (patients.length === 0) {
      setSelected("");
      return;
    }

    setSelected((prev) => {
      const stillExists = patients.some((p) => p.id === prev);
      return stillExists ? prev : patients[0].id;
    });
  }, [patients]);

  const thread = allMessages.find(m => m.patientId === selected);
  const patient = patients.find(p => p.id === selected);

  const send = () => {
    if (!input.trim() || !selected) return;
    setAllMessages(prev => prev.map(m => m.patientId === selected
      ? { ...m, messages: [...m.messages, { from: "pt", text: input, time: "Just now" }] }
      : m
    ));
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: "20px", height: "560px" }}>
      <div style={{ ...card, width: "220px", flexShrink: 0, overflowY: "auto", padding: "16px" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, color: BLUE_DARK }}>Conversations</h2>
        {patients.length === 0 && (
          <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "12px" }}>
            No patient conversations yet.
          </div>
        )}
        {patients.map(p => {
          const t = allMessages.find(m => m.patientId === p.id);
          const last = t?.messages?.slice(-1)[0];
          return (
            <div key={p.id} onClick={() => setSelected(p.id)} style={{ padding: "10px 12px", borderRadius: "12px", background: selected === p.id ? BLUE_LIGHT : "transparent", border: `1px solid ${selected === p.id ? "#bfdbfe" : "transparent"}`, cursor: "pointer", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "11px" }}>{p.avatar}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "12px", color: BLUE_DARK }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last ? last.text : "No messages yet"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BLUE_MID}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, #5ba3f5, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "12px" }}>{patient?.avatar}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: BLUE_DARK }}>{patient?.name}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{patient?.condition}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {thread?.messages?.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px" }}>
              <div style={{ fontSize: "32px" }}>💬</div>
              <div style={{ fontSize: "13px", marginTop: "8px" }}>No messages yet!</div>
            </div>
          )}
          {thread?.messages?.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.from === "pt" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: "16px", background: msg.from === "pt" ? `linear-gradient(135deg, #5ba3f5, #2563eb)` : "#f1f5f9", color: msg.from === "pt" ? "white" : BLUE_DARK, fontSize: "13px", borderBottomRightRadius: msg.from === "pt" ? "4px" : "16px", borderBottomLeftRadius: msg.from === "patient" ? "4px" : "16px" }}>
                {msg.text}
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BLUE_MID}`, display: "flex", gap: "10px" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "13px", background: BLUE_LIGHT, outline: "none" }} />
          <button onClick={send} style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, #5ba3f5, #2563eb)`, color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Send</button>
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
  const [notifications, setNotifications] = useState(true);
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
      setSaved(false);
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
        {([["Full Name", name, setName], ["Email", email, setEmail]] as [string, string, (v: string) => void][]).map(([label, val, set]) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: BLUE_DARK, display: "block", marginBottom: "6px" }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `2px solid ${BLUE_MID}`, fontSize: "14px", background: BLUE_LIGHT, boxSizing: "border-box", color: BLUE_DARK }} />
          </div>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: BLUE_DARK }}>Preferences</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: BLUE_DARK }}>Session Notifications</div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Get notified before upcoming sessions</div>
          </div>
          <div onClick={() => setNotifications(!notifications)} style={{ width: "44px", height: "24px", borderRadius: "99px", background: notifications ? BLUE : "#cbd5e1", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: "3px", left: notifications ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </div>

      <button onClick={handleSave} style={{ padding: "13px", borderRadius: "14px", border: "none", background: saved ? "#10b981" : `linear-gradient(135deg, #5ba3f5, #2563eb)`, fontWeight: 700, cursor: "pointer", color: "white", fontSize: "14px", transition: "background 0.3s" }}>
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
      </button>
      {errorMessage && (
        <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>{errorMessage}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function PTDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("patients");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem('sessionUser');
      if (!raw) return null;
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });

  const displayName = sessionUser?.full_name?.trim() || "Physical Therapist";
  const displayInitials = getInitials(displayName);

  useEffect(() => {
    const loadAssignedPatients = async () => {
      if (!sessionUser) {
        setPatients([]);
        return;
      }

      const { data: assignedRows, error: assignedError } = await supabase
        .from('pt_patient_assignments')
        .select('patient_id')
        .eq('pt_id', sessionUser.id);

      if (assignedError) {
        console.error('Failed to load assigned patients:', assignedError.message);
        setPatients([]);
        return;
      }

      if (!assignedRows || assignedRows.length === 0) {
        setPatients([]);
        return;
      }

      const patientUserIds = assignedRows
        .map((row: { patient_id: string | number | null }) => row.patient_id)
        .filter((id): id is string | number => id !== null && id !== undefined)
        .map((id) => String(id));

      if (patientUserIds.length === 0) {
        setPatients([]);
        return;
      }

      const uniquePatientIds = Array.from(new Set(patientUserIds));

      const { data: patientUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', uniquePatientIds);

      if (usersError) {
        console.error('Failed to load patient names:', usersError.message);
      }

      const nameById = new Map<string, string>(
        (patientUsers ?? []).map((user) => [String(user.id), user.full_name ?? `Patient ${user.id}`])
      );

      const cards = uniquePatientIds.map((id) => toPatientCard(id, nameById.get(id) ?? `Patient ${id}`));
      setPatients(cards);
    };

    const loadWorkouts = async () => {
      if (!sessionUser) return;


      try {
        const { data, error } = await supabase
          .from("Workouts")
          .select("*")
          .eq("P_ID", sessionUser.id);


        if (error) {
          console.error("Error fetching workouts:", error.message);
          return;
        }


        const formatted: Workout[] = (data || []).map((row: any) => ({
          id: String(row.WO_ID),
          name: row.WO_Name,
          icon: row.WO_Icon || "🏋️",
          exercises: [
            {
              name: row.Exercise_Name,
              sets: row.Sets,
              reps: row.Reps,
              duration: row.Rest_Time,
            }
          ]
        }));
        setWorkouts(formatted);
      } catch (err) {
        console.error("Unexpected error loading workouts:", err);
      }
    };

    void loadAssignedPatients();
    void loadWorkouts();
  }, [sessionUser]);



  const handleLogout = () => {
    localStorage.removeItem('sessionUser');
    navigate('/auth');
  };

  const handleSaveProfile = async (name: string, email: string) => {
    if (!sessionUser) {
      return { ok: false, message: "No active session user found." };
    }

    if (!name || !email) {
      return { ok: false, message: "Name and email are required." };
    }

    const { error } = await supabase
      .from('users')
      .update({
        full_name: name,
        email,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionUser.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    const updatedSessionUser: SessionUser = {
      ...sessionUser,
      full_name: name,
      email
    };

    setSessionUser(updatedSessionUser);
    localStorage.setItem('sessionUser', JSON.stringify(updatedSessionUser));
    return { ok: true };
  };

  const updatePatient = (id: string, changes: Partial<Patient>) =>
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));

  const saveWorkout = (editingId: string | null, form: { name: string; icon: string; exercises: Exercise[] }) => {
    if (editingId) {
      setWorkouts(prev =>
        prev.map(w => w.id === editingId ? { ...w, ...form } : w)
      );
    } else {
      setWorkouts(prev => [...prev, { id: "w" + Date.now(), ...form }]);
    }
  };

  const deleteWorkout = (id: string) => setWorkouts(prev => prev.filter(w => w.id !== id));

  const subtitles: Record<string, string> = {
    patients: `${patients.length} patients · ${patients.filter(p => p.nextSession.includes("Today")).length} sessions today`,
    workouts: `${workouts.length} workouts in your library`,
    messages: "Stay connected with your patients",
    settings: "Manage your account",
  };

  const titles: Record<string, string> = {
    patients: "My Patients",
    workouts: "Workout Creation",
    messages: "Messages",
    settings: "Settings"
  };

  return (
    <div className="dashboard-wrapper dashboard-pt">
      {/* Sidebar */}
      <div style={{ width: "220px", flexShrink: 0, background: "linear-gradient(180deg, #5ba3f5 0%, #3b82f6 60%, #2563eb 100%)", display: "flex", flexDirection: "column", padding: "22px 14px", boxShadow: "4px 0 20px rgba(59,130,246,0.25)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", paddingLeft: "6px" }}>
          <img src="/gallop_logo_white.png" alt="Gallop Logo" style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "contain" }} />
          <img src="/gallop_text_blue.png" alt="Gallop" style={{ height: "35px", objectFit: "contain", marginTop: "6px" }} />
        </div>

        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "14px", padding: "11px 13px", marginBottom: "22px", display: "flex", alignItems: "center", gap: "9px", border: "1px solid rgba(255,255,255,0.3)" }}>
          <img src="/uma_pt.png" alt="PT" style={{ width: "35px", height: "35px", borderRadius: "50%", objectFit: "contain" }} />
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>{displayName}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px" }}>Physical Therapist</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map(item => item && (
            <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 13px", borderRadius: "12px", border: "none", cursor: "pointer", background: activeNav === item.id ? "rgba(255,255,255,0.25)" : "transparent", color: "white", fontWeight: activeNav === item.id ? 700 : 500, fontSize: "13px", textAlign: "left" }}>
              {<img src={item.img} alt={item.label} style={{ width: "40px", height: "40px", objectFit: "contain" }} />}
              {item.label}
              {item.id === "messages" && patients.length > 0 && <span style={{ marginLeft: "auto", background: "#f97316", color: "white", borderRadius: "99px", fontSize: "10px", fontWeight: 800, padding: "2px 6px" }}>{patients.length}</span>}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "13px" }}>
          <img src="/logout_sidebar_icon.png" alt="Log Out" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          Log Out
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
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer" }}>🔔</div>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "white", boxShadow: "0 2px 8px rgba(59,130,246,0.4)" }}>{displayInitials}</div>
          </div>
        </div>

        {activeNav === "patients" && <PatientsPage patients={patients} workouts={workouts} onUpdatePatient={updatePatient} />}
        {activeNav === "workouts" && <WorkoutsPage workouts={workouts} onSave={saveWorkout} onDelete={deleteWorkout} />}
        {activeNav === "messages" && <MessagesPage patients={patients} />}
        {activeNav === "settings" && (
          <SettingsPage
            initialName={displayName}
            initialEmail={sessionUser?.email ?? ""}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </div>
    </div>
  );
}
