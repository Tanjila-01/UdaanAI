# Knowledge audit and retrieval scope

Reviewed 12 September 2026. This is a structural/content-risk audit, not a completed
verification of all Indian educational guidance.

## Inventory

The original collection contains 28 Markdown documents: 12 careers, 7 education,
4 streams, 2 ITI, 2 Karnataka and 1 PUC. None contained source URLs. All remain
`draft` in `knowledge/manifest.json`. Original prose has been preserved.

Three new, narrow occupational-duty summaries in `knowledge/verified/` were checked
against the U.S. Bureau of Labor Statistics Occupational Outlook Handbook. They cover
software development, graphic design and electrician duties. Their metadata explicitly
identifies the source jurisdiction. They provide no evidence for Indian admissions,
licensing, salaries, job availability or guaranteed outcomes. Review is due 12 March 2027.

## Original document review queue

All rows below also require source attribution and a dated review before promotion.
Flags identify claims to check, not verified corrections.

| File under knowledge/ | Priority review |
| --- | --- |
| careers/ai-ml-engineer.md | Separate helpful school choices from mandatory eligibility; substantiate regional demand claims. |
| careers/chartered-accountant.md | ICAI training duration, scheme and entry routes; avoid ambiguous articleship length. |
| careers/civil-engineer.md | Karnataka diploma-to-degree conditions and entrance routes. |
| careers/cybersecurity-engineer.md | Separate entry-level learning from experience-dependent credentials. |
| careers/data-scientist.md | Programme-specific admission requirements; regional employment claims. |
| careers/doctor-mbbs.md | Distinguish PG and super-specialty routes; current entrance and registration requirements. |
| careers/graphic-designer.md | Separate graphic design from UI/UX; programme-specific entrance routes. |
| careers/lawyer.md | Institution-specific entrance processes, degree and professional practice requirements. |
| careers/mechanical-engineer.md | Lateral-entry requirements and regional employment claims. |
| careers/nursing.md | Karnataka admission process and separate B.Sc/GNM eligibility. |
| careers/software-engineer.md | PCMC as a possible route rather than a universal requirement; alternate-route eligibility. |
| careers/teacher.md | Separate school levels, teacher qualifications and higher-education requirements. |
| education/bba.md | Programme-specific duration and eligibility; no direct BBA candidate in current stage scoring. |
| education/bca.md | Subject requirements and duration by institution; avoid universal any-stream admission. |
| education/bcom.md | Duration and admissions by institution/programme. |
| education/be-btech.md | Entrance, subjects, minimum marks and exceptions using current official rules. |
| education/bsc-computer-science.md | Duration and subject requirements by institution. |
| education/diploma-engineering.md | Current DTE admission and diploma-to-degree rules. |
| education/mbbs.md | Complete current eligibility and admission requirements; avoid portraying other health careers as failure options. |
| iti/iti-electrician.md | Trade-specific entry criteria, duration, certification and progression. |
| iti/iti-overview.md | Trade-specific Class 8/10 eligibility and lateral-entry conditions. |
| karnataka/karnataka-education-system.md | Current official authority names and scope. |
| karnataka/kcet.md | Distinguish the entrance test from counselling and architecture admission routes. |
| puc/puc-karnataka.md | Verify PCMB-required wording, subject combinations and authority names. |
| streams/arts-humanities.md | Distinguish illustrative careers from degree-specific eligibility. |
| streams/commerce.md | Separate recommended mathematics from mandatory requirements. |
| streams/pcmb.md | Review wording about skipping mathematics and actual programme prerequisites. |
| streams/pcmc.md | Avoid implying that alternative computing degrees are uniformly less mathematical. |

## Pathway mapping

Manifest pathway IDs are validated against the actual `STAGE_CONFIG` candidates.
Mappings are editorial relevance links, not eligibility decisions or new scoring rules.
BBA is deliberately unmapped because no direct BBA candidate exists in this engine.
BCA and Commerce-to-computing exploration also need a broader catalogue discussion;
do not add an unrelated candidate just to satisfy a filter.

Coverage is particularly thin for Commerce, Arts, agriculture, pharmacy, veterinary
study, hospitality, social work and several vocational trades. Verified content is
currently limited to three general occupations, so verified searches for many subjects
will correctly have no appropriately filtered sources. No college fees, admission dates,
cutoffs, scholarships or salary estimates are verified here.

## Promotion workflow

Review a source against the applicable official authority (such as KEA, Karnataka DTE,
ICAI or the relevant institution). Rewrite unsupported claims. Add HTTPS source URLs,
publisher, jurisdiction and relevant source section. Set `reviewed_on`, `review_due`,
increment `version`, and change `status` to `verified`. Reingest to publish the change.
The ingestion script does not fact-check prose automatically: this remains an editorial task.
