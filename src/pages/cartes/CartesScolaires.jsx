import { useState } from "react";
import PhotoPicker from "../../components/common/PhotoPicker";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { createCarte, generateCarteQr, getCartes, reimprimerCarte } from "../../services/cartesApi";
import { updateEleve } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { formatDateTime, formatDate, optionsFrom } from "../pageUtils";
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
  const [cards, setCards] = useState([]);
  const refs = useReferenceOptions({ inscriptions: getInscriptions }, "cartes", cards.map((row) => row.id_inscription));
  function eleveOf(row) {
    return refs.inscriptions?.find((item) => String(item.id_inscription) === String(row.id_inscription))?.eleve;
  }

  const fields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", "label") },
    { name: "date_expiration", label: "Date d’expiration", type: "date" },
  ];

  return (
    <CrudPage referenceError={refs.error}
      title="Cartes scolaires"
      subtitle="Carte avec identité issue de l’inscription. La réimpression comptabilise une demande, pas une impression physique confirmée."
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
      renderFormExtra={(form, { saving, setPhotoBusy }) => {
        const eleve = eleveOf(form);
        return eleve ? <section className="inline-panel"><strong>{eleve.matricule} — {eleve.nom} {eleve.prenom}</strong>
          <p>Photo du dossier élève. Un changement ici est enregistré immédiatement dans ce dossier, indépendamment de la création de carte.</p>
          <PhotoPicker key={eleve.id_eleve} value={eleve.photo} disabled={saving} onBusyChange={setPhotoBusy} onChange={async (photo) => {
            await updateEleve(eleve.id_eleve, { photo: photo || null });
            window.dispatchEvent(new Event("references:changed"));
          }} />
        </section> : null;
      }}
      initialForm={{ id_inscription: "", date_expiration: "" }}
      load={() => getCartes()}
      onLoaded={setCards}
      create={createCarte}
      createPayload={(data) => ({ ...data, id_generateur: userId() })}
      extraActions={(row, { runAction, busy }) => (
        <>
          <button type="button" disabled={busy} onClick={() => runAction(() => printCarteScolaire(row), { refresh: false })}>🖨 Imprimer / PDF</button>
          <button type="button" disabled={busy} onClick={() => runAction(() => printCarteScolaire(row, { reprint: () => reimprimerCarte(row.id_carte) }))}>🖨 Réimprimer (+1 réédition)</button>
          <button type="button" disabled={busy} onClick={() => runAction(() => generateCarteQr(row.id_carte))}>▣ Générer QR</button>
        </>
      )}
      canUpdate={false}
      canDelete={false}
      rowKey="id_carte"
      createLabel="Nouvelle carte"
      searchKeys={["numero_carte", "id_inscription", "statut"]}
      emptyText="Aucune carte scolaire."
    />
  );
}
