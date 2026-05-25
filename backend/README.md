# IntelliTrace - Python Backend

This directory isolates the Python streaming and analytics backend for IntelliTrace.

## Structure

- `src/intellitrace`: Apache Flink streaming pipeline, unsupervised anomaly detection models, and supporting ML tools.
- `tests`: Python unit tests and high-throughput validation scenarios.

## Execution & Testing

To run the unit tests, verify you are inside the `backend` folder and run `pytest`:

```bash
cd backend
# Set PYTHONPATH to prioritize src
$env:PYTHONPATH="src"
pytest
```
