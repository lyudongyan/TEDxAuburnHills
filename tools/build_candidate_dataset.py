import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


BASE = Path("outputs/tedx-speaker-outreach-20260719")

CATEGORIES = {
    "A": "University faculty and researchers",
    "B": "Doctors, clinicians, and healthcare leaders",
    "C": "Nonprofit and community leaders",
    "D": "Entrepreneurs and builders",
    "E": "Artists, writers, musicians, and creators",
    "F": "Educators and youth-development leaders",
    "G": "People with unusual lived experience or public-interest work",
    "H": "Student or young adult speakers",
}

QUOTAS = {"A": 135, "B": 75, "C": 50, "D": 55, "E": 65, "F": 65, "G": 45, "H": 10}

GENERIC_LOCALPARTS = {
    "info",
    "contact",
    "media",
    "admissions",
    "support",
    "help",
    "office",
    "department",
    "webmaster",
    "communications",
    "marketing",
    "events",
    "faculty",
    "staff",
    "saswcj",
    "biology",
    "chemistry",
    "psychology",
}

ACTION_WORDS = re.compile(
    r"research|focus|study|studies|explor|examin|investigat|develop|design|create|practice|teach|learn|community|curat|build|work",
    re.I,
)


def load(name):
    return json.loads((BASE / f"{name}.json").read_text(encoding="utf-8"))


def clean_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def key_text(value):
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def normalize_name(value):
    value = clean_space(value)
    value = re.sub(r"\s*\([^)]*(?:Spring|Fall|Winter|Summer)\s+\d{4}\)\s*$", "", value, flags=re.I)
    value = re.sub(r",?\s+(?:M\.?D\.?|Ph\.?D\.?|D\.?O\.?|M\.?P\.?H\.?|M\.?B\.?A\.?|R\.?N\.?)(?=\s|,|$).*$", "", value, flags=re.I)
    return value.strip(" ,")


def valid_name(name):
    tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+", name)
    return len(tokens) >= 2 and len(name) <= 100 and not re.search(r"unknown|not available", name, re.I)


def valid_email(email):
    email = (email or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", email):
        return False
    local = email.split("@", 1)[0]
    simple = re.sub(r"[^a-z]", "", local)
    if simple in GENERIC_LOCALPARTS:
        return False
    return True


def sentences(text):
    text = clean_space(text)
    text = re.sub(r"←\s*Return to listing.*$", "", text, flags=re.I)
    text = re.sub(r"\b(?:Phone|Office|Fax):?\s*\(?\d{3}\)?.{0,30}", " ", text, flags=re.I)
    return [s.strip(" -–—•") for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) >= 25]


def best_sentence(text, keywords):
    candidates = sentences(text)
    if not candidates:
        candidates = [clean_space(text)]
    best = ""
    best_score = -10_000
    for index, sentence in enumerate(candidates):
        lower = sentence.lower()
        score = 0
        score += 7 * sum(1 for word in keywords if word in lower)
        score += 6 if re.search(r"research|focus|studies|explores|examines|investigates|practice|interests|develops", sentence, re.I) else 0
        score += 2 if ACTION_WORDS.search(sentence) else 0
        score += 2 if 55 <= len(sentence) <= 320 else 0
        score -= 9 if re.search(r"degree|earned (?:a|his|her|their)|joined|appointed|award|publication|published|featured|course|phone|office|email|holds an? |serves as|currently (?:is|serves)|director of", lower) else 0
        score -= 5 if re.search(r"\b(?:19|20)\d{2}\b", sentence) else 0
        score -= 2 * index / max(len(candidates), 1)
        if len(sentence) > 500:
            score -= 4
        if score > best_score:
            best_score = score
            best = sentence
    return best


