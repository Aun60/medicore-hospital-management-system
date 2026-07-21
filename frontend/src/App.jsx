import React, { useEffect, useState } from "react";
import {
  HeartPulse,
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileHeart,
  ShieldCheck,
  LogOut,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const fields = {
  Patients: [
    "name",
    "age",
    "gender",
    "contact",
    "address",
    "email",
    "disease",
  ],
  Doctors: [
    "name",
    "age",
    "gender",
    "contact",
    "address",
    "specialize",
    "department",
    "availability",
    "email",
  ],
  Appointments: [
    "patient_id",
    "doctor_id",
    "date",
    "time",
    "reason",
  ],
  Records: [
    "patient_id",
    "diagnosis",
    "prescription",
    "notes",
  ],
  Users: [
    "username",
    "password",
    "name",
    "role",
    "linked_id",
  ],
};

export default function App() {
  const [t, setT] = useState(localStorage.token);
  const [u, setU] = useState(
    JSON.parse(localStorage.user || "null")
  );

  const [page, setPage] = useState("Dashboard");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const logout = () => {
    localStorage.clear();
    setT(null);
    setU(null);
  };

  const req = async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      throw Error("Session expired");
    }

    if (!response.ok) {
      throw Error(data.detail || "Something went wrong");
    }

    return data;
  };

  const ep = page.toLowerCase();

  const load = async () => {
    try {
      if (page === "Dashboard") {
        setStats(await req("/api/dashboard"));
      } else {
        setRows(await req("/api/" + ep));
      }
    } catch (error) {
      setMsg(error.message);
      setRows([]);
    }
  };

  useEffect(() => {
    if (t && u) {
      load();
    }
  }, [t, u, page]);

  if (!t || !u) {
    return (
      <Auth
        done={(token, user) => {
          localStorage.token = token;
          localStorage.user = JSON.stringify(user);

          setT(token);
          setU(user);
        }}
      />
    );
  }

  const role = u.role;

  let nav;

  if (role === "admin") {
    nav = [
      "Dashboard",
      "Patients",
      "Doctors",
      "Appointments",
      "Records",
      "Users",
    ];
  } else if (role === "receptionist") {
    nav = [
      "Dashboard",
      "Patients",
      "Doctors",
      "Appointments",
    ];
  } else {
    nav = [
      "Dashboard",
      "Patients",
      "Doctors",
      "Appointments",
      "Records",
    ];
  }

  const canAdd =
    (page === "Patients" &&
      ["admin", "receptionist"].includes(role)) ||
    (page === "Doctors" && role === "admin") ||
    (page === "Appointments" &&
      ["admin", "receptionist"].includes(role)) ||
    (page === "Records" && role === "doctor") ||
    (page === "Users" && role === "admin");

  const openAddModal = () => {
    setForm({});
    setModal(true);
  };

  const openEditModal = (record) => {
    setForm({
      ...record,
      _editId: record.id,
    });

    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();

    let body = { ...form };

    const editId = body._editId;

    // Remove fields that should never be sent back
    delete body._editId;
    delete body._id;
    delete body.created_at;
    delete body.updated_at;
    delete body.discharged_at;
    delete body.status;

    [
      "age",
      "patient_id",
      "doctor_id",
      "linked_id",
    ].forEach((key) => {
      if (body[key] !== undefined && body[key] !== "") {
        body[key] = Number(body[key]);
      }
    });

    try {
      // EDIT PATIENT OR DOCTOR
      if (
        editId &&
        (page === "Patients" || page === "Doctors")
      ) {
        await req(`/api/${ep}/${editId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });

        setMsg(
          page === "Patients"
            ? "Patient updated successfully"
            : "Doctor updated successfully"
        );
      }

      // ADD NEW RECORD
      else {
        const result = await req(`/api/${ep}`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (result.patient_id) {
          setMsg(
            `Patient registered successfully. Patient ID: ${result.patient_id}`
          );
        } else if (result.doctor_id) {
          setMsg(
            `Doctor added successfully. Doctor ID: ${result.doctor_id}`
          );
        } else {
          setMsg("Saved successfully");
        }
      }

      setModal(false);
      setForm({});

      await load();
    } catch (error) {
      setMsg(error.message);
    }
  };

  const handleDelete = async (record) => {
    const isPatient = page === "Patients";

    const message = isPatient
      ? `Are you sure you want to discharge ${record.name}?`
      : `Are you sure you want to deactivate Dr. ${record.name}?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      await req(`/api/${ep}/${record.id}`, {
        method: "DELETE",
      });

      setMsg(
        isPatient
          ? "Patient discharged successfully"
          : "Doctor deactivated successfully"
      );

      await load();
    } catch (error) {
      setMsg(error.message);
    }
  };

  const closeModal = () => {
    setModal(false);
    setForm({});
  };

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <HeartPulse />

          <span>
            MediCore
            <small>Hospital Management System</small>
          </span>
        </div>

        {nav.map((n) => (
          <button
            key={n}
            className={page === n ? "active" : ""}
            onClick={() => {
              setPage(n);
              setMsg("");
            }}
          >
            {n === "Dashboard" ? (
              <LayoutDashboard />
            ) : n === "Patients" ? (
              <Users />
            ) : n === "Doctors" ? (
              <Stethoscope />
            ) : n === "Appointments" ? (
              <CalendarDays />
            ) : n === "Records" ? (
              <FileHeart />
            ) : (
              <ShieldCheck />
            )}

            {n}
          </button>
        ))}

        <button
          className="logout"
          onClick={logout}
        >
          <LogOut />
          Logout
        </button>
      </aside>

      <main>
        <header>
          <div>
            <h1>{page}</h1>

            <p>
              {u.name} · {role}
            </p>
          </div>

          <div className="avatar">
            {u.name.slice(0, 2).toUpperCase()}
          </div>
        </header>

        {msg && (
          <div
            className="toast"
            onClick={() => setMsg("")}
          >
            {msg}
          </div>
        )}

        {page === "Dashboard" ? (
          <>
            <section className="hero">
              <div>
                <span>
                  {role.toUpperCase()} PORTAL
                </span>

                <h2>
                  Welcome, {u.name}
                </h2>

                <p>
                  Smart Hospital Management,
                  Simplified.
                </p>
              </div>

              <HeartPulse />
            </section>

            <div className="cards">
              {Object.entries(stats).map(
                ([key, value]) => (
                  <div
                    className="card"
                    key={key}
                  >
                    <div>
                      <strong>
                        {value}
                      </strong>

                      <span>
                        {key.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <div className="toolbar">
              <div />

              {canAdd && (
                <button
                  className="primary"
                  onClick={openAddModal}
                >
                  <Plus />

                  Add{" "}
                  {page.slice(0, -1)}
                </button>
              )}
            </div>

            <section className="panel">
              <h3>
                {role === "patient" &&
                page === "Patients"
                  ? "My Profile"
                  : role === "doctor" &&
                    page === "Patients"
                  ? "Assigned Patients"
                  : page}
              </h3>

              <Table
                rows={rows}
                page={page}
                role={role}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            </section>
          </>
        )}

        {modal && (
          <div className="overlay">
            <form
              className="modal"
              onSubmit={save}
            >
              <div className="modalhead">
                <div>
                  <h2>
                    {form._editId
                      ? `Edit ${page.slice(
                          0,
                          -1
                        )}`
                      : `Add ${page.slice(
                          0,
                          -1
                        )}`}
                  </h2>

                  <p>
                    {form._editId
                      ? "Update the information below."
                      : "Enter the information below."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                >
                  <X />
                </button>
              </div>

              <div className="grid">
                {fields[page].map(
                  (key) => (
                    <label key={key}>
                      {key
                        .replaceAll(
                          "_",
                          " "
                        )
                        .replace(
                          /\b\w/g,
                          (c) =>
                            c.toUpperCase()
                        )}

                      <input
                        required={
                          ![
                            "email",
                            "disease",
                            "prescription",
                            "notes",
                            "linked_id",
                          ].includes(key)
                        }
                        type={
                          key === "password"
                            ? "password"
                            : key === "date"
                            ? "date"
                            : key === "time"
                            ? "time"
                            : [
                                "age",
                                "patient_id",
                                "doctor_id",
                                "linked_id",
                              ].includes(
                                key
                              )
                            ? "number"
                            : "text"
                        }
                        value={
                          form[key] || ""
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]:
                              e.target
                                .value,
                          })
                        }
                      />
                    </label>
                  )
                )}
              </div>

              <div className="modalactions">
                <button
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  type="submit"
                >
                  {form._editId
                    ? "Update"
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function Auth({ done }) {
  const [reg, setReg] =
    useState(false);

  const [f, setF] = useState({
    username: "Fast",
    password: "123",
  });

  const [m, setM] =
    useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      const response =
        await fetch(
          API +
            (reg
              ? "/api/auth/register-patient"
              : "/api/auth/login"),
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(f),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setM(
          data.detail ||
            "Something went wrong"
        );

        return;
      }

      if (reg) {
        setM(
          `Registered successfully. Your unique Patient ID is ${data.patient_id}. Please sign in.`
        );

        setReg(false);

        setF({
          username: f.username,
          password: f.password,
        });
      } else {
        done(
          data.access_token,
          data.user
        );
      }
    } catch {
      setM(
        "Unable to connect to the server."
      );
    }
  };

  const registrationFields = [
    "name",
    "age",
    "gender",
    "contact",
    "address",
    "email",
    "username",
    "password",
  ];

  const loginFields = [
    "username",
    "password",
  ];

  const authFields = reg
    ? registrationFields
    : loginFields;

  return (
    <div className="login">
      <div className="loginart">
        <HeartPulse />

        <h1>MediCore</h1>

        <p>
          Smart Hospital Management,
          Simplified.
        </p>
      </div>

      <form onSubmit={submit}>
        <h2>
          {reg
            ? "Patient Registration"
            : "Welcome back"}
        </h2>

        {m && (
          <div className="error">
            {m}
          </div>
        )}

        {authFields.map((key) => (
          <label key={key}>
            {key
              .replace(
                /\b\w/g,
                (c) =>
                  c.toUpperCase()
              )}

            <input
              required
              type={
                key === "password"
                  ? "password"
                  : key === "age"
                  ? "number"
                  : "text"
              }
              value={f[key] || ""}
              onChange={(e) =>
                setF({
                  ...f,
                  [key]:
                    e.target.value,
                })
              }
            />
          </label>
        ))}

        <button
          className="primary"
          type="submit"
        >
          {reg
            ? "Register"
            : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => {
            setReg(!reg);
            setM("");
            setF({});
          }}
          style={{
            marginTop: 15,
            border: 0,
            background: "none",
            cursor: "pointer",
          }}
        >
          {reg
            ? "Already registered? Sign in"
            : "New patient? Register here"}
        </button>
      </form>
    </div>
  );
}

function Table({
  rows,
  page,
  role,
  onEdit,
  onDelete,
}) {
  if (!rows.length) {
    return (
      <div className="empty">
        No records available.
      </div>
    );
  }

  const keys = Object.keys(
    rows[0]
  ).filter(
    (key) =>
      ![
        "_id",
        "created_at",
        "password",
      ].includes(key)
  );

  // Admin + Receptionist:
  // Can edit/discharge patients
  const canManagePatient =
    page === "Patients" &&
    ["admin", "receptionist"].includes(
      role
    );

  // Admin only:
  // Can edit/deactivate doctors
  const canManageDoctor =
    page === "Doctors" &&
    role === "admin";

  const showActions =
    canManagePatient ||
    canManageDoctor;

  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key}>
                {key.replaceAll(
                  "_",
                  " "
                )}
              </th>
            ))}

            {showActions && (
              <th>Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((record) => (
            <tr
              key={
                record._id ||
                record.id
              }
            >
              {keys.map((key) => (
                <td key={key}>
                  {String(
                    record[key] ?? ""
                  )}
                </td>
              ))}

              {showActions && (
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() =>
                        onEdit(record)
                      }
                    >
                      <Pencil
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      title={
                        page ===
                        "Patients"
                          ? "Discharge"
                          : "Deactivate"
                      }
                      onClick={() =>
                        onDelete(
                          record
                        )
                      }
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}