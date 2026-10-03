import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";

// Contrats lus depuis les fichiers backend versionnés, sans les exécuter ni les modifier.
const schemaClasses = new Map();
for (const file of readdirSync("backend/app/schemas").filter((name) => name.endsWith(".py"))) {
  for (const block of readFileSync(`backend/app/schemas/${file}`, "utf8").split(/(?=^class )/m)) {
    const header = block.match(/^class (\w+)\((\w+)\):/);
    if (!header) continue;
    const fields = [...block.matchAll(/^    (\w+): ([^\n]+)/gm)].map((match) => ({ name: match[1], required: !match[2].includes("=") }));
    schemaClasses.set(header[1], { parent: header[2], fields });
  }
}
function fieldsOf(name) {
  const schema = schemaClasses.get(name);
  return schema ? [...fieldsOf(schema.parent), ...schema.fields] : [];
}
const requestContracts = [];
for (const match of readFileSync("backend/app/api/v1/api.py", "utf8").matchAll(/include_router\((\w+)\.router, prefix="([^"]+)"/g)) {
  const source = readFileSync(`backend/app/api/v1/endpoints/${match[1]}.py`, "utf8");
  for (const endpoint of source.matchAll(/@router\.(post|put)\("([^"]+)"[^\n]*\)\s+def \w+\(([^\n]+)/g)) {
    const schema = endpoint[3].match(/data: (\w+)/)?.[1];
    if (schema) requestContracts.push({ method: endpoint[1].toUpperCase(), path: new RegExp(`^${(match[2] + endpoint[2]).replace(/^\//, "").replace(/\/$/, "").replace(/\{[^}]+\}/g, "\\d+")}$`), fields: fieldsOf(schema), schema });
  }
}
function checkPayload(path, method, body) {
  const contract = requestContracts.find((entry) => entry.method === method && entry.path.test(path));
  if (!contract) return;
  const names = contract.fields.map((field) => field.name);
  for (const key of Object.keys(body || {})) expect(names, `${contract.schema}: champ inattendu ${key}`).toContain(key);
  for (const field of contract.fields.filter((entry) => entry.required)) {
    expect(body, `${contract.schema}: ${field.name} requis`).toHaveProperty(field.name);
    expect(body[field.name]).not.toBeNull();
  }
}

