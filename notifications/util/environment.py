import dotenv
import os
import json


class ENVIRONMENT:
    def __init__(self):
        project_dir = os.path.join(os.path.dirname(__file__), os.pardir)
        dotenv_path = os.path.join(project_dir, '.env')
        dotenv.load_dotenv(dotenv_path)
        self.domain = os.getenv("DOMAIN") or 'localhost'
        self.port = os.getenv("PORT") or 8080
        self.prefix = os.getenv("PREFIX")
        self.emailProvider = os.getenv("EMAIL_PROVIDER")
        self.smtpHost = os.getenv("SMTP_HOST")
        self.smtpPort = os.getenv("SMTP_PORT")
        self.awsRegion = os.getenv("AWS_REGION")
        self.redisHost = os.getenv("REDIS_HOST")
        self.redisPort = os.getenv("REDIS_PORT")
        self.sentryDsn = os.getenv("SENTRY_DSN")

    def get_instance(self):
        if not hasattr(self, "_instance"):
            self._instance = ENVIRONMENT()
        return self._instance

    def getDomain(self):
        return self.domain

    def getPort(self):
        return self.port

    def getPrefix(self):
        return self.prefix

    def getEmailProvider(self):
        return self.emailProvider

    def getSmtpHost(self):
        return self.smtpHost

    def getSmtpPort(self):
        return self.smtpPort

    def getAwsRegion(self):
        return self.awsRegion

    def getRedisHost(self):
        return self.redisHost

    def getRedisPort(self):
        return self.redisPort

    def getSentryDsn(self):
        return self.sentryDsn


domain = ENVIRONMENT().get_instance().getDomain()
port = ENVIRONMENT().get_instance().getPort()
prefix = ENVIRONMENT().get_instance().getPrefix()
emailProvider = ENVIRONMENT().get_instance().getEmailProvider()
smtpHost = ENVIRONMENT().get_instance().getSmtpHost()
smtpPort = ENVIRONMENT().get_instance().getSmtpPort()
awsRegion = ENVIRONMENT().get_instance().getAwsRegion()
redisHost = ENVIRONMENT().get_instance().getRedisHost()
redisPort = ENVIRONMENT().get_instance().getRedisPort()
sentryDsn = ENVIRONMENT().get_instance().getSentryDsn()
