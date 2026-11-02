import joblib
import pandas as pd
from pathlib import Path

# Load trained model
MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "cgpa_prediction_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict_cgpa(data):

    """
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
    """

    # Convert input into DataFrame
    student = pd.DataFrame([data])

    # Generate prediction
    prediction = model.predict(student)[0]

    return round(float(prediction), 2)
