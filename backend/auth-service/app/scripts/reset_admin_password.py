import os
import sys
import argparse
import re
from pathlib import Path

# Add auth-service root to python path
service_root = Path(__file__).resolve().parent.parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


def reset_admin_password(email: str, password: str) -> bool:
    email = (email or "").strip().lower()
    password = password or ""

    if not email or not re.match(EMAIL_REGEX, email):
        print("[ERROR] A valid admin email address is required.", file=sys.stderr)
        return False

    if not password or len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long and cannot be blank.", file=sys.stderr)
        return False

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERROR] User with email '{email}' does not exist.", file=sys.stderr)
            return False

        if user.role != "admin":
            print(f"[ERROR] Refusing to reset password: target user '{email}' does not have the 'admin' role (current role: '{user.role}').", file=sys.stderr)
            return False

        user.hashed_password = hash_password(password)
        db.commit()
        db.refresh(user)
        print(f"[SUCCESS] Password for administrator '{email}' updated successfully.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update administrator password: {e}", file=sys.stderr)
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Reset Udaan AI Administrator Password")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL"), help="Admin email address")
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"), help="New admin password (>= 8 chars)")

    args = parser.parse_args()

    if not args.email or not args.password:
        print("[ERROR] Credentials missing. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables or use --email and --password flags.", file=sys.stderr)
        sys.exit(1)

    success = reset_admin_password(email=args.email, password=args.password)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
