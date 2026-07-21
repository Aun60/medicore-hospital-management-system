import os, hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient, ReturnDocument


# ===================== CONFIG =====================

load_dotenv()

db = MongoClient(os.getenv("MONGODB_URL"))[
    os.getenv("DATABASE_NAME", "medicore_hms")
]

SECRET = os.getenv("JWT_SECRET", "change-me")

app = FastAPI(
    title="MediCore Hospital Management System",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ===================== HELPERS =====================

def hp(s):
    return hashlib.sha256(s.encode()).hexdigest()


def now():
    return datetime.now(timezone.utc)


def ser(d):
    if d:
        d["_id"] = str(d["_id"])
    return d


def auth(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")

    try:
        return jwt.decode(
            authorization[7:],
            SECRET,
            algorithms=["HS256"]
        )
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


def allow(*roles):
    def dep(u=Depends(auth)):
        if u["role"] not in roles:
            raise HTTPException(403, "Permission denied")
        return u
    return dep


def next_id(key, start):
    c = db.counters.find_one_and_update(
        {"_id": key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    if c["seq"] == 1:
        db.counters.update_one(
            {"_id": key},
            {"$set": {"seq": start}}
        )
        return start

    return c["seq"]


# ===================== MODELS =====================

class Login(BaseModel):
    username: str
    password: str


class Register(BaseModel):
    name: str
    age: int
    gender: str
    contact: str
    address: str
    email: str
    username: str
    password: str


class Patient(BaseModel):
    name: str
    age: int
    gender: str
    contact: str
    address: str
    email: str = ""
    disease: str = ""


class Doctor(BaseModel):
    name: str
    age: int
    gender: str
    contact: str
    address: str
    specialize: str
    department: str = "General"
    availability: str = "Available"
    email: str = ""


class Appointment(BaseModel):
    patient_id: int
    doctor_id: int
    date: str
    time: str
    reason: str


class Record(BaseModel):
    patient_id: int
    diagnosis: str
    prescription: str = ""
    notes: str = ""


class Staff(BaseModel):
    username: str
    password: str
    name: str
    role: str
    linked_id: Optional[int] = None


# ===================== STARTUP =====================

@app.on_event("startup")
def startup():
    db.patients.create_index("id", unique=True)
    db.doctors.create_index("id", unique=True)
    db.users.create_index("username", unique=True)

    if not db.users.find_one({"role": "admin"}):
        db.users.insert_one({
            "username": os.getenv("ADMIN_USERNAME", "Fast"),
            "password": hp(os.getenv("ADMIN_PASSWORD", "123")),
            "name": "Administrator",
            "role": "admin",
            "active": True
        })


@app.get("/")
def root():
    return {"message": "MediCore Hospital Management System API"}


# ===================== AUTH =====================

@app.post("/api/auth/register-patient", status_code=201)
def register(x: Register):
    if db.users.find_one({"username": x.username}):
        raise HTTPException(409, "Username already exists")

    pid = next_id("patient", 1001)

    db.patients.insert_one({
        "id": pid,
        "name": x.name,
        "age": x.age,
        "gender": x.gender,
        "contact": x.contact,
        "address": x.address,
        "email": x.email,
        "disease": "",
        "status": "Registered",
        "created_at": now()
    })

    db.users.insert_one({
        "username": x.username,
        "password": hp(x.password),
        "name": x.name,
        "role": "patient",
        "linked_id": pid,
        "active": True
    })

    return {
        "message": "Registration successful",
        "patient_id": pid
    }


@app.post("/api/auth/login")
def login(x: Login):
    u = db.users.find_one({
        "username": x.username,
        "password": hp(x.password),
        "active": {"$ne": False}
    })

    if not u:
        raise HTTPException(401, "Incorrect credentials")

    payload = {
        "sub": u["username"],
        "name": u["name"],
        "role": u["role"],
        "linked_id": u.get("linked_id"),
        "exp": now() + timedelta(hours=12)
    }

    return {
        "access_token": jwt.encode(
            payload,
            SECRET,
            algorithm="HS256"
        ),
        "user": payload
    }


# ===================== DASHBOARD =====================

@app.get("/api/dashboard")
def dashboard(u=Depends(auth)):
    if u["role"] == "patient":
        pid = u.get("linked_id")

        return {
            "appointments": db.appointments.count_documents(
                {"patient_id": pid}
            ),
            "medical_records": db.medical_records.count_documents(
                {"patient_id": pid}
            )
        }

    if u["role"] == "doctor":
        did = u.get("linked_id")

        return {
            "appointments": db.appointments.count_documents(
                {"doctor_id": did}
            ),
            "assigned_patients": len(
                db.appointments.distinct(
                    "patient_id",
                    {"doctor_id": did}
                )
            )
        }

    return {
        "patients": db.patients.count_documents({}),
        "doctors": db.doctors.count_documents({
            "availability": {"$ne": "Inactive"}
        }),
        "appointments": db.appointments.count_documents({})
    }


# ===================== PATIENTS =====================

@app.get("/api/patients")
def patients(u=Depends(auth)):
    if u["role"] in ("admin", "receptionist"):
        q = {}

    elif u["role"] == "patient":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Patient account is not linked"
            )

        q = {"id": u["linked_id"]}

    elif u["role"] == "doctor":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Doctor account is not linked"
            )

        ids = db.appointments.distinct(
            "patient_id",
            {
                "doctor_id": u["linked_id"],
                "status": {
                    "$in": [
                        "Scheduled",
                        "Confirmed",
                        "Completed"
                    ]
                }
            }
        )

        q = {"id": {"$in": ids}}

    else:
        raise HTTPException(403, "Permission denied")

    return [
        ser(x)
        for x in db.patients.find(q)
    ]


@app.post("/api/patients")
def add_patient(
    x: Patient,
    u=Depends(allow("admin", "receptionist"))
):
    pid = next_id("patient", 1001)

    db.patients.insert_one({
        **x.model_dump(),
        "id": pid,
        "status": "Registered",
        "created_at": now()
    })

    return {
        "message": "Patient registered",
        "patient_id": pid
    }


@app.put("/api/patients/{pid}")
def update_patient(
    pid: int,
    x: Patient,
    u=Depends(allow("admin", "receptionist"))
):
    patient = db.patients.find_one({"id": pid})

    if not patient:
        raise HTTPException(404, "Patient not found")

    db.patients.update_one(
        {"id": pid},
        {"$set": x.model_dump()}
    )

    return {
        "message": "Patient updated successfully"
    }


# Permanently delete patient and linked login account
@app.delete("/api/patients/{pid}")
def delete_patient(
    pid: int,
    u=Depends(allow("admin", "receptionist"))
):
    patient = db.patients.find_one({"id": pid})

    if not patient:
        raise HTTPException(404, "Patient not found")

    db.patients.delete_one({"id": pid})

    db.users.delete_one({
        "role": "patient",
        "linked_id": pid
    })

    return {
        "message": "Patient deleted successfully"
    }


# ===================== DOCTORS =====================

@app.get("/api/doctors")
def doctors(u=Depends(auth)):
    return [
        ser(x)
        for x in db.doctors.find({
            "availability": {"$ne": "Inactive"}
        })
    ]


@app.post("/api/doctors")
def add_doctor(
    x: Doctor,
    u=Depends(allow("admin"))
):
    did = next_id("doctor", 501)

    db.doctors.insert_one({
        **x.model_dump(),
        "id": did,
        "created_at": now()
    })

    return {
        "message": "Doctor added successfully",
        "doctor_id": did
    }


@app.put("/api/doctors/{did}")
def update_doctor(
    did: int,
    x: Doctor,
    u=Depends(allow("admin"))
):
    doctor = db.doctors.find_one({"id": did})

    if not doctor:
        raise HTTPException(404, "Doctor not found")

    db.doctors.update_one(
        {"id": did},
        {"$set": x.model_dump()}
    )

    return {
        "message": "Doctor updated successfully"
    }


@app.delete("/api/doctors/{did}")
def remove_doctor(
    did: int,
    u=Depends(allow("admin"))
):
    doctor = db.doctors.find_one({"id": did})

    if not doctor:
        raise HTTPException(404, "Doctor not found")

    db.doctors.update_one(
        {"id": did},
        {"$set": {"availability": "Inactive"}}
    )

    return {
        "message": "Doctor deactivated successfully"
    }


# ===================== APPOINTMENTS =====================

@app.get("/api/appointments")
def appointments(u=Depends(auth)):
    if u["role"] in ("admin", "receptionist"):
        q = {}

    elif u["role"] == "patient":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Patient account is not linked"
            )

        q = {"patient_id": u["linked_id"]}

    elif u["role"] == "doctor":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Doctor account is not linked"
            )

        q = {"doctor_id": u["linked_id"]}

    else:
        raise HTTPException(403, "Permission denied")

    return [
        ser(x)
        for x in db.appointments.find(q).sort(
            "created_at",
            -1
        )
    ]


