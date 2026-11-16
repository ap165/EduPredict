# EduPredict

EduPredict is a student academic prediction project built with Python and Flask. It brings together four machine-learning models to estimate a student's next-semester CGPA, classify academic performance, predict backlog status, and suggest a broad career path based on an academic and interest profile.

## Live Application

- **Website:** https://edu-predict-two.vercel.app
- **API Documentation:** https://edu-predict-two.vercel.app/api/v1/

The home page collects student information through one unified form and sends the relevant inputs to all four prediction endpoints. The results are displayed together in a single dashboard.

## Features

- **CGPA Prediction:** Predicts the student's next-semester CGPA on a 10-point scale.
- **Performance Prediction:** Classifies predicted academic performance as Excellent, Very Good, Good, Average, or Poor.
- **Backlog Risk Prediction:** Predicts Backlog or No Backlog using previous CGPA, attendance, previous backlogs, and daily study time.
- **Career Path Prediction:** Recommends a broad career domain using academic performance, skills, interests, projects, internship experience, and career preference.
- **API Documentation:** Includes endpoint details and example requests.
- **Unified Dashboard:** Collects the student's information once, calls all four prediction endpoints concurrently, and displays the responses together.

## Machine Learning Models

| Prediction | ML task | Selected algorithm | Main output |
|---|---|---|---|
| CGPA | Regression | Extra Trees Regressor | Next-semester CGPA (0–10) |
| Performance | Classification | Random Forest Classifier | Excellent / Very Good / Good / Average / Poor |
| Backlog risk | Binary classification | K-Neighbors Classifier | Backlog / No Backlog |
| Career path | Multi-class classification | Logistic Regression | Recommended career domain |

### Model inputs

**CGPA and Performance models** use the same eight inputs:

- `class_12_percentage`
- `class_10_percentage`
- `family_income`
- `hometown`
- `exam_preparation`
- `gaming_hours`
- `attendance_percentage`
- `previous_semester_cgpa`

Categorical values expected by the training data:

- `family_income`: `Low (Below 15,000)`, `Lower middle (15,000-30,000)`, `Upper middle (30,000-50,000)`, `High (Above 50,000)`
- `hometown`: `City` or `Village`
- `exam_preparation` and `gaming_hours`: `0-1 Hour`, `2-3 Hours`, or `More than 3 Hours`
- `attendance_percentage`: `Below 40%`, `40%-59%`, `60%-79%`, or `80%-100%`

**Backlog model** uses four inputs:

- `previous_semester_cgpa` — CGPA on a 10-point scale
- `attendance_percentage` — percentage from 0 to 100
- `previous_backlogs` — previous backlog count
- `study_time_hours_per_day` — daily study hours

**Career Path model** uses the following eleven inputs. The field names are the exact feature names expected by the career-path model:

- `CGPA (out of 10)` — CGPA on a 10-point scale
- `Coding Rating` — coding skill rating
- `Public Speaking Rating` — public-speaking rating
- `Interested Subjects` — subjects the student is interested in
- `Career Area` — the student's preferred or current career area
- `Can Work Long` — whether the student is comfortable with extended work periods
- `Mathematics (%)` — mathematics score or percentage
- `Project Count` — number of completed projects
- `Project Focus` — areas or technologies covered by the projects
- `Internship` — internship experience
- `Career Preference` — `Job` or `Higher Studies`

An illustrative Career Path request:

```json
{
  "CGPA (out of 10)": 8.4,
  "Coding Rating": 8,
  "Public Speaking Rating": 6,
  "Interested Subjects": "Programming",
  "Career Area": "Developer",
  "Can Work Long": "Yes",
  "Mathematics (%)": 85,
  "Project Count": 3,
  "Project Focus": "Programming; Web Technologies",
  "Internship": "Yes",
  "Career Preference": "Job"
}
```

The career-path model groups job-role labels into broad domains, such as Software & Application Development, Data & Database Systems, Cybersecurity & Networking, Cloud & IT Infrastructure, Business & IT Management, QA & Testing, and UI/UX & Product Design.

### Model evaluation

The notebooks compare candidate algorithms using cross-validation and evaluate selected models on held-out test data. The reported results are:

| Model | Evaluation from the notebook |
|---|---|
| CGPA | MAE: 0.3454, RMSE: 0.4957, R²: 0.8947 |
| Performance | Accuracy: 0.7879, Macro F1: 0.7825 |
| Backlog risk | The notebook reports 1.0000 test accuracy and Backlog F1. This result is based on a synthetic target and should not be treated as evidence of real-world prediction accuracy. |
| Career path | Logistic Regression selected; cross-validation Macro F1: 0.1663; cross-validation accuracy: 0.1650; test accuracy: 0.1300; test balanced accuracy: 0.1507; test Macro F1: 0.1312. The majority-class baseline test accuracy was 0.2250. |

**Career model limitation:** The career-path dataset has limited predictive signal, and some dataset features were synthetically constructed during dataset preparation. Its reported test results are low, including performance below the majority-class accuracy baseline. Treat its output as an experimental academic-project recommendation, not as a reliable or validated career assessment.

Performance categories are derived from next-semester CGPA using these thresholds:

| CGPA | Category |
|---|---|
| 9.00–10.00 | Excellent |
| 8.00–8.99 | Very Good |
| 7.00–7.99 | Good |
| 6.00–6.99 | Average |
| Below 6.00 | Poor |

