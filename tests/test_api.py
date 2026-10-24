"""Tes end-to-end terhadap PostgreSQL sungguhan (mengikuti checklist uji endpoint).

Gunakan database UJI, bukan database data nyata. Contoh menjalankan:
    TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/finance_test pytest -v
"""

import os
import pathlib
import uuid

import pytest

DB_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not DB_URL, reason="TEST_DATABASE_URL belum diatur")

ROOT = pathlib.Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def client():
    os.environ["DATABASE_URL"] = DB_URL
    from fastapi.testclient import TestClient

    from app.database import get_engine
    from app.main import app

    with get_engine().begin() as conn:
        for name in ("schema.sql", "seed.sql"):
            for statement in (ROOT / "database" / name).read_text().split(";"):
                if statement.strip():
                    conn.exec_driver_sql(statement)
    with TestClient(app) as test_client:
        yield test_client


def _category_id(client, user_id, name):
    rows = client.get("/api/v1/categories", params={"user_id": user_id}).json()["data"]
    return next(c["id"] for c in rows if c["name"] == name)


def test_alur_lengkap(client):
    # --- siapkan data uji
    email = f"{uuid.uuid4().hex[:8]}@example.com"
    user = client.post("/api/v1/users", json={"name": "Uji", "email": email})
    assert user.status_code == 201
    uid = user.json()["data"]["id"]
    assert client.post("/api/v1/users", json={"name": "Uji", "email": email}).status_code == 409

    wallet = client.post(
        "/api/v1/wallets", json={"user_id": uid, "name": "Cash", "initial_balance": 250000}
    )
    assert wallet.status_code == 201
    wid = wallet.json()["data"]["id"]
    food = _category_id(client, uid, "Makanan")
    salary = _category_id(client, uid, "Gaji / Uang Saku")

    # --- POST transaksi
    body = {"user_id": uid, "wallet_id": wid, "category_id": food, "type": "expense",
            "amount": 18000, "transaction_date": "2026-10-23", "note": "Makan siang"}
    created = client.post("/api/v1/transactions", json=body)
    assert created.status_code == 201
    tx = created.json()["data"]
    assert tx["amount"] == "18000.00"

    income = client.post("/api/v1/transactions", json={**body, "category_id": salary,
                         "type": "income", "amount": 1500000, "note": "Uang saku"})
    assert income.status_code == 201

    # --- validasi: nominal nol/negatif, tipe kategori tidak cocok
    assert client.post("/api/v1/transactions", json={**body, "amount": 0}).status_code == 400
    assert client.post("/api/v1/transactions", json={**body, "amount": -1}).status_code == 400
    assert client.post("/api/v1/transactions", json={**body, "type": "income"}).status_code == 400

    # --- 404, PATCH, PUT
    assert client.get("/api/v1/transactions/999999999").status_code == 404
    patched = client.patch(f"/api/v1/transactions/{tx['id']}", json={"note": "Makan malam"})
    assert patched.status_code == 200 and patched.json()["data"]["note"] == "Makan malam"
    put_body = {k: body[k] for k in ("wallet_id", "category_id", "type", "amount",
                                      "transaction_date", "note")}
    assert client.put(f"/api/v1/transactions/{tx['id']}", json=put_body).status_code == 200

    # --- filter kategori
    listed = client.get("/api/v1/transactions", params={"user_id": uid, "category_id": food})
    assert listed.status_code == 200
    assert {t["category_id"] for t in listed.json()["data"]} == {food}

    # --- ringkasan: 250000 + 1500000 - 18000
    summary = client.get("/api/v1/summary", params={"user_id": uid}).json()["data"]
    assert summary["current_balance"] == "1732000.00"
    by_cat = client.get("/api/v1/summary/by-category",
                        params={"user_id": uid, "month": "2026-10"}).json()["data"]
    assert by_cat["total_expense"] == "18000.00"

    # --- anggaran
    budget = client.post("/api/v1/budgets", json={"user_id": uid, "category_id": food,
                         "amount_limit": 90000, "budget_month": "2026-10-01"})
    assert budget.status_code == 201
    assert budget.json()["data"]["percentage_used"] == 20.0
    assert client.post("/api/v1/budgets", json={"user_id": uid, "category_id": food,
                       "amount_limit": 1, "budget_month": "2026-10-01"}).status_code == 409

    # --- ekspor lalu impor
    exported = client.get("/api/v1/export", params={"user_id": uid})
    assert exported.status_code == 200
    items = exported.json()["data"]["transactions"]
    imported = client.post("/api/v1/import", json={"user_id": uid, "transactions": items})
    assert imported.status_code == 201 and imported.json()["data"]["imported"] == len(items)

    # --- hapus dompet/kategori yang dipakai ditolak
    assert client.delete(f"/api/v1/wallets/{wid}").status_code == 409
    assert client.delete(f"/api/v1/categories/{food}").status_code == 409  # bawaan

    # --- hapus transaksi
    assert client.delete(f"/api/v1/transactions/{tx['id']}").status_code == 200
    assert client.get(f"/api/v1/transactions/{tx['id']}").status_code == 404

    # --- bersihkan
    assert client.delete(f"/api/v1/users/{uid}").status_code == 200
