from flask import Blueprint, render_template

api_routes = Blueprint("api", __name__)

@api_routes.route("/")
def home():
    return render_template("docx.html")

@api_routes.route("/predictions/cgpa")
def cgpa():
    return {
        "name": "CGPA prediction"
    }

@api_routes.route("/predictions/performance")
def performance():
    return {
        "name": "performance prediction"
    }

@api_routes.route("/predictions/backlog-risk")
def backlogRisk():
    return {
        "name": "Backlog Prediction"
    }