def focus_phrase(text, name, keywords, strict=False):
    patterns = [
        (18, r"(?:research|work|practice|lab|laboratory)\s+(?:primarily\s+|broadly\s+|currently\s+)?(?:focuses|is focused|centers|is centered)\s+(?:on|around)\s+(.+)"),
        (18, r"(?:primary\s+)?area\s+of\s+research\s+is\s+(.+)"),
        (17, r"research\s+interests?\s+(?:include|includes|are|lie in)\s+(.+)"),
        (17, r"(?:key|teaching|scholarly)\s+interests?\s+(?:include|includes|are)\s+(.+)"),
        (17, r"research\s+interests?\s+(?:center|centers)\s+on\s+(.+)"),
        (16, r"research\s+interest\s*:\s*(.+)"),
        (16, r"areas?\s+of\s+(?:expertise|interest)\s*:\s*(.+)"),
        (17, r"research\s+program\s+(?:has\s+)?involved\s+(.+)"),
        (16, r"(?:current\s+)?work\s+(?:is\s+)?centered\s+on\s+(.+)"),
        (16, r"(?:whose|her|his|their)\s+(?:work|practice)\s+(?:incorporates|explores|examines|investigates|focuses on)\s+(.+)"),
        (15, r"(?:artistic|creative)\s+practice\s+(?:is|includes|explores|examines|centers on)\s+(.+)"),
        (13, r"interests?\s+(?:include|includes|span)\s+(.+)"),
        (12, r"is\s+an?\s+([^.]{0,100}\b(?:artist|poet|writer|filmmaker|designer|photographer|sculptor|ceramicist|theatre maker)\b.+)"),
        (11, r"works?\s+(?:across|in|with)\s+(.+)"),
        (15, r"conducting\s+research\s+(?:in|on)\s+(.+)"),
        (14, r"research\s+(?:aims?|seeks?)\s+to\s+(.+)"),
        (12, r"(?:studies|explores|examines|investigates|develops|designs|creates|specializes in)\s+(.+)"),
        (11, r"interested\s+in\s+(.+)"),
        (10, r"(?:teaches|supports|facilitates)\s+(.+)"),
        (11, r"(?:goal|aim)\s+(?:of\s+(?:the|this|our|her|his|their)\s+(?:work|research|lab|project)\s+)?is\s+to\s+(.+)"),
    ]
    phrase_candidates = []
    for sentence_index, sentence_value in enumerate(sentences(text)):
        lower = sentence_value.lower()
        if re.search(r"degree|earned|award|published|featured|appointed|phone|office|email", lower):
            continue
        for weight, pattern in patterns:
            match = re.search(pattern, sentence_value, re.I)
            if not match:
                continue
            candidate = clean_space(match.group(1)).strip(" ,;:.-")
            score = weight + 4 * sum(1 for word in keywords if word in candidate.lower()) - sentence_index / 20
            if 28 <= len(candidate) <= 500:
                phrase_candidates.append((score, candidate))
    phrase = max(phrase_candidates, key=lambda item: item[0])[1] if phrase_candidates else ""
    if not phrase and strict:
        return ""
    if not phrase:
        sentence = best_sentence(text, keywords)
        sentence = re.sub(re.escape(name), "", sentence, flags=re.I)
        last = name.split()[-1] if name.split() else ""
        if last:
            sentence = re.sub(rf"\b(?:Dr\.?|Professor|Prof\.?)?\s*{re.escape(last)}(?:'s|’s)?\b", "", sentence, flags=re.I)
        phrase = sentence
        phrase = re.sub(r"^(?:He|She|They|His|Her|Their|This researcher|The lab)\s+", "", phrase, flags=re.I)
        phrase = re.sub(r"^(?:is|are|was|were)\s+", "", phrase, flags=re.I)
    phrase = re.sub(r"\b(?:Dr\.|Mr\.|Ms\.|Prof\.)\s+", "", phrase)
    phrase = re.sub(r"\s+", " ", phrase).strip(" ,;:.-–—")
    phrase = re.sub(r"^(?:and|but)\s+", "", phrase, flags=re.I)
    phrase = re.sub(r"\bI\b", "the researcher", phrase)
    phrase = re.sub(r"\bmy\b", "the researcher's", phrase, flags=re.I)
    phrase = re.sub(r"\bour\b", "the team's", phrase, flags=re.I)
    phrase = re.sub(r"\bwe\b", "the team", phrase, flags=re.I)
    replacements = {
        "the team conduct ": "conducting ",
        "the team conducts ": "conducting ",
        "the team employ ": "using ",
        "the team employs ": "using ",
        "the team combine ": "combining ",
        "the team combines ": "combining ",
        "the researcher am ": "",
    }
    for old, new in replacements.items():
        phrase = re.sub(rf"^{re.escape(old)}", new, phrase, flags=re.I)
    phrase = re.sub(r"\s*\([^)]{80,}\)", "", phrase)
    if len(phrase) > 210:
        shortened = phrase[:210]
        cut = max(shortened.rfind(","), shortened.rfind(" and "))
        phrase = shortened[:cut] if cut >= 90 else shortened.rsplit(" ", 1)[0]
    phrase = phrase.replace(".", ",").replace(";", ",")
    return phrase.strip(" ,")


def phrase_is_usable(phrase, required_terms=None):
    lower = clean_space(phrase).lower()
    if len(lower) < 28 or len(lower) > 290:
        return False
    if re.search(r"tuition|catalog|view all academics|phone|office|email protected|selected publications|faculty publications|scholarships and awards|course:|courses:|work has been collected|credits include|guest lecturer", lower):
        return False
    if re.search(r"^(?:professor|assistant professor|associate professor|director|program at|in [a-z .]+, [a-z]+)$", lower):
        return False
    if required_terms and not any(term in lower for term in required_terms):
        return False
    return True


