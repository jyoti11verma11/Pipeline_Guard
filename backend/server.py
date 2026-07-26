from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STAGES = ["Prospecting", "Qualified", "Negotiation", "Closed Won", "Closed Lost"]


# ---------- Models ----------
class Rep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    avatar_url: str


class Deal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company: str
    value: float
    stage: str
    owner_id: str
    next_step: Optional[str] = None
    sentiment: Optional[str] = "neutral"
    stakeholders: List[str] = Field(default_factory=list)
    last_updated: str  # ISO string
    created_at: str


class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    deal_id: str
    raw_text: str
    extracted_stage: Optional[str] = None
    extracted_next_step: Optional[str] = None
    extracted_sentiment: Optional[str] = None
    extracted_stakeholders: List[str] = Field(default_factory=list)
    created_at: str


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    suggested_stage: Optional[str] = None
    suggested_next_step: Optional[str] = None
    suggested_sentiment: str = "neutral"
    suggested_stakeholders: List[str] = Field(default_factory=list)
    matched_deal_id: Optional[str] = None


class ConfirmRequest(BaseModel):
    deal_id: str
    raw_text: str
    stage: str
    next_step: Optional[str] = None
    sentiment: str = "neutral"
    stakeholders: List[str] = Field(default_factory=list)


# ---------- Mock Extraction Engine ----------
STAGE_KEYWORDS = {
    "Closed Won": ["signed the contract", "closed won", "we won", "deal is signed",
                   "purchase order", "signed off", "purchased", "great news"],
    "Closed Lost": ["not interested", "not a fit", "went with a competitor",
                    "no thanks", "we'll pass", "chose another", "not moving forward"],
    "Negotiation": ["moving forward", "move forward", "send the contract",
                    "send contract", "pricing discussion", "final terms", "redline",
                    "negotiating", "legal review", "proposal", "contract"],
    "Qualified": ["budget confirmed", "decision maker", "qualified", "authority",
                  "timeline is", "has budget", "identified pain"],
    "Prospecting": ["cold outreach", "initial call", "first touch", "discovery",
                    "just introduced", "reached out"],
}

POSITIVE_WORDS = ["excited", "great", "love", "fantastic", "eager", "impressed",
                  "thrilled", "happy", "excellent", "perfect"]
NEGATIVE_WORDS = ["concerned", "worried", "budget issue", "expensive", "hesitant",
                  "problem", "issue", "delay", "pushback", "frustrated"]


def extract_from_text(text: str) -> dict:
    lower = text.lower()

    # Stage detection - priority to more definitive stages
    suggested_stage = None
    for stage in ["Closed Won", "Closed Lost", "Negotiation", "Qualified", "Prospecting"]:
        for kw in STAGE_KEYWORDS[stage]:
            if kw in lower:
                suggested_stage = stage
                break
        if suggested_stage:
            break

    # Sentiment
    pos_hits = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg_hits = sum(1 for w in NEGATIVE_WORDS if w in lower)
    if pos_hits > neg_hits:
        sentiment = "positive"
    elif neg_hits > pos_hits:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Next step - sentence with "next" or "follow up"
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    next_step = None
    for s in sentences:
        sl = s.lower()
        if "next step" in sl or "follow up" in sl or "follow-up" in sl or " next " in f" {sl} ":
            next_step = s.strip()
            break

    # Stakeholders - capitalized name patterns (First Last) and titles
    stakeholders = []
    name_pattern = re.findall(r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b', text)
    for n in name_pattern:
        if n not in stakeholders:
            stakeholders.append(n)
    # Also titled roles like "the CFO", "VP of Sales"
    title_pattern = re.findall(
        r'\b(CEO|CFO|CTO|COO|CMO|VP\s+of\s+\w+|Director\s+of\s+\w+|Head\s+of\s+\w+)\b',
        text)
    for t in title_pattern:
        if t not in stakeholders:
            stakeholders.append(t)

    return {
        "suggested_stage": suggested_stage,
        "suggested_next_step": next_step,
        "suggested_sentiment": sentiment,
        "suggested_stakeholders": stakeholders[:5],
    }


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "PipelineGuard API"}


@api_router.get("/reps", response_model=List[Rep])
async def get_reps():
    docs = await db.reps.find({}, {"_id": 0}).to_list(1000)
    return docs


@api_router.get("/deals", response_model=List[Deal])
async def get_deals():
    docs = await db.deals.find({}, {"_id": 0}).sort("last_updated", -1).to_list(1000)
    return docs


