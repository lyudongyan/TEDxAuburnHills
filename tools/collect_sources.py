import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from lxml import html


USER_AGENT = "Mozilla/5.0 (compatible; TEDxAuburnHillsSpeakerResearch/1.0)"


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def collect_msu_natsci() -> list[dict]:
    base = "https://directory.natsci.msu.edu/Directory/api/Directory"
    first = json.loads(fetch_text(base + "?page=1"))
    records = list(first["results"])
    for page in range(2, int(first["pageCount"]) + 1):
        payload = json.loads(fetch_text(f"{base}?page={page}"))
        records.extend(payload["results"])
        time.sleep(0.08)

    output = []
    for person in records:
        titles = person.get("organizationTitles") or []
        output.append(
            {
                "name": re.sub(r"\s+", " ", (person.get("name") or "").strip()),
                "email": (person.get("email") or "").strip().lower(),
                "research": re.sub(r"\s+", " ", (person.get("researchInterests") or "").strip()),
                "titles": [t.get("title", "") for t in titles],
                "organizations": [t.get("organizationName", "") for t in titles],
                "source_url": f"https://directory.natsci.msu.edu/Directory/Profiles/Person/{person['id']}",
                "source": "MSU College of Natural Science",
            }
        )
    return output


def clean_html_text(value: str) -> str:
    if not value:
        return ""
    try:
        text = " ".join(html.fromstring(f"<div>{value}</div>").itertext())
    except Exception:
        text = value
    return re.sub(r"\s+", " ", text).strip()


def collect_msu_cal() -> list[dict]:
    base = "https://directory.cal.msu.edu/wp-json/wp/v2/posts"
    records = []
    page = 1
    while True:
        url = f"{base}?per_page=100&page={page}"
        try:
            payload = json.loads(fetch_text(url))
        except urllib.error.HTTPError as exc:
            if exc.code == 400:
                break
            raise
        if not payload:
            break
        records.extend(payload)
        if len(payload) < 100:
            break
        page += 1
        time.sleep(0.1)

    output = []
    for post in records:
        acf = post.get("acf") or {}
        name = clean_html_text((post.get("title") or {}).get("rendered", ""))
        output.append(
            {
                "name": name,
                "email": (acf.get("person_email") or "").strip().lower(),
                "title": clean_html_text(acf.get("person_jobtitle") or ""),
                "unit": clean_html_text(acf.get("person_unit") or ""),
                "bio": clean_html_text(acf.get("person_biography") or ""),
                "works": clean_html_text(acf.get("person_works") or ""),
                "source_url": post.get("link") or f"https://directory.cal.msu.edu/{post.get('slug', '')}/",
                "source": "MSU College of Arts & Letters",
            }
        )
    return output


def section_text_after_heading(document, heading_name: str) -> str:
    headings = document.xpath(
        "//h2[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), $name)]",
        name=heading_name.lower(),
    )
    if not headings:
        return ""
    parts = []
    for node in headings[0].itersiblings():
        if node.tag in {"h2", "h1"}:
            break
        parts.append(" ".join(node.itertext()))
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def collect_wayne_med_themes() -> list[dict]:
    theme_pages = [
        "https://www.med.wayne.edu/thematic-research/core-faculty",
        "https://www.med.wayne.edu/thematic-research/i3d-faculty",
        "https://www.med.wayne.edu/thematic-research/neuroscience/faculty",
        "https://www.med.wayne.edu/thematic-research/oncology-faculty",
        "https://www.med.wayne.edu/thematic-research/outreach-faculty",
        "https://www.med.wayne.edu/thematic-research/systems-biology-faculty",
    ]
    profile_urls = set()
    for theme_url in theme_pages:
        document = html.fromstring(fetch_text(theme_url))
        for href in document.xpath("//a[contains(@href, '/profile/')]/@href"):
            absolute = urllib.parse.urljoin(theme_url, href).split("?", 1)[0]
            if ".wayne.edu/profile/" in absolute:
                profile_urls.add(absolute)
        time.sleep(0.1)

    output = []
    for index, source_url in enumerate(sorted(profile_urls), start=1):
        try:
            document = html.fromstring(fetch_text(source_url))
        except Exception as exc:
            print(json.dumps({"warning": "profile_fetch_failed", "url": source_url, "error": str(exc)}))
            continue
        names = [re.sub(r"\s+", " ", x).strip() for x in document.xpath("//h1/text()") if x.strip()]
        name = names[0] if names else ""
        emails = []
        for href in document.xpath("//a[starts-with(@href, 'mailto:')]/@href"):
            email = href.split(":", 1)[1].split("?", 1)[0].strip().lower()
            if email and email not in emails:
                emails.append(email)

        title_candidates = []
        for node in document.xpath("//h1[contains(@class,'lg:hidden')]/following-sibling::div[contains(@class,'content')][1]/p[1]"):
            title_candidates.append(re.sub(r"\s+", " ", node.text_content()).strip())
        if not title_candidates:
            for node in document.xpath("//main//p[1]"):
                title_candidates.append(re.sub(r"\s+", " ", node.text_content()).strip())

        bio = section_text_after_heading(document, "biography")
        research = section_text_after_heading(document, "areas of research")
        if not research:
            research = section_text_after_heading(document, "research")
        output.append(
            {
                "name": name,
                "email": emails[0] if emails else "",
                "all_emails": emails,
                "title": title_candidates[0] if title_candidates else "",
                "bio": bio,
                "research": research,
                "source_url": source_url,
                "source": "Wayne State University School of Medicine",
            }
        )
        if index % 25 == 0:
            print(json.dumps({"progress": index, "profiles": len(profile_urls)}))
        time.sleep(0.08)
    return output


