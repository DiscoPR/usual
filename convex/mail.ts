import { AgentMail } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { messageDirection, messageStatus } from "./schema";
import { DEMO_SLUG } from "./seedData";
import { parseTripRequest } from "./sources";
import { AUSTIN_EMAIL_INTAKE, tripIntakeFields } from "./intake";
import { writeDraftFromMatches } from "./draftEmail";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.mail.onMessageReceived,
});

export const listInbox = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      direction: messageDirection,
      status: messageStatus,
      subject: v.string(),
      body: v.string(),
      fromLabel: v.string(),
      tripId: v.union(v.id("trips"), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("messages")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(10);
    return pending
      .filter((row) => row.direction === "inbound")
      .map((row) => ({
        _id: row._id,
        direction: row.direction,
        status: row.status,
        subject: row.subject,
        body: row.body,
        fromLabel: row.fromLabel,
        tripId: row.tripId,
      }));
  },
});

export const acceptInbound = mutation({
  args: { messageId: v.id("messages") },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    if (message.tripId) return message.tripId;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (!profile) throw new Error("No profile.");

    const parsed =
      parseTripRequest(message.body) ?? parseTripRequest(message.subject);
    const city = parsed?.city ?? "Austin";
    const dateLabel = parsed?.dateLabel ?? "this weekend";

    const existing = await ctx.db
      .query("trips")
      .withIndex("by_profile_city", (q) =>
        q.eq("profileId", profile._id).eq("city", city),
      )
      .take(5);
    const open = existing.find((trip) => trip.origin === "email");
    if (open) {
      await ctx.db.patch(message._id, {
        tripId: open._id,
        status: "accepted",
      });
      return open._id;
    }

    const tripId = await ctx.db.insert("trips", {
      profileId: profile._id,
      city,
      dateLabel,
      status: "draft",
      origin: "email",
      crawlStatus: "idle",
      crawlError: null,
      emailDraft: null,
      emailSubject: null,
      matchNote: null,
      ...tripIntakeFields(
        city.toLowerCase().includes("austin") ? AUSTIN_EMAIL_INTAKE : undefined,
      ),
    });
    await ctx.db.patch(message._id, {
      tripId,
      status: "accepted",
    });
    return tripId;
  },
});

export const listForTrip = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      direction: messageDirection,
      status: messageStatus,
      subject: v.string(),
      body: v.string(),
      fromLabel: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(20);
    return rows.map((row) => ({
      _id: row._id,
      direction: row.direction,
      status: row.status,
      subject: row.subject,
      body: row.body,
      fromLabel: row.fromLabel,
    }));
  },
});

export const simulateInbound = mutation({
  args: { text: v.string() },
  returns: v.union(v.id("trips"), v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (!profile) return null;
    const parsed = parseTripRequest(args.text);
    if (!parsed) return null;
    const tripId = await ctx.db.insert("trips", {
      profileId: profile._id,
      city: parsed.city,
      dateLabel: parsed.dateLabel,
      status: "draft",
      origin: "email",
      crawlStatus: "idle",
      crawlError: null,
      emailDraft: null,
      emailSubject: null,
      matchNote: null,
      ...tripIntakeFields(
        parsed.city.toLowerCase().includes("austin")
          ? AUSTIN_EMAIL_INTAKE
          : undefined,
      ),
    });
    await ctx.db.insert("messages", {
      tripId,
      direction: "inbound",
      status: "simulated",
      subject: args.text.trim(),
      body: args.text.trim(),
      fromLabel: "simulated inbound",
    });
    return tripId;
  },
});

export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (!profile) return null;
    const message = args.message as {
      subject?: string;
      text?: string;
    };
    const text = `${message.subject ?? ""} ${message.text ?? ""}`.trim();
    const parsed = parseTripRequest(text);
    if (!parsed) return null;
    const tripId = await ctx.db.insert("trips", {
      profileId: profile._id,
      city: parsed.city,
      dateLabel: parsed.dateLabel,
      status: "draft",
      origin: "email",
      crawlStatus: "idle",
      crawlError: null,
      emailDraft: null,
      emailSubject: null,
      matchNote: null,
      ...tripIntakeFields(
        parsed.city.toLowerCase().includes("austin")
          ? AUSTIN_EMAIL_INTAKE
          : undefined,
      ),
    });
    await ctx.db.insert("messages", {
      tripId,
      direction: "inbound",
      status: "received",
      subject: message.subject ?? parsed.city,
      body: message.text ?? text,
      fromLabel: "inbound",
    });
    return null;
  },
});

export const sendTrip = mutation({
  args: {
    tripId: v.id("trips"),
    to: v.optional(v.string()),
  },
  returns: v.object({
    sent: v.boolean(),
    reason: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.tripId);
    if (!existing) return { sent: false, reason: "Trip not found." };
    if (!existing.emailDraft?.trim()) {
      await writeDraftFromMatches(ctx, args.tripId);
    }
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return { sent: false, reason: "Trip not found." };
    if (!trip.emailDraft?.trim()) {
      return {
        sent: false,
        reason: "Crawl first. Need grounded places before send.",
      };
    }
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    const apiKey = process.env.AGENTMAIL_API_KEY;
    const defaultTo = (process.env.AGENTMAIL_DEFAULT_TO ?? "").trim();
    const subject = trip.emailSubject ?? `Your usual, in ${trip.city}`;
    const to = args.to?.trim() || defaultTo;
    const mailReady = Boolean(inboxId && apiKey);

    if (mailReady && to) {
      try {
        await agentmail.sendMessage(ctx, inboxId as string, {
          to,
          subject,
          text: trip.emailDraft,
          labels: ["usual-trip"],
        });
        await ctx.db.insert("messages", {
          tripId: args.tripId,
          direction: "outbound",
          status: "sent",
          subject,
          body: trip.emailDraft,
          fromLabel: "you",
        });
        await ctx.db.patch(args.tripId, { status: "sent" });
        return { sent: true, reason: "Sent through AgentMail." };
      } catch {
        await ctx.db.insert("messages", {
          tripId: args.tripId,
          direction: "outbound",
          status: "simulated",
          subject,
          body: trip.emailDraft,
          fromLabel: "demo send",
        });
        await ctx.db.patch(args.tripId, { status: "sent" });
        return {
          sent: true,
          reason:
            "AgentMail send did not go out. The list is saved in Outbound so the loop still finishes. Check AGENTMAIL_INBOX_ID and AGENTMAIL_API_KEY.",
        };
      }
    }

    await ctx.db.insert("messages", {
      tripId: args.tripId,
      direction: "outbound",
      status: "simulated",
      subject,
      body: trip.emailDraft,
      fromLabel: "demo send",
    });
    await ctx.db.patch(args.tripId, { status: "sent" });
    if (mailReady && !to) {
      return {
        sent: true,
        reason:
          "AgentMail is connected. Add a Send to address (or set AGENTMAIL_DEFAULT_TO) for a real outbound. This tap still wrote the list in-app.",
      };
    }
    return {
      sent: true,
      reason:
        "Demo send. AgentMail is not connected, so this stayed in-app. Nothing left the machine.",
    };
  },
});
