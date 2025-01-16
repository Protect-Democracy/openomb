import boto3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from util.environment import emailProvider, smtpHost, smtpPort, awsRegion

def format_address(address, name):
    if (name):
        return "{} <{}>".format(name, email)
    else:
        return email

def send_email(email):
    if (emailProvider == 'smtp'):
        server = smtplib.SMTP(smtpHost, smtpPort)
        try :
            message = MIMEMultipart("alternative")
            message["From"] = format_address(email['from'], email['from_name'])
            message["To"] = ", ".join(email['to'])
            message["Subject"] = email['title']
            message["reply-to"] = format_address(email['reply'], email['reply_name'])

            if (email['html']):
                body = MIMEText(email['html'], "html")
            else:
                body = MIMEText(email['text'], "plain")
            message.attach(body)

            server.sendmail(email['from'], email['to'], message.as_string())
        except Exception as e:
            print(e)
        finally:
            server.quit()
    else if (emailProvider == 'aws'):
        client = boto3.client("ses", region_name=awsRegion)
        client.send_email(
            Source=format_address(email['from'], email['from_name']),
            Destination={"ToAddresses": email['to']},
            ReplyToAddresses=[
                format_address(email['reply'], email['reply_name']),
            ],
            ConfigurationSetName="notification_emails",
            Tags=[],
            Message={
                "Body": {
                    "Html": {"Charset": "utf-8", "Data": email['html']},
                    "Text": {"Charset": "utf-8", "Data": email['plain']},
                },
                "Subject": {"Charset": "utf-8", "Data": email['title']},
            },
        )