def collect_msu_acm_people() -> list[dict]:
    api_url = "https://artsmuseumsmanagement.cal.msu.edu/wp-json/wp/v2/pages?slug=people"
    payload = json.loads(fetch_text(api_url))
    rendered = payload[0]["content"]["rendered"]
    document = html.fromstring(rendered)
    output = []
    seen = set()
    for anchor in document.xpath("//a[starts-with(translate(@href, 'MAILTO', 'mailto'), 'mailto:')]"):
        href = anchor.get("href", "")
        email = urllib.parse.unquote(href.split(":", 1)[1].split("?", 1)[0]).strip().lower().lstrip()
        email = email.replace(" ", "")
        if not re.fullmatch(r"[a-z0-9._%+-]+@msu\.edu", email) or email in seen:
            continue
        seen.add(email)
        container = None
        node = anchor
        while node is not None:
            mailtos = node.xpath(".//a[starts-with(translate(@href, 'MAILTO', 'mailto'), 'mailto:')]")
            headings = node.xpath(".//h2|.//h3|.//h4")
            text_value = re.sub(r"\s+", " ", " ".join(node.itertext())).strip()
            if len(mailtos) == 1 and headings and 50 <= len(text_value) <= 6000:
                container = node
                break
            node = node.getparent()
        if container is None:
            continue
        heading_texts = [re.sub(r"\s+", " ", h.text_content()).strip() for h in container.xpath(".//h2|.//h3|.//h4")]
        heading_texts = [h for h in heading_texts if h and h.lower() not in {"faculty", "staff", "graduate students", "core faculty", "other msu professors", "affiliate faculty"}]
        name = heading_texts[0] if heading_texts else ""
        if not name:
            continue
        full_text = re.sub(r"\s+", " ", " ".join(container.itertext())).strip()
        full_text = re.sub(re.escape(email), "", full_text, flags=re.IGNORECASE).strip(" |–—")
        output.append(
            {
                "name": name,
                "email": email,
                "bio": full_text,
                "source_url": payload[0]["link"],
                "source": "MSU Arts, Cultural Management & Museum Studies",
            }
        )
    return output


def decode_cfemail(value: str) -> str:
    data = bytes.fromhex(value)
    key = data[0]
    return "".join(chr(byte ^ key) for byte in data[1:]).strip().lower()