@app.post("/api/appointments")
def create_appointment(
    x: Appointment,
    u=Depends(allow("admin", "receptionist"))
):
    if not db.patients.find_one({
        "id": x.patient_id,
        "status": {"$ne": "Discharged"}
    }):
        raise HTTPException(
            404,
            "Active patient not found"
        )

    if not db.doctors.find_one({
        "id": x.doctor_id,
        "availability": {"$ne": "Inactive"}
    }):
        raise HTTPException(
            404,
            "Doctor not found"
        )

    result = db.appointments.insert_one({
        **x.model_dump(),
        "status": "Scheduled",
        "created_at": now()
    })

    return ser(
        db.appointments.find_one({
            "_id": result.inserted_id
        })
    )


# ===================== MEDICAL RECORDS =====================

@app.get("/api/records")
def records(u=Depends(auth)):
    if u["role"] == "receptionist":
        raise HTTPException(
            403,
            "Receptionists cannot access clinical records"
        )

    if u["role"] == "patient":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Patient account is not linked"
            )

        q = {"patient_id": u["linked_id"]}

    elif u["role"] == "doctor":
        if not u.get("linked_id"):
            raise HTTPException(
                403,
                "Doctor account is not linked"
            )

        q = {"doctor_id": u["linked_id"]}

    elif u["role"] == "admin":
        q = {}

    else:
        raise HTTPException(403, "Permission denied")

    return [
        ser(x)
        for x in db.medical_records.find(q).sort(
            "created_at",
            -1
        )
    ]


