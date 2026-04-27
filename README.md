VigiBall: Predictive Analytics and Scouting Platform
VigiBall is a full stack web application developed as part of my Final Year Dissertation at Aston University. The project investigates Automation Bias in professional football scouting by using a custom-built Market Value Prediction Algorithm (MVPA).

Overview
The system is designed to measure Automation Bias, which is the human tendency to favor system output over their own expertise or contradictory evidence. By simulating a high pressure Transfer Deadline Day environment, VigiBall analyzes how participants' decision making shifts when presented with Conflict Stimuli such as intentionally suppressed player valuations.

Tech Stack
Frontend: React.js, Tailwind CSS (HCI and UI Design)

Backend: Flask (Python), SQLite3 (Data Persistence)

Testing: Pytest (Backend), Jest (Frontend)

Getting Started
Prerequisites
Latest Version of Python

Node.js and npm

Installation and Setup
Clone the repository
git clone https://github.com/444fourz/VigiBall
cd VigiBall

Backend Setup
cd backend
python app.py

The Flask server will start on http://localhost:5000.

Frontend Setup (Open a new terminal)
cd /frontend
npm install
npm start

The React application will open on http://localhost:3000.

Key Files
backend/engine/valuation.py: The MVPA calculation engine and statistical weighting.

backend/app.py: Flask API routes and Weight of Advice (WoA) calculation logic.

frontend/src/Participant.js: The core experimental UI, timer logic, and HCI triggers.

frontend/src/Admin.js: Researcher console for data analytics and bias tracking.

backend/database/vigiball_v2.db: The main database file used.

License
This project was developed for academic purposes at Aston University. All player data is sourced from Kaggle (https://www.kaggle.com/hubertsidorowicz).
