"use client";

import { useState } from "react";
import { ES_DNV_DESCRIPTION, SpainDnvCalculator } from "./spain-dnv-calculator";
import { ProgrammeCard, type ProgrammeOption } from "./shell";

/** Spain programmes. Add new calculators here; the programme card becomes a switch. */
type SpainProgramme = "digital-nomad";

const PROGRAMMES: ProgrammeOption<SpainProgramme>[] = [
  { value: "digital-nomad", label: "Digital Nomad Visa", sub: "Live in Spain while working remotely", description: ES_DNV_DESCRIPTION },
];

export function SpainCalculator() {
  const [programme, setProgramme] = useState<SpainProgramme>("digital-nomad");
  const card = <ProgrammeCard id="es-programme" value={programme} onChange={setProgramme} options={PROGRAMMES} />;

  switch (programme) {
    case "digital-nomad":
      return <SpainDnvCalculator programme={card} />;
  }
}
