from redis import Redis
from rq import Queue, Worker
from util.environment import redisHost, redisPort

redis = Redis(host=redisHost,port=redisPort)
q = Queue(connection=redis)

def add_job(task_func, *args, **kwargs):
    return q.enqueue_call(task_func, args, kwargs)

def get_jobs():
    return {
        'queued': q.job_ids,
        'scheduled': q.scheduled_job_registry.get_job_ids(),
        'started': q.started_job_registry.get_job_ids(),
        'finished': q.finished_job_registry.get_job_ids(),
        'failed': q.failed_job_registry.get_job_ids(),
        'deferred': q.deferred_job_registry.get_job_ids(),
    }

def run_worker_once():
    w = Worker(['default'], connection=redis)
    w.work(burst=True)

    return w

def start_worker():
    w = Worker(['default'], connection=redis)
    w.work()

    return w