def labeled_section(text, labels, stops):
    text = clean_space(text)
    label_pattern = "|".join(re.escape(label) for label in labels)
    stop_pattern = "|".join(re.escape(stop) for stop in stops)
    match = re.search(rf"(?:{label_pattern})\s*:?[ ]*(.+?)(?=(?:{stop_pattern})\b|$)", text, re.I)
    if not match:
        return ""
    value = clean_space(match.group(1)).strip(" ,;:.-")
    section_sentences = sentences(value)
    if section_sentences:
        first = section_sentences[0]
        if len(first) < 55 and len(section_sentences) > 1:
            value = first.rstrip(" .:") + ": " + section_sentences[1]
        else:
            value = first
    if len(value) > 190:
        shortened = value[:190]
        cut = max(shortened.rfind(","), shortened.rfind(" and "))
        value = shortened[:cut] if cut >= 85 else shortened.rsplit(" ", 1)[0]
    return value.replace(".", ",").replace(";", ",").strip(" ,")


def make_description(category, name, text, subtype=""):
    keyword_map = {
        "B": ["health", "disease", "clinical", "patient", "care", "therapy", "prevention", "medicine", "brain", "cancer"],
        "C": ["community", "museum", "public", "outreach", "nonprofit", "culture", "engagement", "access", "social"],
        "E": ["art", "artist", "writing", "poetry", "film", "theatre", "design", "performance", "creative", "literature"],
        "F": ["teach", "learning", "education", "pedagogy", "curriculum", "student", "language", "literacy", "school"],
        "G": ["justice", "race", "immigration", "refugee", "ethics", "history", "inequality", "gender", "public", "community"],
        "H": ["research", "museum", "culture", "history", "access", "art", "community", "identity"],
    }
    phrase = focus_phrase(text, name, keyword_map.get(category, []))
    if not phrase:
        phrase = "a focused body of work connecting specialist knowledge to public questions"
    if category == "B":
        gerunds = {
            "examine": "examining",
            "understand": "understanding",
            "develop": "developing",
            "improve": "improving",
            "identify": "identifying",
            "determine": "determining",
            "use": "using",
            "explore": "exploring",
            "investigate": "investigating",
            "leverage": "using",
        }
        first = phrase.split(" ", 1)[0].lower()
        if first in gerunds:
            phrase = gerunds[first] + (" " + phrase.split(" ", 1)[1] if " " in phrase else "")
        lower = text.lower()
        if re.search(r"\bm\.?d\.?\b|physician|psychiatrist|surgeon|clinical practice", lower):
            role = "Physician-scientist"
        elif re.search(r"public health|health disparities|community-based|epidemiolog", lower):
            role = "Public health researcher"
        else:
            role = "Biomedical researcher"
        result = f"{role} studying {phrase}, with a potential talk about how emerging evidence can change prevention, diagnosis, or care."
    elif category == "C":
        result = f"Community and cultural leader working on {phrase}, with practical insight into how institutions can build participation and belonging."
    elif category == "E":
        result = f"Artist and humanities practitioner exploring {phrase}, offering a fresh way to see how culture shapes human experience."
    elif category == "F":
        result = f"Educator focused on {phrase}, with a potential talk about how learning environments change who gets to participate and succeed."
    elif category == "G":
        result = f"Public-interest scholar examining {phrase}, connecting institutional systems to the realities people experience in everyday life."
    elif category == "H":
        result = f"Emerging arts and museum leader focused on {phrase}, bringing an unusually specific young-adult perspective on culture, access, or public memory."
    else:
        raise ValueError(category)
    return clean_description(result)


def make_description_from_phrase(category, phrase):
    phrase = clean_space(phrase).strip(" ,;:.-")
    phrase = re.sub(r"^supports\s+", "", phrase, flags=re.I)
    if category == "F":
        phrase = re.sub(r"^in\s+", "", phrase, flags=re.I)
        phrase = re.sub(r"^(?:courses?|classes)\s+(?:in|on)\s+", "teaching ", phrase, flags=re.I)
    if category == "C":
        return clean_description(f"Community and cultural leader working on {phrase}, with practical insight into how institutions can build participation and belonging.")
    if category == "E":
        return clean_description(f"Artist and humanities practitioner exploring {phrase}, offering a fresh way to see how culture shapes human experience.")
    if category == "F":
        return clean_description(f"Educator focused on {phrase}, with a potential talk about how learning environments change who gets to participate and succeed.")
    if category == "G":
        return clean_description(f"Public-interest scholar examining {phrase}, connecting institutional systems to the realities people experience in everyday life.")
    raise ValueError(category)


