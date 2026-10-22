import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrudPage from "../../components/common/CrudPage";
import {
  assignPermissionToRole,
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  getPermissions,
  getRolePermissions,
  getRoles,
  removePermissionFromRole,
  updatePermission,
  updateRole,
} from "../../services/administrationApi";
import "./RolesPermissions.css";

const administrationFields = [
  { name: "nom", label: "Nom", required: true },
  { name: "code", label: "Code", required: true },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    full: true,
  },
];

function administrationErrorMessage(error, fallback) {
  if (error?.status === 401) {
    return "Session expirée ou invalide. Veuillez vous reconnecter.";
  }

  if (error?.status === 403) {
    return `Accès refusé : votre compte ne dispose pas des droits nécessaires. ${
      error.message || ""
    }`.trim();
  }

  if (error?.status === 409) {
    return error.message || "Cette opération entre en conflit avec des données existantes.";
  }

  return error?.message || fallback;
}

function permissionIds(data) {
  if (!Array.isArray(data)) {
    throw new Error("La réponse de l’API des permissions est invalide.");
  }
  const ids = data.map((permission) => Number(permission.id_permission));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("La réponse de l’API contient un identifiant de permission invalide.");
  }
  return ids;
}

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [roleLoadError, setRoleLoadError] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [permissionLoadError, setPermissionLoadError] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loadedRoleId, setLoadedRoleId] = useState(null);
  const [associatedPermissionIds, setAssociatedPermissionIds] = useState(new Set());
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [associationLoading, setAssociationLoading] = useState(false);
  const [associationSaving, setAssociationSaving] = useState(false);
  const [associationError, setAssociationError] = useState("");
  const [associationSuccess, setAssociationSuccess] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [associationReloadKey, setAssociationReloadKey] = useState(0);
  const selectedRoleIdRef = useRef("");
  const associationRequestRef = useRef(0);
  const associationSavingRef = useRef(false);

  const handleRolesLoaded = useCallback((nextRoles) => {
    setRoles(nextRoles);
    setRolesLoaded(true);
    setRoleLoadError("");

    const currentRoleId = selectedRoleIdRef.current;
    if (
      currentRoleId &&
      !nextRoles.some((role) => String(role.id_role) === currentRoleId)
    ) {
      selectedRoleIdRef.current = "";
      setSelectedRoleId("");
      setLoadedRoleId(null);
      setAssociatedPermissionIds(new Set());
      setSelectedPermissionIds(new Set());
      setAssociationLoading(false);
      setAssociationError("");
      setAssociationSuccess("");
    }
  }, []);

  const handleRolesLoadError = useCallback((error) => {
    setRolesLoaded(true);
    setRoleLoadError(administrationErrorMessage(error, "Impossible de charger les rôles."));
  }, []);

  const handlePermissionsLoaded = useCallback((nextPermissions) => {
    setPermissions(nextPermissions);
    setPermissionsLoaded(true);
    setPermissionLoadError("");
  }, []);

  const handlePermissionsLoadError = useCallback((error) => {
    setPermissionsLoaded(true);
    setPermissionLoadError(
      administrationErrorMessage(error, "Impossible de charger les permissions."),
    );
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return undefined;

    const requestId = ++associationRequestRef.current;
    getRolePermissions(Number(selectedRoleId))
      .then((data) => {
        if (
          requestId !== associationRequestRef.current ||
          selectedRoleIdRef.current !== selectedRoleId
        ) {
          return;
        }
        const ids = permissionIds(data);
        const nextIds = new Set(ids);
        setAssociatedPermissionIds(nextIds);
        setSelectedPermissionIds(new Set(nextIds));
        setLoadedRoleId(selectedRoleId);
        setAssociationError("");
      })
      .catch((error) => {
        if (
          requestId === associationRequestRef.current &&
          selectedRoleIdRef.current === selectedRoleId
        ) {
          setLoadedRoleId(null);
          setAssociationError(
            administrationErrorMessage(error, "Impossible de charger les permissions du rôle."),
          );
        }
      })
      .finally(() => {
        if (
          requestId === associationRequestRef.current &&
          selectedRoleIdRef.current === selectedRoleId
        ) {
          setAssociationLoading(false);
        }
      });

    return () => {
      if (requestId === associationRequestRef.current) {
        associationRequestRef.current += 1;
      }
    };
  }, [selectedRoleId, associationReloadKey]);

  const visiblePermissions = useMemo(() => {
    const query = permissionSearch.trim().toLocaleLowerCase();
    if (!query) return permissions;
    return permissions.filter((permission) =>
      [permission.nom, permission.code, permission.description]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(query)),
    );
  }, [permissions, permissionSearch]);

  function changeRole(event) {
    const roleId = event.target.value;
    selectedRoleIdRef.current = roleId;
    setSelectedRoleId(roleId);
    setLoadedRoleId(null);
    setAssociatedPermissionIds(new Set());
    setSelectedPermissionIds(new Set());
    setAssociationLoading(Boolean(roleId));
    setAssociationError("");
    setAssociationSuccess("");
    setPermissionSearch("");
  }

  function reloadAssociations() {
    if (!selectedRoleId || associationSavingRef.current) return;
    setLoadedRoleId(null);
    setAssociationLoading(true);
    setAssociationError("");
    setAssociationSuccess("");
    setAssociationReloadKey((current) => current + 1);
  }

  function togglePermission(idPermission) {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      if (next.has(idPermission)) next.delete(idPermission);
      else next.add(idPermission);
      return next;
    });
  }

  function selectPermissions(shouldSelect) {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      permissions.forEach((permission) => {
        const idPermission = Number(permission.id_permission);
        if (shouldSelect) next.add(idPermission);
        else next.delete(idPermission);
      });
      return next;
    });
  }

  async function saveAssociations() {
    if (
      associationSavingRef.current ||
      !selectedRoleId ||
      loadedRoleId !== selectedRoleId ||
      permissionLoadError
    ) {
      return;
    }

    const requestId = associationRequestRef.current;
    const roleId = Number(selectedRoleId);
    const additions = [...selectedPermissionIds].filter(
      (id) => !associatedPermissionIds.has(id),
    );
    const removals = [...associatedPermissionIds].filter(
      (id) => !selectedPermissionIds.has(id),
    );

    if (additions.length === 0 && removals.length === 0) {
      setAssociationSuccess("Aucune modification à enregistrer.");
      setAssociationError("");
      return;
    }

    associationSavingRef.current = true;
    setAssociationSaving(true);
    setLoadedRoleId(null);
    setAssociationError("");
    setAssociationSuccess("");

    try {
      const operations = [
        ...additions.map((idPermission) => ({
          action: "Ajout",
          idPermission,
          run: () => assignPermissionToRole(roleId, idPermission),
        })),
        ...removals.map((idPermission) => ({
          action: "Retrait",
          idPermission,
          run: () => removePermissionFromRole(roleId, idPermission),
        })),
      ];
      const results = await Promise.allSettled(
        operations.map(({ run }) => Promise.resolve().then(run)),
      );
      const failures = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [
              `${operations[index].action} de « ${
                permissions.find(
                  (permission) =>
                    Number(permission.id_permission) === operations[index].idPermission,
                )?.nom || `#${operations[index].idPermission}`
              } » : ${administrationErrorMessage(
                result.reason,
                "opération échouée",
              )}`,
            ]
          : [],
      );

      let refreshedIds;
      try {
        refreshedIds = permissionIds(await getRolePermissions(roleId));
      } catch (error) {
        if (requestId === associationRequestRef.current) {
          setAssociationError(
            [
              failures.length
                ? `Certaines modifications ont échoué : ${failures.join("; ")}.`
                : "",
              `Impossible de vérifier l’état enregistré : ${administrationErrorMessage(
                error,
                "erreur de rechargement",
              )}`,
            ]
              .filter(Boolean)
              .join(" "),
          );
        }
        return;
      }

      if (
        requestId !== associationRequestRef.current ||
        selectedRoleIdRef.current !== String(roleId)
      ) {
        return;
      }

      const refreshedSet = new Set(refreshedIds);
      setAssociatedPermissionIds(refreshedSet);
      setSelectedPermissionIds(new Set(refreshedSet));
      setLoadedRoleId(String(roleId));

      if (failures.length) {
        setAssociationError(
          `Certaines modifications ont échoué. L’état réel a été rechargé : ${failures.join("; ")}`,
        );
      } else if (
        refreshedSet.size !== selectedPermissionIds.size ||
        [...selectedPermissionIds].some((id) => !refreshedSet.has(id))
      ) {
        setAssociationError(
          "L’état rechargé depuis le serveur ne correspond pas aux permissions demandées.",
        );
      } else {
        setAssociationSuccess("Les permissions du rôle ont été enregistrées.");
      }
    } finally {
      associationSavingRef.current = false;
      setAssociationSaving(false);
    }
  }

  const associationReady =
    selectedRoleId && loadedRoleId === selectedRoleId && !permissionLoadError;

  return (
    <main className="roles-permissions-page">
      <h1 className="roles-permissions-title">🛡️ Rôles &amp; permissions</h1>

      <section className="administration-section" aria-label="Gestion des rôles">
        <CrudPage
          title="Gestion des rôles"
          headingLevel="h2"
          subtitle="Créer, consulter et gérer les rôles de l’établissement."
          icon="🛡️"
          columns={[
            { key: "nom", label: "Nom" },
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
          ]}
          fields={administrationFields}
          initialForm={{ nom: "", code: "", description: "" }}
          load={getRoles}
          create={createRole}
          update={updateRole}
          remove={deleteRole}
          canView
          canUpdate
          canDelete
          formatError={administrationErrorMessage}
          onSuccess={(action) => {
            if (action === "create") return "Le rôle a été créé.";
            if (action === "update") return "Le rôle a été modifié.";
            if (action === "delete") return "Le rôle a été supprimé.";
            return "L’opération a réussi.";
          }}
          onLoaded={handleRolesLoaded}
          onLoadError={handleRolesLoadError}
          rowKey="id_role"
          createLabel="Nouveau rôle"
          searchKeys={["nom", "code", "description"]}
          emptyText="Aucun rôle enregistré."
        />
      </section>

      <section className="administration-section" aria-label="Gestion des permissions">
        <CrudPage
          title="Gestion des permissions"
          headingLevel="h2"
          subtitle="Créer et gérer les permissions disponibles."
          icon="🔑"
          columns={[
            { key: "nom", label: "Nom" },
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
          ]}
          fields={administrationFields}
          initialForm={{ nom: "", code: "", description: "" }}
          load={getPermissions}
          create={createPermission}
          update={updatePermission}
          remove={deletePermission}
          canView
          canUpdate
          canDelete
          formatError={administrationErrorMessage}
          onSuccess={(action) => {
            if (action === "create") return "La permission a été créée.";
            if (action === "update") return "La permission a été modifiée.";
            if (action === "delete") return "La permission a été supprimée.";
            return "L’opération a réussi.";
          }}
          onLoaded={handlePermissionsLoaded}
          onLoadError={handlePermissionsLoadError}
          rowKey="id_permission"
          createLabel="Nouvelle permission"
          searchKeys={["nom", "code", "description"]}
          emptyText="Aucune permission enregistrée."
        />
      </section>

      <section className="association-section" aria-labelledby="association-title">
        <div className="association-heading">
          <div>
            <h2 id="association-title">Attribution des permissions</h2>
            <p>Sélectionnez un rôle, puis choisissez les permissions qui lui sont associées.</p>
          </div>
          {selectedRoleId && (
            <button
              className="crud-secondary"
              type="button"
              onClick={reloadAssociations}
              disabled={associationLoading || associationSaving}
            >
              ↻ Actualiser
            </button>
          )}
        </div>

        {roleLoadError && roles.length === 0 ? (
          <div className="crud-alert" role="alert">{roleLoadError}</div>
        ) : null}
        {rolesLoaded && !roleLoadError && roles.length === 0 ? (
          <div className="crud-state">Aucun rôle disponible. Créez d’abord un rôle.</div>
        ) : !rolesLoaded ? (
          <div className="crud-state" role="status">Chargement des rôles…</div>
        ) : (
          <>
            <label className="role-selector-label" htmlFor="permission-role">
              Rôle
            </label>
            <select
              id="permission-role"
              className="role-selector"
              value={selectedRoleId}
              onChange={changeRole}
              disabled={associationSaving}
            >
              <option value="">Sélectionner un rôle…</option>
              {roles.map((role) => (
                <option key={role.id_role} value={String(role.id_role)}>
                  {role.nom} ({role.code})
                </option>
              ))}
            </select>

            {selectedRoleId ? (
              <div className="association-content">
                {associationError && (
                  <div className="crud-alert" role="alert">{associationError}</div>
                )}
                {associationSuccess && (
                  <div className="success-message" role="status">✓ {associationSuccess}</div>
                )}
                {permissionLoadError ? (
                  <div className="crud-alert" role="alert">
                    {permissionLoadError} Corrigez le problème dans la section « Gestion des permissions », puis actualisez sa liste.
                  </div>
                ) : associationError && loadedRoleId !== selectedRoleId ? (
                  <button
                    className="crud-secondary"
                    type="button"
                    onClick={reloadAssociations}
                    disabled={associationSaving}
                  >
                    Réessayer le chargement
                  </button>
                ) : associationLoading || loadedRoleId !== selectedRoleId ? (
                  <div className="crud-state" role="status">
                    <div className="crud-spinner" />
                    Chargement des permissions associées…
                  </div>
                ) : !permissionsLoaded ? (
                  <div className="crud-state" role="status">
                    <div className="crud-spinner" />
                    Chargement des permissions disponibles…
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="crud-state">
                    Aucune permission disponible. Créez d’abord une permission.
                  </div>
                ) : (
                  <>
                    <div className="permission-toolbar">
                      <label className="crud-search-wrap">
                        <span aria-hidden="true">⌕</span>
                        <input
                          className="crud-search"
                          value={permissionSearch}
                          onChange={(event) => setPermissionSearch(event.target.value)}
                          placeholder="Rechercher une permission…"
                          aria-label="Rechercher une permission"
                        />
                      </label>
                      <div className="permission-bulk-actions">
                        <button
                          className="crud-secondary"
                          type="button"
                          onClick={() => selectPermissions(true)}
                          disabled={associationSaving || permissions.length === 0}
                        >
                          Tout sélectionner
                        </button>
                        <button
                          className="crud-secondary"
                          type="button"
                          onClick={() => selectPermissions(false)}
                          disabled={associationSaving || permissions.length === 0}
                        >
                          Tout désélectionner
                        </button>
                      </div>
                    </div>
                    <p className="permission-count" aria-live="polite">
                      {selectedPermissionIds.size} permission
                      {selectedPermissionIds.size !== 1 ? "s" : ""} sélectionnée
                      {selectedPermissionIds.size !== 1 ? "s" : ""}
                    </p>
                    {visiblePermissions.length === 0 ? (
                      <div className="crud-state">Aucune permission ne correspond à la recherche.</div>
                    ) : (
                      <div className="permission-list">
                        {visiblePermissions.map((permission) => {
                          const idPermission = Number(permission.id_permission);
                          return (
                            <label className="permission-option" key={permission.id_permission}>
                              <input
                                type="checkbox"
                                checked={selectedPermissionIds.has(idPermission)}
                                onChange={() => togglePermission(idPermission)}
                                disabled={!associationReady || associationSaving}
                              />
                              <span>
                                <strong>{permission.nom}</strong>
                                <code>{permission.code}</code>
                                {permission.description ? (
                                  <small>{permission.description}</small>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <div className="association-actions">
                      <button
                        className="crud-primary"
                        type="button"
                        onClick={saveAssociations}
                        disabled={!associationReady || associationSaving}
                      >
                        {associationSaving
                          ? "Enregistrement…"
                          : "Enregistrer les permissions"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