// Ces données existent UNIQUEMENT dans le banc de tests. L'application ne les importe jamais.
const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const jwt = (seconds = 3600) => `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: "7", id_role: 2, id_etablissement: 1, exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')}.test-signature`;
const session = (seconds) => ({ access_token: jwt(seconds), id_utilisateur: 7, id_role: 2, id_etablissement: 1, nom: "TEST", prenom: "Admin" });
const initial = () => ({
  eleves: [{ id_eleve: 1, id_etablissement: 1, matricule: "EL001", nom: "TRAORE", prenom: "Awa", photo, actif: true }],
  enseignants: [{ id_enseignant: 1, id_etablissement: 1, matricule: "ENS001", nom: "DIARRA", prenom: "Amadou", actif: true }],
  inscriptions: [{ id_inscription: 1, id_eleve: 1, id_annee: 1, id_classe: 1, numero_inscription: "INS001", statut: "active" }],
  classes: [{ id_classe: 1, id_etablissement: 1, nom: "6ème A" }],
  matieres: [{ id_matiere: 1, id_etablissement: 1, code: "MAT001", nom: "Mathématiques" }],
  "annees-scolaires": [{ id_annee: 1, id_etablissement: 1, libelle: "2026-2027", date_debut: "2026-10-01", date_fin: "2027-06-30", statut: "active" }],
  periodes: [{ id_periode: 1, id_annee: 1, code: "T1", libelle: "Trimestre 1", ordre: 1 }],
  etablissements: [{ id_etablissement: 1, nom: "École Test", code: "TEST" }],
  utilisateurs: [{ id_utilisateur: 7, nom: "TEST", prenom: "Admin", login: "admin" }],
  roles: [{ id_role: 2, code: "ADMIN", nom: "Administrateur" }],
  evaluations: [{ id_evaluation: 1, id_annee: 1, id_classe: 1, id_periode: 1, id_matiere: 1, id_enseignant: 1, libelle: "Devoir 1", bareme: 20, coefficient: 1 }],
  notes: [{ id_note: 1, id_evaluation: 1, id_inscription: 1, valeur: 15, absence: false }],
  "presences-eleves": [{ id_presence: 1, id_inscription: 1, date_presence: "2026-10-03", statut: "PRESENT" }],
  "presences-enseignants": [{ id_presence: 1, id_enseignant: 1, id_annee: 1, date_presence: "2026-10-03", statut: "PRESENT" }],
  "cours-effectues": [{ id_cours: 1, id_enseignant: 1, id_annee: 1, id_classe: 1, id_matiere: 1, date_cours: "2026-10-03", heures_prevues: 2, heures_effectuees: 2 }],
  bulletins: [{ id_bulletin: 1, id_inscription: 1, id_periode: 1, moyenne_generale: 15, rang: 1, appreciation: "Bien", decision: "Admis", valide: false }],
  "cartes-scolaires": [{ id_carte: 1, id_inscription: 1, numero_carte: "CARTE-TEST", qr_token: "test-qr-token", nombre_reeditions: 0, date_expiration: "2027-06-30", statut: "active" }],
  "frais-scolaires/types": [{ id_type_frais: 1, code: "SCOL", libelle: "Scolarité" }],
  "frais-scolaires": [{ id_frais: 1, id_inscription: 1, id_annee: 1, id_type_frais: 1, montant_du: 25000 }],
  paiements: [{ id_paiement: 1, id_inscription: 1, reference: "PAY001", montant: 25000, statut: "valide" }],
  depenses: [{ id_depense: 1, id_etablissement: 1, date_depense: "2026-10-03", libelle: "Fournitures", montant: 1000, observation: "Facture reçue" }],
  journal: [{ id_journal: 1, action: "Entrée réelle du test", module: "Élèves", date_action: "2026-10-03T10:00:00" }],
  "observations-enseignants": [{ id_observation: 1, id_enseignant: 1, id_auteur: 7, contenu: "Cours observé", confidentialite: "interne" }],
  "communication/messages": [{ id_message: 1, id_expediteur: 8, id_destinataire: 7, objet: "Réunion", contenu: "Demain", lu: false }],
  "communication/notifications": [{ id_notification: 1, id_utilisateur: 7, titre: "Information", lue: false }],
  "communication/annonces": [],
});
const ids = { eleves: "id_eleve", "annees-scolaires": "id_annee", bulletins: "id_bulletin", "cartes-scolaires": "id_carte", "observations-enseignants": "id_observation", "presences-eleves": "id_presence", "presences-enseignants": "id_presence", notes: "id_note", depenses: "id_depense", journal: "id_journal", paiements: "id_paiement", "frais-scolaires": "id_frais", "frais-scolaires/types": "id_type_frais" };

