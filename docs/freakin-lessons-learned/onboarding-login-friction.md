# Onboarding/Login Friction

As of 8/31/2025, there is still friction in the onboarding/login process. The
initial greeting links are working well, but after this, people get confused.

## SSO codes (QR or link) - DONE 8/31/25

Easily help people login with an single sign-on link like our greeting codes
(model Code in schema.prisma).Group admins should be able to do this for any
member of their group.

Group Admin

- In group admin pages at /admin/groups/[slug]/edit/members, show a new Login
  link for each user.
- When clicked, open a LoginCodeModal similar to our current QRCodeModal.
  - System geneates a new code in the codes table. The createdAt timestamp will
    be used to expire the code after 7 days.
  - Append the code to the base URL + '/one-time-login/[code]'
  - Generate a QR code for this URL
  - Show the QR code in the LoginCodeModal.
  - The admin can either copy and send the link to the user or show them to QR
    code (if they're together).
- Make this view mobile friendly:
  - On mobile, don't show photos
  - Limit the width of names and emails shown in this table to 25 characters
    with the truncate class and show ellipsis if it's longer.

Login Link Recipient

- When the user scans or clicks/taps it, we look up the code:
  - If we find it and it's not expired (createdAt < 7 days ago), we should login
    the user, redirect to the user profile page at /me
    - If expired or an invalid code, tell them they need a new one and to
      contact [firstName] of the person who shared it with them.
- Show success alert: "Whew, you're back in!"
  - If the user doesn't have an installed app, invite them to install it and let
    them know it's the easiest way to get back.

## Bulk add/update group users

A group admin should be able to bulk-add/update users in the group. Many groups
(families, churches, etc.) already have a list of members.

1. Download a csv with columns:

- email
- first name
- last name
- gender
- Fill out any info for users
- Upload the csv to the group and:
  - If the user doesn't exist, create them
  - If the user exists, update their info
  - If a user exists and didn't have a verified email address, mark it as
    verified, but if they already had a verified email, don't change it.
  - Send an email to each new or updated user with an SSO link

## Simplify adding a last name, gender, and photo

- Making it super easy to add a last name, gender, and photo
- Changing password and verifying an email address (later/optional) so they can
  reset their password later if they forget it.
  - We've updated the session to 90 days.

## User forgetting how to get back to the app

Problem:

A new user may close their browser tab, not remember the URL to get back, etc.

Solution:

If we help them install the app up front, they'll have a home screen icon to get
back. Most people will start this on their phones.

Confirm how long their current session will last in their home screen app.

## User not subscribing to push notifications and so not getting updates

Problem:

The user still must open their app or web page in the browser to learn about
news. We want the ability to send updates they'll notice or have requested.

Solution:

We should help them subscribe to push notifications up front.

## User not knowing their username (that we generated for them) and default password

We've made it super easy for a new user to enter the private app by scanning a
QR code or clicking a greeting link. We only require their first name to start.

Problem:

When people greet with the app, it's hard to focus on people and their screens.
They don't notice the Guest message, etc.

Our current requirement to update their groupUser role from 'guest' to 'member'
get in the way. We don't need email verification to be a blocker. Installing the
app and subscribing to push notifications is far more important, in that order.

Solution:

Update existing guest mode requirements and messaging.

- When a user first enters a group from a greeting code/link, invite them to
  install the app.
- When a user opens the app or rejects installing the app, invite them to
  subscribe to push notifications.
  - If they reject push notifications, invite them to verify an email address so
    they can reset their password later.
- After a user has been prompted for the app and push notifications, even if
  they reject them, invite them to add their last name and photo. Do this
  separate from their user profile page in a modal so keep it super simple.

## Verifying email is a pain

Problem:

People must leave the app to check email and click verification link.

- I would like group admins or members to be able to add and/or verify an email
  address for another user so they can reset their password. Friends already
  have each other's email addresses, but there are two security risks:
  -
