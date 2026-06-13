"use client";

import { StatsRow } from "../../components/StatsRow";
import { PatientTable } from "../../components/PatientTable";
import { RecentPatients } from "../../components/RecentPatients";
import { StatusDonut } from "../../components/StatusDonut";
import { RecentActivity } from "../../components/RecentActivity";

export default function Dashboard() {
  return (
    <>
      <StatsRow />
      <PatientTable />
      <div className="grid grid-cols-3 gap-5">
        <RecentPatients />
        <StatusDonut />
        <RecentActivity />
      </div>
    </>
  );
}
