/** U08 remains the only Google writer. SQL delivery has no compatible adapter yet. */
export const SQL_WORKSPACE_GATE=Object.freeze({state:'BLOCKED' as const,code:'SQL_WORKSPACE_BINDING_RECONCILIATION_REQUIRED',
 blockers:['SQL binding lacks the complete U08 six-resource identity/revision/grant contract','SQL outbox has no U08 delivery-journal capability; no second writer may claim it'],providerCalls:0});
