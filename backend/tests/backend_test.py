"""PipelineGuard backend tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://deal-freshness.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session", autouse=True)
def seed_once():
    r = requests.post(f"{API}/seed", timeout=30)
    assert r.status_code == 200
    assert r.json()["deals"] == 12
    assert r.json()["reps"] == 3


# --- Reps & Deals ---
def test_get_reps():
    r = requests.get(f"{API}/reps")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    for rep in data:
        assert "id" in rep and "name" in rep and "avatar_url" in rep


def test_get_deals():
    r = requests.get(f"{API}/deals")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 12
    stages = {d["stage"] for d in data}
    assert stages == {"Prospecting", "Qualified", "Negotiation", "Closed Won", "Closed Lost"}


def test_get_deal_404():
    r = requests.get(f"{API}/deals/nonexistent-id-123")
    assert r.status_code == 404


# --- Health summary ---
def test_health_summary():
    r = requests.get(f"{API}/health/summary")
    assert r.status_code == 200
    data = r.json()
    for k in ("hygiene_score", "stale_count", "missing_next_step_count", "rep_hygiene"):
        assert k in data
    scores = [x["hygiene_score"] for x in data["rep_hygiene"]]
    assert scores == sorted(scores, reverse=True)
    assert len(data["rep_hygiene"]) == 3


# --- Extract ---
def test_extract_negotiation_globex():
    text = "Had a fantastic call with Diana Cross the CFO at Globex. We are moving forward and will send the contract. Excited to close this."
    r = requests.post(f"{API}/extract", json={"text": text})
    assert r.status_code == 200
    d = r.json()
    assert d["suggested_stage"] == "Negotiation"
    assert d["suggested_sentiment"] == "positive"
    assert d["matched_deal_id"]
    assert len(d["suggested_stakeholders"]) > 0

    # verify matched_deal_id points to Globex
    dr = requests.get(f"{API}/deals/{d['matched_deal_id']}")
    assert dr.status_code == 200
    assert "Globex" in dr.json()["company"]


def test_extract_closed_lost():
    text = "They said they are not interested and went with a competitor."
    r = requests.post(f"{API}/extract", json={"text": text})
    assert r.status_code == 200
    d = r.json()
    assert d["suggested_stage"] == "Closed Lost"
    assert d["suggested_sentiment"] == "negative"


# --- Confirm update ---
def test_confirm_and_activity():
    deals = requests.get(f"{API}/deals").json()
    deal_id = deals[0]["id"]
    payload = {
        "deal_id": deal_id,
        "raw_text": "TEST_ Confirmed with the team. Next step is to send updated pricing.",
        "stage": "Negotiation",
        "next_step": "Send updated pricing",
        "sentiment": "positive",
        "stakeholders": ["Test Person", "CFO"],
    }
    r = requests.post(f"{API}/deals/{deal_id}/confirm", json=payload)
    assert r.status_code == 200
    act = r.json()
    assert act["extracted_stage"] == "Negotiation"

    # verify deal updated
    d = requests.get(f"{API}/deals/{deal_id}").json()
    assert d["stage"] == "Negotiation"
    assert d["next_step"] == "Send updated pricing"
    assert d["sentiment"] == "positive"
    assert "Test Person" in d["stakeholders"]

    # verify activity present newest-first
    acts = requests.get(f"{API}/deals/{deal_id}/activities").json()
    assert len(acts) >= 1
    assert acts[0]["raw_text"].startswith("TEST_")


def test_seed_resets():
    r = requests.post(f"{API}/seed")
    assert r.status_code == 200
    body = r.json()
    assert body["reps"] == 3 and body["deals"] == 12
    deals = requests.get(f"{API}/deals").json()
    assert len(deals) == 12