@api_router.get("/deals/{deal_id}", response_model=Deal)
async def get_deal(deal_id: str):
    doc = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Deal not found")
    return doc


@api_router.get("/deals/{deal_id}/activities", response_model=List[Activity])
async def get_deal_activities(deal_id: str):
    docs = await db.activities.find(
        {"deal_id": deal_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return docs


@api_router.post("/extract", response_model=ExtractResponse)
async def extract(req: ExtractRequest):
    result = extract_from_text(req.text)

    # try to match a deal by company name mentioned in text
    deals = await db.deals.find({}, {"_id": 0}).to_list(1000)
    matched_id = None
    lower_text = req.text.lower()
    for d in deals:
        # match by company or first word of company
        company_lower = d["company"].lower()
        first_word = company_lower.split()[0] if company_lower else ""
        if company_lower in lower_text or (first_word and len(first_word) > 3 and first_word in lower_text):
            matched_id = d["id"]
            break

    return ExtractResponse(
        suggested_stage=result["suggested_stage"],
        suggested_next_step=result["suggested_next_step"],
        suggested_sentiment=result["suggested_sentiment"],
        suggested_stakeholders=result["suggested_stakeholders"],
        matched_deal_id=matched_id,
    )


@api_router.post("/deals/{deal_id}/confirm", response_model=Activity)
async def confirm_update(deal_id: str, req: ConfirmRequest):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    now_iso = datetime.now(timezone.utc).isoformat()

    # Update deal
    await db.deals.update_one(
        {"id": deal_id},
        {"$set": {
            "stage": req.stage,
            "next_step": req.next_step,
            "sentiment": req.sentiment,
            "stakeholders": req.stakeholders,
            "last_updated": now_iso,
        }}
    )

    # Log activity
    activity = Activity(
        deal_id=deal_id,
        raw_text=req.raw_text,
        extracted_stage=req.stage,
        extracted_next_step=req.next_step,
        extracted_sentiment=req.sentiment,
        extracted_stakeholders=req.stakeholders,
        created_at=now_iso,
    )
    await db.activities.insert_one(activity.model_dump())
    return activity


@api_router.get("/health/summary")
async def health_summary():
    deals = await db.deals.find({}, {"_id": 0}).to_list(1000)
    now = datetime.now(timezone.utc)
    total = len(deals)
    active_deals = [d for d in deals if d["stage"] not in ("Closed Won", "Closed Lost")]
    active_total = len(active_deals) or 1

    fresh_count = 0
    stale_count = 0
    missing_next_step = 0
    for d in active_deals:
        last = datetime.fromisoformat(d["last_updated"])
        days = (now - last).days
        if days <= 14:
            fresh_count += 1
        if days > 14:
            stale_count += 1
        if not d.get("next_step"):
            missing_next_step += 1

    hygiene_score = round((fresh_count / active_total) * 100)

    # Per-rep hygiene
    reps = await db.reps.find({}, {"_id": 0}).to_list(1000)
    rep_hygiene = []
    for r in reps:
        rep_deals = [d for d in active_deals if d["owner_id"] == r["id"]]
        rep_total = len(rep_deals) or 1
        rep_fresh = 0
        for d in rep_deals:
            last = datetime.fromisoformat(d["last_updated"])
            if (now - last).days <= 14:
                rep_fresh += 1
        rep_hygiene.append({
            "rep_id": r["id"],
            "rep_name": r["name"],
            "avatar_url": r["avatar_url"],
            "hygiene_score": round((rep_fresh / rep_total) * 100) if rep_deals else 0,
            "deal_count": len(rep_deals),
        })
    rep_hygiene.sort(key=lambda x: x["hygiene_score"], reverse=True)

    return {
        "hygiene_score": hygiene_score,
        "stale_count": stale_count,
        "missing_next_step_count": missing_next_step,
        "total_deals": total,
        "active_deals": len(active_deals),
        "rep_hygiene": rep_hygiene,
    }


@api_router.post("/seed")
async def seed():
    await db.reps.delete_many({})
    await db.deals.delete_many({})
    await db.activities.delete_many({})

    reps = [
        Rep(name="Sarah Chen", email="sarah@pipelineguard.io",
            avatar_url="https://images.pexels.com/photos/12396627/pexels-photo-12396627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"),
        Rep(name="David Martinez", email="david@pipelineguard.io",
            avatar_url="https://images.unsplash.com/photo-1527980965255-d3b416303d12?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDB8fHx8MTc4NTA1NDM0MHww&ixlib=rb-4.1.0&q=85"),
        Rep(name="Michael Park", email="michael@pipelineguard.io",
            avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDB8fHx8MTc4NTA1NDM0MHww&ixlib=rb-4.1.0&q=85"),
    ]
    for r in reps:
        await db.reps.insert_one(r.model_dump())

    now = datetime.now(timezone.utc)
    # (company, value, stage, owner_idx, days_ago, next_step, sentiment, stakeholders)
    deal_data = [
        ("Acme Corporation", 45000, "Prospecting", 0, 2, "Send discovery deck by Friday", "neutral", ["Rebecca Liu"]),
        ("Northwind Traders", 120000, "Qualified", 0, 5, "Schedule demo with CTO team", "positive", ["Alan Wright", "CTO"]),
        ("Globex Industries", 78000, "Negotiation", 1, 3, "Finalize pricing with procurement", "positive", ["Diana Cross", "CFO"]),
        ("Initech LLC", 32000, "Prospecting", 2, 22, None, "neutral", []),
        ("Stark Enterprises", 240000, "Negotiation", 1, 9, "Send redlined contract", "neutral", ["Pepper Potts", "VP of Legal"]),
        ("Wayne Holdings", 95000, "Qualified", 2, 6, "Follow up on budget confirmation", "positive", ["Lucius Fox"]),
        ("Umbrella Group", 58000, "Closed Won", 0, 12, "Kick off implementation", "positive", ["William Birkin"]),
        ("Wonka Industries", 41000, "Closed Lost", 2, 30, None, "negative", ["Charlie Bucket"]),
        ("Vandelay Imports", 27000, "Prospecting", 0, 27, None, "neutral", []),
        ("Pied Piper", 62000, "Qualified", 1, 4, "Technical deep dive next Tuesday", "positive", ["Richard Hendricks", "CTO"]),
        ("Hooli Systems", 180000, "Negotiation", 1, 25, None, "negative", ["Gavin Belson"]),
        ("Massive Dynamic", 150000, "Qualified", 2, 8, "Present ROI analysis", "positive", ["Nina Sharp", "VP of Sales"]),
    ]

    deals_to_seed = []
    for company, value, stage, owner_idx, days_ago, next_step, sentiment, stakeholders in deal_data:
        last_updated = (now - timedelta(days=days_ago)).isoformat()
        created_at = (now - timedelta(days=days_ago + 30)).isoformat()
        d = Deal(
            company=company,
            value=value,
            stage=stage,
            owner_id=reps[owner_idx].id,
            next_step=next_step,
            sentiment=sentiment,
            stakeholders=stakeholders,
            last_updated=last_updated,
            created_at=created_at,
        )
        deals_to_seed.append(d)
        await db.deals.insert_one(d.model_dump())

    # Add some sample activities on a couple of deals
    sample_activities = [
        (deals_to_seed[1].id,
         "Had a great call with the CTO team at Northwind. They confirmed budget and want to schedule a demo. Follow up next week.",
         "Qualified", "Schedule demo with CTO team", "positive", ["Alan Wright"], 5),
        (deals_to_seed[2].id,
         "Diana from Globex is moving forward. Pricing discussion went well. Next step is to finalize contract terms.",
         "Negotiation", "Finalize pricing with procurement", "positive", ["Diana Cross", "CFO"], 3),
        (deals_to_seed[6].id,
         "Signed the contract with Umbrella. Great news! Time to kick off implementation.",
         "Closed Won", "Kick off implementation", "positive", ["William Birkin"], 12),
    ]
    for deal_id, text, stg, ns, sent, sh, days in sample_activities:
        ts = (now - timedelta(days=days)).isoformat()
        act = Activity(
            deal_id=deal_id, raw_text=text, extracted_stage=stg,
            extracted_next_step=ns, extracted_sentiment=sent,
            extracted_stakeholders=sh, created_at=ts,
        )
        await db.activities.insert_one(act.model_dump())

    return {"ok": True, "reps": len(reps), "deals": len(deals_to_seed)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed():
    count = await db.deals.count_documents({})
    if count == 0:
        # Auto-seed on first boot
        logger.info("No deals found, auto-seeding database...")
        try:
            await seed()
        except Exception as e:
            logger.error(f"Auto-seed failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
