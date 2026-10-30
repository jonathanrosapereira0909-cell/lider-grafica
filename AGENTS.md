<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Business rules (OS numbering, status transitions, permissions, audit) live in the database (triggers, security-definer RPCs, RLS, column-level grants); the UI only hints. Why: users can call the API directly.
- OS status changes only through `os_*` RPC functions; clients get column-level UPDATE grants that exclude status. Why: enforce the workflow and record who did each step.
- Critical tables have no DELETE grants; inactivate/cancel instead. Why: history must never be lost.
- Concurrent edits use the `version` column (update ... eq version; 0 rows = conflict). Why: avoid silent overwrites.
- OS stores a snapshot of product data at creation. Why: product edits must not change past OS.
- Never consume `os_numero_seq` in tests against the real database; sequences don't roll back.
