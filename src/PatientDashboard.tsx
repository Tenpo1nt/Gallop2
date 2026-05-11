import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

type PT = {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
};

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration: string;
  completed: boolean;
};

type AssignedWorkout = {
  id: string;
  title: string;
  assignedBy: string;
  assignedDate: string;
  frequency: string;
  notes: string;
  exercises: Exercise[];
};

type Message = {
  id: string;
  from: string;
  text: string;
  time: string;
};

type SettingsState = {
  reminders: boolean;
  showProgress: boolean;
  emailUpdates: boolean;
};

const PINK = "#ec4899";
const PINK_DARK = "#5b1a38";
const PINK_LIGHT = "#fdf2f8";
const PINK_MID = "#fce7f3";

const card: CSSProperties = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.04)",
};

const navItems = [
  { id: "dashboard", label: "My PTs", icon: "🩺" },
  { id: "messages", label: "Messages", icon: "💬", badge: 2 },
  { id: "settings", label: "Settings", icon: "⚙️" },
] as const;

const mockPTs: PT[] = [
  {
    id: "pt-1",
    name: "Bob Martin",
    specialty: "Physical Therapist",
    avatar: "BM",
  },
  {
    id: "pt-2",
    name: "Edgar Margarian",
    specialty: "67 Specialist",
    avatar: "EM",
  },
];

const mockAssignedWorkouts: AssignedWorkout[] = [
  {
    id: "w-1",
    title: "Knee Recovery Routine",
    assignedBy: "Bob Martin",
    assignedDate: "April 16, 2026",
    frequency: "3x / week",
    notes: "Focus on controlled movement and do not rush through reps.",
    exercises: [
      { id: "e-1", name: "Quad Sets", sets: 3, reps: 10, duration: "30 sec rest", completed: true },
      { id: "e-2", name: "Straight Leg Raises", sets: 3, reps: 8, duration: "45 sec rest", completed: true },
      { id: "e-3", name: "Hamstring Curls", sets: 3, reps: 12, duration: "30 sec rest", completed: false },
      { id: "e-4", name: "Step-Ups", sets: 2, reps: 10, duration: "45 sec rest", completed: false },
    ],
  },
  {
    id: "w-2",
    title: "Balance & Stability Plan",
    assignedBy: "Edgar Margarian",
    assignedDate: "April 19, 2026",
    frequency: "2x / week",
    notes: "Use a chair or wall nearby so you don't fall lol",
    exercises: [
      { id: "e-5", name: "Single Leg Stand", sets: 3, reps: 20, duration: "20 sec hold", completed: false },
      { id: "e-6", name: "Heel-Toe Walking", sets: 2, reps: 8, duration: "20 sec rest", completed: false },
      { id: "e-7", name: "Calf Raises", sets: 3, reps: 12, duration: "30 sec rest", completed: false },
    ],
  },
];

const mockMessages: Message[] = [
  {
    id: "m-1",
    from: "Bob Martin",
    text: "How is your knee feeling after the last session?",
    time: "9:12 AM",
  },
  {
    id: "m-2",
    from: "Edgar Margarian",
    text: "Sup cuh",
    time: "Yesterday",
  },
];

function sectionTitleStyle(): CSSProperties {
  return {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: PINK_DARK,
  };
}

