# Use the official Python 3.8 slim image as the base image
FROM public.ecr.aws/bitnami/python:3.9-prod AS python-base

# Set the working directory within the container
WORKDIR /notification-api

# Upgrade pip and install Python dependencies
COPY requirements.txt .
RUN pip3 install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the necessary files and directories into the container
COPY ./api_modules/ ./api_modules/
COPY ./lib/ ./lib/
COPY ./util/ ./util/
COPY app.py .

# Expose port 8080 for the Flask application
EXPOSE 8080

# Define the command to run the Flask application using Gunicorn
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8080", "-w", "4"]
