# MediCore Hospital V2 Complete

Role-based full-stack upgrade of the original C hospital system.

Roles: Admin, Receptionist, Doctor, Patient.
Modules: patients, doctors, appointments, medical records/prescriptions/notes, user accounts, dashboards.

## Initial login
`Fast / 123`. The first startup seeds this admin plus demo role accounts only if the users collection is empty.

## Important linking
When Admin creates a Doctor or Patient user, set `linked_id` equal to that person's numeric Doctor ID or Patient ID. This scopes their appointments/records.

## Run
Backend: `cd backend`, activate venv, `pip install -r requirements.txt`, `uvicorn app.main:app --reload`
Frontend: `cd frontend`, `npm install`, `npm run dev`

Keep your populated `backend/.env` private. This ZIP contains the template/environment files inherited from V1; verify your local `.env` after extracting.