async function setup(page, { authenticated = true } = {}) {
  const state = { db: initial(), calls: [], unauthorized: false, fail: null };
  await page.addInitScript(({ auth, current }) => {
    if (auth && !localStorage.getItem("test-initialized")) {
      localStorage.setItem("gestion_scolaire_session", JSON.stringify(current));
      localStorage.setItem("test-initialized", "1");
    }
    window.print = () => {};
  }, { auth: authenticated, current: session() });
  await page.context().route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1/", "").replace(/\/$/, "");
    const method = request.method();
    const body = request.postDataJSON();
    checkPayload(path, method, body);
    state.calls.push({ path, method, body, query: Object.fromEntries(url.searchParams), authorization: request.headers().authorization });
    const reply = (data, status = 200) => route.fulfill({ status, json: data });
    if (path === "auth/login") return reply(session());
    if (state.unauthorized) return reply({ detail: "Token invalide ou expiré" }, 401);
    if (state.fail?.path === path && (!state.fail.method || state.fail.method === method)) return reply({ detail: "Erreur de test contrôlée" }, state.fail.status || 500);
    if (path === "dashboard") return reply({ eleves: 17, enseignants: 4, classes: 3, parents: 21, presences_jour: { presents: 14, absents: 1, retards: 2, excuses: 0 }, finances: { recettes: 25000, depenses: 1000 }, activites_recentes: state.db.journal });
    if (path.startsWith("recus/")) return reply({ id_recu: 1, id_paiement: 1, numero_recu: "REC001", montant: 25000, imprime: path.endsWith("imprimer"), pdf: path.endsWith("generer-pdf") ? "storage/recus/REC001.pdf" : null });
    if (path === "enseignants/1/matieres") return reply([{ id_enseignant: 1, id_matiere: 1, principal: true }]);
    if (path === "enseignants/1/classes") return reply([{ id_enseignant: 1, id_classe: 1, id_annee: 1, principal: true }]);
    if (path === "enseignants/matieres" || path === "enseignants/classes") return reply(body, 201);
    const parts = path.split("/");
    const resource = path.startsWith("communication/") ? parts.slice(0, 2).join("/") : path === "frais-scolaires/types" ? path : parts[0];
    const rows = state.db[resource] || [];
    const idPart = path.startsWith("communication/") ? parts[2] : parts[1];
    const idKey = ids[resource] || Object.keys(rows[0] || {}).find((key) => key.startsWith("id_"));
    const row = rows.find((entry) => String(entry[idKey]) === idPart);
    if (method === "POST") {
      const created = { ...body, [idKey || "id"]: rows.length + 1 };
      state.db[resource] = [...rows, created];
      return reply(created, 201);
    }
    if (method === "PUT" && row) {
      Object.assign(row, body || {});
      if (path.endsWith("/reimprimer")) row.nombre_reeditions += 1;
      if (path.endsWith("/generer-qr")) row.fichier = "storage/cartes/CARTE-TEST.png";
      if (path.endsWith("/generer-pdf")) row.pdf = "storage/bulletins/test.pdf";
      if (path.endsWith("/lire")) { row.lu = true; row.lue = true; }
      return reply(row);
    }
    if (method === "DELETE") { state.db[resource] = rows.filter((entry) => entry !== row); return route.fulfill({ status: 204 }); }
    if (idPart && /^\d+$/.test(idPart)) return row ? reply(row) : reply({ detail: "Introuvable" }, 404);
    const skip = Number(url.searchParams.get("skip") || 0);
    const limit = Number(url.searchParams.get("limit") || 100);
    return reply(rows.slice(skip, skip + limit));
  });
  return state;
}
const openMenu = async (page) => page.getByRole("button", { name: "Actions", exact: true }).first().click();
const dialog = (page) => page.getByRole("dialog");
const fill = (page, name, value) => dialog(page).locator(`[name="${name}"]`).fill(value);
const select = (page, name, value = "1") => dialog(page).locator(`[name="${name}"]`).selectOption(value);
const submit = async (page) => { await dialog(page).getByRole("button", { name: "Enregistrer", exact: true }).click(); await expect(dialog(page)).toHaveCount(0); };

