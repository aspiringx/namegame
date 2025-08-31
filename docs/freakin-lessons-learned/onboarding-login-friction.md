# Onboarding/Login Friction

As of 8/31/2025, there is still friction in the onboarding/login process. The
initial greeting links are working well, but after this:

## User forgetting how to get back to the app

Problem: A new user may close their browser tab, not remember the URL to get
back, etc.

Solution: If we help them install the app up front, they'll have a home screen
icon to get back. Most people will start this on their phones.

Confirm how long their current session will last in their home screen app.

## User not knowing their username (that we generated for them) and default password

We've made it super easy for a new user to enter the private app by scanning a
QR code or clicking a greeting link. We only require their first name to start.

Problem:

After this, we've tried to make updating their profile with a last name, new
password, email, and photo simple, what we call being in "guest mode". But some
users still struggle:

- They have to go check their email to verify their email address.
- They have to enter info on a small screen, hard for some people.
- They have to choose a password. If they aren't savvy enough to use password
  managers, they have to remember it.

Solution:

- User may close browser, forgetting URL, how to return, etc.
- User may not yet have a verified email so they can't use the forgot password
  flow.
- Verifying email is a pain, requiring people to leave the app to finish the
  process.
- I would like group admins or members to be able to add and/or verify an email
  address for another user so they can reset their password. Friends already
  have each other's email addresses, but there are two security risks:
  -
