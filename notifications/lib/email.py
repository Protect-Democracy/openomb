import boto3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from util.environment import emailProvider, smtpHost, smtpPort, awsRegion

sender_email = "notifier@openomb.org"
reply_email = "reply@openomb.org"

def send_email(email):
    if (emailProvider == 'smtp'):
        server = smtplib.SMTP(smtpHost, smtpPort)
        try :
            message = MIMEMultipart("alternative")
            message["From"] = "OpenOMB Notifications <{}>".format(sender_email)
            message["To"] = ", ".join(email['to'])
            message["Subject"] = email['title']
            message["reply-to"] = "OpenOMB Help <{}>".format(reply_email)

            if (email['html']):
                body = MIMEText(email['html'], "html")
            else:
                body = MIMEText(email['text'], "plain")
            message.attach(body)

            server.sendmail(sender_email, email['to'], message.as_string())
        except Exception as e:
            print(e)
        finally:
            server.quit()
    else if (emailProvider == 'aws'):
        client = boto3.client("ses", region_name=awsRegion)
        client.send_email(
            Source="OpenOMB Notifications <{}>".format(sender_email),
            Destination={"ToAddresses": email['to']},
            ReplyToAddresses=[
                "OpenOMB Help <{}>".format(reply_email)
            ],
            ConfigurationSetName=EMAIL_CONFIGURATION_SET,
            Tags=tags,
            Message={
                "Body": {
                    "Html": {"Charset": "utf-8", "Data": email['html']},
                    "Text": {"Charset": "utf-8", "Data": email['plain']},
                },
                "Subject": {"Charset": "utf-8", "Data": email['title']},
            },
        )
