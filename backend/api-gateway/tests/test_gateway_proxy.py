import sys
from pathlib import Path
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient

# Clear cached 'app' modules to ensure service isolation when running full test suite
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


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_pathways_list(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"total": 6, "pathways": [{"id": "c10-puc"}, {"id": "c10-diploma"}]},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/pathways")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 6
    assert len(data["pathways"]) == 2
    mock_request.assert_called_once()
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["method"] == "GET"
    assert call_kwargs["url"].endswith("/roadmaps/pathways")


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_pathways_list_filtered(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"total": 3, "education_level": "Class 10", "pathways": [{"id": "c10-puc"}]},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/pathways?education_level=Class%2010")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["params"] == {"education_level": "Class 10"}


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_pathways_list_multiple_filters(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"total": 1, "education_level": "PUC 2", "stream": "Science", "pathways": [{"id": "puc-science-eng"}]},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/pathways?education_level=PUC%202&stream=Science")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["params"] == {"education_level": "PUC 2", "stream": "Science"}


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_pathway_detail(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"id": "c10-puc", "title": "Pre-University College (PUC)", "options": [], "milestones": []},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/pathways/c10-puc")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "c10-puc"
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["url"].endswith("/roadmaps/pathways/c10-puc")


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_pathway_detail_404(mock_request):
    mock_resp = httpx.Response(
        404,
        json={"detail": "Pathway 'does-not-exist' was not found."},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/pathways/does-not-exist")
    assert res.status_code == 404
    data = res.json()
    assert data["detail"] == "Pathway 'does-not-exist' was not found."


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_upstream_unavailable(mock_request):
    mock_request.side_effect = httpx.RequestError("Connection failed", request=None)

    res = client.get("/api/v1/roadmaps/pathways")
    assert res.status_code == 503
    data = res.json()
    assert data["detail"] == "Roadmap service is temporarily unavailable."


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_disallowed_method(mock_request):
    mock_resp = httpx.Response(
        405,
        json={"detail": "Method Not Allowed"},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.post("/api/v1/roadmaps/pathways")
    assert res.status_code == 405
    assert res.json() == {"detail": "Method Not Allowed"}


@patch("httpx.AsyncClient.request")
def test_proxy_roadmap_unmapped_route(mock_request):
    mock_resp = httpx.Response(
        404,
        json={"detail": "Not Found"},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/roadmaps/unknown-route")
    assert res.status_code == 404
    assert res.json() == {"detail": "Not Found"}


@patch("httpx.AsyncClient.request")
def test_proxy_career_recommendations_generate(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"generated_at": "2026-08-28T12:00:00Z", "recommendations": []},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.post("/api/v1/career-intelligence/recommendations/generate")
    assert res.status_code == 200
    data = res.json()
    assert "generated_at" in data
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["method"] == "POST"
    assert call_kwargs["url"].endswith("/career-intelligence/recommendations/generate")


@patch("httpx.AsyncClient.request")
def test_proxy_career_recommendations_me(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"recommendations": []},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    res = client.get("/api/v1/career-intelligence/recommendations/me")
    assert res.status_code == 200
    data = res.json()
    assert "recommendations" in data
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["method"] == "GET"
    assert call_kwargs["url"].endswith("/career-intelligence/recommendations/me")


@patch("httpx.AsyncClient.request")
def test_proxy_workshop_requests_public(mock_request):
    mock_resp = httpx.Response(
        201,
        json={"id": "b3e34b12-9c3f-4e3b-9a91-91a5db1fbb60", "status": "NEW", "created_at": "2026-09-05T15:00:00Z"},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    payload = {
        "institution_name": "Test College",
        "institution_type": "degree_college",
        "contact_name": "Test Contact",
        "contact_phone": "9876543210",
        "contact_email": "test@college.edu",
        "district": "Bengaluru Urban",
        "student_count": 150,
        "preferred_mode": "online",
        "preferred_topics": ["future_skills"],
    }
    res = client.post("/api/v1/workshops/requests", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "NEW"
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["method"] == "POST"
    assert call_kwargs["url"].endswith("/workshops/requests")


@patch("httpx.AsyncClient.request")
def test_proxy_workshop_admin_overview_with_auth(mock_request):
    mock_resp = httpx.Response(
        200,
        json={"metrics": {"new_requests": 3, "contacted_requests": 1, "scheduled_workshops": 2, "completed_workshops": 5, "upcoming_this_week": 1}, "recent_new_requests": [], "upcoming_workshops": []},
        headers={"content-type": "application/json"}
    )
    mock_request.return_value = mock_resp

    headers = {"Authorization": "Bearer test-admin-jwt"}
    res = client.get("/api/v1/workshops/admin/overview", headers=headers)
    assert res.status_code == 200
    call_kwargs = mock_request.call_args.kwargs
    assert call_kwargs["method"] == "GET"
    assert call_kwargs["url"].endswith("/workshops/admin/overview")
    assert call_kwargs["headers"].get("authorization") == "Bearer test-admin-jwt"

