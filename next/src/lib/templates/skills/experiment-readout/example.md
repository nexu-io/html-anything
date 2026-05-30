# Experiment Readout Input

Experiment: Onboarding checklist for new team workspaces
Owner: Growth PM
Dates: 2026-05-06 to 2026-05-20
Audience: New workspaces with 2-20 invited users

## Hypothesis
If we show a guided onboarding checklist after workspace creation, more teams will invite teammates and complete their first shared workflow within 7 days.

## Variants
- Control: Current empty dashboard with "Create workflow" button.
- Variant: Checklist with four steps: invite teammates, connect data source, create first workflow, schedule weekly digest.

## Metrics
Primary metric: Activation within 7 days, defined as "created a workflow and invited at least one teammate."
Guardrails: support tickets per workspace, workspace deletion within 7 days.

## Results
Control:
- Sample: 1,842 workspaces
- Activation: 21.4%
- Invite teammate: 38.1%
- Create workflow: 44.8%
- Support tickets per 100 workspaces: 6.2
- Workspace deletion: 4.8%

Variant:
- Sample: 1,799 workspaces
- Activation: 26.9%
- Invite teammate: 47.4%
- Create workflow: 46.1%
- Support tickets per 100 workspaces: 7.1
- Workspace deletion: 5.0%

Notes:
- No formal p-value was calculated yet.
- Qualitative feedback says checklist made the product feel "less empty."
- Support saw more questions about connecting data sources.
- Engineering says data-source step can be split into "skip for now" and "connect later" in 2 days.
