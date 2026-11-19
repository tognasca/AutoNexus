"""Integration smoke checks for an isolated, migrated AutoNexus test instance.

Set AUTONEXUS_TEST_URL, AUTONEXUS_TEST_EMAIL and AUTONEXUS_TEST_PASSWORD.
Creates test stock, customers, a seller, reservations and a sale in that instance.
"""
import concurrent.futures
import datetime
import json
import os
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("AUTONEXUS_TEST_URL", "http://127.0.0.1:55080").rstrip("/")
EMAIL = os.environ["AUTONEXUS_TEST_EMAIL"]
PASSWORD = os.environ["AUTONEXUS_TEST_PASSWORD"]
SUFFIX = uuid.uuid4().hex[:6]
results = []


def call(path, method="GET", data=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + "/api" + path,
        data=None if data is None else json.dumps(data).encode(), headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=30)
        status, raw = response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read().decode()
    allowed = expected if isinstance(expected, tuple) else (expected,)
    assert status in allowed, (path, status, raw[:1200])
    try:
        return json.loads(raw) if raw else None
    except json.JSONDecodeError:
        return raw


def check(name):
    results.append(name)
    print("PASS:", name, flush=True)


def run():
    auth = call("/auth/login", "POST", {"email": EMAIL, "password": PASSWORD})
    token = auth["token"]
    types = call("/lookup/vehicle-types", token=token)
    row = {"vehicleTypeId": types[0]["id"], "brand": "Toyota", "model": "Corolla",
        "manufacturingYear": 2023, "modelYear": 2024, "plate": "T" + SUFFIX.upper(),
        "purchaseValue": 80000, "listedValue": 100000, "mileage": 35000, "transmission": 2}
    preview = call("/store-setup/import", "POST", {"rows": [row]}, token)
    assert preview["accepted"] == 1
    broken = dict(row, modelYear=1800)
    call("/store-setup/import", "POST", {"rows": [broken], "commit": True}, token, expected=400)
    assert call("/store-setup/import", "POST", {"rows": [row], "commit": True}, token)["accepted"] == 1
    assert call("/store-setup/import", "POST", {"rows": [row], "commit": True}, token)["accepted"] == 0
    vehicle = next(v for v in call("/vehicles?search=" + row["plate"], token=token)["items"] if v["plate"] == row["plate"])
    vid = vehicle["id"]
    check("prévia, validação e reenvio idempotente de importação")

    lead = call("/leads", "POST", {"name": "Cliente " + SUFFIX, "phone": "11999999999",
        "source": "Manual", "vehicleId": vid}, token, expected=201)
    lid = lead["id"]
    call("/leads/" + lid + "/attendance", "PUT",
        {"offerValue": 95000, "downPayment": 20000, "tradeDescription": "Troca a avaliar",
         "completedOn": None, "offerValidUntil": (datetime.date.today() + datetime.timedelta(days=1)).isoformat()}, token, expected=200)
    call("/launch/leads/" + lid + "/preferences", "PUT",
        {"budget": 110000, "transmission": 2, "models": "Corolla, Civic"}, token, expected=204)
    assert any(item["id"] == lid for item in call("/launch/vehicles/" + vid + "/interested", token=token))
    check("preferências persistidas e cruzamento com o estoque")

    shared = call("/launch/leads/" + lid + "/proposal", "POST", {}, token)
    secret = shared["path"].split("/")[-1]
    snapshot = call("/launch/proposals/" + secret)
    assert snapshot["value"] == 95000 and snapshot["store"]
    assert "purchaseValue" not in snapshot and "phone" not in snapshot
    call("/launch/proposals/" + secret + "/response", "POST", {"action": "adjustment", "message": "Podemos conversar?"})
    assert "Ajuste" in call("/launch/leads/" + lid, token=token)["buyerResponse"]
    call("/launch/leads/" + lid + "/proposal", "POST", {}, token)
    call("/launch/proposals/" + secret, expected=404)
    call("/launch/leads/" + lid + "/proposal", "DELETE", token=token, expected=204)
    check("proposta anônima, retorno do comprador, renovação e revogação")

    categories = call("/lookup/cost-categories", token=token)
    call("/vehicles/" + vid + "/costs", "POST", {"costCategoryId": categories[0]["id"],
        "description": "Preparação de teste", "value": 5000, "costDate": datetime.datetime.now(datetime.timezone.utc).isoformat()}, token, expected=201)
    margin = call("/launch/vehicles/" + vid + "/margin?offer=95000", token=token)
    assert margin["values"]["profit"] == 10000 and margin["values"]["totalCost"] == 85000
    check("margem com custos e desconto contabilizado uma única vez")

    expires = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)).isoformat()
    def reserve(_):
        return call("/launch/vehicles/" + vid + "/reserve", "POST",
            {"leadId": lid, "expiresAt": expires}, token, expected=(204, 409))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        replies = list(pool.map(reserve, range(2)))
    assert sum(value is None for value in replies) == 1
    seller_email = "seller-" + SUFFIX + "@example.test"
    call("/users", "POST", {"name": "Vendedor teste", "email": seller_email, "password": PASSWORD, "profile": 2}, token)
    seller = call("/auth/login", "POST", {"email": seller_email, "password": PASSWORD})["token"]
    call("/vehicles/" + vid + "/sell", "POST", {"saleValue": 95000}, seller, expected=409)
    check("reserva concorrente e bloqueio de fechamento por outro vendedor")
    call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": "payment", "done": True}, token, expected=409)
    call("/vehicles/" + vid + "/sell", "POST", {"saleValue": 95000}, token)
    call("/vehicles/" + vid + "/sell", "POST", {"saleValue": 95000}, token, expected=409)
    call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": "handover", "done": True}, token, expected=409)
    for step in ["payment", "documents", "accessories", "handover"]:
        checklist = call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": step, "done": True}, token)
        assert checklist[step]["completedAt"] and checklist[step]["userId"]
    call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": "payment", "done": False}, token, expected=409)
    assert call("/launch/vehicles/" + vid + "/margin", token=token)["realized"]
    check("venda única, entrega em ordem e rastreabilidade de responsáveis")

    finance = {"customerName": "Cliente teste", "customerCpf": "00000000000", "monthlyIncome": 10000,
        "hasDriverLicense": True, "vehicleName": "Corolla", "vehicleId": vid,
        "vehiclePrice": 100000, "entryValue": 20000, "tradeValue": 10000,
        "financedAmount": 70000, "months": 48, "installmentValue": 2000, "privacyConsent": True}
    manual = call("/financing/proposals", "POST", finance, token, expected=201)
    invalid = dict(finance, financedAmount=80000)
    call("/financing/proposals", "POST", invalid, token, expected=400)
    call("/financing/proposals", "POST", dict(finance, vehicleId=str(uuid.uuid4())), token, expected=400)
    for extension in ["json", "xml", "txt", "csv"]:
        call("/financing/proposals/" + manual["id"] + "/export/" + extension, token=token)
    credit = call("/credit/submit-proposal", "POST", dict(finance, bankId="santander", bankName="Santander"), token)
    assert credit["status"] == "Unavailable"
    history = call("/financing/proposals", token=token)
    historical = next(item for item in history if item["proposalNumber"] == credit["proposalNumber"])
    assert historical["vehiclePrice"] == 100000 and historical["entryValue"] == 20000
    call("/financing/proposals/" + historical["id"] + "/export/csv", token=token)
    check("financiamento: saldo, vínculo, registro, exportações e estado sem envio bancário")
    plans = call("/signup/plans")
    plan = next(item for item in plans if item.get("trialDays", 0) > 0)
    other = call("/signup", "POST", {"companyName": "Outra loja " + SUFFIX,
        "adminName": "Admin B", "adminEmail": "admin-b-" + SUFFIX + "@example.test",
        "adminPassword": PASSWORD, "planId": plan["id"], "cycle": 1,
        "acceptTermsOfUse": True, "acceptPrivacyPolicy": True, "acceptCookiePolicy": True})
    other_token = other["login"]["token"]
    for endpoint in ["/launch/leads/" + lid, "/launch/vehicles/" + vid + "/margin", "/launch/vehicles/" + vid + "/delivery"]:
        call(endpoint, token=other_token, expected=404)
    call("/launch/leads/" + lid + "/proposal", "POST", {}, other_token, expected=404)
    call("/launch/vehicles/" + vid + "/reserve", "POST", {"leadId": lid, "expiresAt": expires}, other_token, expected=404)
    call("/financing/proposals/" + manual["id"], token=other_token, expected=404)
    check("isolamento entre duas empresas reais, inclusive propostas e financiamento")

    return {"token": token, "leadId": lid, "vehicleId": vid, "auth": auth, "results": results}


if __name__ == "__main__":
    run()
