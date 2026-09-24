import { useMemo } from "react";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createAnnee, createPeriode, getAnnees, getPeriodes } from "../../services/anneesApi";
import { formatDate, optionsFrom } from "../pageUtils";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";

export default function AnneesPeriodes() {
  const idEtablissement = establishmentId();
  const references = useReferenceOptions({ annees: getAnnees }, "annees");
  const yearOptions = optionsFrom(references.annees, "id_annee", "libelle");
  const yearsLoad = useMemo(() => getAnnees, []);
  const periodsLoad = useMemo(() => () => getPeriodes(), []);

  const yearFields = [
    { name: "id_etablissement", label: "ID établissement", type: "number", required: true, default: idEtablissement || "" },
    { name: "libelle", label: "Libellé", required: true, placeholder: "2025-2026" },
    { name: "date_debut", label: "Date de début", type: "date", required: true },
    { name: "date_fin", label: "Date de fin", type: "date", required: true },
    { name: "statut", label: "Statut", default: "active" },
  ];
  const periodFields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: yearOptions },
    { name: "code", label: "Code", required: true },
    { name: "libelle", label: "Libellé", required: true },
    { name: "ordre", label: "Ordre", type: "number", required: true, min: 1 },
    { name: "date_debut", label: "Date de début", type: "date", required: true },
    { name: "date_fin", label: "Date de fin", type: "date", required: true },
  ];

  return (
    <div className="stacked-pages">
      <CrudPage
        title="Années scolaires"
        subtitle="Périodes scolaires rattachées à l’établissement connecté."
        icon="📅"
        columns={[
          { key: "libelle", label: "Libellé" },
          { key: "date_debut", label: "Début", render: (row) => formatDate(row.date_debut) },
          { key: "date_fin", label: "Fin", render: (row) => formatDate(row.date_fin) },
          { key: "statut", label: "Statut" },
        ]}
        fields={yearFields}
        initialForm={{ id_etablissement: idEtablissement || "", libelle: "", date_debut: "", date_fin: "", statut: "active" }}
        load={yearsLoad}
        create={createAnnee}
        canUpdate={false}
        canDelete={false}
        rowKey="id_annee"
        createLabel="Nouvelle année"
        searchKeys={["libelle", "statut"]}
        emptyText="Aucune année scolaire."
      />
      <CrudPage
        title="Périodes"
        subtitle="Trimestres, semestres ou périodes définis par le backend."
        icon="🗓️"
        columns={[
          { key: "code", label: "Code" },
          { key: "libelle", label: "Libellé" },
          { key: "ordre", label: "Ordre" },
          { key: "date_debut", label: "Début", render: (row) => formatDate(row.date_debut) },
          { key: "date_fin", label: "Fin", render: (row) => formatDate(row.date_fin) },
        ]}
        fields={periodFields}
        initialForm={{ id_annee: "", code: "", libelle: "", ordre: "", date_debut: "", date_fin: "" }}
        load={periodsLoad}
        create={createPeriode}
        canUpdate={false}
        canDelete={false}
        rowKey="id_periode"
        createLabel="Nouvelle période"
        searchKeys={["code", "libelle"]}
        emptyText="Aucune période."
      />
    </div>
  );
}