@app.post("/api/records")
def add_record(
    x: Record,
    u=Depends(allow("doctor"))
):
    did = u.get("linked_id")

    if not did:
        raise HTTPException(
            403,
            "Doctor account is not linked"
        )

    assigned = db.appointments.find_one({
        "patient_id": x.patient_id,
        "doctor_id": did,
        "status": {
            "$in": [
                "Scheduled",
                "Confirmed",
                "Completed"
            ]
        }
    })

    if not assigned:
        raise HTTPException(
            403,
            "Patient is not assigned to this doctor"
        )

    result = db.medical_records.insert_one({
        **x.model_dump(),
        "doctor_id": did,
        "created_at": now()
    })

    return ser(
        db.medical_records.find_one({
            "_id": result.inserted_id
        })
    )


# ===================== USERS / STAFF =====================

@app.get("/api/users")
def users(u=Depends(allow("admin"))):
    return [
        ser({
            k: v
            for k, v in x.items()
            if k != "password"
        })
        for x in db.users.find()
    ]


@app.post("/api/users")
def create_staff(
    x: Staff,
    u=Depends(allow("admin"))
):
    if x.role not in (
        "admin",
        "receptionist",
        "doctor"
    ):
        raise HTTPException(
            400,
            "Invalid staff role"
        )

    if x.role == "doctor":
        if (
            not x.linked_id
            or not db.doctors.find_one({
                "id": x.linked_id
            })
        ):
            raise HTTPException(
                400,
                "Valid Doctor ID required"
            )

    if db.users.find_one({
        "username": x.username
    }):
        raise HTTPException(
            409,
            "Username already exists"
        )

    db.users.insert_one({
        **x.model_dump(exclude={"password"}),
        "password": hp(x.password),
        "active": True
    })

    return {
        "message": "Staff account created successfully"
    }