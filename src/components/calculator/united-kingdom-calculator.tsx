"use client";

import { useState } from "react";
import { UK_IFV_DESCRIPTION, UkIfvCalculator } from "./uk-ifv-calculator";
import { ProgrammeCard, type ProgrammeOption } from "./shell";

/** UK programmes. Add new calculators here; the programme card becomes a switch. */
type UkProgramme = "innovator-founder";

const PROGRAMMES: ProgrammeOption<UkProgramme>[] = [
  { value: "innovator-founder", label: "Innovator Founder Visa", sub: "Start an innovative, endorsed business in the UK", description: UK_IFV_DESCRIPTION },
];

export function UnitedKingdomCalculator() {
  const [programme, setProgramme] = useState<UkProgramme>("innovator-founder");
  const card = <ProgrammeCard id="uk-programme" value={programme} onChange={setProgramme} options={PROGRAMMES} />;

  switch (programme) {
    case "innovator-founder":
      return <UkIfvCalculator programme={card} />;
  }
}