def clean_description(value):
    value = clean_space(value)
    value = value.replace("..", ".")
    value = re.sub(r"\s+,", ",", value)
    value = re.sub(r",\s*,+", ",", value)
    value = value.strip(" .") + "."
    return value


def natsci_description(record):
    research = record["research"].replace(";", ",").strip(" .")
    organizations = " ".join(record.get("organizations", [])).lower()
    if "mathemat" in organizations or "statistics" in organizations:
        role, ending = "Mathematician", "showing how abstract models reveal structure in complex systems"
    elif "earth" in organizations or "environment" in organizations or "ecology" in organizations:
        role, ending = "Environmental scientist", "connecting local observations to the way ecosystems respond to change"
    elif "plant" in organizations:
        role, ending = "Plant scientist", "with a potential talk about resilience, adaptation, and food or ecological systems"
    elif "physics" in organizations or "quantum" in organizations:
        role, ending = "Physicist", "with a potential talk that makes a hidden physical process understandable to a general audience"
    elif "neuroscience" in organizations or "physiology" in organizations:
        role, ending = "Life-science researcher", "linking cellular mechanisms to questions about health and human function"
    else:
        role, ending = "Biomedical scientist", "with a potential talk about how basic mechanisms become useful health insight"
    return clean_description(f"{role} studying {research}, {ending}.")


def oakland_engineering_description(record):
    topics = [clean_space(x) for x in record["topic"].split(";") if clean_space(x)]
    topic_text = ", ".join(topics[:4]).replace(".", ",")
    return clean_description(
        f"Engineer whose work spans {topic_text}, showing how technical choices become practical choices for people and communities."
    )


def oakland_academic_description(record, kind):
    text = record["topic"]
    if kind == "psychology":
        match = re.search(r"Phone:?\s*\(?\d{3}\)?.{0,25}?\d{4}\s*(.+)$", text, re.I)
        phrase = (match.group(1) if match else text).strip(" ,;")
        phrase = phrase.replace(";", " and ").replace(".", ",")
        return clean_description(
            f"Psychologist studying {phrase}, with a potential talk connecting behavioral research to choices people make in ordinary life."
        )
    focus = labeled_section(
        text,
        ["Research Interests", "Research", "Current Research"],
        ["Selected Publications", "Publications", "Research Support", "Courses", "Education", "Current Courses"],
    )
    if not phrase_is_usable(focus):
        focus = focus_phrase(text, record["name"], ["research", "evolution", "health", "environment", "biology", "disease", "cell", "genetic"])
    focus = re.sub(r"^(?:include|includes)\s+", "", focus, flags=re.I)
    focus = re.sub(r"^Support:\s*", "", focus, flags=re.I)
    return clean_description(
        f"Michigan researcher studying {focus}, with a potential talk that makes a consequential scientific problem accessible to a general audience."
    )


def oakland_public_description(record):
    focus = labeled_section(
        record["topic"],
        ["Research Interests", "Current Research", "Areas of Interest"],
        ["Selected Publications", "Publications", "Teaching Interests", "Courses", "Education", "Current Courses", "CV"],
    )
    if not phrase_is_usable(focus):
        focus = focus_phrase(
            record["topic"],
            record["name"],
            ["justice", "race", "immigration", "refugee", "inequality", "crime", "community", "health", "gender", "urban"],
        )
    return clean_description(
        f"Public-interest scholar examining {focus}, connecting institutional systems to the realities people experience in everyday life."
    )


STUDENT_DESCRIPTIONS = {
    "Morgan Braswell": "Emerging cultural leader focused on archiving Black stories and strengthening the management of arts nonprofits so cultural narratives are preserved and shared.",
    "Steven Brooks": "Young researcher connecting feminist historiography, the history of psychology, and sonic rhetoric to questions of gender, agency, and identity in counseling texts.",
    "Gene Garcia": "Arts-management student using Chicano history, labor history, border studies, and Ballet Folklórico to explore how performance carries community identity.",
    "Safiah Hakami": "Artist and program manager exploring how arts education and cultural exchange can present national heritage without flattening its traditions or social context.",
    "August Julijška Davis Dykstra": "Multilingual museum-studies student linking language learning with the cataloging, preservation, and interpretation of art and historical collections.",
    "Katie Huard": "Rochester-area archaeology and museum-studies student connecting historic preservation, artifact care, and field research across the Levant and Indigenous Americas.",
    "Nevaeh Ramon": "Indigenous artist and museum-studies student working to improve repatriation, reconciliation, and the representation of Indigenous voices inside museums.",
    "Andrei Reynoso": "Young arts administrator researching socioeconomic barriers to classical music and how performance institutions can build more inclusive stages.",
    "Abbygale Taylor": "Rochester-raised museum-studies student focused on collections care, archives, and preserving historical artifacts for public understanding.",
    "Bethany Thies": "Journalist and creative writer exploring how digital humanities and more inclusive cultural institutions can expand lifelong access to the arts.",
}


