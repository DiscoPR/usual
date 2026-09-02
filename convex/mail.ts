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

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.mail.onMessageReceived,
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
    to: v.string(),
  },
  returns: v.object({
    sent: v.boolean(),
    reason: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return { sent: false, reason: "Trip not found." };
    if (!trip.emailDraft) {
      return { sent: false, reason: "Draft an email first." };
    }
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!inboxId || !apiKey) {
      await ctx.db.insert("messages", {
        tripId: args.tripId,
        direction: "outbound",
        status: "blocked",
        subject: trip.emailSubject ?? `Your usual, in ${trip.city}`,
        body: trip.emailDraft,
        fromLabel: "not sent",
      });
      return {
        sent: false,
        reason:
          "Connect AgentMail (AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID). Send is gated. Nothing went out.",
      };
    }
    await agentmail.sendMessage(ctx, inboxId, {
      to: args.to,
      subject: trip.emailSubject ?? `Your usual, in ${trip.city}`,
      text: trip.emailDraft,
      labels: ["usual-trip"],
    });
    await ctx.db.insert("messages", {
      tripId: args.tripId,
      direction: "outbound",
      status: "sent",
      subject: trip.emailSubject ?? `Your usual, in ${trip.city}`,
      body: trip.emailDraft,
      fromLabel: "you",
    });
    await ctx.db.patch(args.tripId, { status: "sent" });
    return { sent: true, reason: null };
  },
});
