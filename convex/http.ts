import { AgentMail } from "@agentmail/convex";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.mail.onMessageReceived,
});

const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) =>
    // AgentMail's handleWebhook is typed as RunMutationCtx; httpAction
    // provides an action ctx. The package README mounts it this way.
    agentmail.handleWebhook(ctx as never, req),
  ),
});

registerStaticRoutes(http, components.staticHosting);

export default http;
