import joblib
import pandas as pd
from pathlib import Path

# Load trained model
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"

MODEL_PATH = MODEL_DIR / "career_path_prediction_model.pkl"
ENCODER_PATH = MODEL_DIR / "career_path_target_encoder.pkl"

model = joblib.load(MODEL_PATH)
target_encoder = joblib.load(ENCODER_PATH)


def predict_career_path(data):

    """
    Example input:

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
    """

    # Expected input columns
    feature_columns = [
        "CGPA (out of 10)",
        "Coding Rating",
        "Public Speaking Rating",
        "Interested Subjects",
        "Career Area",
        "Can Work Long",
        "Mathematics (%)",
        "Project Count",
        "Project Focus",
        "Internship",
        "Career Preference"
    ]

    # Validate input
    missing_fields = [
        field for field in feature_columns
        if field not in data
    ]

    if missing_fields:
        raise ValueError(
            f"Missing required fields: {missing_fields}"
        )

    # Convert input into DataFrame
    student = pd.DataFrame(
        [data],
        columns=feature_columns
    )

    # Generate prediction
    prediction = model.predict(student)[0]

    # Decode predicted career domain
    career_path = target_encoder.inverse_transform(
        [int(prediction)]
    )[0]

    return str(career_path)
