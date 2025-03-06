import boto3
import smtplib
import logging
from botocore.exceptions import ClientError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from util.environment import emailProvider, smtpHost, smtpPort, awsRegion

def format_address(address, name):
    if (name):
        return "{} <{}>".format(name, address)
    else:
        return address

def send_email(email):
    if (emailProvider == 'smtp'):
        server = smtplib.SMTP(smtpHost, smtpPort)
        try :
            message = MIMEMultipart("alternative")
            message["From"] = format_address(email['from'], email['from_name'])
            if isinstance(email['to'], str):
                message["To"] = email['to']
            else:
                message["To"] = ", ".join(email['to'])
            message["Subject"] = email['title']
            # message["reply-to"] = format_address(email['reply'], email['reply_name'])

            if (email['html']):
                body = MIMEText(email['html'], "html")
            else:
                body = MIMEText(email['text'], "plain")
            message.attach(body)

            server.sendmail(email['from'], email['to'], message.as_string())
        except Exception as e:
            logging.warning(e)
            raise e
        else:
            logging.info("Notification email sent to {}".format(", ".join(email['to'])))
        finally:
            server.quit()
    elif (emailProvider == 'aws'):
        try:
            client = boto3.client("ses", region_name=awsRegion)
            if isinstance(email['to'], str):
                email['to'] = [email['to']]
            response = client.send_email(
                Source=format_address(email['from'], email['from_name']),
                Destination={"ToAddresses": email['to']},
                # This field errors out if it is included when empty
                # ReplyToAddresses=[
                #    format_address(email['reply'], email['reply_name']),
                # ],
                ConfigurationSetName="notification-emails",
                Tags=[],
                Message={
                    "Body": {
                        "Html": {"Charset": "utf-8", "Data": email['html']},
                        # This field also errors out if it is included when empty
                        # "Text": {"Charset": "utf-8", "Data": email['text']},
                    },
                    "Subject": {"Charset": "utf-8", "Data": email['title']},
                },
            )
        except ClientError as e:
            logging.warning(e.response['Error']['Message'])
            raise e
        except Exception as e:
            logging.warning(e)
            raise e
        else:
            logging.info("Notification email sent to {}; msg ID {}".format(
                ", ".join(email['to']), response["MessageId"]
            ))