COMMUNITY_DESCRIPTIONS = {
    "Mary Worrall": "Museum curator using textiles, women’s history, craftivism, exhibitions, and community co-curation to make social-justice questions tangible.",
    "Barb Whitney": "Arts administrator and educator advancing the idea that the arts are a public good and arts education is a fundamental right.",
    "Heather-Marie Montilla": "Community-arts leader with practical experience in nonprofit strategy, fundraising, and building cultural programs that strengthen local participation.",
    "Marsha MacDowell": "Folklife curator connecting quilts, traditional arts, stained glass, and digital archives to the ways communities preserve living heritage.",
    "Samantha Ellens": "Archaeology collections manager applying community-based preservation to museum programming, teaching, and the stewardship of cultural resources.",
    "Michelle Word": "Museum educator designing encounters that connect people to art, ideas, one another, and the curiosity that makes collective learning possible.",
    "Dionne O’Dell": "Theatre educator with experience helping public-school teachers use performance as a practical tool for classroom learning and student voice.",
    "Katie Mielens": "Teaching artist and museum educator who has worked across schools, museums, and arts nonprofits to make cultural learning more accessible.",
    "Maeve Bassett": "Applied ethnobotanist exploring how art, food, history, gender, and even espionage reveal the changing relationships between people and plants.",
    "Katherine Hagman": "Artist, educator, and cultural-events producer working where scientific inquiry and creative practice meet in public programs.",
    "Kelly Hansen": "Museum exhibit designer translating research and public-engagement goals into visual experiences that help audiences navigate complex ideas.",
    "C. Kurt Dewhurst": "Folklife and cultural-heritage curator building partnerships that connect material culture, museums, and community knowledge.",
    "Denice Blair": "Museum education leader who develops and evaluates programs intended to turn collections into participatory learning experiences.",
    "Max Evjen": "Museum-learning and digital-humanities specialist drawing on more than fifteen years in arts management and informal science education.",
    "Shannon Schmoll": "Planetarium director expanding astronomy engagement and exploring how immersive public spaces can make science feel personally reachable.",
    "Rachel Vargas": "Museum registrar whose work in documentation, care, packing, and transport reveals the hidden systems that make cultural stewardship possible.",
    "William Matt": "Historic-site leader using Meadow Brook Estate to explore how architecture, collections, and place-based stories shape public memory.",
    "Kirk A. Domer": "Theatre designer and arts-management educator connecting scene design, production leadership, and career preparation for creative workers.",
    "Eugene Dillenburg": "Writer and exhibit designer drawing on museum work across natural history, science, and international consulting to explain how exhibitions turn expertise into public stories.",
    "Brian Kirschensteiner": "Museum preparator whose behind-the-scenes work reveals how fabrication, installation, and object care shape what audiences can learn from an exhibition.",
    "Nicole Broughton-Adams": "Integrative-arts educator connecting humanities teaching, cultural programming, and community-facing learning across disciplinary boundaries.",
    "Jennifer Junkermeier-Khan": "Detroit-based curator, writer, and arts administrator working across exhibitions and cultural organizations to make creative institutions more connected to their communities.",
}


