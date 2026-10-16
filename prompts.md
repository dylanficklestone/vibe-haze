# Chat Prompts History

This document collates all user prompts submitted during the development of the **SG AirWatch** project in chronological order.

---

### Prompt 1: Initial Application Specification

```text
build a singapore based application that tracks live PSI and PS2.5 levels and alerts users when air quality drops to unhealthy threasholds. It should include an interactive map and push notifications. build just the front end for now, I will add the serverless backend connection later.
```

---

### Prompt 2: Remote Repository Push

```text
gitpush https://[REDACTED_PAT]@github.com/dylanficklestone/vibe-haze.git
```

*Note: The personal access token has been redacted for security.*

---

### Prompt 3: Serverless Endpoints & Data.gov.sg v2 Integration

```text
add a serverless end point that pulls live data from data.gov.sg using the following endpoint:

GET https://api-open.data.gov.sg/v2/real-time/api/psi
GET https://api-open.data.gov.sg/v2/real-time/api/pm25

- store this in /api folder in the project root level, NOT the src folder
- include /health.ts and psi/ts within the same subfolder
- there is no key required for this service
```

---

### Prompt 4: Prompt Collation Request

```text
collate all prompts in the chat as a md file named prompts.md
```

---

### Prompt 5: OneMap Singapore Live Search Endpoint

```text
add a serverless end point that pulls live data from onemap singapore using the following endpoint:
GET https://www.onemap.gov.sg/api/common/elastic/search?searchVal=178903&returnGeom=Y&getAddrDetails=Y&pageNum=1

store this in /api folder in the project root level, NOT the src folder
include /health.ts and psi/ts within the same subfolder
there is no key required for this service
```

---

### Prompt 6: Display OneMap on the Interactive Map

```text
display the map from onemap onto the interactive map of the webpage
```


