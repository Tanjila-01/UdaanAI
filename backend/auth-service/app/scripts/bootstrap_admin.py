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


def bootstrap_admin(email: str, password: str, name: str) -> bool:
    email = (email or "").strip().lower()
    name = (name or "").strip()
    password = password or ""

    if not email or not re.match(EMAIL_REGEX, email):
        print("[ERROR] A valid admin email address is required.", file=sys.stderr)
        return False

    if not password or len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long and cannot be blank.", file=sys.stderr)
        return False

    if not name:
        name = "Udaan Administrator"

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == "admin":
                print(f"[INFO] Admin user '{email}' already exists. No changes made.")
                return True
            else:
                print(f"[WARNING] User '{email}' exists with role '{existing.role}'. Refusing to overwrite silently.")
                return False

        hashed = hash_password(password)
        admin_user = User(
            email=email,
            hashed_password=hashed,
            full_name=name,
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"[SUCCESS] Admin user '{email}' created successfully with role 'admin'.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to bootstrap admin user: {e}", file=sys.stderr)
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Bootstrap Udaan AI Administrator Account")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL"), help="Admin email address")
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"), help="Admin password (>= 8 chars)")
    parser.add_argument("--name", default=os.getenv("ADMIN_NAME", "Udaan Administrator"), help="Admin full name")

    args = parser.parse_args()

    if not args.email or not args.password:
        print("[ERROR] Credentials missing. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables or use --email and --password flags.", file=sys.stderr)
        sys.exit(1)

    success = bootstrap_admin(email=args.email, password=args.password, name=args.name)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
