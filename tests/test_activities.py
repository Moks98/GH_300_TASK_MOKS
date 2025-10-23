from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_dict():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure known activity exists
    assert "Chess Club" in data


def test_signup_and_duplicate_prevention():
    # use a temp email not already in activities
    email = "tester+1@mergington.edu"
    activity = "Chess Club"

    # ensure not present initially
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # duplicate signup should return 400
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # cleanup
    activities[activity]["participants"].remove(email)


def test_unregister_participant():
    email = "tester+2@mergington.edu"
    activity = "Programming Class"

    # ensure it's signed up
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_not_signed_up_returns_400():
    email = "not-signed@mergington.edu"
    activity = "Programming Class"

    # ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 400
