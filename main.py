from flask import Flask, render_template
from api import api_routes

app = Flask(__name__)

app.register_blueprint(api_routes, url_prefix="/api/v1")


@app.route("/")
def home():

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")