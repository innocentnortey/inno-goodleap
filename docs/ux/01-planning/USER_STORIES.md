# User stories (UX-1, light mode: core flows only)

Format: as a *who* I need *what* so that *why*. Each links its PRD requirement, worked pair and screen.

| ID | Story | PRD | WP | Screen |
|---|---|---|---|---|
| US-1 | As a **contractor** in a homeowner's kitchen I need to enter the job amount and the homeowner's priority and see financing options in seconds, so that I can answer "what would my payment be?" before the moment passes | R-1, R-2, R-3 | WP-1 | SCR-1 |
| US-2 | As a **homeowner** I need each option's monthly payment, total cost and promo conditions side by side, with the catch of a promo stated plainly, so that I understand what I'd be agreeing to | R-3 | WP-1 | SCR-1 |
| US-3 | As a **homeowner** I need to ask one specific question about the option in front of me and get a short, trustworthy answer, so that the one thing stopping me is resolved without a sales pitch | R-4, R-5, R-6 | WP-2 | SCR-2 |
| US-4 | As a **homeowner** who asks "will I qualify?" I need a straight answer that this screen can't tell me and the lender decides, so that I'm never misled about approval | C-1, R-5 | WP-2 | SCR-2 |
| US-5 | As a **contractor** I need to upload my estimate and have the application prefilled from it and from my profile, so that nobody retypes what already exists | R-7, R-8, R-9 | WP-3 | SCR-3 |
| US-6 | As a **contractor** I need to see which fields the agent could not fill and why, so that I know exactly what to ask the homeowner for | R-7, R-8 | WP-3 | SCR-3 |
| US-7 | As a **homeowner** I need to verify my income on my own step, without the contractor seeing my financial details, so that I feel safe sharing them | R-10, R-12 | WP-4 | SCR-4 |
| US-8 | As a **homeowner** whose bank connection fails I need to be told plainly what happened and given another way through, so that I don't give up | R-11 | WP-4 | SCR-4 |
| US-9 | As a **homeowner** I need to review every prefilled value, see where it came from, correct it, accept the disclosures and submit, so that the application is mine and complete | R-13, R-14 | WP-3 | SCR-5 |
| US-10 | As a **compliance reviewer** I need to see exactly what the system said to a borrower, from what inputs, and which checks it passed, so that I can audit any interaction | R-15, C-5 | WP-2, WP-4 | SCR-6 |
| US-11 | As an **interview reviewer** I need to see what was built, what was mocked, what was assumed and where the product would go next, so that I can judge the engineering judgment, not just the demo | R-16 | — | SCR-7 |

Open behaviour questions (`UXP-n`), routed to the screen they affect:

| ID | Question | Default in the build | Screen |
|---|---|---|---|
| UXP-1 | Does the homeowner take the device, or get a link, for SCR-4/SCR-5? | A visible "Hand to homeowner" step boundary in the rail; same device in the demo [A, D-12] | SCR-4 |
| UXP-2 | How many products on SCR-1: all six, or the top three by priority? | Top three shown large, "show all 6" expands | SCR-1 |
| UXP-3 | Does the question box keep history across products? | No: context resets to the selected product; prior Q&A stays visible in the audit view | SCR-2 |
