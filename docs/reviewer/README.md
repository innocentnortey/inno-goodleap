# GoodLeap reviewer kit

Live demo: https://inno-goodleap.onrender.com
Source repository: https://github.com/innocentnortey/inno-goodleap
Download the sample kit: https://github.com/innocentnortey/inno-goodleap/raw/refs/heads/main/docs/artifacts/goodleap-reviewer-kit.zip
Solution design: https://github.com/innocentnortey/inno-goodleap/blob/main/docs/design-doc.pdf

Everything in this kit is synthetic demo data. Use the fictional details below for the walkthrough.
Financial services and credit results are simulated; the estimate reader and explanation features call a real AI model.

## What to send

Share the live demo link and this guide or the sample-kit download link above. You can also attach
`goodleap-reviewer-kit.zip` to your message. The ZIP contains this guide and three uploadable text estimates. Reviewers can also select the same estimates directly on the Start application screen, without
downloading or uploading anything. The source copies are in `data/synthetic/estimates/` in the repository.

## Walkthrough 1: upload an estimate and complete the application

1. Open the demo. Click **Start over** if a previous session is present.
2. Set the amount to **30,000**, choose **Fixed 15-year**, then click **Start application**.
3. On Start application, use **Upload an estimate** to choose `estimates/roof_clean.txt` from the extracted ZIP.
   The text will appear in the estimate box. Alternatively, select **Roof replacement (clean estimate)**.
4. Click **Prepare application**. Allow around 10–30 seconds for the real AI call.
5. Check the prefilled fields: project total **$30,000**, deposit **$0**, amount to finance **$30,000**,
   contractor **ABC Roofing LLC**. The review shows sources for the extracted fields.
6. Click **Hand to homeowner**, then **Connect bank** → **Connect bank (succeeds)**.
   The simulated annual income is **$68,900**.
7. Click **Continue to review**. Enter these fictional details:

   | Field | Demo value |
   |---|---|
   | Full name | Demo Homeowner |
   | Address | 1500 Demo Ln, Austin, TX 78704 |
   | Date of birth | 1985-04-12 |
   | Last four of SSN | 1234 |

8. Review the disclosures and select the three consent checkboxes for this synthetic walkthrough.
   Click **Submit application**. Expected result: **Decision: Pending**, returned by the mocked credit engine.

No reviewer account, API key, real bank login, or real personal information is needed.

## Walkthrough 2: bank connection failure and pay-stub recovery

Start over and repeat steps 2–5 above. On Verify income:

1. Click **Connect bank** → **Connect bank (fails)**.
2. Read the failure explanation, then click **Upload a pay stub instead**.
3. This button uses a canned sample result. It does **not** open a file picker; there is no pay-stub file to supply.
   The expected annual income is **$68,900**, marked **Needs review**.
4. Continue to review, enter the same fictional homeowner details, select the demo consents and submit.
   Expected result: **Decision: Received with conditions**.
5. Open **Compliance audit** to inspect the explanations and their disclosures.

## Other sample estimates

| File | How to try it | Expected behavior |
|---|---|---|
| `estimates/roof_clean.txt` | Use a $30,000 financing comparison; upload on Start application | Reads a $30,000 total and $0 deposit |
| `estimates/roof_messy.txt` | Start over; use a $28,000 financing comparison, choose a plan, then upload | Reads abbreviations and line items: $30,000 total minus $2,000 deposit gives $28,000 to finance |
| `estimates/hvac_missing_total.txt` | On Start application, select the heat-pump sample card first to select Lone Star HVAC, then upload this file | Leaves the missing price unresolved; asks for confirmation instead of inventing a total |

PDFs, scanned images and Word files are not supported by the current estimate uploader. Use the supplied `.txt`
files or paste their contents. The messy sample is typed text with abbreviations, not a handwriting/OCR demonstration.

## Try the explanation guardrail

On Compare options, select **Show all 6** if needed. For the deferred-interest option, click **Ask about this option**:

- Ask: “What happens if I don't pay it all off in 18 months?” Check that the explanation carries the promo risk and disclosures.
- Ask: “Will I qualify?” Check that the assistant redirects to lender credit review rather than implying approval.

## Session behavior

**Start over** clears the current browser journey. The compliance audit is a shared demo history and is retained
across restarts; starting over does not delete its records. A service restart resets in-progress applications.

## Sample provenance

The three estimate files in the ZIP are byte-for-byte copies of the application's existing fixtures in
`data/synthetic/estimates/`. They are not new lender documents. The homeowner values above match the project's
existing automated browser walkthrough (`scripts/e2e-smoke.ts`). No confidential assignment material is included.