function PatientHomePage() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(mockAssignedWorkouts[0]?.id ?? "");
  const [workouts, setWorkouts] = useState<AssignedWorkout[]>(mockAssignedWorkouts);

  const selectedWorkout =
    workouts.find((w) => w.id === selectedWorkoutId) ?? workouts[0] ?? null;

  const workoutProgress = useMemo(() => {
    if (!selectedWorkout || selectedWorkout.exercises.length === 0) return 0;
    const completed = selectedWorkout.exercises.filter((e) => e.completed).length;
    return Math.round((completed / selectedWorkout.exercises.length) * 100);
  }, [selectedWorkout]);

  const overallProgress = useMemo(() => {
    const allExercises = workouts.flatMap((w) => w.exercises);
    if (allExercises.length === 0) return 0;
    const completed = allExercises.filter((e) => e.completed).length;
    return Math.round((completed / allExercises.length) * 100);
  }, [workouts]);

  const toggleExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts((prev) =>
      prev.map((workout) =>
        workout.id !== workoutId
          ? workout
          : {
              ...workout,
              exercises: workout.exercises.map((exercise) =>
                exercise.id !== exerciseId
                  ? exercise
                  : { ...exercise, completed: !exercise.completed }
              ),
            }
      )
    );
  };

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      <div style={{ ...card, width: "300px", flexShrink: 0, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <h2 style={sectionTitleStyle()}>My PTs</h2>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: PINK_LIGHT,
              color: PINK,
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            {mockPTs.length} active
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          {mockPTs.map((pt) => (
            <div
              key={pt.id}
              style={{
                padding: "13px 14px",
                borderRadius: "14px",
                border: `2px solid ${PINK_MID}`,
                background: PINK_LIGHT,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #f472b6, #ec4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                {pt.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: PINK_DARK }}>{pt.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{pt.specialty}</div>
              </div>
            </div>
          ))}
        </div>

        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
            fontWeight: 800,
            color: PINK_DARK,
          }}
        >
          Assigned Workouts
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {workouts.map((workout) => {
            const completed = workout.exercises.filter((e) => e.completed).length;
            const progress = Math.round((completed / workout.exercises.length) * 100);

            return (
              <div
                key={workout.id}
                onClick={() => setSelectedWorkoutId(workout.id)}
                style={{
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: `2px solid ${selectedWorkoutId === workout.id ? PINK : PINK_MID}`,
                  background: selectedWorkoutId === workout.id ? PINK_LIGHT : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #fbcfe8, #f472b6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  🏃
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: PINK_DARK }}>
                    {workout.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    by {workout.assignedBy}
                  </div>
                  <div
                    style={{
                      marginTop: "5px",
                      background: PINK_MID,
                      borderRadius: "99px",
                      height: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #f472b6, #db2777)",
                        height: "4px",
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: "13px", fontWeight: 800, color: PINK }}>{progress}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f472b6, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            JS
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: PINK_DARK }}>Joe Swanson</div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>Patient ID: 27 · Rehab Program</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              Assigned by: {selectedWorkout?.assignedBy ?? "—"}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "26px", fontWeight: 800, color: PINK }}>{overallProgress}%</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Overall Progress</div>
            <div
              style={{
                marginTop: "4px",
                background: PINK_MID,
                borderRadius: "99px",
                height: "5px",
                width: "86px",
              }}
            >
              <div
                style={{
                  width: `${overallProgress}%`,
                  background: "linear-gradient(90deg, #f472b6, #db2777)",
                  height: "5px",
                  borderRadius: "99px",
                }}
              />
            </div>
          </div>
        </div>

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: PINK_DARK }}>
              Current Assigned Workout
            </h3>

            <div
              style={{
                background: PINK_LIGHT,
                color: PINK,
                border: `1px solid ${PINK_MID}`,
                borderRadius: "10px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {selectedWorkout?.frequency ?? "—"}
            </div>
          </div>

          {selectedWorkout ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "24px" }}>📋</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: PINK_DARK }}>
                    {selectedWorkout.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Assigned by {selectedWorkout.assignedBy} · {selectedWorkout.assignedDate}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginBottom: "16px",
                  padding: "14px",
                  background: PINK_LIGHT,
                  borderRadius: "12px",
                  border: `1px solid ${PINK_MID}`,
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: PINK_DARK, marginBottom: "6px" }}>
                  PT Notes
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>{selectedWorkout.notes}</div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 700,
                  }}
                >
                  <span>Workout Progress</span>
                  <span>{workoutProgress}% complete</span>
                </div>
                <div
                  style={{
                    background: PINK_MID,
                    borderRadius: "99px",
                    height: "8px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: `${workoutProgress}%`,
                      background: "linear-gradient(90deg, #f472b6, #db2777)",
                      height: "8px",
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedWorkout.exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      padding: "12px 14px",
                      background: exercise.completed ? PINK_LIGHT : "#fff",
                      borderRadius: "12px",
                      border: `1px solid ${exercise.completed ? "#f9a8d4" : PINK_MID}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "8px",
                          background: PINK_MID,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: PINK,
                        }}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "13px",
                            color: PINK_DARK,
                            textDecoration: exercise.completed ? "line-through" : "none",
                          }}
                        >
                          {exercise.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {exercise.sets} sets · {exercise.reps} reps · {exercise.duration}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExercise(selectedWorkout.id, exercise.id)}
                      style={{
                        border: `1px solid ${exercise.completed ? "#86efac" : PINK_MID}`,
                        background: exercise.completed ? "#dcfce7" : PINK_LIGHT,
                        color: exercise.completed ? "#166534" : PINK,
                        borderRadius: "10px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        minWidth: "110px",
                      }}
                    >
                      {exercise.completed ? "Completed" : "Mark Done"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              No workout assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesPage() {
  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <h2 style={sectionTitleStyle()}>Messages</h2>
        <div
          style={{
            background: PINK_LIGHT,
            color: PINK,
            borderRadius: "999px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {mockMessages.length} unread
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {mockMessages.map((message) => (
          <div
            key={message.id}
            style={{
              padding: "14px",
              borderRadius: "14px",
              background: PINK_LIGHT,
              border: `1px solid ${PINK_MID}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div style={{ fontWeight: 700, color: PINK_DARK, fontSize: "13px" }}>
                {message.from}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{message.time}</div>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>{message.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    reminders: true,
    showProgress: true,
    emailUpdates: false,
  });

  const toggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingRow = (
    label: string,
    description: string,
    value: boolean,
    key: keyof SettingsState
  ) => (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "14px",
        border: `1px solid ${PINK_MID}`,
        background: PINK_LIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: PINK_DARK, fontSize: "13px" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{description}</div>
      </div>

      <button
        onClick={() => toggle(key)}
        style={{
          border: `1px solid ${value ? "#f9a8d4" : "#cbd5e1"}`,
          background: value ? "linear-gradient(135deg, #f472b6, #db2777)" : "#e2e8f0",
          color: "white",
          borderRadius: "999px",
          padding: "7px 12px",
          fontWeight: 700,
          fontSize: "12px",
          cursor: "pointer",
          minWidth: "72px",
        }}
      >
        {value ? "On" : "Off"}
      </button>
    </div>
  );

  return (
    <div style={card}>
      <h2 style={{ ...sectionTitleStyle(), marginBottom: "18px" }}>Settings</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {settingRow(
          "Workout Reminders",
          "Get reminders when it is time to complete your exercises.",
          settings.reminders,
          "reminders"
        )}
        {settingRow(
          "Show Progress",
          "Display workout completion and recovery progress.",
          settings.showProgress,
          "showProgress"
        )}
        {settingRow(
          "Email Updates",
          "Receive updates from your PT by email.",
          settings.emailUpdates,
          "emailUpdates"
        )}
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]["id"]>("dashboard");

  return (
    <div className="dashboard-wrapper dashboard-patient">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🐴</div>
          <div className="sidebar-logo-text">Gallop!</div>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-profile-icon">🌸</div>
          <div>
            <div className="sidebar-profile-name">Joe Swanson</div>
            <div className="sidebar-profile-role">Patient</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="sidebar-badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <button className="sidebar-logout-btn" onClick={() => navigate("/")}>
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-page-header">
          <div>
            <h1 className="dashboard-page-title">Patient Dashboard</h1>
            <p className="dashboard-page-subtitle">
              2 physical therapists · 2 assigned workouts
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button className="dashboard-notif-btn">🔔</button>
            <div className="dashboard-avatar">JS</div>
          </div>
        </div>

        {activeTab === "dashboard" && <PatientHomePage />}
        {activeTab === "messages" && <MessagesPage />}
        {activeTab === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}