# TEG Pricing Calculators

Internal citizenship-by-investment pricing calculators for TEG Consultancy.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion (animations) · Vitest.

## Run it

Node.js 24 is installed user-locally at `~/.local/node`. Add it to your PATH once:

```bash
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

Then:

```bash
npm install      # first time only
npm run dev      # http://localhost:3000 with live reload
npm test         # pricing engine vs. Excel formulas
npm run build && npm start   # production mode
```

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/calculators/skn.ts` | St. Kitts & Nevis pricing engine. Rates are annotated with their Excel cell. |
| `src/lib/calculators/skn.test.ts` | Checks the engine against a literal port of the workbook formulas for every family combination up to 10 people. |
| `src/lib/calculators/registry.ts` | Countries shown on the dashboard (live / coming soon). |
| `src/components/calculator/` | Calculator UI, controls, breakdown and the printable quotation. |
| `src/app/globals.css` | TEG brand tokens (colours and fonts from tegconsultancy.com). |
| `ExcelSheets/` | Source pricing workbooks. |

## Adding a country

1. Write `src/lib/calculators/<country>.ts` returning a `Quote` (see `types.ts`; USD or EUR), plus a test that ports its workbook formulas literally.
2. Write `src/components/calculator/<country>-calculator.tsx`: it renders `<CalculatorPage>` from `shell.tsx` and supplies only its own input cards (see `latvia-calculator.tsx` for a short example). The shell provides the client card, breakdown, summary, mobile total bar, copy and print.
3. Add the route `src/app/calculators/<slug>/page.tsx`.
4. In `registry.ts` set its entry to `status: "live"` (citizenship or residency section), and add a flag to `components/flags.tsx` if you like.

## Updating SKN rates

Change the values in `SKN_RATES` in `skn.ts`, then update the expected numbers in `skn.test.ts` and run `npm test`.
