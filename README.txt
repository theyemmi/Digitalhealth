AEGIS AUTOMATED RESULT EMAIL

This package adds personalized Mailchimp merge fields to the working diagnostic.

NEW MERGE FIELDS
RESULTBAND  - result band text
PRIMARYGAP  - weakest pillar key
FIXTITLE    - personalized fix title
FIXBODY     - personalized fix explanation
PROTOCOL1   - step 1 title, explanation and timing
PROTOCOL2   - step 2 title, explanation and timing
PROTOCOL3   - step 3 title, explanation and timing

EXISTING FIELDS
FNAME, OVERALL, ENERGY, SLEEP, STRESS, DECISIONS, BODY

VERCEL
Replace:
- index.html
- api/subscribe.js

Environment variables:
MAILCHIMP_API_KEY
MAILCHIMP_LIST_ID
MAILCHIMP_STATUS_IF_NEW=subscribed

MAILCHIMP
Create the seven new audience fields above as Text fields using the exact merge tags.
Then create ONE Customer Journey:
Trigger: tag added -> performance-diagnostic
Action: Send email
Paste/import mailchimp-result-email.html into the email editor and use the merge tags.

BOOKING URL
https://calendly.com/tokunbofasuyi/secure-your-strategy-session