CURATED_CAL_DESCRIPTIONS = {
    "Tina M. Newhauser": ("E", "Veteran stage and production manager with Broadway, regional, and touring experience who can unpack the invisible coordination behind live performance."),
    "Divya Victor": ("E", "Tamil-American poet and essayist working across books, performance, installation, editing, and archives, with a perspective on how literary ideas change across forms."),
    "Peter Glendinning": ("E", "Photographer and educator whose online Photography Basics & Beyond courses have reached learners in more than 100 countries, offering insight into scaling visual literacy."),
    "Karen Kangas-Preston": ("E", "Costume designer and theatre educator with a practice spanning stage productions and design training, offering insight into how clothing turns character and context into visual storytelling."),
    "Pete Johnston": ("E", "Filmmaker and production educator working across cinematography, editing, and fiction filmmaking, with a potential talk on how camera and cutting choices quietly shape a story."),
    "Emily Potts": ("E", "Interdisciplinary sculptor giving material form to invisible and chronic conditions to explore how the brain, mind, and body experience function and disruption."),
    "Safoi Babana-Hampton": ("E", "Documentary filmmaker and scholar exploring the ethics, politics, and aesthetics of historical memory, intergenerational trauma, and healing across the Francophone Black diaspora."),
    "Peter De Costa": ("F", "Applied-linguistics educator studying how identity, ideology, and emotion shape language learning, language policy, and classroom experience."),
    "Hala Sun": ("F", "Language educator connecting qualitative research, sociolinguistics, classroom discourse analysis, and educational assessment to more responsive teaching."),
    "Shannon Quinn": ("F", "Russian-language educator researching instructional technology, blended learning, curricular design, and how digital tools can build advanced listening skills."),
    "John McElroy": ("F", "Former middle- and high-school teacher researching writing pedagogy and disciplinary literacy across English education and adolescent learning."),
    "Regiane Lima de Paula": ("F", "Portuguese and English-language educator drawing on work in Brazil and Michigan to treat language learning as a tool for changing students’ realities."),
    "Bree Straayer": ("F", "Writing educator studying how culture, gender, religious ideology, and language-learning contexts shape students’ educational trajectories."),
    "Carol Wilson-Duffy": ("F", "English-language educator who has designed programs for learners and teachers across several continents and delivered educational-technology training to remote communities."),
    "Laura Jones-Pettit": ("F", "First-year writing educator examining how general-education courses can function both as gateways to higher learning and as sites of equity and opportunity."),
    "Bump Halbritter": ("F", "Rhetoric educator integrating audio, video, and audiovisual composing into college writing and scholarly research."),
    "Daniel Reed": ("F", "Language-testing specialist developing and evaluating assessments that determine proficiency, placement, and spoken-English readiness for international students."),
    "Leah Addis": ("F", "English-language educator focused on content-based writing and discourse-based grammar as practical tools for clearer communication."),
}


def score_text(text, keywords):
    lower = text.lower()
    score = min(len(text), 2500) / 300
    score += 5 * sum(1 for word in keywords if word in lower)
    score += 4 if ACTION_WORDS.search(text) else 0
    score -= 8 if re.search(r"emeritus|retired|ret\.\s", lower) else 0
    score -= 6 if len(text) < 100 else 0
    return score


class Selector:
    def __init__(self):
        self.rows = []
        self.names = set()
        self.emails = set()

    def can_add(self, name, email, url, description):
        name = normalize_name(name)
        email = email.strip().lower()
        return (
            valid_name(name)
            and valid_email(email)
            and bool(url and re.match(r"https://", url))
            and bool(description and description.endswith("."))
            and key_text(name) not in self.names
            and email not in self.emails
        )

    def add(self, category, name, description, email, url, source, score=0):
        name = normalize_name(name)
        email = email.strip().lower()
        if not self.can_add(name, email, url, description):
            return False
        self.rows.append(
            {
                "Category": CATEGORIES[category],
                "Full Name": name,
                "One-Sentence Description": description,
                "Email": email,
                "Source URL": url,
                "_category_code": category,
                "_source": source,
                "_score": round(score, 2),
            }
        )
        self.names.add(key_text(name))
        self.emails.add(email)
        return True

    def count(self, category):
        return sum(row["_category_code"] == category for row in self.rows)


