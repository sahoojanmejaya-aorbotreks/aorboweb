from supabase import create_client
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from decouple import config

# Load .env file for development (in production, use environment variables)
dotenv_path = Path(__file__).resolve().parent.parent.parent / '.env'
if dotenv_path.exists():
    from decouple import Csv, RepositoryEnv
    os.environ.update(RepositoryEnv(str(dotenv_path)).data)

# SECURITY FIX: Require explicit environment variables - no hardcoded defaults
# Prevents accidental exposure of API keys in source code
# Use decouple.config() to respect both OS env vars and .env file
try:
    SUPABASE_URL = config('SUPABASE_URL')
    SUPABASE_KEY = config('SUPABASE_KEY')
except Exception as e:
    raise ImproperlyConfigured(
        f"Missing required environment variable. Error: {e}. "
        "Set SUPABASE_URL and SUPABASE_KEY in .env file or environment variables"
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)