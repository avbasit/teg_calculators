"use client";

import { useState } from "react";
import { PortugalD2Calculator, PT_D2_DESCRIPTION } from "./portugal-d2-calculator";
import { ProgrammeCard, type ProgrammeOption } from "./shell";

/** Portugal programmes. Add new calculators here; the programme card becomes a switch. */
type PortugalProgramme = "d2";

const PROGRAMMES: ProgrammeOption<PortugalProgramme>[] = [
  { value: "d2", label: "D2 Visa", sub: "Entrepreneur & independent professional visa", description: PT_D2_DESCRIPTION },
];

export function PortugalCalculator() {
  const [programme, setProgramme] = useState<PortugalProgramme>("d2");
  const card = <ProgrammeCard id="pt-programme" value={programme} onChange={setProgramme} options={PROGRAMMES} />;

  switch (programme) {
    case "d2":
      return <PortugalD2Calculator programme={card} />;
  }
}