def main():
    natsci = load("msu_natsci")
    cal = load("msu_cal")
    wayne = load("wayne_med_themes")
    acm = load("msu_acm_people")
    oakland = load("oakland_local")
    selector = Selector()

    # H: selective current students whose public bios contain a defined idea or field of inquiry.
    student_names = set(STUDENT_DESCRIPTIONS)
    for record in acm:
        if record["name"] in student_names:
            description = STUDENT_DESCRIPTIONS[record["name"]]
            selector.add("H", record["name"], description, record["email"], record["source_url"], record["source"], 100)

    # C: museum, arts-management, and community-engagement leaders, starting with explicit cultural leadership roles.
    for record in acm:
        curated_name = normalize_name(record["name"])
        if curated_name in COMMUNITY_DESCRIPTIONS:
            selector.add("C", curated_name, COMMUNITY_DESCRIPTIONS[curated_name], record["email"], record["source_url"], record["source"], 100)
    if selector.count("C") != len(COMMUNITY_DESCRIPTIONS):
        raise RuntimeError(f"Expected {len(COMMUNITY_DESCRIPTIONS)} curated ACM leaders, got {selector.count('C')}")

    # D: applied Oakland engineering researchers, selected for specific multi-topic programs.
    engineering = [r for r in oakland if r.get("pool") == "engineering"]
    engineering.sort(key=lambda r: (len(r["topic"].split(";")), len(r["topic"])), reverse=True)
    for record in engineering:
        if selector.count("D") >= QUOTAS["D"]:
            break
        selector.add("D", record["name"], oakland_engineering_description(record), record["email"], record["source_url"], record["source"], len(record["topic"]))

    # B: Wayne medical profiles with substantive disease, care, or public-health material.
    wayne_candidates = []
    for record in wayne:
        research = clean_space(record.get("research") or "")
        bio = clean_space(record.get("bio") or "")
        combined = clean_space(research + " " + bio)
        if not (record.get("name") and record.get("email") and len(combined) >= 90):
            continue
        if re.search(r"Research Support.*(?:grant|NIH)", research, re.I) and len(research) < 220:
            continue
        if record["name"].startswith("Suganthini Krishnan") or record["name"] in {"Elisa Torres, PhD, RN", "Lisa Blair, PhD, RN"}:
            continue
        if len(research) >= 70 and not re.search(r"^(?:Research Support|Grants?)\b", research, re.I):
            basis = research
        elif re.search(r"research (?:focus|interest|program)|work is focused|lab (?:focus|investigat|stud)|clinical interests", bio, re.I):
            basis = bio
        else:
            continue
        medical_focus = focus_phrase(basis, normalize_name(record["name"]), ["health", "disease", "clinical", "patient", "care", "therapy", "prevention", "cancer", "brain", "community"])
        if not phrase_is_usable(medical_focus):
            continue
        score = score_text(combined, ["health", "disease", "clinical", "patient", "care", "therapy", "prevention", "cancer", "brain", "community"])
        wayne_candidates.append((score, record, basis))
    for score, record, basis in sorted(wayne_candidates, reverse=True, key=lambda x: x[0]):
        if selector.count("B") >= QUOTAS["B"]:
            break
        selector.add("B", record["name"], make_description("B", record["name"], basis), record["email"], record["source_url"], record["source"], score)

    # G: Oakland public-interest fields first, excluding retired and generic-contact records.
    public_interest = []
    for record in oakland:
        if record.get("pool") != "public_interest" or re.search(r"emeritus|retired|ret\.\s", record["topic"], re.I):
            continue
        score = score_text(record["topic"], ["justice", "race", "immigration", "refugee", "inequality", "crime", "community", "health", "gender", "urban"])
        public_interest.append((score, record))
    for score, record in sorted(public_interest, reverse=True, key=lambda x: x[0]):
        if selector.count("G") >= 25:
            break
        description = oakland_public_description(record)
        extracted = description.split("examining ", 1)[-1].split(", connecting", 1)[0]
        if not phrase_is_usable(extracted):
            continue
        selector.add("G", record["name"], description, record["email"], record["source_url"], record["source"], score)

    # A: local Oakland scientists and psychologists, then MSU researchers with explicit research interests.
    biology = []
    for record in oakland:
        if record.get("pool") != "biology" or record.get("name") == "Lan Jiang" or re.search(r"emeritus|retired", record["topic"], re.I):
            continue
        score = score_text(record["topic"], ["research", "biology", "cell", "disease", "environment", "evolution", "health", "genetic"])
        biology.append((score, record))
    for score, record in sorted(biology, reverse=True, key=lambda x: x[0]):
        if sum(1 for r in selector.rows if r["_category_code"] == "A" and "Oakland University Department of Biological" in r["_source"]) >= 17:
            break
        description = oakland_academic_description(record, "biology")
        extracted = description.split("studying ", 1)[-1].split(", with a potential", 1)[0]
        if not phrase_is_usable(extracted):
            continue
        selector.add("A", record["name"], description, record["email"], record["source_url"], record["source"], score)

    psychology = [r for r in oakland if r.get("pool") == "psychology"]
    psychology.sort(key=lambda r: len(r["topic"]), reverse=True)
    for record in psychology:
        if sum(1 for r in selector.rows if r["_category_code"] == "A" and "Psychology" in r["_source"]) >= 18:
            break
        selector.add("A", record["name"], oakland_academic_description(record, "psychology"), record["email"], record["source_url"], record["source"], len(record["topic"]))

    nat_candidates = []
    for record in natsci:
        titles = " ".join(record.get("titles", []))
        if not (record["name"] and record["email"] and record["research"]):
            continue
        if re.search(r"Graduate Student|Emeritus|Postdoctoral", titles, re.I):
            continue
        if not re.search(r"Professor|Faculty|Director|Specialist", titles, re.I):
            continue
        score = score_text(record["research"], ["health", "environment", "energy", "climate", "disease", "brain", "evolution", "education", "data", "quantum"])
        score += 4 if re.search(r"University Distinguished|Foundation Professor|Chair", titles, re.I) else 0
        nat_candidates.append((score, record))
    for score, record in sorted(nat_candidates, reverse=True, key=lambda x: x[0]):
        if selector.count("A") >= QUOTAS["A"]:
            break
        selector.add("A", record["name"], natsci_description(record), record["email"], record["source_url"], record["source"], score)

    # Hand-curated CAL profiles whose bios support a strong idea but do not use consistent research-label wording.
    for record in cal:
        if record["name"] in CURATED_CAL_DESCRIPTIONS:
            category, description = CURATED_CAL_DESCRIPTIONS[record["name"]]
            selector.add(category, record["name"], description, record["email"], record["source_url"], record["source"], 100)

    # CAL profiles fill C, E, F, and G without reusing people.
    cal_rules = {
        "C": ["community", "museum", "public engagement", "outreach", "nonprofit", "curator", "cultural", "social justice", "arts administration"],
        "E": ["artist", "poet", "writer", "creative", "film", "theatre", "performance", "design", "photograph", "literature", "music"],
        "F": ["teaching", "learning", "education", "pedagogy", "curriculum", "student", "literacy", "language acquisition", "writing center"],
        "G": ["justice", "race", "immigration", "refugee", "ethics", "history", "inequality", "gender", "colonial", "indigenous", "public"],
    }
    phrase_required = {
        "C": ["community", "museum", "public", "outreach", "nonprofit", "cultural", "engagement", "access", "social justice", "participatory"],
        "E": ["art", "poet", "writing", "film", "theatre", "theater", "performance", "design", "photograph", "literature", "music", "creative", "sculpt", "ceramic", "cinema"],
        "F": ["teach", "learning", "education", "pedagog", "curriculum", "student", "literacy", "language", "school", "instruction", "accessibility"],
        "G": ["justice", "race", "immigration", "refugee", "ethic", "history", "inequality", "gender", "colonial", "indigenous", "public", "community", "civic", "disability"],
    }
    category_order = ["C", "G", "E", "F"]
    for category in category_order:
        candidates = []
        for record in cal:
            bio = clean_space(record.get("bio", ""))
            text = clean_space(" ".join([record.get("title", ""), record.get("unit", ""), bio, record.get("works", "")]))
            if not (record.get("name") and record.get("email") and len(record.get("bio", "")) >= 80):
                continue
            if re.search(r"finance|human resources|office assistant|accountant|communications manager|development officer", record.get("title", ""), re.I):
                continue
            keywords = cal_rules[category]
            hits = sum(1 for word in keywords if word in text.lower())
            if category in {"C", "G", "E"} and hits == 0:
                continue
            score = score_text(text, keywords) + 4 * hits
            if category == "E" and record.get("unit") in {"Art, Art History, and Design", "Art, Art History and Design", "Theatre", "English", "Film Studies", "Writing, Rhetoric, and Cultures"}:
                score += 8
            if category == "F" and re.search(r"Teaching|Education|Pedagog|Curriculum|Learning|Instructor", text, re.I):
                score += 8
            phrase = focus_phrase(bio, record["name"], keywords, strict=True)
            if not phrase_is_usable(phrase):
                continue
            if re.search(r"\b(?:degree|published|featured|collected|award|holds an?|serves as|director of|professor|worked at|program at|joined|credits include|has taught|guest lecturer|educational background)\b", phrase, re.I):
                continue
            if not any(term in phrase.lower() for term in phrase_required[category]):
                continue
            bad_start = r"^(?:at|for|have been|has been|chairperson\b|received\b|regularly\b|currently\b)"
            if category != "F":
                bad_start = r"^(?:at|in|for|courses?\b|have been|has been|chairperson\b|received\b|regularly\b|currently\b)"
            if re.search(bad_start, phrase, re.I):
                continue
            description = make_description_from_phrase(category, phrase)
            candidates.append((score, record, description))
        for score, record, description in sorted(candidates, reverse=True, key=lambda x: x[0]):
            if selector.count(category) >= QUOTAS[category]:
                break
            selector.add(category, record["name"], description, record["email"], record["source_url"], record["source"], score)

    counts = Counter(row["_category_code"] for row in selector.rows)
    if counts != Counter(QUOTAS):
        raise RuntimeError(f"Quota failure: expected {QUOTAS}, got {dict(counts)}")
    if len(selector.rows) != 500:
        raise RuntimeError(f"Expected 500 rows, got {len(selector.rows)}")

    public_rows = [{k: v for k, v in row.items() if not k.startswith("_")} for row in selector.rows]
    (BASE / "candidates_500.json").write_text(json.dumps(public_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    audit_rows = selector.rows
    (BASE / "candidates_500_audit.json").write_text(json.dumps(audit_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"rows": len(public_rows), "categories": {CATEGORIES[k]: counts[k] for k in QUOTAS}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
