#!/usr/bin/env python3
"""GEO build for The House Always Wins.

From data/claims.json it (re)generates:
  - index.html          ClaimReview JSON-LD (one per fact-check) — highly citable
  - robots.txt          welcomes AI + search crawlers, points to sitemap
  - sitemap.xml
  - llms.txt            plain-Markdown brief of every fact-check + source

Idempotent. Usage: python3 tools/gen_geo.py
"""
import json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://ohio-gameshow.netlify.app"
SITE = "The House Always Wins"
AUTHOR = "Ohioans United for Public Education"
TODAY = datetime.date.today().isoformat()


def load():
    with open(os.path.join(ROOT, "data", "claims.json"), encoding="utf-8") as fh:
        return json.load(fh)


def replace_region(path, start, end, payload):
    p = os.path.join(ROOT, path)
    s = open(p, encoding="utf-8").read()
    a, b = "<!-- %s -->" % start, "<!-- %s -->" % end
    pre = s[: s.index(a) + len(a)]
    post = s[s.index(b):]
    open(p, "w", encoding="utf-8").write(pre + payload + post)


def build():
    claims = load()

    # ClaimReview per fact-check (Fact -> rating 5, Fiction -> 1)
    reviews = []
    for c in claims:
        is_true = str(c.get("answer")).lower() == "true"
        reviews.append({
            "@context": "https://schema.org",
            "@type": "ClaimReview",
            "url": "%s/#%s" % (DOMAIN, c["id"]),
            "claimReviewed": c["claim"],
            "reviewBody": c.get("explanation", ""),
            "itemReviewed": {
                "@type": "Claim",
                "appearance": {"@type": "CreativeWork",
                               "url": c.get("sourceUrl", ""),
                               "publisher": {"@type": "Organization",
                                             "name": c.get("sourcePublisher", "")}},
            },
            "author": {"@type": "Organization", "name": AUTHOR, "url": DOMAIN},
            "reviewRating": {"@type": "Rating", "ratingValue": 5 if is_true else 1,
                             "bestRating": 5, "worstRating": 1,
                             "alternateName": c.get("verdict", "")},
        })
    blocks = "\n".join('<script type="application/ld+json">\n%s\n</script>'
                       % json.dumps(r, ensure_ascii=False, indent=2) for r in reviews)
    replace_region("index.html", "JSONLD:START", "JSONLD:END", blocks)

    # robots.txt
    bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai",
            "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended",
            "Bytespider", "CCBot", "Amazonbot", "cohere-ai", "Meta-ExternalAgent", "Diffbot"]
    r = ["# The House Always Wins — crawlers welcome, including AI/LLM agents."]
    for b in bots:
        r.append("User-agent: %s\nAllow: /\n" % b)
    r.append("User-agent: *\nAllow: /\n")
    r.append("Sitemap: %s/sitemap.xml" % DOMAIN)
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write("\n".join(r) + "\n")

    # sitemap.xml
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          "  <url><loc>%s/</loc><lastmod>%s</lastmod></url>" % (DOMAIN, TODAY),
          "</urlset>"]
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm) + "\n")

    # llms.txt
    L = ["# %s" % SITE, "",
         "> A rigged fact-check game about Ohio's public-school funding. Every claim below is "
         "labeled Fact or Fiction and linked to its source. Published by %s." % AUTHOR, "",
         "Site: %s" % DOMAIN, ""]
    cats = {}
    for c in claims:
        cats.setdefault(c.get("category", "Other"), []).append(c)
    for cat, items in cats.items():
        L.append("## %s" % cat)
        for c in items:
            L.append("- **%s** — Verdict: %s. %s (Source: %s — %s)" % (
                c["claim"], c.get("verdict", ""), c.get("explanation", ""),
                c.get("sourcePublisher", ""), c.get("sourceUrl", "")))
        L.append("")
    open(os.path.join(ROOT, "llms.txt"), "w", encoding="utf-8").write("\n".join(L) + "\n")

    print("gen_geo: %d ClaimReview blocks + robots.txt, sitemap.xml, llms.txt" % len(reviews))


if __name__ == "__main__":
    build()
