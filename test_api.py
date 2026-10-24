
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200


def test_database_health():
    response = client.get("/health/db")
    assert response.status_code == 200


def test_list_users():
    response = client.get("/api/v1/users")
    assert response.status_code == 200


def test_list_wallets():
    response = client.get("/api/v1/wallets", params={"user_id": 1})
    assert response.status_code == 200


def test_list_categories():
    response = client.get("/api/v1/categories", params={"user_id": 1})
    assert response.status_code == 200


def test_list_transactions():
    response = client.get(
        "/api/v1/transactions",
        params={
            "user_id": 1,
            "end_date": "2026-10-24",
            "limit": 10,
            "offset": 0,
        },
    )
    assert response.status_code == 200


def test_list_budgets():
    response = client.get("/api/v1/budgets", params={"user_id": 1})
    assert response.status_code == 200



def test_summary():
    response = client.get(
        "/api/v1/summary",
        params={"user_id": 1},
    )

    assert response.status_code == 200

    body = response.json()
    assert body["message"] == "Ringkasan berhasil dihitung"

    data = body["data"]
    assert float(data["initial_balance"]) == 100000
    assert float(data["total_income"]) == 50000
    assert float(data["total_expense"]) == 20000
    assert float(data["current_balance"]) == 130000
    assert data["total_transactions"] == 2



def test_budget_rejects_invalid_month():
    response = client.post(
        "/api/v1/budgets",
        json={
            "user_id": 1,
            "category_id": 2,
            "amount_limit": 100000,
            "budget_month": "2026-10-24",
        },
    )

    assert response.status_code == 400
    assert "budget_month" in response.json()["error"]
    assert "harus tanggal 1" in response.json()["error"]



from uuid import uuid4



def test_user_crud():
    email = f"pytest_{uuid4().hex[:10]}@example.com"

    # CREATE
    response = client.post(
        "/api/v1/users",
        json={"name": "Pytest User", "email": email},
    )
    assert response.status_code == 201, response.text

    user = response.json()["data"]
    user_id = user["id"]

    try:
        # READ
        read_response = client.get(f"/api/v1/users/{user_id}")
        assert read_response.status_code == 200
        assert read_response.json()["data"]["email"] == email

        # UPDATE
        update_response = client.patch(
            f"/api/v1/users/{user_id}",
            json={"name": "Pytest User Updated"},
        )
        assert update_response.status_code == 200, update_response.text
        assert update_response.json()["data"]["name"] == "Pytest User Updated"

    finally:
        # DELETE: hapus hanya user khusus tes ini
        delete_response = client.delete(f"/api/v1/users/{user_id}")
        assert delete_response.status_code == 200, delete_response.text

    # READ setelah DELETE: seharusnya tidak ditemukan
    final_response = client.get(f"/api/v1/users/{user_id}")
    assert final_response.status_code == 404


def test_wallet_crud():
    email = f"pytest_{uuid4().hex[:10]}@example.com"

    # CREATE USER KHUSUS TES
    user_response = client.post(
        "/api/v1/users",
        json={"name": "Wallet Test User", "email": email},
    )
    assert user_response.status_code == 201, user_response.text

    user_id = user_response.json()["data"]["id"]

    try:
        # CREATE WALLET
        wallet_response = client.post(
            "/api/v1/wallets",
            json={
                "user_id": user_id,
                "name": "Dompet Tes",
                "initial_balance": 50000,
            },
        )
        assert wallet_response.status_code == 201, wallet_response.text

        wallet_id = wallet_response.json()["data"]["id"]

        # READ WALLET
        read_response = client.get(f"/api/v1/wallets/{wallet_id}")
        assert read_response.status_code == 200
        assert read_response.json()["data"]["name"] == "Dompet Tes"

        # UPDATE WALLET
        update_response = client.patch(
            f"/api/v1/wallets/{wallet_id}",
            json={"name": "Dompet Tes Updated"},
        )
        assert update_response.status_code == 200, update_response.text
        assert update_response.json()["data"]["name"] == "Dompet Tes Updated"

        # DELETE WALLET
        delete_wallet_response = client.delete(
            f"/api/v1/wallets/{wallet_id}"
        )
        assert delete_wallet_response.status_code == 200, delete_wallet_response.text

        # PASTIKAN WALLET SUDAH TIDAK ADA
        missing_response = client.get(f"/api/v1/wallets/{wallet_id}")
        assert missing_response.status_code == 404

    finally:
        # User tes dihapus; hanya user yang dibuat oleh tes ini
        client.delete(f"/api/v1/users/{user_id}")