## API Endpoints

All prediction endpoints accept `POST` requests with a JSON body.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/predictions/cgpa` | Predict next-semester CGPA |
| `POST` | `/api/v1/predictions/performance` | Predict the performance category |
| `POST` | `/api/v1/predictions/backlog-risk` | Predict backlog status |
| `POST` | `/api/v1/predictions/career-path` | Recommend a broad career domain |

### Example: CGPA / Performance request

Both endpoints use the same input fields:

```json
{
  "class_12_percentage": 79,
  "class_10_percentage": 75,
  "family_income": "Upper middle (30,000-50,000)",
  "hometown": "City",
  "exam_preparation": "2-3 Hours",
  "gaming_hours": "0-1 Hour",
  "attendance_percentage": "80%-100%",
  "previous_semester_cgpa": 8.2
}
```

Example CGPA response:

```json
{
  "success": true,
  "prediction": {
    "predicted_next_semester_cgpa": 8.25
  }
}
```

Example performance response:

```json
{
  "success": true,
  "prediction": {
    "performance": "Very Good"
  }
}
```

### Example: Backlog risk request

```json
{
  "previous_semester_cgpa": 6.8,
  "attendance_percentage": 65,
  "previous_backlogs": 1,
  "study_time_hours_per_day": 2.5
}
```

Example response:

```json
{
  "success": true,
  "prediction": {
    "backlog_status": "No Backlog"
  }
}
```

### Example: Career Path request

```json
{
  "CGPA (out of 10)": 8.4,
  "Coding Rating": 8,
  "Public Speaking Rating": 6,
  "Interested Subjects": "Programming",
  "Career Area": "Developer",
  "Can Work Long": "Yes",
  "Mathematics (%)": 85,
  "Project Count": 3,
  "Project Focus": "Programming; Web Technologies",
  "Internship": "Yes",
  "Career Preference": "Job"
}
```

Example response:

```json
{
  "success": true,
  "prediction": {
    "recommended_career_path": "Software & Application Development"
  }
}
```

The values shown in the example responses are illustrative; actual predictions depend on the submitted input and loaded model.

## Tech Stack

- **Backend:** Python, Flask
- **Machine Learning:** scikit-learn, pandas, NumPy, joblib
- **Frontend:** HTML, CSS, JavaScript
- **Deployment:** Vercel

## Project Structure

```text
EduPredict/
├── api/
│   ├── __init__.py
│   └── routes.py
├── datasets/
│   ├── backlog_prediction_dataset.csv
│   ├── studentData.csv
│   └── career_path_dataset.csv
├── models/
│   ├── backlog_prediction_model.pkl
│   ├── cgpa_prediction_model.pkl
│   ├── student_performance_model.pkl
│   ├── career_path_prediction_model.pkl
│   └── career_path_target_encoder.pkl
├── python_notebook/
│   ├── student_prediction_models_with_backlog.ipynb
│   └── career_path_prediction_training.ipynb
├── services/
│   ├── __init__.py
│   ├── backlog.py
│   ├── cgpa.py
│   ├── performance.py
│   └── career_path.py
├── static/
│   ├── css/
│   │   ├── documentation.css
│   │   └── home.css
│   └── js/
│       ├── documentation.js
│       └── home.js
├── templates/
│   ├── docx.html
│   └── index.html
├── .gitignore
├── Procfile
├── __main__.py
├── main.py
├── requirements.txt
└── vercel.json
```

The file and directory names for the career-path dataset, model artifacts, training notebook, and service above describe the intended project organization; adjust them to match the names actually committed in your working branch. Python `__pycache__` folders are generated automatically and are not included in the structure above.

## Run Locally

1. Clone the repository and open the project directory:

   ```bash
   git clone https://github.com/ap165/EduPredict.git
   cd EduPredict
   ```

2. Create and activate a virtual environment:

   **Windows PowerShell**

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

   **macOS / Linux**

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. Install the dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

4. Run the Flask application:

   ```bash
   python main.py
   ```

5. Open the application at `http://127.0.0.1:5000`.

The API documentation is available locally at `http://127.0.0.1:5000/api/v1/`.

### scikit-learn compatibility

The saved model files were created with **scikit-learn 1.6.1**. Use the same version when loading them to avoid pickle compatibility warnings or errors:

```bash
python -m pip install scikit-learn==1.6.1
```

## Notebook and Dataset Notes

The `python_notebook/` directory contains the notebooks used for preprocessing, comparing algorithms, evaluating selected models, and saving model pipelines.

The CGPA and performance models use the student academic dataset. The performance target is created from next-semester CGPA using the category thresholds shown above.

The career-path notebook prepares the career dataset, compares candidate classifiers, evaluates the selected model, and saves the artifacts used by the career-path prediction service. Verify the dataset paths and artifact filenames in the notebook and service before retraining or deploying.

The existing CGPA/performance notebook reads data from `datasets/raw/` and `datasets/formatted/` paths in some cells. When rerunning it, place the CSV files in the expected folders or update the paths in the notebook to match the repository's `datasets/` layout.

## Disclaimer

EduPredict is an academic machine-learning project. Its predictions are estimates for demonstration and learning purposes only. The backlog and career-path models have notable dataset limitations and should not be used as the sole basis for academic or career decisions.
