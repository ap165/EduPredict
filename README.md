# EduPredict

EduPredict is a student academic prediction project built with Python and Flask. It uses three machine learning models to estimate a student's next-semester CGPA, classify academic performance, and predict backlog status.

## Live Application

- **Website:** https://edu-predict-two.vercel.app
- **API Documentation:** https://edu-predict-two.vercel.app/api/v1/

The home page collects student information once and sends it to all three prediction endpoints. The results are then displayed together.

## Features

- **CGPA Prediction:** Predicts the student's next-semester CGPA on a 10-point scale.
- **Performance Prediction:** Classifies predicted academic performance as Excellent, Very Good, Good, Average, or Poor.
- **Backlog Risk Prediction:** Predicts Backlog or No Backlog using previous CGPA, attendance, previous backlogs, and daily study time.
- **API Documentation:** Includes endpoint details and example requests.
- **Combined Dashboard:** Submits the shared form data to all three models and displays the responses dynamically.

## Machine Learning Models

| Prediction | ML task | Selected algorithm | Main output |
|---|---|---|---|
| CGPA | Regression | Extra Trees Regressor | Next-semester CGPA (0–10) |
| Performance | Classification | Random Forest Classifier | Excellent / Very Good / Good / Average / Poor |
| Backlog risk | Binary classification | K-Neighbors Classifier | Backlog / No Backlog |

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

### Model evaluation

The notebook compares multiple candidate algorithms using cross-validation before selecting a model. The selected models were evaluated on a held-out test split.

| Model | Evaluation from the notebook |
|---|---|
| CGPA | MAE: 0.3454, RMSE: 0.4957, R²: 0.8947 |
| Performance | Accuracy: 0.7879, Macro F1: 0.7825 |
| Backlog risk | The notebook reports 1.0000 test accuracy and Backlog F1. This result is based on a synthetic target and should not be treated as evidence of real-world prediction accuracy. |

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

The values shown in the example responses are illustrative; actual predictions depend on the submitted input and loaded model.

## Tech Stack

- **Backend:** Python, Flask
- **Machine Learning:** scikit-learn, pandas, NumPy, joblib
- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Deployment:** Vercel

## Project Structure

```text
EduPredict/
├── api/
│   ├── __init__.py
│   └── routes.py
├── datasets/
│   ├── backlog_prediction_dataset.csv
│   └── studentData.csv
├── models/
│   ├── backlog_prediction_model.pkl
│   ├── cgpa_prediction_model.pkl
│   └── student_performance_model.pkl
├── python_notebook/
│   ├── student_prediction_models_with_backlog.ipynb
│   └── student_prediction_models_with_backlog_0_62044500_1793629483.pdf
├── services/
│   ├── __init__.py
│   ├── backlog.py
│   ├── cgpa.py
│   └── performance.py
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

Python `__pycache__` folders are generated automatically and are not included in the structure above.

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

The `python_notebook/` directory contains the notebook used for preprocessing, comparing algorithms, evaluating the selected models, and saving the model pipelines.

The CGPA and performance models use the student academic dataset. The performance target is created from next-semester CGPA using the category thresholds shown above.

**Important:** The backlog dataset contains 493 synthetically generated records. Its `Backlog` / `No Backlog` labels are generated from assumed relationships between the input features; they are not verified historical examination outcomes. The backlog model is therefore a development/demo component and must be validated with real student data before being used for real academic risk assessment. Its reported test score should not be interpreted as real-world accuracy.

The notebook reads data from `datasets/raw/` and `datasets/formatted/` paths in some cells. When rerunning it, place the CSV files in the expected folders or update the paths in the notebook to match the repository's `datasets/` layout.

## Disclaimer

EduPredict is an academic machine learning project. Its predictions are estimates for demonstration and learning purposes only. They should not be used as the sole basis for academic decisions.
