import sys
from pathlib import Path
from fastapi.testclient import TestClient

for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.main import app

client = TestClient(app)


def test_gateway_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["service"] == "api-gateway"
