from flask import Blueprint, render_template, jsonify, request

from services import predict_cgpa, predict_performance, predict_backlog

api_routes = Blueprint("api", __name__)

@api_routes.route("/")
def home():
    return render_template("docx.html")


@api_routes.route("/predictions/cgpa", methods=["POST"])
def cgpa():
    data = request.get_json()
    try:
        prediction = predict_cgpa(data)

        return jsonify({
            "success": True,
            "prediction": {
                "predicted_next_semester_cgpa": prediction
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@api_routes.route("/predictions/performance", methods=["POST"])
def performance():

    data = request.get_json()

    try:
        prediction = predict_performance(data)

        return jsonify({
            "success": True,
            "prediction": {
                "performance": prediction
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@api_routes.route("/predictions/backlog-risk", methods=["POST"])
def backlogRisk():

    data = request.get_json()

    try:
        prediction = predict_backlog(data)

        return jsonify({
            "success": True,
            "prediction": {
                "backlog_status": prediction
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
