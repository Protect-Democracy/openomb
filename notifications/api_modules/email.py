from flask_restful import Resource
from flask import request
from lib.email import send_email
from lib.queue import add_job, get_jobs, run_jobs
import json

class SendEmail(Resource):
    def post(self):
        email = json.loads(request.data)
        try:
            send_email(email)
            return { 'status': 200, 'response': 'Message sent!' }
        except Exception as e:
            return { 'status': 500, 'response': str(e) }

class QueueEmail(Resource):
    def get(self):
        return { 'data': get_jobs() }
    def post(self):
        email = json.loads(request.data)
        try:
            job = add_job(send_email, email)
            return { 'status': 200, 'response': 'Message queued!', 'job': { 'id': job.id, 'status': job.get_status() } }
        except Exception as e:
            return { 'status': 500, 'response': str(e) }

class ProcessEmail(Resource):
    def post(self):
        try:
            worker = run_jobs()
            return { 'status': 200, 'response': 'Emails processed!', 'worker': {
            'success': worker.successful_job_count,
            'failure': worker.failed_job_count,
            'time': worker.total_working_time,
            } }
        except Exception as e:
            return { 'status': 500, 'response': str(e) }
