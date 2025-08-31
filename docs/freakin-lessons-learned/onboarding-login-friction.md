# Onboarding/Login Friction

As of 8/31/2025, there is still friction in the onboarding/login process. The
initial greeting links are working well, but after this:

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
