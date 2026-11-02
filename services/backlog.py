import joblib
import pandas as pd
from pathlib import Path

# Load trained model
MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "backlog_prediction_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict_backlog(data):

    """
    {
        "previous_semester_cgpa": 6.8,
        "attendance_percentage": 65,
        "previous_backlogs": 1,
        "study_time_hours_per_day": 2.5
    }
    """

    # Convert input into DataFrame
    student = pd.DataFrame([data])

    # Generate prediction
    prediction = model.predict(student)[0]

    return str(prediction)
