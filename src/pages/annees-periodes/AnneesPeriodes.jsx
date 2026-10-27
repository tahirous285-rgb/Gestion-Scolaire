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
    { name: "libelle", label: "Libellé", required: true, placeholder: "2025-2026" },
    { name: "date_debut", label: "Date de début", type: "date", required: true },
    { name: "date_fin", label: "Date de fin", type: "date", required: true },
    { name: "statut", label: "Statut", default: "active" },
  ];
  const periodFields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: yearOptions },
    {
      name: "trimestre",
      label: "Trimestre",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "1er trimestre" },
        { value: "2", label: "2e trimestre" },
        { value: "3", label: "3e trimestre" },
      ],
    },
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
        initialForm={{ libelle: "", date_debut: "", date_fin: "", statut: "active" }}
        load={yearsLoad}
        create={createAnnee}
        createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
        canUpdate={false}
        canDelete={false}
        rowKey="id_annee"
        createLabel="Nouvelle année"
        searchKeys={["libelle", "statut"]}
        emptyText="Aucune année scolaire."
      />
      <CrudPage
        title="Périodes"
        subtitle="Définissez les dates de chaque trimestre de l’année scolaire."
        icon="🗓️"
        columns={[
          { key: "libelle", label: "Trimestre" },
          {
            key: "id_annee",
            label: "Année scolaire",
            render: (row) => references.annees?.find((annee) => Number(annee.id_annee) === Number(row.id_annee))?.libelle || "—",
          },
          { key: "date_debut", label: "Début", render: (row) => formatDate(row.date_debut) },
          { key: "date_fin", label: "Fin", render: (row) => formatDate(row.date_fin) },
        ]}
        fields={periodFields}
        initialForm={{ id_annee: "", trimestre: "", date_debut: "", date_fin: "" }}
        load={periodsLoad}
        create={createPeriode}
        createPayload={async (data) => {
          const { trimestre, ...periodData } = data;
          const order = Number(trimestre);
          if (new Date(periodData.date_debut) > new Date(periodData.date_fin)) {
            throw new Error("La date de fin doit être postérieure à la date de début.");
          }
          const existingPeriods = await getPeriodes({ id_annee: Number(periodData.id_annee) });
          if (existingPeriods.some((row) => Number(row.ordre) === order)) {
            throw new Error("Ce trimestre existe déjà pour cette année scolaire.");
          }
          const periodLabel = order === 1 ? "1er trimestre" : `${order}e trimestre`;
          return {
            ...periodData,
            code: `T${order}`,
            libelle: periodLabel,
            ordre: order,
          };
        }}
        canUpdate={false}
        canDelete={false}
        rowKey="id_periode"
        createLabel="Ajouter un trimestre"
        searchKeys={["libelle", "date_debut", "date_fin"]}
        emptyText="Aucun trimestre enregistré."
      />
    </div>
  );
}