test("services : toutes les méthodes/routes existent dans les routeurs FastAPI", () => {
  const api = readFileSync("backend/app/api/v1/api.py", "utf8");
  const routes = [];
  for (const match of api.matchAll(/include_router\((\w+)\.router, prefix="([^"]+)"/g)) {
    const endpoint = readFileSync(`backend/app/api/v1/endpoints/${match[1]}.py`, "utf8");
    for (const route of endpoint.matchAll(/@router\.(get|post|put|delete)\("([^"]+)"/g)) {
      routes.push(`${route[1].toUpperCase()} ${match[2]}${route[2]}`.replace(/\{[^}]+\}/g, "{id}"));
    }
  }
  let checked = 0;
  for (const file of readdirSync("src/services").filter((name) => name.endsWith("Api.js"))) {
    const service = readFileSync(`src/services/${file}`, "utf8");
    for (const call of service.matchAll(/api(Get|Post|Put|Delete)\((["`])([^"`]+)\2/g)) {
      const path = call[3].split("?")[0].replace(/\$\{[^}]+\}/g, "{id}");
      expect(routes, `${file} : ${call[1]} ${path}`).toContain(`${call[1].toUpperCase()} ${path}`);
      checked += 1;
    }
  }
  expect(checked).toBeGreaterThan(100);
});

test("connexion → dashboard → JWT → 401 → session supprimée → login", async ({ page }) => {
  const state = await setup(page, { authenticated: false });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('[name="id_etablissement"]').fill("1");
  await page.locator('[name="login"]').fill("admin");
  await page.locator('[name="mot_de_passe"]').fill("test-only");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("17", { exact: true })).toBeVisible();
  expect(state.calls.find((call) => call.path === "auth/login").body).toEqual({ id_etablissement: 1, login: "admin", mot_de_passe: "test-only" });
  expect(state.calls.find((call) => call.path === "dashboard").authorization).toMatch(/^Bearer /);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("gestion_scolaire_session")))).toMatchObject({ id_etablissement: 1, id_utilisateur: 7, id_role: 2 });
  state.unauthorized = true;
  await page.getByRole("button", { name: "Actualiser" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("gestion_scolaire_session"))).toBeNull();
});

for (const [name, current] of [["expirée", session(-1)], ["malformée", { ...session(), access_token: "invalid" }], ["incomplète", { access_token: jwt() }]]) {
  test(`session ${name} : aucune application protégée`, async ({ page }) => {
    await setup(page, { authenticated: false });
    await page.addInitScript((value) => localStorage.setItem("gestion_scolaire_session", JSON.stringify(value)), current);
    await page.goto("/eleves");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Élèves" })).toHaveCount(0);
  });
}

test("expiration en cours de session sans requête", async ({ page }) => {
  await setup(page, { authenticated: false });
  await page.addInitScript((value) => localStorage.setItem("gestion_scolaire_session", JSON.stringify(value)), session(2));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
});

test("dashboard : refresh, chiffres API, erreur sans faux zéros, journal vide", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/dashboard");
  await expect(page.getByText("Entrée réelle du test")).toBeVisible();
  await expect(page.locator('.finance-summary')).toContainText("25");
  expect(state.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  state.fail = { path: "dashboard" };
  await page.getByRole("button", { name: "Actualiser" }).click();
  await expect(page.getByRole("alert")).toContainText("Erreur de test");
  await expect(page.locator('.stat-card strong').first()).toHaveText("—");
  state.fail = null; state.db.journal = [];
  await page.getByRole("button", { name: "Actualiser" }).click();
  await expect(page.getByText("Aucune activité renvoyée par l’API.")).toBeVisible();
  expect(state.calls.filter((call) => call.path === "dashboard").every((call) => call.query.id_etablissement === "1")).toBeTruthy();
});

test("élèves : création, explorateur, photo persistée, édition et retrait", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/eleves");
  await expect(page.getByRole("cell", { name: "TRAORE", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nouvel élève" }).click();
  await fill(page, "matricule", "EL002"); await fill(page, "nom", "DIALLO"); await fill(page, "prenom", "Binta");
  const chooser = page.waitForEvent("filechooser");
  await dialog(page).getByRole("button", { name: "Choisir une photo" }).click();
  await (await chooser).setFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from(photo.split(",")[1], "base64") });
  await expect(dialog(page).getByAltText("Aperçu de la photo élève")).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  await submit(page);
  const created = state.calls.find((call) => call.method === "POST" && call.path === "eleves").body;
  expect(created).toMatchObject({ id_etablissement: 1, matricule: "EL002" }); expect(created.photo).toMatch(/^data:image\/jpeg/);
  await page.getByRole("row").filter({ hasText: "DIALLO" }).getByRole("button", { name: "Actions" }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await expect(dialog(page).getByAltText("Aperçu de la photo élève")).toHaveAttribute("src", created.photo);
  await fill(page, "prenom", "Binta modifiée"); await submit(page);
  expect(state.calls.find((call) => call.method === "PUT").body).not.toHaveProperty("id_etablissement");
  await page.getByRole("row").filter({ hasText: "DIALLO" }).getByRole("button", { name: "Actions" }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await dialog(page).getByRole("button", { name: "Retirer la photo" }).click(); await submit(page);
  expect(state.db.eleves[1].photo).toBeNull();
});

test("photo : type/taille invalides et erreur API visible dans le formulaire", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/eleves"); await page.getByRole("button", { name: "Nouvel élève" }).click();
  await dialog(page).locator('input[type="file"]').setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("test") });
  await expect(dialog(page).getByRole("alert")).toContainText("fichier image");
  await dialog(page).locator('input[type="file"]').setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
  await expect(dialog(page).getByRole("alert")).toContainText("8 Mo");
  await fill(page, "matricule", "X"); await fill(page, "nom", "X"); await fill(page, "prenom", "Y");
  state.fail = { path: "eleves", method: "POST", status: 422 };
  await dialog(page).getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(dialog(page).getByRole("alert").first()).toContainText("Erreur de test");
});

test("cartes : identité automatique, photo, création, QR et réédition", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/cartes");
  await expect(page.locator('td[data-label="Élève"]')).toBeVisible();
  await page.getByRole("button", { name: "Nouvelle carte" }).click(); await select(page, "id_inscription");
  await expect(dialog(page).getByAltText("Aperçu de la photo élève")).toBeVisible();
  await expect(dialog(page).locator('[name="nom"]')).toHaveCount(0);
  await fill(page, "date_expiration", "2027-06-30"); await submit(page);
  expect(state.calls.find((call) => call.method === "POST" && call.path === "cartes-scolaires").body).toEqual({ id_inscription: 1, date_expiration: "2027-06-30", id_generateur: 7 });
  await openMenu(page); await page.getByRole("button", { name: "Générer QR" }).click();
  await expect(page.getByRole("status")).toContainText("Action effectuée");
  expect(state.calls.some((call) => call.path === "cartes-scolaires/1/generer-qr" && call.method === "PUT")).toBeTruthy();
  await openMenu(page);
  const popupPromise = page.waitForEvent("popup"); await page.getByRole("button", { name: "Réimprimer" }).click(); const popup = await popupPromise;
  await expect(popup.locator('body')).toContainText("École Test"); await expect(popup.locator('body')).toContainText("6ème A");
  await expect(popup.locator('body')).toContainText("2026-2027"); await expect(popup.locator('body')).toContainText("EL001");
  await expect(popup.getByAltText("QR")).toHaveAttribute("src", /^data:image\/png/);
  await expect(popup.getByAltText("Awa TRAORE")).toHaveAttribute("src", photo);
  await expect.poll(() => state.db['cartes-scolaires'][0].nombre_reeditions).toBe(1);
  expect(state.calls.some((call) => call.path === "cartes-scolaires/1/reimprimer" && call.method === "PUT")).toBeTruthy();
  await popup.close();
});

test("bulletin : validation auteur, impression avec photo/notes, PDF serveur", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/bulletins"); await openMenu(page); await page.getByRole("button", { name: "Modifier" }).click();
  await expect(dialog(page).locator('[name="id_validateur"]')).toHaveCount(0);
  await dialog(page).getByLabel("Bulletin validé").check(); await submit(page);
  expect(state.calls.find((call) => call.method === "PUT").body).toMatchObject({ valide: true, id_validateur: 7, moyenne_generale: 15 });
  await openMenu(page); const popupPromise = page.waitForEvent("popup"); await page.getByRole("button", { name: "Imprimer / PDF" }).click(); const popup = await popupPromise;
  await expect(popup.getByAltText("Awa TRAORE")).toHaveAttribute("src", photo);
  await expect(popup.locator('body')).toContainText("Mathématiques"); await expect(popup.locator('body')).toContainText("Trimestre 1"); await popup.close();
  await expect(page.getByRole("status")).toContainText("Action effectuée");
  await openMenu(page); await page.getByRole("button", { name: "Générer PDF serveur" }).click();
  await expect(page.getByRole("cell", { name: "storage/bulletins/test.pdf" })).toBeVisible();
  expect(state.calls.some((call) => call.path === "bulletins/1/generer-pdf" && call.method === "PUT")).toBeTruthy();
});

test("années : établissement injecté, pas de PUT/DELETE, nouvelle année dans périodes", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/annees-periodes"); await page.getByRole("button", { name: "Nouvelle année" }).click();
  await expect(dialog(page).locator('[name="id_etablissement"]')).toHaveCount(0);
  await fill(page, "libelle", "2027-2028"); await fill(page, "date_debut", "2027-10-01"); await fill(page, "date_fin", "2028-06-30"); await submit(page);
  expect(state.calls.find((call) => call.method === "POST").body.id_etablissement).toBe(1);
  await page.getByRole("button", { name: "Nouvelle période" }).click();
  await expect(dialog(page).locator('[name="id_annee"] option')).toContainText(["Sélectionner", "2026-2027", "2027-2028"]);
  await dialog(page).getByRole("button", { name: "Annuler" }).click(); await openMenu(page);
  await expect(page.getByRole("button", { name: "Modifier" })).toHaveCount(0); await expect(page.getByRole("button", { name: "Supprimer" })).toHaveCount(0);
});

for (const [path, button, values, selects, expected] of [
  ["notes", "Saisir une note", { valeur: "18" }, ["id_evaluation", "id_inscription"], { valeur: 18, id_evaluation: 1, id_inscription: 1 }],
  ["presences-eleves", "Nouvelle présence", { date_presence: "2026-10-03" }, ["id_inscription", ["statut", "ABSENT"]], { statut: "ABSENT", id_utilisateur: 7 }],
  ["depenses", "Nouvelle dépense", { date_depense: "2026-10-03", libelle: "Papier", montant: "500", observation: "Achat" }, [], { id_etablissement: 1, id_utilisateur: 7, montant: 500 }],
  ["observations-enseignants", "Nouvelle observation", { contenu: "Observation test" }, ["id_enseignant"], { id_auteur: 7, id_enseignant: 1, confidentialite: "interne" }],
  ["paiements", "Nouveau paiement", { reference: "PAY002", montant: "500", date_paiement: "2026-10-03T12:00" }, ["id_inscription", "id_frais"], { id_utilisateur: 7, id_inscription: 1, id_frais: 1 }],
  ["cahier-maitre", "Nouvelle présence", { date_presence: "2026-10-03", heure_arrivee: "08:00", motif: "Test" }, ["id_enseignant", "id_annee", ["statut", "PRESENT"]], { id_enseignant: 1, statut: "PRESENT", id_validateur: null }],
]) {
  test(`${path} : lecture, création et contrat du payload`, async ({ page }) => {
    const state = await setup(page); await page.goto(`/${path}`); await page.getByRole("button", { name: button }).click();
    for (const item of selects) await select(page, ...(Array.isArray(item) ? item : [item]));
    for (const [name, value] of Object.entries(values)) await fill(page, name, value);
    await submit(page); expect(state.calls.find((call) => call.method === "POST").body).toMatchObject(expected);
  });
}

test("frais : type créé immédiatement disponible et payload frais", async ({ page }) => {
  const state = await setup(page); await page.goto("/frais");
  await page.getByRole("button", { name: "Nouveau type" }).click(); await fill(page, "code", "CANT"); await fill(page, "libelle", "Cantine"); await submit(page);
  await page.getByRole("button", { name: "Nouveau frais", exact: false }).click();
  await select(page, "id_annee"); await select(page, "id_inscription"); await select(page, "id_type_frais", "2"); await fill(page, "montant_du", "1000"); await submit(page);
  expect(state.calls.find((call) => call.path === "frais-scolaires" && call.method === "POST").body).toMatchObject({ id_type_frais: 2, id_inscription: 1, id_annee: 1, montant_du: 1000, obligatoire: true });
});

test("journal : historique réel, saisie manuelle explicite et aucun audit artificiel", async ({ page }) => {
  const state = await setup(page); await page.goto("/journal-activite");
  await expect(page.getByRole("cell", { name: "Entrée réelle du test" })).toBeVisible();
  expect(state.calls.some((call) => call.method === "POST")).toBeFalsy();
  await page.getByRole("button", { name: "Consigner une entrée manuelle" }).click(); await fill(page, "action", "Note manuelle"); await submit(page);
  expect(state.calls.find((call) => call.method === "POST").body).toMatchObject({ id_etablissement: 1, id_utilisateur: 7, action: "Note manuelle" });
});

test("reçus : recherche par paiement seulement, actions exactes", async ({ page }) => {
  const state = await setup(page); await page.goto("/recus"); await page.getByLabel("ID paiement").fill("1"); await page.getByRole("button", { name: "Rechercher" }).click();
  await page.getByRole("button", { name: "Générer PDF" }).click(); await expect(page.locator('.receipt-grid')).toContainText("storage/recus/REC001.pdf");
  await page.getByRole("button", { name: "Marquer imprimé" }).click(); await expect(page.locator('.receipt-card .status-badge')).toHaveText("Imprimé");
  expect(state.calls.filter((call) => call.path.startsWith("recus")).map((call) => [call.method, call.path])).toEqual([["GET", "recus/paiement/1"], ["PUT", "recus/1/generer-pdf"], ["PUT", "recus/1/imprimer"]]);
  expect(state.calls.at(-1).query.id_imprimeur).toBe("7");
});

test("affectations : libellés réels, absence de modification/suppression", async ({ page }) => {
  await setup(page); await page.goto("/affectations"); await page.getByLabel("Enseignant").selectOption("1");
  await expect(page.locator('.relation-row')).toContainText("MAT001 — Mathématiques");
  await page.locator(".assignment-selector select").nth(1).selectOption("classes"); await expect(page.locator('.relation-row')).toContainText("6ème A · 2026-2027");
  await expect(page.getByText(/ClasseMatiere/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Supprimer" })).toHaveCount(0);
});

test("communication : lecture messages et notifications, aucun service inventé", async ({ page }) => {
  const state = await setup(page); await page.goto("/messages"); await openMenu(page); await page.getByRole("button", { name: "Marquer lu" }).click();
  await expect(page.getByRole("cell", { name: "Oui", exact: true })).toBeVisible();
  expect(state.calls.some((call) => call.query.id_destinataire === "7")).toBeTruthy();
  await page.goto("/notifications"); await openMenu(page); await page.getByRole("button", { name: "Marquer lue" }).click();
  await expect(page.getByRole("cell", { name: "Oui", exact: true })).toBeVisible();
});

test("CRUD : libellés/recherche locale, détails complets et confirmation suppression", async ({ page }) => {
  const state = await setup(page); await page.goto("/cours-effectues");
  await expect(page.getByRole("cell", { name: "ENS001 — DIARRA Amadou" })).toBeVisible();
  const before = state.calls.length; await page.getByRole("textbox", { name: "Rechercher" }).fill("DIARRA");
  await expect(page.getByRole("cell", { name: "6ème A" })).toBeVisible(); expect(state.calls.length).toBe(before);
  await openMenu(page); await page.getByRole("button", { name: "Consulter" }).click(); await expect(dialog(page)).toContainText("Heures prévues");
  await page.goto("/eleves"); await openMenu(page);
  page.once("dialog", (confirmation) => confirmation.dismiss()); await page.getByRole("button", { name: "Supprimer" }).click();
  expect(state.calls.some((call) => call.method === "DELETE")).toBeFalsy();
});

test("rôles : permissions non exposées, aucune fausse action", async ({ page }) => {
  const state = await setup(page); await page.goto("/roles-permissions");
  await expect(page.getByRole("heading", { name: /Rôles disponibles/ })).toBeVisible();
  await expect(page.getByText(/gestion des permissions et leur association/)).toBeVisible();
  await openMenu(page); await expect(page.getByRole("button", { name: "Modifier" })).toHaveCount(0);
  expect(state.calls.every((call) => !call.path.includes("permissions"))).toBeTruthy();
});

test("session restaurée : JWT refusé vérifié avant tout écran protégé", async ({ page }) => {
  const state = await setup(page); state.unauthorized = true;
  await page.goto("/eleves");
  await expect(page).toHaveURL(/\/login$/);
  expect(state.calls.some((call) => call.path === "eleves")).toBeFalsy();
  expect(await page.evaluate(() => localStorage.getItem("gestion_scolaire_session"))).toBeNull();
});

test("vérification session : panne réseau sans faux écran protégé, puis réessai", async ({ page }) => {
  const state = await setup(page); state.fail = { path: "utilisateurs/7" };
  await page.goto("/dashboard");
  await expect(page.getByRole("alert")).toContainText("Erreur de test");
  expect(state.calls.some((call) => call.path === "dashboard")).toBeFalsy();
  state.fail = null; await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByText("17", { exact: true })).toBeVisible();
});

test("déconnexion dans un autre onglet : synchronisation storage", async ({ page }) => {
  await setup(page); await page.goto("/dashboard");
  await expect(page.getByText("17", { exact: true })).toBeVisible();
  const other = await page.context().newPage(); await other.goto("/login");
  await other.evaluate(() => localStorage.clear());
  await expect(page).toHaveURL(/\/login$/); await other.close();
});

test("401 tardif d’une ancienne session : ne déconnecte pas la nouvelle", async ({ page }) => {
  await setup(page); await page.goto("/dashboard"); await expect(page.getByText("17", { exact: true })).toBeVisible();
  await page.route("**/api/v1/notes/", async (route) => { await new Promise((resolve) => setTimeout(resolve, 300)); await route.fulfill({ status: 401, json: { detail: "Token expiré" } }); });
  const next = session(7200);
  const result = await page.evaluate(async (current) => {
    const { apiGet } = await import('/src/services/apiClient.js');
    const pending = apiGet('/notes/').catch(() => null);
    localStorage.setItem('gestion_scolaire_session', JSON.stringify(current));
    await pending;
    return JSON.parse(localStorage.getItem('gestion_scolaire_session'));
  }, next);
  expect(result.access_token).toBe(next.access_token);
});

test("référentiels paginés : enseignants au-delà de 100 et photo élève hors première page", async ({ page }) => {
  const state = await setup(page);
  state.db.enseignants = Array.from({ length: 101 }, (_, i) => ({ ...state.db.enseignants[0], id_enseignant: i + 1, matricule: `ENS${i + 1}` }));
  state.db.eleves[0].id_eleve = 501; state.db.inscriptions[0].id_eleve = 501;
  await page.goto("/observations-enseignants"); await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await select(page, "id_enseignant", "101");
  expect(state.calls.some((call) => call.path === "enseignants" && call.query.skip === "100")).toBeTruthy();
  await page.goto("/cartes"); await expect(page.locator('td[data-label="Élève"]')).toHaveText("Awa TRAORE");
  expect(state.calls.some((call) => call.path === "eleves/501")).toBeTruthy();
});

test("double soumission : une seule création, champs verrouillés et succès", async ({ page }) => {
  const state = await setup(page); await page.goto("/depenses");
  await page.getByRole("button", { name: "Nouvelle dépense" }).click();
  await fill(page, "date_depense", "2026-10-03"); await fill(page, "libelle", "Papier"); await fill(page, "montant", "100");
  await page.route("**/api/v1/depenses/", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fallback();
  });
  await dialog(page).locator('form').evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
  await expect(dialog(page).getByRole("button", { name: "Enregistrement…" })).toBeDisabled();
  await expect(dialog(page)).toHaveCount(0);
  expect(state.calls.filter((call) => call.path === "depenses" && call.method === "POST")).toHaveLength(1);
});

test("photo depuis carte : même sélecteur, sauvegarde dans élève uniquement", async ({ page }) => {
  const state = await setup(page); await page.goto("/cartes");
  await page.getByRole("button", { name: "Nouvelle carte" }).click(); await select(page, "id_inscription");
  await dialog(page).getByRole("button", { name: "Retirer la photo" }).click();
  await expect(dialog(page).getByText("Aucune photo", { exact: true })).toBeVisible();
  expect(state.calls.find((call) => call.method === "PUT").path).toBe("eleves/1");
  expect(state.calls.find((call) => call.method === "PUT").body).toEqual({ photo: null });
  const chooser = page.waitForEvent("filechooser"); await dialog(page).getByRole("button", { name: "Choisir une photo" }).click();
  await (await chooser).setFiles({ name: "new.png", mimeType: "image/png", buffer: Buffer.from(photo.split(',')[1], 'base64') });
  await expect(dialog(page).getByAltText("Aperçu de la photo élève")).toHaveAttribute("src", /^data:image\/jpeg/);
  expect(state.db.eleves[0].photo).toMatch(/^data:image\/jpeg/);
});

test("honoraires : référentiel mois et champs création distincts de mise à jour", async ({ page }) => {
  const state = await setup(page);
  state.db['honoraires/mois'] = [{ id_mois: 1, numero: 10, libelle: 'Octobre' }];
  await page.route('**/api/v1/honoraires/mois', (route) => route.fulfill({ json: state.db['honoraires/mois'] }));
  await page.goto('/honoraires'); await page.getByRole('button', { name: 'Nouvel honoraire' }).click();
  await select(page, 'id_enseignant'); await select(page, 'id_annee'); await select(page, 'id_mois'); await fill(page, 'taux_horaire', '5000');
  await submit(page);
  const body = state.calls.find((call) => call.method === 'POST').body;
  expect(body).toMatchObject({ id_enseignant: 1, id_annee: 1, id_mois: 1, taux_horaire: 5000 });
  expect(body).not.toHaveProperty('id_validateur'); expect(body).not.toHaveProperty('statut'); expect(body).not.toHaveProperty('observation');
});

test("toutes les pages : montage sans erreur React et sans méthodes inventées", async ({ page }) => {
  await setup(page);
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['etablissements', 'utilisateurs', 'parents', 'inscriptions', 'classes', 'matieres', 'enseignants', 'evaluations', 'emploi-du-temps', 'paiements-honoraires', 'parametres', 'annonces']) {
    await page.goto(`/${path}`);
    await expect(page.locator('.crud-page').first()).toBeVisible();
    await expect(page.locator('.crud-spinner')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
