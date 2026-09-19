import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getBulletins,
  createBulletin,
  updateBulletin,
} from "../../services/bulletinsApi";

import { getInscriptions } from "../../services/inscriptionsApi";
import { getEleves } from "../../services/elevesApi";
import { getAnnees } from "../../services/anneesApi";
import { getPeriodes } from "../../services/periodesApi";

import "./Bulletins.css";

const initialForm = {
  id_inscription: "",
  id_periode: "",
  moyenne_generale: "",
  rang: "",
  appreciation: "",
  decision: "",
  valide: false,
};

export default function Bulletins() {
  const [bulletins, setBulletins] =
    useState([]);

  const [inscriptions, setInscriptions] =
    useState([]);
  const [eleves, setEleves] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [periodes, setPeriodes] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingBulletin, setEditingBulletin] =
    useState(null);
  const [selectedBulletin, setSelectedBulletin] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        bulletinsData,
        inscriptionsData,
        elevesData,
        anneesData,
        periodesData,
      ] = await Promise.all([
        getBulletins(),
        getInscriptions(),
        getEleves({
          skip: 0,
          limit: 1000,
        }),
        getAnnees(),
        getPeriodes(),
      ]);

      setBulletins(
        Array.isArray(bulletinsData)
          ? bulletinsData
          : []
      );

      setInscriptions(
        Array.isArray(inscriptionsData)
          ? inscriptionsData
          : []
      );

      setEleves(
        Array.isArray(elevesData)
          ? elevesData
          : []
      );

      setAnnees(
        Array.isArray(anneesData)
          ? anneesData
          : []
      );

      setPeriodes(
        Array.isArray(periodesData)
          ? periodesData
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les bulletins."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getEleveName(idInscription) {
    const inscription =
      inscriptions.find(
        (item) =>
          Number(
            item.id_inscription
          ) === Number(idInscription)
      );

    if (!inscription) {
      return `Inscription #${idInscription}`;
    }

    const eleve = eleves.find(
      (item) =>
        Number(item.id_eleve) ===
        Number(inscription.id_eleve)
    );

    return eleve
      ? `${eleve.prenom} ${eleve.nom}`
      : `Élève #${inscription.id_eleve}`;
  }

  function getPeriode(idPeriode) {
    return periodes.find(
      (item) =>
        Number(item.id_periode) ===
        Number(idPeriode)
    );
  }

  function getAnneeFromInscription(
    idInscription
  ) {
    const inscription =
      inscriptions.find(
        (item) =>
          Number(
            item.id_inscription
          ) === Number(idInscription)
      );

    if (!inscription) return null;

    return annees.find(
      (item) =>
        Number(item.id_annee) ===
        Number(inscription.id_annee)
    );
  }

  const filteredBulletins = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return bulletins;
    }

    return bulletins.filter(
      (bulletin) => {
        return (
          getEleveName(
            bulletin.id_inscription
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            getPeriode(
              bulletin.id_periode
            )?.libelle || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            bulletin.decision || ""
          )
            .toLowerCase()
            .includes(keyword)
        );
      }
    );
  }, [
    bulletins,
    search,
    inscriptions,
    eleves,
    periodes,
  ]);

  const total = bulletins.length;

  const valides = bulletins.filter(
    (item) => item.valide === true
  ).length;

  const moyenneGlobale =
    bulletins.length > 0
      ? bulletins.reduce(
          (sum, item) =>
            sum +
            Number(
              item.moyenne_generale || 0
            ),
          0
        ) / bulletins.length
      : 0;

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function openCreateModal() {
    setEditingBulletin(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(bulletin) {
    setEditingBulletin(bulletin);

    setForm({
      id_inscription:
        bulletin.id_inscription,
      id_periode:
        bulletin.id_periode,
      moyenne_generale:
        bulletin.moyenne_generale ??
        "",
      rang: bulletin.rang ?? "",
      appreciation:
        bulletin.appreciation ||
        "",
      decision:
        bulletin.decision || "",
      valide:
        bulletin.valide === true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingBulletin(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.id_inscription) {
      setError(
        "Sélectionnez une inscription."
      );
      return;
    }

    if (!form.id_periode) {
      setError(
        "Sélectionnez une période."
      );
      return;
    }

    let moyenne = null;

    if (form.moyenne_generale !== "") {
      moyenne = Number(
        form.moyenne_generale
      );

      if (
        Number.isNaN(moyenne) ||
        moyenne < 0
      ) {
        setError(
          "La moyenne doit être un nombre positif ou nul."
        );
        return;
      }
    }

    let rang = null;

    if (form.rang !== "") {
      rang = Number(form.rang);

      if (
        Number.isNaN(rang) ||
        rang < 1
      ) {
        setError(
          "Le rang doit être un nombre supérieur à 0."
        );
        return;
      }
    }

    const payload = {
      id_inscription:
        Number(form.id_inscription),
      id_periode:
        Number(form.id_periode),
      moyenne_generale: moyenne,
      rang,
      appreciation:
        form.appreciation.trim() ||
        null,
      decision:
        form.decision.trim() || null,
      valide: Boolean(form.valide),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingBulletin) {
        await updateBulletin(
          editingBulletin.id_bulletin,
          {
            moyenne_generale: moyenne,
            rang,
            appreciation:
              payload.appreciation,
            decision:
              payload.decision,
            valide: payload.valide,
          }
        );
      } else {
        await createBulletin(payload);
      }

      await loadData();

      setSuccess(
        editingBulletin
          ? "Bulletin modifié avec succès."
          : "Bulletin créé avec succès."
      );

      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'enregistrer le bulletin."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bulletins-page">
      <div className="bulletins-header">
        <div>
          <h1>Bulletins</h1>
          <p>
            Gestion des bulletins scolaires
          </p>
        </div>

        <button
          type="button"
          className="bulletins-primary"
          onClick={openCreateModal}
        >
          ＋ Nouveau bulletin
        </button>
      </div>

      {error && (
        <div className="bulletins-alert error">
          ⚠️ {error}
          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bulletins-alert success">
          ✅ {success}
          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>
        </div>
      )}

      <div className="bulletins-stats">
        <div>
          <span>📄</span>
          <div>
            <small>Total bulletins</small>
            <strong>{total}</strong>
          </div>
        </div>

        <div>
          <span>✅</span>
          <div>
            <small>Bulletins validés</small>
            <strong>{valides}</strong>
          </div>
        </div>

        <div>
          <span>📊</span>
          <div>
            <small>Moyenne générale</small>
            <strong>
              {moyenneGlobale.toFixed(
                2
              )}
            </strong>
          </div>
        </div>
      </div>

      <div className="bulletins-toolbar">
        <div className="bulletins-search">
          🔍
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher un élève, une période ou une décision..."
          />
        </div>

        <button
          type="button"
          className="bulletins-refresh"
          onClick={loadData}
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="bulletins-table-card">
        {loading ? (
          <div className="bulletins-state">
            Chargement...
          </div>
        ) : filteredBulletins.length ===
          0 ? (
          <div className="bulletins-state">
            <div>📄</div>
            <h3>
              Aucun bulletin trouvé
            </h3>
            <p>
              Commencez par créer un
              bulletin.
            </p>
          </div>
        ) : (
          <div className="bulletins-table-wrapper">
            <table className="bulletins-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Année</th>
                  <th>Période</th>
                  <th>Moyenne</th>
                  <th>Rang</th>
                  <th>Décision</th>
                  <th>État</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBulletins.map(
                  (bulletin) => {
                    const annee =
                      getAnneeFromInscription(
                        bulletin.id_inscription
                      );

                    const periode =
                      getPeriode(
                        bulletin.id_periode
                      );

                    return (
                      <tr
                        key={
                          bulletin.id_bulletin
                        }
                      >
                        <td>
                          <strong>
                            {getEleveName(
                              bulletin.id_inscription
                            )}
                          </strong>
                        </td>

                        <td>
                          {annee?.libelle ||
                            "—"}
                        </td>

                        <td>
                          {periode?.libelle ||
                            "—"}
                        </td>

                        <td>
                          {bulletin.moyenne_generale ??
                            "—"}
                        </td>

                        <td>
                          {bulletin.rang ??
                            "—"}
                        </td>

                        <td>
                          {bulletin.decision ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`bulletin-status ${
                              bulletin.valide
                                ? "valid"
                                : "draft"
                            }`}
                          >
                            {bulletin.valide
                              ? "Validé"
                              : "Non validé"}
                          </span>
                        </td>

                        <td>
                          <div className="bulletins-action-buttons">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBulletin(
                                  bulletin
                                );
                                setShowViewModal(
                                  true
                                );
                              }}
                            >
                              👁️
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  bulletin
                                )
                              }
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="bulletins-modal-overlay">
          <div className="bulletins-modal">
            <div className="bulletins-modal-header">
              <div>
                <h2>
                  {editingBulletin
                    ? "Modifier le bulletin"
                    : "Nouveau bulletin"}
                </h2>

                <p>
                  Renseignez les résultats du
                  bulletin.
                </p>
              </div>

              <button
                type="button"
                className="bulletins-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="bulletins-form"
              onSubmit={handleSubmit}
            >
              <div className="bulletins-grid">
                <div>
                  <label>
                    Élève *
                  </label>

                  <select
                    name="id_inscription"
                    value={
                      form.id_inscription
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      Boolean(
                        editingBulletin
                      )
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {inscriptions.map(
                      (inscription) => (
                        <option
                          key={
                            inscription.id_inscription
                          }
                          value={
                            inscription.id_inscription
                          }
                        >
                          {getEleveName(
                            inscription.id_inscription
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Période *
                  </label>

                  <select
                    name="id_periode"
                    value={
                      form.id_periode
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      Boolean(
                        editingBulletin
                      )
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {periodes.map(
                      (periode) => (
                        <option
                          key={
                            periode.id_periode
                          }
                          value={
                            periode.id_periode
                          }
                        >
                          {periode.code} —{" "}
                          {
                            periode.libelle
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Moyenne générale
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="moyenne_generale"
                    value={
                      form.moyenne_generale
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. 14.50"
                  />
                </div>

                <div>
                  <label>
                    Rang
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="rang"
                    value={form.rang}
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. 5"
                  />
                </div>

                <div>
                  <label>
                    Décision
                  </label>

                  <input
                    type="text"
                    name="decision"
                    value={form.decision}
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. Admis"
                  />
                </div>

                <div>
                  <label>
                    Validation
                  </label>

                  <label className="bulletin-checkbox">
                    <input
                      type="checkbox"
                      name="valide"
                      checked={
                        form.valide
                      }
                      onChange={
                        handleChange
                      }
                    />
                    Bulletin validé
                  </label>
                </div>

                <div className="bulletins-full">
                  <label>
                    Appréciation
                  </label>

                  <textarea
                    name="appreciation"
                    value={
                      form.appreciation
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Appréciation du conseil..."
                  />
                </div>
              </div>

              <div className="bulletins-footer">
                <button
                  type="button"
                  className="bulletins-cancel"
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="bulletins-save"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingBulletin
                    ? "Enregistrer"
                    : "Créer le bulletin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedBulletin && (
          <div className="bulletins-modal-overlay">
            <div className="bulletins-modal bulletins-view-modal">
              <div className="bulletins-modal-header">
                <h2>
                  Détails du bulletin
                </h2>

                <button
                  type="button"
                  className="bulletins-close"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="bulletins-details">
                <div>
                  <span>Élève</span>
                  <strong>
                    {getEleveName(
                      selectedBulletin.id_inscription
                    )}
                  </strong>
                </div>

                <div>
                  <span>Période</span>
                  <strong>
                    {
                      getPeriode(
                        selectedBulletin.id_periode
                      )?.libelle
                    }
                  </strong>
                </div>

                <div>
                  <span>Moyenne</span>
                  <strong>
                    {
                      selectedBulletin.moyenne_generale ??
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>Rang</span>
                  <strong>
                    {
                      selectedBulletin.rang ??
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>Décision</span>
                  <strong>
                    {
                      selectedBulletin.decision ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>État</span>
                  <strong>
                    {selectedBulletin.valide
                      ? "Validé"
                      : "Non validé"}
                  </strong>
                </div>

                <div className="bulletin-detail-full">
                  <span>
                    Appréciation
                  </span>
                  <strong>
                    {
                      selectedBulletin.appreciation ||
                      "Aucune appréciation"
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}