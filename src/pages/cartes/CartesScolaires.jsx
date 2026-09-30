import { useMemo } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { createCarte, generateCarteQr, getCartes, reimprimerCarte } from "../../services/cartesApi";
import { getEleves } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { formatDateTime, formatDate, mapBy, optionsFrom } from "../pageUtils";
import { printCarteScolaire } from "../../utils/printBulletinsCartes";
import { photoUrl } from "../../utils/imageFile";

function ElevePhoto({ eleve }) {
  const src = photoUrl(eleve?.photo);
  if (!src) {
    return <span style={{ color: "#9ca3af" }}>—</span>;
  }
  return (
    <img
      src={src}
      alt={`${eleve.prenom || ""} ${eleve.nom || ""}`}
      width={40}
      height={40}
      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
    />
  );
}

export default function CartesScolaires() {
  const refs = useReferenceOptions(
    { inscriptions: getInscriptions, eleves: () => getEleves({ limit: 500 }) },
    "cartes",
  );
  const inscriptionsById = useMemo(() => mapBy(refs.inscriptions, "id_inscription"), [refs.inscriptions]);
  const elevesById = useMemo(() => mapBy(refs.eleves, "id_eleve"), [refs.eleves]);

  function eleveOf(row) {
    const inscription = inscriptionsById.get(String(row.id_inscription));
    return inscription ? elevesById.get(String(inscription.id_eleve)) : null;
  }

  const fields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => {
      const eleve = elevesById.get(String(row.id_eleve));
      const nom = eleve ? `${eleve.prenom} ${eleve.nom}` : `élève #${row.id_eleve}`;
      return `Inscription #${row.id_inscription} — ${nom}`;
    }) },
    { name: "date_expiration", label: "Date d’expiration", type: "date" },
  ];

  return (
    <CrudPage
      title="Cartes scolaires"
      subtitle="Impression PDF de la carte avec la photo de l’élève concerné."
      icon="🪪"
      columns={[
        { key: "photo", label: "Photo", render: (row) => <ElevePhoto eleve={eleveOf(row)} /> },
        { key: "eleve", label: "Élève", render: (row) => {
          const eleve = eleveOf(row);
          return eleve ? `${eleve.prenom} ${eleve.nom}` : `Inscription #${row.id_inscription}`;
        } },
        { key: "numero_carte", label: "N° carte" },
        { key: "id_inscription", label: "Inscription" },
        { key: "date_generation", label: "Générée le", render: (row) => formatDateTime(row.date_generation) },
        { key: "date_expiration", label: "Expiration", render: (row) => formatDate(row.date_expiration) },
        { key: "statut", label: "Statut" },
        { key: "nombre_reeditions", label: "Rééditions" },
      ]}
      fields={fields}
      initialForm={{ id_inscription: "", date_expiration: "" }}
      load={() => getCartes()}
      create={createCarte}
      createPayload={(data) => ({ ...data, id_generateur: userId() })}
      extraActions={(row, { runAction, busy }) => (
        <>
          <button type="button" disabled={busy} onClick={() => runAction(async () => {
            await printCarteScolaire(row);
            await reimprimerCarte(row.id_carte);
          })}>🖨 Imprimer / PDF</button>
          <button type="button" disabled={busy} onClick={() => runAction(() => generateCarteQr(row.id_carte))}>▣ Générer QR</button>
        </>
      )}
      canUpdate={false}
      canDelete={false}
      rowKey="id_carte"
      createLabel="Nouvelle carte"
      searchKeys={["numero_carte", "id_inscription", "statut", "qr_token"]}
      emptyText="Aucune carte scolaire."
    />
  );
}
