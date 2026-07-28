---
name: columbus-311-case-lookup
description: Look up a Columbus, OH 311 (CBUS 311) service request / case by its CAS-ID on the public citizen portal (columbusoh.oneviewcrm.cc). Use when the user gives a case number like CAS-3089579-L6N6Q9 and wants its details (status, location, description, vendor, ADA blocking) pulled from the portal.
---

This skill looks up a specific Columbus, OH 311 service request on the public CBUS 311 citizen portal at https://columbusoh.oneviewcrm.cc, given its case ID (format: CAS-XXXXXXX-XXXXXX, e.g. CAS-3089579-L6N6Q9), and returns structured details including the micromobility vendor and whether the report indicates an ADA/accessibility blockage.

## Important constraint

The portal's "Nearby Requests" page (`/servicerequests/nearby`) has **no direct case-ID search**. Typing a case ID into the search box is interpreted as an address lookup and fails ("The address submitted is not within the jurisdiction of Columbus, OH"). Case detail pages are addressed by internal UUID (e.g. `/servicerequests/ffb6e294-a988-f111-a86d-000d3adc4910`), not the human-readable CAS ID, so you cannot guess the detail URL directly either.

**The only reliable way to find a specific case is to search by its address or nearest intersection**, then scan the results list for the matching CAS ID. So always ask the user (or infer from context) for the address or intersection associated with the case if they haven't already provided one — the case ID alone is not enough.

## Steps

1. Ensure Claude-in-Chrome browser tools are loaded (`tabs_context_mcp`, `navigate`, `computer`, `browser_batch`, `read_page`) via ToolSearch if deferred.
2. Open a **new tab** with `tabs_create_mcp` (reusing an existing tab on this site has occasionally hung indefinitely on the loading spinner — a fresh tab avoids that).
3. Navigate the new tab to `https://columbusoh.oneviewcrm.cc/servicerequests/nearby` and wait ~2 seconds for "Loading Requests..." to resolve.
4. Click the search bar at the top (~coordinate 750,25 in a 1462-wide viewport) and type the address or intersection, e.g. `E Como Ave & Indianola Ave, Columbus, OH`. Press Return.
5. Wait ~2 seconds for results to load. The search box will show the geocoded address (e.g. with a ZIP appended) and a list of nearby service requests appears below, each showing: request type, `ID #CAS-...`, status badge, and last-updated time.
6. Scan the list for the CAS ID the user asked about. It's often the most recent/first result if the address is precise, but check the full visible list and scroll if needed.
7. Click the matching row to open Request Details. This shows: request type (header), status badge, full address, free-text description, comment count, and a photo carousel (may show a placeholder/broken-image icon if no photo was actually attached — don't assume a vendor from a placeholder).

## Extracting vendor and ADA-blocking status

Only relevant for micromobility-type requests (e.g. "Shared Electric Bike & Scooters"). For other request types, skip these two fields.

**Vendor identification** — determine which shared mobility company the report is about:
- **Spin** — orange or blue branded scooter/bike
- **Veo** — teal and black branded scooter or bike
- **Nike** — (as given; treat as another named vendor to detect from color/branding)
- First check the free-text description for the vendor name or a device ID pattern that names the company (e.g. "Veo scooter #1013458"). Text is the most reliable signal — reporters often name the vendor and device number directly.
- If the vendor isn't named in the text, inspect the attached photo(s) in the carousel (zoom in on each image with the `zoom` computer-use action if needed) and identify the vendor by scooter/bike color and branding per the mapping above.
- If a report mentions multiple devices from different vendors (e.g. both a Veo scooter and a Veo bike, or a Spin and a Veo), list all vendors/devices found rather than picking one.
- If vendor cannot be determined from either text or image (e.g. broken/placeholder image and no name in text), report "Unknown / not stated."

**ADA blocking (yes/no)** — determine whether the report describes an accessibility obstruction:
- Answer **yes** if the description or photo indicates the device is blocking a sidewalk, curb ramp, crosswalk, bus stop, or otherwise not leaving adequate clearance (Columbus/PROWAG standard is typically 4 feet of clear path) for wheelchair users or pedestrians with disabilities. Look for language like "blocking sidewalk," "not allowing X feet to clear wheelchairs," "blocking curb ramp," "blocking bus stop," etc.
- Answer **no** if the device is described/shown as properly parked (e.g., in a corral, on the street, in a bike lane away from the sidewalk path) with no obstruction language.
- If ambiguous, err toward describing what's stated rather than guessing — report "Unclear from description" and quote the relevant text.

## Reporting back to the user

For each case, report: request type, status, address, vendor(s)/device(s) identified (with method: "from text" or "from photo"), ADA blocking (yes/no/unclear, with the supporting phrase), description, and created/updated timestamps. No login is needed — this portal is public and read-only for browsing nearby requests.

## Troubleshooting

- If a screenshot or read_page call times out repeatedly ("Script injection timed out" / "Page still loading"), don't keep retrying the same tab — open a new tab and navigate fresh. This has resolved every observed hang.
- The Filters panel (top-left) only offers Request Type, Status, and Date Range — not an ID search — so it's not useful for this task.
- If the user only has a case ID and no address, ask them for the address/intersection, or a general area, before proceeding — there is no way to search by ID alone on this portal.
- The photo carousel sometimes only shows a gray placeholder icon even when photos exist — if the visible frame is a placeholder, try scrolling/clicking through the carousel (it can auto-rotate) or note that no usable image was available.
