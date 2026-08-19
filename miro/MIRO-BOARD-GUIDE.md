# Cadence Workflow — Miro Board Operating Model

## Recommended frames

1. **01 — Project North Star**
   - business problem
   - in/out scope
   - source facts
   - design principles

2. **02 — Current State**
   - sales → order coordinator → planning → production teams → QC → dispatch
   - annotate manual data entry, Excel, messaging, paper, verbal handoffs
   - mark the Excel + work-order handoff as the primary known bottleneck

3. **03 — Future State**
   - lane A: Order & Approval
   - lane B: Fabric Track
   - lane C: Production Track
   - visually mark uncertain dependencies as `NEEDS DECISION`

4. **04 — Open Questions**
   - one sticky per question
   - tags: Product Model / Fabric / Workflow / Planning / Roles / QC / Integration / Success
   - vote only after each question has an owner

5. **05 — MVP / V1 / V2**
   - use three columns
   - each card contains feature, why, acceptance, owner, blocker

6. **06 — Data Model**
   - entities and relationships
   - focus on Order → OrderItem → StageRun
   - show FabricRequirement, WorkOrder, QCInspection, DispatchSlip, AuditEvent

7. **07 — Roles & RACI**
   - clarify who reads, changes, approves, and is notified
   - decide whether operators have accounts or only supervisors update progress

8. **08 — KPIs & Success**
   - separate measured baseline from desired target
   - do not treat the discovery document's example values as measured facts

9. **09 — Risks & Decisions**
   - decisions should be dated and linked back to the affected workflow/requirement

## Workshop definition of done

The workflow workshop is complete when:

- Work Order/بیجک scope is decided.
- Fabric formula and ownership are decided.
- Parallel vs sequential routing is decided.
- Partial quantity completion is decided.
- Stage update responsibility is decided.
- QC rework routing is decided.
- Planning cadence and priority policy are agreed.
- MVP is locked with acceptance criteria.
- 30/60/90-day success metrics and baseline measurement plan are agreed.

## Sync rule

Miro is the collaborative visual canvas. Cadence Workflow Studio is the structured baseline. After each Miro workshop, update Questions/Decisions/Requirements in the local app and export a dated JSON snapshot.
