from api_modules.email import ProcessEmail, QueueEmail, SendEmail
import sentry_sdk
from flask import Flask, jsonify
from flask_cors import CORS
from flask_restful import Api, MethodNotAllowed, NotFound
from util.environment import sentryDsn


sentry_sdk.init(
    dsn=sentryDsn,
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profiles_sample_rate to 1.0 to profile 100%
    # of sampled transactions.
    # We recommend adjusting this value in production.
    profiles_sample_rate=1.0,
)

# ============================================
# Main
# ============================================
application = Flask(__name__)
app = application
app.config["PROPAGATE_EXCEPTIONS"] = True
CORS(app)
api = Api(app, prefix="", catch_all_404s=True)

# ============================================
# Swagger
# ============================================
# build_swagger_config_json()
# swaggerui_blueprint = get_swaggerui_blueprint(
#     prefix,
#     f'http://{domain}:8080/swagger-config',
#     config={
#         'app_name': "Flask API",
#         "layout": "BaseLayout",
#         "docExpansion": "none"
#     },
# )
# app.register_blueprint(swaggerui_blueprint)

# ============================================
# Error Handler
# ============================================


@app.errorhandler(NotFound)
def handle_method_not_found(e):
    response = jsonify({"message": str(e)})
    response.status_code = 404
    return response


@app.errorhandler(MethodNotAllowed)
def handle_method_not_allowed_error(e):
    response = jsonify({"message": str(e)})
    response.status_code = 405
    return response


@app.route("/")
def route_home():
    return jsonify({"message": "ok"})


# ============================================
# Add Resource
# ============================================

# Email
api.add_resource(SendEmail, "/email/send")
api.add_resource(QueueEmail, "/email/queue")
api.add_resource(ProcessEmail, "/email/process")

if __name__ == "__main__":
    app.run(8080)