def cfemails_in(node) -> list[str]:
    emails = []
    for value in node.xpath(".//*[@data-cfemail]/@data-cfemail"):
        try:
            email = decode_cfemail(value)
        except Exception:
            continue
        if re.fullmatch(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", email) and email not in emails:
            emails.append(email)
    return emails


def collect_oakland_local() -> list[dict]:
    output = []

    psychology_url = "https://www.oakland.edu/psychology/faculty-and-staff/"
    psychology = html.fromstring(fetch_text(psychology_url))
    for block in psychology.xpath("//*[contains(concat(' ', normalize-space(@class), ' '), ' mts-bio ')]"):
        emails = cfemails_in(block)
        text_value = re.sub(r"\s+", " ", " ".join(block.itertext())).strip()
        if not emails or not re.search(r"professor", text_value, re.I):
            continue
        names = [re.sub(r"\s+", " ", n.text_content()).strip() for n in block.xpath(".//a[not(.//*[@data-cfemail])][1]")]
        if names:
            name = names[0]
        else:
            first_line = re.split(r"(?:Visiting |Associate |Assistant |Distinguished )?Professor", text_value, maxsplit=1, flags=re.I)[0]
            name = first_line.strip(" ,")
        if len(name.split()) < 2:
            continue
        if "," in name:
            last, first = [part.strip() for part in name.split(",", 1)]
            name = f"{first} {last}".strip()
        output.append(
            {
                "name": name,
                "email": emails[0],
                "title": text_value,
                "topic": text_value,
                "source_url": psychology_url,
                "source": "Oakland University Department of Psychology",
                "pool": "psychology",
            }
        )

    engineering_url = "https://www.oakland.edu/secs/research/index"
    engineering = html.fromstring(fetch_text(engineering_url))
    engineering_people: dict[str, dict] = {}
    for section in engineering.xpath("//*[contains(concat(' ', normalize-space(@class), ' '), ' FauxFieldset ')]"):
        legends = section.xpath("./*[contains(concat(' ', normalize-space(@class), ' '), ' FauxLegend ')]")
        if not legends:
            continue
        topic = re.sub(r"\s+", " ", legends[0].text_content()).strip()
        if not topic or len(topic) > 180:
            continue
        for strong in section.xpath(".//strong"):
            name_text = re.sub(r"\s+", " ", strong.text_content()).strip(" ,.")
            name_text = re.sub(r",?\s*(Ph\.?D\.?|D\.?Sc\.?|M\.?S\.?).*$", "", name_text, flags=re.I).strip(" ,.")
            if len(name_text.split()) < 2 or len(name_text) > 90:
                continue
            paragraph = strong.getparent()
            while paragraph is not None and paragraph.tag not in {"p", "li"}:
                paragraph = paragraph.getparent()
            if paragraph is None:
                continue
            emails = cfemails_in(paragraph)
            if not emails:
                continue
            email = emails[0]
            key = email
            record = engineering_people.setdefault(
                key,
                {
                    "name": name_text,
                    "email": email,
                    "title": re.sub(r"\s+", " ", " ".join(paragraph.itertext())).strip(),
                    "topics": [],
                    "source_url": engineering_url,
                    "source": "Oakland University School of Engineering and Computer Science",
                    "pool": "engineering",
                },
            )
            if topic not in record["topics"]:
                record["topics"].append(topic)
    for record in engineering_people.values():
        record["topic"] = "; ".join(record.pop("topics"))
        output.append(record)

    directory_specs = [
        (
            "biology",
            "https://www.oakland.edu/biology/directory/",
            r"/biology/directory/[^/#?]+/?$",
            "Oakland University Department of Biological Sciences",
        ),
        (
            "public_interest",
            "https://www.oakland.edu/socan/faculty/index",
            r"/socan/faculty/[^/#?]+/?$",
            "Oakland University Sociology, Anthropology, Social Work and Criminal Justice",
        ),
    ]
    for pool, directory_url, link_pattern, source_name in directory_specs:
        directory = html.fromstring(fetch_text(directory_url))
        profile_urls = set()
        for href in directory.xpath("//a/@href"):
            absolute = urllib.parse.urljoin(directory_url, href).split("?", 1)[0]
            if re.search(link_pattern, absolute, re.I) and absolute.rstrip("/") != directory_url.rstrip("/"):
                profile_urls.add(absolute)
        for profile_url in sorted(profile_urls):
            try:
                profile = html.fromstring(fetch_text(profile_url))
            except Exception as exc:
                print(json.dumps({"warning": "oakland_profile_fetch_failed", "url": profile_url, "error": str(exc)}))
                continue
            names = [re.sub(r"\s+", " ", value).strip() for value in profile.xpath("//h1/text()") if value.strip()]
            if not names:
                continue
            content_nodes = profile.xpath("//h1/following::div[contains(concat(' ', normalize-space(@class), ' '), ' rxbodyfield ')][1]")
            content = content_nodes[0] if content_nodes else profile
            emails = cfemails_in(content)
            if not emails:
                emails = cfemails_in(profile)
            if not emails:
                continue
            text_value = re.sub(r"\s+", " ", " ".join(content.itertext())).strip()
            if len(text_value) < 60:
                continue
            output.append(
                {
                    "name": names[0],
                    "email": emails[0],
                    "title": text_value[:500],
                    "topic": text_value,
                    "source_url": profile_url,
                    "source": source_name,
                    "pool": pool,
                }
            )
            time.sleep(0.08)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", choices=["msu_natsci", "msu_cal", "wayne_med_themes", "msu_acm_people", "oakland_local"])
    parser.add_argument("output")
    args = parser.parse_args()

    collectors = {
        "msu_natsci": collect_msu_natsci,
        "msu_cal": collect_msu_cal,
        "wayne_med_themes": collect_wayne_med_themes,
        "msu_acm_people": collect_msu_acm_people,
        "oakland_local": collect_oakland_local,
    }
    records = collectors[args.source]()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"source": args.source, "records": len(records), "output": str(output_path)}))


if __name__ == "__main__":
    main()
