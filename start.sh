#!/bin/bash
echo "Starting SOC Pipeline Infrastructure..."
cd docker && docker-compose up -d
cd ..

echo "Starting Alerts API..."
cd alerts-api && npm start &
API_PID=$!
cd ..

echo "Starting Detection Service..."
cd detection-service && npm start &
DET_PID=$!
cd ..

echo "Starting Analyst Dashboard..."
cd dashboard && npm run dev &
DASH_PID=$!
cd ..

echo "SOC Pipeline is running!"
echo "To stop, press Ctrl+C"

trap "kill $API_PID $DET_PID $DASH_PID; cd docker && docker-compose down" EXIT

wait
