"""Integration smoke checks for an isolated, migrated AutoNexus test instance.

Set AUTONEXUS_TEST_URL, AUTONEXUS_TEST_EMAIL and AUTONEXUS_TEST_PASSWORD.
Creates test stock, customers, a seller, reservations and a sale in that instance.
"""
import concurrent.futures
import datetime
import json
import io
import zipfile
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


def upload_portal_document(vehicle_id, category_id, name, token):
    boundary = "document-" + uuid.uuid4().hex
    fields = b"".join(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        for key, value in {"categoryId": category_id, "name": name}.items()
    )
    pdf = b"%PDF-1.7\nDocumento de teste\n%%EOF"
    data = fields + (
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="teste.pdf"\r\n'
        'Content-Type: application/pdf\r\n\r\n'
    ).encode() + pdf + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(BASE + f"/api/vehicles/{vehicle_id}/documents", data=data,
        headers={"Authorization": "Bearer " + token, "Content-Type": "multipart/form-data; boundary=" + boundary})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)["id"], pdf


def download(path):
    with urllib.request.urlopen(BASE + "/api" + path, timeout=30) as response:
        return response.read()


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

    for payout, expected_profit in [(85000, 5000), (90000, 0), (92000, -2000)]:
        call("/launch/vehicles/" + vid + "/consignment", "PUT", {"payout": payout}, token, expected=204)
        simulated = call("/launch/vehicles/" + vid + "/margin?offer=95000", token=token)
        assert simulated["consignmentPayout"] == payout and simulated["values"]["expenses"] == 5000
        assert simulated["values"]["profit"] == expected_profit
    call("/launch/vehicles/" + vid + "/consignment", "PUT", {"payout": None}, token, expected=204)
    check("margem em três cenários de consignação e retorno a estoque próprio")

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
    buyer_links = "/vehicles/" + vid + "/buyer-links"
    call(buyer_links, "POST", {}, token, expected=404)
    call("/vehicles/" + vid + "/sell", "POST", {"saleValue": 95000, "leadId": lid}, token)
    assert call("/leads/" + lid, token=token)["statusName"] == "Venda"
    assert any(x["id"] == vid and not x["delivered"] and not x["transferred"]
        for x in call("/daily-work/after-sales", token=token)["items"])
    assert not any(x["id"] == vid for x in call("/daily-work/after-sales", token=seller)["items"])
    call("/vehicles/" + vid + "/sell", "POST", {"saleValue": 95000}, token, expected=409)
    call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": "handover", "done": True}, token, expected=409)
    assert any(x["kind"] == "delivery" and x["vehicleId"] == vid for x in call("/daily-work", token=token)["items"])
    for step in ["payment", "documents", "accessories", "handover"]:
        checklist = call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": step, "done": True}, token)
        assert checklist[step]["completedAt"] and checklist[step]["userId"] and checklist[step]["userName"]
    call("/launch/vehicles/" + vid + "/delivery", "PUT", {"step": "payment", "done": False}, token, expected=409)
    assert call("/launch/vehicles/" + vid + "/margin", token=token)["realized"]
    check("venda única, entrega em ordem e rastreabilidade de responsáveis")

    transfer = "/launch/vehicles/" + vid + "/transfer"
    complete = {"step": "confirmation", "status": "completed", "source": "external", "evidence": "PROTOCOLO-01"}
    call(transfer, "PUT", complete, token, expected=409)
    call(transfer, "PUT", dict(complete, step="signature", evidence=None), token, expected=400)
    for step in ["signature", "inspection", "confirmation"]:
        record = call(transfer, "PUT", dict(complete, step=step), token)[step]
        assert record["verifiedAt"] and record["userName"] and record["source"] == "external"
    assert call(transfer, token=token)["confirmation"]["evidence"] == "PROTOCOLO-01"
    call(transfer, "PUT", dict(complete, step="inspection", status="pending"), token, expected=409)
    check("transferência: evidência obrigatória, ordem, origem e responsável persistidos")

    assert not any(x["id"] == vid for x in call("/daily-work/after-sales", token=token)["items"])
    assert any(x["id"] == vid and x["delivered"] and x["transferred"]
        for x in call("/daily-work/after-sales?includeCompleted=true", token=token)["items"])

    category = call("/lookup/document-categories", token=token)[0]["id"]
    shared_doc, pdf = upload_portal_document(vid, category, "Laudo autorizado", token)
    private_doc, _ = upload_portal_document(vid, category, "Arquivo interno", token)
    call(buyer_links, "POST", {"expirationDays": 31}, token, expected=400)
    call(buyer_links, token=seller, expected=404)
    buyer_link = call(buyer_links, "POST", {"expirationDays": 7, "documentIds": [shared_doc]}, token)
    portal = buyer_link["shareUrl"]
    details = call(portal)
    assert details["price"] == 95000 and [x["id"] for x in details["documents"]] == [shared_doc]
    assert "storagePath" not in details["documents"][0]
    assert download(f"{portal}/documents/{shared_doc}/download") == pdf
    call(f"{portal}/documents/{private_doc}/download", expected=404)
    with zipfile.ZipFile(io.BytesIO(download(portal + "/documents/download-all"))) as archive:
        assert len(archive.namelist()) == 1 and archive.read(archive.namelist()[0]) == pdf
    accept = {"buyerName": "Comprador de teste", "buyerDocument": "529.982.247-25"}
    call(portal + "/accept", "POST", accept)
    assert call(portal)["hasElectronicAcceptance"]
    call(buyer_links + "/" + buyer_link["id"], "DELETE", token=token, expected=204)
    call(portal, expected=401)
    check("portal: documentos selecionados, download, ZIP, aceite e revogação")

    partial = call("/leads", "POST", {"source": "Mercado Livre"}, token, expected=201)
    assert len(partial["missingFields"]) == 3
    call("/leads/" + partial["id"] + "/contact", "POST", token=token, expected=400)
    queue = call("/daily-work", token=token)
    assert any(x["leadId"] == partial["id"] and len(x["missingFields"]) == 3 for x in queue["items"])
    fixed = call("/leads/" + partial["id"] + "/contact-details", "PATCH",
        {"name": "Cliente do portal", "phone": "11999999999", "externalId": "ML-" + SUFFIX}, token)
    assert not fixed["missingFields"] and fixed["assignedToUserId"] == partial["assignedToUserId"]
    call("/leads/" + partial["id"] + "/contact", "POST", token=token)
    assert not any(x["leadId"] == partial["id"] for x in call("/daily-work", token=token)["items"])
    check("lead incompleto aparece na fila e pode ser corrigido sem alterar o responsável")

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
    call("/daily-work", expected=401)
    now = datetime.datetime.now(datetime.timezone.utc)
    daily = []
    for index in range(12):
        item = call("/leads", "POST", {"name": "Fila " + SUFFIX + str(index),
            "phone": "11999999999", "source": "Manual"}, token, expected=201)
        daily.append(item["id"])
    urgent = daily[0]
    call("/leads/" + urgent + "/attendance", "PUT", {"nextContactAt": (now - datetime.timedelta(hours=1)).isoformat()}, token)
    future = daily[1]
    call("/leads/" + future + "/attendance", "PUT", {"nextContactAt": (now + datetime.timedelta(days=2)).isoformat()}, token)
    closed = daily[2]
    call("/leads/" + closed + "/status", "PATCH", {"status": 5}, token)
    queue = call("/daily-work", token=token)
    assert len(queue["items"]) == 10 and queue["items"][0]["leadId"] == urgent
    assert not any(x["leadId"] in [future, closed] for x in queue["items"])
    assert not any(x["kind"] == "delivery" and x["vehicleId"] == vid for x in queue["items"])
    assert call("/daily-work?mine=false", token=seller)["total"] == 0
    call("/leads/" + daily[3] + "/contact", "POST", token=token)
    assert not any(x["leadId"] == daily[3] for x in call("/daily-work", token=token)["items"])
    seller_lead = call("/leads", "POST", {"name": "Fila vendedor " + SUFFIX, "phone": "11999999999"}, seller, expected=201)
    assert any(x["leadId"] == seller_lead["id"] for x in call("/daily-work?mine=false", token=seller)["items"])
    assert not any(x["leadId"] == seller_lead["id"] for x in call("/daily-work", token=token)["items"])
    assert any(x["leadId"] == seller_lead["id"] for x in call("/daily-work?mine=false", token=token)["items"])
    check("fila diária: prioridade, limite 10, retornos futuros, encerrados, contato e filtro do vendedor")
    plans = call("/signup/plans")
    plan = next(item for item in plans if item.get("trialDays", 0) > 0)
    other = call("/signup", "POST", {"companyName": "Outra loja " + SUFFIX,
        "adminName": "Admin B", "adminEmail": "admin-b-" + SUFFIX + "@example.test",
        "adminPassword": PASSWORD, "planId": plan["id"], "cycle": 1,
        "acceptTermsOfUse": True, "acceptPrivacyPolicy": True, "acceptCookiePolicy": True})
    other_token = other["login"]["token"]
    assert call("/daily-work?mine=false", token=other_token)["total"] == 0
    call(transfer, token=other_token, expected=404)
    call(transfer, "PUT", complete, other_token, expected=404)
    call("/launch/vehicles/" + vid + "/consignment", "PUT", {"payout": 80000}, other_token, expected=404)
    for endpoint in ["/launch/leads/" + lid, "/launch/vehicles/" + vid + "/margin", "/launch/vehicles/" + vid + "/delivery"]:
        call(endpoint, token=other_token, expected=404)
    call("/launch/leads/" + lid + "/proposal", "POST", {}, other_token, expected=404)
    call("/launch/vehicles/" + vid + "/reserve", "POST", {"leadId": lid, "expiresAt": expires}, other_token, expected=404)
    call("/financing/proposals/" + manual["id"], token=other_token, expected=404)
    check("isolamento entre duas empresas reais, inclusive propostas e financiamento")

    trade_vehicle = call("/vehicles", "POST", dict(row, plate=None), token, expected=201)["id"]
    trade_lead = call("/leads", "POST", {"name": "Cliente troca", "phone": "11999999999",
        "vehicleId": trade_vehicle}, token, expected=201)["id"]
    other_lead = call("/leads", "POST", {"name": "Outro cliente", "phone": "11999999998",
        "vehicleId": trade_vehicle}, token, expected=201)["id"]
    trade_input = {"deliveredVehicleId": trade_vehicle, "leadId": trade_lead,
        "receivedVehicle": dict(row, plate=None, model="Yaris", purchaseValue=40000, listedValue=45000),
        "receivedVehicleFipe": 45000, "deliveredVehicleFipe": 95000,
        "receivedVehicleNegotiatedValue": 42000, "deliveredVehicleNegotiatedValue": 95000,
        "estimatedResaleCost": 2000, "differenceValue": 53000, "differencePaidByUs": False,
        "tradeDate": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    call("/trades", "POST", trade_input, token, expected=201)
    assert call("/launch/leads/" + trade_lead, token=token)["tradeValue"] == 42000
    assert call("/launch/leads/" + other_lead, token=token).get("tradeValue") is None
    call(f"/vehicles/{trade_vehicle}/sell", "POST", {"saleValue": 95000, "leadId": other_lead},
        token, expected=409)
    call(f"/vehicles/{trade_vehicle}/sell", "POST", {"saleValue": 95000, "leadId": trade_lead}, token)
    assert call("/leads/" + trade_lead, token=token)["statusName"] == "Venda"
    check("troca vinculada ao atendimento, retomada do crédito e fechamento com o comprador correto")

    return {"token": token, "leadId": lid, "vehicleId": vid, "auth": auth, "results": results}


if __name__ == "__main__":
    run()
