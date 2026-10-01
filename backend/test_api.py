"""
Script de Prueba y Verificación del Backend y Modelo.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("[*] Probando GET /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    print("    Health:", r.json())

    print("\n[*] Probando GET /api/dashboard...")
    r = client.get("/api/dashboard")
    assert r.status_code == 200, r.text
    dash = r.json()
    print("    Dashboard cards:", dash["cards"])
    print("    Active model:", dash["model_summary"]["selected_model"])

    print("\n[*] Probando POST /api/predict (Caso de ALTO RIESGO)...")
    high_risk_payload = {
        "amount": 3200.0,
        "transaction_date": "2026-03-24",
        "transaction_time": "03:45:00",
        "customer_age": 32,
        "city": "Cartagena",
        "merchant_category": "electronics",
        "payment_method": "crypto",
        "recent_transactions": 5,
        "device_type": "unknown",
        "account_age_days": 15,
        "failed_attempts": 4,
        "usual_city": "Bogota",
        "distance_from_usual_location": 850.0,
        "average_transaction_amount": 120.0,
        "transaction_frequency": 6.5
    }
    r = client.post("/api/predict", json=high_risk_payload)
    assert r.status_code == 200, r.text
    high_res = r.json()
    print("    High risk result:")
    print(f"    Probabilidad: {high_res['fraud_probability']} ({high_res['percentage']}%)")
    print(f"    Nivel: {high_res['risk_level']}")
    print(f"    Recomendación: {high_res['recommendation']}")
    print(f"    Factores detectados ({len(high_res['factors'])}):")
    for f in high_res["factors"]:
        print(f"      - [{f['impact']}] {f['label']}: {f['value']} -> {f['explanation']}")

    print("\n[*] Probando POST /api/predict (Caso de BAJO RIESGO)...")
    low_risk_payload = {
        "amount": 45.0,
        "transaction_date": "2026-03-24",
        "transaction_time": "14:15:00",
        "customer_age": 42,
        "city": "Bogota",
        "merchant_category": "supermarket",
        "payment_method": "debit_card",
        "recent_transactions": 1,
        "device_type": "mobile_android",
        "account_age_days": 720,
        "failed_attempts": 0,
        "usual_city": "Bogota",
        "distance_from_usual_location": 3.5,
        "average_transaction_amount": 55.0,
        "transaction_frequency": 2.1
    }
    r = client.post("/api/predict", json=low_risk_payload)
    assert r.status_code == 200, r.text
    low_res = r.json()
    print("    Low risk result:")
    print(f"    Probabilidad: {low_res['fraud_probability']} ({low_res['percentage']}%)")
    print(f"    Nivel: {low_res['risk_level']}")
    print(f"    Recomendación: {low_res['recommendation']}")

    print("\n[*] Probando GET /api/history...")
    r = client.get("/api/history")
    assert r.status_code == 200, r.text
    history = r.json()
    print(f"    Total registros en historial SQLite: {len(history)}")
    assert len(history) >= 2

    print("\n[OK] TODAS LAS PRUEBAS DE INTEGRACIÓN DEL BACKEND PASARON EXITOSAMENTE!")

if __name__ == "__main__":
    test_endpoints()