def test_category_crud():
    email = f"pytest_{uuid4().hex[:10]}@example.com"

    # CREATE USER KHUSUS TES
    user_response = client.post(
        "/api/v1/users",
        json={"name": "Category Test User", "email": email},
    )
    assert user_response.status_code == 201, user_response.text
    user_id = user_response.json()["data"]["id"]

    try:
        # CREATE CATEGORY
        category_response = client.post(
            "/api/v1/categories",
            json={
                "user_id": user_id,
                "name": "Kategori Tes",
                "type": "expense",
            },
        )
        assert category_response.status_code == 201, category_response.text
        category_id = category_response.json()["data"]["id"]

        # READ CATEGORY
        read_response = client.get(
            f"/api/v1/categories/{category_id}"
        )
        assert read_response.status_code == 200
        assert read_response.json()["data"]["name"] == "Kategori Tes"

        # UPDATE CATEGORY
        update_response = client.patch(
            f"/api/v1/categories/{category_id}",
            json={"name": "Kategori Tes Updated"},
        )
        assert update_response.status_code == 200, update_response.text
        assert update_response.json()["data"]["name"] == "Kategori Tes Updated"

        # DELETE CATEGORY
        delete_response = client.delete(
            f"/api/v1/categories/{category_id}"
        )
        assert delete_response.status_code == 200, delete_response.text

        # PASTIKAN SUDAH TIDAK ADA
        missing_response = client.get(
            f"/api/v1/categories/{category_id}"
        )
        assert missing_response.status_code == 404

    finally:
        client.delete(f"/api/v1/users/{user_id}")


def test_transaction_crud():
    email = f"pytest_{uuid4().hex[:10]}@example.com"

    # CREATE USER
    user_response = client.post(
        "/api/v1/users",
        json={"name": "Transaction Test User", "email": email},
    )
    assert user_response.status_code == 201, user_response.text
    user_id = user_response.json()["data"]["id"]

    wallet_id = None
    category_id = None

    try:
        # CREATE WALLET
        wallet_response = client.post(
            "/api/v1/wallets",
            json={
                "user_id": user_id,
                "name": "Dompet Transaksi Tes",
                "initial_balance": 100000,
            },
        )
        assert wallet_response.status_code == 201, wallet_response.text
        wallet_id = wallet_response.json()["data"]["id"]

        # CREATE CATEGORY
        category_response = client.post(
            "/api/v1/categories",
            json={
                "user_id": user_id,
                "name": "Makanan Tes",
                "type": "expense",
            },
        )
        assert category_response.status_code == 201, category_response.text
        category_id = category_response.json()["data"]["id"]

        # CREATE TRANSACTION
        transaction_response = client.post(
            "/api/v1/transactions",
            json={
                "user_id": user_id,
                "wallet_id": wallet_id,
                "category_id": category_id,
                "type": "expense",
                "amount": 15000,
                "transaction_date": "2026-10-24",
                "note": "Tes transaksi",
            },
        )
        assert transaction_response.status_code == 201, transaction_response.text
        transaction_id = transaction_response.json()["data"]["id"]

        # READ TRANSACTION
        read_response = client.get(
            f"/api/v1/transactions/{transaction_id}"
        )
        assert read_response.status_code == 200
        assert read_response.json()["data"]["note"] == "Tes transaksi"

        # UPDATE TRANSACTION
        update_response = client.patch(
            f"/api/v1/transactions/{transaction_id}",
            json={"note": "Tes transaksi diperbarui"},
        )
        assert update_response.status_code == 200, update_response.text
        assert (
            update_response.json()["data"]["note"]
            == "Tes transaksi diperbarui"
        )

        # DELETE TRANSACTION
        delete_response = client.delete(
            f"/api/v1/transactions/{transaction_id}"
        )
        assert delete_response.status_code == 200, delete_response.text

        # PASTIKAN SUDAH TIDAK ADA
        missing_response = client.get(
            f"/api/v1/transactions/{transaction_id}"
        )
        assert missing_response.status_code == 404

    finally:
        # Hapus user tes beserta data terkait miliknya
        client.delete(f"/api/v1/users/{user_id}")
