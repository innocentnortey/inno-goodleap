# Historical baseline: what the public record confirms about GoodLeap's contractor financing workflow

Segment D, overnight build, 2026-10-29. Feeds `data/synthetic/roadmap.json` and SCR-7 (PRD R-16).

**Method.** Each factual claim about GoodLeap's history, products or workflow made in the ChatGPT product-direction
conversation (`docs/source/04-chatgpt-product-direction.md`, turns 8–9, a confidential context source summarised
here, not quoted) was searched for on the web on 2026-10-29 and, where a page could be opened, read. A claim is
**verified** when a page we read states it, **partly verified** when a page we read supports part of it or only a
secondary source states it, and **not found** when no readable public source confirmed it. Nothing is inferred. About
30 minutes of searching; paywalled or blocked pages are recorded as not read.

## Claims

| # | Claim (summarised from turns 8–9) | Source checked (read 2026-10-29) | What the source actually says | Status |
|---|---|---|---|---|
| 1 | A GoodLeap "QuickLink V3 Partner Instructions" guide dated 2023-02-23 (seven pages) shows contractor website links with up to three loan products, estimated monthly payments, an amount prefilled from the contractor's typical loan size, a GoodLeap-hosted application and the Origin portal receiving it. | Web searches for "QuickLink V3", "GoodLeap QuickLink" and the guide's contents. | No public copy found. No page we found uses the name "QuickLink" for a GoodLeap product. | Not found |
| 2 | An undated contractor guide titled "Goodleap New Application Process": the contractor enters the invoice amount less any down payment, picks a product, emails the application or hands an iPad to the homeowner, who enters personal, property, mortgage, employment and income details, accepts disclosures and submits; outcomes include approved, declined, conditional and pending, and conditional ones may need document photos. | Searches for the title and its steps. | The guide itself was not found. The general flow is documented separately for the ServiceTitan integration (row 3). | Not found (the guide); flow partly supported by row 3 |
| 3 | ServiceTitan documents GoodLeap financing inside estimates: payment scenarios, choosing plans, submitting applications, emailing the customer a link, tracking status and uploading outstanding documents. | <https://help.servicetitan.com/docs/use-goodleap-financing-in-fma> (page dated 2026-10-28); <https://help.servicetitan.com/docs/use-goodleap-financing-integration-in-servicetitan> (updated 2026-10-16). | Estimates show an estimated monthly payment on the selected plan; technicians can "submit an application, and receive a fast decision directly in the ServiceTitan Mobile App" or send an "application link sent directly to their email"; statuses shown are approved, conditionally approved, counter offer, declined and pending; the Tasks tab uploads conditions, a signed contract and project information. | Verified |
| 4 | ServiceTitan's GoodLeap integration was discontinued for new use in April 2026; existing users may continue through 2026-12-31. | <https://help.servicetitan.com/docs/use-goodleap-financing-in-fma> (page dated 2026-10-28). | "ServiceTitan's integration with GoodLeap has been discontinued as of April 2026" … "you may continue to do so through December 31, 2026" … "After that date, the GoodLeap Financing integration will no longer be available." No reason given. | Verified |
| 5 | A 2022 S&P Global analysis confirms GoodLeap's real-time website/API originations and automated credit decisioning. | S&P presale for GoodLeap Sustainable Home Solutions Trust 2022-2, <https://www.spglobal.com/ratings/en/research/pdf-articles/220407-presale-goodleap-sustainable-home-solutions-trust-2022-2-12338232>. | The presale exists (URL dated 2022-04-07) but returned HTTP 403; its text was not read. S&P rating several 2022 GoodLeap trusts is confirmed by search results; the origination and decisioning content is not. | Not found (content not read) |
| 6 | A May 2023 Fitch analysis of GoodLeap's solar loan portfolio says underwriting required income verification only in limited cases. | Searches of Fitch and trade press for the 2023 GoodLeap trusts. | Search results show Fitch rated GoodLeap Sustainable Home Solutions Trust 2023-2 (expected ratings, legal final maturity May 2055), but no readable Fitch text on income verification was found. An installer knowledge base says income verification "may be required" below a FICO threshold; that is a third party, not Fitch. | Not found |
| 7 | GoodLeap Pros is a mobile app that lets contractors compare financing offers and manage sales. | Apple App Store, <https://apps.apple.com/us/app/id1494023388> (seller GoodLeap, LLC). | "Empower your sales with the GoodLeap Pros mobile app, designed specifically for GoodLeap contractors" … "compare offers for customers on the go, and make real-time updates." | Verified |
| 8 | Homeowners can apply through a link rather than on the contractor's device. | Roofr help, <https://help.roofr.com/en/articles/15590005-how-to-offer-goodleap-financing-on-your-roofr-proposals> (dated 2026-07-13); ServiceTitan (row 3). | Contractors can "copy your GoodLeap application link and share it via text, email, or your website"; ServiceTitan sends the application link by email. | Verified |
| 9 | Origin is a GoodLeap desktop platform for contractor and back-office financing workflows. | Roofr help (row 8). | Names "the GoodLeap origin system" where accounts need permission "to create loan application links". It does not describe Origin as a desktop or back-office platform. | Partly verified |
| 10 | GoodLeap offers embedded applications and financing APIs on its developer website. | <https://developer.goodleap.com> | The page title is "Goodleap \| Developer Portal"; its content did not load for reading. Roofr and other integrators describe requesting GoodLeap API credentials. Embedded applications specifically were not confirmed. | Partly verified |
| 11 | Plaid supports bank-based, payroll-based and document-based income verification as separate products. | <https://plaid.com/docs/income/> | Lists Bank Income ("net income information from a user-connected bank account"), Payroll Income (US only) and Document Income ("user-uploaded documents such as a pay stub, bank statement, W-2, or 1099"). | Verified |
| 12 | Found during the search, not in turns 8–9: GoodLeap automates part of income-document review. | Ocrolus case study, <https://ocrolus.com/customer-stories/goodleap-strengthens-income-accuracy-with-ocrolus-ai/> (undated; vendor's own account). | GoodLeap adopted Ocrolus to automate income calculations and document sorting with underwriters keeping oversight: "Ocrolus reads borrower documents, captures key data and executes income calculations automatically." | Partly verified (vendor claim, undated) |

Claims about GoodLeap volumes or loan counts do not appear in turns 8–9, so none were checked. Securitization sizes
seen in search results are not used.

## What the baseline section may say

- It may state rows 3, 4, 7, 8 and 11 as fact, each with its link: in 2026, GoodLeap financing was offered inside
  contractor tools with on-screen payments, plan choice, an on-the-spot or emailed application, decision statuses
  and document upload; ServiceTitan's integration is being retired at the end of 2026.
- It may state rows 9, 10 and 12 only with their limits (Origin named but not described; a developer portal exists;
  a vendor says income-document analysis is automated).
- It must not state the 2023 QuickLink guide, the "New Application Process" guide, or the S&P and Fitch findings as
  fact. If it mentions that a calculator existed in 2023, it labels that an assumption from earlier research with no
  public copy found.
- These sources describe GoodLeap's real products, not the brief's anonymised lender. The brief's figures (22 minutes,
  38% abandonment, manual document extraction) stay the scenario facts; row 12 is a reason to ask which documents are
  still reviewed by hand, not a contradiction of the brief.
