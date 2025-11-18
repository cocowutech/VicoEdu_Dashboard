#!/usr/bin/env python3
"""
Quick verification script to check if the backend setup is correct.
Run this before starting the server to catch configuration issues early.
"""

import sys
from pathlib import Path


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists"""
    exists = Path(filepath).exists()
    status = "✅" if exists else "❌"
    print(f"{status} {filepath}")
    return exists


def check_env_file():
    """Check if .env file exists and has required variables"""
    if not Path(".env").exists():
        print("❌ .env file not found")
        print("   Run: cp .env.example .env")
        return False
    
    print("✅ .env file exists")
    
    required_vars = [
        "DATABASE_URL",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "JWT_SECRET_KEY",
        "GOOGLE_GEMINI_API_KEY",
        "SENDGRID_API_KEY",
        "BUSINESS_EMAIL"
    ]
    
    with open(".env", "r") as f:
        env_content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if var not in env_content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are present")
    return True


def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 10:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} (requires 3.10+)")
        return False


def main():
    print("🔍 GlowGo Backend Setup Verification\n")
    
    all_checks = []
    
    # Check Python version
    print("1. Python Version:")
    all_checks.append(check_python_version())
    print()
    
    # Check required files
    print("2. Required Files:")
    files = [
        "main.py",
        "config.py",
        "requirements.txt",
        ".env.example",
        ".gitignore",
        "routers/health.py",
        "models/database.py",
        "utils/db.py"
    ]
    for file in files:
        all_checks.append(check_file_exists(file))
    print()
    
    # Check .env configuration
    print("3. Environment Configuration:")
    all_checks.append(check_env_file())
    print()
    
    # Check if dependencies are installed
    print("4. Dependencies:")
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import pydantic
        print("✅ Core dependencies installed")
        all_checks.append(True)
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("   Run: pip install -r requirements.txt")
        all_checks.append(False)
    print()
    
    # Summary
    print("=" * 50)
    if all(all_checks):
        print("✅ All checks passed! Ready to run the server.")
        print("\nStart the server with:")
        print("  uvicorn main:app --reload")
        print("\nOr:")
        print("  python main.py")
        return 0
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())


