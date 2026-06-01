"""
Root conftest.py for IntelliTrace backend tests.

Adds the `src/` directory to sys.path so that `import intellitrace`
works without needing to install the package in editable mode.
"""
import sys
import os

# Ensure src/ is on the path for all test modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
