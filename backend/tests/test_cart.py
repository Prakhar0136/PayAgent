from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_cart_crud_and_delete():
    # 1. Create a user if needed or use existing
    user_res = client.post("/users", json={"name": "Test Cart User", "email": "test_cart_user@example.com"})
    if user_res.status_code == 201:
        user_id = user_res.json()["id"]
    else:
        # If user exists, find or create
        user_id = 1

    # 2. Create cart
    cart_res = client.post("/carts", json={"user_id": user_id})
    assert cart_res.status_code == 201
    cart_data = cart_res.json()
    cart_id = cart_data["id"]
    assert cart_data["total"] == 0

    # 3. Get cart
    get_res = client.get(f"/carts/{cart_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == cart_id
    assert "total" in get_res.json()

    # 4. Clear cart items
    clear_res = client.delete(f"/carts/{cart_id}/items")
    assert clear_res.status_code == 200

    # 5. Delete cart completely (tests the fix for 405 Method Not Allowed)
    delete_res = client.delete(f"/carts/{cart_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["cart_id"] == cart_id

    # 6. Verify cart is gone
    not_found_res = client.get(f"/carts/{cart_id}")
    assert not_found_res.status_code == 404
