---
name: ticket
description: Implement a Jira ticket from the KAN project (deepdamer.atlassian.net). Reads the issue, its parent and subtasks, turns its "Done when" / acceptance criteria into tests, runs the feature workflow, and prepares the branch, commit and Jira update. Use when the user gives a KAN-<n> key or a KAN issue URL, or types /ticket.
argument-hint: KAN-<n>
---

# Work on a KAN ticket

Jira site: `deepdamer.atlassian.net`. Use it as `cloudId` in every Atlassian MCP call.

1. **Read the ticket.** Call `getJiraIssue` with `issueIdOrKey: $ARGUMENTS` and `view: "evidence"`. Also read:
   - the parent story ("Part of KAN-<n>"), which explains the why;
   - sibling subtasks (`searchJiraIssuesUsingJql`: `parent = <parent key>`), so you don't build their scope too;
   - linked tickets that block this one. If a blocker is not Done, tell the user before you start.
2. **Check against the product.** Compare the ticket with CLAUDE.md (Product, Architecture, API) and with the code. If the ticket conflicts with either, or with the KAN-80 demo flow, ask the user before you build anything.
3. **Plan.** Restate the ticket's "Done when" / "Acceptance criteria" items as a checklist. For each item, write the test that will prove it (unit, API or e2e). Show the plan in a few lines.
4. **Branch.** `git switch -c KAN-<n>-<short-slug>` from an up-to-date `main`, unless you are already on that ticket's branch.
5. **Build.** Follow the `feature` skill, steps 2–9 (impact, implement, unit tests, e2e, verify, review, CLAUDE.md). Mention the ticket key in the CLAUDE.md lines you add, e.g. `POST /machines/{id}/ask → AskOut (KAN-60)`.
6. **Report.** Go through each acceptance criterion with ✅ (and the test that proves it) or ❌ (and the reason).
7. **Commit and update Jira.** Do this only after the user confirms. These actions are shared with the team.
   - Commit `KAN-<n>: <summary>`. Push and open a PR only if the user asks.
   - Post a short comment on the ticket (`addOrEditJiraIssueComment`): what changed, how to test it, and the PR link if there is one.
   - Move the ticket to the next status only if the user asks (`transitionJiraIssue`).
