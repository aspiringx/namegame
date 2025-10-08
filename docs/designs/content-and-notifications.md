# Content & Notifications

For the purposes of this document, we'll use the following definitions here:

## Content

Message or web page content, such as text, images, or files that appears
in a user interface. While this can refer to email or push notification content,
here we're talking about content for the namegame app that appears in the
browser or PWA.

We need multiple types of content to facilitate typical communication patterns:

- News/Announcement - time-sensitive content telling about something.
- Event - Similar to news, but it's telling people about a gathering at a
  specific time and place. This may be in-person, online, or both.
  - It may be one-time or recurring.
  - Should be taggable so people can filter to see only relevent events
    - e.g. events for youth/children in a church group shouldn't clutter the
      calender/upcoming events list for people to whom they don't apply.
  - It needs to support RSVPs and notifications that remind people about it.
  - We also need a view that shows all events in a responsive view that looks
    good on any screen size.
  - Ability to save any event to personal calendar... or sync all events in a
    calendar to personal devices with event details and a link to the original
    event page with all details.
  - Ability to add links (like to a zoom meeting), addresses (that link to
    maps apps), key contacts of people leading the event with photos and ability
    to community.
- Static pages that aren't time sensitive, such as information about a group,
  its leaders, etc.
- Content types should support the option for people to add comments / have a
  conversation.
  - Like typical comments that don't need to auto-update like a chat via
    websockets.
  - And/or option for each content instance to have its own chat converation,
    but in the context of the content.

## Notification

Notification is anything that alerts a person about new content. It could
be a push notification, email, or text message. Here, we're talking about
in-app notifications that appear in the browser or PWA, accessed from a new
bell icon in the header.

Our new Notifications icon (bell icon) in the page header should be aware of
new content and use the same pattern as Chat, showing a green dot when there is
unread content.

Unlike Chat, each content item should appear in the list, have the ability to
preview initial text, and be able to click to it as the full page. Maybe we
use the same underlying drawer as Chat, but when you click a content item, it
loads it to the full page instead of within the drawer. Content should have
header breadcrumbs in the full page view so you can see that list of content
in the full page view too (maybe?).

We may want to add an option to our daily push notification so there are links
to:

- New content (news, events, etc.) - Opens the content drawer
- New chat messages - Opens the chat drawer
