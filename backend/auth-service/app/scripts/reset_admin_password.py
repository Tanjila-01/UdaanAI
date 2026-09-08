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

import getpass
import json
import urllib.request
import urllib.error

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


def verify_authentication(email: str, password: str, endpoints: list = None) -> bool:
    """
    Verifies that the new password authenticates successfully against
    the running auth service or AuthService without printing tokens.
    """
    urls = endpoints if endpoints is not None else [
        "http://localhost:8001/auth/login",
        "http://localhost:8000/auth/login",
    ]
    verified = False
    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps({"email": email, "password": password}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    print(f"[SUCCESS] Authentication verified: '{email}' successfully logged in (HTTP {resp.status}).")
                    verified = True
                    break
        except urllib.error.HTTPError as e:
            if e.code == 401:
                # Explicit 401 from running service means credentials failed against live server
                # Continue checking or fallback
                pass
            continue
        except Exception:
            continue

    if not verified:
        try:
            from app.services.auth_service import AuthService
            from app.schemas.auth import UserLogin
            db = SessionLocal()
            try:
                auth_res = AuthService.authenticate_user(db, UserLogin(email=email, password=password))
                if auth_res and "access_token" in auth_res:
                    print(f"[SUCCESS] Authentication verified: '{email}' credentials validated via in-service authenticator.")
                    verified = True
            finally:
                db.close()
        except Exception:
            pass

    if not verified:
        print(f"[ERROR] Authentication verification failed for '{email}'.", file=sys.stderr)

    return verified



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
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL", "admin@udaan.ai"), help="Admin email address (default: admin@udaan.ai)")
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"), help="New admin password (>= 8 chars; hidden prompt if omitted)")
    parser.add_argument("--skip-verify", action="store_true", help="Skip authentication verification step")

    args = parser.parse_args()

    email = (args.email or "").strip().lower()
    if not email:
        email = input("Admin email address: ").strip().lower()

    password = args.password
    if not password:
        try:
            password = getpass.getpass(f"Enter new password for {email}: ")
        except (EOFError, KeyboardInterrupt):
            print("\n[ERROR] Password entry cancelled.", file=sys.stderr)
            sys.exit(1)

    if not password or len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long and cannot be blank.", file=sys.stderr)
        sys.exit(1)

    success = reset_admin_password(email=email, password=password)
    if not success:
        sys.exit(1)

    if not args.skip_verify:
        if not verify_authentication(email=email, password=password):
            print("[ERROR] Password was updated, but authentication verification failed.", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()

