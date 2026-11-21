---
name: ticket
description: Implement a Jira ticket from the KAN project (deepdamer.atlassian.net). Reads the issue, its parent and subtasks, turns its "Done when" / acceptance criteria into tests, runs the feature workflow, and prepares the branch, a suggested commit message and the Jira update. Use when the user gives a KAN-<n> key or a KAN issue URL, or types /ticket.
argument-hint: KAN-<n>
---

# Work on a KAN ticket

Jira site: `deepdamer.atlassian.net`. Use it as `cloudId` in every Atlassian MCP call, with the
`mcp__claude_ai_Atlassian_MCP__*` tools (the old "Atlassian Rovo" connectors run on a deprecated endpoint). If a call
says the cloud id "isn't explicitly granted", stop and ask the user to reconnect the Atlassian connector.

Workflow: **To Do → In Progress → In Review → Done** (transition ids 11 / 21 / 31 / 41; check with
`executeRead listJiraIssueTransitions` if a move fails). Claude never commits, so finished work goes to **In Review**;
**Done** only after the user's PR is merged.

Big JQL results (many tickets with descriptions) are saved to a file instead of returned: read them with
`jq '.issues.nodes[] | ...'` rather than skipping them. Judge a ticket only by its "Done when" list.

1. **Read the ticket.** Call `getJiraIssue` with `issueIdOrKey: $ARGUMENTS` and `view: "evidence"`. Also read:
   - the parent story ("Part of KAN-<n>"), which explains the why;
   - sibling subtasks (`searchJiraIssuesUsingJql`: `parent = <parent key>`), so you don't build their scope too;
   - linked tickets that block this one. If a blocker is not Done, tell the user before you start.
2. **Check against the product.** Compare the ticket with CLAUDE.md (Product, Architecture, API) and with the code. If the ticket conflicts with either, or with the KAN-80 demo flow, ask the user before you build anything.
3. **Plan.** Restate the ticket's "Done when" / "Acceptance criteria" items as a checklist. For each item, write the test that will prove it (unit, API or e2e). Show the plan in a few lines.
4. **Branch.** `git switch -c KAN-<n>-<short-slug>` from an up-to-date `main`, unless you are already on that ticket's branch.
5. **Build.** Follow the `feature` skill, steps 2–9 (impact, implement, unit tests, e2e, verify, review, CLAUDE.md). Mention the ticket key in the CLAUDE.md lines you add, e.g. `POST /machines/{id}/ask → AskOut (KAN-60)`.
6. **Report.** Go through each acceptance criterion with ✅ (and the test that proves it) or ❌ (and the reason).
7. **Hand over the commit and update Jira.** Do this only after the user confirms. These actions are shared with the team.
   - Never run `git commit`, `git push` or `gh pr create` (denied in `.claude/settings.json`). Suggest the message `KAN-<n>: <summary>` and the files to stage; the user commits and pushes.
   - Post a short comment on the ticket (`addOrEditJiraIssueComment`): what changed, how to test it, and the PR link if there is one.
   - Move the ticket only if the user asks (`transitionJiraIssue`): all "Done when" items ✅ and tested → In Review;
     some built → In Progress, and say in the comment what is missing. A different technology than the ticket names
     (e.g. pypdf instead of PyMuPDF) is not ✅: report it as a deviation for the team to accept.
   - Keep the Jira line in CLAUDE.md "Current status" in sync with what you moved.
